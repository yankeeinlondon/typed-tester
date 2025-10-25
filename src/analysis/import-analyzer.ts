import type { SourceFile, Project } from "ts-morph";
import { Project as TsMorphProject } from "ts-morph";
import fg from "fast-glob";
import { normalize } from "pathe";
import {
    extractImports,
    classifyImportSymbols,
    getImportStructure,
    getImportLocation
} from "~/ast/imports";
import type {
    AnalysisResult,
    AnalysisOptions,
    FileImportSummary,
    CombinedImport,
    MissingTypeModifier,
    ImportType,
    ImportCategory
} from "~/types/imports";
import { SyntaxKind } from "ts-morph";

/**
 * **analyzeImports**
 *
 * Analyze imports across multiple TypeScript files.
 *
 * This function:
 * 1. Loads the specified files using ts-morph
 * 2. Extracts all import declarations from each file
 * 3. Classifies and categorizes each import
 * 4. Detects problematic patterns (combined imports, missing type modifiers)
 * 5. Aggregates results for reporting
 *
 * @param filePaths - Array of file paths or glob patterns to analyze
 * @param options - Analysis options (project instance, glob mode)
 * @returns Aggregated analysis results
 *
 * @example
 * ```ts
 * const project = new Project();
 * const result = analyzeImports(['src/**\/*.ts'], { project, useGlob: true });
 *
 * console.log(`Found ${result.combinedImports.length} combined imports`);
 * console.log(`External imports: ${result.categorized.external?.length ?? 0}`);
 * ```
 */
export function analyzeImports(
    filePaths: string[],
    options: AnalysisOptions = {}
): AnalysisResult {
    const { project: userProject, useGlob = false } = options;

    // Use provided project or create a new one
    const project = userProject || new TsMorphProject({
        skipAddingFilesFromTsConfig: true,
        compilerOptions: {
            allowJs: true,
            checkJs: false
        }
    });

    // Get source files from project
    let sourceFiles: SourceFile[];

    if (useGlob) {
        // For glob mode, check if project is in-memory or filesystem-based
        const allSourceFiles = project.getSourceFiles();

        if (allSourceFiles.length > 0) {
            // In-memory project or already loaded files - match against loaded files
            const patterns = filePaths;
            sourceFiles = allSourceFiles.filter(sf => {
                const path = sf.getFilePath();
                return patterns.some(pattern => {
                    // Simple glob matching (supports **/*.ts style patterns)
                    const normalizedPath = path.replace(/\\/g, '/');
                    const normalizedPattern = pattern.replace(/\\/g, '/');

                    // Convert glob pattern to regex
                    // Special handling for **/ which should match zero or more path segments
                    let regexPattern = normalizedPattern
                        .replace(/\./g, '\\.')  // Escape dots
                        .replace(/\*\*\/\*/g, '(?:.*/)?\[^/\]*')  // **/* matches zero or more segments then a file
                        .replace(/\*\*/g, '.*')  // ** by itself matches anything
                        .replace(/\*/g, '[^/]*');  // * matches anything except /

                    // Allow pattern to match anywhere in path (don't anchor to start)
                    const regex = new RegExp(regexPattern);

                    return regex.test(normalizedPath);
                });
            });
        } else {
            // Filesystem-based project - use fast-glob
            const resolvedPaths = fg.sync(filePaths, {
                absolute: true,
                onlyFiles: true
            });
            sourceFiles = resolvedPaths
                .map(path => project.getSourceFile(path) || project.addSourceFileAtPath(path))
                .filter((sf): sf is SourceFile => sf !== undefined);
        }
    } else {
        // Exact paths mode
        sourceFiles = filePaths
            .map(path => project.getSourceFile(normalize(path)))
            .filter((sf): sf is SourceFile => sf !== undefined);
    }

    // Initialize result structure
    const result: AnalysisResult = {
        files: [],
        combinedImports: [],
        missingTypeModifiers: [],
        categorized: {}
    };

    // Analyze each file
    for (const sourceFile of sourceFiles) {
        const filePath = sourceFile.getFilePath();
        const imports = extractImports(sourceFile);

        const fileImports: ImportType[] = [];

        for (const importDecl of imports) {
            const classification = classifyImportSymbols(importDecl);
            const structure = getImportStructure(importDecl);
            const location = getImportLocation(importDecl, filePath);

            // Build the category
            let category: ImportCategory;
            if (location === "external") {
                category = "external";
            } else {
                // Combine structure and location for internal imports
                // e.g., "barrel" + "peer" = "relativePeerBarrel"
                const prefix = "relative";
                const locationCap = location.charAt(0).toUpperCase() + location.slice(1);
                const structureCap = structure.charAt(0).toUpperCase() + structure.slice(1);
                category = `${prefix}${locationCap}${structureCap}` as ImportCategory;
            }

            // Create ImportType record
            const importType: ImportType = {
                category,
                file: filePath,
                line: importDecl.getStartLineNumber(),
                content: importDecl.getText(),
                toString() {
                    return `${this.category}: ${this.content} (${this.file}:${this.line})`;
                }
            };

            fileImports.push(importType);

            // Add to categorized results
            if (!result.categorized[category]) {
                result.categorized[category] = [];
            }
            result.categorized[category].push(importType);

            // Check for combined imports (runtime + type symbols mixed)
            if (classification === "mixed") {
                const combined = createCombinedImport(importDecl, filePath);
                result.combinedImports.push(combined);
            }

            // Check for missing type modifiers
            if (classification === "type" && !importDecl.isTypeOnly()) {
                const missing = createMissingTypeModifier(importDecl, filePath);
                result.missingTypeModifiers.push(missing);
            }
        }

        // Add file summary
        result.files.push({
            path: filePath,
            imports: fileImports
        });
    }

    return result;
}

