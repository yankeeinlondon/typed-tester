import { DiagnosticMessageChain, ts } from "ts-morph";
import chalk from "chalk";

import { AsOption } from "src/cli/cli-types";
import { getProject } from "src/ast";



/** a cachable summary of a file's diagnostic state */
export type CacheDiagnostic = {
  lineNumber: number;
  column: number;
  code: number;
  msg: string;
  duration: number;
}

export type FileDiagnostics = {
  file: string;
  diagnostics: CacheDiagnostic[];
  /**
   * local files which are imported in this file and represent
   * dependencies on this file's state
   */
  deps: string[];
  /**
   * The hash code representing the file's contents
   */
  hash: number;
  /** cache was _fresh_ so results are from cache */
  cacheHit: boolean;

  /**
   * Boolean flag indicating whether the file had any errors. Note,
   * any _errors_ with a code which was configured to be made only
   * a warning will have the flag set to `false`.
   */
  hasErrors: boolean;
  /**
   * Has errors that were downgraded to warnings by CLI options passed in
   */
  hasWarnings: boolean;

  /**
   * the number of milliseconds required to parse and evaluate a given test file
   */
  duration: number;
}

const calcErrorsAndWarnings = (file: FileDiagnostics, opts: AsOption<"test">) => {
  const hasErrors = file.diagnostics
  .filter(i => !opts.ignore.includes(Number(i.code)) )
  .length > 0 ? true : false;
  const hasWarnings = file.diagnostics
    .filter(i => opts.ignore.includes(Number(i.code) || 0) )
    .length > 0 ? true : false;

  return { hasErrors, hasWarnings }
}

/**
 * Retrieves the file's diagnostics (from cache or static analysis)
 */
export const getFileDiagnostics = (
  file: string, 
  opts: AsOption<"test"> 
): FileDiagnostics => {
  const start_time = Date.now();

  let cache = getCache();
  if(cache[file] && !opts.force && validateCache(file, cache[file].hash)) {
    const refreshed = {
      ...cache[file],
      ...calcErrorsAndWarnings(cache[file],opts)
    } as FileDiagnostics;
    
    if(cache[file].hasErrors) {

      process.stdout.write(chalk.red("."));
    } else if (cache[file].hasWarnings) {
      process.stdout.write(chalk.yellow("."));
    } else {
      process.stdout.write(chalk.green("."));
    }

    return {
      ...refreshed,
      cacheHit: true,
      duration: Date.now() - start_time
    } as FileDiagnostics

  }

  let source = getProject().addSourceFileAtPath(file);
  if(opts.force) {
    getProject().removeSourceFile(source);
    source = getProject().addSourceFileAtPath(file);
  }
  const ast_diagnostics = source.getPreEmitDiagnostics();

  const diagnostics: CacheDiagnostic[] = [];

  for (const d of ast_diagnostics) {
    const related = d.compilerObject.relatedInformation
      ? `( ${chalk.bold("related:")} ${chalk.dim(JSON.stringify(d.compilerObject.relatedInformation.map(t => t.messageText.toString().slice(0,40))))} )`
      : ""
      
    const { 
      line, 
      character 
    } = ts.getLineAndCharacterOfPosition(source.compilerNode, d.getStart() || 0);
    
    const lineNumber = `${chalk.dim("l:")}${line + 1}`
    const column = `${chalk.dim("c:")}${character + 1}`;
    const code = `${chalk.dim("code:")} ${d.getCode()}`;
    const txt = typeof d.getMessageText() === "string"
      ? d.getMessageText()
      : (d.getMessageText() as DiagnosticMessageChain).getMessageText();

  
    const msg = `(${lineNumber}, ${column}, ${code}): ${txt} ${related}`

    diagnostics.push({
      msg,
      lineNumber: line + 1,
      column: character + 1,
      code: d.getCode(),
      duration: Date.now() - start_time
    })
  }

  const hash = h(source.getText());
  const deps = getFileDependencies(file, source);

  const partial = {
    file,
    hash,
    hasErrors: false,
    hasWarnings: false,
    deps,
    diagnostics,
    cacheHit: false,
    duration: Date.now() - start_time
  } as FileDiagnostics;

  const result = {
    ...partial,
    ...calcErrorsAndWarnings(partial, opts)
  }

  if(!opts.quiet && !opts.force) {
    const now = Date.now();
    const duration = now - start_time;
    if(result.hasErrors) {
      if(opts.verbose) {
        process.stdout.write("\u001b[1000D");
        console.log(`🔴 ${chalk.bold("completed: ")}${chalk.dim("")}${file}${chalk.dim("")}${chalk.italic(` at `)}${now} ${chalk.dim("[ ")}${duration}${chalk.dim("ms ]")}`);
      } else {
        process.stdout.write("🔴");
      }
    } else if(result.hasWarnings) {
      if(opts.verbose) {
        process.stdout.write(`\u001b[1000D`)
        console.log(`🟡 ${chalk.bold("completed: ")}${chalk.dim("")}${file}${chalk.dim("")}${chalk.italic(` at `)}${now} ${chalk.dim("[ ")}${duration}${chalk.dim("ms ]")}`)
      } else {
        process.stdout.write("🟡");
      }
    } else {
      if(opts.verbose) {
        process.stdout.write("\u001b[1000D")
        console.log(`🟢 ${chalk.bold("completed: ")}${chalk.dim("")}${file}${chalk.dim("")}${chalk.italic(` at `)}${now} ${chalk.dim("[ ")}${duration}${chalk.dim("ms ]")}`)
      } else {
        process.stdout.write("🟢");
      }
    }
  }

  return result;
}

