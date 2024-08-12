import chalk from "chalk";
import { relative } from "pathe";
import { cwd } from "process";
import { project_using } from "src/ast/project_using";
import { findDependenciesFor, getExportedSymbols,  SymbolInfo } from "src/ast/symbols";
import { refreshCacheWithSymbolsLookup } from "src/cache/cache";
import { AsOption } from "src/cli/index";

export const MAX_SYMBOLS = 35;



export const graph_command = async (opt: AsOption<"graph">) => {

  if (!opt.quiet) {
    if (opt.filter) {
      console.log(`${chalk.bold("Source Graph")} (filter: ${chalk.dim(opt.filter)})`);
      console.log(`----------------------------------------------------------`);
    } else {
      const filter = opt.verbose ? chalk.dim("all symbols") : chalk.dim("exported symbols");
      console.log(`${chalk.bold("Source Graph")} ( ${filter} )`);
      console.log(`----------------------------------------------------------`);
    }

    const [project, config_file] = project_using(opt.config 
      ? [ opt.config ] 
      : [`src/tsconfig.json`, `tsconfig.json`]
    );

    const sourceFiles = project.getSourceFiles();

    if(!opt.quiet) {
      console.log(`- project found ${chalk.bold(sourceFiles.length)} source files [${chalk.dim(config_file)}]`);
    }

    /** Symbol-to-Meta Lookup */
    const symbols = getExportedSymbols(project, sourceFiles);
    await refreshCacheWithSymbolsLookup(symbols);
    

    let keys = opt.filter 
      ? Array.from(symbols.keys()).filter(k => opt.filter.some(f => k.includes(f)))
      : Array.from(symbols.keys())

    const show = (name: string, info: SymbolInfo | undefined) => {
      if (!info) {
        console.log(`- ${chalk.bold(name)}[${chalk.red("error")}]`);
      } else {
        const deps = findDependenciesFor(project,info.symbol);

        console.log(`- ${chalk.bold(name)}[${chalk.dim(relative(cwd(), info.filepath))}] → [ ${chalk.dim.red(deps.map(i => i.name).join(", "))} ]`);

      }
    }

    if(!opt.quiet) {
      console.log(`- there were ${chalk.bold(symbols.size)} exported symbols across the project`);
      if (opt.filter) {
        console.log(`- there remain ${chalk.bold(keys.length)} symbol(${chalk.dim("s")}) after applying filter [ ${chalk.dim(opt.filter)} ]`);
      }
      console.log();
      
      if (keys.length > MAX_SYMBOLS && !opt.verbose) {
        console.log(`- limiting output to first ${MAX_SYMBOLS}; add --verbose flag for all`);
        keys = keys.slice(0,MAX_SYMBOLS)
      }

      for (const k of keys) {
        let info = symbols.get(k) as SymbolInfo | undefined;
        show(k, info);
      }
    }


    // console.log(symbols.slice(-25).map(s => `${s.name} {  file: ${chalk.dim(relative(cwd(), s.file))}  }`).join("\n"));
    

  }
  

}
