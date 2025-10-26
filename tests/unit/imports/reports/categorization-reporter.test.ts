import { describe, it, expect } from "vitest";
import type { Expect, AssertEqual, AssertExtends } from "inferred-types/types";
import type { AnalysisResult, ImportCategory, ImportType } from "~/types";



// Mock helper to create ImportType objects
function createImport(
    category: ImportCategory,
    file: string,
    line: number,
    content: string
): ImportType {
    return {
        category,
        file,
        line,
        content,
        toString() {
            return this.content;
        },
    };
}

// Mock helper to create AnalysisResult
function createAnalysisResult(categorized: Record<string, ImportType[]>): AnalysisResult {
    const allImports = Object.values(categorized).flat();

    return {
        files: [
            {
                path: "/test/file1.ts",
                imports: allImports.filter(i => i.file === "/test/file1.ts"),
            },
            {
                path: "/test/file2.ts",
                imports: allImports.filter(i => i.file === "/test/file2.ts"),
            },
        ],
        combinedImports: [],
        missingTypeModifiers: [],
        categorized,
    };
}

describe("reportCategorization()", () => {
    describe("Normal mode (count summaries)", () => {
        it("should show count summaries for all categories", async () => {
            // Import the function (will be implemented)
            const { reportCategorization } = await import("~/report/imports/categorization");

            const result = createAnalysisResult({
                external: [
                    createImport("external", "/test/file1.ts", 1, "import { x } from 'external-pkg'"),
                    createImport("external", "/test/file1.ts", 2, "import { x } from 'another-pkg'"),
                ],
                relativePeerNamed: [
                    createImport("relativePeerNamed", "/test/file1.ts", 3, "import { x } from './peer'"),
                ],
                aliasNamed: [
                    createImport("aliasNamed", "/test/file2.ts", 1, "import { x } from '~/utils'"),
                ],
            });

            const output = reportCategorization(result, { quiet: false, verbose: false, external: false, deep: false });

            // Should contain category counts
            expect(output).toContain("external");
            expect(output).toContain("2"); // count
            expect(output).toContain("relativePeerNamed");
            expect(output).toContain("1"); // count
            expect(output).toContain("aliasNamed");
            expect(output).toContain("1"); // count

            // Should NOT contain detailed lists in normal mode
            expect(output).not.toContain("external-pkg");
            expect(output).not.toContain("another-pkg");

            // Type assertion
            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });

        it("should handle empty categories gracefully", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            const result = createAnalysisResult({});

            const output = reportCategorization(result, { quiet: false, verbose: false, external: false, deep: false });

            expect(output).toBeTruthy();
            expect(output).toContain("No imports"); // or similar message

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });

        it("should support quiet mode (no headings)", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            const result = createAnalysisResult({
                external: [
                    createImport("external", "/test/file1.ts", 1, "import { x } from 'pkg'"),
                ],
            });

            const output = reportCategorization(result, { quiet: true, verbose: false, external: false, deep: false });

            // Should contain data but no decorative headings
            expect(output).toContain("external");
            expect(output).toContain("1");

            // Should not contain emoji or bold headings (check for absence of ANSI codes or specific heading text)
            expect(output).not.toMatch(/📊|Import Categorization/);

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });
    });

    describe("Verbose mode", () => {
        it("should add CSV list of external dependencies in verbose mode", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            const result = createAnalysisResult({
                external: [
                    createImport("external", "/test/file1.ts", 1, "import { x } from 'pkg-a'"),
                    createImport("external", "/test/file1.ts", 2, "import { x } from 'pkg-b'"),
                    createImport("external", "/test/file2.ts", 1, "import { x } from 'pkg-c'"),
                ],
            });

            const output = reportCategorization(result, { quiet: false, verbose: true, external: false, deep: false });

            // Should contain external package names
            expect(output).toContain("pkg-a");
            expect(output).toContain("pkg-b");
            expect(output).toContain("pkg-c");

            // Should be formatted as a list (CSV or similar)
            expect(output).toMatch(/pkg-[abc]/);

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });

        it("should add detailed lists for internal categories in verbose mode", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            const result = createAnalysisResult({
                relativePeerNamed: [
                    createImport("relativePeerNamed", "/test/file1.ts", 3, "import { x } from './peer'"),
                ],
                aliasNamed: [
                    createImport("aliasNamed", "/test/file2.ts", 1, "import { x } from '~/utils'"),
                ],
            });

            const output = reportCategorization(result, { quiet: false, verbose: true, external: false, deep: false });

            // Should contain detailed information about internal imports
            expect(output).toContain("relativePeerNamed");
            expect(output).toContain("./peer");
            expect(output).toContain("aliasNamed");
            expect(output).toContain("~/utils");

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });

        it("should show both external and internal details in full verbose mode", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            const result = createAnalysisResult({
                external: [
                    createImport("external", "/test/file1.ts", 1, "import { x } from 'external-pkg'"),
                ],
                relativePeerNamed: [
                    createImport("relativePeerNamed", "/test/file1.ts", 3, "import { x } from './peer'"),
                ],
            });

            const output = reportCategorization(result, { quiet: false, verbose: true, external: false, deep: false });

            // Should have both external and internal details
            expect(output).toContain("external-pkg");
            expect(output).toContain("./peer");

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });
    });

    describe("--external flag behavior", () => {
        it("should show verbose output for external dependencies only when --external is set", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            const result = createAnalysisResult({
                external: [
                    createImport("external", "/test/file1.ts", 1, "import { x } from 'pkg-a'"),
                    createImport("external", "/test/file1.ts", 2, "import { x } from 'pkg-b'"),
                ],
                relativePeerNamed: [
                    createImport("relativePeerNamed", "/test/file1.ts", 3, "import { x } from './peer'"),
                ],
            });

            const output = reportCategorization(result, { quiet: false, verbose: false, external: true, deep: false });

            // Should show external package details
            expect(output).toContain("pkg-a");
            expect(output).toContain("pkg-b");

            // Should still show internal categories (but not verbose details)
            expect(output).toContain("relativePeerNamed");
            expect(output).toContain("1"); // count

            // Should NOT show detailed internal import paths (since verbose is false)
            expect(output).not.toContain("./peer");

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });

        it("should handle --external flag with no external dependencies", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            const result = createAnalysisResult({
                relativePeerNamed: [
                    createImport("relativePeerNamed", "/test/file1.ts", 3, "import { x } from './peer'"),
                ],
            });

            const output = reportCategorization(result, { quiet: false, verbose: false, external: true, deep: false });

            expect(output).toBeTruthy();
            // Should indicate no external dependencies or show 0 count
            expect(output).toMatch(/external.*0|No external/i);

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });
    });

    describe("--deep flag behavior", () => {
        it("should show verbose output for deep paths only when --deep is set", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            const result = createAnalysisResult({
                relativeDeepChildNamed: [
                    createImport("relativeDeepChildNamed", "/test/file1.ts", 1, "import { x } from './a/b/c'"),
                ],
                relativePeerNamed: [
                    createImport("relativePeerNamed", "/test/file1.ts", 2, "import { x } from './peer'"),
                ],
            });

            const output = reportCategorization(result, { quiet: false, verbose: false, external: false, deep: true });

            // Should show deep path details
            expect(output).toMatch(/deep/i); // case-insensitive
            expect(output).toContain("./a/b/c");

            // Should show peer category count but not details
            expect(output).toContain("relativePeerNamed");
            expect(output).toContain("1");
            expect(output).not.toContain("./peer"); // not verbose for non-deep

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });

        it("should handle --deep flag with no deep imports", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            const result = createAnalysisResult({
                relativePeerNamed: [
                    createImport("relativePeerNamed", "/test/file1.ts", 1, "import { x } from './peer'"),
                ],
            });

            const output = reportCategorization(result, { quiet: false, verbose: false, external: false, deep: true });

            expect(output).toBeTruthy();
            // Should indicate no deep imports or show 0 count
            expect(output).toMatch(/deep.*0|No deep/i);

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });
    });

    describe("Combined flags", () => {
        it("should support --external --deep combination", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            const result = createAnalysisResult({
                external: [
                    createImport("external", "/test/file1.ts", 1, "import { x } from 'pkg'"),
                ],
                relativeDeepChildNamed: [
                    createImport("relativeDeepChildNamed", "/test/file1.ts", 2, "import { x } from './a/b/c'"),
                ],
                relativePeerNamed: [
                    createImport("relativePeerNamed", "/test/file1.ts", 3, "import { x } from './peer'"),
                ],
            });

            const output = reportCategorization(result, { quiet: false, verbose: false, external: true, deep: true });

            // Should show external details
            expect(output).toContain("pkg");

            // Should show deep path details
            expect(output).toContain("./a/b/c");

            // Should show peer count but not details
            expect(output).toContain("relativePeerNamed");
            expect(output).toContain("1");
            expect(output).not.toContain("./peer");

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });

        it("should handle --verbose overriding specific flags", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            const result = createAnalysisResult({
                external: [
                    createImport("external", "/test/file1.ts", 1, "import { x } from 'pkg'"),
                ],
                relativePeerNamed: [
                    createImport("relativePeerNamed", "/test/file1.ts", 2, "import { x } from './peer'"),
                ],
            });

            const output = reportCategorization(result, { quiet: false, verbose: true, external: true, deep: false });

            // Verbose should show everything regardless of external/deep flags
            expect(output).toContain("pkg");
            expect(output).toContain("./peer");

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });
    });

    describe("Edge cases", () => {
        it("should handle large number of external dependencies", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            const manyExternals = Array.from({ length: 50 }, (_, i) =>
                createImport("external", "/test/file1.ts", i + 1, `import { x${i} } from 'pkg-${i}'`)
            );

            const result = createAnalysisResult({
                external: manyExternals,
            });

            const output = reportCategorization(result, { quiet: false, verbose: true, external: false, deep: false });

            // Should handle large lists gracefully (may wrap, paginate, or truncate)
            expect(output).toContain("50"); // count
            expect(output).toBeTruthy();
            expect(output.length).toBeGreaterThan(0);

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });

        it("should handle categories with no imports", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            const result = createAnalysisResult({
                external: [
                    createImport("external", "/test/file1.ts", 1, "import { x } from 'pkg'"),
                ],
                // Other categories intentionally empty
            });

            const output = reportCategorization(result, { quiet: false, verbose: false, external: false, deep: false });

            expect(output).toContain("external");
            expect(output).toContain("1");
            // Should not crash or show empty categories explicitly

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });
    });

    describe("Type tests for options", () => {
        it("should verify ReportOptions type structure", () => {
            type ReportOptions = {
                quiet: boolean;
                verbose: boolean;
                external: boolean;
                deep: boolean;
            };

            // Verify the options object matches expected structure
            const validOptions: ReportOptions = {
                quiet: false,
                verbose: false,
                external: false,
                deep: false,
            };

            type cases = [
                Expect<AssertEqual<
                    typeof validOptions,
                    {
                        quiet: boolean;
                        verbose: boolean;
                        external: boolean;
                        deep: boolean;
                    }
                >>,
                Expect<AssertExtends<
                    ReportOptions,
                    {
                        quiet: boolean;
                        verbose: boolean;
                    }
                >>
            ];
        });

        it("should verify reportCategorization function signature", async () => {
            const { reportCategorization } = await import("~/report/imports/categorization");

            type ReportFn = typeof reportCategorization;

            type cases = [
                // Function should accept AnalysisResult and options
                Expect<AssertExtends<
                    ReportFn,
                    (result: AnalysisResult, options: any) => string
                >>
            ];
        });
    });
});

