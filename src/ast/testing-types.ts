

import { FileDiagnostic, SymbolImport } from "./file-ast-types";
import {  SymbolReference } from "./symbol-ast-types";

export type TypeTest = {
  filepath: string;
  description: string;
  startLine: number;
  endLine: number;
  skip: boolean;
  diagnostics: FileDiagnostic[];
  symbols: SymbolReference[];
};

export type TestBlock = {
  filepath: string;
  description: string;
  startLine: number;
  endLine: number;
  skip: boolean;
  diagnostics: FileDiagnostic[];
  tests: TypeTest[];
};

export type TestFile = {
  filepath: string;

  importSymbols: SymbolImport[];

  /** time file was created */
  ctime: Date;
  /**
   * the raw file text content, trimmed, and then hashed
   */
  hash: number;
  size: number;
  /**
   * Sets the whole file to be skipped if all the blocks
   * or all the tests are set to be skipped.
   */
  skip: boolean;
  skippedTests: number;
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
  cacheData?: { hash: number; ctime: Date; size: number };

  /**
   * By default, the filtering function will reduce symbols
   * captured to only those whose `kind` property is "type-defn"
   * as this is typically what we're concerned with in testing
   * but you can replace this function with whatever you like.
   */
  symbolsFilter?: SymbolFilterCallback;
}

export type TestSummary = {
  /** files which have diagnostics on this test criteria  */
  withDiagnostics: string[],
  slow: string[],
  filesWithErrors: number;
  filesWithWarnings: number;
  testsWithErrors: number;
  /** the number of tests which were skipped */
  skipped: number;
  /** the total number of tests found */
  tests: number;
  /** the total number of test files evaluated */
  testFiles: number;
}
