

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
};

