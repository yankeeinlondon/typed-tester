import type { TestBlock } from "~/types";
import type { AsOption } from "~/cli";
import chalk from "chalk";
import { getErrorDiagnostics, getWarningDiagnostics } from "~/ast";
import { fileLink, getTerminalTheme } from "~/utils";
import { showDiagnostic } from "./showDiagnostic";
import { showTest } from "./showTest";
import { calculateBlockMetrics } from "./calculateMetrics";
import { getIndentLevel } from "./hierarchy";

/**
 * Recursively check if a block should be considered "skipped"
 * A block is skipped if:
 * - It's explicitly marked as skip, OR
 * - It has no non-skipped tests AND no non-skipped nested blocks
 *
 * Special case: "Areas OUTSIDE of tests blocks" is never skipped if it has diagnostics
 */
function isBlockSkipped(block: TestBlock): boolean {
    // Special handling for "Areas OUTSIDE" block - never skip if it has diagnostics
    if (block.description === "Areas OUTSIDE of tests blocks" && block.diagnostics.length > 0) {
        return false;
    }

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

export function showTestBlock(
    block: TestBlock,
    opt: AsOption<"test">,
    hasTypeTests = true,
    depth = 0,
    isRedundant = false
) {
    const errors = getErrorDiagnostics(block.diagnostics, opt);
    const warnings = getWarningDiagnostics(block.diagnostics, opt);
    const hasError = errors.length > 0;
    const skip = isBlockSkipped(block);

    // Calculate indent level using hierarchy logic
    const indentLevel = getIndentLevel(depth, isRedundant);

    // If this is a redundant single describe, skip showing it but show its children
    if (isRedundant) {
        // Skip the block display itself, but show its tests directly
        if ((hasError || opt["show-passing"] || opt.verbose) && !opt.slow && !skip) {
            if (block.tests.length > 0 || opt["show-passing"]) {
                for (const t of block.tests) {
                    showTest(t, opt, hasTypeTests, indentLevel);
                }
            }
            else {
                for (const d of errors) {
                    // Diagnostics in redundant blocks are from tests, not outside
                    showDiagnostic(d, block.filepath, opt, false);
                }
            }

            // Recursively show nested blocks (should not exist for redundant blocks, but handle it)
            if (block.blocks && block.blocks.length > 0) {
                for (const nestedBlock of block.blocks) {
                    showTestBlock(nestedBlock, opt, hasTypeTests, depth + 1, false);
                }
            }
        }
        return;
    }

    if ((hasError || opt["show-passing"] || opt.verbose) && !opt.slow) {
        const theme = getTerminalTheme();

        // Special icon for "Areas OUTSIDE of tests blocks"
        // Type issues outside tests are WARNINGS (not errors), so use ⚠️
        const isAreasOutside = block.description === "Areas OUTSIDE of tests blocks";

        const blockStatusIcon = skip
            ? chalk.dim(`⇣`)
            : hasError
                ? isAreasOutside
                    // For "Areas OUTSIDE", type issues are warnings, not errors
                    // Use ⚠️ (warning icon), not ⤬ (test failure icon)
                    ? chalk.yellowBright(`⚠️`)
                    : hasTypeTests
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

        // Count total errors from BOTH sources:
        // 1. Errors in individual tests (failingTests)
        // 2. Errors at block level (from block.diagnostics)
        // For "Areas OUTSIDE", call them "warnings" not "errors"
        const testErrors = metrics.failingTests; // Errors in it() blocks
        const blockErrors = errors.length; // Errors at block level
        const totalErrors = testErrors + blockErrors;

        const errDisplay = totalErrors > 0
            ? isAreasOutside
                // For "Areas OUTSIDE", type issues are warnings, not errors
                ? chalk.yellowBright(`${totalErrors} ${chalk.italic(totalErrors === 1 ? "warning" : "warnings")}`)
                // For test blocks, failures are errors
                : chalk.red(`${totalErrors} ${chalk.italic(totalErrors === 1 ? "type error" : "type errors")}`)
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
                    showTest(t, opt, hasTypeTests, indentLevel);
                }
            }
            else {
                for (const d of errors) {
                    // Pass isOutsideTest=true for "Areas OUTSIDE" block
                    showDiagnostic(d, block.filepath, opt, isAreasOutside);
                }
            }

            // Recursively show nested blocks
            if (block.blocks && block.blocks.length > 0) {
                for (const nestedBlock of block.blocks) {
                    showTestBlock(nestedBlock, opt, hasTypeTests, depth + 1, false);
                }
            }
        }
    }
}
