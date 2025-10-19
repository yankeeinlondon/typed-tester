import { cwd } from "node:process";
import chalk from "chalk";
import {
    Node,
    SymbolFlags,
    SyntaxKind,
    ts
} from "ts-morph";
import { relative } from "pathe";
import type {
    ImportDeclaration,
    ModifierableNode,
    Symbol,
    TypeChecker,
    VariableDeclaration
} from "ts-morph";
import type {
    DependencyNode,
    FQN,
    JsDocInfo,
    SymbolFlagKey,
    SymbolKind,
    SymbolMeta,
    SymbolReference,
    SymbolScope,
    TypeGeneric
} from "~/types";
import {
    isSymbol,
    isSymbolMeta
} from "~/type-guards";
import { getProjectTypeChecker } from "~/ast";

// Simple string hash function to replace xxhash
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

function getSymbolsJSDocInfo(symbol: Symbol): JsDocInfo[] {
    const declarations = symbol.getDeclarations();
    const jsDocInfo = declarations.map((declaration) => {
        if (Node.isJSDocable(declaration)) {
            const jsDocs = declaration.getJsDocs();
            const tags = jsDocs.flatMap(jsDoc => jsDoc.getTags().map(tag => ({
                tagName: tag.getTagName(),
                comment: tag.getComment(),
            })));

            const comment = jsDocs.map(jsDoc => jsDoc.getComment()).join("\n");

            return {
                comment,
                tags
            };
        }
        else {
            return null;
        }
    }).filter(info => info !== null); // Filter out any null entries

    return jsDocInfo;
}

function getSymbolGenerics(symbol: Symbol): TypeGeneric[] {
    const declarations = (symbol.getAliasedSymbol() || symbol).getDeclarations();
    const generics: TypeGeneric[] = [];

    declarations.forEach((declaration) => {
        if (Node.isFunctionLikeDeclaration(declaration) || Node.isClassDeclaration(declaration) || Node.isInterfaceDeclaration(declaration) || Node.isTypeAliasDeclaration(declaration)) {
            const typeParameters = declaration.getTypeParameters();
            typeParameters.forEach((typeParam) => {
                generics.push({
                    name: typeParam.getName(),
                    type: typeParam.getType().getText()
                });
            });
        }
    });

    return generics;
}

/**
 * Tests whether the passed in symbol is external to the repo
 * being evaluated.
 */
export function isExternalSymbol(sym: Symbol): boolean {
    const name = getSymbolName(sym);
    return name === sym.getFullyQualifiedName();
}

/**
 * Determines if the given symbol is exported in the project.
 * @param symbol - The ts-morph Symbol to check.
 * @returns True if the symbol is exported; otherwise, false.
 */
export function isSymbolExported(symbol: Symbol): boolean {
    const declarations = symbol.getDeclarations();

    for (const declaration of declarations) {
        try {
            const sourceFile = declaration.getSourceFile();

            // Check if the declaration itself has the 'export' keyword
            if (
                Node.isModifierable(declaration)
                && declaration.getModifiers().some(mod => mod.getKind() === SyntaxKind.ExportKeyword)
            ) {
                return true;
            }

            // Specifically check for exported const/let/var declarations
            if (Node.isVariableDeclaration(declaration)) {
                const variableStatement = declaration.getParent().getParentIfKind(SyntaxKind.VariableStatement);
                if (
                    variableStatement
                    && variableStatement.getModifiers().some(mod => mod.getKind() === SyntaxKind.ExportKeyword)
                ) {
                    return true;
                }
            }

            // Check for named exports like 'export { MySymbol };'
            const exportDeclarations = sourceFile.getExportDeclarations();
            for (const exportDecl of exportDeclarations) {
                const namedExports = exportDecl.getNamedExports();
                for (const namedExport of namedExports) {
                    const exportedSymbol = namedExport.getSymbol();

                    // Compare both the symbol and its aliased version since named exports create alias symbols
                    if (exportedSymbol && (exportedSymbol === symbol || exportedSymbol.getAliasedSymbol() === symbol)) {
                        return true;
                    }
                }
            }

            // Check if the symbol is the default export
            const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
            if (defaultExportSymbol && defaultExportSymbol === symbol) {
                return true;
            }

            // Check if the symbol is exported via a re-export statement like 'export * from "./module";'
            const exportStars = sourceFile.getExportAssignments();
            for (const exportStar of exportStars) {
                const exportedSymbol = exportStar.getSymbol();
                if (exportedSymbol && exportedSymbol === symbol) {
                    return true;
                }
            }
        }
        catch (err) {
            console.log(`${chalk.red("- Error: ")}ran into problems interrogating ${symbol.getFullyQualifiedName()}`);
            console.error(err);
        }
    }

    return false;
}

