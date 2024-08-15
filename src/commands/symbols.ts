import chalk from "chalk";
import { projectUsing, SymbolMeta } from "src/ast"
import { 
  cacheExportedSymbols, 
  fuzzyFindSymbol, 
  getSymbolCacheSummary, 
  getSymbolLookupKeys,
  getSymbols, 
  initializeHasher,
  saveSymbolLookup 
} from "src/cache";
import { AsOption } from "src/cli";
import { symbolsJson, symbolsScreen } from "src/report";
import { msg } from "src/utils";

export const MAX_SYMBOLS = 10;

export const symbols_command = async (opt: AsOption<"symbols">) => {
  if (!opt.quiet) {
    if (opt.filter) {
      msg(chalk.bold(`Symbols (filter: ${chalk.dim(opt.filter)})`));
      msg(`----------------------------------------------------------`);
    } else {
      const filter = opt.verbose ? chalk.dim("all symbols") : chalk.dim("exported symbols");
      msg(chalk.bold(`Symbols`));
      msg(`----------------------------------------------------------`);
    }
    await initializeHasher();
    
    const [project, config_file] = projectUsing(opt.config 
      ? [ opt.config ] 
      : [`src/tsconfig.json`, `tsconfig.json`]
    );

    const sourceFiles = project.getSourceFiles();

    if(!opt.quiet) {
      msg(`- project found ${chalk.bold(sourceFiles.length)} source files [${chalk.dim(config_file)}]`);
    }

    // cache
    cacheExportedSymbols(sourceFiles);
    // save cache to disk
    saveSymbolLookup();
    const summary = getSymbolCacheSummary();

    if(!opt.quiet) {
      msg(`- found and cached ${chalk.bold(summary.exported)} ${chalk.italic("exported")} symbols, ${chalk.bold(summary.local)} ${chalk.italic("local")} symbols, and ${chalk.bold(summary.external)} symbols from external packages`);
      msg(`- the symbols ${chalk.italic("cached")} represent just the exported type definitions in this repo plus those\n   type definitions which these types depend on.`)
    }

    let symbols: SymbolMeta[] = opt?.filter?.length || 0 > 0
      ? opt.filter.flatMap(f => fuzzyFindSymbol(f, "contains"))
      : getSymbols( ...getSymbolLookupKeys(true).slice(0,MAX_SYMBOLS) );

    if (opt?.filter?.length === 0 && !opt.quiet) {
      msg(`- here is a sample of some of the symbols (use --filter in CLI to filter to a subset you're interested in)`);
    }
  
    if (opt.json) {
      console.log(symbolsJson(symbols));
    } else {
      symbolsScreen(symbols);
    }
  }
}
