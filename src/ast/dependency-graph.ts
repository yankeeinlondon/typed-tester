import type { Project } from "ts-morph";
import type {
    DependencyGraph,
    DependencyNode,
    DependencyTraversal
} from "~/types/dependency";
import type { FQN } from "~/types/symbol-ast-types";
import { getAllSymbolObjectsInProject } from "./project";
import {
    buildDependencyMap,
    calculateDependencyDepth,
    detectCycles
} from "./symbols";

/**
 * **buildDependencyGraph**
 *
 * Builds a complete dependency graph for a TypeScript project.
 * This analyzes all symbols and their dependencies to create a comprehensive graph.
 */
export function buildDependencyGraph(project: Project): DependencyGraph {
    const startTime = Date.now();

    // Get all symbols in the project
    const symbols = getAllSymbolObjectsInProject(project);
    console.log(`Analyzing ${symbols.length} symbols for dependency graph...`);

    // Build the dependency map
    const nodes = buildDependencyMap(symbols);

    // Detect circular dependencies
    const circularDependencies = detectCycles(nodes);

    // Calculate statistics
    const stats = calculateGraphStatistics(nodes, circularDependencies);

    // Generate project hash for cache invalidation
    const projectHash = generateProjectHash(project);

    const graph: DependencyGraph = {
        nodes,
        projectHash,
        lastUpdated: Date.now(),
        stats
    };

    const duration = Date.now() - startTime;
    console.log(`Dependency graph built in ${duration}ms (${stats.totalSymbols} symbols, ${stats.totalDependencies} dependencies, ${circularDependencies.length} cycles)`);

    return graph;
}

/**
 * **updateDependencyGraph**
 *
 * Incrementally updates the dependency graph when symbols change.
 * This is more efficient than rebuilding the entire graph.
 */
export function updateDependencyGraph(
    graph: DependencyGraph,
    changedSymbolFQNs: FQN[],
    project: Project
): DependencyGraph {
    const updatedNodes = new Map(graph.nodes);

    // Get fresh symbol data for changed symbols
    const allSymbols = getAllSymbolObjectsInProject(project);
    const symbolMap = new Map(allSymbols.map((s) => {
        const node = buildDependencyMap([s]).values().next().value as DependencyNode;
        return [node.symbol, s];
    }));

    // Update changed symbols and their dependents
    const symbolsToUpdate = new Set<FQN>(changedSymbolFQNs);

    // Add symbols that depend on changed symbols
    for (const fqn of changedSymbolFQNs) {
        const node = updatedNodes.get(fqn);
        if (node) {
            for (const dependent of node.dependents) {
                symbolsToUpdate.add(dependent);
            }
        }
    }

    // Rebuild nodes for symbols that need updating
    for (const fqn of symbolsToUpdate) {
        const symbol = symbolMap.get(fqn);
        if (symbol) {
            const newNode = buildDependencyMap([symbol]).get(fqn);
            if (newNode) {
                updatedNodes.set(fqn, newNode);
            }
        }
        else {
            // Symbol was deleted
            updatedNodes.delete(fqn);
        }
    }

    // Recalculate statistics
    const circularDependencies = detectCycles(updatedNodes);
    const stats = calculateGraphStatistics(updatedNodes, circularDependencies);

    return {
        ...graph,
        nodes: updatedNodes,
        lastUpdated: Date.now(),
        stats
    };
}

/**
 * **traverseDependencies**
 *
 * Traverses the dependency graph starting from a root symbol.
 * Returns a complete traversal including paths and cycle detection.
 */
export function traverseDependencies(
    graph: DependencyGraph,
    rootFQN: FQN,
    maxDepth: number = 50
): DependencyTraversal {
    const dependencies: Array<{ symbol: FQN; depth: number; path: FQN[] }> = [];
    const cycles: FQN[][] = [];
    const visited = new Set<FQN>();
    const recursionStack = new Set<FQN>();
    let maxFoundDepth = 0;

    const traverse = (fqn: FQN, depth: number, path: FQN[]): void => {
    // Check for cycles
        if (recursionStack.has(fqn)) {
            const cycleStartIndex = path.indexOf(fqn);
            if (cycleStartIndex !== -1) {
                const cycle = [...path.slice(cycleStartIndex), fqn];
                if (!hasCycle(cycles, cycle)) {
                    cycles.push(cycle);
                }
            }
            return;
        }

        // Check depth limit
        if (depth > maxDepth) {
            return;
        }

        // Track visited nodes to avoid infinite loops
        if (visited.has(fqn)) {
            return;
        }

        visited.add(fqn);
        recursionStack.add(fqn);
        maxFoundDepth = Math.max(maxFoundDepth, depth);

        const node = graph.nodes.get(fqn);
        if (!node) {
            recursionStack.delete(fqn);
            return;
        }

        // Add to dependencies list (excluding root)
        if (depth > 0) {
            dependencies.push({
                symbol: fqn,
                depth,
                path: [...path]
            });
        }

        // Traverse each dependency
        for (const depFQN of node.dependencies) {
            traverse(depFQN, depth + 1, [...path, fqn]);
        }

        recursionStack.delete(fqn);
    };

    traverse(rootFQN, 0, []);

    return {
        root: rootFQN,
        dependencies,
        cycles,
        maxDepth: maxFoundDepth
    };
}

