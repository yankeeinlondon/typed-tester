import chalk from "chalk";
import  { join, relative } from "pathe";
import { FileDiagnostics, getFileDiagnostics } from "../getFileDiagnostics";
import { setupProject } from "../setupProject";
import {  clearCache, initializeHasher, saveCache } from "../cache";
import { watch } from "../watch";
import { reportGlobalMetrics } from "../reporting/globalMetrics";
import { error } from "../logging/error";
import { AsOption } from "src/create_cli";
import findRoot from "find-root";
import { existsSync } from "fs";
import FastGlob from "fast-glob";

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
  verbose: boolean
}

/**
 * **test_command**`(opt)`
 * 
 * Runs and reports on type tests
 */
export const test_command = async (opt: AsOption<"test">) => {
  try {
    var start = performance.now();
    
    if(opt.clear) {
      clearCache();
    }

    const root = findRoot(process.cwd());
    const config_options = opt.config
      ? [opt.config]
      : [
        join(root, "tsconfig.json"), 
        join(root, "tsconfig.jsonc"),
        join(root, "test/tsconfig.json"),
        join(root, "test/tsconfig.jsonc"),
        join(root, "tests/tsconfig.json"),
        join(root, "tests/tsconfig.jsonc"),
      ];

    /** the tsconfig file for the test */
    const config = config_options.find(i => existsSync(i));
    /** the test file glob selector */
    const glob = process.env.TEST_FILES || process.env.VITE_TEST_FILES || [
      "tests/**/*.{test,spec}.ts",
      "test/**/*.{test,spec}.ts",
      "src/**/*.{test,spec}.ts"
    ];
    const test_files = opt.filter
    ? (await FastGlob(glob)).filter(i => i.includes(opt.filter))
    : await FastGlob(glob);

    const describe_files = opt.filter && opt.filter !== ""
      ? `${test_files.length} test files ${chalk.dim(`after apply filter: ${chalk.italic(`${opt.filter}`)}`)}`
      : `${test_files.length} test files`;

    if (!config) {
      error(`Looked for a tsconfig file in the following locations with no success: ${config_options.join(", ")}! Use the --config command line prompt to be explicit on where we can find it.`)
      return null;
    } else {
      setupProject(config);
      await initializeHasher();
      
      if(!opt.quiet) {
        console.log(chalk.bold(`Typed Testing [${chalk.dim(relative(root, config))}] -> ${describe_files}`));
        console.log(`---------------------------------`);
        console.log(`ignore: ${typeof opt.ignore}, ${Object.keys(opt.ignore)} ${opt.ignore.join(", ")}`);
        
      }
      // initial analysis
      const results: FileDiagnostics[] = [];

      for (const file of test_files) {
        if(opt.verbose) {
          process.stdout.write(chalk.gray(`\n- working on "${file}"`));
        }
        results.push(getFileDiagnostics(file, opt));
      }

      // cache saved to disk and up-to-date
      const cache = saveCache(results);

      if(!opt.quiet) {
        console.log(chalk.bold(`\n\nType Errors`));
        console.log(`---------------`);
      }

      for (const key of Object.keys(cache)) {
        const file = cache[key as keyof typeof cache];
        if(file.hasErrors) {
          console.log();
          console.log(chalk.underline.bold(file.file));
          for (const diagnostic of file.diagnostics) {
            if(!opt.ignore.includes(diagnostic.code)) {
              console.log(`- ${diagnostic.msg}`);
            }
          }
        }
      }

      const err_count = results.reduce((acc,i) => acc + i.diagnostics.filter(e => !opt.ignore.includes(e.code)).length, 0);
      const err_files = results.reduce((acc,i) => acc + (i.hasErrors ? 1 : 0), 0);
      const hits = results.reduce((acc,i) => acc + (i.cacheHit ? 1 : 0), 0);
      const ratio = Math.floor(hits/Object.keys(cache).length * 100);
      const warn_files = new Set<string>();
      const warn_count = opt?.warn?.length || 0 > 0
        ? results.reduce(
            (acc,i) => {

              const inc = i.diagnostics.reduce( 
                    (sum, d) => sum + (opt.warn.includes(String(d.code)) 
                      ? 0 
                      : 1),
                    0
                  ) as number
              if (inc > 0) {
                warn_files.add(i.file);
              }

              return acc + inc;
            }, 
              0
          )
          : 0;

      const end = performance.now();
      const duration = Math.floor((end-start))/1000;
      const metrics = {
        code: err_count > 0 ? 1 : 0,
        file_count: test_files.length,
        err_files,
        err_count,
        warn_count,
        warn_files: Array.from(warn_files).length,
        cache_hits: hits,
        cache_ratio: ratio,
        duration
      };

      // summary reporting
      if(!opt.quiet) {
        reportGlobalMetrics(metrics);
      }

      if(opt.json) {
        console.log(metrics);
      }

      if(opt.watchMode) {
        watch(test_files, opt);
      }

      return metrics;
    } 
  } catch(e) {
      error(`Failed  with options: ${JSON.stringify(opt)}. Error message: ${String(e)}`);

      return
    }
  }

