import { DiagnosticCategory } from "ts-morph";
import { SymbolReference } from "./symbol-ast-types";


export type FileDiagnostic = {
  /** the TS Error code */
  readonly code: number;
  readonly category: DiagnosticCategory;
  /** the error message */
  readonly msg: string;
  readonly filepath: string | undefined;
  readonly loc: {
    readonly lineNumber: number;
    readonly column: number;
    readonly start: number | undefined;
    readonly length: number | undefined;
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
  symbols: ReadonlyMap<string, number>;


}


export type FileMeta = {
  /** The relative path to the file from the project root */
  filepath: string;

  /**
   * Symbols _imported_ by the file. This includes both internal
   * imports from the current project and external dependencies.
   */
  imports: SymbolImport[];

  /**
   * Symbols _defined_ in the file. This includes types, interfaces,
   * classes and other exported symbols.
   */
  symbols: SymbolReference[];

  /**
   * TypeScript compiler diagnostics found in the file.
   * Includes errors, warnings and suggestions.
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

