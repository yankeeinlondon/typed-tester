import type { ImportDeclaration, SourceFile } from "ts-morph";
import { SyntaxKind } from "ts-morph";
import type { ImportCategory } from "../types/imports";
import { dirname, normalize, relative, resolve } from "pathe";

/**
 * Extract all import declarations from a source file
 *
 * @param sourceFile - The TypeScript source file to analyze
 * @returns Array of import declarations found in the file
 */
export function extractImports(sourceFile: SourceFile): ImportDeclaration[] {
    return sourceFile.getImportDeclarations();
}

/**
 * Classify import symbols as runtime, type, or mixed
 *
 * @param importDecl - The import declaration to classify
 * @returns Classification: "runtime", "type", or "mixed"
 */
export function classifyImportSymbols(importDecl: ImportDeclaration): "runtime" | "type" | "mixed" {
    // If the import statement has the `type` modifier, it's type-only
    if (importDecl.isTypeOnly()) {
        return "type";
    }

    // Check for namespace import (import * as X)
    const namespaceImport = importDecl.getNamespaceImport();
    if (namespaceImport) {
        return "runtime"; // Namespace imports are always runtime
    }

    // Check for default import
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport && !importDecl.getNamedImports().length) {
        return "runtime"; // Default-only import is runtime
    }

    // Check for side-effect import (no imports, just the module)
    if (!defaultImport && !namespaceImport && importDecl.getNamedImports().length === 0) {
        return "runtime"; // Side-effect imports are runtime
    }

    // For named imports, we need to determine if they're runtime or type
    const namedImports = importDecl.getNamedImports();

    if (namedImports.length === 0) {
        return "runtime"; // Default import only
    }

    // Try to determine if imports are types by checking their usage
    const typeChecker = importDecl.getSourceFile().getProject().getTypeChecker();
    let hasRuntimeSymbol = false;
    let hasTypeSymbol = false;

    for (const namedImport of namedImports) {
        // Check if this specific import has type modifier
        if (namedImport.isTypeOnly()) {
            hasTypeSymbol = true;
            continue;
        }

        const symbol = typeChecker.getSymbolAtLocation(namedImport.getNameNode());

        if (symbol) {
            // Get the aliased symbol (the actual exported symbol, not the import specifier)
            const aliasedSymbol = typeChecker.getAliasedSymbol(symbol);
            const targetSymbol = aliasedSymbol || symbol;

            // Get the declarations of the imported symbol
            const declarations = targetSymbol.getDeclarations();

            if (declarations.length > 0) {
                // Check if ALL declarations are type-only constructs
                const isTypeDeclaration = declarations.every((decl) => {
                    const kind = decl.getKind();
                    return kind === SyntaxKind.TypeAliasDeclaration
                        || kind === SyntaxKind.InterfaceDeclaration
                        || kind === SyntaxKind.TypeParameter;
                });

                if (isTypeDeclaration) {
                    hasTypeSymbol = true;
                }
                else {
                    hasRuntimeSymbol = true;
                }
            }
            else {
                // No declarations found, assume runtime
                hasRuntimeSymbol = true;
            }
        }
        else {
            // Can't resolve symbol, assume runtime
            hasRuntimeSymbol = true;
        }
    }

    // Include default import in runtime check
    if (defaultImport) {
        hasRuntimeSymbol = true;
    }

    // Determine classification
    if (hasRuntimeSymbol && hasTypeSymbol) {
        return "mixed";
    }
    else if (hasTypeSymbol && !hasRuntimeSymbol) {
        return "type";
    }
    else {
        return "runtime";
    }
}

/**
 * Determine the import structure
 *
 * @param importDecl - The import declaration to analyze
 * @returns Import structure: "barrel", "named", "default", or "hybrid"
 */
export function getImportStructure(importDecl: ImportDeclaration): "barrel" | "named" | "default" | "hybrid" {
    const namespaceImport = importDecl.getNamespaceImport();
    const defaultImport = importDecl.getDefaultImport();
    const namedImports = importDecl.getNamedImports();

    // Barrel import (namespace)
    if (namespaceImport) {
        return "barrel";
    }

    // Hybrid (default + named)
    if (defaultImport && namedImports.length > 0) {
        return "hybrid";
    }

    // Default only
    if (defaultImport) {
        return "default";
    }

    // Named only (or empty for side-effect imports)
    return "named";
}

/**
 * Determine the import location category
 *
 * @param importDecl - The import declaration to analyze
 * @param sourceFilePath - Absolute path to the source file containing the import
 * @returns Location category matching ImportCategory type
 */
export function getImportLocation(
    importDecl: ImportDeclaration,
    sourceFilePath: string
): "external" | "peer" | "parent" | "child" | "deepChild" | "alias" | "aliasOffset" {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();

    // Check if it's an external module (not starting with . or /)
    if (!moduleSpecifier.startsWith(".") && !moduleSpecifier.startsWith("/")) {
        // Check if it's a path alias
        const project = importDecl.getSourceFile().getProject();
        const compilerOptions = project.getCompilerOptions();
        const paths = compilerOptions.paths;

        if (paths) {
            // Check if module specifier matches any path alias
            for (const [alias, _mappings] of Object.entries(paths)) {
                // Remove the /* suffix from alias for comparison
                const aliasPrefix = alias.replace(/\/\*$/, "");

                if (moduleSpecifier.startsWith(aliasPrefix)) {
                    // Check if there's an offset (path after the alias)
                    // The remainder after removing the alias prefix
                    const remainder = moduleSpecifier.slice(aliasPrefix.length);

                    // If remainder is empty or just '/', it's a direct alias import
                    if (remainder === "" || remainder === "/") {
                        return "alias";
                    }

                    // If remainder starts with '/' and has more path segments, it's offset
                    if (remainder.startsWith("/")) {
                        const pathAfterSlash = remainder.slice(1);
                        // Check if there are subdirectories (more than one segment)
                        const hasSubdirs = pathAfterSlash.includes("/");
                        return hasSubdirs ? "aliasOffset" : "alias";
                    }

                    // Otherwise it's a direct match
                    return "alias";
                }
            }
        }

        // Not a path alias, so it's external
        return "external";
    }

    // It's a relative import - determine the relationship
    const sourceDir = dirname(normalize(sourceFilePath));
    const importPath = normalize(resolve(sourceDir, moduleSpecifier));
    const importDir = dirname(importPath);

    // Get relative path from source dir to import dir
    const rel = relative(sourceDir, importDir);

    // Same directory (peer)
    if (rel === "" || rel === ".") {
        return "peer";
    }

    // Parent directory (starts with ..)
    if (rel.startsWith("..")) {
        return "parent";
    }

    // Child directory
    // Count directory depth
    const depthCount = rel.split("/").filter(p => p !== "" && p !== ".").length;

    if (depthCount === 1) {
        return "child";
    }
    else {
        return "deepChild";
    }
}
