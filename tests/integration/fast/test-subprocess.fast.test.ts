import { describe, it, expect } from "vitest";
import type { Expect, AssertEqual, AssertExtends } from "inferred-types/types";
import { runTestCommand } from "../../helpers/subprocess-test-harness";
import type { TestCommandResult, PerformanceMetrics } from "../../helpers/subprocess-test-harness";

describe("runTestCommand() - Subprocess Integration", () => {
    describe("Basic test execution", () => {
        it("should execute test command and capture output", async () => {
            const result = await runTestCommand({
                filter: ["helpers/subprocess-executor"],
                quiet: false,
            });

            // Runtime assertions - result structure
            expect(result).toHaveProperty("output");
            expect(result).toHaveProperty("exitCode");
            expect(result).toHaveProperty("executionTime");

            // Exit code should be 0 for passing tests
            expect(result.exitCode).toBe(0);

            // Output should contain test results
            expect(result.output).toContain("subprocess-executor.test.ts");

            // Execution time should be tracked
            expect(result.executionTime).toBeGreaterThan(0);

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result, TestCommandResult>>,
                Expect<AssertEqual<typeof result.exitCode, number>>,
                Expect<AssertEqual<typeof result.output, string>>,
                Expect<AssertEqual<typeof result.executionTime, number>>,
            ];
        }, 15000);

        it("should handle tests with type assertions", async () => {
            const result = await runTestCommand({
                filter: ["utils/fileLink"],
                quiet: false,
            });

            // Runtime assertions
            expect(result).toHaveProperty("exitCode");
            expect(result.output.length).toBeGreaterThan(0);
            expect(result.output).toContain("fileLink");

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result, TestCommandResult>>,
            ];
        }, 15000);
    });

    describe("Error detection", () => {
        it("should capture test summary in output", async () => {
            const result = await runTestCommand({
                filter: ["imports/import-extraction"],
                quiet: false,
            });

            // Runtime assertions - verify summary is present
            expect(result.output).toContain("TEST SUMMARY");
            // Output should contain the execution time message
            expect(result.output.length).toBeGreaterThan(0);

            // Type assertions
            type cases = [
                Expect<AssertEqual<typeof result.output, string>>,
            ];
        }, 15000);

        it("should track execution time correctly", async () => {
            const result = await runTestCommand({
                filter: ["utils/urlLink"],
                quiet: false,
            });

            // Runtime assertions
            expect(result.executionTime).toBeGreaterThan(0);
            expect(result.executionTime).toBeLessThan(30000); // Should complete within 30s

            // Type assertions
            type cases = [
                Expect<AssertEqual<typeof result.executionTime, number>>,
            ];
        }, 15000);
    });

    describe("Filter handling", () => {
        it("should respect filter parameter", async () => {
            const result = await runTestCommand({
                filter: ["subprocess-executor.test.ts"],
                quiet: false,
            });

            // Runtime assertions
            expect(result.output).toContain("subprocess-executor.test.ts");
            expect(result.exitCode).toBe(0);

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result, TestCommandResult>>,
            ];
        }, 15000);

        it("should handle quiet mode", async () => {
            const result = await runTestCommand({
                filter: ["utils/prettyPath"],
                quiet: true,
            });

            // Runtime assertions
            expect(result).toHaveProperty("output");
            expect(result.exitCode).toBe(0);

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result, TestCommandResult>>,
            ];
        }, 15000);
    });

    describe("Performance metrics", () => {
        it("should provide performance metrics", async () => {
            const result = await runTestCommand({
                filter: ["utils/lookups"],
                quiet: false,
            });

            // Runtime assertions
            expect(result).toHaveProperty("metrics");
            expect(result.metrics).toHaveProperty("executionTime");
            expect(result.metrics?.executionTime).toBe(result.executionTime);

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result.metrics, PerformanceMetrics | undefined>>,
            ];
        }, 15000);
    });

    describe("Type exports", () => {
        it("should export TestCommandResult type", () => {
            type result = TestCommandResult;

            type cases = [
                Expect<AssertExtends<result, { output: string; exitCode: number; executionTime: number }>>,
            ];
        });

        it("should export PerformanceMetrics type", () => {
            type metrics = PerformanceMetrics;

            type cases = [
                Expect<AssertExtends<metrics, { executionTime: number }>>,
            ];
        });
    });
});
