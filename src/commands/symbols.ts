import chalk from "chalk";
import { AsOption } from "src/cli";
import { projectUsing, asSymbolMeta } from "src/ast"
import { msg } from "src/utils";
import { symbolsJson, symbolsScreen } from "src/report";
import type { SymbolMeta } from "src/types";

export const MAX_SYMBOLS = 10;

function getDirectSymbolAnalysis(project: any): SymbolMeta[] {
  const symbols: SymbolMeta[] = [];
  const seenSymbols = new Set<string>();

  // Get all source files
  const sourceFiles = project.getSourceFiles();

  for (const sourceFile of sourceFiles) {
    // Get exported symbols from each file
    const exportedSymbols = sourceFile.getExportedDeclarations();
    
    for (const [, declarations] of exportedSymbols) {
      for (const declaration of declarations) {
        const symbol = declaration.getSymbol?.();
        if (symbol && !seenSymbols.has(symbol.getName())) {
          try {
            seenSymbols.add(symbol.getName());
            const meta = asSymbolMeta(symbol);
            if (meta && meta.isTypeSymbol) {
              symbols.push(meta);
            }
          } catch (error) {
            // Skip symbols that can't be analyzed
            console.debug(`Skipping symbol ${symbol.getName()}: ${error}`);
          }
        }
      }
    }
  }

  return symbols;
}

function filterSymbols(symbols: SymbolMeta[], filters: string[]): SymbolMeta[] {
  if (!filters || filters.length === 0) {
    return symbols.slice(0, MAX_SYMBOLS); // Show sample if no filter
  }

  return symbols.filter(symbol => 
    filters.some(filter => 
      symbol.name.toLowerCase().includes(filter.toLowerCase()) ||
      symbol.fqn.toLowerCase().includes(filter.toLowerCase())
    )
  );
}

/** COMMAND */
export const symbols_command = async (opt: AsOption<"symbols">) => {
  const start = performance.now();

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
  
  // Analyze symbols directly without cache
  msg(opt)(`- analyzing exported symbols...`);
  const allSymbols = getDirectSymbolAnalysis(project);
  msg(opt)(`- found ${chalk.bold(allSymbols.length)} exported type symbols`);

  // Filter symbols based on user input
  let symbols = filterSymbols(allSymbols, opt.filter || []);

  if (opt?.filter?.length === 0 && !opt.quiet) {
    msg(opt)(`- showing sample of symbols (use --filter to narrow results)`);
  } else if (opt?.filter?.length > 0) {
    msg(opt)(`- filtered to ${chalk.bold(symbols.length)} symbols matching: ${chalk.dim(opt.filter.join(", "))}`);
  }

  // Output results
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