/**
 * Determines the scope of the given symbol.
 *
 * Returns:
 *  - `local` if the symbol is defined locally and not exported,
 *  - `module` if the symbol is defined and exported within the scope of
 * the analyzed project,
 *  - `external` if the symbol is from an external library
 */
export function getSymbolScope(symbol: Symbol): SymbolScope {
    const declarations = symbol.getDeclarations();

    // If there are no declarations, it's likely an external symbol
    if (
        declarations.length === 0
        || getSymbolKind(symbol) === "external-type"
    ) {
        return "external";
    }

    // Check if the symbol is declared in an external library
    const firstDeclaration = declarations[0];
    const sourceFile = firstDeclaration.getSourceFile();

    if (sourceFile.isInNodeModules()) {
        return "external";
    }

    if (isSymbolExported(symbol)) {
        return "module";
    }

    // If not exported and not from an external library, it's local
    return "local";
}

/**
 * Checks what external source/npm-package the package comes from.
 *
 * Returns `null` if the source of the file is local or it's not found in node_modules;
 * otherwise returns the name of the package.
 */
function getSymbolSourcePackage(symbol: Symbol): string | null {
    const declarations = symbol.getDeclarations();

    // If there are no declarations, it's likely an external symbol
    if (declarations.length === 0) {
        return null;
    }

    const firstDeclaration = declarations[0];
    const sourceFile = firstDeclaration.getSourceFile();

    // Check if the symbol is declared in an external library (e.g., in node_modules)
    if (sourceFile.isInNodeModules()) {
        let currentNode: Node | undefined = firstDeclaration;

        // Traverse the ancestors to find the ImportDeclaration
        while (currentNode && !Node.isImportDeclaration(currentNode)) {
            currentNode = currentNode.getParent();
        }

        if (currentNode && Node.isImportDeclaration(currentNode)) {
            const importDecl = currentNode as ImportDeclaration;

            const namedImports = importDecl.getNamedImports();
            const defaultImport = importDecl.getDefaultImport();
            const namespaceImport = importDecl.getNamespaceImport();

            // Check if the symbol matches one of the named imports
            if (namedImports.some(namedImport => namedImport.getName() === symbol.getName())) {
                return importDecl.getModuleSpecifierValue();
            }

            // Check if the symbol matches the default import
            if (defaultImport && defaultImport.getText() === symbol.getName()) {
                return importDecl.getModuleSpecifierValue();
            }

            // Check if the symbol matches a namespace import (e.g., import * as X from 'module')
            if (namespaceImport) {
                const namespaceSymbol = namespaceImport.getSymbol();
                if (namespaceSymbol) {
                    const exports = namespaceSymbol.getExports();
                    if (exports.some(exportedSymbol => exportedSymbol.getName() === symbol.getName())) {
                        return importDecl.getModuleSpecifierValue();
                    }
                }
            }
        }
    }

    // If the symbol is not from an external package, return null
    return null;
}

export function getSymbolDefinition(symbol: Symbol): string {
    // Get the declarations associated with the symbol
    const declarations = symbol.getDeclarations();

    // If there are no declarations, return undefined
    if (declarations.length === 0) {
        throw new Error(`Could not get the definition code for the symbol "${symbol.getName()}"`);
    }

    // Get the first declaration (typically, there's only one primary declaration)
    const declaration = declarations[0];

    // Return the full text of the declaration
    return declaration.getFullText();
}

export function createFullyQualifiedNameForSymbol(sym: Symbol) {
    const name = getSymbolName(sym);
    const { filepath } = getSymbolFileDefinition(sym);
    const scope = getSymbolScope(sym);
    const hasher = simpleHash;

    return (
        scope === "external"
            ? `ext::${hasher(String(getSymbolSourcePackage(sym)))}::${name}`
            : scope === "local"
                ? `local::${hasher(String(filepath))}::${name}`
                : `module::${hasher(sym.getFullyQualifiedName())}::${name}`
    ) as FQN;
}

