import { SymbolMeta } from "src/ast";

export type SymbolJsonOutput = Omit<SymbolMeta, "deps"> & { deps: SymbolMeta[]};

export const symbolsJson = (rows: SymbolMeta[]): string => {
  // Cache removed - simplified output without dependency resolution
  const data: SymbolJsonOutput[] = rows.map(s => ({
    ...s,
    deps: [] // Dependencies temporarily disabled during cache removal
  }) as SymbolJsonOutput);

  return JSON.stringify(data);
}
