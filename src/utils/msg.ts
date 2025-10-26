import type { AsOption } from "../cli";
import chalk from "chalk";

/**
 * messages out to stderr (to avoid conflicts with primary output going
 * to stdout)
 */
export function msg(opt: AsOption<null>) {
    return (...args: unknown[]) => {
        if (!opt.quiet) {
            console.error(...args.map(i => chalk.reset(i)));
        }
    };
}
