import commandLineArgs, { CommandLineOptions} from "command-line-args";
import { Command } from "./cli-types";
import { command_options, global_options } from "./options";
import { isCommand } from "src/type-guards";

/**
 * used to define CLI variable as a numeric array
 */
export const NumericArray = (): number[] => [];


export type CliResponse = [Command, CommandLineOptions, string[]] | [undefined, CommandLineOptions, string[]];

export const create_cli = (): CliResponse =>  {
  const argv = process.argv.slice(2);
  const cmd_candidate: string = argv[0] || "not-command";

  if (isCommand(cmd_candidate)) {
    // Parse command-line arguments excluding the command itself
    const parsed = commandLineArgs(
      [
        ...command_options[cmd_candidate],
        ...global_options
      ],
      { argv: argv.slice(1), stopAtFirstUnknown: true }
    );
    
    // Extract positional arguments (any arguments that weren't parsed as options)
    const positionalArgs = parsed._unknown || [];
    
    return [cmd_candidate, parsed, positionalArgs];
  } else {
    const parsed = commandLineArgs(
      global_options,
      { argv, stopAtFirstUnknown: true }
    );
    
    const positionalArgs = parsed._unknown || [];
    
    return [undefined, parsed, positionalArgs];
  }
}