export function createSymbolHash(sym: Symbol) {
    const hasher = simpleHash;
    const scope = getSymbolScope(sym);

    return scope === "external"
        ? hasher(String(getSymbolSourcePackage(sym)))
        : hasher(getSymbolDefinition(sym));
}

export function asSymbolReference(sym: Symbol | SymbolMeta): SymbolReference {
    if (isSymbolMeta(sym)) {
        return {
            name: sym.name,
            fqn: sym.fqn,
            kind: sym.kind
        };
    }
    else {
        return {
            name: getSymbolName(sym),
            fqn: createFullyQualifiedNameForSymbol(sym),
            kind: getSymbolKind(sym)
        };
    }
}

/**
 * **asSymbolMeta**`(sym) -> SymbolMeta`
 *
 * Converts a **ts-morph** `Symbol` into a `SymbolMeta` object which
 * contains useful summary information and is serializable.
 *
 * - Note this step _does not_ add in the dependencies this symbol
 * has on other symbols.
 */
export function asSymbolMeta(sym: Symbol): SymbolMeta {
    const flags = getSymbolFlags(sym);
    const isTypeSymbol: boolean = flags.includes("Type")
        || flags.includes("TypeAlias")
        || flags.includes("TypeLiteral")
        || flags.includes("Interface");

    const isVariable: boolean = flags.includes("Variable")
        || flags.includes("BlockScopedVariable")
        || flags.includes("ConstEnum");

    const isFunction: boolean = flags.includes("Function")
        || flags.includes("FunctionScopedVariable");

    return {
        name: getSymbolName(sym),
        fqn: createFullyQualifiedNameForSymbol(sym),
        // brings in filepath, startLine, and endLine
        ...getSymbolFileDefinition(sym),
        scope: getSymbolScope(sym),
        flags,
        isTypeSymbol,
        isVariable,
        isFunction,
        kind: getSymbolKind(sym),
        generics: getSymbolGenerics(sym),
        jsDocs: getSymbolsJSDocInfo(sym),

        refs: []
    };
}

/**
 * Distinguishes between a true symbol definition and a generic.
 */
export function isGenericSymbol(symbol: Symbol): boolean {
    // Check if the symbol is a type parameter (generic type)
    const flags = symbol.getFlags();
    return (flags & ts.SymbolFlags.TypeParameter) !== 0;
}

/**
 * tests whether the passed in symbol has _any_ of the passed
 * in `ts.SymbolFlags`
 */
export function symbolHasSymbolFlags(symbol: Symbol, ...find: ts.SymbolFlags[]) {
    const flags = symbol.getFlags();
    return find.some(f => (flags & f) === f);
}

export function isExportedSymbol(symbol: Symbol): boolean {
    const declarations = symbol.getDeclarations();

    if (declarations.length === 0) {
        return false;
    }

    // Check if the symbol is imported
    if (declarations.some(declaration => Node.isImportSpecifier(declaration) || Node.isImportClause(declaration))) {
        return true;
    }

    // Check if the symbol is exported in the current file
    return declarations.some((declaration) => {
        const parent = declaration.getParent();

        // For variable declarations, check the parent VariableStatement
        if (Node.isVariableDeclaration(declaration) && parent && Node.isVariableStatement(parent)) {
            return parent.getModifiers().some(modifier =>
                modifier.getKind() === SyntaxKind.ExportKeyword
                || modifier.getKind() === SyntaxKind.DefaultKeyword
            );
        }

        // For other declarations, check for export keyword directly
        if (
            Node.isFunctionDeclaration(declaration)
            || Node.isClassDeclaration(declaration)
            || Node.isInterfaceDeclaration(declaration)
            || Node.isEnumDeclaration(declaration)
            || Node.isTypeAliasDeclaration(declaration)
        ) {
            return (declaration as ModifierableNode).getModifiers().some(modifier =>
                modifier.getKind() === SyntaxKind.ExportKeyword
                || modifier.getKind() === SyntaxKind.DefaultKeyword
            );
        }

        return false;
    });
}

