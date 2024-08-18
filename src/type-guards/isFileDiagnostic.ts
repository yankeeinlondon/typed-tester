import { isObject } from "inferred-types";
import { FileDiagnostics } from "src/worker";


export const isFileDiagnostic = (val: unknown): val is FileDiagnostics => {
  return isObject(val) && "file" in val && "diagnostics" in val && typeof (val as any).file === "string";
}
