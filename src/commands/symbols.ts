import type { AsOption } from "~/cli";
import type { DependencyNode, SymbolMeta } from "~/types";
import chalk from "chalk";
import { asSymbolMeta, getDependencyGraph, projectUsing } from "~/ast";
import { symbolsJson, symbolsScreen } from "~/report";
import { msg } from "~/utils";

export const MAX_SYMBOLS = 10;

// Export these for testing
export interface FilterOptions {
    filters: string[];           // positional arguments
    caseSensitive: boolean;      // --case-sensitive flag
    runtime?: boolean;           // --runtime flag
    types?: boolean;             // --types flag
}

/**
 * Check if a symbol name matches a filter string
 * @param symbolName - The name of the symbol to check
 * @param filter - The filter string (may be quoted for exact match)
 * @param caseSensitive - Whether to use case-sensitive matching for unquoted filters
 * @returns true if the symbol matches the filter
 */
export function matchesFilter(symbolName: string, filter: string, caseSensitive: boolean): boolean {
    // Check if filter is quoted (literal match)
    const isQuoted = (filter.startsWith('"') && filter.endsWith('"')) ||
                     (filter.startsWith("'") && filter.endsWith("'"));

    if (isQuoted) {
        // Literal case-sensitive exact match
        const literalFilter = filter.slice(1, -1); // Remove quotes
        return symbolName === literalFilter;
    } else {
        // Substring match
        if (caseSensitive) {
            return symbolName.includes(filter);
        } else {
            return symbolName.toLowerCase().includes(filter.toLowerCase());
        }
    }
}

/**
 * Filter symbols based on provided filter options
 */
export function filterSymbols(
    symbols: SymbolMeta[],
    options: FilterOptions
): SymbolMeta[] {
    let filtered = symbols;

    // Apply runtime/types filters first
    if (options.runtime && options.types) {
        // Both flags set - show warning and ignore both
        console.warn("Cannot use both --runtime and --types flags; showing all symbols");
    } else if (options.runtime) {
        filtered = filtered.filter(s =>
            s.isFunction || s.isVariable ||
            s.kind === 'class' || s.kind === 'function' || s.kind === 'const-function'
        );
    } else if (options.types) {
        filtered = filtered.filter(s => s.isTypeSymbol);
    }

    // Apply name filters if provided
    if (options.filters.length === 0) {
        return filtered; // Return all filtered symbols
    }

    return filtered.filter(symbol =>
        options.filters.some(filter => matchesFilter(symbol.name, filter, options.caseSensitive))
    );
}

/**
 * Convert DependencyNode to SymbolMeta with dependency information
 */
function convertDependencyNodeToSymbolMeta(
    node: DependencyNode,
    allNodes: Map<string, DependencyNode>
): SymbolMeta & { deps?: SymbolMeta[] } {
    // Convert dependencies to SymbolMeta format for reporting
    const deps: SymbolMeta[] = node.dependencies
        .map(depFQN => allNodes.get(depFQN))
        .filter((depNode): depNode is DependencyNode => !!depNode)
        .map(depNode => depNode.meta);

    return {
        ...node.meta,
        deps: deps.length > 0 ? deps : undefined
    };
}

/**
 * Get symbols using the dependency graph system, filtered to exported symbols
 */
function getSymbolsFromDependencyGraph(): SymbolMeta[] {
    try {
    // Get the dependency graph (uses cache if available)
        const dependencyGraph = getDependencyGraph({ useCache: true });

        // Get all exported symbols (both type and runtime)
        const exportedSymbols: SymbolMeta[] = [];

        for (const [_fqn, node] of dependencyGraph.nodes) {
            const { meta } = node;

            // Filter to exported symbols (scope === "module")
            // Note: We return both type and runtime symbols here, filtering by type happens later
            if (meta.scope === "module") {
                const symbolWithDeps = convertDependencyNodeToSymbolMeta(node, dependencyGraph.nodes);
                exportedSymbols.push(symbolWithDeps);
            }
        }

        return exportedSymbols.sort((a, b) => a.name.localeCompare(b.name));
    }
    catch (error) {
        console.warn("Failed to get dependency graph, falling back to direct analysis:", error);
        // Fallback to legacy behavior if dependency graph fails
        return [];
    }
}

/**
 * Legacy function - kept for fallback purposes
 */
function getDirectSymbolAnalysis(project: any): SymbolMeta[] {
    const symbols: SymbolMeta[] = [];
    const seenSymbols = new Set<string>();

    // Get all source files
    const sourceFiles = project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
    // Get exported symbols from each file
        const exportedSymbols = sourceFile.getExportedDeclarations();

        for (const [, declarations] of exportedSymbols) {
            for (const declaration of declarations) {
                const symbol = declaration.getSymbol?.();
                if (symbol && !seenSymbols.has(symbol.getName())) {
                    try {
                        seenSymbols.add(symbol.getName());
                        const meta = asSymbolMeta(symbol);
                        if (meta && meta.isTypeSymbol) {
                            symbols.push(meta);
                        }
                    }
                    catch (error) {
                        // Skip symbols that can't be analyzed
                        console.debug(`Skipping symbol ${symbol.getName()}: ${error}`);
                    }
                }
            }
        }
    }

    return symbols;
}

/** COMMAND */
export async function symbols_command(opt: AsOption<"symbols">, positionalArgs: string[] = []) {
    const start = performance.now();

    if (positionalArgs.length > 0) {
        msg(opt)(chalk.bold(`Symbols (filter: ${chalk.dim(positionalArgs.join(", "))})`));
        msg(opt)(`----------------------------------------------------------`);
    }
    else {
        msg(opt)(chalk.bold(`Symbols`));
        msg(opt)(`----------------------------------------------------------`);
    }

    const [project, configFile] = projectUsing(opt.config
        ? [opt.config]
        : [`src/tsconfig.json`, `tsconfig.json`]
    );

    const sourceFiles = project.getSourceFiles();
    msg(opt)(`- project found ${chalk.bold(sourceFiles.length)} source files [${chalk.dim(configFile)}]`);

    // Use optimized dependency graph system
    msg(opt)(`- analyzing exported symbols with optimized dependency analysis...`);
    let allSymbols = getSymbolsFromDependencyGraph();

    // Fallback to direct analysis if dependency graph fails
    if (allSymbols.length === 0) {
        msg(opt)(`- falling back to direct symbol analysis...`);
        allSymbols = getDirectSymbolAnalysis(project);
    }

    msg(opt)(`- found ${chalk.bold(allSymbols.length)} exported symbols`);

    // Filter symbols based on user input
    const symbols = filterSymbols(allSymbols, {
        filters: positionalArgs,
        caseSensitive: opt['case-sensitive'] || false,
        runtime: opt.runtime,
        types: opt.types
    });

    if (positionalArgs.length === 0 && !opt.quiet) {
        msg(opt)(`- showing all symbols (use filter arguments to narrow results)`);
    }
    else if (positionalArgs.length > 0) {
        msg(opt)(`- filtered to ${chalk.bold(symbols.length)} symbols matching: ${chalk.dim(positionalArgs.join(", "))}`);
    }

    // Output results
    if (opt.json) {
        console.log(symbolsJson(symbols));
    }
    else {
        symbolsScreen(symbols);
    }

    const duration = performance.now() - start;
    if (!opt.quiet) {
        msg(opt)("");
        msg(opt)(`- command took ${chalk.bold(duration)}${chalk.italic.dim("ms")}`);
    }
}
