import type { AsOption } from "../cli";
import { getSymbolFileDefinition, projectUsing } from "../ast";
import { relativeFile } from "../utils";
import Table from "tty-table";

export async function files_command(opt: AsOption<"files">) {
    // initialize the project (using same config logic as in source_command)
    const [project, _configFile] = projectUsing(
        opt.config ? [opt.config] : [`src/tsconfig.json`, `tsconfig.json`]
    );

    /** all source files in project */
    const sourceFiles = project.getSourceFiles();
    const fileData: {
        filepath: string;
        symbols: { name: string; startLine: number; endLine: number }[];
    }[] = [];

    for (const file of sourceFiles) {
    // get exported symbols
        const exportedSymbols = file.getExportSymbols();
        const rows: { name: string; startLine: number; endLine: number }[] = [];

        // add each exported symbol along with its line numbers
        for (const sym of exportedSymbols) {
            const def = getSymbolFileDefinition(sym);
            rows.push({
                name: sym.getName(),
                startLine: def.startLine,
                endLine: def.endLine,
            });
        }

        // Skip local symbol dependencies to avoid stack overflow issues
        // TODO: Re-implement safer dependency analysis without recursion

        if (rows.length > 0) {
            fileData.push({
                filepath: relativeFile(file.getFilePath()),
                symbols: rows,
            });
        }
    }

    if (opt.json) {
    // JSON array output
        console.log(JSON.stringify(fileData, null, 2));
    }
    else {
    // flatten data to one row per symbol; leave file cell blank for subsequent symbols
        const tableRows: { file: string; symbol: string; lines: string }[] = [];
        for (const entry of fileData) {
            entry.symbols.forEach((sym, index) => {
                tableRows.push({
                    file: index === 0 ? entry.filepath : "",
                    symbol: sym.name,
                    lines: `${sym.startLine}-${sym.endLine}`,
                });
            });
        }

        const header = [
            { value: "file", alias: "File", width: 40, align: "left" },
            { value: "symbol", alias: "Symbol", width: 20, align: "left" },
            { value: "lines", alias: "Line Range", width: 12, align: "center" },
        ];

        const table = Table(header, tableRows);
        console.log(table.render());
    }
}
