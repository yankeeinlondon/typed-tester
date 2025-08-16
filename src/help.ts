import type { Command } from "./cli/cli-types";

import chalk from "chalk";
import commandLineUsage from "command-line-usage";
import packageJson from "../package.json";
import {
    command_descriptions,
    command_options,
    commands_union,
    global_options
} from "./cli/options";
import { isCommand } from "./type-guards";

export function sections(cmd?: string) {
    return [
        {
            header: `${chalk.bold("Typed")} ${chalk.dim("v")}${packageJson.version}`,
            content: "Typescript type testing and diagnostics.",
        },
        {
            header: `Syntax`,
            content: isCommand(cmd)
                ? `${chalk.bold("typed")} ${cmd} ${chalk.dim(`[ ${chalk.italic("options")} ]`)}\n\n${command_descriptions[cmd] || ""}`
                : `${chalk.bold("typed")} [ ${chalk.dim(commands_union)} ] ${chalk.dim(`[ ${chalk.italic("options")} ]`)}
      
      Choose a command from those listed above and add ${chalk.bold("--help")} for
      more info.`
        },
        isCommand(cmd)
            ? {}
            : {
                    header: "Commands:",
                    content: Object.keys(command_descriptions).map((k) => {
                        const desc = command_descriptions[k as keyof typeof command_descriptions] as string;
                        return `${chalk.bold(k)}: ${chalk.dim(desc)}`;
                    }).join("\n")
                },
        {
            header: isCommand(cmd) ? "Options" : "Global Options",
            optionList: isCommand(cmd)
                ? [
                        ...command_options[cmd].filter(i => i.name !== "cmd"),
                        ...global_options
                    ]
                : global_options
        }
    ];
}

export function show_help(cmd?: Command | undefined) {
    const usage = commandLineUsage(sections(cmd));
    console.log(usage);
}
