import type { TestBlock } from "~/types";
import type { AsOption } from "~/cli";
import chalk from "chalk";
import { getErrorDiagnostics, getWarningDiagnostics } from "~/ast";
import { fileLink, getTerminalTheme } from "~/utils";
import { showDiagnostic } from "./showDiagnostic";
import { showTest } from "./showTest";

export function showTestBlock(block: TestBlock, opt: AsOption<"test">, hasTypeTests = true) {
    const errors = getErrorDiagnostics(block.diagnostics, opt);
    const warnings = getWarningDiagnostics(block.diagnostics, opt);
    const hasError = errors.length > 0;
    const skip = block.skip || block.tests.filter(t => !t.skip).length === 0;

    if ((hasError || opt["show-passing"] || opt.verbose) && !opt.slow) {
        const theme = getTerminalTheme();
        const blockStatusIcon = skip
            ? chalk.dim(`⇣`)
            : hasError
                ? hasTypeTests
                    ? chalk.red.bold(`⤬`)
                    : theme === 'light'
                        ? chalk.hex('#CD5C5C').bold(`⤬`)
                        : chalk.hex('#8B0000').bold(`⤬`)
                : hasTypeTests
                    ? chalk.green.bold(`✓`)
                    : theme === 'light'
                        ? chalk.hex('#AAAAAA')(`✓`)
                        : chalk.hex('#555555')(`✓`);

        const testDisplay = `${block.tests.length} ${chalk.italic(block.tests.length === 1 ? "test" : "tests")}`;

        // Distinguish between failing tests and block-level type errors
        // Block errors are from describe block code (imports, setup, etc.)
        // Test errors are from individual test code
        const failingTests = block.tests.filter(t => getErrorDiagnostics(t.diagnostics, opt).length > 0).length;
        const blockTypeErrors = errors.length; // All errors from block.diagnostics

        const errDisplay = blockTypeErrors > 0 || failingTests > 0
            ? failingTests > 0 && blockTypeErrors > 0
                // Both failing tests and block-level type errors
                ? chalk.red(`${failingTests} ${chalk.italic(failingTests === 1 ? "failed" : "failures")}, ${blockTypeErrors} ${chalk.italic(blockTypeErrors === 1 ? "type error" : "type errors")}`)
                : failingTests > 0
                    // Only failing tests
                    ? chalk.red(`${failingTests} ${chalk.italic(failingTests === 1 ? "failed" : "failures")}`)
                    // Only block-level type errors
                    : chalk.red(`${blockTypeErrors} ${chalk.italic(blockTypeErrors === 1 ? "type error" : "type errors")}`)
            : chalk.green.dim.italic("no errors");

        const warningDisplay = warnings.length > 0
            ? warnings.length > 0
                ? `, ${chalk.yellowBright(`1 ${chalk.italic("warning")}`)}`
                : `, ${chalk.yellowBright(`${warnings.length} ${chalk.italic("warnings")}`)}`
            : "";

        const blockLine = `    [ ${blockStatusIcon} ] ${fileLink(block.description, block.filepath)} [${testDisplay}, ${errDisplay}${warningDisplay}]`;
        const skipBlockLine = `    [ ${blockStatusIcon} ] ${fileLink(block.description, block.filepath)}`;

        if (skip) {
            console.log(skipBlockLine);
        }
        else {
            console.log(blockLine);
        }

        if ((opt["show-passing"] || hasError) && !skip) {
            if (block.tests.length > 0 || opt["show-passing"]) {
                for (const t of block.tests) {
                    showTest(t, opt, hasTypeTests);
                }
            }
            else {
                for (const d of errors) {
                    showDiagnostic(d, block.filepath, opt);
                }
            }
        }
    }
}
