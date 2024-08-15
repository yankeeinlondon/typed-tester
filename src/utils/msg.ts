import chalk from "chalk";

/**
 * messages out to stderr (to avoid conflicts with primary output going
 * to stdout)
 */
export const msg = (...args: unknown[]) => console.error(...args.map(i => chalk.reset(i)));
