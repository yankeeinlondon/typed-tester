import { getDependencyGraph, SymbolMeta } from "src/ast";
import { lookupSymbol } from "src/cache";


export type SymbolJsonOutput = Omit<SymbolMeta, "deps"> & { deps: SymbolMeta[]};

export const symbolsJson = (rows: SymbolMeta[]): string => {
  const data: SymbolJsonOutput[] = rows.map(s => ({
    ...s,
    deps: [
      ...s.deps.map(d => lookupSymbol(d)),
      ...getDependencyGraph(s.deps, false)
    ].filter(i => i)
  }) as SymbolJsonOutput);

  return JSON.stringify(data);
}
