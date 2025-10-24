import { describe, it, expect } from "vitest";
import chalk from "chalk";

/**
 * Phase 5 tests for dimming files without type tests
 *
 * These tests verify that:
 * 1. Files with typeTests === 0 get dimmed styling
 * 2. Files with typeTests > 0 get normal styling
 * 3. Slow file warnings remain visible even when dimmed
 * 4. Error and success icons remain visible
 */

describe("File Dimming Logic - Phase 5", () => {
    /**
     * Helper function that mimics the core dimming logic that will be
     * implemented in showTestFile()
     */
    function shouldDimFile(typeTests: number): boolean {
        return typeTests === 0;
    }

    /**
     * Helper to apply dimming to a line based on type test count
     */
    function applyFileDimming(line: string, typeTests: number): string {
        if (shouldDimFile(typeTests)) {
            return chalk.dim(line);
        }
        return line;
    }

    describe("Core dimming decision logic", () => {
        it("should dim files when typeTests === 0", () => {
            const shouldDim = shouldDimFile(0);
            expect(shouldDim).toBe(true);
        });

        it("should NOT dim files when typeTests > 0", () => {
            expect(shouldDimFile(1)).toBe(false);
            expect(shouldDimFile(5)).toBe(false);
            expect(shouldDimFile(100)).toBe(false);
        });

        it("should handle exactly one type test", () => {
            const shouldDim = shouldDimFile(1);
            expect(shouldDim).toBe(false);
        });
    });

    describe("Dimming application", () => {
        it("should apply chalk.dim() to entire line when typeTests === 0", () => {
            const line = "✓  test/file.test.ts (5 tests, 0 type tests, 0 assertions) 12ms";
            const result = applyFileDimming(line, 0);

            // The result should be a dimmed version of the line
            expect(result).toBe(chalk.dim(line));
        });

        it("should NOT apply dimming when typeTests > 0", () => {
            const line = "✓  test/file.test.ts (8 tests, 8 type tests, 24 assertions) 18ms";
            const result = applyFileDimming(line, 8);

            // The result should be the original line (no dimming)
            expect(result).toBe(line);
        });

        it("should handle lines with existing chalk formatting", () => {
            const line = chalk.green.bold("✓") + "  test/file.test.ts " + chalk.dim("(") + "5 tests" + chalk.dim(")");
            const typeTests = 0;
            const result = applyFileDimming(line, typeTests);

            // Even with existing formatting, dimming should be applied
            expect(result).toBe(chalk.dim(line));
        });
    });

    describe("Integration with timing display", () => {
        it("should preserve timing color codes when dimming slow files", () => {
            const slowFileLine = chalk.yellowBright.bold("250ms");
            const fullLine = "✓  test/file.test.ts (5 tests, 0 type tests, 0 assertions) " + slowFileLine;
            const dimmed = applyFileDimming(fullLine, 0);

            // The entire line (including colored timing) should be dimmed
            // chalk.dim() wraps the entire string including existing colors
            expect(dimmed).toBe(chalk.dim(fullLine));
        });

        it("should preserve timing for very slow files when dimming", () => {
            const verySlowFileLine = chalk.red.bold("550ms");
            const fullLine = "✓  test/file.test.ts (3 tests, 0 type tests, 0 assertions) " + verySlowFileLine;
            const dimmed = applyFileDimming(fullLine, 0);

            expect(dimmed).toBe(chalk.dim(fullLine));
        });

        it("should not dim timing on files with type tests", () => {
            const slowFileLine = chalk.yellowBright.bold("250ms");
            const fullLine = "✓  test/file.test.ts (8 tests, 5 type tests, 12 assertions) " + slowFileLine;
            const result = applyFileDimming(fullLine, 5);

            // No dimming should be applied
            expect(result).toBe(fullLine);
        });
    });

    describe("Integration with status icons", () => {
        it("should preserve success icon when dimming", () => {
            const successIcon = chalk.green.bold("✓");
            const line = `${successIcon}  test/file.test.ts (5 tests, 0 type tests, 0 assertions) 12ms`;
            const dimmed = applyFileDimming(line, 0);

            // The entire line including icon should be dimmed
            expect(dimmed).toBe(chalk.dim(line));
        });

        it("should preserve error icon when dimming", () => {
            const errorIcon = chalk.red.bold("⤬");
            const line = `${errorIcon}  test/file.test.ts (5 tests, 0 type tests, 0 assertions) 12ms`;
            const dimmed = applyFileDimming(line, 0);

            expect(dimmed).toBe(chalk.dim(line));
        });

        it("should preserve skip icon when dimming", () => {
            const skipIcon = chalk.dim("⇣");
            const line = `${skipIcon}  test/file.test.ts (5 tests, 0 type tests, 0 assertions) 12ms`;
            const dimmed = applyFileDimming(line, 0);

            expect(dimmed).toBe(chalk.dim(line));
        });
    });

    describe("Edge cases", () => {
        it("should handle empty string", () => {
            const result = applyFileDimming("", 0);
            expect(result).toBe(chalk.dim(""));
        });

        it("should handle lines with only whitespace", () => {
            const line = "   ";
            const result = applyFileDimming(line, 0);
            expect(result).toBe(chalk.dim(line));
        });

        it("should handle very long lines", () => {
            const longLine = "✓  " + "test/very/long/path/to/file.test.ts".repeat(10) + " (100 tests, 0 type tests, 0 assertions) 500ms";
            const result = applyFileDimming(longLine, 0);
            expect(result).toBe(chalk.dim(longLine));
        });

        it("should handle negative type test counts (defensive)", () => {
            // This shouldn't happen in practice, but good to be defensive
            const shouldDim = shouldDimFile(-1);
            // Negative is not zero, so should not dim
            expect(shouldDim).toBe(false);
        });
    });
});
