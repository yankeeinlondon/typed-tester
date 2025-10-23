import chalk from "chalk";
import type { TestFile } from "~/types";
import { isSlowTest, isVerySlowTest } from "~/ast";

/**
 * Formats the timing display with:
 * - Always show milliseconds
 * - Color coding: fast (dimmed), slow (orange), very slow (red)
 * - μs/line only shown with --metrics flag
 * - Use | separator when metrics are shown
 */
export function formatTiming(
    testFile: TestFile,
    options: {
        metrics?: boolean;
        verbose?: boolean;
    }
): string {
    const msPerFile = Math.floor(testFile.duration);
    const microSecPerLine = msPerFile === 0 || testFile.testLines === 0
        ? 0
        : Math.floor(1000 * (testFile.duration / testFile.testLines));

    const isSlow = isSlowTest(testFile);
    const isVerySlow = isVerySlowTest(testFile);

    // Determine timing format based on speed
    let timingStr: string;

    if (isVerySlow) {
        // Very slow: red and bold
        timingStr = `${chalk.red.bold(msPerFile)}${chalk.dim.italic.red("ms")}`;
        if (options.metrics) {
            timingStr += ` | ${chalk.red.bold(microSecPerLine)}${chalk.dim.italic.red("μs/line")}`;
        }
    } else if (isSlow) {
        // Slow: yellow/orange and bold
        timingStr = `${chalk.yellowBright.bold(msPerFile)}${chalk.dim.italic.yellowBright("ms")}`;
        if (options.metrics) {
            timingStr += ` | ${chalk.yellowBright.bold(microSecPerLine)}${chalk.dim.italic.yellowBright("μs/line")}`;
        }
    } else {
        // Fast: dimmed gray
        timingStr = `${chalk.gray.bold(msPerFile)}${chalk.dim.italic.gray("ms")}`;
        if (options.metrics) {
            timingStr += ` | ${chalk.gray.bold(microSecPerLine)}${chalk.dim.italic.gray("μs/line")}`;
        }
    }

    return timingStr;
}