/**
 * **findSymbolsByPattern**
 *
 * Finds symbols in the dependency graph that match a glob pattern.
 * Supports both name matching and FQN matching.
 */
export function findSymbolsByPattern(
    graph: DependencyGraph,
    pattern: string
): DependencyNode[] {
    const regex = globToRegex(pattern);
    const matches: DependencyNode[] = [];

    for (const node of graph.nodes.values()) {
    // Test against symbol name
        if (regex.test(node.meta.name)) {
            matches.push(node);
            continue;
        }

        // Test against file path
        if (regex.test(node.meta.filepath)) {
            matches.push(node);
            continue;
        }
    }

    return matches.sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}

/**
 * **getGraphStatistics**
 *
 * Returns comprehensive statistics about the dependency graph.
 */
export function getGraphStatistics(graph: DependencyGraph): {
    totalSymbols: number;
    totalDependencies: number;
    averageDependencies: number;
    mostDependentSymbol: { fqn: FQN; dependencyCount: number } | null;
    mostUsedSymbol: { fqn: FQN; usageCount: number } | null;
    circularDependencies: FQN[][];
    maxDepth: number;
} {
    let totalDependencies = 0;
    let mostDependentSymbol: { fqn: FQN; dependencyCount: number } | null = null;
    let mostUsedSymbol: { fqn: FQN; usageCount: number } | null = null;

    for (const node of graph.nodes.values()) {
        totalDependencies += node.dependencies.length;

        // Track most dependent symbol
        if (!mostDependentSymbol || node.dependencies.length > mostDependentSymbol.dependencyCount) {
            mostDependentSymbol = {
                fqn: node.symbol,
                dependencyCount: node.dependencies.length
            };
        }

        // Track most used symbol
        if (!mostUsedSymbol || node.dependents.length > mostUsedSymbol.usageCount) {
            mostUsedSymbol = {
                fqn: node.symbol,
                usageCount: node.dependents.length
            };
        }
    }

    return {
        totalSymbols: graph.nodes.size,
        totalDependencies,
        averageDependencies: graph.nodes.size > 0 ? totalDependencies / graph.nodes.size : 0,
        mostDependentSymbol,
        mostUsedSymbol,
        circularDependencies: graph.stats.circularDependencies,
        maxDepth: graph.stats.maxDepth
    };
}

/**
 * Calculate statistics for the dependency graph.
 */
function calculateGraphStatistics(
    nodes: Map<FQN, DependencyNode>,
    circularDependencies: FQN[][]
): DependencyGraph["stats"] {
    let totalDependencies = 0;
    let maxDepth = 0;

    for (const node of nodes.values()) {
        totalDependencies += node.dependencies.length;

        // Calculate max depth for this symbol
        const depth = calculateDependencyDepth(node.symbol, nodes);
        maxDepth = Math.max(maxDepth, depth);
    }

    return {
        totalSymbols: nodes.size,
        totalDependencies,
        circularDependencies,
        maxDepth
    };
}

/**
 * Generate a hash for the project to detect changes.
 */
function generateProjectHash(project: Project): number {
    // Simple hash based on number of source files and their paths
    const sourceFiles = project.getSourceFiles();
    let hash = sourceFiles.length;

    for (const file of sourceFiles.slice(0, 100)) { // Limit to first 100 files for performance
        const path = file.getFilePath();
        for (let i = 0; i < path.length; i++) {
            const char = path.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
    }

    return Math.abs(hash);
}

/**
 * Convert a glob pattern to a regular expression.
 */
function globToRegex(pattern: string): RegExp {
    // Escape special regex characters except * and ?
    const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".");

    return new RegExp(`^${escaped}$`, "i");
}

/**
 * Check if a cycle already exists in the cycles array.
 */
function hasCycle(cycles: FQN[][], newCycle: FQN[]): boolean {
    return cycles.some((existingCycle) => {
        if (existingCycle.length !== newCycle.length) {
            return false;
        }

        // Check if cycles are the same (considering rotation)
        for (let i = 0; i < existingCycle.length; i++) {
            let matches = true;
            for (let j = 0; j < existingCycle.length; j++) {
                if (existingCycle[j] !== newCycle[(i + j) % newCycle.length]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                return true;
            }
        }

        return false;
    });
}
