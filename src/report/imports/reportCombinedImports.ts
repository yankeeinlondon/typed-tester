import type { AnalysisResult } from "~/types/imports/AnalysisResult";
import type { CombinedImport } from "~/types/imports/CombinedImport";
import chalk from "chalk";
import { fileLink } from "~/utils/link";

export type ReportOptions = {
    quiet: boolean;
};

/**
 * **reportCombinedImports**
 *
 * Formats combined import issues for display, grouped by file.
 *
 * Combined imports are those that mix runtime and type symbols in a single
 * import statement, which is considered a code smell.
 */
export function reportCombinedImports(
    result: AnalysisResult,
    options: ReportOptions
): string {
    const { combinedImports } = result;
    const { quiet } = options;

    // Handle empty results
    if (combinedImports.length === 0) {
        return quiet
            ? ""
            : chalk.green("\nNo combined imports found.\n");
    }

    const lines: string[] = [];

    // Add heading in normal mode
    if (!quiet) {
        lines.push("");
        lines.push(chalk.bold.yellow("Combined Imports Found:"));
        lines.push(chalk.dim("(imports that mix runtime and type symbols)"));
        lines.push("");
    }

    // Group imports by file
    const byFile: Record<string, CombinedImport[]> = {};
    for (const imp of combinedImports) {
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

            // Type symbols
            lines.push(
                chalk.dim(`  Type symbols: `) +
                chalk.magenta(imp.typeSymbols.join(", "))
            );

            // Runtime symbols
            lines.push(
                chalk.dim(`  Runtime symbols: `) +
                chalk.green(imp.runtimeSymbols.join(", "))
            );

            // Import statement
            lines.push(chalk.dim(`  Import: `) + chalk.gray(imp.content));
            lines.push("");
        }
    }

    return lines.join("\n");
}
