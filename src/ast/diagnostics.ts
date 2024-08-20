import { isArray, isString, ObjectKey } from "inferred-types";
import {  Diagnostic, SourceFile } from "ts-morph";
import { getProject } from "./project";
import {  asFileDiagnostic, getFileDiagnostics } from "./files";
import { AsOption } from "src/cli";
import { FileDiagnostic } from "./file-ast-types";
import { isFileDiagnostic, isSourceFile } from "src/type-guards";
import { TestFile } from "./testing-types";

export type BlockType = {
  startLine: number;
  endLine: number;
  [key: ObjectKey]: unknown
}


export const getErrorDiagnostics = (
  input: string | SourceFile | FileDiagnostic[],
  opt: AsOption<null>
) => {
  const diag: FileDiagnostic[] = isString(input)
    ? getFileDiagnostics(getProject().addSourceFileAtPath(input))
    : isSourceFile(input) 
      ? getFileDiagnostics(input)
      : input;

  return diag.filter(d => !opt.warn.includes(d.code))
}

export const isErrorDiagnostic = (diag: Diagnostic | FileDiagnostic, opt: AsOption<null>) => {
  const diagnostic = isFileDiagnostic(diag) ? diag : asFileDiagnostic(diag);

  return !opt.warn.includes( diagnostic.code );
}


export const getWarningDiagnostics = (
  input: string | SourceFile | FileDiagnostic[],
  opt: AsOption<null>
) => {
  const diag: FileDiagnostic[] = isString(input)
    ? getFileDiagnostics(getProject().addSourceFileAtPath(input))
    : isSourceFile(input) 
      ? getFileDiagnostics(input)
      : input;

  return diag.filter(d => opt.warn.includes(d.code))
}

/**
 * Get the diagnostics for a page and then the isolates only those
 * between a start and end line number.
 */
export const getDiagnosticsBetweenLines = (
  input: string | SourceFile | FileDiagnostic[],
  startingAt: number,
  endingAt: number,
) => {
  if (isString(input) || isSourceFile(input)) {
    const sourceFile = isString(input)
        ? getProject().addSourceFileAtPath(input)
        : input;
  
    const diag = getFileDiagnostics(sourceFile);
  
    return diag.filter(d => 
      d.loc.lineNumber >= startingAt && 
      d.loc.lineNumber <= endingAt
    )
  } else {
    // received list of diagnostics
    return input.filter(d => d.loc.lineNumber >= startingAt && d.loc.lineNumber <= endingAt)
  }
}

export const getWarningDiagnosticsBetweenLines = (
  file: string | SourceFile,
  startingAt: number,
  endingAt: number,
  opt: AsOption<null>
) => {
  return getDiagnosticsBetweenLines(file,startingAt,endingAt).filter(d => opt.warn.includes(d.code))
}

export const getErrorDiagnosticsBetweenLines = (
  file: string | SourceFile,
  startingAt: number,
  endingAt: number,
  opt: AsOption<null>
) => {
  return getDiagnosticsBetweenLines(file,startingAt,endingAt).filter(d => !opt.warn.includes(d.code))
}


const notContainedBy = (...blocks: BlockType[]) => (d: FileDiagnostic) => {
  return !blocks.some(b => d.loc.lineNumber >= b.startLine && d.loc.lineNumber <= b.endLine)
}

/**
 * **getErrorsOutsideBlocks**`(file, ...blocks)`
 * 
 * Returns the diagnostics which **are not** contained by the
 * passed in block elements.
 * 
 * **Note:** a "block element" is any dictionary based object with
 * keys of `startLine` and `endLine`.
 */
export const getDiagnosticsOutsideBlocks = (
  input: string | SourceFile | FileDiagnostic[],
  ...blocks: BlockType[]
): FileDiagnostic[] => {

  return isString(input) || isSourceFile(input)
    ? getFileDiagnostics(input)
        .filter(notContainedBy(...blocks))
    : isArray(input)
      ? input.filter(notContainedBy(...blocks))
      : []
}


export const hasDiagnostics = (file: TestFile | SourceFile): boolean => {
  if (isSourceFile(file)) {
    const d = file.getPreEmitDiagnostics();
    return d.length > 0
  } else {
    return file.blocks.flatMap(b => b.diagnostics).length > 0
  }
}
