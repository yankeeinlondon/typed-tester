import { describe, it, expect } from "vitest";
import type { Expect, AssertEqual, AssertExtends } from "inferred-types/types";
import {
    runSymbolsCommand,
    runSourceCommand,
    runDepsCommand,
    runFilesCommand,
} from "../../helpers/subprocess-test-harness";
import type {
    CommandResult,
} from "../../helpers/subprocess-test-harness";

describe("Multi-Command Subprocess Integration", () => {
    describe("Symbols Command", () => {
        it("should execute symbols command and capture output", async () => {
            const result = await runSymbolsCommand({
                filter: ["executeCliCommand"],
            });

            // Runtime assertions
            expect(result).toHaveProperty("output");
            expect(result).toHaveProperty("exitCode");
            expect(result).toHaveProperty("executionTime");
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain("Symbol");
            expect(result.executionTime).toBeGreaterThan(0);

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result, CommandResult>>,
            ];
        }, 15000);

        it("should handle symbols command with quiet flag", async () => {
            const result = await runSymbolsCommand({
                filter: ["TestCommandResult"],
                quiet: true,
            });

            // Runtime assertions
            expect(result.exitCode).toBe(0);
            expect(result.output.length).toBeGreaterThan(0);

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result, CommandResult>>,
            ];
        }, 15000);
    });

    describe("Source Command", () => {
        it("should execute source command and capture output", async () => {
            const result = await runSourceCommand({
                filter: ["subprocess-executor"],
            });

            // Runtime assertions
            expect(result).toHaveProperty("output");
            expect(result).toHaveProperty("exitCode");
            expect(result.exitCode).toBe(0);
            expect(result.output.length).toBeGreaterThan(0);

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result, CommandResult>>,
            ];
        }, 15000);

        it("should handle source command with quiet flag", async () => {
            const result = await runSourceCommand({
                filter: ["subprocess-executor"],
                quiet: true,
            });

            // Runtime assertions
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain("Source File Analysis");

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result, CommandResult>>,
            ];
        }, 15000);
    });

    describe("Deps Command", () => {
        it("should execute deps command and capture output", async () => {
            const result = await runDepsCommand({
                filter: ["executeCliCommand"],
            });

            // Runtime assertions
            expect(result).toHaveProperty("output");
            expect(result).toHaveProperty("exitCode");
            expect(result.exitCode).toBe(0);
            expect(result.output.length).toBeGreaterThan(0);

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result, CommandResult>>,
            ];
        }, 15000);

        it("should handle deps command with quiet flag", async () => {
            const result = await runDepsCommand({
                filter: ["executeCliCommand"],
                quiet: true,
            });

            // Runtime assertions
            expect(result.exitCode).toBe(0);
            expect(result).toHaveProperty("output");
            expect(result).toHaveProperty("executionTime");

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result, CommandResult>>,
            ];
        }, 15000);
    });

    describe("Files Command", () => {
        it("should execute files command and capture output", async () => {
            const result = await runFilesCommand({
                filter: ["helpers"],
            });

            // Runtime assertions
            expect(result).toHaveProperty("output");
            expect(result).toHaveProperty("exitCode");
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain("File");
            expect(result.executionTime).toBeGreaterThan(0);

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result, CommandResult>>,
            ];
        }, 15000);

        it("should handle files command with quiet flag", async () => {
            const result = await runFilesCommand({
                filter: ["subprocess"],
                quiet: true,
            });

            // Runtime assertions
            expect(result.exitCode).toBe(0);
            expect(result.output.length).toBeGreaterThan(0);

            // Type assertions
            type cases = [
                Expect<AssertExtends<typeof result, CommandResult>>,
            ];
        }, 15000);
    });

    describe("Type Exports", () => {
        it("should export CommandResult type", () => {
            type result = CommandResult;

            type cases = [
                Expect<AssertExtends<result, { output: string; exitCode: number; executionTime: number }>>,
            ];
        });
    });
});
