import { describe, expect, it } from "vitest";
import { prettyPath } from "~/utils/prettyPath";
import chalk from "chalk";

describe("prettyPath()", () => {
    it("should format a path with directory and filename", () => {
        const result = prettyPath("/path/to/file.ts");
        expect(result).toBe(`${chalk.dim("/path/to/")}file.ts`);
    });

    it("should handle relative paths", () => {
        const result = prettyPath("src/utils/file.ts");
        expect(result).toBe(`${chalk.dim("src/utils/")}file.ts`);
    });

    it("should handle filename only (no directory)", () => {
        const result = prettyPath("file.ts");
        expect(result).toBe("file.ts");
    });

    it("should handle current directory paths", () => {
        const result = prettyPath("./file.ts");
        expect(result).toBe("file.ts");
    });

    it("should handle nested directories", () => {
        const result = prettyPath("/very/long/path/to/nested/file.ts");
        expect(result).toBe(`${chalk.dim("/very/long/path/to/nested/")}file.ts`);
    });

    it("should handle Windows-style paths", () => {
        const result = prettyPath("C:\\Users\\test\\file.ts");
        // pathe normalizes paths, so Windows paths get converted
        expect(result).toContain("file.ts");
        expect(result).not.toBe("file.ts"); // Should have some directory part
    });

    it("should handle paths with special characters", () => {
        const result = prettyPath("/path/to/@scoped/package/file.ts");
        expect(result).toBe(`${chalk.dim("/path/to/@scoped/package/")}file.ts`);
    });

    it("should handle paths with spaces", () => {
        const result = prettyPath("/path with spaces/to file.ts");
        expect(result).toBe(`${chalk.dim("/path with spaces/")}to file.ts`);
    });

    it("should handle empty string", () => {
        const result = prettyPath("");
        expect(result).toBe("");
    });

    it("should handle root path", () => {
        const result = prettyPath("/");
        // Root path special case returns just the dimmed "/"
        expect(result).toBe(`${chalk.dim("/")}`);
    });

    it("should handle parent directory references", () => {
        const result = prettyPath("../file.ts");
        expect(result).toBe(`${chalk.dim("../")}file.ts`);
    });

    it("should handle multiple parent directory references", () => {
        const result = prettyPath("../../utils/file.ts");
        expect(result).toBe(`${chalk.dim("../../utils/")}file.ts`);
    });
});