import { Diagnostic } from "ts-morph";
import { asFileDiagnostic, FileDiagnostic } from "../ast/files";
import { AsOption } from "src/cli";
import { isFileDiagnostic, isTsDiagnostic, isTsMorphDiagnostic } from "src/type-guards";


export type ErrorsAndWarnings = {
  totalErrors: number;
  totalWarnings: number;
  /**
   * The errors (sorted by line number in file)
   */
  errors: FileDiagnostic[];
  /**
   * The errors (sorted by line number in file)
   */
  warnings: FileDiagnostic[];
}

/**
 * Receives `Diagnostics` (or `FileDiagnostic`) array and splits
 * the diagnostics into errors and warnings based on the configuration
 * passed in.
 */
export const splitErrAndWarnings = (
  diagnostics: Diagnostic[] | FileDiagnostic[],
  opt: AsOption<null>,
) => {
  if (diagnostics.some(isTsDiagnostic)) {
    throw new Error(`Call splitErrAndWarnings was passed a bare Typescript Diagnostic, expected a `)
  }

  const errors = (
    diagnostics.map(
      d => isFileDiagnostic(d) 
        ? d 
        : isTsMorphDiagnostic(d) ? asFileDiagnostic(d) : undefined
    ) as FileDiagnostic[]
  )
    .filter(i => i)
    .filter(i => !opt.warn.includes(i.code))
    .sort((a,b) => 
      ((a.loc.lineNumber * 100) + a.loc.column) - 
      ((b.loc.lineNumber * 100) + b.loc.column)
  );

  const warnings = (
    diagnostics.map(
      d => isFileDiagnostic(d) 
        ? d 
        : isTsMorphDiagnostic(d) ? asFileDiagnostic(d) : undefined
    ) as FileDiagnostic[]
  )
    .filter(i => i)
    .filter(i => opt.warn.includes(i.code))
    .sort((a,b) => 
      ((a.loc.lineNumber * 100) + a.loc.column) - 
      ((b.loc.lineNumber * 100) + b.loc.column)
  );

  return { errors, warnings }
}
