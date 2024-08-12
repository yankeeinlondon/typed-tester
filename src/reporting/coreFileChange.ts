import chalk from "chalk";
import {  getCacheEntry, updateCache } from "src/cache/cache";
import { FileDiagnostics } from "src/getFileDiagnostics";
import { ValidationOptions } from "src/typeValidation";
import { rel } from "src/utils";
import {  updatedGlobalMetrics } from "./globalMetrics";
import { AsOption } from "src/cli/create_cli";

export type CacheState = {
  warnings: number;
  errors: number;
  msg: string;
  success: boolean;
  errReport: string;
}

const state = (input: FileDiagnostics, opts: AsOption<"test">): CacheState => {
  const warnings = input.diagnostics
    ?.filter(i => opts.warn.includes(String(i.code)) )
    .length || 0;
    const errors = input.diagnostics
    ?.filter(i => !opts.warn.includes(String(i.code)) )
    .length || 0;

    const err_msg = errors >0 ? `${chalk.red("errors: ")}${chalk.redBright(errors)}` : "";
    const warn_msg = warnings > 0 
      ? `chalk.yellow("warnings: ")${chalk.yellowBright(warnings)}`
      : "";
    const success = warnings === 0 && errors === 0;
    const success_msg = success ? chalk.greenBright("success") : ""
    const diagReport: string[] = [];
    for (const item of input?.diagnostics?.filter(i => !opts.warn.includes(String(i.code)) ) || []) {
      diagReport.push( item.msg);
    }
    const errReport = errors === 0
    ? ""
    : `\n  ${diagReport.join("\n  ")}`;

    const msg = `[ ${[err_msg, warn_msg, success_msg].filter(i => i !== "").join(", ")} ]${errReport}`;
    
    return {
    warnings,
    errors,
    msg,
    success,
    errReport
  }
}

/**
 * _execute_ and _report_ on a core file having changed
 */
export const coreFileChange = (file: string, opts: AsOption<"test">, fromDep: boolean = false) => {
  const oldState = getCacheEntry(file);
  const old: ReturnType<typeof state> = state(oldState, opts);

  if(fromDep) {
    console.log(chalk.dim(`- rechecking types on ${chalk.blue(rel(file))}`));
  } else {
    console.log(chalk.dim(`- change detected in ${chalk.blue(rel(file))}`));
  }
  
  const updated = updateCache(oldState, {...opts, quiet: true, force: true});
  const now: ReturnType<typeof state> = state(updated, opts);
  if(
    old.errors === now.errors && old.warnings === now.warnings
  ) {
    // no change in errors
    console.log(`- ${chalk.blue(rel(file))} was updated but there was no change in state ${state(updated, opts).msg}`);
  } else if (
    old.errors < now.errors
  ) {
    // errors have increased
    console.log(`- ${chalk.blue(rel(file))} was updated but there was an ${chalk.italic("increase")} in errors: ${old.msg} → ${now.msg}`);
  } else if (
    old.errors > now.errors
  ) {
    // errors have decreased
    if(now.success) {
      console.log(`- ${chalk.blue(rel(file))} was updated and ${chalk.bold("no errors")} remain in this file ${now.msg}`);
    } else {
      console.log(`- ${chalk.blue(rel(file))} was updated and the error count ${chalk.italic("decreased")}: ${old.msg} → ${now.msg}`);
    }
  } else {
    console.log(`- ${chalk.blue(rel(file))} was updated ${now.msg}`);
  }

  updatedGlobalMetrics(opts)
}
