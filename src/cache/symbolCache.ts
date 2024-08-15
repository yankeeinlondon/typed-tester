import { getProject } from "src/ast/projectUsing";
import { SymbolMeta } from "src/ast/symbol-ast-types";
import { asSymbolMeta } from "src/ast/symbols";
import { SourceFile } from "ts-morph";

/** maps fully qualified symbol names to their metadata */
let symbolLookup = new Map<string, SymbolMeta>();
/** maps a symbol name to zero or more matches of fully qualified names */
let fuzzySymbols = new Map<string, Set<string>>;

export type SymbolSummary = {
  exported: number;
  /** the keys which map to an exported symbol */
  export_keys: string[],
  local: number;
  external: number;
}

const symbolSummary: SymbolSummary = {
  exported: 0,
  export_keys: [],
  local: 0,
  external : 0
}

export const getSymbolCacheSummary = () => {
  return symbolSummary;
}

export const initializeSymbolLookup = async() => {
  // TODO: try to load cache from file
  return symbolLookup;
}

export const clearSymbolsCache = () => {
  symbolLookup = new Map<string, SymbolMeta>();
  fuzzySymbols = new Map<string, Set<string>>;
}

export const getSymbolLookup = () => {
  return symbolLookup;
}

/**
 * Provides a list of the symbol lookup table.
 * 
 * If you pass in a `true` value to the optional _onlyExported_ 
 * parameter then this lookup will be filtered down to only the 
 * exported symbols.
 */

export const getSymbolLookupKeys = (onlyExported?: boolean): string[] => {
  return onlyExported 
    ? symbolSummary.export_keys
    : Array.from(symbolLookup.keys())
}

export const getSymbols = (...keys:  string[]) => {
  return keys.map(i => symbolLookup.get(i)).filter(i => i) as SymbolMeta[]
}

export const saveSymbolLookup = () => {

}

export const lookupSymbol = (sym: string) => {
  return symbolLookup.get(sym)
}


/**
 * Caches all _exported_ symbols found in the project along
 * with their dependant symbols to memory.
 * 
 * **Note:** you may optionally provide the list of source files 
 * for the project but if not then this will be calculated 
 * for you.
 */
export const cacheExportedSymbols = (
  files?: SourceFile[]
) => {
  const p = getProject();
  const sourceFiles = files || p.getSourceFiles();

  clearSymbolsCache();

  /**
   * a collection of all exported symbols in the project
   */
  const projectSymbols = new Map<string, SymbolMeta>();

  for (const file of sourceFiles) {
    const symbolsForFile = file.getExportSymbols()
      .map(s => asSymbolMeta(s, true))
      .sort((a,b) => b.name.localeCompare(a.name));
    

    for (const s  of symbolsForFile) {
      if (!projectSymbols.has(s.fqn)) {
        projectSymbols.set(s.fqn, s);
      }
    }
  }
  const symbols = Array.from(projectSymbols.values());
  
  // push the exported symbols into cache
  // dependencies will have already been added to the cache
  updateSymbolsInCache(...symbols);
 
}


/**
 * updates (or adds) symbols to the Symbol Lookup in-memory cache,
 * while also making sure that the fuzzy finder is kept up-to-date
 * and the summary's are 
 */
export const updateSymbolsInCache = (...symbols: SymbolMeta[]) => {

  for (const s of symbols) {
    const isUpdate = symbolLookup.get(s.fqn) ? true : false;
    symbolLookup.set(s.fqn, s);
    if(fuzzySymbols.has(s.name)) {
      let list = fuzzySymbols.get(s.name) as Set<string>;
      list.add(s.fqn);
      fuzzySymbols.set(s.name, list);
    } else {
      if (s.scope === "module") {
        fuzzySymbols.set(s.name, new Set([s.fqn]));
      }
    }

    if (!isUpdate) {
      if (s.scope === "external") {
        symbolSummary.external = symbolSummary.external+ 1;
      } else if (s.scope === "local") {
        symbolSummary.local = symbolSummary.local+ 1
      } else if (s.scope === "module") {
        symbolSummary.export_keys = [...symbolSummary.export_keys, s.fqn];
        symbolSummary.exported = symbolSummary.exported + 1;
      }
    }
  }
}

/**
 * find _exported_ symbols by their name rather than by the fully
 * qualified name.
 */
export const fuzzyFindSymbol = (name: string, op: "match" | "contains") =>  {
  switch(op) {
    case "contains":
      const fuzzyKeys = Array.from(
        fuzzySymbols.keys()
      ).filter(i => i.includes(name));
      const keys = fuzzyKeys.flatMap(
        k => Array.from(fuzzySymbols.get(k) || [])
      );
      
      return keys
        .map(k => symbolLookup.get(k))
        .filter(i => i) as SymbolMeta[]

    case "match":
      const found = fuzzySymbols.get(name);
      return found
        ? Array.from(found)
            .map(k => symbolLookup.get(k))  as SymbolMeta[]
        : [];
    default: 
      throw new Error(`Unknown op passed to fuzzyFindSymbol: ${op}!`)
  }
}