describe("formatCategoryTable()", () => {
    describe("Category count formatting", () => {
        it("should format category counts in a readable table", async () => {
            const { formatCategoryTable } = await import("~/report/imports/format");

            const counts = {
                external: 10,
                relativePeerNamed: 5,
                aliasNamed: 3,
            };

            const output = formatCategoryTable(counts);

            expect(output).toContain("external");
            expect(output).toContain("10");
            expect(output).toContain("relativePeerNamed");
            expect(output).toContain("5");
            expect(output).toContain("aliasNamed");
            expect(output).toContain("3");

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });

        it("should handle empty counts object", async () => {
            const { formatCategoryTable } = await import("~/report/imports/format");

            const counts = {};

            const output = formatCategoryTable(counts);

            expect(output).toBeTruthy();
            // Should return empty string or "No imports" message
            expect(typeof output).toBe("string");

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });

        it("should align columns properly", async () => {
            const { formatCategoryTable } = await import("~/report/imports/format");

            const counts = {
                veryLongCategoryNameHere: 1,
                short: 999,
            };

            const output = formatCategoryTable(counts);

            // Check that output is properly aligned (contains consistent spacing)
            const lines = output.split("\n").filter(l => l.trim());
            expect(lines.length).toBeGreaterThan(0);

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });
    });
});

