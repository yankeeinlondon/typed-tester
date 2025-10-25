import { describe, it, expect } from "vitest";
import type { Expect, AssertExtends, AssertEqual } from "inferred-types/types";
import type { AnalysisResult } from "~/types/imports/AnalysisResult";

// Import function to test (will be implemented)
import { formatImportsAsJson } from "~/report/imports/json";

describe("formatImportsAsJson()", () => {
    it("should format complete analysis result as valid JSON", () => {
        const mockResult: AnalysisResult = {
            files: [
                {
                    path: "/src/app.ts",
                    imports: [],
                },
            ],
            combinedImports: [
                {
                    kind: "combined-import",
                    source: "~/utils",
                    typeSymbols: ["User"],
                    runtimeSymbols: ["fetchData"],
                    file: "/src/app.ts",
                    line: 5,
                    hasTypeModifier: false,
                    content: 'import { User, fetchData } from "~/utils";',
                    toString: () => 'import { User, fetchData } from "~/utils";',
                },
            ],
            missingTypeModifiers: [
                {
                    kind: "missing-type-modifier",
                    source: "~/types",
                    file: "/src/app.ts",
                    line: 3,
                    content: 'import { Config } from "~/types";',
                    toString: () => 'import { Config } from "~/types";',
                },
            ],
            categorized: {
                external: [],
                relativePeerNamed: [],
            },
        };

        const output = formatImportsAsJson(mockResult);

        // Should be valid JSON
        expect(() => JSON.parse(output)).not.toThrow();

        const parsed = JSON.parse(output);

        // Should contain all top-level keys
        expect(parsed).toHaveProperty("files");
        expect(parsed).toHaveProperty("combinedImports");
        expect(parsed).toHaveProperty("missingTypeModifiers");
        expect(parsed).toHaveProperty("categorized");

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should preserve combined imports data in JSON", () => {
        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [
                {
                    kind: "combined-import",
                    source: "~/utils",
                    typeSymbols: ["User", "Product"],
                    runtimeSymbols: ["fetchData"],
                    file: "/src/app.ts",
                    line: 5,
                    hasTypeModifier: false,
                    content: 'import { User, Product, fetchData } from "~/utils";',
                    toString: () => 'import { User, Product, fetchData } from "~/utils";',
                },
            ],
            missingTypeModifiers: [],
            categorized: {},
        };

        const output = formatImportsAsJson(mockResult);
        const parsed = JSON.parse(output);

        // Verify combined imports structure
        expect(parsed.combinedImports).toHaveLength(1);
        expect(parsed.combinedImports[0]).toMatchObject({
            kind: "combined-import",
            source: "~/utils",
            typeSymbols: ["User", "Product"],
            runtimeSymbols: ["fetchData"],
            file: "/src/app.ts",
            line: 5,
            hasTypeModifier: false,
        });

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should preserve missing type modifiers data in JSON", () => {
        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [],
            missingTypeModifiers: [
                {
                    kind: "missing-type-modifier",
                    source: "~/types",
                    file: "/src/app.ts",
                    line: 3,
                    content: 'import { User, Product } from "~/types";',
                    toString: () => 'import { User, Product } from "~/types";',
                },
            ],
            categorized: {},
        };

        const output = formatImportsAsJson(mockResult);
        const parsed = JSON.parse(output);

        // Verify missing type modifiers structure
        expect(parsed.missingTypeModifiers).toHaveLength(1);
        expect(parsed.missingTypeModifiers[0]).toMatchObject({
            kind: "missing-type-modifier",
            source: "~/types",
            file: "/src/app.ts",
            line: 3,
        });

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should handle empty results gracefully", () => {
        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [],
            missingTypeModifiers: [],
            categorized: {},
        };

        const output = formatImportsAsJson(mockResult);

        // Should be valid JSON
        expect(() => JSON.parse(output)).not.toThrow();

        const parsed = JSON.parse(output);

        // Should have empty arrays
        expect(parsed.files).toEqual([]);
        expect(parsed.combinedImports).toEqual([]);
        expect(parsed.missingTypeModifiers).toEqual([]);
        expect(parsed.categorized).toEqual({});

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should NOT include ANSI color codes in JSON output", () => {
        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [
                {
                    kind: "combined-import",
                    source: "~/utils",
                    typeSymbols: ["User"],
                    runtimeSymbols: ["fetchData"],
                    file: "/src/app.ts",
                    line: 5,
                    hasTypeModifier: false,
                    content: 'import { User, fetchData } from "~/utils";',
                    toString: () => 'import { User, fetchData } from "~/utils";',
                },
            ],
            missingTypeModifiers: [],
            categorized: {},
        };

        const output = formatImportsAsJson(mockResult);

        // Should NOT contain ANSI escape codes
        expect(output).not.toMatch(/\x1B\[\d+m/);

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should NOT include OSC8 hyperlinks in JSON output", () => {
        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [
                {
                    kind: "combined-import",
                    source: "~/utils",
                    typeSymbols: ["User"],
                    runtimeSymbols: ["fetchData"],
                    file: "/src/app.ts",
                    line: 5,
                    hasTypeModifier: false,
                    content: 'import { User, fetchData } from "~/utils";',
                    toString: () => 'import { User, fetchData } from "~/utils";',
                },
            ],
            missingTypeModifiers: [],
            categorized: {},
        };

        const output = formatImportsAsJson(mockResult);

        // Should NOT contain OSC8 escape sequences
        expect(output).not.toContain("\x1B]8;;");

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should format JSON with proper indentation (pretty print)", () => {
        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [],
            missingTypeModifiers: [],
            categorized: {},
        };

        const output = formatImportsAsJson(mockResult);

        // Should be formatted with indentation (2 spaces)
        expect(output).toContain("  ");
        expect(output).toMatch(/\n/);

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should verify function signature types", () => {
        // Type-only test to verify function signature
        const fn = formatImportsAsJson;

        type cases = [
            Expect<AssertExtends<typeof fn, (result: AnalysisResult) => string>>,
        ];
    });
});
