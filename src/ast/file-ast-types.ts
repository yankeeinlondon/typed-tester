import { DiagnosticCategory } from "ts-morph";
import { SymbolReference } from "./symbol-ast-types";


export type FileDiagnostic = {
  /** the TS Error code */
  code: number;
  category: DiagnosticCategory;
  /** the error message */
  msg: string;
  filepath: string | undefined;
  loc: {
    lineNumber: number;
    column: number;
    start: number | undefined;
    length: number | undefined;
  }
}

export type SymbolImport = {
  symbol: SymbolReference;
  as: string;
  source: string;
  exportKind: "default" | "named";
  /**
   * whether the import is for an external repo or something
   * within the current repo.
   */
  isExternalSource: boolean;
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


export type FileMeta = {
  filepath: string;

  /**
   * symbols _imported_ by the file
   */
  imports: SymbolImport[];
  /**
   * symbols _defined_ in the file
   */
  symbols: SymbolReference[];
  /**
   * diagnostics found in the file
   */
  diagnostics: FileDiagnostic[];

  /**
   * A hash which detects whether the symbol's imported
   * have changed. Ordering, whitespace, and other aspects
   * are ignored.
   */
  importsHash: number;
  /**
   * A hash which detects whether the symbols which are 
   * _defined_ on the page have changed but **not** whether
   * the definition itself has changed.
   */
  symbolsHash: number;
  /**
   * A hash which detects change in the diagnostic status
   * of this file.
   */
  diagnosticsHash: number;

  /**
   * A hash which detects whether any of the other hashes
   * (besides `fileContentHash`) have changed.
   */
  fileHash: number;

  /**
   * helps to detect whether the textual content -- with edge 
   * whitespace trimmed -- has changed.
   */
  fileContentHash: number;
}

