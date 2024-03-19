#!/usr/bin/env node

// src/ts-test.ts
import chalk4 from "chalk";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

// src/typeValidation.ts
import chalk3 from "chalk";
import glob from "fast-glob";
import path from "pathe";

// src/getFileDiagnostics.ts
import { ts } from "ts-morph";

// src/cache.ts
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import chalk from "chalk";
var CACHE_FILE = ".ts-test-cache";
var cache = {};
var getCache = (force) => {
  if (Object.keys(cache).length === 0 || force) {
    if (existsSync(CACHE_FILE)) {
      const data = readFileSync(CACHE_FILE, "utf-8");
      try {
        cache = JSON.parse(data);
      } catch (e) {
        console.log(`${chalk.red.bold("Invalid Cache File!")} Cache file is being removed!`);
        cache = {};
        unlinkSync(CACHE_FILE);
      }
    }
  }
  return cache;
};
var saveCache = (data) => {
  cache = data.reduce(
    (acc, item) => {
      return {
        ...acc,
        [item.file]: item
      };
    },
    {}
  );
  writeFileSync(CACHE_FILE, JSON.stringify(cache), "utf-8");
  return cache;
};

// src/getFileDiagnostics.ts
import chalk2 from "chalk";
import { readFileSync as readFileSync2 } from "fs";
var getFileDiagnostics = (file, prj, hasher) => {
  const cache2 = getCache();
  if (cache2[file]) {
    const data = readFileSync2(file, "utf-8");
    const hash2 = hasher(data);
    if (hash2 === cache2[file].hash) {
      if (cache2[file].hasErrors) {
        process.stdout.write(chalk2.dim.red("."));
      } else {
        process.stdout.write(chalk2.dim.green("."));
      }
      return {
        ...cache2[file],
        cacheHit: true
      };
    }
  }
  const source = prj.addSourceFileAtPath(file);
  const ast_diagnostics = source.getPreEmitDiagnostics();
  const hasErrors = ast_diagnostics.length > 0 ? true : false;
  const diagnostics = [];
  for (const d of ast_diagnostics) {
    const related = d.compilerObject.relatedInformation ? `( ${chalk2.bold("related:")} ${chalk2.dim(JSON.stringify(d.compilerObject.relatedInformation.map((t) => t.messageText.toString())))} )` : "";
    const {
      line,
      character
    } = ts.getLineAndCharacterOfPosition(source.compilerNode, d.getStart() || 0);
    const lineNumber = `${chalk2.dim("l:")}${line + 1}`;
    const column = `${chalk2.dim("c:")}${character + 1}`;
    const code = `${chalk2.dim("code:")} ${d.getCode()}`;
    const txt = typeof d.getMessageText() === "string" ? d.getMessageText() : d.getMessageText().toString();
    const msg = `(${lineNumber}, ${column}, ${code}): ${txt} ${related}`;
    diagnostics.push({
      msg,
      lineNumber: line + 1,
      column: character + 1,
      code: d.getCode()
    });
  }
  const hash = hasher(source.getText());
  if (hasErrors) {
    process.stdout.write(chalk2.bold.red("."));
  } else {
    process.stdout.write(chalk2.bold.green("."));
  }
  return {
    file,
    hash,
    hasErrors,
    diagnostics,
    cacheHit: false
  };
};

// src/setupProject.ts
import { Project as Project2 } from "ts-morph";
var setupProject = (configFile) => {
  const prj = new Project2({
    tsConfigFilePath: configFile,
    skipAddingFilesFromTsConfig: true
  });
  return prj;
};

// src/typeValidation.ts
import { stdout } from "process";
import xxhash from "xxhash-wasm";
var type_validation = async (folder, configFile) => {
  var start = performance.now();
  configFile = configFile || "tsconfig.json";
  const { h32 } = await xxhash();
  console.log(chalk3.bold(`TS Type Tester`));
  console.log(`------------`);
  const glob_pattern = path.join("./", folder, "/**/**.ts");
  const files = await glob(glob_pattern);
  console.log(`- inspecting ${files.length} typescript files for type errors`);
  stdout.write(`- starting analysis:  `);
  const prj = setupProject(configFile);
  const results = [];
  for (const file of files) {
    results.push(getFileDiagnostics(file, prj, h32));
  }
  const cache2 = saveCache(results);
  console.log(chalk3.bold(`

Type Errors`));
  console.log(`---------------`);
  for (const key of Object.keys(cache2)) {
    const file = cache2[key];
    if (file.hasErrors) {
      console.log();
      console.log(chalk3.underline.bold(file.file));
      for (const diagnostic of file.diagnostics) {
        console.log(`- ${diagnostic.msg}`);
      }
    }
  }
  console.log(chalk3.bold(`

Type Error Summary`));
  console.log(chalk3.bold(`------------------
`));
  const err_count = results.reduce((acc, i) => acc + i.diagnostics.length, 0);
  const err_files = results.reduce((acc, i) => acc + (i.hasErrors ? 1 : 0), 0);
  const hits = results.reduce((acc, i) => acc + (i.cacheHit ? 1 : 0), 0);
  const ratio = Math.floor(hits / Object.keys(cache2).length * 100);
  const end = performance.now();
  const duration = Math.floor(end - start) / 1e3;
  console.log(`- ${chalk3.bold(err_files)} of ${chalk3.bold(files.length)} files had type errors`);
  console.log(`- there are ${chalk3.redBright.bold(err_count)} total errors`);
  console.log(`- analysis benefited from ${chalk3.bold(hits)} cache hits [${chalk3.dim(`ratio: ${ratio}%`)}]`);
  console.log(`- analysis and cache refresh took ${duration} seconds`);
  console.log();
};

// src/ts-test.ts
var cli = commandLineArgs(
  [
    { name: "params", type: String, multiple: true, defaultOption: true },
    { name: "filter", type: String, alias: "f", multiple: true },
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
    content: `${chalk4.bold("ts-type-tester")} folder [${chalk4.dim("configFile")}]
      
      You must specify the root folder you want to test files in. While this program was intended to primarily be pointed at a test directory you can point it anywhere relative to the current directory.

      By default the ${chalk4.dim("configFile")} parameter will be the ${chalk4.blue("tsconfig.json")} in the project root but you can point it to another file if you prefer.
      `,
    description: ""
  },
  {
    header: "Options",
    optionList: [
      {
        name: "filter",
        type: String,
        typeLabel: "{underline glob-pattern}",
        description: "Use a glob pattern to select or deselect files"
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
  console.log(cli);
}
await type_validation(cli.params[0] || "tests", cli.params[1]);
