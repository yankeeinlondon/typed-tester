import type { SymbolMeta, TypeGeneric } from "~/types";
import chalk from "chalk";
import Table from "tty-table";
import { prettyMultiLinePath } from "./prettyPath";

export const SYMBOL_COL_LEN = 32;

/**
 * prints a table of symbols and their dependencies to
 * STDOUT.
 */
export function symbolsScreen(rows: SymbolMeta[]) {
    const columns: number = process.stdout.columns;
    const pathWidth: number = columns > 150
        ? 45
        : columns > 120
            ? 40
            : columns > 100 ? 35 : 30;

    const header = [
        {
            value: "name",
            alias: "Symbol",
            width: SYMBOL_COL_LEN,
            align: "left",
            formatter: (v: [string, TypeGeneric[]]) => {
                const [name, generics] = v;
                const withGenerics = () => `${chalk.bold(name)}<${generics.map(i => chalk.reset.dim(i.name)).join(",")}>`;
                const genericsDisplayLength = generics.reduce((acc, i) => acc + i.name.length, 0);
                return generics.length > 0
                    ? (name.length + genericsDisplayLength + 4) > SYMBOL_COL_LEN
                            ? withGenerics().replace("<", "\n<")
                            : withGenerics()
                    : chalk.bold(name);
            }
        },
        { value: "filepath", width: pathWidth },
        {
            alias: "Dependencies",
            value: "deps",
            width: 50,
            formatter: (v: SymbolMeta[]) => {
                return v.map(i => i.scope === "local"
                    ? chalk.yellow(i.name)
                    : i.scope === "module"
                        ? chalk.red(i.name)
                        : i.scope === "graph"
                            ? chalk.magenta(i.name)
                            : chalk.cyan(i.name)
                ).join(", ");
            }
        },
    // Hash column removed since symbolHash property was removed with cache system
    ];

    const output = Table(header, rows.map((i) => {
    // Use the deps property if available (from dependency graph)
    // or fall back to empty array for legacy compatibility
        const deps: SymbolMeta[] = (i as any).deps || [];

        return {
            ...i,
            name: [i.name, i.generics],
            filepath: prettyMultiLinePath(i.filepath, pathWidth - 8),
            deps,
            // refs: i?.refs.map(r => r.name).join(", ")
        };
    })).render();

    console.log(output);
    console.log();
    console.log(`    ${chalk.red("⏺")} - module dependency`);
    console.log(`    ${chalk.yellow("⏺")} - local dependency (${chalk.italic("defined in same file as symbol")})`);
    console.log(`    ${chalk.cyan("⏺")} - type from external repo`);
    console.log(`    ${chalk.magenta("⏺")} - graph dependency`);
}
