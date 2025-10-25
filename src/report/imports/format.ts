import type { ImportType } from "~/types/imports/ImportType";
import chalk from "chalk";

/**
 * **formatCategoryTable**
 *
 * Formats import category counts into a readable table.
 *
 * @param counts - Record of category names to count
 * @returns Formatted table string
 */
export function formatCategoryTable(counts: Record<string, number>): string {
    const entries = Object.entries(counts);

    if (entries.length === 0) {
        return chalk.dim("No imports found");
    }

    const lines: string[] = [];

    // Find the longest category name for alignment
    const maxNameLength = Math.max(...entries.map(([name]) => name.length));

    // Format each category with aligned count
    for (const [category, count] of entries) {
        const paddedCategory = category.padEnd(maxNameLength);
        lines.push(`  ${chalk.cyan(paddedCategory)}  ${chalk.bold(count.toString())}`);
    }

    return lines.join("\n");
}

/**
 * **extractSourceFromImport**
 *
 * Extracts the module specifier (source) from an import statement.
 *
 * @param content - The full import statement text
 * @returns The module specifier (e.g., "react" from "import { x } from 'react'")
 */
function extractSourceFromImport(content: string): string {
    // Match the from clause: from 'source' or from "source"
    const match = content.match(/from\s+['"]([^'"]+)['"]/);
    return match ? match[1] : "";
}

/**
 * **formatExternalDependencies**
 *
 * Formats external dependencies as a sorted, comma-separated list
 * with deduplication.
 *
 * @param externals - Array of external import objects
 * @returns Comma-separated list of unique package names (alphabetically sorted)
 */
export function formatExternalDependencies(externals: ImportType[]): string {
    if (externals.length === 0) {
        return "";
    }

    // Extract unique package names
    const uniquePackages = new Set(
        externals.map(imp => extractSourceFromImport(imp.content))
    );

    // Sort alphabetically
    const sorted = Array.from(uniquePackages).sort();

    // Format as CSV
    return sorted.join(", ");
}

/**
 * **formatCategoryDetails**
 *
 * Formats detailed import information for a specific category.
 *
 * @param categoryName - The name of the category
 * @param imports - Array of imports in this category
 * @returns Formatted detail string with file paths and sources
 */
export function formatCategoryDetails(categoryName: string, imports: ImportType[]): string {
    if (imports.length === 0) {
        return "";
    }

    const lines: string[] = [];

    lines.push(chalk.bold.cyan(`\n${categoryName}:`));

    // Group by source for cleaner output
    const bySource = new Map<string, ImportType[]>();
    for (const imp of imports) {
        const source = extractSourceFromImport(imp.content);
        if (!bySource.has(source)) {
            bySource.set(source, []);
        }
        bySource.get(source)!.push(imp);
    }

    // Display each source
    for (const [source, imps] of bySource) {
        lines.push(`  ${chalk.yellow(source)} ${chalk.dim(`(${imps.length} import${imps.length > 1 ? "s" : ""})`)}`);
    }

    return lines.join("\n");
}
