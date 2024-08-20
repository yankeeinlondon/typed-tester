

import { FileDiagnostic } from "./file-ast-types";
import {  SymbolReference } from "./symbol-ast-types";

export type TypeTest = {
  filepath: string;
  description: string;
  startLine: number;
  endLine: number;
  diagnostics: FileDiagnostic[];
  symbols: SymbolReference[];
};

export type TestBlock = {
  filepath: string;
  description: string;
  startLine: number;
  endLine: number;
  diagnostics: FileDiagnostic[];
  tests: TypeTest[];
};

export type TestFile = {
  filepath: string;
  atime: Date;
  /**
   * the raw file text content, trimmed, and then hashed
   */
  hash: number;
  size: number;
  blocks: TestBlock[];
  /**
   * The time it took to analyze the test file
   */
  duration: number;
  /**
   * The number of _lines_ in the file which the test blocks
   * consume. This is used on some performance metrics to
   * get a _slightly_ better view on the duration number
   * above.
   */
  testLines: number;
};

export type SymbolFilterCallback = (sym: SymbolReference) => boolean;

export type TestFileOptions = {
  /**
   * If the caller already has cache data then they can provide
   * it here to avoid to recomputing it.
   */
  cacheData?: { hash: number; atime: Date; size: number };

  /**
   * By default, the filtering function will reduce symbols
   * captured to only those whose `kind` property is "type-defn"
   * as this is typically what we're concerned with in testing
   * but you can replace this function with whatever you like.
   */
  symbolsFilter?: SymbolFilterCallback;
}