/**
 * Create a CombinedImport diagnostic from an import declaration.
 *
 * A combined import mixes runtime and type symbols in a single import statement.
 *
 * @param importDecl - The import declaration
 * @param filePath - The file containing the import
 * @returns CombinedImport diagnostic object
 */
function createCombinedImport(
    importDecl: import("ts-morph").ImportDeclaration,
    filePath: string
): CombinedImport {
    const source = importDecl.getModuleSpecifierValue();
    const typeSymbols: string[] = [];
    const runtimeSymbols: string[] = [];

    const typeChecker = importDecl.getSourceFile().getProject().getTypeChecker();

    // Check default import
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport) {
        runtimeSymbols.push(defaultImport.getText());
    }

    // Check namespace import
    const namespaceImport = importDecl.getNamespaceImport();
    if (namespaceImport) {
        runtimeSymbols.push(`* as ${namespaceImport.getText()}`);
    }

    // Check named imports
    const namedImports = importDecl.getNamedImports();
    for (const namedImport of namedImports) {
        const name = namedImport.getName();

        // Check if this specific import has type modifier
        if (namedImport.isTypeOnly()) {
            typeSymbols.push(name);
            continue;
        }

        // Try to determine if it's a type by checking its declaration
        const symbol = typeChecker.getSymbolAtLocation(namedImport.getNameNode());

        if (symbol) {
            const aliasedSymbol = typeChecker.getAliasedSymbol(symbol);
            const targetSymbol = aliasedSymbol || symbol;
            const declarations = targetSymbol.getDeclarations();

            if (declarations.length > 0) {
                const isTypeDeclaration = declarations.every(decl => {
                    const kind = decl.getKind();
                    return kind === SyntaxKind.TypeAliasDeclaration ||
                           kind === SyntaxKind.InterfaceDeclaration ||
                           kind === SyntaxKind.TypeParameter;
                });

                if (isTypeDeclaration) {
                    typeSymbols.push(name);
                } else {
                    runtimeSymbols.push(name);
                }
            } else {
                runtimeSymbols.push(name);
            }
        } else {
            runtimeSymbols.push(name);
        }
    }

    return {
        kind: "combined-import",
        source,
        typeSymbols,
        runtimeSymbols,
        file: filePath,
        line: importDecl.getStartLineNumber(),
        hasTypeModifier: importDecl.isTypeOnly(),
        content: importDecl.getText(),
        toString() {
            return `Combined import in ${this.file}:${this.line}: ${this.content}`;
        }
    };
}

/**
 * Create a MissingTypeModifier diagnostic from an import declaration.
 *
 * A missing type modifier occurs when importing type symbols without
 * the `type` keyword modifier.
 *
 * @param importDecl - The import declaration
 * @param filePath - The file containing the import
 * @returns MissingTypeModifier diagnostic object
 */
function createMissingTypeModifier(
    importDecl: import("ts-morph").ImportDeclaration,
    filePath: string
): MissingTypeModifier {
    const source = importDecl.getModuleSpecifierValue();

    return {
        kind: "missing-type-modifier",
        source,
        file: filePath,
        line: importDecl.getStartLineNumber(),
        content: importDecl.getText(),
        toString() {
            return `Missing type modifier in ${this.file}:${this.line}: ${this.content}`;
        }
    };
}
