import chalk from "chalk";
import type { TestFile } from "~/types";
import type { AsOption } from "~/cli";
import { calculateFileMetrics } from "./calculateMetrics";

/**
 * Formats the test count display with the new three-metric system:
 * - tests: number of it/test blocks (recursively calculated)
 * - typeTests: tests containing type assertions
 * - assertions: total type assertions
 */
export function formatTestCounts(
    testFile: TestFile,
    options: { verbose?: boolean; showPassing?: boolean } & Partial<AsOption<"test">>
): string {
    // Use unified metric calculator for consistency across hierarchy levels
    const opt: AsOption<"test"> = {
        "ignore-outside": options["ignore-outside"] ?? false,
        "only-errors": options["only-errors"] ?? false,
        "show-passing": options.showPassing ?? false,
        "show-symbols": options["show-symbols"] ?? false,
        "slow": options.slow ?? false,
        "verbose": options.verbose ?? false,
        "metrics": options.metrics ?? false,
        "warn": options.warn ?? [],
        "command": "test",
        "_": []
    };

    const metrics = calculateFileMetrics(testFile, opt);
    const totalTests = metrics.totalTests;
    const skippedTests = metrics.skippedTests;
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
