import chalk from "chalk";
import { Command, command_descriptions, command_options, global_options, isCommand } from "./create_cli";
import commandLineUsage from "command-line-usage";



export const sections = (cmd?: string) => [
  {
    header: 'Typed',
    content: 'Typescript type testing and diagnostics.',
  },
  {
    header: `Syntax`,
    content: isCommand(cmd)
    ? `${chalk.bold("typed")} ${cmd} ${chalk.dim(`[ ${chalk.italic("options")} ]`)}\n\n${command_descriptions[cmd] || ""}`
      : `${chalk.bold("typed")} [${chalk.dim("test | diagnostics | deps | graph")}] ${chalk.dim(`[ ${chalk.italic("options")} ]`)}
      
      Choose a command from those listed above and add ${chalk.bold("--help")} for
      more info.`
  },
  {
    header: 'Options',
    optionList: isCommand(cmd)
      ? [
        ...command_options[cmd].filter(i => i.name !== "cmd"),
        ...global_options
      ]
      : global_options
  }
]

export const show_help = (cmd?: Command | undefined) => {
  const usage = commandLineUsage(sections(cmd));
  console.log(usage);
}
