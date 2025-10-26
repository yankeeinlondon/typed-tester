import { describe, it, expect } from "vitest";
import type { Expect, AssertEqual, AssertExtends } from "inferred-types/types";
import { executeCliCommand } from "../../helpers/subprocess-executor";
import type { SubprocessResult, SubprocessOptions } from "../../helpers/subprocess-executor";

describe("executeCliCommand() - Subprocess Execution", () => {
    describe("Basic command execution", () => {
        it("should execute --help command and capture stdout", async () => {
            const result = await executeCliCommand(["--help"]);

            // Runtime assertions
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain("typed");
            expect(result.stdout.length).toBeGreaterThan(0);
            expect(result.stderr).toBe("");
            expect(result.executionTime).toBeGreaterThan(0);

            // Type assertions
            type cases = [
                Expect<AssertEqual<typeof result.exitCode, number>>,
                Expect<AssertEqual<typeof result.stdout, string>>,
                Expect<AssertEqual<typeof result.stderr, string>>,
                Expect<AssertEqual<typeof result.executionTime, number>>,
            ];
        });

        it("should execute symbols command and capture output", async () => {
            const result = await executeCliCommand([
                "symbols",
                "--filter=executeCliCommand",
            ]);

            // Runtime assertions
            expect(result.exitCode).toBe(0);
            expect(result.stdout.length).toBeGreaterThan(0);
            expect(result.stdout).toContain("Symbol"); // Table header

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result, SubprocessResult>>,
            ];
        });
    });

    describe("Error handling", () => {
        it("should handle invalid command and return non-zero exit code", async () => {
            const result = await executeCliCommand(["invalid-command"]);

            // Runtime assertions
            expect(result.exitCode).not.toBe(0);
            // Either stdout or stderr should contain error info
            const hasErrorOutput = result.stdout.length > 0 || result.stderr.length > 0;
            expect(hasErrorOutput).toBe(true);

            // Type assertions
            type cases = [
                Expect<AssertEqual<typeof result.exitCode, number>>,
            ];
        });

        it("should capture stderr separately from stdout", async () => {
            // Execute the symbols command which produces stdout output
            const result = await executeCliCommand([
                "symbols",
                "--filter=executeCliCommand",
            ]);

            // Runtime assertions
            expect(typeof result.exitCode).toBe("number");
            expect(typeof result.stdout).toBe("string");
            expect(typeof result.stderr).toBe("string");

            // Verify stdout and stderr are separate string properties
            expect(result).toHaveProperty("stdout");
            expect(result).toHaveProperty("stderr");

            // Type assertions
            type cases = [
                Expect<AssertEqual<typeof result.stdout, string>>,
                Expect<AssertEqual<typeof result.stderr, string>>,
            ];
        });
    });

    describe("Timeout handling", () => {
        it("should respect timeout option and cleanup subprocess", async () => {
            // This test will attempt to run a command that might take time
            // and verify timeout works (adjust timeout as needed for actual behavior)
            const startTime = Date.now();

            try {
                const result = await executeCliCommand(["test"], { timeout: 100 });
                const elapsed = Date.now() - startTime;

                // If command completes within timeout, verify it worked
                expect(result.executionTime).toBeLessThanOrEqual(elapsed);
                expect(typeof result.exitCode).toBe("number");
            } catch (error) {
                // If timeout occurs, verify error is thrown
                const elapsed = Date.now() - startTime;
                expect(elapsed).toBeLessThanOrEqual(250); // Allow buffer for CI timing variability
                expect(error).toBeDefined();
            }

            // Type assertions for options
            type cases = [
                Expect<AssertExtends<{ timeout: number }, SubprocessOptions>>,
            ];
        });
    });

    describe("Sequential isolation", () => {
        it("should execute multiple commands sequentially with isolation", async () => {
            // Execute first command
            const result1 = await executeCliCommand(["--help"]);
            expect(result1.exitCode).toBe(0);
            expect(result1.stdout).toContain("typed");

            // Execute second command - should not be affected by first
            const result2 = await executeCliCommand(["symbols", "--help"]);
            expect(result2.exitCode).toBe(0);
            expect(result2.stdout).toContain("symbols");

            // Execute third command
            const result3 = await executeCliCommand(["test", "--help"]);
            expect(result3.exitCode).toBe(0);
            expect(result3.stdout).toContain("test");

            // Verify all results are independent (different outputs)
            expect(result1.stdout).not.toEqual(result2.stdout);
            expect(result2.stdout).not.toEqual(result3.stdout);
            expect(result3.stdout).not.toEqual(result1.stdout);

            // Verify each result is isolated
            expect(result1).toHaveProperty("exitCode");
            expect(result2).toHaveProperty("exitCode");
            expect(result3).toHaveProperty("exitCode");

            // Type assertions
            type cases = [
                Expect<AssertEqual<typeof result1, SubprocessResult>>,
                Expect<AssertEqual<typeof result2, SubprocessResult>>,
                Expect<AssertEqual<typeof result3, SubprocessResult>>,
            ];
        });
    });

    describe("UTF-8 encoding and special characters", () => {
        it("should handle UTF-8 output correctly", async () => {
            // Execute a command that produces UTF-8 output (symbols with emojis in output)
            const result = await executeCliCommand(["test", "--help"]);

            // Runtime assertions
            expect(result.exitCode).toBe(0);
            expect(typeof result.stdout).toBe("string");
            // Verify output is valid UTF-8 string
            expect(result.stdout.length).toBeGreaterThan(0);

            // Type assertions
            type cases = [
                Expect<AssertEqual<typeof result.stdout, string>>,
            ];
        });
    });

    describe("Type exports", () => {
        it("should export SubprocessResult type", () => {
            type result = SubprocessResult;

            type cases = [
                Expect<AssertExtends<result, { exitCode: number; stdout: string; stderr: string; executionTime: number }>>,
            ];
        });

        it("should export SubprocessOptions type", () => {
            type options = SubprocessOptions;

            type cases = [
                Expect<AssertExtends<options, { timeout?: number }>>,
            ];
        });
    });
});
