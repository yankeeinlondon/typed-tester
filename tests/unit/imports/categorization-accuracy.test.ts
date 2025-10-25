import { describe, it, expect } from "vitest";
import { Project } from "ts-morph";
import { join } from "pathe";
import { analyzeImports } from "~/analysis/import-analyzer";

/**
 * **CRITICAL TEST: Categorization Accuracy with Known Fixture**
 *
 * This test uses a fixture file with EXACTLY known imports and verifies
 * that the categorization is 100% accurate.
 *
 * If this test fails, the categorization logic is BROKEN.
 */
describe("Import Categorization Accuracy", () => {
  it("should categorize imports EXACTLY as expected in fixture file", () => {
    // Create in-memory project with our fixture file
    const project = new Project({
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        allowJs: true,
        checkJs: false,
        baseUrl: ".",
        paths: {
          "~/*": ["tests/fixtures/imports/*"]
        }
      }
    });

    const fixturePath = join(process.cwd(), "tests/fixtures/imports/categorization-test.ts");
    project.addSourceFileAtPath(fixturePath);

    // Analyze imports
    const result = analyzeImports([fixturePath], { project });

    // EXPECTED VALUES - These MUST match exactly or test fails
    const expected = {
      external: 3,
      relativeAliasNamed: 2,
      relativeAliasOffsetNamed: 2,
      relativePeerNamed: 2,
      relativeParentNamed: 1,
      relativeChildNamed: 1,
      relativeParentDefault: 1,
      relativePeerDefault: 1,
      total: 13
    };

    // Extract actual counts
    const actual = {
      external: result.categorized.external?.length || 0,
      relativeAliasNamed: result.categorized.relativeAliasNamed?.length || 0,
      relativeAliasOffsetNamed: result.categorized.relativeAliasOffsetNamed?.length || 0,
      relativePeerNamed: result.categorized.relativePeerNamed?.length || 0,
      relativeParentNamed: result.categorized.relativeParentNamed?.length || 0,
      relativeChildNamed: result.categorized.relativeChildNamed?.length || 0,
      relativeParentDefault: result.categorized.relativeParentDefault?.length || 0,
      relativePeerDefault: result.categorized.relativePeerDefault?.length || 0,
      total: Object.values(result.categorized).reduce((sum, arr) => sum + arr.length, 0)
    };

    // ASSERT EXACT MATCHES - These will FAIL if categorization is wrong
    expect(actual.external, "External imports count").toBe(expected.external);
    expect(actual.relativeAliasNamed, "Alias named imports count").toBe(expected.relativeAliasNamed);
    expect(actual.relativeAliasOffsetNamed, "Alias offset named imports count").toBe(expected.relativeAliasOffsetNamed);
    expect(actual.relativePeerNamed, "Peer named imports count").toBe(expected.relativePeerNamed);
    expect(actual.relativeParentNamed, "Parent named imports count").toBe(expected.relativeParentNamed);
    expect(actual.relativeChildNamed, "Child named imports count").toBe(expected.relativeChildNamed);
    expect(actual.relativeParentDefault, "Parent default imports count").toBe(expected.relativeParentDefault);
    expect(actual.relativePeerDefault, "Peer default imports count").toBe(expected.relativePeerDefault);
    expect(actual.total, "Total imports count").toBe(expected.total);

    // Verify specific imports are categorized correctly
    const externalPackages = result.categorized.external?.map(i => i.from) || [];
    expect(externalPackages, "External packages").toEqual(
      expect.arrayContaining(["chalk", "ts-morph", "pathe"])
    );

    // Verify alias imports have correct 'from' values
    const aliasImports = result.categorized.relativeAliasNamed?.map(i => i.from) || [];
    expect(aliasImports, "Alias imports should start with ~/").toEqual(
      expect.arrayContaining(["~/utils", "~/types"])
    );

    // Log detailed breakdown on failure
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      console.log("\n❌ CATEGORIZATION MISMATCH:");
      console.log("Expected:", expected);
      console.log("Actual:  ", actual);
      console.log("\nAll categories found:", Object.keys(result.categorized));
      console.log("\nDetailed breakdown:");
      for (const [category, imports] of Object.entries(result.categorized)) {
        if (imports.length > 0) {
          console.log(`  ${category}: ${imports.length}`);
          imports.forEach((imp: any) => {
            console.log(`    - from "${imp.from}" at line ${imp.line}`);
          });
        }
      }
    }
  });

  it("should correctly identify external vs internal imports", () => {
    const project = new Project({
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        allowJs: true,
        checkJs: false,
        baseUrl: ".",
        paths: {
          "~/*": ["tests/fixtures/imports/*"]
        }
      }
    });

    const fixturePath = join(process.cwd(), "tests/fixtures/imports/categorization-test.ts");
    project.addSourceFileAtPath(fixturePath);

    const result = analyzeImports([fixturePath], { project });

    // External imports should NOT start with ~ or .
    const external = result.categorized.external || [];
    external.forEach((imp, idx) => {
      expect(imp.from.startsWith("~"), `External import #${idx} starts with ~ (should be categorized as alias): ${imp.from}`).toBe(false);
      expect(imp.from.startsWith("."), `External import #${idx} starts with . (should be categorized as relative): ${imp.from}`).toBe(false);
    });

    // Internal imports should start with ~ or .
    for (const [category, imports] of Object.entries(result.categorized)) {
      if (category === "external") continue;

      (imports as any[]).forEach((imp, idx) => {
        const isAlias = imp.from.startsWith("~");
        const isRelative = imp.from.startsWith(".");
        expect(
          isAlias || isRelative,
          `Internal import #${idx} in category "${category}" has invalid 'from': ${imp.from} (should start with ~ or .)`
        ).toBe(true);
      });
    }
  });

  it("should match structure naming (named vs default) in categories", () => {
    const project = new Project({
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        allowJs: true,
        checkJs: false,
        baseUrl: ".",
        paths: {
          "~/*": ["tests/fixtures/imports/*"]
        }
      }
    });

    const fixturePath = join(process.cwd(), "tests/fixtures/imports/categorization-test.ts");
    project.addSourceFileAtPath(fixturePath);

    const result = analyzeImports([fixturePath], { project });

    // Categories ending in "Named" should have named imports
    const namedCategories = Object.keys(result.categorized).filter(cat => cat.endsWith("Named"));
    namedCategories.forEach(category => {
      const imports = result.categorized[category] || [];
      imports.forEach((imp: any) => {
        // Named imports should have { } in content
        expect(
          imp.content.includes("{") || imp.content.includes("import type"),
          `Import in "${category}" should be a named import but got: ${imp.content}`
        ).toBe(true);
      });
    });

    // Categories ending in "Default" should have default imports
    const defaultCategories = Object.keys(result.categorized).filter(cat => cat.endsWith("Default"));
    defaultCategories.forEach(category => {
      const imports = result.categorized[category] || [];
      imports.forEach((imp: any) => {
        // Default imports should NOT have { }
        expect(
          !imp.content.includes("{"),
          `Import in "${category}" should be a default import but got: ${imp.content}`
        ).toBe(true);
      });
    });
  });
});
