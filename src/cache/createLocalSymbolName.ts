import { SymbolMeta } from "src/ast/files";
import { symbolDefinedIn, SymbolInfo } from "src/ast/symbols";
import { isSymbol, isSymbolInfo } from "src/type-guards";
import { isSymbolMeta } from "src/type-guards/isSymbolMeta";
import { Symbol } from "ts-morph";
import {  XXHashAPI } from "xxhash-wasm";


export const createLocalSymbolName = (hasher: XXHashAPI["h32"]) => (sym: Symbol | SymbolInfo | SymbolMeta) => {
  const name = isSymbol(sym)
    ? sym.getName()
    : isSymbolInfo(sym)
    ? sym.symbol.getName()
    : isSymbolMeta(sym)
    ? sym.name
    : undefined;

  if (!name) {
    throw new Error(`Invalid symbol passed to createLocalSymbolName(); unable to determine symbol name!`);
  }

  const filepath = symbolDefinedIn(sym);

  return `local::${hasher(filepath)}::${name}`
}
