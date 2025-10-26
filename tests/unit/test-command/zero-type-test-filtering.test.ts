import { describe, it, expect } from "vitest";
import type { TestFile, TestSummary } from "~/types";
import type { Expect, AssertEqual } from "inferred-types/types";

describe("Phase 4: Hide Zero-Type-Test Files", () => {
    describe("filterZeroTypeTestFiles()", () => {
        it("should return all files when verbose is true", () => {
            const files: TestFile[] = [
                createMockTestFile("file1.test.ts", 5, 3),
                createMockTestFile("file2.test.ts", 5, 0),
                createMockTestFile("file3.test.ts", 2, 2)
            ];

            const result = filterZeroTypeTestFiles(files, { verbose: true });

            expect(result).toHaveLength(3);
            expect(result).toEqual(files);

            type cases = [
                Expect<AssertEqual<typeof result, TestFile[]>>
            ];
        });

        it("should filter out files with zero type tests when verbose is false", () => {
            const files: TestFile[] = [
                createMockTestFile("file1.test.ts", 5, 3),
                createMockTestFile("file2.test.ts", 5, 0),
                createMockTestFile("file3.test.ts", 2, 2),
                createMockTestFile("file4.test.ts", 10, 0)
            ];

            const result = filterZeroTypeTestFiles(files, { verbose: false });

            expect(result).toHaveLength(2);
            expect(result.map(f => f.filepath)).toEqual([
                "file1.test.ts",
                "file3.test.ts"
            ]);

            type cases = [
                Expect<AssertEqual<typeof result, TestFile[]>>
            ];
        });

        it("should handle all files having zero type tests", () => {
            const files: TestFile[] = [
                createMockTestFile("file1.test.ts", 5, 0),
                createMockTestFile("file2.test.ts", 3, 0)
            ];

            const result = filterZeroTypeTestFiles(files, { verbose: false });

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });

        it("should handle all files having type tests", () => {
            const files: TestFile[] = [
                createMockTestFile("file1.test.ts", 5, 3),
                createMockTestFile("file2.test.ts", 2, 2)
            ];

            const result = filterZeroTypeTestFiles(files, { verbose: false });

            expect(result).toHaveLength(2);
            expect(result).toEqual(files);
        });

        it("should handle empty file list", () => {
            const files: TestFile[] = [];

            const result = filterZeroTypeTestFiles(files, { verbose: false });

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });
    });

    describe("calculateSummaryWithFiltering()", () => {
        it("should include hidden file count in summary when files are hidden", () => {
            const allFiles: TestFile[] = [
                createMockTestFile("file1.test.ts", 5, 3),
                createMockTestFile("file2.test.ts", 5, 0),
                createMockTestFile("file3.test.ts", 2, 2),
                createMockTestFile("file4.test.ts", 10, 0)
            ];

            const visibleFiles = filterZeroTypeTestFiles(allFiles, { verbose: false });
            const summary = createSummary(allFiles, visibleFiles);

            expect(summary.testFiles).toBe(2); // Only visible files
            expect(summary.hiddenFiles).toBe(2); // Hidden zero-type-test files

            type cases = [
                Expect<AssertEqual<typeof summary.testFiles, number>>,
                Expect<AssertEqual<typeof summary.hiddenFiles, number>>
            ];
        });

        it("should have hiddenFiles = 0 when verbose is true", () => {
            const allFiles: TestFile[] = [
                createMockTestFile("file1.test.ts", 5, 3),
                createMockTestFile("file2.test.ts", 5, 0)
            ];

            const visibleFiles = filterZeroTypeTestFiles(allFiles, { verbose: true });
            const summary = createSummary(allFiles, visibleFiles);

            expect(summary.testFiles).toBe(2);
            expect(summary.hiddenFiles).toBe(0);
        });

        it("should correctly aggregate test counts from visible files only", () => {
            const allFiles: TestFile[] = [
                createMockTestFile("file1.test.ts", 5, 3, 0, 15),
                createMockTestFile("file2.test.ts", 5, 0, 0, 0), // Hidden
                createMockTestFile("file3.test.ts", 2, 2, 0, 8)
            ];

            const visibleFiles = filterZeroTypeTestFiles(allFiles, { verbose: false });
            const summary = createSummary(allFiles, visibleFiles);

            // Should only count from visible files (file1 + file3)
            expect(summary.tests).toBe(7); // 5 + 2
            expect(summary.typeTests).toBe(5); // 3 + 2
            expect(summary.assertions).toBe(23); // 15 + 8
            expect(summary.hiddenFiles).toBe(1); // file2
        });
    });

    describe("Summary Message", () => {
        it("should include hint about hidden files when files are hidden", () => {
            const message = getSummaryMessage({
                testFiles: 5,
                hiddenFiles: 3,
                typeTests: 25,
                tests: 50
            });

            expect(message).toContain("5 type-tested files");
            expect(message).toContain("3 runtime-only files hidden");
            expect(message).toContain("use --verbose");
        });

        it("should not mention hidden files when all files are visible", () => {
            const message = getSummaryMessage({
                testFiles: 5,
                hiddenFiles: 0,
                typeTests: 25,
                tests: 50
            });

            expect(message).not.toContain("hidden");
            expect(message).not.toContain("--verbose");
        });

        it("should handle edge case of all files hidden", () => {
            const message = getSummaryMessage({
                testFiles: 0,
                hiddenFiles: 5,
                typeTests: 0,
                tests: 0
            });

            expect(message).toContain("All 5 files are runtime-only");
            expect(message).toContain("use --verbose");
        });
    });
});

