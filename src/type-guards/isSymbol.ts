import { isObject } from "inferred-types"
import { Symbol } from "ts-morph";
/**
 * Type guard which checks whether the passed in value is a `Symbol`
 * from **ts-morph**.
 */
export const isSymbol = (val: unknown): val is Symbol => {
  return isObject(val) && "getExports" in val && "getName" in val
};
