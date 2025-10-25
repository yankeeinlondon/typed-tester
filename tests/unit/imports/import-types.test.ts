import { describe, it, expect } from "vitest";
import type { Expect, AssertEqual, AssertExtends, AssertTrue, AssertFalse } from "inferred-types/types";
import type {
  ImportType,
  ImportCategory,
  CombinedImport,
  MissingTypeModifier,
  AnalysisResult,
  AnalysisOptions,
  FileImportSummary
} from "~/types/imports";
import type {
  extractImports,
  classifyImportSymbols,
  getImportStructure,
  getImportLocation
} from "~/ast/imports";
import type { analyzeImports } from "~/analysis/import-analyzer";

/**
 * **COMPREHENSIVE TYPE TESTS FOR IMPORTS FEATURE**
 *
 * This file contains type-level tests for ALL types and functions
 * in the imports analysis feature.
 *
 * For a library that's ALL ABOUT TYPE TESTING, we need comprehensive
 * type coverage, not just runtime tests.
 */
describe("Import Types - Type Tests", () => {
  describe("ImportType structure", () => {
    it("should have correct field types", () => {
      type TestImportType = ImportType;

      // Test that all required fields exist with correct types
      type cases = [
        // Has required fields
        Expect<AssertExtends<TestImportType, { category: ImportCategory }>>,
        Expect<AssertExtends<TestImportType, { from: string }>>,
        Expect<AssertExtends<TestImportType, { file: string }>>,
        Expect<AssertExtends<TestImportType, { line: number }>>,
        Expect<AssertExtends<TestImportType, { content: string }>>,
        Expect<AssertExtends<TestImportType, { toString: () => string }>>,

        // Field types are exact
        Expect<AssertEqual<TestImportType["from"], string>>,
        Expect<AssertEqual<TestImportType["file"], string>>,
        Expect<AssertEqual<TestImportType["line"], number>>,
        Expect<AssertEqual<TestImportType["content"], string>>,
        Expect<AssertEqual<TestImportType["toString"], () => string>>,

        // Category is narrow type, not just string
        AssertFalse<AssertEqual<TestImportType["category"], string>>,
        Expect<AssertExtends<TestImportType["category"], string>>,
      ];
    });

    it("should verify ImportCategory is a narrow union type", () => {
      type TestCategory = ImportCategory;

      type cases = [
        // Is a string
        Expect<AssertExtends<TestCategory, string>>,

        // Is NOT just 'string' (it's a narrow union)
        AssertFalse<AssertEqual<TestCategory, string>>,

        // Specific categories are assignable
        Expect<AssertExtends<"external", TestCategory>>,
        Expect<AssertExtends<"relativeAliasNamed", TestCategory>>,
        Expect<AssertExtends<"relativeAliasOffsetNamed", TestCategory>>,
        Expect<AssertExtends<"relativePeerNamed", TestCategory>>,
        Expect<AssertExtends<"relativeParentNamed", TestCategory>>,
        Expect<AssertExtends<"relativeChildNamed", TestCategory>>,
        Expect<AssertExtends<"relativeParentDefault", TestCategory>>,
        Expect<AssertExtends<"relativePeerDefault", TestCategory>>,

        // Invalid categories are NOT assignable
        // @ts-expect-error - 'invalid' is not a valid category
        AssertTrue<AssertExtends<"invalid", TestCategory>>,
      ];
    });
  });

  describe("CombinedImport structure", () => {
    it("should have correct field types", () => {
      type TestCombinedImport = CombinedImport;

      type cases = [
        // Required fields
        Expect<AssertExtends<TestCombinedImport, { kind: "combined-import" }>>,
        Expect<AssertExtends<TestCombinedImport, { source: string }>>,
        Expect<AssertExtends<TestCombinedImport, { typeSymbols: string[] }>>,
        Expect<AssertExtends<TestCombinedImport, { runtimeSymbols: string[] }>>,
        Expect<AssertExtends<TestCombinedImport, { file: string }>>,
        Expect<AssertExtends<TestCombinedImport, { line: number }>>,
        Expect<AssertExtends<TestCombinedImport, { hasTypeModifier: boolean }>>,
        Expect<AssertExtends<TestCombinedImport, { content: string }>>,
        Expect<AssertExtends<TestCombinedImport, { toString: () => string }>>,

        // Kind is literal type, not just string
        Expect<AssertEqual<TestCombinedImport["kind"], "combined-import">>,
        AssertFalse<AssertEqual<TestCombinedImport["kind"], string>>,

        // Arrays are correctly typed
        Expect<AssertEqual<TestCombinedImport["typeSymbols"], string[]>>,
        Expect<AssertEqual<TestCombinedImport["runtimeSymbols"], string[]>>,
      ];
    });
  });

  describe("MissingTypeModifier structure", () => {
    it("should have correct field types", () => {
      type TestMissingTypeModifier = MissingTypeModifier;

      type cases = [
        // Required fields
        Expect<AssertExtends<TestMissingTypeModifier, { kind: "missing-type-modifier" }>>,
        Expect<AssertExtends<TestMissingTypeModifier, { source: string }>>,
        Expect<AssertExtends<TestMissingTypeModifier, { file: string }>>,
        Expect<AssertExtends<TestMissingTypeModifier, { line: number }>>,
        Expect<AssertExtends<TestMissingTypeModifier, { content: string }>>,
        Expect<AssertExtends<TestMissingTypeModifier, { toString: () => string }>>,

        // Kind is literal type
        Expect<AssertEqual<TestMissingTypeModifier["kind"], "missing-type-modifier">>,
        AssertFalse<AssertEqual<TestMissingTypeModifier["kind"], string>>,
      ];
    });
  });

  describe("AnalysisResult structure", () => {
    it("should have correct field types", () => {
      type TestAnalysisResult = AnalysisResult;

      type cases = [
        // Required fields
        Expect<AssertExtends<TestAnalysisResult, { files: FileImportSummary[] }>>,
        Expect<AssertExtends<TestAnalysisResult, { combinedImports: CombinedImport[] }>>,
        Expect<AssertExtends<TestAnalysisResult, { missingTypeModifiers: MissingTypeModifier[] }>>,
        Expect<AssertExtends<TestAnalysisResult, { categorized: Record<string, ImportType[]> }>>,

        // Array types are correct
        Expect<AssertEqual<TestAnalysisResult["files"], FileImportSummary[]>>,
        Expect<AssertEqual<TestAnalysisResult["combinedImports"], CombinedImport[]>>,
        Expect<AssertEqual<TestAnalysisResult["missingTypeModifiers"], MissingTypeModifier[]>>,

        // Categorized is a record with ImportType arrays
        Expect<AssertExtends<TestAnalysisResult["categorized"], Record<string, ImportType[]>>>,
      ];
    });

    it("should verify FileImportSummary structure", () => {
      type TestFileImportSummary = FileImportSummary;

      type cases = [
        Expect<AssertExtends<TestFileImportSummary, { path: string }>>,
        Expect<AssertExtends<TestFileImportSummary, { imports: ImportType[] }>>,
        Expect<AssertEqual<TestFileImportSummary["path"], string>>,
        Expect<AssertEqual<TestFileImportSummary["imports"], ImportType[]>>,
      ];
    });
  });

  describe("AnalysisOptions structure", () => {
    it("should have correct optional field types", () => {
      type TestAnalysisOptions = AnalysisOptions;

      type cases = [
        // All fields are optional
        Expect<AssertExtends<{}, TestAnalysisOptions>>,

        // If project is provided, it has correct type
        Expect<AssertExtends<TestAnalysisOptions, { project?: any }>>,

        // If useGlob is provided, it's a boolean
        Expect<AssertExtends<TestAnalysisOptions, { useGlob?: boolean }>>,
      ];
    });
  });

  describe("Function return type inference", () => {
    it("should verify classifyImportSymbols returns narrow union", () => {
      // Get the return type of the function
      type ClassifyReturn = ReturnType<typeof classifyImportSymbols>;

      type cases = [
        // Returns a narrow union, not just string
        Expect<AssertExtends<ClassifyReturn, string>>,
        AssertFalse<AssertEqual<ClassifyReturn, string>>,

        // Specific values are assignable
        Expect<AssertExtends<"runtime", ClassifyReturn>>,
        Expect<AssertExtends<"type", ClassifyReturn>>,
        Expect<AssertExtends<"mixed", ClassifyReturn>>,

        // Should be exactly the union
        Expect<AssertEqual<ClassifyReturn, "runtime" | "type" | "mixed">>,
      ];
    });

    it("should verify getImportStructure returns narrow union", () => {
      type StructureReturn = ReturnType<typeof getImportStructure>;

      type cases = [
        // Returns a narrow union
        Expect<AssertExtends<StructureReturn, string>>,
        AssertFalse<AssertEqual<StructureReturn, string>>,

        // Specific values are assignable
        Expect<AssertExtends<"barrel", StructureReturn>>,
        Expect<AssertExtends<"named", StructureReturn>>,
        Expect<AssertExtends<"default", StructureReturn>>,
        Expect<AssertExtends<"hybrid", StructureReturn>>,

        // Should be exactly the union
        Expect<AssertEqual<StructureReturn, "barrel" | "named" | "default" | "hybrid">>,
      ];
    });

    it("should verify getImportLocation returns narrow union", () => {
      type LocationReturn = ReturnType<typeof getImportLocation>;

      type cases = [
        // Returns a narrow union
        Expect<AssertExtends<LocationReturn, string>>,
        AssertFalse<AssertEqual<LocationReturn, string>>,

        // Specific values are assignable
        Expect<AssertExtends<"external", LocationReturn>>,
        Expect<AssertExtends<"peer", LocationReturn>>,
        Expect<AssertExtends<"parent", LocationReturn>>,
        Expect<AssertExtends<"child", LocationReturn>>,
        Expect<AssertExtends<"deepChild", LocationReturn>>,
        Expect<AssertExtends<"alias", LocationReturn>>,
        Expect<AssertExtends<"aliasOffset", LocationReturn>>,

        // Should be exactly the union
        Expect<AssertEqual<
          LocationReturn,
          "external" | "peer" | "parent" | "child" | "deepChild" | "alias" | "aliasOffset"
        >>,
      ];
    });

    it("should verify analyzeImports returns AnalysisResult", () => {
      type AnalyzeReturn = ReturnType<typeof analyzeImports>;

      type cases = [
        // Returns AnalysisResult
        Expect<AssertEqual<AnalyzeReturn, AnalysisResult>>,

        // Has all required fields
        Expect<AssertExtends<AnalyzeReturn, { files: FileImportSummary[] }>>,
        Expect<AssertExtends<AnalyzeReturn, { combinedImports: CombinedImport[] }>>,
        Expect<AssertExtends<AnalyzeReturn, { missingTypeModifiers: MissingTypeModifier[] }>>,
        Expect<AssertExtends<AnalyzeReturn, { categorized: Record<string, ImportType[]> }>>,
      ];
    });

    it("should verify extractImports returns ImportDeclaration array", () => {
      type ExtractReturn = ReturnType<typeof extractImports>;

      type cases = [
        // Returns an array
        Expect<AssertExtends<ExtractReturn, any[]>>,

        // Array elements are ImportDeclaration (from ts-morph)
        Expect<AssertExtends<ExtractReturn, import("ts-morph").ImportDeclaration[]>>,
      ];
    });
  });

  describe("Type utility preservation", () => {
    it("should preserve narrow types through the pipeline", () => {
      // Simulate the type flow: location + structure → category
      type Location = "peer" | "parent" | "child";
      type Structure = "named" | "default";

      // Category construction preserves narrow types
      type Category = `relative${Capitalize<Location>}${Capitalize<Structure>}`;

      type cases = [
        // Constructed category is narrow
        Expect<AssertExtends<Category, string>>,
        AssertFalse<AssertEqual<Category, string>>,

        // Specific combinations work
        Expect<AssertExtends<"relativePeerNamed", Category>>,
        Expect<AssertExtends<"relativeParentDefault", Category>>,
        Expect<AssertExtends<"relativeChildNamed", Category>>,

        // All possible combinations are in the union
        Expect<AssertEqual<
          Category,
          | "relativePeerNamed"
          | "relativePeerDefault"
          | "relativeParentNamed"
          | "relativeParentDefault"
          | "relativeChildNamed"
          | "relativeChildDefault"
        >>,
      ];
    });

    it("should verify ImportCategory includes all constructed categories", () => {
      // External is special
      type External = "external";

      // Internal categories are constructed
      type Location = "peer" | "parent" | "child" | "deepChild" | "alias" | "aliasOffset";
      type Structure = "named" | "default" | "barrel" | "hybrid";
      type InternalCategory = `relative${Capitalize<Location>}${Capitalize<Structure>}`;

      // All categories
      type AllCategories = External | InternalCategory;

      type cases = [
        // ImportCategory should extend our constructed type
        Expect<AssertExtends<ImportCategory, AllCategories>>,

        // External is included
        Expect<AssertExtends<"external", ImportCategory>>,

        // Sample internal categories are included
        Expect<AssertExtends<"relativePeerNamed", ImportCategory>>,
        Expect<AssertExtends<"relativeAliasOffsetNamed", ImportCategory>>,
        Expect<AssertExtends<"relativeParentDefault", ImportCategory>>,
      ];
    });
  });

  describe("Discriminated unions", () => {
    it("should discriminate CombinedImport by kind", () => {
      type Import = CombinedImport | MissingTypeModifier;

      // Type narrowing by kind
      type IsCombined<T> = T extends { kind: "combined-import" } ? true : false;
      type IsMissing<T> = T extends { kind: "missing-type-modifier" } ? true : false;

      type cases = [
        // CombinedImport has the right kind
        Expect<AssertTrue<IsCombined<CombinedImport>>>,
        Expect<AssertFalse<IsMissing<CombinedImport>>>,

        // MissingTypeModifier has the right kind
        Expect<AssertTrue<IsMissing<MissingTypeModifier>>>,
        Expect<AssertFalse<IsCombined<MissingTypeModifier>>>,
      ];
    });

    it("should verify type narrowing works in conditionals", () => {
      // This tests that our types support runtime type narrowing
      const handleImport = (imp: CombinedImport | MissingTypeModifier) => {
        if (imp.kind === "combined-import") {
          // Within this block, imp should be narrowed to CombinedImport
          type Narrowed = typeof imp;
          type cases = [
            Expect<AssertEqual<Narrowed, CombinedImport>>,
            Expect<AssertExtends<Narrowed, { typeSymbols: string[] }>>,
            Expect<AssertExtends<Narrowed, { runtimeSymbols: string[] }>>,
          ];
        } else {
          // Within this block, imp should be narrowed to MissingTypeModifier
          type Narrowed = typeof imp;
          type cases = [
            Expect<AssertEqual<Narrowed, MissingTypeModifier>>,
          ];
        }
      };

      // Just to satisfy the test runner
      expect(handleImport).toBeDefined();
    });
  });

  describe("Type safety guarantees", () => {
    it("should prevent invalid category assignments", () => {
      // Valid assignment
      const valid: ImportCategory = "external";
      expect(valid).toBe("external");

      // Invalid assignments should be caught by TypeScript
      // @ts-expect-error - 'invalid' is not a valid category
      const invalid: ImportCategory = "invalid";
      expect(invalid).toBeDefined(); // Just for runtime

      type cases = [
        // Valid categories work
        Expect<AssertExtends<"external", ImportCategory>>,

        // Invalid categories don't work
        // The type system should reject these at compile time
        AssertFalse<AssertExtends<"invalid-category", ImportCategory>>,
      ];
    });

    it("should ensure ImportType is not assignable to partial types", () => {
      // Missing required fields should fail
      type Partial1 = { category: ImportCategory };
      type Partial2 = { from: string };

      type cases = [
        // ImportType extends the partials
        Expect<AssertExtends<ImportType, Partial1>>,
        Expect<AssertExtends<ImportType, Partial2>>,

        // But partials don't extend ImportType
        AssertFalse<AssertExtends<Partial1, ImportType>>,
        AssertFalse<AssertExtends<Partial2, ImportType>>,

        // Full type is required
        Expect<AssertExtends<ImportType, {
          category: ImportCategory;
          from: string;
          file: string;
          line: number;
          content: string;
          toString: () => string;
        }>>,
      ];
    });
  });
});