// Helper functions (to be implemented)
function filterZeroTypeTestFiles(files: TestFile[], opt: { verbose: boolean }): TestFile[] {
    // Implementation placeholder - will be implemented in the actual code
    if (opt.verbose) {
        return files;
    }
    return files.filter(f => f.typeTests > 0);
}

interface SummaryWithHiddenFiles extends TestSummary {
    hiddenFiles: number;
}

function createSummary(allFiles: TestFile[], visibleFiles: TestFile[]): SummaryWithHiddenFiles {
    // Mock implementation for testing
    const hiddenCount = allFiles.length - visibleFiles.length;

    return {
        filesWithErrors: 0,
        testsWithErrors: 0,
        filesWithWarnings: 0,
        tests: visibleFiles.reduce((sum, f) => sum + (f.blocks.flatMap(b => b.tests).length || 0), 0),
        testFiles: visibleFiles.length,
        skipped: 0,
        withDiagnostics: [],
        slow: [],
        typeTests: visibleFiles.reduce((sum, f) => sum + f.typeTests, 0),
        assertions: visibleFiles.reduce((sum, f) => sum + f.assertions, 0),
        hiddenFiles: hiddenCount
    };
}

function getSummaryMessage(summary: { testFiles: number; hiddenFiles: number; typeTests: number; tests: number }): string {
    // Mock implementation for testing
    if (summary.hiddenFiles === 0) {
        return `${summary.testFiles} files with ${summary.typeTests} type tests`;
    }
    if (summary.testFiles === 0 && summary.hiddenFiles > 0) {
        return `All ${summary.hiddenFiles} files are runtime-only (use --verbose to show)`;
    }
    return `${summary.testFiles} type-tested files, ${summary.hiddenFiles} runtime-only files hidden (use --verbose to show)`;
}

function createMockTestFile(
    filepath: string,
    testCount: number,
    typeTestCount: number,
    errors: number = 0,
    assertions: number = 0
): TestFile {
    return {
        filepath,
        testLines: 10,
        typeTests: typeTestCount,
        assertions,
        blocks: [{
            filepath,
            skip: false,
            description: "test block",
            tests: Array.from({ length: testCount }, (_, i) => ({
                description: `test ${i}`,
                skip: false,
                startLine: i * 2,
                endLine: i * 2 + 1,
                diagnostics: []
            })),
            startLine: 0,
            endLine: 10,
            diagnostics: []
        }],
        skip: false,
        skippedTests: 0,
        importSymbols: [],
        duration: 100
    };
}
