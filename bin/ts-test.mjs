#!/usr/bin/env node

// src/ts-test.ts
import chalk3 from "chalk";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

// src/type_validate.ts
import chalk2 from "chalk";
import glob from "fast-glob";
import ts2 from "typescript";

// src/checkFile.ts
import ts from "typescript";
import path from "pathe";
import { isObject } from "inferred-types";
import chalk from "chalk";
var checkFile = (folder, config) => {
  const configFile = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
  configFile.config.include = [folder];
  const parsedCommandLine = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname("tsconfig.json")
  );
  const program = ts.createProgram(parsedCommandLine.fileNames, parsedCommandLine.options);
  const diagnostics = [];
  const allDiagnostics = ts.getPreEmitDiagnostics(program);
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
        file: folder,
        msg: `(${chalk.dim("l:")} ${line + 1}, ${chalk.dim("c:")}${character + 1}): ${message}`,
        line,
        character
      });
    } else {
      diagnostics.push({
        kind: "Diagnostic",
        type: "general",
        category: diagnostic.category,
        file: folder,
        source: diagnostic.source,
        relatedInformation: diagnostic.relatedInformation,
        code: diagnostic.code,
        msg: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
      });
    }
  });
  const exitCode = diagnostics.length === 0 ? 0 : 1;
  return [exitCode, diagnostics];
};

// src/type_validate.ts
import path2 from "pathe";
var type_validation = async (folder, configFile) => {
  console.log(chalk2.bold(`TS Type Tester`));
  console.log(`------------`);
  const config = ts2.readConfigFile(configFile || `tsconfig.json`, ts2.sys.readFile);
  if (config.error) {
    throw new Error(`Problems loading Typescript config file: ${configFile || "tsconfig.json"}`);
  }
  const glob_pattern = path2.join("./", folder, "/**/**.ts");
  console.log(`glob: ${chalk2.dim(glob_pattern)}`);
  console.log(folder);
  const files = await glob(glob_pattern);
  console.log(`- inspecting ${files.length} typescript files for type errors`);
  console.log(`- starting initial analysis:
`);
  let error_files = {};
  const all_diagnostics = [];
  for (const file of files) {
    const [code, diagnostics] = checkFile(file);
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

// src/ts-test.ts
var cli = commandLineArgs(
  [
    { name: "params", type: String, multiple: true, defaultOption: true },
    { name: "verbose", alias: "v" }
  ],
  {
    stopAtFirstUnknown: true
  }
);
var sections = [
  {
    header: "TS Type Tester",
    content: "Test your {italic types} as part of your testing."
  },
  {
    header: `Syntax`,
    content: `${chalk3.bold("ts-type-tester")} folder [${chalk3.dim("configFile")}]
      
      You must specify the root folder you want to test files in. While this program was intended to primarily be pointed at a test directory you can point it anywhere relative to the current directory.

      By default the ${chalk3.dim("configFile")} parameter will be the ${chalk3.blue("tsconfig.json")} in the project root but you can point it to another file if you prefer.
      `,
    description: ""
  },
  {
    header: "Options",
    optionList: [
      {
        name: "ignore",
        typeLabel: "{underline code,code,etc.}",
        description: "Specify error codes you want to ignore fully"
      },
      {
        name: "warn",
        typeLabel: "{underline code,code,etc.}",
        description: "Specify error codes which should only be considered a warning rather than an error"
      },
      {
        name: "watch",
        alias: "w",
        type: Boolean,
        description: `start as a {italic watcher} and update error status as it changes`
      }
    ]
  }
];
if (Object.keys(cli).length === 0) {
  const usage = commandLineUsage(sections);
  console.log(usage);
  process.exit(0);
} else {
  console.log(cli.params);
}
await type_validation(cli.params[0] || "tests", cli.params[1]);