function getReferencedSymbols(node: Node, typeChecker: TypeChecker): Node[] {
    const referencedSymbols: Node[] = [];
    const visited = new Set<Node>();

    // Optimized traversal - only visit relevant node types
    const traverse = (currentNode: Node) => {
        if (visited.has(currentNode))
            return;
        visited.add(currentNode);

        // Only check identifier nodes for symbols
        if (Node.isIdentifier(currentNode)) {
            const symbol = typeChecker.getSymbolAtLocation(currentNode);
            if (symbol && !isGenericSymbol(symbol)) {
                referencedSymbols.push(currentNode);
            }
            return; // Don't traverse children of identifiers
        }

        // Skip unnecessary node types that won't contain meaningful references
        if (Node.isStringLiteral(currentNode)
            || Node.isNumericLiteral(currentNode)
            || Node.isTemplateHead(currentNode)
            || Node.isTemplateTail(currentNode)
            || Node.isTemplateMiddle(currentNode)) {
            return;
        }

        // Only traverse direct children for specific node types
        if (Node.isTypeReference(currentNode)
            || Node.isPropertyAccessExpression(currentNode)
            || Node.isCallExpression(currentNode)
            || Node.isMethodDeclaration(currentNode)
            || Node.isFunctionDeclaration(currentNode)
            || Node.isVariableDeclaration(currentNode)
            || Node.isTypeAliasDeclaration(currentNode)
            || Node.isInterfaceDeclaration(currentNode)) {
            currentNode.getChildren().forEach(child => traverse(child));
        }
    };

    traverse(node);
    return referencedSymbols;
}

/**
 * finds the symbol **name** for a given symbol or symbol metadata
 * structure.
 */
export function getSymbolName(sym: Symbol | SymbolMeta): string {
    const name: string | undefined = isSymbol(sym)
        ? sym.getName()
        : isSymbolMeta(sym)
            ? sym.name
            : undefined;

    if (!name) {
        throw new Error(`Invalid symbol provided to symbolName()!`);
    }

    return name;
}
/**
 * categorizes a **ts-morph** `Symbol` into a broad category defined
 * the `SymbolKind` type alias.
 */
export function getSymbolKind(symbol: Symbol): SymbolKind {
    const sym = symbol.getAliasedSymbol() || symbol;
    const declarations = sym.getDeclarations();
    const valueDeclaration = sym.getValueDeclaration();

    // Check if it's an external type
    if (declarations.some(decl => decl.getSourceFile().isFromExternalLibrary())) {
        return "external-type";
    }

    // Check for type definitions or constraints using SymbolFlags
    if (
        symbolHasSymbolFlags(
            sym,
            SymbolFlags.TypeAlias,
            SymbolFlags.Type,
            SymbolFlags.TypeLiteral,
            SymbolFlags.Interface,
            SymbolFlags.TypeParameter,
            SymbolFlags.TypeAliasExcludes
        )
        || declarations.some(decl =>
            decl.getKind() === SyntaxKind.TypeAliasDeclaration
            || decl.getKind() === SyntaxKind.InterfaceDeclaration
            || decl.getKind() === SyntaxKind.TypeReference
        )
    ) {
        return "type-defn";
    }

    // Check for type constraints using SymbolFlags
    if (
        symbolHasSymbolFlags(
            sym,
            SymbolFlags.TypeParameter,
            SymbolFlags.TypeParameterExcludes,
            SymbolFlags.Type
        )
        || declarations.some(decl =>
            decl.getKind() === SyntaxKind.TypeParameter
        )
    ) {
        return "type-constraint";
    }

    // Check for function declarations
    if (
        declarations.some(decl =>
            decl.getKind() === SyntaxKind.FunctionDeclaration
        )
    ) {
        return "function";
    }

    // Check for const-function (variable with function initializer)
    if (
        valueDeclaration
        && valueDeclaration.getKind() === SyntaxKind.VariableDeclaration
    ) {
        const variableDecl = valueDeclaration as VariableDeclaration;
        const initializer = variableDecl.getInitializer();
        if (initializer && initializer.getKind() === SyntaxKind.ArrowFunction) {
            return "const-function";
        }
    }

    // Check for properties with no declarations
    if (
        symbolHasSymbolFlags(
            sym,
            SymbolFlags.Property,
            SymbolFlags.PropertyExcludes
        )
    ) {
        return "property";
    }

    // If no declarations are available, return "other"
    if (!declarations.length && !valueDeclaration) {
        return "other";
    }

    const symbolType = sym.getTypeAtLocation(
        valueDeclaration || declarations[0]
    );

    // Check if it's an instance of a class
    if (symbolType.isObject() && symbolType.getSymbol()?.getName() !== "Object") {
        const isInstance = symbolType.getSymbol()?.getDeclarations().some(decl => decl.getKind() === SyntaxKind.ClassDeclaration);
        if (isInstance) {
            return "instance";
        }
    }

    // Check if it's a class
    if (symbolType.isClass()) {
        return "class";
    }

    // Check if it's a scalar type (number, string, boolean, etc.)
    if (symbolType.isString() || symbolType.isNumber() || symbolType.isBoolean() || symbolType.isEnum() || symbolType.isLiteral()) {
        return "scalar";
    }

    if (symbolType.isUnionOrIntersection()) {
        return "union-or-intersection";
    }

    // Check if it's a container (object, array, Map, Set, etc.)
    if (
        symbolType.isObject()
        || symbolType.isArray()
    ) {
        return "container";
    }

    // Default to "other"
    return "other";
}

