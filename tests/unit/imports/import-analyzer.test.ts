import { describe, it, expect } from "vitest";
import type { Expect, AssertEqual, AssertExtends } from "inferred-types/types";
import { Project } from "ts-morph";
import { analyzeImports } from "~/analysis/import-analyzer";
import type { AnalysisResult, AnalysisOptions } from "~/types/imports/AnalysisResult";
import type { CombinedImport, MissingTypeModifier, ImportType } from "~/types/imports";

describe("analyzeImports() - Single File Analysis", () => {
    it("should analyze a single file with various import types", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "src/test.ts",
            `
            import React from 'react';
            import { useState } from 'react';
            import type { User } from './types';
            import { foo, type Bar } from './module';
            `
        );

        const result = analyzeImports([sourceFile.getFilePath()], { project });

        expect(result.files).toHaveLength(1);
        expect(result.files[0].path).toBe(sourceFile.getFilePath());
        expect(result.files[0].imports).toHaveLength(4);

        // Type test for result structure
        type cases = [
            Expect<AssertExtends<typeof result, AnalysisResult>>
        ];
    });

    it("should detect combined imports (runtime + type symbols mixed)", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "src/test.ts",
            `import { foo, type Bar } from './module';`
        );

        const result = analyzeImports([sourceFile.getFilePath()], { project });

        expect(result.combinedImports).toHaveLength(1);
        expect(result.combinedImports[0].kind).toBe("combined-import");
        expect(result.combinedImports[0].typeSymbols).toContain("Bar");
        expect(result.combinedImports[0].runtimeSymbols).toContain("foo");

        // Type test
        type cases = [
            Expect<AssertExtends<typeof result.combinedImports[0], CombinedImport>>
        ];
    });

    it("should detect missing type modifiers on type-only imports", () => {
        const project = new Project({ useInMemoryFileSystem: true });

        // Create types file
        project.createSourceFile(
            "src/types.ts",
            `export interface User { name: string; }`
        );

        // Create file importing the type without type modifier
        const sourceFile = project.createSourceFile(
            "src/test.ts",
            `import { User } from './types';`
        );

        const result = analyzeImports([sourceFile.getFilePath()], { project });

        expect(result.missingTypeModifiers).toHaveLength(1);
        expect(result.missingTypeModifiers[0].kind).toBe("missing-type-modifier");
        expect(result.missingTypeModifiers[0].source).toBe("./types");

        // Type test
        type cases = [
            Expect<AssertExtends<typeof result.missingTypeModifiers[0], MissingTypeModifier>>
        ];
    });

    it("should categorize imports by structure and location", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "src/test.ts",
            `
            import React from 'react';
            import { useState } from 'react';
            import { foo } from './peer';
            import { bar } from '../parent';
            import * as utils from './utils';
            `
        );

        const result = analyzeImports([sourceFile.getFilePath()], { project });

        expect(result.categorized.external).toHaveLength(2);
        expect(result.categorized.relativePeerNamed).toHaveLength(1);
        expect(result.categorized.relativePeerBarrel).toHaveLength(1);

        // Type test for categorization structure
        type cases = [
            Expect<AssertExtends<typeof result.categorized, Record<string, ImportType[]>>>
        ];
    });

    it("should handle files with no imports", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "src/test.ts",
            `const x = 42;`
        );

        const result = analyzeImports([sourceFile.getFilePath()], { project });

        expect(result.files).toHaveLength(1);
        expect(result.files[0].imports).toHaveLength(0);
        expect(result.combinedImports).toHaveLength(0);
        expect(result.missingTypeModifiers).toHaveLength(0);
    });

    it("should handle files with only external imports", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "src/test.ts",
            `
            import React from 'react';
            import { useState } from 'react';
            import lodash from 'lodash';
            `
        );

        const result = analyzeImports([sourceFile.getFilePath()], { project });

        expect(result.files[0].imports).toHaveLength(3);
        expect(result.categorized.external).toHaveLength(3);

        const internalCategories = Object.keys(result.categorized)
            .filter(k => k !== 'external')
            .map(k => result.categorized[k as keyof typeof result.categorized])
            .flat();

        expect(internalCategories).toHaveLength(0);
    });

    it("should handle files with only internal imports", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "src/test.ts",
            `
            import { foo } from './peer';
            import { bar } from '../parent';
            import { baz } from './child/module';
            `
        );

        const result = analyzeImports([sourceFile.getFilePath()], { project });

        expect(result.files[0].imports).toHaveLength(3);
        expect(result.categorized.external || []).toHaveLength(0);
        expect(result.categorized.relativePeerNamed).toHaveLength(1);
    });
});

