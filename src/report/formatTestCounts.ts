import chalk from "chalk";
import type { TestFile } from "~/types";

/**
 * Formats the test count display with the new three-metric system:
 * - tests: number of it/test blocks
 * - typeTests: tests containing type assertions
 * - assertions: total type assertions
 */
export function formatTestCounts(testFile: TestFile, options: { verbose?: boolean; showPassing?: boolean }): string {
    const totalTests = testFile.blocks.flatMap(b => b.tests).length;
    const skippedTests = testFile.skippedTests;
    const activeTests = totalTests - skippedTests;

    const skippedMsg = skippedTests > 0
        ? `, ${chalk.yellow(skippedTests)} ${skippedTests === 1 ? "test" : "tests"} skipped`
        : "";

    // In non-verbose mode without show-passing, we show a compact format
    if (!options.verbose && !options.showPassing) {
        return chalk.dim(`${activeTests} tests, ${testFile.typeTests} type tests, ${testFile.assertions} assertions${skippedMsg}`);
    }

    // In verbose or show-passing mode, show full details
    return `${activeTests} tests, ${testFile.typeTests} type tests, ${testFile.assertions} assertions${skippedMsg}`;
}
