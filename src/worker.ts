import { DiagnosticMessageChain, Project, ts } from "ts-morph";
import { getCache, h, initializeHasher, validateCache } from "./cache";
import { getProject, setupProject } from "./setupProject";
import { ValidationOptions } from "./typeValidation";
import { calcErrorsAndWarnings } from "./calcErrorsAndWarnings";
import chalk from "chalk";
import { getFileDependencies } from "./getFileDependencies";

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

  hasWarnings: boolean;
}

const addFile = (file: string, prj: Project, opts: ValidationOptions) => {{
  const cache = getCache();
  try {
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
      } as FileDiagnostics

    }

    let source = prj.addSourceFileAtPath(file);
    const start_timer = () => {
      const current_file = file;
      setTimeout(() => {
        if (file === current_file) {
          return Promise.reject(`timed out servicing file: ${file}`)
        }
        return
      }, 750);
    };
    start_timer();

    if(opts.force) {
      getProject().removeSourceFile(source);
      source = prj.addSourceFileAtPath(file);
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
      cacheHit: false
    } as FileDiagnostics;

    const result = {
      ...partial,
      ...calcErrorsAndWarnings(partial, opts)
    }

    if(!opts.quiet && !opts.force) {
      if(result.hasErrors) {
        process.stdout.write("🔴");
      } else if(result.hasWarnings) {
        process.stdout.write("🟡");
      } else {
        process.stdout.write("🟢");
      }
    }

    return result;

  } catch (error) {
    console.log(`ERROR`, error);
    
    return Promise.reject(error);
  }
}}

/**
 * Retrieves the file's diagnostics (from cache or static analysis)
 */
export default async (
  config: {files: string[], opts: ValidationOptions, prj: Project} 
): Promise<ValidationTask> => {
    const { files, opts } = config;
    const h = await initializeHasher();
    let cache = getCache();
    let prj = setupProject(opts.configFile || "tsconfig.json");
  for (const file of files) {
    addFile(file, prj, opts);
  }

  
}


