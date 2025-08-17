import type { AsOption } from "~/cli";
import type { SymbolMeta } from "~/types";
import type { DependencyNode } from "~/types/dependency";
import chalk from "chalk";
import { asSymbolMeta, getDependencyGraph, projectUsing } from "~/ast";
import { symbolsJson, symbolsScreen } from "~/report";
import { msg } from "~/utils";

export const MAX_SYMBOLS = 10;

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
 * Get symbols using the dependency graph system, filtered to exported type symbols
 */
function getSymbolsFromDependencyGraph(): SymbolMeta[] {
    try {
    // Get the dependency graph (uses cache if available)
        const dependencyGraph = getDependencyGraph({ useCache: true });

        // Filter to only exported type symbols (matching legacy behavior)
        const exportedTypeSymbols: SymbolMeta[] = [];

        for (const [_fqn, node] of dependencyGraph.nodes) {
            const { meta } = node;

            // Filter to type symbols that are exported (scope === "module")
            if (meta.isTypeSymbol && meta.scope === "module") {
                const symbolWithDeps = convertDependencyNodeToSymbolMeta(node, dependencyGraph.nodes);
                exportedTypeSymbols.push(symbolWithDeps);
            }
        }

        return exportedTypeSymbols.sort((a, b) => a.name.localeCompare(b.name));
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

function filterSymbols(symbols: SymbolMeta[], filters: string[]): SymbolMeta[] {
    if (!filters || filters.length === 0) {
        return symbols.slice(0, MAX_SYMBOLS); // Show sample if no filter
    }

    return symbols.filter(symbol =>
        filters.some(filter =>
            symbol.name.toLowerCase().includes(filter.toLowerCase())
            || symbol.fqn.toLowerCase().includes(filter.toLowerCase())
        )
    );
}

/** COMMAND */
export async function symbols_command(opt: AsOption<"symbols">) {
    const start = performance.now();

    if (opt.filter) {
        msg(opt)(chalk.bold(`Symbols (filter: ${chalk.dim(opt.filter)})`));
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

    msg(opt)(`- found ${chalk.bold(allSymbols.length)} exported type symbols`);

    // Filter symbols based on user input
    const symbols = filterSymbols(allSymbols, opt.filter || []);

    if (opt?.filter?.length === 0 && !opt.quiet) {
        msg(opt)(`- showing sample of symbols (use --filter to narrow results)`);
    }
    else if (opt?.filter?.length > 0) {
        msg(opt)(`- filtered to ${chalk.bold(symbols.length)} symbols matching: ${chalk.dim(opt.filter.join(", "))}`);
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
