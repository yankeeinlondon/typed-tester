import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { availableWidth } from "~/utils/availableWidth";

describe("availableWidth()", () => {
    let originalColumns: number | undefined;
    let originalEnvColumns: string | undefined;

    beforeEach(() => {
        // Save original values
        originalColumns = process.stdout.columns;
        originalEnvColumns = process.env.COLUMNS;
    });

    afterEach(() => {
        // Restore original values
        if (originalColumns !== undefined) {
            process.stdout.columns = originalColumns;
        } else {
            delete (process.stdout as any).columns;
        }

        if (originalEnvColumns !== undefined) {
            process.env.COLUMNS = originalEnvColumns;
        } else {
            delete process.env.COLUMNS;
        }
    });

    describe("process.stdout.columns (primary source)", () => {
        it("should return process.stdout.columns when available and valid", () => {
            process.stdout.columns = 120;
            delete process.env.COLUMNS;

            const result = availableWidth();

            expect(result).toBe(120);
        });

        it("should return process.stdout.columns for small widths", () => {
            process.stdout.columns = 40;
            delete process.env.COLUMNS;

            const result = availableWidth();

            expect(result).toBe(40);
        });

        it("should return process.stdout.columns for large widths", () => {
            process.stdout.columns = 250;
            delete process.env.COLUMNS;

            const result = availableWidth();

            expect(result).toBe(250);
        });

        it("should fallback when process.stdout.columns is 0", () => {
            process.stdout.columns = 0;
            delete process.env.COLUMNS;

            const result = availableWidth();

            expect(result).toBe(80); // Should use default
        });

        it("should fallback when process.stdout.columns is negative", () => {
            process.stdout.columns = -1;
            delete process.env.COLUMNS;

            const result = availableWidth();

            expect(result).toBe(80); // Should use default
        });

        it("should fallback when process.stdout.columns is undefined", () => {
            delete (process.stdout as any).columns;
            delete process.env.COLUMNS;

            const result = availableWidth();

            expect(result).toBe(80); // Should use default
        });
    });

    describe("process.env.COLUMNS (fallback source)", () => {
        it("should use COLUMNS env var when stdout.columns is unavailable", () => {
            delete (process.stdout as any).columns;
            process.env.COLUMNS = "100";

            const result = availableWidth();

            expect(result).toBe(100);
        });

        it("should prefer stdout.columns over env var", () => {
            process.stdout.columns = 120;
            process.env.COLUMNS = "100";

            const result = availableWidth();

            expect(result).toBe(120); // stdout takes precedence
        });

        it("should handle COLUMNS env var with small values", () => {
            delete (process.stdout as any).columns;
            process.env.COLUMNS = "30";

            const result = availableWidth();

            expect(result).toBe(30);
        });

        it("should handle COLUMNS env var with large values", () => {
            delete (process.stdout as any).columns;
            process.env.COLUMNS = "500";

            const result = availableWidth();

            expect(result).toBe(500);
        });

        it("should fallback to default when COLUMNS is invalid (non-numeric)", () => {
            delete (process.stdout as any).columns;
            process.env.COLUMNS = "not-a-number";

            const result = availableWidth();

            expect(result).toBe(80);
        });

        it("should fallback to default when COLUMNS is 0", () => {
            delete (process.stdout as any).columns;
            process.env.COLUMNS = "0";

            const result = availableWidth();

            expect(result).toBe(80);
        });

        it("should fallback to default when COLUMNS is negative", () => {
            delete (process.stdout as any).columns;
            process.env.COLUMNS = "-50";

            const result = availableWidth();

            expect(result).toBe(80);
        });

        it("should fallback to default when COLUMNS is empty string", () => {
            delete (process.stdout as any).columns;
            process.env.COLUMNS = "";

            const result = availableWidth();

            expect(result).toBe(80);
        });

        it("should fallback to default when COLUMNS has decimal value", () => {
            delete (process.stdout as any).columns;
            process.env.COLUMNS = "100.5";

            const result = availableWidth();

            // parseInt("100.5", 10) = 100, which is valid
            expect(result).toBe(100);
        });
    });

    describe("default fallback", () => {
        it("should return 80 when both sources are unavailable", () => {
            delete (process.stdout as any).columns;
            delete process.env.COLUMNS;

            const result = availableWidth();

            expect(result).toBe(80);
        });

        it("should return 80 when stdout.columns is invalid and COLUMNS is missing", () => {
            process.stdout.columns = 0;
            delete process.env.COLUMNS;

            const result = availableWidth();

            expect(result).toBe(80);
        });

        it("should return 80 when stdout.columns is invalid and COLUMNS is invalid", () => {
            process.stdout.columns = -1;
            process.env.COLUMNS = "invalid";

            const result = availableWidth();

            expect(result).toBe(80);
        });
    });

    describe("edge cases", () => {
        it("should handle COLUMNS with leading/trailing spaces", () => {
            delete (process.stdout as any).columns;
            process.env.COLUMNS = "  90  ";

            const result = availableWidth();

            expect(result).toBe(90); // parseInt handles whitespace
        });

        it("should handle COLUMNS with plus sign", () => {
            delete (process.stdout as any).columns;
            process.env.COLUMNS = "+85";

            const result = availableWidth();

            expect(result).toBe(85);
        });

        it("should handle COLUMNS with text after number", () => {
            delete (process.stdout as any).columns;
            process.env.COLUMNS = "100px";

            const result = availableWidth();

            expect(result).toBe(100); // parseInt stops at first non-digit
        });

        it("should always return a positive number", () => {
            // Test multiple scenarios
            const scenarios = [
                { columns: undefined, env: undefined },
                { columns: 0, env: undefined },
                { columns: -10, env: undefined },
                { columns: undefined, env: "0" },
                { columns: undefined, env: "-5" },
                { columns: 120, env: "100" },
            ];

            scenarios.forEach(({ columns, env }) => {
                if (columns !== undefined) {
                    process.stdout.columns = columns;
                } else {
                    delete (process.stdout as any).columns;
                }

                if (env !== undefined) {
                    process.env.COLUMNS = env;
                } else {
                    delete process.env.COLUMNS;
                }

                const result = availableWidth();
                expect(result).toBeGreaterThan(0);
            });
        });
    });
});
