import { describe, it, expect } from "vitest";
import type { Expect, AssertEqual, AssertExtends } from "inferred-types/types";
import { Project, type SourceFile } from "ts-morph";
import {
    extractImports,
    classifyImportSymbols,
    getImportStructure,
    getImportLocation
} from "~/ast/imports";
import type { ImportCategory } from "~/types/imports";

describe("extractImports()", () => {
    it("should extract named imports from source file", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import { foo, bar } from './module';`
        );

        const imports = extractImports(sourceFile);

        expect(imports).toHaveLength(1);
        expect(imports[0].getModuleSpecifierValue()).toBe("./module");

        type cases = [
            Expect<AssertEqual<typeof imports, import("ts-morph").ImportDeclaration[]>>
        ];
    });

    it("should extract default imports", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import React from 'react';`
        );

        const imports = extractImports(sourceFile);

        expect(imports).toHaveLength(1);
        expect(imports[0].getDefaultImport()).toBeDefined();
    });

    it("should extract type-only imports", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import type { User } from './types';`
        );

        const imports = extractImports(sourceFile);

        expect(imports).toHaveLength(1);
        expect(imports[0].isTypeOnly()).toBe(true);
    });

    it("should extract multiple import declarations", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `
            import React from 'react';
            import { useState } from 'react';
            import type { User } from './types';
            import './styles.css';
            `
        );

        const imports = extractImports(sourceFile);

        expect(imports).toHaveLength(4);
    });

    it("should extract namespace imports", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import * as utils from './utils';`
        );

        const imports = extractImports(sourceFile);

        expect(imports).toHaveLength(1);
        expect(imports[0].getNamespaceImport()).toBeDefined();
    });

    it("should extract hybrid imports (default + named)", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import React, { useState, useEffect } from 'react';`
        );

        const imports = extractImports(sourceFile);

        expect(imports).toHaveLength(1);
        expect(imports[0].getDefaultImport()).toBeDefined();
        expect(imports[0].getNamedImports()).toHaveLength(2);
    });

    it("should handle side-effect imports", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import './polyfill';`
        );

        const imports = extractImports(sourceFile);

        expect(imports).toHaveLength(1);
        expect(imports[0].getDefaultImport()).toBeUndefined();
        expect(imports[0].getNamedImports()).toHaveLength(0);
    });

    it("should return empty array for file with no imports", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `const x = 42;`
        );

        const imports = extractImports(sourceFile);

        expect(imports).toHaveLength(0);

        type cases = [
            Expect<AssertEqual<typeof imports, import("ts-morph").ImportDeclaration[]>>
        ];
    });
});

describe("classifyImportSymbols()", () => {
    it("should classify runtime-only import", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import { useState } from 'react';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const classification = classifyImportSymbols(importDecl);

        expect(classification).toBe("runtime");

        type cases = [
            Expect<AssertExtends<typeof classification, "runtime" | "type" | "mixed">>
        ];
    });

    it("should classify type-only import with type modifier", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import type { User } from './types';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const classification = classifyImportSymbols(importDecl);

        expect(classification).toBe("type");
    });

    it("should classify mixed import (runtime + type symbols)", () => {
        const project = new Project({
            useInMemoryFileSystem: true,
            compilerOptions: {
                strict: true,
                declaration: true
            }
        });

        // Create the module file with both runtime and type exports
        project.createSourceFile(
            "module.ts",
            `
            export const myFunction = () => {};
            export type MyType = string;
            `
        );

        // Create the importing file
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import { myFunction, MyType } from './module';`
        );

        // Force type checking to resolve symbols
        project.getTypeChecker();

        const importDecl = sourceFile.getImportDeclarations()[0];
        const classification = classifyImportSymbols(importDecl);

        expect(classification).toBe("mixed");
    });

    it("should handle namespace import as runtime", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import * as utils from './utils';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const classification = classifyImportSymbols(importDecl);

        expect(classification).toBe("runtime");
    });

    it("should handle default import as runtime", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import React from 'react';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const classification = classifyImportSymbols(importDecl);

        expect(classification).toBe("runtime");
    });

    it("should handle side-effect import", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import './polyfill';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const classification = classifyImportSymbols(importDecl);

        // Side-effect imports are neither runtime nor type, but we'll classify as runtime
        expect(classification).toBe("runtime");
    });
});

describe("getImportStructure()", () => {
    it("should identify barrel import (namespace)", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import * as utils from './utils';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const structure = getImportStructure(importDecl);

        expect(structure).toBe("barrel");

        type cases = [
            Expect<AssertExtends<typeof structure, "barrel" | "named" | "default" | "hybrid">>
        ];
    });

    it("should identify named import", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import { foo, bar } from './module';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const structure = getImportStructure(importDecl);

        expect(structure).toBe("named");
    });

    it("should identify default import", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import React from 'react';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const structure = getImportStructure(importDecl);

        expect(structure).toBe("default");
    });

    it("should identify hybrid import (default + named)", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import React, { useState } from 'react';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const structure = getImportStructure(importDecl);

        expect(structure).toBe("hybrid");
    });

    it("should handle type-only named import", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "test.ts",
            `import type { User } from './types';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const structure = getImportStructure(importDecl);

        expect(structure).toBe("named");
    });
});