export function getSymbolFileDefinition(sym: Symbol): {
    filepath: string;
    startLine: number;
    endLine: number;
} {
    // Try to get the first declaration of the symbol
    const decl = sym.getDeclarations()[0];

    if (!decl) {
        // If no declarations are found, return undefined values
        return {
            filepath: "",
            startLine: -1,
            endLine: -1
        };
    }

    // Get the source file from the declaration
    const sourceFile = decl.getSourceFile();
    const filepath = relative(cwd(), sourceFile.getFilePath());
    const startLine = decl.getStartLineNumber();
    const endLine = decl.getEndLineNumber();

    return {
        filepath,
        startLine,
        endLine
    };
}

/**
 * type utility which provides the name of the SymbolFlag for a given
 * numerical representation of it's `ts.SymbolFlags` property.
 *
 * ```ts
 * // 384
 * type Enum = ts.SymbolFlags.Enum;
 * // "Enum"
 * type AndBack = SymbolFlagLookup<Enum>
 * ```
 */
export type SymbolFlagLookup<T extends number> = keyof {
    [K in keyof typeof ts.SymbolFlags as T extends typeof ts.SymbolFlags[K] ? K : never]: K;
};

function reverseLookupEnum(enumObj: object) {
    return (value: number): SymbolFlagKey[] => {
        return Object.entries(enumObj)
            .filter(([_key, val]) => typeof val === "number" && (value & val) === val)
            .map(([key]) => key as SymbolFlagKey) || `unknown(${value})`;
    };
}

/**
 * **getSymbolFlags**`(sym)`
 *
 * Every symbol has a "flag" identifier which is provided by
 * `SymbolFlags` enumeration. The integer value which you
 * would typically get back is a bit hard to work with so
 * this function instead provides the enumeration _key_ on
 * `ts.SymbolFlags` which is far more contextual.
 *
 * **Note:** a number can map to more than one key of `SymbolFlags` so
 * in that case the string value with show as a union and the type will
 * be a union too.
 */
export function getSymbolFlags<T extends Symbol>(sym: T): SymbolFlagKey[] {
    const flag = sym.getFlags();
    return reverseLookupEnum(SymbolFlags)(flag);
}

/**
 * Returns an array of dependencies for a given symbol.
 *
 * - the refences are all just fully qualified names
 * - if any of these dependant symbols are _not_ yet in cache
 * they will be added during this discover process
 */
