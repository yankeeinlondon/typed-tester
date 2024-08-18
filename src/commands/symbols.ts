import chalk from "chalk";
import { join, relative } from "pathe";
import { cwd } from "process";
import {  getProjectRoot, projectUsing, SymbolMeta } from "src/ast"
import { 
  cacheExportedSymbols, 
  clearSymbolsCache, 
  fuzzyFindSymbol, 
  getSymbolCacheSummary, 
  getSymbolLookupKeys,
  getSymbols, 
  hasSymbolCacheFile, 
  initializeHasher,
  initializeSymbolLookup,
  saveSymbolLookup, 
  SYMBOL_CACHE_FILE
} from "src/cache";
import { AsOption } from "src/cli";
import { symbolsJson, symbolsScreen } from "src/report";
import { msg } from "src/utils";

export const MAX_SYMBOLS = 10;

/** COMMAND */
export const symbols_command = async (opt: AsOption<"symbols">) => {
  const start = performance.now();
  await initializeHasher();

  if (opt.filter) {
    msg(opt)(chalk.bold(`Symbols (filter: ${chalk.dim(opt.filter)})`));
    msg(opt)(`----------------------------------------------------------`);
  }  else {
    msg(opt)(chalk.bold(`Symbols`));
    msg(opt)(`----------------------------------------------------------`);
  }
    
  const [project, configFile] = projectUsing(opt.config 
    ? [ opt.config ] 
    : [`src/tsconfig.json`, `tsconfig.json`]
  );
  
  const sourceFiles = project.getSourceFiles();

  msg(opt)(`- project found ${chalk.bold(sourceFiles.length)} source files [${chalk.dim(configFile)}]`);
  
  if (opt.clear) {
    msg(opt)(`- clearing symbols cache from disk and memory`)
    clearSymbolsCache();
    // cache
    cacheExportedSymbols(sourceFiles);
    const summary = getSymbolCacheSummary();
      msg(opt)(`- found and cached ${chalk.bold(summary.exported)} ${chalk.italic("exported")} symbols, ${chalk.bold(summary.local)} ${chalk.italic("local")} symbols, and ${chalk.bold(summary.external)} symbols from external packages`);
      msg(opt)(`- the symbols ${chalk.italic("cached")} represent just the exported type definitions in this repo plus those\n   type definitions which these types depend on.`)
    // save cache to disk
    saveSymbolLookup();
  } else {
    if (!opt.quiet) {
      const file = chalk.blue(relative(cwd(), join(getProjectRoot(), SYMBOL_CACHE_FILE)))
      if(hasSymbolCacheFile()) {
        msg(opt)(`- using cache file [${file}] to report on symbols`)
      } else {
        msg(opt)(`- no cache file [${file}] found so build cache first`)
      }
      initializeSymbolLookup();
      const summary = getSymbolCacheSummary();
      msg(opt)(`- cache has ${chalk.bold(summary.exported)} ${chalk.italic("exported")} symbols, ${chalk.bold(summary.local)} ${chalk.italic("local")} symbols, and ${chalk.bold(summary.external)} symbols from external packages`);
    }
  }

  // REPORTING

  let symbols: SymbolMeta[] = opt?.filter?.length || 0 > 0
    ? opt.filter.flatMap(f => fuzzyFindSymbol(f, "contains"))
    : getSymbols( ...getSymbolLookupKeys(true).slice(0,MAX_SYMBOLS) );

  if (opt?.filter?.length === 0 && !opt.quiet) {
    msg(opt)(`- here is a sample of some of the symbols (use --filter in CLI to filter to a subset you're interested in)`);
  }

  if (opt.json) {
    console.log(symbolsJson(symbols));
  } else {
    symbolsScreen(symbols);
  }

  const duration = performance.now() - start;
  if(!opt.quiet) {
    msg(opt)("")
    msg(opt)(`- command took ${chalk.bold(duration)}${chalk.italic.dim("ms")}`)
  }
}

