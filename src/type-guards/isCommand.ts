import type { Command } from "~/cli";
import { isString } from "inferred-types";
import { command_options } from "~/cli";

/**
 * type guard which checks whether the passed in value is a known command to CLI
 */
export function isCommand(val: unknown): val is Command {
    return isString(val) && Object.keys(command_options).includes(val as any);
}
