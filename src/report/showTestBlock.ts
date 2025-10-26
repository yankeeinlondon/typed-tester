import type { TestBlock } from "~/types";
import type { AsOption } from "~/cli";
import chalk from "chalk";
import { getErrorDiagnostics, getWarningDiagnostics } from "~/ast";
import { fileLink, getTerminalTheme } from "~/utils";
import { showDiagnostic } from "./showDiagnostic";
import { showTest } from "./showTest";
import { calculateBlockMetrics } from "./calculateMetrics";

/**
 * Recursively check if a block should be considered "skipped"
 * A block is skipped if:
 * - It's explicitly marked as skip, OR
 * - It has no non-skipped tests AND no non-skipped nested blocks
 */
function isBlockSkipped(block: TestBlock): boolean {
    if (block.skip) {
        return true;
    }

    const hasNonSkippedTests = block.tests.some(t => !t.skip);
    if (hasNonSkippedTests) {
        return false;
    }

    // Check if any nested blocks have non-skipped content
    if (block.blocks && block.blocks.length > 0) {
        return block.blocks.every(isBlockSkipped);
    }

    // No tests and no nested blocks = considered skipped
    return true;
}

export function showTestBlock(block: TestBlock, opt: AsOption<"test">, hasTypeTests = true, indentLevel = 1) {
    const errors = getErrorDiagnostics(block.diagnostics, opt);
    const warnings = getWarningDiagnostics(block.diagnostics, opt);
    const hasError = errors.length > 0;
    const skip = isBlockSkipped(block);

    if ((hasError || opt["show-passing"] || opt.verbose) && !opt.slow) {
        const theme = getTerminalTheme();
        const blockStatusIcon = skip
            ? chalk.dim(`⇣`)
            : hasError
                ? hasTypeTests
                    ? chalk.red.bold(`⤬`)
                    : theme === "light"
                        ? chalk.hex("#CD5C5C").bold(`⤬`)
                        : chalk.hex("#8B0000").bold(`⤬`)
                : hasTypeTests
                    ? chalk.green.bold(`✓`)
                    : theme === "light"
                        ? chalk.hex("#AAAAAA")(`✓`)
                        : chalk.hex("#555555")(`✓`);

        // Use unified metric calculator for consistency
        const metrics = calculateBlockMetrics(block, opt);

        const testDisplay = `${metrics.totalTests} ${chalk.italic(metrics.totalTests === 1 ? "test" : "tests")}`;

        // Display type metrics (new in Phase 3)
        const typeMetricsDisplay = metrics.typeTests > 0
            ? `, ${metrics.typeTests} ${chalk.italic(metrics.typeTests === 1 ? "type test" : "type tests")}, ${metrics.assertions} ${chalk.italic(metrics.assertions === 1 ? "assertion" : "assertions")}`
            : "";

        // Distinguish between failing tests and block-level type errors
        // Block errors are from describe block code (imports, setup, etc.)
        // Test errors are from individual test code
        const failingTests = metrics.failingTests;
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

        // Adjust indentation based on nesting level
        const indent = "    ".repeat(indentLevel);
        const blockLine = `${indent}[ ${blockStatusIcon} ] ${fileLink(block.description, block.filepath)} [${testDisplay}${typeMetricsDisplay}, ${errDisplay}${warningDisplay}]`;
        const skipBlockLine = `${indent}[ ${blockStatusIcon} ] ${fileLink(block.description, block.filepath)}`;

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

            // Recursively show nested blocks
            if (block.blocks && block.blocks.length > 0) {
                for (const nestedBlock of block.blocks) {
                    showTestBlock(nestedBlock, opt, hasTypeTests, indentLevel + 1);
                }
            }
        }
    }
}
