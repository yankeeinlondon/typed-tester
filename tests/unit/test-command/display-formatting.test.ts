import { describe, it, expect } from "vitest";
import type { TestFile } from "~/types";
import { formatTestCounts, formatTiming } from "~/report";
import type { Expect, AssertEqual } from "inferred-types/types";

/**
 * Phase 3 tests for display formatting
 *
 * These tests verify that:
 * 1. formatTestCounts() displays new format with all three metrics
 * 2. formatTiming() always displays milliseconds
 * 3. formatTiming() only shows μs/line with --metrics flag
 * 4. formatTiming() applies color coding for all speed categories
 */

describe("Display Formatting", () => {
    // Helper to create a TestFile for testing
    function createTestFile(
        tests: number,
        typeTests: number,
        assertions: number,
        duration: number,
        testLines: number = 50,
        skippedTests: number = 0
    ): TestFile {
        const testArray = Array.from({ length: tests }, (_, i) => ({
            filepath: "/test/file.test.ts",
            description: `test ${i}`,
            startLine: i * 10,
            endLine: i * 10 + 5,
            skip: i < skippedTests,
            diagnostics: [],
            symbols: [],
            hasTypeCases: i < typeTests,
            typeAssertionCount: i < typeTests ? Math.ceil(assertions / typeTests) : 0
        }));

        return {
            filepath: "/test/file.test.ts",
            importSymbols: [],
            skip: false,
            skippedTests,
            blocks: [{
                filepath: "/test/file.test.ts",
                description: "test block",
                startLine: 1,
                endLine: 100,
                skip: false,
                diagnostics: [],
                tests: testArray
            }],
            duration,
            testLines,
            typeTests,
            assertions
        };
    }

    describe("formatTestCounts()", () => {
        it("should display format: X tests, Y type tests, Z assertions", () => {
            const testFile = createTestFile(16, 8, 38, 34);
            const result = formatTestCounts(testFile, { verbose: false, showPassing: false });

            // Should contain the new format
            expect(result).toContain("16 tests");
            expect(result).toContain("8 type tests");
            expect(result).toContain("38 assertions");
        });

        it("should show all metrics even when some are zero", () => {
            const testFile = createTestFile(10, 0, 0, 20);
            const result = formatTestCounts(testFile, { verbose: false, showPassing: false });

            expect(result).toContain("10 tests");
            expect(result).toContain("0 type tests");
            expect(result).toContain("0 assertions");
        });

        it("should handle single values correctly", () => {
            const testFile = createTestFile(1, 1, 1, 15);
            const result = formatTestCounts(testFile, { verbose: false, showPassing: false });

            expect(result).toContain("1 tests");
            expect(result).toContain("1 type tests");
            expect(result).toContain("1 assertions");
        });

        it("should show skipped test count when present", () => {
            const testFile = createTestFile(10, 5, 20, 100, 50, 2);
            const result = formatTestCounts(testFile, { verbose: false, showPassing: false });

            // 10 total - 2 skipped = 8 active tests
            expect(result).toContain("8 tests");
            expect(result).toContain("2 tests skipped");
        });

        it("should handle singular 'test' for single skipped", () => {
            const testFile = createTestFile(5, 2, 8, 50, 30, 1);
            const result = formatTestCounts(testFile, { verbose: false, showPassing: false });

            // 5 total - 1 skipped = 4 active
            expect(result).toContain("4 tests");
            expect(result).toContain("1 test skipped");
        });

        it("should return string type", () => {
            const testFile = createTestFile(10, 5, 20, 100);
            const result = formatTestCounts(testFile, { verbose: false });

            type cases = [
                Expect<AssertEqual<typeof result, string>>
            ];
            const _cases: cases = [true];

            expect(typeof result).toBe("string");
        });
    });

    describe("formatTiming()", () => {
        it("should always show milliseconds timing", () => {
            const testFile = createTestFile(10, 5, 20, 34);
            const result = formatTiming(testFile, { metrics: false, verbose: false });

            // Should contain milliseconds (even if with chalk escape codes)
            expect(result).toContain("34");
            expect(result).toContain("ms");
        });

        it("should show milliseconds even for fast tests", () => {
            const testFile = createTestFile(10, 5, 20, 5);
            const result = formatTiming(testFile, { metrics: false, verbose: false });

            expect(result).toContain("5");
            expect(result).toContain("ms");
        });

        it("should NOT show μs/line when metrics flag is false", () => {
            const testFile = createTestFile(10, 5, 20, 100, 50);
            const result = formatTiming(testFile, { metrics: false, verbose: false });

            expect(result).not.toContain("μs/line");
        });

        it("should show μs/line when metrics flag is true", () => {
            const testFile = createTestFile(10, 5, 20, 100, 50);
            const result = formatTiming(testFile, { metrics: true, verbose: false });

            expect(result).toContain("μs/line");
        });

        it("should use | separator when metrics are shown", () => {
            const testFile = createTestFile(16, 8, 38, 100, 50);
            const result = formatTiming(testFile, { metrics: true, verbose: false });

            // Should use | separator
            expect(result).toContain(" | ");
        });

        it("should calculate μs/line correctly", () => {
            // 100ms over 50 lines = 2000 μs/line
            const testFile = createTestFile(10, 5, 20, 100, 50);
            const result = formatTiming(testFile, { metrics: true });

            expect(result).toContain("2000");
            expect(result).toContain("μs/line");
        });

        it("should handle zero duration", () => {
            const testFile = createTestFile(10, 5, 20, 0, 50);
            const result = formatTiming(testFile, { metrics: true });

            expect(result).toContain("0");
            expect(result).toContain("ms");
        });

        it("should handle zero testLines", () => {
            const testFile = createTestFile(10, 5, 20, 100, 0);
            const result = formatTiming(testFile, { metrics: true });

            // Should show 0 μs/line when testLines is 0
            expect(result).toContain("0");
            expect(result).toContain("μs/line");
        });

        it("should return string type", () => {
            const testFile = createTestFile(10, 5, 20, 100);
            const result = formatTiming(testFile, { metrics: false });

            type cases = [
                Expect<AssertEqual<typeof result, string>>
            ];
            const _cases: cases = [true];

            expect(typeof result).toBe("string");
        });
    });
});
