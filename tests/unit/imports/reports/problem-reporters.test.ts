import { describe, it, expect } from "vitest";
import type { Expect, AssertExtends, AssertEqual } from "inferred-types/types";
import type { AnalysisResult } from "../../../../src/types/imports/AnalysisResult";
import type { CombinedImport } from "../../../../src/types/imports/CombinedImport";
import type { MissingTypeModifier } from "../../../../src/types/imports/MissingTypeModifier";
import { resolve } from "pathe";

// Import functions to test (will be implemented)
import { reportCombinedImports } from "../../../../src/report/imports/reportCombinedImports";
import { reportMissingTypeModifiers } from "../../../../src/report/imports/reportMissingTypeModifiers";

describe("reportCombinedImports()", () => {
    it("should format combined imports grouped by file", () => {
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
                {
                    kind: "combined-import",
                    source: "~/types",
                    typeSymbols: ["Config"],
                    runtimeSymbols: ["validateConfig"],
                    file: "/src/app.ts",
                    line: 10,
                    hasTypeModifier: false,
                    content: 'import { Config, validateConfig } from "~/types";',
                    toString: () => 'import { Config, validateConfig } from "~/types";',
                },
                {
                    kind: "combined-import",
                    source: "../helpers",
                    typeSymbols: ["Result"],
                    runtimeSymbols: ["processResult"],
                    file: "/src/utils/formatter.ts",
                    line: 3,
                    hasTypeModifier: false,
                    content: 'import { Result, processResult } from "../helpers";',
                    toString: () => 'import { Result, processResult } from "../helpers";',
                },
            ],
            missingTypeModifiers: [],
            categorized: {},
        };

        const output = reportCombinedImports(mockResult, { quiet: false });

        // Should group by file
        expect(output).toContain("/src/app.ts");
        expect(output).toContain("/src/utils/formatter.ts");

        // Should show import details
        expect(output).toContain("User, Product, fetchData");
        expect(output).toContain("Config, validateConfig");
        expect(output).toContain("Result, processResult");

        // Should show line numbers
        expect(output).toContain("5");
        expect(output).toContain("10");
        expect(output).toContain("3");

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should include OSC8 file links in output", () => {
        // Use a real file that exists
        const realFile = resolve(process.cwd(), "src/typed.ts");

        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [
                {
                    kind: "combined-import",
                    source: "~/utils",
                    typeSymbols: ["User"],
                    runtimeSymbols: ["fetchData"],
                    file: realFile,
                    line: 5,
                    hasTypeModifier: false,
                    content: 'import { User, fetchData } from "~/utils";',
                    toString: () => 'import { User, fetchData } from "~/utils";',
                },
            ],
            missingTypeModifiers: [],
            categorized: {},
        };

        const output = reportCombinedImports(mockResult, { quiet: false });

        // Should contain OSC8 escape sequences
        expect(output).toContain("\x1B]8;;file://");
        expect(output).toMatch(/file:\/\/.*typed\.ts/);

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should support quiet mode (no headings)", () => {
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

        const quietOutput = reportCombinedImports(mockResult, { quiet: true });
        const normalOutput = reportCombinedImports(mockResult, { quiet: false });

        // Quiet mode should be shorter (no headings/banners)
        expect(quietOutput.length).toBeLessThan(normalOutput.length);

        // Both should contain the core content
        expect(quietOutput).toContain("/src/app.ts");
        expect(normalOutput).toContain("/src/app.ts");

        // Type test
        type cases = [
            Expect<AssertExtends<typeof quietOutput, string>>,
            Expect<AssertExtends<typeof normalOutput, string>>,
        ];
    });

    it("should support normal mode (with headings)", () => {
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

        const output = reportCombinedImports(mockResult, { quiet: false });

        // Should contain heading/banner
        expect(output).toMatch(/combined\s+import/i);

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should handle empty results", () => {
        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [],
            missingTypeModifiers: [],
            categorized: {},
        };

        const output = reportCombinedImports(mockResult, { quiet: false });

        // Should indicate no issues found
        expect(output).toMatch(/no.*combined.*import/i);

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should apply color coding to output", () => {
        // Use a real file that exists
        const realFile = resolve(process.cwd(), "src/typed.ts");

        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [
                {
                    kind: "combined-import",
                    source: "~/utils",
                    typeSymbols: ["User"],
                    runtimeSymbols: ["fetchData"],
                    file: realFile,
                    line: 5,
                    hasTypeModifier: false,
                    content: 'import { User, fetchData } from "~/utils";',
                    toString: () => 'import { User, fetchData } from "~/utils";',
                },
            ],
            missingTypeModifiers: [],
            categorized: {},
        };

        const output = reportCombinedImports(mockResult, { quiet: false });

        // Should use chalk for formatting (test by checking structure, not ANSI codes)
        // Chalk may strip colors in test environment, so check content instead
        expect(output).toContain("Line 5:");
        expect(output).toContain("Type symbols:");
        expect(output).toContain("Runtime symbols:");

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should verify function signature types", () => {
        // Type-only test to verify function signatures
        const fn = reportCombinedImports;

        type cases = [
            Expect<AssertExtends<typeof fn, (result: AnalysisResult, options: { quiet: boolean }) => string>>,
        ];
    });
});

