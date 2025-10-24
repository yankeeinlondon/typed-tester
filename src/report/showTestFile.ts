import chalk from "chalk";
import { relative } from "pathe";
import type {
    TestFile
} from "~/types";
import type { AsOption } from "~/cli";
import {
    getDiagnosticsOutsideBlocks,
    getErrorDiagnostics,
    getProjectRoot,
    getWarningDiagnostics,
    isSlowTest,
    isVerySlowTest
} from "~/ast";
import { fileLink } from "~/utils";
import { formatTestCounts, formatTiming, prettyPath, showTestBlock } from "~/report";

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

    const hasErrors = opt["ignore-outside"]
        ? blockErrors.length > 0
        : (blockErrors.length + outsideErrors.length) > 0;

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

    const fileStatusIcon = test.skip
        ? chalk.dim(`⇣`)
        : hasErrors
            ? chalk.red.bold(`⤬`)
            : chalk.green.bold(`✓`);
    const file = relative(getProjectRoot(), test.filepath);

    // Use new formatters for test counts and timing
    const testCount = formatTestCounts(test, { verbose: opt.verbose, showPassing: opt["show-passing"] });
    const timing = formatTiming(test, { metrics: opt.metrics, verbose: opt.verbose });
    const perfCondition = isSlowTest(test) || isVerySlowTest(test);

    // FILE LINE
    if (!opt.slow || perfCondition) {
        if (!opt["only-errors"] || hasErrors) {
            // Build the file line content
            const fileLine = ` ${fileStatusIcon}  ${fileLink(prettyPath(file), test.filepath)} ${chalk.dim("(")}${testCount}${chalk.dim(")")} ${timing} ${warningMsg}`;

            // Apply dimming when file has zero type tests (Phase 5)
            const shouldDim = test.typeTests === 0;
            const displayLine = shouldDim ? chalk.dim(fileLine) : fileLine;

            console.log(displayLine);

            if (opt["show-symbols"]) {
                const symbols = test.importSymbols.filter(
                    s => !s.isExternalSource && s.as !== "cases" && s.symbol.kind === "type-defn"
                );
                console.log(`     ${symbols.map(i => chalk.reset.bgGray.whiteBright(i.as)).join(", ")} `);
            }
        }
    }

    if (
        (hasErrors || opt["show-passing"] || opt.verbose) && !test.skip
    ) {
        for (const block of test.blocks) {
            showTestBlock(block, opt);
        }
    }
}
