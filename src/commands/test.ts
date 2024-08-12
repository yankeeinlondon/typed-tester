import chalk from "chalk";
import  { join, relative } from "pathe";
import { CacheDiagnostic, FileDiagnostics, getFileDiagnostics } from "./testing/getFileDiagnostics";
import { setupProject } from "../setupProject";
import {  clearCache, initializeHasher, saveCache } from "../cache/cache";
import { watch } from "../watch";
import { GlobalMetrics, reportGlobalMetrics } from "../reporting/globalMetrics";
import { error } from "../logging/error";
import { AsOption } from "src/cli/create_cli";
import findRoot from "find-root";
import { existsSync } from "fs";
import FastGlob from "fast-glob";


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
        console.log(`---------------------------------------------------------------`);
        console.log(`ignore: ${opt.ignore}`);
        
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
        console.log(`-------------------------------`);
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

      const filterOutWarning = (e: CacheDiagnostic) => !opt.ignore.includes(e.code);
      /**
       * Files with errors (not deemed to be just a warning)
       */
      const err_files = results.filter(f => f.diagnostics.filter(filterOutWarning).length > 0);

      const err_count = results.reduce((acc,i) => acc + i.diagnostics.filter(filterOutWarning).length, 0);
      const hits = results.reduce((acc,i) => acc + (i.cacheHit ? 1 : 0), 0);
      const misses = () => results.filter((i) => !i.cacheHit);
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
      const metrics: GlobalMetrics = {
        code: err_count > 0 ? 1 : 0,
        file_count: test_files.length,
        err_files: err_files.length,
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

      // cache miss reporting
      if(opt.miss) {
        const status = (f: FileDiagnostics) => f.hasErrors
          ? chalk.black.bgRed(`err`)
          : f.hasWarnings
          ? chalk.black.bgYellow(`warn`)
          : chalk.black.bgGreen(`ok`);
        console.log();
        console.log(`Cache Misses:`);
        console.log(`-----------------------------------------------------`)
        
        for (const miss of misses()) {
          console.log(`- ${chalk.blue(`./${miss.file}`)} [ ${status(miss)}, ${miss.duration}${chalk.dim.italic("ms")} ]`);
        }

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

