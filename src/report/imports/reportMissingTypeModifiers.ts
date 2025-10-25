import type { AnalysisResult } from "~/types/imports/AnalysisResult";
import type { MissingTypeModifier } from "~/types/imports/MissingTypeModifier";
import chalk from "chalk";
import { fileLink } from "~/utils/link";

export type ReportOptions = {
    quiet: boolean;
};

/**
 * **reportMissingTypeModifiers**
 *
 * Formats missing type modifier issues for display, grouped by file.
 *
 * These are imports that only import type symbols but don't use the `type`
 * modifier, which provides useful metadata to the type system.
 */
export function reportMissingTypeModifiers(
    result: AnalysisResult,
    options: ReportOptions
): string {
    const { missingTypeModifiers } = result;
    const { quiet } = options;

    // Handle empty results
    if (missingTypeModifiers.length === 0) {
        return quiet
            ? ""
            : chalk.green("\nNo missing type modifiers found.\n");
    }

    const lines: string[] = [];

    // Add heading in normal mode
    if (!quiet) {
        lines.push("");
        lines.push(chalk.bold.yellow("Missing Type Modifiers Found:"));
        lines.push(chalk.dim("(type-only imports without 'type' modifier)"));
        lines.push("");
    }

    // Group imports by file
    const byFile: Record<string, MissingTypeModifier[]> = {};
    for (const imp of missingTypeModifiers) {
        if (!byFile[imp.file]) {
            byFile[imp.file] = [];
        }
        byFile[imp.file].push(imp);
    }

    // Process each file
    for (const [filepath, imports] of Object.entries(byFile)) {
        // File header with OSC8 link (if file exists)
        try {
            const linkedPath = fileLink(filepath, filepath);
            lines.push(chalk.cyan.bold(linkedPath));
        }
        catch {
            // If file doesn't exist, just show the path without link
            lines.push(chalk.cyan.bold(filepath));
        }
        lines.push("");

        // Each import in this file
        for (const imp of imports) {
            // Line number
            lines.push(chalk.dim(`  Line ${imp.line}:`));

            // Source
            lines.push(chalk.dim(`  Source: `) + chalk.white(imp.source));

            // Import statement
            lines.push(chalk.dim(`  Import: `) + chalk.gray(imp.content));
            lines.push("");
        }
    }

    return lines.join("\n");
}
