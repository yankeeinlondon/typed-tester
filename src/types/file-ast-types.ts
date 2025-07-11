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
  /**
   * a map of the symbol's name to metadata
   */
  symbols: ReadonlyMap<string, SymbolReference>;
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

}

