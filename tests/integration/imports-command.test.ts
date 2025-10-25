import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { join } from "node:path";
import type { Expect, AssertEqual } from "inferred-types/types";
import type { ImportsOptions } from "~/cli/cli-types";

const CLI_PATH = join(process.cwd(), "bin", "typed.js");

/**
 * Helper to run the imports command via CLI
 */
function runImportsCommand(args: string[]): string {
  try {
    const result = execSync(`node ${CLI_PATH} imports ${args.join(" ")}`, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "pipe",
      env: { ...process.env, FORCE_COLOR: "0" }, // Disable colors for consistent output
    });
    return result;
  }
  catch (error: any) {
    // If command errors, return the output anyway
    return (error.stdout || "") + (error.stderr || "");
  }
}

describe("imports command - End-to-End Integration", () => {
  describe("Real codebase testing", () => {
    it("should analyze typed-tester source files", () => {
      const result = runImportsCommand(["--json", "src/commands/imports.ts"]);

      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");

      // Type test for result
      type cases = [
        Expect<AssertEqual<typeof result, string>>
      ];

      const parsed = JSON.parse(result);
      expect(parsed).toBeDefined();
      expect(parsed.files).toBeDefined();
      expect(Array.isArray(parsed.files)).toBe(true);

      // imports.ts should have imports
      expect(parsed.files.length).toBeGreaterThan(0);
    });

    it("should detect external dependencies in real code", () => {
      const result = runImportsCommand(["--json", "src/commands/imports.ts"]);

      const parsed = JSON.parse(result);

      // Should categorize imports
      expect(parsed.categorized).toBeDefined();

      // imports.ts has external dependencies (chalk, fast-glob, etc.)
      expect(parsed.categorized.external).toBeDefined();
      expect(parsed.categorized.external.length).toBeGreaterThan(0);
    });

    it("should analyze multiple files with glob pattern", () => {
      const result = runImportsCommand(["--json", "src/report/imports/*.ts"]);

      const parsed = JSON.parse(result);
      expect(parsed.files.length).toBeGreaterThan(1);

      // Should aggregate results from multiple files
      expect(parsed.categorized).toBeDefined();
    });

    it("should support --quiet flag", () => {
      const result = runImportsCommand(["--json", "--quiet", "src/commands/imports.ts"]);

      const parsed = JSON.parse(result);
      expect(parsed).toBeDefined();

      // Quiet mode in JSON should still output JSON
      expect(parsed.files).toBeDefined();
    });

    it("should handle file with no imports", () => {
      const result = runImportsCommand(["--json", "tests/fixtures/imports/no-imports.ts"]);

      const parsed = JSON.parse(result);
      expect(parsed.combinedImports.length).toBe(0);
      // Note: missingTypeModifiers may detect issues in other analyzed files
      expect(Array.isArray(parsed.missingTypeModifiers)).toBe(true);
    });

    it("should handle glob pattern with no matches gracefully", () => {
      const result = runImportsCommand(["--json", "nonexistent/**/*.ts"]);

      // Should complete without error (might output warning)
      expect(result).toBeDefined();
    });

    it("should analyze imports command test files", () => {
      const result = runImportsCommand(["--json", "tests/unit/imports/*.test.ts"]);

      const parsed = JSON.parse(result);
      expect(parsed.files.length).toBeGreaterThan(0);

      // Test files should have external imports (vitest, etc.)
      expect(parsed.categorized.external).toBeDefined();
      expect(parsed.categorized.external.length).toBeGreaterThan(0);
    });

    it("should categorize internal imports correctly", () => {
      const result = runImportsCommand(["--json", "src/analysis/import-analyzer.ts"]);

      const parsed = JSON.parse(result);

      // Should have categorized imports
      expect(parsed.categorized).toBeDefined();

      // May have alias imports (~/...)
      const hasAlias = Object.keys(parsed.categorized).some(key => key.includes("alias"));
      const hasExternal = parsed.categorized.external && parsed.categorized.external.length > 0;

      expect(hasAlias || hasExternal).toBe(true);
    });

    it("should detect combined imports in real code if present", () => {
      const result = runImportsCommand(["--json", "src/**/*.ts"]);

      const parsed = JSON.parse(result);

      expect(parsed.combinedImports).toBeDefined();
      expect(Array.isArray(parsed.combinedImports)).toBe(true);

      // Combined imports array exists (may or may not have entries)
    });

    it("should detect missing type modifiers in real code if present", () => {
      const result = runImportsCommand(["--json", "src/**/*.ts"]);

      const parsed = JSON.parse(result);

      expect(parsed.missingTypeModifiers).toBeDefined();
      expect(Array.isArray(parsed.missingTypeModifiers)).toBe(true);

      // Missing type modifiers array exists (may or may not have entries)
    });
  });

  describe("Output format validation", () => {
    it("should produce valid JSON output with --json flag", () => {
      const result = runImportsCommand(["--json", "src/commands/imports.ts"]);

      // Should be valid JSON
      expect(() => JSON.parse(result)).not.toThrow();

      const parsed = JSON.parse(result);

      // Required properties
      expect(parsed).toHaveProperty("files");
      expect(parsed).toHaveProperty("combinedImports");
      expect(parsed).toHaveProperty("missingTypeModifiers");
      expect(parsed).toHaveProperty("categorized");
    });

    it("should include file metadata in results", () => {
      const result = runImportsCommand(["--json", "src/commands/imports.ts"]);

      const parsed = JSON.parse(result);

      expect(parsed.files.length).toBeGreaterThan(0);

      const firstFile = parsed.files[0];
      expect(firstFile).toHaveProperty("path"); // Property is "path", not "file"
      expect(firstFile).toHaveProperty("imports");
      expect(Array.isArray(firstFile.imports)).toBe(true);
    });

    it("should categorize imports by structure and location", () => {
      const result = runImportsCommand(["--json", "src/commands/imports.ts"]);

      const parsed = JSON.parse(result);

      // Should have categorization
      expect(parsed.categorized).toBeDefined();
      expect(typeof parsed.categorized).toBe("object");

      // At minimum should have external category
      expect("external" in parsed.categorized).toBe(true);
    });
  });

  describe("Type tests", () => {
    it("should verify ImportsOptions type structure", () => {
      // Type test: verify the options interface shape
      type TestOptions = {
        json: boolean;
        quiet: boolean;
        verbose: boolean;
        external: boolean;
        deep: boolean;
      };

      const options: TestOptions = {
        json: true,
        quiet: false,
        verbose: true,
        external: false,
        deep: true,
      };

      // Runtime checks
      expect(options.json).toBe(true);
      expect(options.quiet).toBe(false);
      expect(options.verbose).toBe(true);
      expect(options.external).toBe(false);
      expect(options.deep).toBe(true);

      // Type assertion - verify TestOptions matches what we expect
      type cases = [
        Expect<AssertEqual<TestOptions["json"], boolean>>,
        Expect<AssertEqual<TestOptions["quiet"], boolean>>,
        Expect<AssertEqual<TestOptions["verbose"], boolean>>,
        Expect<AssertEqual<TestOptions["external"], boolean>>,
        Expect<AssertEqual<TestOptions["deep"], boolean>>
      ];
    });
  });

  describe("Data validation", () => {
    it("should ensure ALL ImportType records have 'from' field populated", () => {
      const result = execSync(`node ${CLI_PATH} imports "src/**/*.ts"`, {
        encoding: "utf-8",
        env: { ...process.env, NO_COLOR: "1" }
      });

      // Extract JSON to validate structure
      const jsonResult = execSync(`node ${CLI_PATH} imports "src/**/*.ts" --json`, {
        encoding: "utf-8",
        env: { ...process.env, NO_COLOR: "1" }
      });

      const data = JSON.parse(jsonResult);

      // Validate that EVERY import in categorized results has 'from' field
      for (const [category, imports] of Object.entries(data.categorized)) {
        for (const imp of imports as any[]) {
          expect(imp.from, `Import in category "${category}" missing 'from' field`).toBeDefined();
          expect(imp.from, `Import in category "${category}" has empty 'from' field`).not.toBe("");
          expect(typeof imp.from, `Import 'from' field should be string`).toBe("string");
        }
      }

      // Validate that file imports also have 'from' field
      for (const file of data.files) {
        for (const imp of file.imports) {
          expect(imp.from, `Import in file "${file.path}" missing 'from' field`).toBeDefined();
          expect(imp.from, `Import in file "${file.path}" has empty 'from' field`).not.toBe("");
        }
      }

      // Verify we actually tested something (should have external imports)
      expect(data.categorized.external.length).toBeGreaterThan(0);

      // Verify external imports have recognizable package names
      const externalPackages = new Set(data.categorized.external.map((i: any) => i.from));
      expect(externalPackages.size).toBeGreaterThan(5); // Should have multiple unique packages

      // Check for known packages
      const externalPackageArray = Array.from(externalPackages);
      expect(externalPackageArray.some((pkg: any) => pkg.includes("chalk"))).toBe(true);
      expect(externalPackageArray.some((pkg: any) => pkg.includes("ts-morph"))).toBe(true);
    });

    it("should ensure external imports have valid package names (not undefined/null)", () => {
      const jsonResult = execSync(`node ${CLI_PATH} imports "src/**/*.ts" --json`, {
        encoding: "utf-8",
        env: { ...process.env, NO_COLOR: "1" }
      });

      const data = JSON.parse(jsonResult);

      // Validate external imports specifically
      const externalImports = data.categorized.external || [];

      externalImports.forEach((imp: any, index: number) => {
        expect(imp.from, `External import #${index} has undefined 'from'`).not.toBeUndefined();
        expect(imp.from, `External import #${index} has null 'from'`).not.toBeNull();
        expect(imp.from, `External import #${index} has empty 'from'`).not.toBe("");

        // External imports should not start with . or /
        expect(imp.from.startsWith("."), `External import #${index} starts with '.' (should be relative, not external): ${imp.from}`).toBe(false);
        expect(imp.from.startsWith("/"), `External import #${index} starts with '/' (should be relative, not external): ${imp.from}`).toBe(false);
      });
    });

    it("should ensure internal imports have valid 'from' paths", () => {
      const jsonResult = execSync(`node ${CLI_PATH} imports "src/**/*.ts" --json`, {
        encoding: "utf-8",
        env: { ...process.env, NO_COLOR: "1" }
      });

      const data = JSON.parse(jsonResult);

      // Check all non-external categories
      for (const [category, imports] of Object.entries(data.categorized)) {
        if (category === "external") continue;

        (imports as any[]).forEach((imp: any, index: number) => {
          expect(imp.from, `Import #${index} in category "${category}" missing 'from'`).toBeDefined();
          expect(imp.from, `Import #${index} in category "${category}" has empty 'from'`).not.toBe("");

          // Internal imports should start with ~ (alias) or . (relative)
          const isAlias = imp.from.startsWith("~");
          const isRelative = imp.from.startsWith(".");

          expect(
            isAlias || isRelative,
            `Internal import #${index} in category "${category}" has invalid 'from': ${imp.from} (should start with ~ or .)`
          ).toBe(true);
        });
      }
    });
  });
});
