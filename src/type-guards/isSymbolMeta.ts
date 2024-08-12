import { isObject } from "inferred-types"
import { SymbolMeta } from "src/ast/files";


/**
 * Type guard which checks whether the passed in value `SymbolInfo`
 * dictionary.
 */
export const isSymbolMeta = (val: unknown): val is SymbolMeta => {
  return isObject(val) && "name" in val && "symbol" in val && "symbolHash" in val
};
