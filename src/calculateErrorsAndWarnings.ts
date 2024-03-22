import { FileDiagnostics } from "./getFileDiagnostics";
import { ValidationOptions } from "./typeValidation";


export const calcErrorsAndWarnings = (file: FileDiagnostics, opts: ValidationOptions) => {
  const hasErrors = file.diagnostics
  .filter(i => !opts.warn.includes(String(i.code)) )
  .length > 0 ? true : false;
  const hasWarnings = file.diagnostics
    .filter(i => opts.warn.includes(String(i.code)) )
    .length > 0 ? true : false;

  return { hasErrors, hasWarnings }
}
