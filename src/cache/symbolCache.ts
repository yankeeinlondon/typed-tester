import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { join } from "pathe";
import { getProject, getProjectRoot } from "src/ast";
import { FQN,  SymbolMetaWithDeps } from "src/types/symbol-ast-types";
import { asSymbolMeta } from "src/ast/symbols";
import { SourceFile } from "ts-morph";
import chalk from "chalk";
import { isFQN } from "~/type-guards";
import { SYMBOL_CACHE_FILE } from "~/constants";

/** maps fully qualified symbol names to their metadata */
let symbolLookup = new Map<FQN, SymbolMetaWithDeps>();
/** maps a symbol name to zero or more matches of fully qualified names */
let fuzzySymbols = new Map<string, Set<string>>;

export type SymbolSummary = {
    exported: number;
    /** the keys which map to an exported symbol */
    export_keys: string[],
    local: number;
    external: number;
    /**
     * The count of Type symbols
     */
    typeSymbols: number;
}

const symbolSummary: SymbolSummary = {
    exported: 0,
    export_keys: [],
    local: 0,
    external: 0,
    typeSymbols: 0,
}

const cache_file = () => join(getProjectRoot(), SYMBOL_CACHE_FILE);

export const getSymbolCacheSummary = () => {
    return symbolSummary;
}
/**
 * clears the in-memory symbols cache and reloads from 
 * file where it exists, otherwise starts with a clean
 * slate.
 */
export const initializeSymbolLookup = () => {

    symbolLookup = new Map<FQN, SymbolMetaWithDeps>();
    fuzzySymbols = new Map<string, Set<string>>();

    if (existsSync(cache_file())) {
        try {
            const data = JSON.parse(readFileSync(cache_file(), "utf-8")) as SymbolMetaWithDeps[];
            updateSymbolCache(...data);
        } catch (e) {
            throw new Error(`Problems loading the symbol cache file: ${chalk.blue(cache_file())}\nErr msg: ${String(e)}`)
        }
    } else {
        cacheExportedSymbols();
        saveSymbolLookup();
    }
    return symbolLookup;
}

export const hasSymbolCacheFile = (): boolean => {
    return existsSync(cache_file());
}

/**
 * clears the in-memory symbol lookup cache, the
 * fuzzy symbol lookup, and then removes the file based
 * cache for symbols.
 */
export const clearSymbolsCache = () => {
    symbolLookup = new Map<FQN, SymbolMetaWithDeps>();
    fuzzySymbols = new Map<string, Set<string>>;
    if (hasSymbolCacheFile()) {
        unlinkSync(join(getProjectRoot(), SYMBOL_CACHE_FILE));
    }
}

export const getSymbolLookup = () => {
    return symbolLookup;
}

/**
 * Provides all the _keys_ of the symbol lookup table.
 * 
 * If you pass in a `true` value to the optional _onlyExported_ 
 * parameter then this lookup will be filtered down to only the 
 * exported symbol keys.
 */
export const getSymbolLookupKeys = (onlyExported?: boolean): string[] => {
    return onlyExported
        ? symbolSummary.export_keys
        : Array.from(symbolLookup.keys())
}

export const getSymbols = (...keys: string[]) => {
    const fqn = keys.filter(isFQN);
    return fqn.map(i => symbolLookup.get(i)).filter(i => i) as SymbolMetaWithDeps[]
}

export const saveSymbolLookup = () => {
    const data = JSON.stringify(Array.from(symbolLookup.values()));
    const file = join(getProjectRoot(), SYMBOL_CACHE_FILE);
    writeFileSync(file, data, "utf-8");
}

export const lookupSymbol = (sym: string) => {
    if (isFQN(sym)) {
        return symbolLookup.get(sym)
    } else {
        return undefined;
    }
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
    const projectSymbols = new Map<string, SymbolMetaWithDeps>();

    for (const file of sourceFiles) {
        const symbolsForFile = file.getExportSymbols()
            .map(s => asSymbolMeta(s))
            .sort((a, b) => b.name.localeCompare(a.name));

        for (const s of symbolsForFile) {
            if (!projectSymbols.has(s.fqn)) {
                projectSymbols.set(s.fqn, s);
            }
        }
    }
    const symbols = Array.from(projectSymbols.values());

    // push the exported symbols into cache
    // dependencies will have already been added to the cache
    updateSymbolCache(...symbols);
}

/**
 * Adds a symbol to the cache if not already present in the cache
 * (ignored if it's already in place).
 * 
 * - use `upsertSymbolToCache()` instead if you want this version
 * to supercede any versions previously added.
 */
export const addSymbolToCache = (sym: SymbolMetaWithDeps) => {
    if (!symbolLookup.has(sym.fqn)) {
        symbolLookup.set(sym.fqn, sym);
    }
}

/**
 * Adds a symbol to the cache; replacing the current entry if present.
 * 
 * - use `addSymbolToCache()` instead if you only want to add this 
 * if it _doesn't already exist_.
 */
export const upsertSymbolToCache = (sym: SymbolMetaWithDeps) => {
    symbolLookup.set(sym.fqn, sym);
}


/**
 * updates (or adds) symbols to the Symbol Lookup in-memory cache,
 * while also making sure that the fuzzy finder is kept up-to-date
 * and the summary's are 
 */
export const updateSymbolCache = (...symbols: SymbolMetaWithDeps[]) => {
    symbolSummary.typeSymbols = symbols.filter(i => i.isTypeSymbol).length

    for (const s of symbols) {
        const isUpdate = symbolLookup.get(s.fqn) ? true : false;
        symbolLookup.set(s.fqn, s);
        if (fuzzySymbols.has(s.name)) {
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
                symbolSummary.external = symbolSummary.external + 1;
            } else if (s.scope === "local") {
                symbolSummary.local = symbolSummary.local + 1
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
export const fuzzyFindSymbol = (name: string, op: "match" | "contains") => {
    switch (op) {
        case "contains":
            const fuzzyKeys = Array.from(
                fuzzySymbols.keys()
            ).filter(i => i.includes(name));
            const keys = fuzzyKeys.flatMap(
                k => Array.from(fuzzySymbols.get(k) || [])
            );

            return keys
                .map(k => symbolLookup.get(k))
                .filter(i => i) as SymbolMetaWithDeps[]

        case "match":
            const found = fuzzySymbols.get(name);
            return found
                ? Array.from(found)
                    .map(k => symbolLookup.get(k)) as SymbolMetaWithDeps[]
                : [];
        default:
            throw new Error(`Unknown op passed to fuzzyFindSymbol: ${op}!`)
    }
}
