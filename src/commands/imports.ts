import type { AsOption } from "~/cli";
import type { AnalysisResult } from "~/types/imports";
import process from "node:process";
import chalk from "chalk";
import fg from "fast-glob";
import { normalize } from "pathe";
import { analyzeImports } from "~/analysis/import-analyzer";
import { projectUsing } from "~/ast";
import { msg, shout } from "~/utils";

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
        process.exit(0);
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
    const totalCombined = result.combinedImports.length;
    const totalMissing = result.missingTypeModifiers.length;

    if (!opt.quiet) {
        console.log(chalk.dim(`Total imports analyzed: ${totalImports}`));
        console.log(chalk.dim(`Files analyzed: ${result.files.length}`));
        console.log();
    }

    // Problematic imports section
    if (totalCombined > 0 || totalMissing > 0) {
        if (!opt.quiet) {
            console.log(chalk.bold.yellow("⚠️  Problematic Imports\n"));
        }

        if (totalCombined > 0) {
            console.log(chalk.yellow(`❌ ${totalCombined} combined import(s) found (runtime + type symbols mixed)`));
        }

        if (totalMissing > 0) {
            console.log(chalk.yellow(`❌ ${totalMissing} import(s) missing type modifier`));
        }

        console.log();
    }
    else {
        if (!opt.quiet) {
            console.log(chalk.green("✓ No problematic imports found\n"));
        }
    }

    // Categorization summary
    if (opt.verbose || opt.external || opt.deep) {
        displayCategorization(result, opt);
    }
}

/**
 * Display import categorization details (verbose mode)
 */
function displayCategorization(result: AnalysisResult, opt: AsOption<"imports">) {
    if (!opt.quiet) {
        console.log(chalk.bold.blue("📊 Import Categorization\n"));
    }

    const categories = result.categorized;

    // External imports
    if (opt.external || opt.verbose) {
        const externalCount = categories.external?.length ?? 0;
        console.log(chalk.bold(`External Dependencies: ${externalCount}`));

        if (externalCount > 0 && (opt.verbose || opt.external)) {
            const uniquePackages = new Set(
                categories.external!.map(imp => imp.from)
            );
            console.log(chalk.dim(`  Packages: ${Array.from(uniquePackages).join(", ")}`));
        }
        console.log();
    }

    // Deep path imports
    if (opt.deep || opt.verbose) {
        const parentDeep = categories["named-parent(deep)"]?.length ?? 0;
        const childDeep = categories["named-child(deep)"]?.length ?? 0;

        console.log(chalk.bold(`Deep Path Imports: ${parentDeep + childDeep}`));
        if (parentDeep > 0) {
            console.log(chalk.dim(`  Parent (deep): ${parentDeep}`));
        }
        if (childDeep > 0) {
            console.log(chalk.dim(`  Child (deep): ${childDeep}`));
        }
        console.log();
    }

    // Other categories (verbose only)
    if (opt.verbose && !opt.external && !opt.deep) {
        for (const [category, imports] of Object.entries(categories)) {
            if (category !== "external" && !category.includes("deep")) {
                console.log(chalk.dim(`${category}: ${imports?.length ?? 0}`));
            }
        }
        console.log();
    }
}
