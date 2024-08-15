import chalk from "chalk";
import {  Option } from "./cli-types";



/** all commands receive their respective command as first param */
const CMD = {name: "cmd", type: String, defaultOption: true, multiple: false};

export const command_options = {
  test: [
    CMD,
    {
      name: "filter", alias: "f", typeLabel: "glob",
      type: String, description: `only evaluate tests which contain the filter string` 
    },
    {
      name: "clear", alias: "c", defaultValue: false,
      type: Boolean, description: `clear the cache prior to analyzing`
    },

    {
      name: "watch", alias: "w", defaultValue: false,
      type: Boolean, description: `run in watch mode`
    },
    {
      name: "ignore",  alias: "i",  defaultValue: [], multiple: true,
      type: Number, description: `TS error codes that just be downgraded to just warnings`
    },
    {
      name: "miss", alias: "m", defaultValue: false,
      type: Boolean, description: "show tests which were a cache miss"
    },
    {
      name: "config", typeLabel: "filepath",
      type: String, description: `explicitly state which tsconfig file to use`
    },
  ],
  diagnostics: [
    CMD,
  ],
  deps: [
    CMD,
    { name: "filter", type: String, alias: "f", multiple: true, 
      typeLabel: chalk.underline("str,re"),
      description: `only report on symbols which match filter string` 
    },
    { 
      name: "json", type: Boolean, 
      description: `output JSON to stdout rather than screen friendly format`
    },
  ],
  /** source graph options */
  symbols: [
    CMD,
    { name: "filter", type: String, alias: "f", multiple: true, 
      typeLabel: chalk.underline("substr[]"),
      description: `only report on symbols which match filter string` 
    },
    { 
      name: "config", type: String, alias: "c", 
      typeLabel: chalk.underline("tsconfig"), multiple: false, 
      description: `explicitly state which tsconfig file to use (otherwise will search in common locations)` 
    },
    { 
      name: "clear", type: Boolean, 
      description: `clear the symbol cache and rebuild from scratch`
    },

  ]
} as const satisfies  Record<string, Option[]>;

export const commands_union = Object.keys(command_options).join(`${chalk.gray(" | ")}`);

/**
 * options which are available to all commands
 */
export const global_options = [
  { 
    name: "json", type: Boolean, defaultValue: false,
    description: `output in a JSON format versus a screen oriented format` 
  },
  {
    name: "quiet", alias: "q", defaultValue: false,
    type: Boolean, description: `quiet stdout output to a minimum`
  },
  { 
    name: "verbose", type: Boolean, alias: "v", defaultValue: false,
    description: `more verbose output when analyzing`
  },
  { 
    name: "help", alias: "h", type: Boolean, defaultValue: false,
    description: `this help menu` 
  },
] as const satisfies Option[];

/**
 * options which are available only when _no_ command is expressed
 */
export const only_global_options = [
  { 
    name: "cache", type: Boolean, defaultValue: false,
    description: `show a summary of what is in cache currently` 
  },
]


export const command_descriptions = {
  test: `runs through test files and looks for type errors`,
  diagnostics: ``,
  deps: `shows what symbols are ${chalk.italic("dependant")} on a given symbol`,
  symbols: `shows a symbol (or set of symbols) and the symbols characteristics`,
} as const satisfies Record<keyof typeof command_options, string>
