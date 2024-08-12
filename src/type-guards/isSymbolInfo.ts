import { isObject } from "inferred-types"
import { SymbolInfo } from "src/ast/symbols";

/**
 * Type guard which checks whether the passed in value `SymbolInfo`
 * dictionary.
 */
export const isSymbolInfo = (val: unknown): val is SymbolInfo => {
  return isObject(val) && "symbol" in val && "reExportedIn" in val
};
