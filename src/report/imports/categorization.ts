import type { AnalysisResult } from "~/types/imports/AnalysisResult";
import chalk from "chalk";
import { formatCategoryTable, formatExternalDependencies, formatCategoryDetails } from "./format";

/**
 * **ReportOptions**
 *
 * Options for categorization reporting
 */
export type ReportOptions = {
    /** Suppress headings and decorative output */
    quiet: boolean;
    /** Show detailed information for all categories */
    verbose: boolean;
    /** Show detailed information for external dependencies only */
    external: boolean;
    /** Show detailed information for deep path imports only */
    deep: boolean;
};

/**
 * **reportCategorization**
 *
 * Formats import categorization data for display.
 *
 * Three modes:
 * 1. Normal: Count summaries for all categories
 * 2. Verbose: Count summaries + detailed lists for all categories
 * 3. Filtered: Count summaries + detailed lists for specific categories (--external, --deep)
 *
 * @param result - Analysis result containing categorized imports
 * @param options - Reporting options controlling output verbosity
 * @returns Formatted categorization report string
 */
export function reportCategorization(
    result: AnalysisResult,
    options: ReportOptions
): string {
    const { categorized } = result;
    const { quiet, verbose, external, deep } = options;

    const lines: string[] = [];

    // Check if there are any imports at all
    const totalImports = Object.values(categorized).reduce((sum, arr) => sum + arr.length, 0);

    if (totalImports === 0) {
        return quiet
            ? "No imports found"
            : chalk.dim("\nNo imports found\n");
    }

    // Header in normal mode
    if (!quiet) {
        lines.push("");
        lines.push(chalk.bold.blue("📊 Import Categorization"));
        lines.push("");
    }

    // Build category counts
    const counts: Record<string, number> = {};
    for (const [category, imports] of Object.entries(categorized)) {
        if (imports.length > 0) {
            counts[category] = imports.length;
        }
    }

    // Always show count table
    const table = formatCategoryTable(counts);
    lines.push(table);
    lines.push("");

    // Determine what to show in detail
    const showExternalDetails = verbose || external;
    const showDeepDetails = verbose || deep;
    const showAllDetails = verbose;

    // External dependencies detail
    if (showExternalDetails && categorized.external && categorized.external.length > 0) {
        lines.push(chalk.bold.cyan("External Dependencies:"));
        const csv = formatExternalDependencies(categorized.external);
        lines.push(chalk.dim(`  ${csv}`));
        lines.push("");
    }
    else if (external && (!categorized.external || categorized.external.length === 0)) {
        lines.push(chalk.dim("External: 0"));
        lines.push("");
    }

    // Deep path imports detail
    if (showDeepDetails) {
        const deepCategories = Object.keys(categorized).filter(cat => cat.toLowerCase().includes("deep"));
        const deepImports = deepCategories.flatMap(cat => categorized[cat] || []);

        if (deepImports.length > 0) {
            lines.push(chalk.bold.cyan("Deep Path Imports:"));
            for (const category of deepCategories) {
                if (categorized[category] && categorized[category].length > 0) {
                    const details = formatCategoryDetails(category, categorized[category]);
                    lines.push(details);
                }
            }
            lines.push("");
        }
        else if (deep) {
            lines.push(chalk.dim("Deep: 0"));
            lines.push("");
        }
    }

    // All other categories detail (verbose mode only)
    if (showAllDetails) {
        const processedCategories = new Set(["external"]);
        const deepCategories = Object.keys(categorized).filter(cat => cat.toLowerCase().includes("deep"));
        deepCategories.forEach(cat => processedCategories.add(cat));

        for (const [category, imports] of Object.entries(categorized)) {
            if (!processedCategories.has(category) && imports.length > 0) {
                const details = formatCategoryDetails(category, imports);
                lines.push(details);
            }
        }
    }

    return lines.join("\n");
}
