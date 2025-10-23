import type { AsOption } from "~/cli";
import type { DependencyGraph, DependencyNode } from "~/types";
import chalk from "chalk";
import {
    findSymbolsByPattern,
    getDependencyGraph,
    invalidateDependencyCache,
    projectUsing,
    traverseDependencies
} from "~/ast";
import { fileLink, handleSymbolSelection } from "~/utils";

/**
 * Calculate comprehensive statistics from the dependency graph
 */
function calculateComprehensiveStats(dependencyGraph: DependencyGraph) {
    const stats = {
        totalSymbols: dependencyGraph.nodes.size,
        byScope: {
            local: 0, // symbols defined in same file as dependents
            module: 0, // exported symbols from other files in project
            external: 0, // symbols from external packages
            graph: 0 // other graph dependencies
        },
        byKind: new Map<string, number>(),
        totalDependencies: 0,
        circularDependencies: dependencyGraph.stats.circularDependencies.length,
        maxDepth: dependencyGraph.stats.maxDepth
    };

    // Count symbols by scope and kind
    for (const node of dependencyGraph.nodes.values()) {
        const { scope, kind } = node.meta;

        // Count by scope
        if (scope in stats.byScope) {
            stats.byScope[scope as keyof typeof stats.byScope]++;
        }

        // Count by kind
        const currentKindCount = stats.byKind.get(kind) || 0;
        stats.byKind.set(kind, currentKindCount + 1);

        // Count total dependencies
        stats.totalDependencies += node.dependencies.length;
    }

    return stats;
}

export async function deps_command(opt: AsOption<"deps">) {
    const start = performance.now();

    // Handle cache clearing
    if (opt["clear-cache"]) {
        invalidateDependencyCache();
        if (!opt.quiet) {
            console.log(chalk.green("✓ Dependency cache cleared"));
        }
    }

    // Initialize project
    const [_project, _configFile] = projectUsing(opt.config
        ? [opt.config]
        : [`src/tsconfig.json`, `tsconfig.json`]
    );

    // Get dependency graph (will use cache if available)
    const dependencyGraph = getDependencyGraph({
        forceRebuild: opt["clear-cache"],
        useCache: true
    });

    // Extract patterns from command arguments
    const patterns: string[] = [];
    if (opt.filter && opt.filter.length > 0) {
        patterns.push(...opt.filter);
    }

    // Find symbols matching patterns
    let matchingSymbols: DependencyNode[] = [];
    if (patterns.length > 0) {
        for (const pattern of patterns) {
            const matches = findSymbolsByPattern(dependencyGraph, pattern);
            matchingSymbols.push(...matches);
        }
        // Remove duplicates
        const uniqueFQNs = new Set(matchingSymbols.map(s => s.symbol));
        matchingSymbols = Array.from(uniqueFQNs).map(fqn =>
            dependencyGraph.nodes.get(fqn)!
        ).filter(Boolean);
    }
    else {
    // No patterns, show all symbols
        matchingSymbols = Array.from(dependencyGraph.nodes.values());
    }

    // Handle symbol selection (interactive if needed)
    const selectedSymbols = await handleSymbolSelection(
        matchingSymbols,
        patterns,
        opt.graph
    );

    if (selectedSymbols.length === 0) {
        if (!opt.quiet) {
            console.log(chalk.yellow("No symbols selected or found."));
        }
        return;
    }

    const duration = performance.now() - start;

    // Calculate comprehensive statistics
    const comprehensiveStats = calculateComprehensiveStats(dependencyGraph);

    // Generate output based on mode
    if (opt.graph) {
        await generateGraphOutput(selectedSymbols[0], dependencyGraph, opt, duration, comprehensiveStats);
    }
    else {
        await generateListOutput(selectedSymbols, dependencyGraph, opt, duration, comprehensiveStats);
    }
}

/**
 * Generate output for graph view (single symbol with full dependency tree)
 */
