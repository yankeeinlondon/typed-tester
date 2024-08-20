import chalk from "chalk";
import { AsOption } from "src/cli";

/**
 * messages out to stderr (to avoid conflicts with primary output going
 * to stdout)
 */
export const shout = (opt: AsOption<null>) => (...args: unknown[])=>  {
  if (opt.verbose) {
    console.error(...args.map(i => chalk.reset(i)));
  }
}
