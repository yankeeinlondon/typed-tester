import { relative } from "pathe";
import { cwd } from "process";
import { Project, SourceFile, Node, Symbol, TypeChecker, ts } from "ts-morph";
import { SymbolMeta } from "./files";
import { isSymbol, isSymbolInfo } from "src/type-guards";
import { isSymbolMeta } from "src/type-guards/isSymbolMeta";

export type SymbolInfo = {
  symbol: Symbol;
  /** the file where the symbol is defined */
  filepath: string;
  /** the _starting_ line where the symbol is defined */
  startLine: number;
  /** the _ending_ line where the symbol is defined */
  endLine: number;
  /** the files -- typically an `index.ts` file -- which re-exports the symbol */
  reExportedIn: string[];
}

type Dependency = {
  name: string;
  symbol: Symbol;
}

function isGenericSymbol(symbol: Symbol): boolean {
  // Check if the symbol is a type parameter (generic type)
  const flags = symbol.getFlags();
  return (flags & ts.SymbolFlags.TypeParameter) !== 0;
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
 * provides the name for a given symbol
 */
export const symbolName = (sym: Symbol | SymbolInfo | SymbolMeta): string => {
  const name: string | undefined = isSymbol(sym)
    ? sym.getName()
    : isSymbolInfo(sym)
    ? sym.symbol.getName()
    : isSymbolMeta(sym)
    ? sym.symbol.getName()
    : undefined;

  if (!name) {
    throw new Error(`Invalid symbol provided to symbolName()!`);
  }

  return name;
}

/**
 * Provides the filepath to the file which contains the definition for a given file
 */
export const symbolDefinedIn = (sym: Symbol | SymbolInfo | SymbolMeta) => {
  const s: Symbol | undefined = isSymbol(sym)
    ? sym 
    : isSymbolInfo(sym)
    ? sym.symbol
    : isSymbolMeta(sym)
    ? sym.symbol
    : undefined;
  
  if (!s) {
    throw new Error(`Invalid symbol passed to symbolDefinedIn(); couldn't determine the filepath!`)
  }

  const name = symbolName(sym);

  return relative(
    cwd(), 
    JSON.parse(s.getFullyQualifiedName().replace(`.${name}`, ""))
  )
}


export const findDependenciesFor = (project: Project, symbol: Symbol): Dependency[] => {
  const dependencies: Dependency[] = [];
  const typeChecker: TypeChecker = project.getTypeChecker();

  // Get the declaration node for the symbol
  const declarations = symbol.getDeclarations();
  if (declarations.length === 0) {
    return dependencies;
  }

  // Analyze each declaration of the symbol
  declarations.forEach(declaration => {
    const references = getReferencedSymbols(declaration, typeChecker);

    references.forEach(ref => {
      const refSymbol = typeChecker.getSymbolAtLocation(ref);
      if (refSymbol) {
        let name = refSymbol.getName();
        if (name !== symbol.getName()) {
          dependencies.push({
            name,
            symbol: refSymbol
          });
        }
      }
    });
  });

  return dependencies;
}

/**
 * Returns all exported symbols in the project
 */
export const getExportedSymbols = (p: Project, files?: SourceFile[]) => {
  const sourceFiles = files || p.getSourceFiles();

  /**
   * all exported symbols in the project
   */
  const projectSymbols: Map<string, SymbolInfo> = new Map<string, SymbolInfo>();

  for (const file of sourceFiles) {
    const symbols = file.getExportSymbols();
    for (const sym  of symbols) {
      const decl = sym.getDeclarations();
      for (const d of decl) {
        // DEFINE PROPS
        const name = sym.getName();
        const filepath = file.getFilePath();
        const startLine = d.getStartLineNumber();
        const endLine = d.getEndLineNumber();
        const fqn = relative(cwd(), JSON.parse(sym.getFullyQualifiedName().replace(`.${name}`, "")));
        const definesSymbol = filepath.includes(fqn);

        if (!projectSymbols.has(name)) {
          projectSymbols.set(name, {
            symbol: sym,
            filepath: definesSymbol ? relative(cwd(), filepath) : "",
            startLine,
            endLine,
            reExportedIn: definesSymbol ? [] : [ relative(cwd(),  filepath) ]
          })
        } else {
          let existing = projectSymbols.get(name);
          if (existing) {
            if (definesSymbol) {
              projectSymbols.set(name, {
                symbol: sym,
                filepath: relative(cwd(), filepath),
                startLine,
                endLine,
                reExportedIn: existing.reExportedIn
              })
            } else {
              projectSymbols.set(name, {
                ...existing,
                reExportedIn: [...existing.reExportedIn, relative(cwd(),  filepath)]
              })
            }
          }
          projectSymbols.get(name)?.reExportedIn.push(filepath);
        }

      }
    }
  }
 
  return projectSymbols;
}
