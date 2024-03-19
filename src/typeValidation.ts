import chalk from "chalk";
import glob from "fast-glob";
import path from "pathe";
import { FileDiagnostics, getFileDiagnostics } from "./getFileDiagnostics";
import { setupProject } from "./setupProject";
import { stdout } from "process";
import xxhash from "xxhash-wasm";
import {  saveCache } from "./cache";



/**
 * **type_validation**
 * 
 * Kick off the type validation process.
 */
export const type_validation = async (folder: string, configFile?: string) => {
  var start = performance.now();
  configFile = configFile || "tsconfig.json";
  const { h32 } = await xxhash();

  console.log(chalk.bold(`TS Type Tester`));
  console.log(`------------`);

  const glob_pattern = path.join("./", folder, "/**/**.ts");
  const files = await glob(glob_pattern);
  console.log(`- inspecting ${files.length} typescript files for type errors`);
  // initial analysis
  stdout.write(`- starting analysis:  `);
  const prj = setupProject(configFile);

  const results: FileDiagnostics[] = [];

  for (const file of files) {
    results.push(getFileDiagnostics(file, prj, h32));
  }

  const cache = saveCache(results);

  console.log(chalk.bold(`\n\nType Errors`));
  console.log(`---------------`);

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

  console.log(chalk.bold(`\n\nType Error Summary`));
  console.log(chalk.bold(`------------------\n`));
  
  const err_count = results.reduce((acc,i) => acc + i.diagnostics.length, 0);
  const err_files = results.reduce((acc,i) => acc + (i.hasErrors ? 1 : 0), 0);
  const hits = results.reduce((acc,i) => acc + (i.cacheHit ? 1 : 0), 0);
  const ratio = Math.floor(hits/Object.keys(cache).length * 100);
  const end = performance.now();
  const duration = Math.floor((end-start))/1000;

  console.log(`- ${chalk.bold(err_files)} of ${chalk.bold(files.length)} files had type errors`);
  console.log(`- there are ${chalk.redBright.bold(err_count)} total errors`);
  console.log(`- analysis benefited from ${chalk.bold(hits)} cache hits [${chalk.dim(`ratio: ${ratio}%`)}]`);
  console.log(`- analysis and cache refresh took ${duration} seconds`);
  console.log();
};

