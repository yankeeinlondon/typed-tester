import type { FileDiagnostic } from "src/ast";
import { isObject } from "inferred-types";

/**
 * type guard which validates passed in value is a `FileDiagnostic`
 */
export function isFileDiagnostic(val: unknown): val is FileDiagnostic {
    return isObject(val) && "file" in val && "diagnostics" in val && typeof (val as any).file === "string";
}
