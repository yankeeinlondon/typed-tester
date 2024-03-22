import chalk from "chalk";
import { ValidationOptions } from "src/typeValidation";
import { summarizeGlobalErrorsAndWarnings } from "src/calcErrorsAndWarnings";

export type GlobalMetrics = {
  /**
   * The overall error code for all test files.
   * 
   * > `0` is **ok**, `1` represents **errors**
   */
  code: number;

  file_count: number;

  /**
   * the total number of _files_ which have an error
   */
  err_files: number;
  /**
   * the total number of _errors_ across all files
   */
  err_count: number;
  /**
   * the total number of _warnings_ across all files
   */
  warn_count: number;
  /**
   * the number of _files_ which have **warnings**
   */
  warn_files: number;

  /**
   * The number of cache _hits_ there were when starting the 
   * type tester (watcher updates are excluded).
   */
  cache_hits?: number;
  /**
   * The percentage of overall files who's diagnostics were
   * available via the cache (watcher updates are excluded).
   */
  cache_ratio?: number;
  /**
   * The time it took -- in seconds -- to initially analyze the
   * core files and dependencies (watcher updates are excluded).
   */
  duration?: number;
}

let metrics_cache: GlobalMetrics;

export const updatedGlobalMetrics = (
  opts: ValidationOptions
) => {
  const summary = summarizeGlobalErrorsAndWarnings(opts);
  if(
    summary.err_count !== metrics_cache.err_count ||
    summary.err_files !== metrics_cache.err_files ||
    summary.warn_count !== metrics_cache.warn_count 
  ) {
    metrics_cache = {
      ...metrics_cache,
      ...summary
    }
  
    reportGlobalMetrics(metrics_cache, true);
  }
}

export const reportGlobalMetrics = (metrics: GlobalMetrics, isWatcher: boolean = false) => {
  metrics_cache = metrics

  if(isWatcher) {
    const errors = chalk.bgRed(` ${chalk.bold(metrics.err_count)} errors ${chalk.italic.dim("in")} ${metrics.err_files} files `);
    const warnings = metrics.warn_count > 0 
      ? chalk.bgYellow(` ${chalk.bold(metrics.warn_count)} warnings ${chalk.italic.dim("in")} ${metrics.warn_files} files `)
      : "";
    const success = metrics.err_count === 0 
      ? chalk.bgGreenBright.bold(`No type errors!`)
      : "";

    console.log(`\n   TOTALS: ${chalk.bgBlack(` watching ${chalk.bold(metrics.file_count)} `)}${success}${errors}${warnings}\n`);

  } else {
    console.log(chalk.bold(`\n\nType Error Summary`));
    console.log(chalk.bold(`------------------\n`));
    console.log(`- ${chalk.bold(metrics.err_files)} of ${chalk.bold(metrics.file_count)} files had type errors`);
    console.log(`- there are ${chalk.redBright.bold(metrics.err_count)} total errors`);
    if(metrics.warn_files > 0) {
      console.log(`- there were ${chalk.bold(metrics.warn_count)} warnings across ${metrics.warn_files} files.`);
    }
    if(metrics.cache_ratio === 0) {
      console.log(`- no cache hits during analysis`);
    } else {
      console.log(`- analysis benefited from ${chalk.bold(metrics.cache_hits)} cache hits [${chalk.dim(`ratio: ${metrics.cache_ratio}%`)}]`);
    }
    
    console.log(`- analysis and cache refresh took ${metrics.duration} seconds`);
    console.log();
  }

}
