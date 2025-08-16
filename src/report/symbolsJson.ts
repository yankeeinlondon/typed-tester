import type { SymbolMeta } from "src/ast";

export type SymbolJsonOutput = Omit<SymbolMeta, "deps"> & { deps: SymbolMeta[] };

export function symbolsJson(rows: SymbolMeta[]): string {
    // Include dependency data from the dependency graph system
    const data: SymbolJsonOutput[] = rows.map(s => ({
        ...s,
        deps: (s as any).deps || [] // Use dependencies from dependency graph analysis
    }) as SymbolJsonOutput);

    return JSON.stringify(data);
}
