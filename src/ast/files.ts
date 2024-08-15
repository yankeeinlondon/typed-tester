import { Project, Symbol } from "ts-morph";




/**
 * **FileLookup**
 * 
 * Keys are relative filenames (from repo root or PWD if not repo),
 * values are the symbols which are found in the given file.
 */
export type FileLookup = {
  /** a hash of the last-updated date along with file contents */
  baseHash: number;
  /**
   * a hash of just the content (and with surrounding whitespace removed)
   */
  trimmedHash: number;
  /**
   * a map of the symbol's name to the hash value (as last measured)
   */
  symbols: Map<string, number>;
}


/**
 * Provides a list of symbols for the provided file
 */
export const importedSymbolsForFile = (p: Project, file: string) => {
  // 
}
