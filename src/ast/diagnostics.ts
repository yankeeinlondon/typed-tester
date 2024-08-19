import { isString } from "inferred-types";
import {  SourceFile } from "ts-morph";
import { getProject } from "./project";
import {  getFileDiagnostics } from "./files";
import { AsOption } from "src/cli";

/**
 * Get the diagnostics for a page and then the isolates only those
 * between a start and end line number.
 */
export const getDiagnosticsBetweenLines = (
  file: string | SourceFile,
  startingAt: number,
  endingAt: number,
) => {
  const sourceFile = isString(file)
      ? getProject().addSourceFileAtPath(file)
      : file;

  const diag = getFileDiagnostics(sourceFile);

  return diag.filter(d => 
    d.loc.lineNumber >= startingAt && 
    d.loc.lineNumber <= endingAt
  )
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
