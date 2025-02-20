import { AsOption } from "src/cli";

import Table from "tty-table";
import { projectUsing } from "src/ast/project";
import { getSymbolFileDefinition, getSymbolDependencies } from "src/ast/symbols";
import { relativeFile } from "src/utils/relativeFile";
import { initializeHasher } from "src/cache";


export const files_command = async (opt: AsOption<"files">) => {
    await initializeHasher();
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

    // also include local symbols via dependencies (filtering to "local")
    const localSymbols = exportedSymbols.flatMap(sym =>
      getSymbolDependencies(sym).filter(dep => dep.scope === "local")
    );
    for (const dep of localSymbols) {
      // note: startLine/endLine are available via asSymbolMeta from getSymbolDependencies
      rows.push({
        name: dep.name,
        startLine: dep.startLine as number,
        endLine: dep.endLine as number,
      });
    }

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
  } else {
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
};