describe("reportMissingTypeModifiers()", () => {
    it("should format missing type modifiers grouped by file", () => {
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
                {
                    kind: "missing-type-modifier",
                    source: "~/models",
                    file: "/src/app.ts",
                    line: 7,
                    content: 'import { Config } from "~/models";',
                    toString: () => 'import { Config } from "~/models";',
                },
                {
                    kind: "missing-type-modifier",
                    source: "../types",
                    file: "/src/utils/formatter.ts",
                    line: 2,
                    content: 'import { Result } from "../types";',
                    toString: () => 'import { Result } from "../types";',
                },
            ],
            categorized: {},
        };

        const output = reportMissingTypeModifiers(mockResult, { quiet: false });

        // Should group by file
        expect(output).toContain("/src/app.ts");
        expect(output).toContain("/src/utils/formatter.ts");

        // Should show import details
        expect(output).toContain("User, Product");
        expect(output).toContain("Config");
        expect(output).toContain("Result");

        // Should show line numbers
        expect(output).toContain("3");
        expect(output).toContain("7");
        expect(output).toContain("2");

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should include OSC8 file links in output", () => {
        // Use a real file that exists
        const realFile = resolve(process.cwd(), "src/typed.ts");

        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [],
            missingTypeModifiers: [
                {
                    kind: "missing-type-modifier",
                    source: "~/types",
                    file: realFile,
                    line: 3,
                    content: 'import { User } from "~/types";',
                    toString: () => 'import { User } from "~/types";',
                },
            ],
            categorized: {},
        };

        const output = reportMissingTypeModifiers(mockResult, { quiet: false });

        // Should contain OSC8 escape sequences
        expect(output).toContain("\x1B]8;;file://");
        expect(output).toMatch(/file:\/\/.*typed\.ts/);

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should support quiet mode (no headings)", () => {
        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [],
            missingTypeModifiers: [
                {
                    kind: "missing-type-modifier",
                    source: "~/types",
                    file: "/src/app.ts",
                    line: 3,
                    content: 'import { User } from "~/types";',
                    toString: () => 'import { User } from "~/types";',
                },
            ],
            categorized: {},
        };

        const quietOutput = reportMissingTypeModifiers(mockResult, { quiet: true });
        const normalOutput = reportMissingTypeModifiers(mockResult, { quiet: false });

        // Quiet mode should be shorter (no headings/banners)
        expect(quietOutput.length).toBeLessThan(normalOutput.length);

        // Both should contain the core content
        expect(quietOutput).toContain("/src/app.ts");
        expect(normalOutput).toContain("/src/app.ts");

        // Type test
        type cases = [
            Expect<AssertExtends<typeof quietOutput, string>>,
            Expect<AssertExtends<typeof normalOutput, string>>,
        ];
    });

    it("should support normal mode (with headings)", () => {
        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [],
            missingTypeModifiers: [
                {
                    kind: "missing-type-modifier",
                    source: "~/types",
                    file: "/src/app.ts",
                    line: 3,
                    content: 'import { User } from "~/types";',
                    toString: () => 'import { User } from "~/types";',
                },
            ],
            categorized: {},
        };

        const output = reportMissingTypeModifiers(mockResult, { quiet: false });

        // Should contain heading/banner
        expect(output).toMatch(/missing.*type.*modifier/i);

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should handle empty results", () => {
        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [],
            missingTypeModifiers: [],
            categorized: {},
        };

        const output = reportMissingTypeModifiers(mockResult, { quiet: false });

        // Should indicate no issues found
        expect(output).toMatch(/no.*missing.*type.*modifier/i);

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should apply color coding to output", () => {
        // Use a real file that exists
        const realFile = resolve(process.cwd(), "src/typed.ts");

        const mockResult: AnalysisResult = {
            files: [],
            combinedImports: [],
            missingTypeModifiers: [
                {
                    kind: "missing-type-modifier",
                    source: "~/types",
                    file: realFile,
                    line: 3,
                    content: 'import { User } from "~/types";',
                    toString: () => 'import { User } from "~/types";',
                },
            ],
            categorized: {},
        };

        const output = reportMissingTypeModifiers(mockResult, { quiet: false });

        // Should use chalk for formatting (test by checking structure, not ANSI codes)
        // Chalk may strip colors in test environment, so check content instead
        expect(output).toContain("Line 3:");
        expect(output).toContain("Source:");
        expect(output).toContain("Import:");

        // Type test
        type cases = [
            Expect<AssertExtends<typeof output, string>>,
        ];
    });

    it("should verify function signature types", () => {
        // Type-only test to verify function signatures
        const fn = reportMissingTypeModifiers;

        type cases = [
            Expect<AssertExtends<typeof fn, (result: AnalysisResult, options: { quiet: boolean }) => string>>,
        ];
    });
});
