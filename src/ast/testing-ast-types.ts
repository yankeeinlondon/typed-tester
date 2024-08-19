
import { FileDiagnostic } from "./files";
import {  SymbolReference } from "./symbol-ast-types";

export type TypeTest = {
  description: string;
  startLine: number;
  endLine: number;
  diagnostics: FileDiagnostic[];
  symbols: SymbolReference[];
};

export type TestBlock = {
  description: string;
  startLine: number;
  endLine: number;
  diagnostics: FileDiagnostic[];
  tests: TypeTest[];
};

export type TestFile = {
  filepath: string;
  blocks: TestBlock[];
};

