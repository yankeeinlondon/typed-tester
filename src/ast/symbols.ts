import { relative } from "pathe";
import { cwd } from "process";
import { 
  Node, 
  Symbol, 
  TypeChecker, 
  ts, 
  SyntaxKind, 
  ModifierableNode, 
  SymbolFlags,
  ImportDeclaration, 
} from "ts-morph";
import {  
  isSymbol, 
} from "src/type-guards";
import { isSymbolMeta } from "src/type-guards/isSymbolMeta";
import { 
  JsDocInfo, 
  SymbolFlagKey,  
  SymbolKind, 
  SymbolMeta, 
  SymbolScope, 
  TypeGeneric 
} from "./symbol-ast-types";
import { getHasher } from "src/cache/cache";
import { getProjectTypeChecker } from "./projectUsing";
import { lookupSymbol, updateSymbolsInCache } from "src/cache";


function getSymbolsJSDocInfo(symbol: Symbol): JsDocInfo[] {
  const declarations = symbol.getDeclarations();
  const jsDocInfo = declarations.map(declaration => {
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
      } else {
          return null;
      }
  }).filter(info => info !== null); // Filter out any null entries

    return jsDocInfo;
}

function getSymbolGenerics(symbol: Symbol): TypeGeneric[] {
  const declarations = symbol.getDeclarations();
  const generics: TypeGeneric[] = [];

  declarations.forEach(declaration => {
    if (Node.isFunctionLikeDeclaration(declaration) || Node.isClassDeclaration(declaration) || Node.isInterfaceDeclaration(declaration) || Node.isTypeAliasDeclaration(declaration)) {
        const typeParameters = declaration.getTypeParameters();
        typeParameters.forEach(typeParam => {
            generics.push({
                name: typeParam.getName(),
                type: typeParam.getType().getText()
            });
        });
    }
  });

  return generics;
}

