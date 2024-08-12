import commandLineArgs, { CommandLineOptions} from "command-line-args";
import { Command } from "./cli-types";
import { command_options, global_options } from "./options";
import { isCommand } from "src/type-guards";



/**
 * used to define CLI variable as a numeric array
 */
export const NumericArray = (): number[] => [];



export type CliResponse = [Command, CommandLineOptions] | [undefined, CommandLineOptions];

export const create_cli = (): CliResponse =>  {
  const argv = process.argv[2]?.split(" ") || [];
  const cmd_candidate: string = argv[0] || "not-command";

  return isCommand(cmd_candidate)
  ? [
      cmd_candidate,
      commandLineArgs(
        [
          ...command_options[cmd_candidate],
          ...global_options
        ],
        { stopAtFirstUnknown: true }
      )
  ]
  : [
      undefined,
      commandLineArgs(
        global_options,
        { stopAtFirstUnknown: true }
      )
  ];
}
