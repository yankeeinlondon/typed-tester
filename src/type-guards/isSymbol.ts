import type { Symbol } from "ts-morph";
import { isObject } from "inferred-types";
/**
 * Type guard which checks whether the passed in value is a `Symbol`
 * from **ts-morph**.
 */
export function isSymbol(val: unknown): val is Symbol {
    return isObject(val) && "getExports" in val && "getName" in val;
}
