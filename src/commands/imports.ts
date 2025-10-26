import type { AsOption } from "../cli";
import type { AnalysisResult } from "../types/imports";
import process from "node:process";
import chalk from "chalk";
import fg from "fast-glob";
import { normalize } from "pathe";
import { analyzeImports } from "../analysis/import-analyzer";
import { projectUsing } from "../ast";
import { msg, shout } from "../utils";
import { reportCombinedImports } from "../report/imports/reportCombinedImports";
import { reportMissingTypeModifiers } from "../report/imports/reportMissingTypeModifiers";
import { reportCategorization } from "../report/imports/categorization";

/**
 * **imports_command**
 *
 * CLI command handler for the `typed imports` command.
 *
 * This command analyzes TypeScript import statements across the codebase to:
 * - Detect combined imports (runtime + type symbols mixed)
 * - Detect missing type modifiers on type-only imports
 * - Categorize all imports by structure and location
 *
 * @param opt - Command options from CLI parsing
 * @param filters - Optional glob patterns to filter files (defaults to all source files)
 *
 * @example
 * ```bash
 * # Analyze all source files
 * typed imports
 *
 * # Analyze specific files
 * typed imports "src/ast/**\/*.ts"
 *
 * # Show verbose output for external dependencies
 * typed imports --verbose --external
 *
 * # Output as JSON
 * typed imports --json
 * ```
 */
export async function imports_command(opt: AsOption<"imports">, filters: string[] = []) {
    const start = performance.now();

    // Initialize TypeScript project
    const [project, configFile] = projectUsing(
        opt.config
            ? [opt.config]
            : [
                    `tsconfig.json`,
                    `src/tsconfig.json`,
                    `test/tsconfig.json`,
                    `tests/tsconfig.json`,
                ],
    );

    if (!opt.config) {
        shout(opt)(`- configuration for project found in ${chalk.blue(configFile)}`);
    }

    // Discover files to analyze
    let filePaths: string[];

    if (filters.length > 0) {
        // Use provided glob patterns
        shout(opt)(`- searching for files matching patterns: ${chalk.dim(filters.join(", "))}`);
        filePaths = await fg(filters, {
            cwd: process.cwd(),
            absolute: true,
            ignore: ["**/node_modules/**", "**/*.d.ts", "**/dist/**", "**/build/**"],
        });

        filePaths = filePaths.map(p => normalize(p));
    }
    else {
        // Default to all source files
        shout(opt)(`- no filters provided, analyzing all source files`);
        filePaths = await fg(["src/**/*.ts", "!**/*.d.ts"], {
            cwd: process.cwd(),
            absolute: true,
            ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
        });

        filePaths = filePaths.map(p => normalize(p));
    }

    shout(opt)(`- found ${chalk.bold(filePaths.length)} files to analyze`);

    if (filePaths.length === 0) {
        msg(chalk.yellow("⚠ No files found matching the specified patterns"));
        return; // Return instead of exit for testability
    }

    // Analyze imports
    const result: AnalysisResult = analyzeImports(filePaths, { project });

    const duration = performance.now() - start;
    shout(opt)(`- analysis completed in ${chalk.dim(`${duration.toFixed(0)}ms`)}`);

    // Output results
    if (opt.json) {
        // JSON output mode
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        // Screen output mode
        displayResults(result, opt);
    }
}

/**
 * Display analysis results to the terminal (non-JSON mode)
 */
function displayResults(result: AnalysisResult, opt: AsOption<"imports">) {
    // Header
    if (!opt.quiet) {
        console.log(chalk.bold.blue("\n📦 Import Analysis Results\n"));
    }

    // Summary statistics
    const totalImports = result.files.reduce((sum, f) => sum + f.imports.length, 0);

    if (!opt.quiet) {
        console.log(chalk.dim(`Total imports analyzed: ${totalImports}`));
        console.log(chalk.dim(`Files analyzed: ${result.files.length}`));
    }

    // Problematic imports: Combined imports
    const combinedReport = reportCombinedImports(result, { quiet: opt.quiet });
    if (combinedReport) {
        console.log(combinedReport);
    }

    // Problematic imports: Missing type modifiers
    const missingReport = reportMissingTypeModifiers(result, { quiet: opt.quiet });
    if (missingReport) {
        console.log(missingReport);
    }

    // Import categorization (ALWAYS shown - count table in normal mode, details in verbose)
    const categorizationReport = reportCategorization(result, {
        quiet: opt.quiet,
        verbose: opt.verbose,
        external: opt.external,
        deep: opt.deep,
    });
    console.log(categorizationReport);
}
