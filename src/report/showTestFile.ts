import chalk from "chalk";
import { relative } from "pathe";
import type {
    TestFile
} from "../types";
import type { AsOption } from "../cli";
import {
    getDiagnosticsOutsideBlocks,
    getErrorDiagnostics,
    getProjectRoot,
    getWarningDiagnostics,
    isSlowTest,
    isVerySlowTest
} from "../ast";
import { fileLink, getTerminalTheme } from "../utils";
import { formatTestCounts, formatTiming, prettyPath, showTestBlock } from "./";
import { shouldShowDescribeLevel } from "./hierarchy";

export function showTestFile(test: TestFile, opt: AsOption<"test">) {
    /**
     * errors contained in test blocks
     */
    const blockErrors = getErrorDiagnostics(
        [
            ...test.blocks.flatMap(b => b.diagnostics)
        ],
        opt
    );
    /**
     * warnings contained in test blocks
     */
    const blockWarnings = getWarningDiagnostics(
        [
            ...test.blocks.flatMap(b => b.diagnostics)
        ],
        opt
    );
    /** errors outside test blocks */
    const outsideErrors = getErrorDiagnostics(getDiagnosticsOutsideBlocks(
        test.filepath,
        ...test.blocks
    ), opt);

    /** warnings outside test blocks */
    const outsideWarnings = getWarningDiagnostics(getDiagnosticsOutsideBlocks(
        test.filepath,
        ...test.blocks
    ), opt);

    const warningCount = opt["ignore-outside"]
        ? blockWarnings.length
        : blockWarnings.length + outsideWarnings.length;

    // Errors = test failures (errors IN test blocks)
    // Warnings = type issues ONLY outside test blocks
    const hasTestFailures = blockErrors.length > 0;
    const hasTypeIssuesOutside = !opt["ignore-outside"] && outsideErrors.length > 0;

    // File shows error icon only if it has actual test failures
    const hasErrors = hasTestFailures;
    // File shows warning state if it has type issues outside but NO test failures
    const hasWarningsOutside = hasTypeIssuesOutside && !hasTestFailures;

    const hasWarnings = warningCount > 0;
    const warningMsg = hasWarnings
        ? chalk.dim.italic(`with ${chalk.reset.bold.yellow(warningCount)} warnings`)
        : "";

    if (!opt["ignore-outside"] && outsideErrors.length > 0) {
        test.blocks = [{
            filepath: test.filepath,
            skip: false,
            description: "Areas OUTSIDE of tests blocks",
            tests: [],
            startLine: 0,
            endLine: 0,
            diagnostics: outsideErrors
        }, ...test.blocks];
    }

    // Determine icon styling based on state and type test presence
    const theme = getTerminalTheme();
    const hasTypeTests = test.typeTests > 0;

    const fileStatusIcon = test.skip
        ? chalk.dim(`⇣`)
        : hasErrors
            ? hasTypeTests
                // Has type tests and errors (test failures) - emphasize the error (bright red)
                ? chalk.red.bold(`⤬`)
                // No type tests but has errors - de-emphasize based on background
                : theme === "light"
                    ? chalk.hex("#CD5C5C").bold(`⤬`) // Light red for light backgrounds
                    : chalk.hex("#8B0000").bold(`⤬`) // Dark red for dark backgrounds
            : hasWarningsOutside
                // Has type issues outside tests (warnings, not errors) - show warning icon
                ? chalk.yellowBright(`⚠️`)
                : hasTypeTests
                    // Has type tests - emphasize
                    ? chalk.green.bold(`✓`)
                    // No type tests - de-emphasize based on background
                    : theme === "light"
                        ? chalk.hex("#AAAAAA")(`✓`) // Light gray for light backgrounds
                        : chalk.hex("#555555")(`✓`); // Dark gray for dark backgrounds
    const file = relative(getProjectRoot(), test.filepath);

    // Use new formatters for test counts and timing
    const testCount = formatTestCounts(test, opt);
    const timing = formatTiming(test, { metrics: opt.metrics, verbose: opt.verbose });
    const perfCondition = isSlowTest(test) || isVerySlowTest(test);

    // FILE LINE
    if (!opt.slow || perfCondition) {
        // Show file if: not only-errors mode, OR has errors/warnings
        if (!opt["only-errors"] || hasErrors || hasWarningsOutside) {
            // Build the file line content
            const fileLine = ` ${fileStatusIcon}  ${fileLink(prettyPath(file), test.filepath)} ${chalk.dim("(")}${testCount}${chalk.dim(")")} ${timing} ${warningMsg}`;

            console.log(fileLine);

            if (opt["show-symbols"]) {
                const symbols = test.importSymbols.filter(
                    s => !s.isExternalSource && s.as !== "cases" && s.symbol.kind === "type-defn"
                );
                console.log(`     ${symbols.map(i => chalk.reset.bgGray.whiteBright(i.as)).join(", ")} `);
            }
        }
    }

    // Show blocks if: has errors, has warnings outside, show-passing flag, or verbose
    if (
        (hasErrors || hasWarningsOutside || opt["show-passing"] || opt.verbose) && !test.skip
    ) {
        // Determine if we should show the describe level based on hierarchy rules
        const showDescribe = shouldShowDescribeLevel(test);
        const topLevelBlocks = test.blocks.length;

        for (const block of test.blocks) {
            // Check if this is a redundant single describe
            const hasNestedBlocks = Boolean(block.blocks && block.blocks.length > 0);
            const isRedundant = !showDescribe && topLevelBlocks === 1 && !hasNestedBlocks;

            showTestBlock(block, opt, hasTypeTests, 0, isRedundant);
        }
    }
}
