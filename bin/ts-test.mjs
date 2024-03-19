#!/usr/bin/env node

// src/checkFile.ts
import ts from "typescript";
import path from "pathe";
import { isObject } from "inferred-types";
import chalk from "chalk";
var checkTypeScriptFile = (filePath) => {
  const configFile = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
  configFile.config.include = [filePath];
  const parsedCommandLine = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname("tsconfig.json")
  );
  const program = ts.createProgram(parsedCommandLine.fileNames, parsedCommandLine.options);
  const emitResult = program.emit();
  const diagnostics = [];
  const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
  allDiagnostics.forEach((diagnostic) => {
    if (diagnostic.file) {
      const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start || 0);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      diagnostics.push({
        kind: "Diagnostic",
        type: "specific",
        category: diagnostic.category,
        code: diagnostic.code,
        source: diagnostic.source,
        relatedInformation: diagnostic.relatedInformation,
        file: filePath,
        msg: `(${chalk.dim("l:")} ${line + 1}, ${chalk.dim("c:")}${character + 1}): ${message}`,
        line,
        character
      });
    } else {
      diagnostics.push({
        kind: "Diagnostic",
        type: "general",
        category: diagnostic.category,
        file: filePath,
        source: diagnostic.source,
        relatedInformation: diagnostic.relatedInformation,
        code: diagnostic.code,
        msg: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
      });
    }
  });
  const exitCode = diagnostics.length === 0 && !emitResult.emitSkipped ? 0 : 1;
  return [exitCode, emitResult, diagnostics];
};

// src/ts-test.ts
import chalk2 from "chalk";
import glob from "fast-glob";
import ts2 from "typescript";
var type_validation = async (folder, configFile) => {
  const config = ts2.readConfigFile(configFile || "tsconfig.json", ts2.sys.readFile);
  if (config.error) {
    throw new Error(`Problems loading Typescript config file: ${configFile || "tsconfig.json"}`);
  }
  const files = await glob(`${folder}/**/*.ts`);
  console.log(`- watching ${files.length} typescript files for type errors`);
  console.log(`- starting initial analysis:
`);
  let error_files = {};
  const all_diagnostics = [];
  for (const file of files) {
    const [code, _result, diagnostics] = checkTypeScriptFile(file);
    if (code === 1) {
      error_files = {
        ...error_files,
        ...{ [file]: diagnostics }
      };
    }
    all_diagnostics.push(...diagnostics);
  }
  console.log(`
- ${chalk2.bold(Object.keys(error_files).length)} of ${chalk2.bold(files.length)} files with type errors`);
  console.log(`- there are ${chalk2.redBright.bold(all_diagnostics.length)} total errors across all files
`);
  console.log(chalk2.bold(`Existing Errors`));
  console.log(`---------------`);
  let current_file = "";
  for (const d of all_diagnostics) {
    if (d.file !== current_file) {
      console.log();
      console.log(chalk2.underline.bold(d.file));
      current_file = d.file;
    }
    const source = d.source ? `, source: ${chalk2.dim(d.source)}` : "";
    const related = d.relatedInformation ? `, related: ${chalk2.dim(JSON.stringify(d.relatedInformation))}` : "";
    console.log(`  - ${d.msg} (cat: ${chalk2.dim(d.category)}, code: ${chalk2.dim(d.code)}${source}${related})`);
  }
};
var ts_test_default = type_validation;
await type_validation("./tests");
export {
  ts_test_default as default
};