async function generateGraphOutput(
    symbol: DependencyNode,
    dependencyGraph: any,
    opt: AsOption<"deps">,
    duration: number,
    comprehensiveStats: any
) {
    const traversal = traverseDependencies(
        dependencyGraph,
        symbol.symbol,
        opt.depth || 50
    );

    if (opt.json) {
        const jsonOutput = {
            view: "graph",
            root: symbol.symbol,
            rootMeta: {
                name: symbol.meta.name,
                kind: symbol.meta.kind,
                filepath: symbol.meta.filepath,
                startLine: symbol.meta.startLine
            },
            dependencies: traversal.dependencies.map(dep => ({
                symbol: dep.symbol,
                depth: dep.depth,
                path: dep.path,
                meta: dependencyGraph.nodes.get(dep.symbol)?.meta
            })),
            cycles: traversal.cycles,
            maxDepth: traversal.maxDepth,
            stats: {
                totalDependencies: traversal.dependencies.length,
                cyclesFound: traversal.cycles.length,
                projectStats: {
                    totalSymbols: comprehensiveStats.totalSymbols,
                    byScope: comprehensiveStats.byScope,
                    byKind: Object.fromEntries(comprehensiveStats.byKind),
                    totalProjectDependencies: comprehensiveStats.totalDependencies,
                    circularDependencies: comprehensiveStats.circularDependencies,
                    maxDepth: comprehensiveStats.maxDepth
                }
            },
            duration
        };
        console.log(JSON.stringify(jsonOutput, null, 2));
    }
    else {
    // Screen output for graph view
        if (!opt.quiet) {
            console.log(chalk.bold(`\nDependency tree for: ${symbol.meta.name} [${symbol.meta.kind}]`));
            const locationText = `${symbol.meta.filepath}:${symbol.meta.startLine}`;
            const locationLink = `${symbol.meta.filepath}:${symbol.meta.startLine}`;
            console.log(chalk.dim(`Location: ${fileLink(locationText, locationLink)}`));
            console.log(chalk.dim(`FQN: ${symbol.symbol}\n`));
        }

        if (traversal.dependencies.length === 0) {
            console.log(chalk.dim("  No dependencies found"));
        }
        else {
            printDependencyTree(traversal, dependencyGraph, opt.depth || 50);
        }

        // Show cycles if found
        if (traversal.cycles.length > 0) {
            console.log(chalk.red(`\n⚠️  Circular dependencies detected (${traversal.cycles.length}):`));
            for (const cycle of traversal.cycles) {
                const cycleNames = cycle.map((fqn) => {
                    const node = dependencyGraph.nodes.get(fqn);
                    return node ? node.meta.name : fqn;
                });
                console.log(chalk.red(`  ${cycleNames.join(" → ")}`));
            }
        }

        if (!opt.quiet) {
            console.log(chalk.bold(`\nDependency Analysis:`));
            console.log(chalk.dim(`Total dependencies for this symbol: ${traversal.dependencies.length}`));
            console.log(chalk.dim(`Maximum depth: ${traversal.maxDepth}`));

            console.log(chalk.bold(`\nProject Overview:`));
            console.log(chalk.dim(`Total symbols in project: ${comprehensiveStats.totalSymbols}`));
            console.log(chalk.dim(`  Local: ${comprehensiveStats.byScope.local}, Module: ${comprehensiveStats.byScope.module}, External: ${comprehensiveStats.byScope.external}`));
            console.log(chalk.dim(`Total project dependencies: ${comprehensiveStats.totalDependencies}`));
            if (comprehensiveStats.circularDependencies > 0) {
                console.log(chalk.red(`Project circular dependencies: ${comprehensiveStats.circularDependencies}`));
            }
            console.log(chalk.dim(`Analysis took ${duration.toFixed(1)}ms`));
        }
    }
}

/**
 * Generate output for list view (multiple symbols with first-order dependencies)
 */
