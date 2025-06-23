import xxhash from "xxhash-wasm";
import { clearSymbolsCache, saveSymbolLookup } from "./symbolCache";
import { Dictionary } from "inferred-types";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { relative } from "pathe";
import { getProjectRoot } from "~/ast";



export type Hasher = Awaited<ReturnType<typeof xxhash>>["h32"];

/** hasher for XXHash algo */
let hasher: Hasher | null = null;


export const initializeHasher = async() => {
  const {h32} = await xxhash();
  hasher = h32;
  return  h32;
}

export const getHasher = (): Hasher => {
  if (hasher) {
    return hasher;
  } else {
    throw new Error(`The xxhash Hasher must be initialized with initializeHasher() call before calling getHasher()!`)
  }
}

export const saveCache = () => {
  saveSymbolLookup();
}

export const clearCache = (save?: boolean) => {
  clearSymbolsCache();

  if (save) {
    saveCache()
  }
}


function cacheApi<
    K extends string,
    V extends Dictionary<string>,
    TPropAsId extends keyof V,
    TFilePath extends string | undefined,
>(
    state: Map<K,V>,
    propAsId: TPropAsId,
    filePath: TFilePath,
) {

    const api = {
        /** clear the cache */
        clear() {
            state.clear();
        },
        /**
         * get an item from the cache
         */
        get(cacheItem: K) {
            return state.get(cacheItem);
        },

        /**
         * Provides a _keys_ MapIterator for the cache.
         */
        keys() {
            return state.keys()
        },

        invalidate(item: V) {
            state.delete(item[propAsId] as K)
        },

        /**
         * Adds a symbol to the cache if not already present in the cache
         * (no-op if it's already in place).
         * 
         * - use `upsertSymbolToCache()` instead if you want this version
         * to supercede any versions previously added.
         */
        add(item: V) {
            if(!state.has(item[propAsId] as K)) {
                state.set(item[propAsId] as K, item)
            }
        },

        /**
         * Adds an item to the cache; replacing the current entry if present.
         * 
         * - use `add()` instead if you only want to add this 
         * if it _doesn't already exist_.
         */
        upsert(item: V) {
            state.set(item[propAsId] as K, item)
        },

        /**
         * load the cache from file
         * 
         *  - if file doesn't exist then there is no action.
         */
        loadFromFile() {

            if(filePath) {
                if (existsSync(filePath)) {
                    const data = readFileSync(filePath, "utf-8");
                    const arr = JSON.parse(data) as V[];
                    state = new Map<K,V>();
                    for (const el of arr) {
                        state.set(el[propAsId] as K, el);
                    }

                }
            }
        },
        /**
         * save the current in-memory cache state to
         * file.
         */
        saveToFile() {
            if(filePath) {
                const data = JSON.stringify(Array.from(state.values()));
                try {
                    writeFileSync(filePath, data);
                    return true;
                } catch {
                    return false;
                }
            }
            return false
        },

        cacheFile: {
            fullPath: filePath,
            relativePath: relative(getProjectRoot(), filePath || "")
        }

    };

    type Api = typeof api;

    return api as TFilePath extends undefined
        ? Omit<Api, "loadFromFile" | "saveToFile" | "cacheFile">
        : Api;
}

export function createCache<
    K extends string,
    V extends Dictionary,
    TPropAsId extends keyof V,
    TFilePath extends string | undefined = undefined,
>(
    initialState: Map<K,V>,
    /** the property in the Map's value which is the "id" for the Map */
    propAsId: TPropAsId,
    /** optionally specify a file to make the cache durable */
    filePath: TFilePath = undefined as TFilePath,
) {

    return cacheApi(initialState,  propAsId, filePath);
}


