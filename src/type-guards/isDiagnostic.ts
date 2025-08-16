import type { Diagnostic, ts } from "ts-morph";
import { isObject } from "inferred-types";

/**
 * type guard which validates passed in value is a `Diagnostic` from
 * **ts-morph**.
 */
export function isTsMorphDiagnostic(val: unknown): val is Diagnostic {
    return isObject(val) && "getCode" in val && typeof val.getCode === "function" && "getStart" in val;
}

/**
 * type guard which validates passed in value is a `Diagnostic` from
 * Typescript (but not **ts-morph**).
 */
export function isTsDiagnostic(val: unknown): val is ts.Diagnostic {
    return isObject(val) && "code" in val && typeof val.code === "number";
}
