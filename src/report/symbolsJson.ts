import { SymbolMeta } from "src/ast";

export type SymbolJsonOutput = SymbolMeta;

export const symbolsJson = (rows: SymbolMeta[]): string => {
  const data: SymbolJsonOutput[] = rows.map(s => ({
    ...s,
  }));

  return JSON.stringify(data);
}
