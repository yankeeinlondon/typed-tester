import { isObject } from "inferred-types";
import { FileDiagnostic } from "src/ast";


/**
 * type guard which validates passed in value is a `FileDiagnostic`
 */
export const isFileDiagnostic = (val: unknown): val is FileDiagnostic => {
  return isObject(val) && "file" in val && "diagnostics" in val && typeof (val as any).file === "string";
}
