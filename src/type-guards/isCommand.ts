import { isString } from "inferred-types";
import { Command, command_options } from "src/cli";

/**
 * type guard which checks whether the passed in value is a known command to CLI
 */
export const isCommand = (val: unknown): val is Command => {
  return isString(val) && Object.keys(command_options).includes(val as any);
}
