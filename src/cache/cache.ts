import xxhash from "xxhash-wasm";

import { clearSymbolsCache, saveSymbolLookup } from "./symbolCache";
export type Hasher = Awaited<ReturnType<typeof xxhash>>["h32"];

export const CACHE_FILE = ".ts-test-cache";
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