describe("getImportLocation()", () => {
    it("should identify external import", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "/src/test.ts",
            `import React from 'react';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const location = getImportLocation(importDecl, "/src/test.ts");

        expect(location).toBe("external");

        type cases = [
            Expect<AssertEqual<typeof location, "external" | "peer" | "parent" | "child" | "deepChild" | "alias" | "aliasOffset">>
        ];
    });

    it("should identify peer import (same directory)", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "/src/utils/test.ts",
            `import { helper } from './helper';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const location = getImportLocation(importDecl, "/src/utils/test.ts");

        expect(location).toBe("peer");
    });

    it("should identify parent import (one level up)", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "/src/components/Button.ts",
            `import { config } from '../config';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const location = getImportLocation(importDecl, "/src/components/Button.ts");

        expect(location).toBe("parent");
    });

    it("should identify child import (one level down)", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "/src/index.ts",
            `import { Button } from './components/Button';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const location = getImportLocation(importDecl, "/src/index.ts");

        expect(location).toBe("child");
    });

    it("should identify deep child import (multiple levels down)", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "/src/index.ts",
            `import { Icon } from './components/ui/Icon';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const location = getImportLocation(importDecl, "/src/index.ts");

        expect(location).toBe("deepChild");
    });

    it("should identify alias import (path alias)", () => {
        const project = new Project({
            useInMemoryFileSystem: true,
            compilerOptions: {
                paths: {
                    "~/*": ["./src/*"]
                }
            }
        });
        const sourceFile = project.createSourceFile(
            "/src/components/Button.ts",
            `import { config } from '~/config';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const location = getImportLocation(importDecl, "/src/components/Button.ts");

        expect(location).toBe("alias");
    });

    it("should identify aliasOffset import (alias with offset path)", () => {
        const project = new Project({
            useInMemoryFileSystem: true,
            compilerOptions: {
                paths: {
                    "~/*": ["./src/*"]
                }
            }
        });
        const sourceFile = project.createSourceFile(
            "/src/components/Button.ts",
            `import { Icon } from '~/ui/icons/Icon';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const location = getImportLocation(importDecl, "/src/components/Button.ts");

        expect(location).toBe("aliasOffset");
    });
});

describe("Full integration - categorize imports", () => {
    it("should fully categorize a named peer import", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "/src/utils/test.ts",
            `import { helper } from './helper';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const structure = getImportStructure(importDecl);
        const location = getImportLocation(importDecl, "/src/utils/test.ts");
        const category = `relative${location.charAt(0).toUpperCase() + location.slice(1)}${structure.charAt(0).toUpperCase() + structure.slice(1)}` as ImportCategory;

        expect(category).toBe("relativePeerNamed");

        type cases = [
            Expect<AssertExtends<typeof category, ImportCategory>>
        ];
    });

    it("should fully categorize an external barrel import", () => {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile(
            "/src/test.ts",
            `import * as React from 'react';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const structure = getImportStructure(importDecl);
        const location = getImportLocation(importDecl, "/src/test.ts");

        expect(structure).toBe("barrel");
        expect(location).toBe("external");
        // External imports don't combine structure, they're just "external"
    });

    it("should fully categorize a hybrid alias import", () => {
        const project = new Project({
            useInMemoryFileSystem: true,
            compilerOptions: {
                paths: {
                    "~/*": ["./src/*"]
                }
            }
        });
        const sourceFile = project.createSourceFile(
            "/src/components/Button.ts",
            `import config, { DEBUG } from '~/config';`
        );

        const importDecl = sourceFile.getImportDeclarations()[0];
        const structure = getImportStructure(importDecl);
        const location = getImportLocation(importDecl, "/src/components/Button.ts");

        expect(structure).toBe("hybrid");
        expect(location).toBe("alias");
    });
});
