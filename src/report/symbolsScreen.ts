import type { SymbolMeta, TypeGeneric, JsDocInfo } from "~/types";
import chalk from "chalk";
import Table from "tty-table";
import { prettyMultiLinePath } from "./prettyPath";
import { formatDescription } from "./formatDescription";
import { createTerminalLink } from "./terminalLink";

export const SYMBOL_COL_LEN = 32;

/**
 * prints a table of symbols and their dependencies to
 * STDOUT.
 */
export function symbolsScreen(rows: SymbolMeta[]) {
    const columns: number = process.stdout.columns;
    const descWidth: number = columns > 150
        ? 60
        : columns > 120
            ? 50
            : columns > 100 ? 40 : 35;

    const header = [
        {
            value: "name",
            alias: "Symbol",
            width: SYMBOL_COL_LEN,
            align: "left",
            formatter: (v: [string, TypeGeneric[], string, number]) => {
                const [name, generics, filepath, startLine] = v;

                // Format symbol name with generics
                const withGenerics = () => `${chalk.bold(name)}<${generics.map(i => chalk.reset.dim(i.name)).join(",")}>`;
                const genericsDisplayLength = generics.reduce((acc, i) => acc + i.name.length, 0);
                const symbolText = generics.length > 0
                    ? (name.length + genericsDisplayLength + 4) > SYMBOL_COL_LEN
                            ? withGenerics().replace("<", "\n<")
                            : withGenerics()
                    : chalk.bold(name);

                // Terminal links disabled - they break tty-table's width calculations
                // causing table corruption with duplicated/truncated columns
                // TODO: Find a table library that properly handles OSC 8 escape codes
                return symbolText;
            }
        },
        {
            alias: "Description",
            value: "description",
            width: descWidth,
            formatter: (v: JsDocInfo[]) => formatDescription(v, descWidth)
        },
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
            name: [i.name, i.generics, i.filepath, i.startLine],
            description: i.jsDocs || [],
            filepath: prettyMultiLinePath(i.filepath, descWidth - 8), // Keep for potential future use
            deps,
            // refs: i?.refs.map(r => r.name).join(", ")
        };
    })).render();

    console.log(output);
    console.log();
    console.log(`    ${chalk.red("⏺")} - module dependency`);
    console.log(`    ${chalk.yellow("⏺")} - local dependency (${chalk.italic("defined in same file as symbol")})`);
    console.log(`    ${chalk.cyan("⏺")} - external dependency`);
    console.log(`    ${chalk.magenta("⏺")} - graph dependency`);
}