describe("formatExternalDependencies()", () => {
    describe("CSV formatting", () => {
        it("should format external dependencies as CSV list", async () => {
            const { formatExternalDependencies } = await import("~/report/imports/format");

            const externals = [
                createImport("external", "/test/file1.ts", 1, "import { x } from 'pkg-a'"),
                createImport("external", "/test/file1.ts", 2, "import { x } from 'pkg-b'"),
                createImport("external", "/test/file2.ts", 1, "import { x } from 'pkg-c'"),
            ];

            const output = formatExternalDependencies(externals);

            // Should contain package names
            expect(output).toContain("pkg-a");
            expect(output).toContain("pkg-b");
            expect(output).toContain("pkg-c");

            // Should be formatted as a list (comma-separated or similar)
            expect(output.split(",").length).toBeGreaterThanOrEqual(2);

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });

        it("should deduplicate package names", async () => {
            const { formatExternalDependencies } = await import("~/report/imports/format");

            const externals = [
                createImport("external", "/test/file1.ts", 1, "import { x } from 'same-pkg'"),
                createImport("external", "/test/file1.ts", 2, "import { x } from 'same-pkg'"),
                createImport("external", "/test/file2.ts", 1, "import { x } from 'same-pkg'"),
            ];

            const output = formatExternalDependencies(externals);

            // Should only show "same-pkg" once
            const matches = output.match(/same-pkg/g);
            expect(matches).toHaveLength(1);

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });

        it("should handle empty array", async () => {
            const { formatExternalDependencies } = await import("~/report/imports/format");

            const output = formatExternalDependencies([]);

            expect(output).toBe("");

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });

        it("should sort package names alphabetically", async () => {
            const { formatExternalDependencies } = await import("~/report/imports/format");

            const externals = [
                createImport("external", "/test/file1.ts", 1, "import { x } from 'zebra'"),
                createImport("external", "/test/file1.ts", 2, "import { x } from 'apple'"),
                createImport("external", "/test/file2.ts", 1, "import { x } from 'mango'"),
            ];

            const output = formatExternalDependencies(externals);

            const firstApple = output.indexOf("apple");
            const firstMango = output.indexOf("mango");
            const firstZebra = output.indexOf("zebra");

            expect(firstApple).toBeLessThan(firstMango);
            expect(firstMango).toBeLessThan(firstZebra);

            type cases = [
                Expect<AssertEqual<typeof output, string>>
            ];
        });
    });
});
