import chalk from "chalk";
import glob from "fast-glob";
import ts from "typescript";
import { Diagnostic, checkFile } from "./checkFile";
import path from "pathe";

/**
 * **type_validation**
 * 
 * Kick off the type validation process.
 */
export const type_validation = async (folder: string, configFile?: string) => {
  console.log(chalk.bold(`TS Type Tester`));
  console.log(`------------`);

  const config = ts.readConfigFile(configFile || `tsconfig.json`, ts.sys.readFile);
  if(config.error) {
    throw new Error(`Problems loading Typescript config file: ${configFile || "tsconfig.json"}`);
  }
  const glob_pattern = path.join("./", folder, "/**/**.ts");
  console.log(`glob: ${chalk.dim(glob_pattern)}`);
  console.log(folder);
  

  const files = await glob(glob_pattern);
  console.log(`- inspecting ${files.length} typescript files for type errors`);
  // initial analysis
  console.log(`- starting initial analysis:\n`);
  let error_files: Record<string, Diagnostic[]> = {};
  const all_diagnostics: Diagnostic[] = [] as Diagnostic[];

  for (const file of files) {
    const [code, diagnostics] = checkFile(file);
    if(code === 1) {
      error_files = {
        ...error_files,
        ...{ [file]: diagnostics }
      };

    }
    all_diagnostics.push(...diagnostics as Diagnostic[])
  }

  console.log(`\n- ${chalk.bold(Object.keys(error_files).length)} of ${chalk.bold(files.length)} files with type errors`);
  console.log(`- there are ${chalk.redBright.bold(all_diagnostics.length)} total errors across all files\n`);

  console.log(chalk.bold(`Existing Errors`));
  console.log(`---------------`);
  
  
  let current_file = "";
  for (const d of all_diagnostics) {
    if(d.file !== current_file) {
      console.log();
      console.log(chalk.underline.bold(d.file));
      current_file = d.file
    }
    const source = d.source
      ? `, source: ${chalk.dim(d.source)}`
      : "";
    const related = d.relatedInformation
      ? `, related: ${chalk.dim(JSON.stringify(d.relatedInformation))}`
      : ""
    console.log(`  - ${d.msg} (cat: ${chalk.dim(d.category)}, code: ${chalk.dim(d.code)}${source}${related})`);
  }
  
};

