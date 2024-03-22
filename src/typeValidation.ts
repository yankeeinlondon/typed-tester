import chalk from "chalk";
import glob from "fast-glob";
import path from "pathe";
import { FileDiagnostics, getFileDiagnostics } from "./getFileDiagnostics";
import { setupProject } from "./setupProject";
import { stdout } from "process";
import {  clearCache, initializeHasher, saveCache } from "./cache";
import { watch } from "./watch";

export type ValidationOptions = {
  /**
   * optionally an explicit pointer to the Typescript config file;
   * by default it will look in the specified folder for a `tsconfig.json`
   * and then afterward in the root of the repo.
   */
  configFile: string | undefined;

  /** the **watch** flag from the CLI user */
  watchMode: boolean,
  /**
   * the **clean** flag from the CLI user
   */
  cleanFlag: boolean,

  /**
   * Whether or not the user has specified any additional
   * glob patterns to further filter the TS files to be
   * included.
   */
  filter: string[],

  /**
   * Error codes which should be treated only as a warning
   */
  warn: string[],
  quiet: boolean,
  json: boolean,
  /** not exposed to CLI but used by watcher */
  force: boolean,
}

/**
 * **type_validation**(folder,configFile,watchMode,cleanFlag)
 * 
 * Kick off the type validation process.
 */
export const type_validation = async (
  /**
   * The base folder within the repo which you want test TS files
   * in.
   */
  folder: string,
  opts: ValidationOptions
) => {
  var start = performance.now();
  
  if(opts.cleanFlag) {
    clearCache();
  }
  const configFile = opts.configFile || "tsconfig.json";
  setupProject(configFile);
  await initializeHasher();

  if(!opts.quiet) {
    console.log(chalk.bold(`TS Type Tester`));
    console.log(`--------------`);
  }

  const glob_pattern = [path.join("./", folder, "/**/**.ts"), ...opts.filter];
  const files = await glob(glob_pattern);
  console.log(`- inspecting ${files.length} typescript files for type errors`);
  // initial analysis
  stdout.write(`- starting analysis:  `);

  const results: FileDiagnostics[] = [];

  for (const file of files) {
    results.push(getFileDiagnostics(file, opts));
  }

  // cache saved to disk and up-to-date
  const cache = saveCache(results);

  if(!opts.quiet) {
    console.log(chalk.bold(`\n\nType Errors`));
    console.log(`---------------`);
  }

  for (const key of Object.keys(cache)) {
    const file = cache[key as keyof typeof cache];
    if(file.hasErrors) {
      console.log();
      console.log(chalk.underline.bold(file.file));
      for (const diagnostic of file.diagnostics) {
        console.log(`- ${diagnostic.msg}`);
      }
    }
  }

  const err_count = results.reduce((acc,i) => acc + i.diagnostics.length, 0);
  const err_files = results.reduce((acc,i) => acc + (i.hasErrors ? 1 : 0), 0);
  const hits = results.reduce((acc,i) => acc + (i.cacheHit ? 1 : 0), 0);
  const ratio = Math.floor(hits/Object.keys(cache).length * 100);
  const warn_files = new Set<string>();
  const warn_count = opts.warn.length > 0
    ? results.reduce(
        (acc,i) => {

          const inc = i.diagnostics.reduce( 
                (sum, d) => sum + (opts.warn.includes(String(d.code)) 
                  ? 0 
                  : 1),
                0
              ) as number
          if (inc > 0) {
            warn_files.add(i.file);
          }

          return acc + inc;
        }
            , 
          0
      )
      : [];

  const end = performance.now();
  const duration = Math.floor((end-start))/1000;
  
  // summary reporting
  if(!opts.quiet) {
    console.log(chalk.bold(`\n\nType Error Summary`));
    console.log(chalk.bold(`------------------\n`));

    console.log(`- ${chalk.bold(err_files)} of ${chalk.bold(files.length)} files had type errors`);
    console.log(`- there are ${chalk.redBright.bold(err_count)} total errors`);
    if(warn_files.size > 0) {
      console.log(`- there were ${chalk.bold(warn_count)} warnings across ${warn_files.size} files.`);
    }
    if(ratio === 0) {
      console.log(`- no cache hits during analysis`);
    } else {
      console.log(`- analysis benefited from ${chalk.bold(hits)} cache hits [${chalk.dim(`ratio: ${ratio}%`)}]`);
    }
    
    console.log(`- analysis and cache refresh took ${duration} seconds`);
    console.log();
  }

  const metrics = {
      /** what would have been the exit code had the JSON option not have been received  */
      code: err_count > 0 ? 1 : 0,
      err_files,
      err_count,
      warn_count,
      warn_files: Array.from(warn_files),
      cache_hits: hits,
      cache_ratio: ratio,
      duration
  };

  if(opts.json) {
    console.log(metrics);
  }

  if(opts.watchMode) {
    watch(folder, files, opts);
  }

  return metrics;
};
