import { Project, ts } from "ts-morph";
import xxhash from "xxhash-wasm";
import { getCache } from "./cache";
import chalk from "chalk";
import { readFileSync } from "fs";

export type Hasher = Awaited<ReturnType<typeof xxhash>>["h32"];

/** a cachable summary of a file's diagnostic state */
export type CacheDiagnostic = {
  lineNumber: number;
  column: number;
  code: number;
  msg: string;
}

export type FileDiagnostics = {
  file: string;
  diagnostics: CacheDiagnostic[];
  /**
   * The hash code representing the file's contents
   */
  hash: number;
  /** cache was _fresh_ so results are from cache */
  cacheHit: boolean;

  /**
   * boolean flag indicating whether the file had any errors
   */
  hasErrors: boolean;
}

/**
 * Retrieves the file's diagnostics (from cache or static analysis)
 */
export const getFileDiagnostics = (file: string, prj: Project, hasher: Hasher ): FileDiagnostics => {
  // process.on('SIGINT', function() {
  //       console.log(`✅ The server has been stopped`, 'Shutdown information', {swallowErrors: false});
  //       setTimeout(() => process.exit(0), 1000);
  // });
  const cache = getCache();
  if(cache[file]) {
    const data = readFileSync(file, "utf-8");
    const hash = hasher(data);
    if (hash === cache[file].hash) {
      if(cache[file].hasErrors) {
        process.stdout.write(chalk.dim.red("."));
      } else {
        process.stdout.write(chalk.dim.green("."));
      }

      return {
        ...cache[file],
        cacheHit: true
      } as FileDiagnostics
    }
  }

  const source = prj.addSourceFileAtPath(file);
  const ast_diagnostics = source.getPreEmitDiagnostics();
  const hasErrors = ast_diagnostics.length > 0 ? true : false;

  const diagnostics: CacheDiagnostic[] = [];

  for (const d of ast_diagnostics) {
    const related = d.compilerObject.relatedInformation
      ? `( ${chalk.bold("related:")} ${chalk.dim(JSON.stringify(d.compilerObject.relatedInformation.map(t => t.messageText.toString())))} )`
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
      : d.getMessageText().toString()
  
    const msg = `(${lineNumber}, ${column}, ${code}): ${txt} ${related}`

    diagnostics.push({
      msg,
      lineNumber: line + 1,
      column: character + 1,
      code: d.getCode(),
    })
  }

  const hash = hasher(source.getText());
  if(hasErrors) {
    process.stdout.write(chalk.bold.red("."));
  } else {
    process.stdout.write(chalk.bold.green("."));
  }

  return {
    file,
    hash,
    hasErrors,
    diagnostics,
    cacheHit: false
  } as FileDiagnostics;

  

}
