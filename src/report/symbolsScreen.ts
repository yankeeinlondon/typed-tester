import {  SymbolMeta, TypeGeneric } from "src/ast";
import Table from "tty-table";
import { prettyMultiLinePath } from "./prettyPath";
import chalk from "chalk";
import { lookupSymbol } from "src/cache";

/**
 * prints a table of symbols and their dependencies to
 * STDOUT.
 */
export const symbolsScreen = (rows: SymbolMeta[]) => {
  const columns: number = process.stdout.columns;
  const pathWidth: number = columns > 120 
    ? 45
    : columns > 100 ? 35 : 30;

  const header = [
    { 
      value: "name",
      alias: "Symbol", 
      width: 32, 
      align: "left",
      formatter: (v: [string, TypeGeneric[]]) => {
        const [name, generics] = v;
        return generics.length >0
          ? `${chalk.bold(name)}<${generics.map(i => chalk.reset.dim(i.name)).join(",")}>`
          : chalk.bold(name)
      }
    },
    { value: "symbolHash", alias: "Hash", width: 15 },
    { 
      alias: "Dependencies",
      value: "deps", 
      width: 50, 
      formatter: (v: SymbolMeta[]) => {

        return v.map(i => i.scope === "local"
          ? chalk.yellow(i.name)
          : i.scope === "module"
              ? chalk.red(i.name)
              : chalk.cyan(i.name)
        ).join(', ')
      }
    },
    ...(
        columns > 100 
        ? [{ value: "filepath", width: pathWidth }]
        : []
    )
  ]

  const output = Table(header, rows.map(i => ({
    ...i, 
    name: [i.name, i.generics],
    filepath: prettyMultiLinePath(i.filepath, pathWidth - 8),
    deps: i.deps.map(d => lookupSymbol(d)).filter(i => i) as SymbolMeta[]
  }))).render();

  console.log(output);
  console.log();
  console.log(`    ${chalk.red("⏺")} - module dependency`);
  console.log(`    ${chalk.yellow("⏺")} - local dependency (${chalk.italic("defined in same file as symbol")})`);
  console.log(`    ${chalk.white.dim("⏺")} - type from external repo`);
  
}
