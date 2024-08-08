#!/usr/bin/env node
// CLI SCRIPT

import chalk from "chalk";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import { type_validation } from "./typeValidation";

const cli = commandLineArgs(
  [
    { name: "params", type: String, multiple: true, defaultOption: true },
    { name: "verbose", type: Boolean, alias: "v"},
    { name: "filter", type: String, alias: "f", multiple: true },
    { name: "warn", type: String, multiple: true },
    { name: "watch", type: Boolean, alias: "w" },
    { name: "clean", type: Boolean, alias: "c" },
    { name: "deps", type: Boolean },
    { name: "json", type: Boolean },
    { name: "help", alias: "h", type: Boolean },
  ],
  {
    stopAtFirstUnknown: true
  }
);

const sections = [
  {
    header: 'TS Type Tester',
    content: 'Test your {italic types} as part of your testing.',
  },
  {
    header: `Syntax`,
    content: `${chalk.bold("ts-type-tester")} folder [${chalk.dim("configFile")}]
    
    You must specify the root folder you want to test files in. While this program was intended to primarily be pointed at a test directory you can point it anywhere relative to the current directory.

    By default the ${chalk.dim("configFile")} parameter will be the ${chalk.blue("tsconfig.json")} in the your default folder's root (or the repo root after that) but you can point it to another file if you prefer.
    `,
  },
  {
    header: 'Options',
    optionList: [
      {
        name: 'filter',
        type: String,
        typeLabel: '{underline glob-pattern}',
        description: `Use a glob pattern to select or deselect files; you can use 1 or more of these and a glob pattern starting with a ${chalk.bold("!")} will be a negation pattern.`
      },
      {
        name: 'verbose',
        alias: "v",
        type: Boolean,
        description: `more verbose output when analyzing`
      },
      {
        name: 'warn',
        typeLabel: '{underline code}',
        description: 'Specify error code(s) which should be downgraded to only a warning'
      },
      {
        name: 'watch',
        alias: "w",
        type: Boolean,
        description: `run as a {italic watcher} process`
      },
      {
        name: "audio",
        type: Boolean,
        description: `audio alert when errors appear or are eliminated`
      },
      {
        name: "clean",
        alias: "c",
        type: Boolean,
        description: `clean/clear the cache when starting`
      },
      {
        name: "deps",
        alias: "d",
        type: Boolean,
        description: `show the dependency graph for files`
      },
      {
        name: "quiet",
        type: Boolean,
        description: `removes all summary information and only reports errors`
      },
      {
        name: "json",
        type: Boolean,
        description: `output a JSON dictionary at the end instead of normal content throughout the lifetime of the test process; note that exit code will always be 0 (aka, "ok") when using this switch`
      }
    ]
  }
]
if (Object.keys(cli).length === 0) {
  const usage = commandLineUsage(sections)
  console.log(usage)
  process.exit(0);
} 

if(cli.help) {
  console.log(commandLineUsage(sections));
  process.exit(0);
} else if(cli.deps) {
  // TODO
} else {
  if(cli._unknown && cli._unknown?.length > 0) {
    console.log(chalk.red(`Unknown options: `) + Object.keys(cli._unknown));
    console.log();
    console.log(commandLineUsage(sections));
  } else {
    await type_validation(
      cli.params ? cli.params[0] || "tests" : "tests",
      {
        configFile: cli.params ? cli.params[1] : undefined,
        watchMode: cli.watch || false,
        cleanFlag:  cli.clean || false,
        filter: cli.filter || [],
        warn: cli.warn || [],
        quiet: cli.quiet || false,
        json: cli.json || false,
        force: false,
        verbose: cli.verbose || false
      }
    );
  }
}

