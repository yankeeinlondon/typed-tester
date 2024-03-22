import chalk from "chalk";
import { relative } from "pathe";
import { getCache, updateCache } from "src/cache";
import { FileDiagnostics } from "src/getFileDiagnostics";
import { ValidationOptions } from "src/typeValidation";

const rel = (file: string) => relative(process.cwd(), file);

const state = (input: FileDiagnostics, opts: ValidationOptions) => {
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
export const coreFileChange = (file: string, opts: ValidationOptions, fromDep: boolean = false) => {
  let cache = getCache();

  const oldState = {...cache[file] };
  const originally: ReturnType<typeof state> = state(oldState, opts);

  if(fromDep) {
    console.log(chalk.dim(`- rechecking types on ${chalk.blue(rel(file))}`));
  } else {
    console.log(chalk.dim(`- change detected in ${chalk.blue(rel(file))}`));
  }
  
  cache = updateCache(cache[file], {...opts, quiet: true, force: true});

  const now: ReturnType<typeof state> = state(cache[file], opts);
  if(
    originally.errors === now.errors && originally.warnings === now.warnings
  ) {
    // no change in errors
    console.log(`- ${chalk.blue(rel(file))} was updated but there was no change in state ${state(cache[file], opts).msg}`);
  } else if (
    originally.errors < now.errors
  ) {
    // errors have increased
    console.log(`- ${chalk.blue(rel(file))} was updated but there was an ${chalk.italic("increase")} in errors: ${originally.msg} → ${now.msg}`);
  } else if (
    originally.errors > now.errors
  ) {
    // errors have decreased
    if(now.success) {
      console.log(`- ${chalk.blue(rel(file))} was updated and ${chalk.bold("no errors")} remain ${now.msg}`);
    } else {
      console.log(`- ${chalk.blue(rel(file))} was updated and the error count ${chalk.italic("decreased")}: ${originally.msg} → ${now.msg}`);
    }
  } else {
    const now = state(cache[file], opts);
    console.log(`- ${chalk.blue(rel(file))} was updated ${now.msg}`);
  }

}
