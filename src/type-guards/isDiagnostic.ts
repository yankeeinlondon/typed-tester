import { isObject } from "inferred-types";
import { Diagnostic, ts } from "ts-morph";

/**
 * type guard which validates passed in value is a `Diagnostic` from
 * **ts-morph**.
 */
export const isTsMorphDiagnostic = (val: unknown): val is Diagnostic => {
  return isObject(val) && "getCode" in val && typeof val.getCode === "function" && "getStart" in val
}

/**
 * type guard which validates passed in value is a `Diagnostic` from
 * Typescript (but not **ts-morph**).
 */
export const isTsDiagnostic = (val: unknown): val is ts.Diagnostic => {
  return isObject(val) && "code" in val && typeof val.code === "number"
}
