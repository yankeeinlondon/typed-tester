import type { AsOption } from "../cli";
import chalk from "chalk";

/**
 * messages out to stderr (to avoid conflicts with primary output going
 * to stdout)
 */
export function shout(opt: AsOption<null>) {
    return (...args: unknown[]) => {
        if (opt.verbose) {
            console.error(...args.map(i => chalk.reset(i)));
        }
    };
}
