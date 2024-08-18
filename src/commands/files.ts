import chalk from "chalk";
import { cwd } from "node:process";
import { join, relative } from "pathe";
import {  
  getProjectRoot, 
  projectUsing 
} from "src/ast";
import { 
  cacheSourceFiles, 
  hasSourceCacheFile, 
  initializeHasher, 
  initializeSourceCache,
  getCachedSourceFiles,
  getDiagnosticsByCode,
  lookupSourceFile,
  sourceCacheFile
} from "src/cache";
import { AsOption } from "src/cli";
import { getTestFiles, msg } from "src/utils";


export const files_command = async (opt: AsOption<"files">) => {
  const start = performance.now();
  await initializeHasher();

  if(opt.test) {
    if (!opt.quiet) {
      if (opt.filter) {
        msg(opt)(chalk.bold(`Test Files (filter: ${chalk.dim(opt.filter)})`));
        msg(opt)(`----------------------------------------------------------`);
      }  else {
        msg(opt)(chalk.bold(`Test Files`));
        msg(opt)(`----------------------------------------------------------`);
      }
    }
    // TEST FILES
    const [project, configFile] = projectUsing(
      opt.config 
      ? [ opt.config ] 
      : [`test/tsconfig.json`, `tests/tsconfig.json`, `tsconfig.json`]
    );

    // TODO: make this more dynamic
    const testFiles = getTestFiles();


    if ( !opt.config) {
      msg(opt)(`- configuration for project found in ${chalk.blue(configFile)}`);
    }

  } else {
    // SOURCE FILES

    if (!opt.quiet) {
      if (opt.filter) {
        msg(opt)(chalk.bold(`Files (filter: ${chalk.dim(opt.filter)})`));
        msg(opt)(`----------------------------------------------------------`);
      }  else {
        msg(opt)(chalk.bold(`Files`));
        msg(opt)(`----------------------------------------------------------`);
      }
    }

    const [project, configFile] = projectUsing(
      opt.config 
      ? [ opt.config ] 
      : [`src/tsconfig.json`, `tsconfig.json`]
    );
  
    if (!opt.config) {
      msg(opt)(`- configuration for project found in ${chalk.blue(configFile)}`);
    }

    if (opt.clear) {
      let file = chalk.blue(relative(cwd(), sourceCacheFile()))
      msg(opt)(`- clearing and re-caching all source files to ${file}`);
      
      cacheSourceFiles(opt)();
    } else {
      if(hasSourceCacheFile()) {
        msg(opt)(`- leveraging existing source cache [${chalk.blue(relative(cwd(), sourceCacheFile()))}]`)
        msg(opt)(`- use ${chalk.blue("--clear")} CLI flag to re-cache all source files)`)
      } else if (!hasSourceCacheFile()) {
        if (!opt.quiet) {
          const file = chalk.blue(relative(
            getProjectRoot(),
            sourceCacheFile()
          ))
          msg(opt)(`- no cache file found, re-caching source file to: ${file}`)
        }
      } 
      initializeSourceCache(opt);
    }
    const sourceFiles = getCachedSourceFiles();
    msg(opt)(`- there are ${chalk.bold(sourceFiles)} source files`);
    
    const {errors, warnings, filesWithError} = getDiagnosticsByCode(opt);
    const errorCount = chalk.bold.red(errors.map(i => i[1]).reduce((total,val) => total+val, 0))
    const errorCodes = errors.map(i => chalk.red(i[0]));

    const warningCount = chalk.bold.yellow(warnings.map(i => i[1]).reduce((total,val) => total+val, 0))

    const actualWarningCodes = warnings.map(i => i[0]);
    const warningCodes = opt.warn.map( c => actualWarningCodes.includes(c) ? chalk.yellow(c) : chalk.dim(c)).join(",")

    const errCodesMsg = errorCodes.length > 0
      ? `[${errorCodes.join(",")}]`
      : "";
    msg(opt)(`- ${errorCount} type errors in the source code ${errCodesMsg}`)
    msg(opt)(`- ${warningCount} type warnings in the source code [${warningCodes}]`)

    if(opt.json) {
      console.log(JSON.stringify({errors, warnings}));
    } else {
      // ERROR REPORTING
      if(errorCodes.length > 0) {
        console.log();
        console.log(chalk.redBright(`Errors`));
        console.log(chalk.redBright(`-----------------------`));
      }
      for (const file of filesWithError) {
        const meta = lookupSourceFile(file);
        if (meta) {
          const errors = meta.diagnostics.filter(d => !opt.warn.includes(d.code));
          console.log();
          console.log(`${chalk.bold(`./${meta.filepath} [${chalk.red(errors.length)}]`)}`);
          for (const err of errors) {
            console.log(`    - [${chalk.italic.dim("c:")} ${err.code}, ${chalk.italic.dim("line")} ${err.loc.lineNumber}, ${chalk.italic.dim("col")} ${err.loc.column} ] - ${err.msg}`);
          }
        }
      }
      // WARNING REPORTING
      if(warningCodes.length > 0) {
        console.log();
        if(warningCount.length > 0) {
          console.log(chalk.yellowBright(`Warnings`));
          console.log(chalk.yellowBright(`-----------------------`));
  
          for (const [code, files] of warnings.map(i => [i[0],i[2]] as [number, string[]])) {
            console.log(`- code ${chalk.yellowBright.bold(code)}:\n  - ${files.map(f => chalk.blue(f)).join("\n  - ")}`);
          }
        }
      }
    } // end screen reporting
  
    const duration = performance.now() - start;
    if(!opt.quiet) {
      msg(opt)("")
      msg(opt)(`- command took ${chalk.bold(duration)}${chalk.italic.dim("ms")}`)
    }
  }
}