async function generateListOutput(
    symbols: DependencyNode[],
    dependencyGraph: any,
    opt: AsOption<"deps">,
    duration: number,
    comprehensiveStats: any
) {
    if (opt.json) {
        const jsonOutput = {
            view: "list",
            symbols: symbols.map(symbol => ({
                symbol: symbol.symbol,
                name: symbol.meta.name,
                kind: symbol.meta.kind,
                dependencies: symbol.dependencies.map((depFQN) => {
                    const depNode = dependencyGraph.nodes.get(depFQN);
                    return {
                        fqn: depFQN,
                        name: depNode?.meta.name || depFQN
                    };
                }),
                dependents: symbol.dependents.map((depFQN) => {
                    const depNode = dependencyGraph.nodes.get(depFQN);
                    return {
                        fqn: depFQN,
                        name: depNode?.meta.name || depFQN
                    };
                }),
                meta: {
                    filepath: symbol.meta.filepath,
                    startLine: symbol.meta.startLine,
                    endLine: symbol.meta.endLine
                }
            })),
            stats: {
                totalSymbols: comprehensiveStats.totalSymbols,
                totalShown: symbols.length,
                byScope: comprehensiveStats.byScope,
                byKind: Object.fromEntries(comprehensiveStats.byKind),
                totalDependencies: comprehensiveStats.totalDependencies,
                circularDependencies: comprehensiveStats.circularDependencies,
                maxDepth: comprehensiveStats.maxDepth,
                averageDependencies: symbols.length > 0
                    ? symbols.reduce((sum, s) => sum + s.dependencies.length, 0) / symbols.length
                    : 0
            },
            duration
        };
        console.log(JSON.stringify(jsonOutput, null, 2));
    }
    else {
    // Screen output for list view
        if (!opt.quiet) {
            console.log(chalk.bold(`\nShowing ${symbols.length} symbols with their direct dependencies:\n`));
        }

        for (const symbol of symbols) {
            console.log(chalk.bold(`${symbol.meta.name} [${symbol.meta.kind}]`));
            const locationText = `${symbol.meta.filepath}:${symbol.meta.startLine}`;
            const locationLink = `${symbol.meta.filepath}:${symbol.meta.startLine}`;
            console.log(chalk.dim(`  ${fileLink(locationText, locationLink)}`));

            if (symbol.dependencies.length > 0) {
                console.log(`  Dependencies (${symbol.dependencies.length}):`);
                for (const depFQN of symbol.dependencies.slice(0, 10)) { // Limit to first 10
                    const depNode = dependencyGraph.nodes.get(depFQN);
                    const depName = depNode ? depNode.meta.name : depFQN;
                    const depKind = depNode ? depNode.meta.kind : "unknown";
                    console.log(chalk.dim(`    ${depName} [${depKind}]`));
                }
                if (symbol.dependencies.length > 10) {
                    console.log(chalk.dim(`    ... and ${symbol.dependencies.length - 10} more`));
                }
            }
            else {
                console.log(chalk.dim(`  No dependencies`));
            }

            if (symbol.dependents.length > 0) {
                console.log(`  Used by (${symbol.dependents.length}):`);
                for (const depFQN of symbol.dependents.slice(0, 5)) { // Limit to first 5
                    const depNode = dependencyGraph.nodes.get(depFQN);
                    const depName = depNode ? depNode.meta.name : depFQN;
                    console.log(chalk.dim(`    ${depName}`));
                }
                if (symbol.dependents.length > 5) {
                    console.log(chalk.dim(`    ... and ${symbol.dependents.length - 5} more`));
                }
            }

            console.log(); // Empty line between symbols
        }

        if (!opt.quiet) {
            const totalDeps = symbols.reduce((sum, s) => sum + s.dependencies.length, 0);
            const avgDeps = symbols.length > 0 ? (totalDeps / symbols.length).toFixed(1) : "0";

            console.log(chalk.bold(`\nProject Summary:`));
            console.log(chalk.dim(`Total symbols: ${comprehensiveStats.totalSymbols}`));
            console.log(chalk.dim(`  Local symbols: ${comprehensiveStats.byScope.local}`));
            console.log(chalk.dim(`  Module symbols: ${comprehensiveStats.byScope.module}`));
            console.log(chalk.dim(`  External symbols: ${comprehensiveStats.byScope.external}`));
            if (comprehensiveStats.byScope.graph > 0) {
                console.log(chalk.dim(`  Graph symbols: ${comprehensiveStats.byScope.graph}`));
            }
            console.log(chalk.dim(`Total dependencies: ${comprehensiveStats.totalDependencies}`));
            if (comprehensiveStats.circularDependencies > 0) {
                console.log(chalk.red(`Circular dependencies: ${comprehensiveStats.circularDependencies}`));
            }
            console.log(chalk.dim(`Maximum dependency depth: ${comprehensiveStats.maxDepth}`));

            console.log(chalk.bold(`\nFiltered Results:`));
            console.log(chalk.dim(`Showing ${symbols.length} symbols`));
            console.log(chalk.dim(`Average dependencies per shown symbol: ${avgDeps}`));
            console.log(chalk.dim(`Analysis took ${duration.toFixed(1)}ms`));
        }
    }
}

/**
 * Print dependency tree in a hierarchical format
 */
function printDependencyTree(
    traversal: any,
    dependencyGraph: any,
    maxDepth: number
) {
    const printed = new Set<string>();

    for (const dep of traversal.dependencies) {
        if (dep.depth > maxDepth)
            continue;

        const indent = "  ".repeat(dep.depth);
        const node = dependencyGraph.nodes.get(dep.symbol);
        const name = node ? node.meta.name : dep.symbol;
        const kind = node ? node.meta.kind : "unknown";
        const key = `${dep.depth}-${dep.symbol}`;

        if (!printed.has(key)) {
            console.log(`${indent}${name} [${kind}]`);
            printed.add(key);
        }
    }
}