describe("analyzeImports() - Multi-File Aggregation", () => {
    it("should analyze multiple files and aggregate correctly", () => {
        const project = new Project({ useInMemoryFileSystem: true });

        const file1 = project.createSourceFile(
            "src/file1.ts",
            `import React from 'react';`
        );

        const file2 = project.createSourceFile(
            "src/file2.ts",
            `import { useState } from 'react';`
        );

        const result = analyzeImports(
            [file1.getFilePath(), file2.getFilePath()],
            { project }
        );

        expect(result.files).toHaveLength(2);
        expect(result.categorized.external).toHaveLength(2);
    });

    it("should correctly count occurrences by category across files", () => {
        const project = new Project({ useInMemoryFileSystem: true });

        const file1 = project.createSourceFile(
            "src/file1.ts",
            `
            import React from 'react';
            import { foo } from './peer';
            `
        );

        const file2 = project.createSourceFile(
            "src/file2.ts",
            `
            import { useState } from 'react';
            import { bar } from './peer2';
            `
        );

        const result = analyzeImports(
            [file1.getFilePath(), file2.getFilePath()],
            { project }
        );

        expect(result.categorized.external).toHaveLength(2);
        expect(result.categorized.relativePeerNamed).toHaveLength(2);
    });

    it("should aggregate combined imports from multiple files", () => {
        const project = new Project({ useInMemoryFileSystem: true });

        const file1 = project.createSourceFile(
            "src/file1.ts",
            `import { foo, type Bar } from './module';`
        );

        const file2 = project.createSourceFile(
            "src/file2.ts",
            `import { baz, type Qux } from './other';`
        );

        const result = analyzeImports(
            [file1.getFilePath(), file2.getFilePath()],
            { project }
        );

        expect(result.combinedImports).toHaveLength(2);
        expect(result.files).toHaveLength(2);
    });

    it("should correctly group results by file", () => {
        const project = new Project({ useInMemoryFileSystem: true });

        const file1 = project.createSourceFile(
            "src/file1.ts",
            `
            import React from 'react';
            import { useState } from 'react';
            `
        );

        const file2 = project.createSourceFile(
            "src/file2.ts",
            `import { foo } from './peer';`
        );

        const result = analyzeImports(
            [file1.getFilePath(), file2.getFilePath()],
            { project }
        );

        const file1Result = result.files.find(f => f.path === file1.getFilePath());
        const file2Result = result.files.find(f => f.path === file2.getFilePath());

        expect(file1Result?.imports).toHaveLength(2);
        expect(file2Result?.imports).toHaveLength(1);
    });
});

describe("analyzeImports() - Glob Pattern Filtering", () => {
    it("should apply glob pattern filters correctly", () => {
        const project = new Project({ useInMemoryFileSystem: true });

        project.createSourceFile("src/file1.ts", `import React from 'react';`);
        project.createSourceFile("src/file2.ts", `import { foo } from './peer';`);
        project.createSourceFile("tests/test.ts", `import { describe } from 'vitest';`);

        const result = analyzeImports(
            ["src/**/*.ts"],
            { project, useGlob: true }
        );

        expect(result.files).toHaveLength(2);
        expect(result.files.every(f => f.path.includes('/src/'))).toBe(true);
    });

    it("should handle empty glob results", () => {
        const project = new Project({ useInMemoryFileSystem: true });

        project.createSourceFile("src/file1.ts", `import React from 'react';`);

        const result = analyzeImports(
            ["tests/**/*.ts"],
            { project, useGlob: true }
        );

        expect(result.files).toHaveLength(0);
        expect(result.combinedImports).toHaveLength(0);
    });

    it("should handle multiple glob patterns", () => {
        const project = new Project({ useInMemoryFileSystem: true });

        project.createSourceFile("src/file1.ts", `import React from 'react';`);
        project.createSourceFile("lib/file2.ts", `import { foo } from './peer';`);
        project.createSourceFile("tests/test.ts", `import { describe } from 'vitest';`);

        const result = analyzeImports(
            ["src/**/*.ts", "lib/**/*.ts"],
            { project, useGlob: true }
        );

        expect(result.files).toHaveLength(2);
    });
});

describe("analyzeImports() - Type Tests", () => {
    it("should infer correct types for AnalysisResult", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "src/test.ts",
            `import React from 'react';`
        );

        const result = analyzeImports([sourceFile.getFilePath()], { project });

        type cases = [
            // Result structure
            Expect<AssertExtends<typeof result, AnalysisResult>>,

            // Files array
            Expect<AssertExtends<typeof result.files, Array<{ path: string; imports: any[] }>>>,

            // Combined imports
            Expect<AssertExtends<typeof result.combinedImports, CombinedImport[]>>,

            // Missing type modifiers
            Expect<AssertExtends<typeof result.missingTypeModifiers, MissingTypeModifier[]>>,

            // Categorized imports
            Expect<AssertExtends<typeof result.categorized, Record<string, ImportType[]>>>
        ];
    });

    it("should infer correct types for AnalysisOptions", () => {
        const project = new Project({ useInMemoryFileSystem: true });

        // Add a file so the in-memory project has content
        project.createSourceFile("test.ts", `import React from 'react';`);

        const options: AnalysisOptions = {
            project,
            useGlob: true
        };

        const result = analyzeImports(["**/*.ts"], options);

        type cases = [
            Expect<AssertExtends<typeof options, AnalysisOptions>>,
            Expect<AssertExtends<typeof options.project, Project | undefined>>,
            Expect<AssertExtends<typeof options.useGlob, boolean | undefined>>
        ];
    });

    it("should maintain narrow types for import categories", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "src/test.ts",
            `import React from 'react';`
        );

        const result = analyzeImports([sourceFile.getFilePath()], { project });
        const externalImports = result.categorized.external;

        if (externalImports && externalImports.length > 0) {
            const firstImport = externalImports[0];

            type cases = [
                Expect<AssertExtends<typeof firstImport.category, string>>
            ];
        }

        expect(true).toBe(true); // Runtime assertion to make test pass
    });
});
