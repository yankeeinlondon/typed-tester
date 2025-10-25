import { describe, it, expect } from "vitest";
import { Project } from "ts-morph";
import { join } from "pathe";
import { analyzeImports } from "~/analysis/import-analyzer";

/**
 * **CRITICAL TEST: Re-export Detection**
 *
 * This test verifies that the analyzer detects BOTH import and export statements.
 * Many TypeScript files use `export * from "./foo"` or `export { Bar } from "./baz"`
 * and these should be categorized alongside import statements.
 *
 * **CURRENTLY FAILS** - We only detect `import` statements, not `export` statements.
 */
describe("Re-export Detection", () => {
  it("should detect 'export * from' re-export statements", () => {
    const project = new Project({
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        allowJs: true,
        checkJs: false
      }
    });

    // Create test file with re-exports
    const testFile = project.createSourceFile(
      "test-re-exports.ts",
      `
// Regular imports
import { foo } from "./foo";
import type { Bar } from "./bar";

// Re-exports (these should also be detected!)
export * from "./module-a";
export { specific } from "./module-b";
export type { TypeOnly } from "./module-c";
      `.trim()
    );

    const result = analyzeImports([testFile.getFilePath()], { project });

    // EXPECTED: Should detect 2 imports + 3 re-exports = 5 total
    // ACTUAL: Currently only detects 2 imports
    const totalImports = Object.values(result.categorized).reduce((sum, arr) => sum + arr.length, 0);

    // This will FAIL until we fix re-export detection
    expect(totalImports, "Should detect both imports and re-exports").toBe(5);

    // Verify specific re-exports are detected
    const allImports = result.files[0]?.imports || [];
    const fromModuleA = allImports.find(i => i.from === "./module-a");
    const fromModuleB = allImports.find(i => i.from === "./module-b");
    const fromModuleC = allImports.find(i => i.from === "./module-c");

    expect(fromModuleA, "Should detect 'export * from'").toBeDefined();
    expect(fromModuleB, "Should detect 'export { } from'").toBeDefined();
    expect(fromModuleC, "Should detect 'export type { } from'").toBeDefined();
  });

  it("should verify re-exports are missing from typed-tester codebase analysis", () => {
    // This test documents the current state: we're missing 72 re-exports
    // in the actual codebase

    const project = new Project({
      tsConfigFilePath: join(process.cwd(), "tsconfig.json")
    });

    const sourceFiles = project.getSourceFiles("src/**/*.ts");
    const result = analyzeImports(
      sourceFiles.map(sf => sf.getFilePath()),
      { project }
    );

    const totalAnalyzed = Object.values(result.categorized).reduce((sum, arr) => sum + arr.length, 0);

    // Current state: ~264 imports detected
    // Missing: ~72 re-exports
    // Should be: ~336 total

    console.log(`\n📊 Current analyzer results:`);
    console.log(`  Total imports analyzed: ${totalAnalyzed}`);
    console.log(`  Expected (with re-exports): ~336`);
    console.log(`  Missing: ~72 re-export statements`);

    // Document the gap
    expect(totalAnalyzed).toBeLessThan(300); // Currently true
    // After fix, this should be: expect(totalAnalyzed).toBeGreaterThan(330);
  });
});
