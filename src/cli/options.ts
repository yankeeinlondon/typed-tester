import type { Option } from "./cli-types";
import chalk from "chalk";

/** all commands receive their respective command as first param */
const CMD = { name: "cmd", type: String, defaultOption: true, multiple: false };

export const command_options = {
    test: [
        { name: "show-passing", type: Boolean, description: `show details of passing tests (must use verbose flag)` },
        { name: "ignore-outside", type: Boolean, description: `ignore all type errors outside of test blocks` },
        {
            name: "files",
            type: Boolean,
            description: `list only files with errors and their error counts`
        },
        {
            name: "slow",
            defaultValue: false,
            type: Boolean,
            description: `only show test files which are slow`
        },
        {
            name: "only-errors",
            defaultValue: false,
            type: Boolean,
            description: `only show test files which have errors`
        },
        {
            name: "show-symbols",
            defaultValue: false,
            type: Boolean,
            description: `show the type symbols imported into the test file`
        },
    ],
    deps: [
        CMD,
        { name: "filter", type: String, alias: "f", multiple: true, typeLabel: chalk.underline("str,re"), description: `only report on symbols which match filter string` },
        { name: "graph", type: Boolean, defaultValue: false, description: `show full dependency tree for a single symbol (vs list view showing first-order dependencies)` },
        { name: "clear-cache", type: Boolean, defaultValue: false, description: `clear the dependency cache and rebuild from scratch` },
        { name: "depth", type: Number, defaultValue: 50, typeLabel: chalk.underline("N"), description: `maximum depth to traverse when building dependency graph (default: 50)` }
    ],
    source: [
    ],
    /** source graph options */
    symbols: [
        CMD,
        { name: "filter", type: String, alias: "f", multiple: true, typeLabel: chalk.underline("substr[]"), description: `only report on symbols which match filter string` },

        {
            name: "clear",
            type: Boolean,
            description: `clear the symbol cache and rebuild from scratch`
        },
    ],
    files: [
        CMD,
        {
            name: "filter",
            type: String,
            alias: "f",
            multiple: true,
            typeLabel: chalk.underline("substr[]"),
            description: `only report on symbols which match filter string`
        }
    ]
} as const satisfies Record<string, Option[]>;

export const commands_union = Object.keys(command_options).join(`${chalk.gray(" | ")}`);

type CommandOptions = typeof command_options;

export type Command = keyof CommandOptions;

/**
 * options which are available to all commands
 */
export const global_options = [
    {
        name: "config",
        type: String,
        alias: "c",
        typeLabel: chalk.underline("tsconfig"),
        multiple: false,
        description: `explicitly state which tsconfig file to use (otherwise will search in common locations)`
    },
    {
        name: "json",
        type: Boolean,
        defaultValue: false,
        description: `output in a JSON format versus a screen oriented format`
    },
    {
        name: "quiet",
        alias: "q",
        defaultValue: false,
        type: Boolean,
        description: `quiet stdout output to a minimum`
    },
    {
        name: "verbose",
        type: Boolean,
        alias: "v",
        defaultValue: false,
        description: `more verbose output when analyzing`
    },
    {
        name: "warn",
        alias: "w",
        defaultValue: [],
        multiple: true,
        type: Number,
        description: `TS error codes that just be downgraded to just warnings`
    },
    {
        name: "help",
        alias: "h",
        type: Boolean,
        defaultValue: false,
        description: `this help menu`
    },
] as const satisfies Option[];

/**
 * options which are available only when _no_ command is expressed
 */
export const only_global_options: any[] = [];

export const command_descriptions = {
    test: `runs a ${chalk.bold("type test")} across all (or a filtered) set of the ${chalk.italic("type tests")}.`,
    symbols: `reports on the ${chalk.italic("type symbols")} found in the project`,
    files: `shows every source file which defines a types symbol and the symbols it defines`,
    source: `reports on the ${chalk.italic("source file")}'s general type health.`,
    deps: `shows what symbols are ${chalk.italic("dependant")} on a given symbol(s).`,
} as const satisfies Record<Command, string>;
