import { SymbolMeta } from "src/ast/symbols";

/**
 * type guard used to narrow down a SymbolMeta to one which has 
 * a "kind" of "type"
 */
export const isSymbolAType = (val: SymbolMeta): val is SymbolMeta<boolean, "type"> => {
  return val.kind === "type"
}
