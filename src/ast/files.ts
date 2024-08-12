import { Symbol } from "ts-morph";

export type SymbolMeta = {
  /** symbol name */
  name: string;
  /** symbol AST */
  symbol: Symbol;
  symbolHash: string;
}


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