export const isExternalSymbol = (sym: Symbol): boolean => {
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
      // Check if the declaration itself has the 'export' keyword
      if (
          Node.isModifierable(declaration) &&
          declaration.getModifiers().some(mod => mod.getKind() === SyntaxKind.ExportKeyword)
      ) {
          return true;
      }

      const sourceFile = declaration.getSourceFile();

      // Check for export statements like 'export { MySymbol };'
      const exportDeclarations = sourceFile.getExportDeclarations();
      for (const exportDecl of exportDeclarations) {
          const namedExports = exportDecl.getNamedExports();
          for (const namedExport of namedExports) {
              if (namedExport.getName() === symbol.getName()) {
                  return true;
              }
          }
      }

      // Check if the symbol is default exported
      const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
      if (defaultExportSymbol && defaultExportSymbol.getName() === symbol.getName()) {
          return true;
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
function getSymbolScope(symbol: Symbol): SymbolScope {
  const declarations = symbol.getDeclarations();

  // If there are no declarations, it's likely an external symbol
  if (declarations.length === 0) {
      return 'external';
  }

  // Check if the symbol is declared in an external library
  const firstDeclaration = declarations[0];
  const sourceFile = firstDeclaration.getSourceFile();

  if (sourceFile.isInNodeModules()) {
      return 'external';
  }


  if (isExportedSymbol(symbol)) {
      return 'module';
  }

  // If not exported and not from an external library, it's local
  return 'local';
}

/**
 * Checks what external source/npm-package the package comes from.
 * 
 * Returns `null` if the source of the file is local or it's not found in node_modules;
 * otherwise returns the name of the package.
 */
const getSymbolSourcePackage = (symbol: Symbol): string | null => {
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
};

export function getSymbolDefinition(symbol: Symbol): string {
  // Get the declarations associated with the symbol
  const declarations = symbol.getDeclarations();

  // If there are no declarations, return undefined
  if (declarations.length === 0) {
      throw new Error(`Could not get the definition code for the symbol "${symbol.getName()}"`)
  }

  // Get the first declaration (typically, there's only one primary declaration)
  const declaration = declarations[0];

  // Return the full text of the declaration
  return declaration.getFullText();
}

export const createFullyQualifiedNameForSymbol = (sym: Symbol) => {
  const name = getSymbolName(sym);
  const {filepath} = getSymbolFileDefinition(sym);
  const scope = getSymbolScope(sym);
  const hasher = getHasher();

  return scope === "external"
    ? `ext::${hasher(String(getSymbolSourcePackage(sym)))}::${name}`
    : scope === "local"
    ? `local::${hasher(String(filepath))}::${name}`
    : `module::${hasher(sym.getFullyQualifiedName())}::${name}`
}

export const createSymbolHash = (sym: Symbol) => {
  const hasher = getHasher();
  const scope = getSymbolScope(sym);

  return scope === "external"
    ? hasher(String(getSymbolSourcePackage(sym)))
    : hasher(getSymbolDefinition(sym));
}

/**
 * Ensures the symbol's dependencies are pushed into cache (memory only)
 * and then returns an array of fully-qualified names back so these 
 * can be stored in the parent symbol's `deps` property.
 */
const pushSymbolDepsToCache = (sym: Symbol) => {
  const deps = getSymbolDependencies(sym, false).filter(d => d.kind === "type-defn");
  updateSymbolsInCache(...deps);

  return deps.map(i => i.fqn);
}

/**
 * **asSymbolMeta**`(sym)`
 * 
 * Converts a **ts-morph** `Symbol` into a `SymbolMeta` object which
 * contains useful summary information and is serializable.
 */
export const asSymbolMeta = (sym: Symbol, recurse?: boolean): SymbolMeta => ({
  name: getSymbolName(sym),
  fqn: createFullyQualifiedNameForSymbol(sym),
  // brings in filepath, startLine, and endLine
  ...getSymbolFileDefinition(sym),
  scope: getSymbolScope(sym),
  flags: getSymbolFlags(sym),
  kind: getSymbolKind(sym),
  generics: getSymbolGenerics(sym),
  jsDocs: getSymbolsJSDocInfo(sym),
  deps: recurse !== false && getSymbolKind(sym) === "type-defn" ?  pushSymbolDepsToCache(sym) : [],

  symbolHash: createSymbolHash(sym),
  updated: Date.now()
});

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
  return find.some(f => (flags & f) == f)
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
  return declarations.some(declaration => {
    const parent = declaration.getParent();

    // For variable declarations, check the parent VariableStatement
    if (Node.isVariableDeclaration(declaration) && parent && Node.isVariableStatement(parent)) {
      return parent.getModifiers().some(modifier => 
        modifier.getKind() === SyntaxKind.ExportKeyword || 
        modifier.getKind() === SyntaxKind.DefaultKeyword
      );
    }

    // For other declarations, check for export keyword directly
    if (
      Node.isFunctionDeclaration(declaration) ||
      Node.isClassDeclaration(declaration) ||
      Node.isInterfaceDeclaration(declaration) ||
      Node.isEnumDeclaration(declaration) ||
      Node.isTypeAliasDeclaration(declaration)
    ) {
      return (declaration as ModifierableNode).getModifiers().some(modifier =>
        modifier.getKind() === SyntaxKind.ExportKeyword || 
        modifier.getKind() === SyntaxKind.DefaultKeyword
      );
    }

    return false;
  });
}

function getReferencedSymbols(node: Node, typeChecker: TypeChecker): Node[] {
  const referencedSymbols: Node[] = [];

  // Recursively find all referenced symbols within the node
  node.forEachDescendant(descendant => {
    if (Node.isIdentifier(descendant)) {
      const symbol = typeChecker.getSymbolAtLocation(descendant);
      if (symbol && !isGenericSymbol(symbol)) {
        referencedSymbols.push(descendant);
      }
    }
  });

  return referencedSymbols;
}

/**
 * finds the symbol **name** for a given symbol or symbol metadata
 * structure.
 */
export const getSymbolName = (sym: Symbol | SymbolMeta): string => {
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
export const getSymbolKind = (symbol: Symbol): SymbolKind => {
  const sym =  symbol.getAliasedSymbol() || symbol;
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
    ) || 
    declarations.some(decl => 
      decl.getKind() === SyntaxKind.TypeAliasDeclaration || 
      decl.getKind() === SyntaxKind.InterfaceDeclaration ||
      decl.getKind() === SyntaxKind.TypeReference
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
    ) || 
    declarations.some(decl => 
      decl.getKind() === SyntaxKind.TypeParameter
    )
  ) {
    return "type-constraint";
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
  if (symbolType.isObject() && symbolType.getSymbol()?.getName() !== 'Object') {
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
    return "union-or-intersection"
  }

  // Check if it's a container (object, array, Map, Set, etc.)
  if (
    symbolType.isObject() ||
     symbolType.isArray()
  ) {
    return "container";
  }

  // Default to "other"
  return "other";
}


export const getSymbolFileDefinition = (sym: Symbol): { 
  filepath: string; 
  startLine: number;
  endLine: number;
} => {
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
};

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

const reverseLookupEnum = (enumObj: object) => (value: number): SymbolFlagKey[] => {
  return Object.entries(enumObj)
    .filter(([_key, val]) => typeof val === "number" && (value & val) === val)
    .map(([key]) => key as SymbolFlagKey) || `unknown(${value})`;
};

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
export const getSymbolFlags = <T extends Symbol>(sym: T): SymbolFlagKey[] => {
  const flag = sym.getFlags();
  return reverseLookupEnum(SymbolFlags)(flag);
}

/**
 * Returns an array of dependencies for a given symbol (name, 
 * Symbol, and _file path_ to symbol definition).
 * 
 * Note: we _are_ filtering out generics types from this list but properties 
 * and variables remain which may be filtered out by consumer (if not desirable) 
 * of this function by leveraging the `kind` of the returned `SymbolMeta`
 */
export const getSymbolDependencies = (
  symbol: Symbol,
  recurse: boolean = true
): SymbolMeta[] => {
  const dependencies: Map<string, Symbol> = new Map<string, Symbol>;
  const typeChecker: TypeChecker = getProjectTypeChecker();

  // Get the declaration node for the symbol
  const declarations = symbol.getDeclarations();
  if (declarations.length === 0) {
    return [];
  }

  // Analyze each declaration of the symbol
  declarations.forEach(declaration => {
    /** the symbols which a given declaration uses */
    const references = getReferencedSymbols(declaration, typeChecker);

    references.forEach(ref => {
      const refSymbol = typeChecker.getSymbolAtLocation(ref);
      if (refSymbol) {
        let name = refSymbol.getName();
        if (name !== symbol.getName() && !isGenericSymbol(refSymbol)) {
          if (!dependencies.has(name) ) {{
            dependencies.set(name, refSymbol)
          }}
        }
      }
    });
  });

  const deps: SymbolMeta[] = [];
  for (const [_name, sym] of dependencies) {
    deps.push(asSymbolMeta(sym, recurse));
  }

  return deps;
}

export type GraphNode = {
  symbol: string;
  requiredBy: string;
  depth: number;
}

const removeInitial = (graph: Map<string, GraphNode>): Map<string, GraphNode> => {
  const lvl0: string[] = [];

  for (const sym  of graph.values()) {
    if (sym.depth === 0) {
      lvl0.push(sym.symbol);
    }
  }
  
  for (const sym of lvl0) {
    graph.delete(sym);
  }

  return graph;
}

/**
 * **getDependencyGraph**`(symbols,[excludeInitial=false], [stopDepth=4])
 * 
 * Given a set of dependencies, will recursively iterate through 
 * dependencies and find _new_ dependencies which this collective
 * group of dependencies depends on.
 * 
 * Note: this works off the cache so it assumes this has been loaded.
 */
export const getDependencyGraph = (
  /** the fully qualified names for items in the  */
  symbols: string[],
  excludeInitial: boolean = false,
  stopDepth: number = 4,
  depth: number = 0,
  graph: Map<string, GraphNode> = new Map<string, GraphNode>()
): Map<string, GraphNode> => {

  if (depth === stopDepth) {
    return excludeInitial
      ? removeInitial(graph)
      : graph;
  }

  const newSymbols = symbols
    .filter(s => !graph.has(s)) // no duplicates
    .map(s => lookupSymbol(s))
    .filter(s => s) as SymbolMeta[];
  // now add symbols to graph
  for (const s of newSymbols) {
    graph.set(s.fqn, { symbol: s.fqn, requiredBy: s.name, depth });
  }
  
  // new deps are only those which now are new
  const newDeps = Array.from(
    new Set(
      newSymbols
        .flatMap(s => s.deps) // all the deps which existed before
    ) // ensure unique
  ).filter(s => !graph.has(s)) // removing newly added symbols
  

  if (newSymbols.length === 0) {
    return excludeInitial
    ? removeInitial(graph)
    : graph;
  }

  return getDependencyGraph(
    newDeps,
    excludeInitial,
    stopDepth,
    depth+1,
    graph
  )
}