export function getSymbolDependencies(symbol: Symbol): FQN[] {
    const dependencies: Map<string, Symbol> = new Map<string, Symbol>();
    const typeChecker: TypeChecker = getProjectTypeChecker();

    // Get the declaration node for the symbol
    const declarations = symbol.getDeclarations();
    if (declarations.length === 0) {
        return [];
    }

    // Limit analysis to first few declarations for performance
    const maxDeclarations = Math.min(declarations.length, 3);

    // Analyze each declaration of the symbol
    for (let i = 0; i < maxDeclarations; i++) {
        const declaration = declarations[i];

        try {
            // Use optimized reference discovery
            const references = getReferencedSymbols(declaration, typeChecker);

            // Process references with early termination for performance
            for (const ref of references) {
                // Skip if we've already found many dependencies
                if (dependencies.size > 50)
                    break;

                const refSymbol = typeChecker.getSymbolAtLocation(ref);
                if (refSymbol) {
                    const name = refSymbol.getName();
                    if (name !== symbol.getName() && !isGenericSymbol(refSymbol)) {
                        if (!dependencies.has(name)) {
                            dependencies.set(name, refSymbol);
                        }
                    }
                }
            }
        }
        catch (error) {
            // Skip problematic declarations rather than failing completely
            console.debug(`Skipping declaration analysis for ${symbol.getName()}: ${error}`);
            continue;
        }
    }

    // Convert to FQNs with error handling
    const deps: FQN[] = [];
    for (const [_name, sym] of dependencies) {
        try {
            const meta = asSymbolMeta(sym);
            deps.push(meta.fqn);
        }
        catch (error) {
            // Skip symbols that can't be converted to metadata
            console.debug(`Skipping dependency ${sym.getName()}: ${error}`);
        }
    }

    return deps;
}

export interface GraphNode {
    symbol: string;
    requiredBy: string;
    depth: number;
}

export function findReferencingSymbols(targetSymbol: Symbol): Symbol[] {
    const referencingSymbols: Symbol[] = [];
    const declarations = targetSymbol.getDeclarations();

    // Get the project from one of the symbol's declarations
    if (declarations.length === 0)
        return referencingSymbols;
    const project = declarations[0].getSourceFile().getProject();

    declarations.forEach((declaration) => {
        const referencedSymbols = project.getLanguageService().findReferences(declaration);

        referencedSymbols.forEach((referencedSymbol) => {
            referencedSymbol.getReferences().forEach((ref) => {
                const node = ref.getNode();
                const referencingSymbol = node.getSymbol();

                if (referencingSymbol && !referencingSymbols.includes(referencingSymbol)) {
                    referencingSymbols.push(referencingSymbol);
                }
            });
        });
    });

    return referencingSymbols;
}

/**
 * **buildDependencyNode**
 *
 * Creates a DependencyNode from a Symbol with full dependency analysis.
 * This includes both direct dependencies and reverse dependencies.
 */
export function buildDependencyNode(symbol: Symbol, _allSymbols?: Symbol[]): DependencyNode {
    const meta = asSymbolMeta(symbol);
    const dependencies = getSymbolDependencies(symbol);
    const hash = createSymbolHash(symbol);

    // Note: dependents will be calculated efficiently in buildDependencyMap
    // This function is kept for compatibility with single-symbol analysis
    return {
        symbol: meta.fqn,
        hash,
        dependencies,
        dependents: [], // Populated later by buildDependencyMap
        meta,
        analyzedAt: Date.now()
    };
}

/**
 * **getDependents**
 *
 * Finds all symbols that depend on the given target symbol.
 * Returns an array of FQNs for symbols that reference the target.
 */
export function getDependents(targetSymbol: Symbol, allSymbols: Symbol[]): FQN[] {
    const targetFQN = createFullyQualifiedNameForSymbol(targetSymbol);
    const dependents: FQN[] = [];

    for (const symbol of allSymbols) {
        // Skip self-reference
        if (createFullyQualifiedNameForSymbol(symbol) === targetFQN) {
            continue;
        }

        const dependencies = getSymbolDependencies(symbol);
        if (dependencies.includes(targetFQN)) {
            dependents.push(createFullyQualifiedNameForSymbol(symbol));
        }
    }

    return dependents;
}

/**
 * **detectCycles**
 *
 * Detects circular dependencies in a set of dependency nodes.
 * Returns an array of cycles, where each cycle is an array of FQNs.
 */
export function detectCycles(nodes: Map<FQN, DependencyNode>): FQN[][] {
    const cycles: FQN[][] = [];
    const visited = new Set<FQN>();
    const recursionStack = new Set<FQN>();

    const dfs = (fqn: FQN, path: FQN[]): void => {
        if (recursionStack.has(fqn)) {
            // Found a cycle - extract the cycle from the path
            const cycleStartIndex = path.indexOf(fqn);
            if (cycleStartIndex !== -1) {
                const cycle = [...path.slice(cycleStartIndex), fqn];
                // Check if this cycle is already detected
                if (!hasCycle(cycles, cycle)) {
                    cycles.push(cycle);
                }
            }
            return;
        }

        if (visited.has(fqn)) {
            return;
        }

        visited.add(fqn);
        recursionStack.add(fqn);

        const node = nodes.get(fqn);
        if (node) {
            for (const depFQN of node.dependencies) {
                dfs(depFQN, [...path, fqn]);
            }
        }

        recursionStack.delete(fqn);
    };

    // Start DFS from each unvisited node
    for (const fqn of nodes.keys()) {
        if (!visited.has(fqn)) {
            dfs(fqn, []);
        }
    }

    return cycles;
}

/**
 * **calculateDependencyDepth**
 *
 * Calculates the maximum dependency depth for a symbol.
 * Returns the maximum depth of the dependency tree.
 */
export function calculateDependencyDepth(
    startFQN: FQN,
    nodes: Map<FQN, DependencyNode>,
    maxDepth: number = 100
): number {
    const visited = new Set<FQN>();

    const traverse = (fqn: FQN, currentDepth: number): number => {
        if (visited.has(fqn) || currentDepth >= maxDepth) {
            return currentDepth;
        }

        visited.add(fqn);
        const node = nodes.get(fqn);

        if (!node || node.dependencies.length === 0) {
            return currentDepth;
        }

        let maxChildDepth = currentDepth;
        for (const depFQN of node.dependencies) {
            const childDepth = traverse(depFQN, currentDepth + 1);
            maxChildDepth = Math.max(maxChildDepth, childDepth);
        }

        return maxChildDepth;
    };

    return traverse(startFQN, 0);
}

/**
 * **buildDependencyMap**
 *
 * Builds a complete dependency map for all symbols in a project.
 * This optimized version calculates dependencies and dependents efficiently.
 */
export function buildDependencyMap(symbols: Symbol[]): Map<FQN, DependencyNode> {
    const nodes = new Map<FQN, DependencyNode>();
    const dependentsMap = new Map<FQN, Set<FQN>>();

    console.log(`Building dependency map for ${symbols.length} symbols...`);

    // First pass: build nodes with dependencies only
    let processed = 0;
    for (const symbol of symbols) {
        try {
            const meta = asSymbolMeta(symbol);
            const dependencies = getSymbolDependencies(symbol);
            const hash = createSymbolHash(symbol);

            const node: DependencyNode = {
                symbol: meta.fqn,
                hash,
                dependencies,
                dependents: [], // Will be filled in second pass
                meta,
                analyzedAt: Date.now()
            };

            nodes.set(meta.fqn, node);

            // Track reverse dependencies for efficient dependent calculation
            for (const depFQN of dependencies) {
                if (!dependentsMap.has(depFQN)) {
                    dependentsMap.set(depFQN, new Set());
                }
                dependentsMap.get(depFQN)!.add(meta.fqn);
            }

            processed++;
            if (processed % 50 === 0) {
                console.log(`Processed ${processed}/${symbols.length} symbols...`);
            }
        }
        catch (error) {
            console.debug(`Skipping symbol in dependency map: ${error}`);
        }
    }

    // Second pass: populate dependents efficiently
    console.log(`Populating dependents for ${nodes.size} nodes...`);
    for (const [fqn, node] of nodes) {
        const dependentFQNs = dependentsMap.get(fqn);
        if (dependentFQNs) {
            node.dependents = Array.from(dependentFQNs);
        }
    }

    console.log(`Dependency map complete: ${nodes.size} nodes`);
    return nodes;
}

/**
 * Helper function to check if a cycle already exists in the cycles array.
 */
function hasCycle(cycles: FQN[][], newCycle: FQN[]): boolean {
    return cycles.some((existingCycle) => {
        if (existingCycle.length !== newCycle.length) {
            return false;
        }

        // Check if cycles are the same (considering rotation)
        for (let i = 0; i < existingCycle.length; i++) {
            let matches = true;
            for (let j = 0; j < existingCycle.length; j++) {
                if (existingCycle[j] !== newCycle[(i + j) % newCycle.length]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                return true;
            }
        }

        return false;
    });
}
