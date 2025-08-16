import type {
    DependencyCache,
    DependencyCacheManager,
    DependencyGraph,
    DependencyNode,
    DependencyTraversal
} from "~/types/dependency";
import type { FQN, SymbolMeta } from "~/types/symbol-ast-types";
import { existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * **FileDependencyCacheManager**
 *
 * File-based implementation of dependency cache management.
 * Stores cache in `.dependencies.json` at the project root.
 */
export class FileDependencyCacheManager implements DependencyCacheManager {
    private readonly cachePath: string;
    private readonly packageVersion: string;

    constructor(projectRoot: string = process.cwd(), packageVersion: string = "0.9.5") {
        this.cachePath = resolve(projectRoot, ".dependencies.json");
        this.packageVersion = packageVersion;
    }

    /**
     * Load the dependency cache from disk.
     * Returns null if cache doesn't exist or is invalid.
     */
    load(): DependencyCache | null {
        try {
            if (!existsSync(this.cachePath)) {
                return null;
            }

            const rawData = readFileSync(this.cachePath, "utf-8");
            const parsed = JSON.parse(rawData);

            // Validate cache structure
            if (!this.isValidCacheStructure(parsed)) {
                console.warn("Invalid cache structure detected, invalidating cache");
                this.invalidate();
                return null;
            }

            // Convert Maps from JSON serialization
            const cache: DependencyCache = {
                graph: {
                    nodes: new Map(parsed.graph.nodes),
                    projectHash: parsed.graph.projectHash,
                    lastUpdated: parsed.graph.lastUpdated,
                    stats: parsed.graph.stats
                },
                fileHashes: new Map(parsed.fileHashes),
                configHash: parsed.configHash,
                metadata: {
                    ...parsed.metadata,
                    lastAccessed: Date.now()
                }
            };

            // Check version compatibility
            if (cache.metadata.version !== this.packageVersion) {
                console.warn(`Cache version mismatch (${cache.metadata.version} vs ${this.packageVersion}), invalidating cache`);
                this.invalidate();
                return null;
            }

            return cache;
        }
        catch (error) {
            console.warn("Failed to load dependency cache:", error instanceof Error ? error.message : String(error));
            this.invalidate();
            return null;
        }
    }

    /**
     * Save the dependency cache to disk.
     */
    save(cache: DependencyCache): void {
        try {
            // Update metadata
            const updatedCache = {
                ...cache,
                metadata: {
                    ...cache.metadata,
                    lastAccessed: Date.now()
                }
            };

            // Convert Maps for JSON serialization
            const serializable = {
                graph: {
                    nodes: Array.from(updatedCache.graph.nodes.entries()),
                    projectHash: updatedCache.graph.projectHash,
                    lastUpdated: updatedCache.graph.lastUpdated,
                    stats: updatedCache.graph.stats
                },
                fileHashes: Array.from(updatedCache.fileHashes.entries()),
                configHash: updatedCache.configHash,
                metadata: updatedCache.metadata
            };

            writeFileSync(this.cachePath, JSON.stringify(serializable, null, 2), "utf-8");
        }
        catch (error) {
            console.warn("Failed to save dependency cache:", error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Remove the cache file from disk.
     */
    invalidate(): void {
        try {
            if (existsSync(this.cachePath)) {
                unlinkSync(this.cachePath);
            }
        }
        catch (error) {
            console.warn("Failed to invalidate cache:", error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Check if the cache is valid for the given project files.
     * Returns false if any files have been modified since cache was created.
     */
    isValid(projectFiles: string[]): boolean {
        const cache = this.load();
        if (!cache) {
            return false;
        }

        try {
            // Check if any tracked files have been modified
            for (const [filePath, cachedHash] of cache.fileHashes) {
                if (!existsSync(filePath)) {
                    return false; // File was deleted
                }

                const currentHash = this.getFileHash(filePath);
                if (currentHash !== cachedHash) {
                    return false; // File was modified
                }
            }

            // Check for new files that weren't in the cache
            for (const filePath of projectFiles) {
                if (!cache.fileHashes.has(filePath)) {
                    return false; // New file detected
                }
            }

            return true;
        }
        catch (error) {
            console.warn("Error validating cache:", error instanceof Error ? error.message : String(error));
            return false;
        }
    }

    /**
     * Get dependency traversal for a specific symbol.
     * Returns null if symbol not found in cache.
     */
    getSymbolDependencies(fqn: FQN): DependencyTraversal | null {
        const cache = this.load();
        if (!cache) {
            return null;
        }

        const node = cache.graph.nodes.get(fqn);
        if (!node) {
            return null;
        }

        return this.buildTraversal(fqn, cache.graph);
    }

    /**
     * Update a single symbol in the cache.
     * This is used for incremental cache updates.
     */
    updateSymbol(symbol: SymbolMeta): void {
        const cache = this.load();
        if (!cache) {
            return; // No cache to update
        }

        const node = cache.graph.nodes.get(symbol.fqn);
        if (node) {
            // Update existing node
            const updatedNode: DependencyNode = {
                ...node,
                meta: symbol,
                analyzedAt: Date.now()
            };
            cache.graph.nodes.set(symbol.fqn, updatedNode);

            // Update file hash if filepath is available
            if (symbol.filepath) {
                cache.fileHashes.set(symbol.filepath, this.getFileHash(symbol.filepath));
            }

            cache.graph.lastUpdated = Date.now();
            this.save(cache);
        }
    }

    /**
     * Build a dependency traversal starting from a root symbol.
     */
    private buildTraversal(root: FQN, graph: DependencyGraph): DependencyTraversal {
        const visited = new Set<FQN>();
        const dependencies: Array<{ symbol: FQN; depth: number; path: FQN[] }> = [];
        const cycles: FQN[][] = [];
        let maxDepth = 0;

        const traverse = (symbol: FQN, depth: number, path: FQN[]): void => {
            if (visited.has(symbol)) {
                // Check for cycle
                const cycleStartIndex = path.indexOf(symbol);
                if (cycleStartIndex !== -1) {
                    const cycle = [...path.slice(cycleStartIndex), symbol];
                    if (!this.hasCycle(cycles, cycle)) {
                        cycles.push(cycle);
                    }
                }
                return;
            }

            visited.add(symbol);
            maxDepth = Math.max(maxDepth, depth);

            const node = graph.nodes.get(symbol);
            if (!node) {
                return;
            }

            if (depth > 0) { // Don't include root in dependencies list
                dependencies.push({
                    symbol,
                    depth,
                    path: [...path]
                });
            }

            // Traverse dependencies
            for (const depSymbol of node.dependencies) {
                traverse(depSymbol, depth + 1, [...path, symbol]);
            }
        };

        traverse(root, 0, []);

        return {
            root,
            dependencies,
            cycles,
            maxDepth
        };
    }

    /**
     * Check if a cycle already exists in the cycles array.
     */
    private hasCycle(cycles: FQN[][], newCycle: FQN[]): boolean {
        return cycles.some(existingCycle =>
            existingCycle.length === newCycle.length
            && existingCycle.every((symbol, index) => symbol === newCycle[index])
        );
    }

    /**
     * Get a hash for a file based on its modification time and size.
     * This is a simple but effective way to detect file changes.
     */
    private getFileHash(filePath: string): number {
        try {
            const stats = statSync(filePath);
            // Combine mtime and size for a simple hash
            return stats.mtimeMs + stats.size;
        }
        catch {
            return 0; // File doesn't exist or can't be accessed
        }
    }

    /**
     * Validate that the parsed JSON has the expected cache structure.
     */
    private isValidCacheStructure(parsed: any): boolean {
        try {
            return (
                parsed
                && typeof parsed === "object"
                && parsed.graph
                && Array.isArray(parsed.graph.nodes)
                && typeof parsed.graph.projectHash === "number"
                && typeof parsed.graph.lastUpdated === "number"
                && parsed.graph.stats
                && Array.isArray(parsed.fileHashes)
                && typeof parsed.configHash === "number"
                && parsed.metadata
                && typeof parsed.metadata.version === "string"
                && typeof parsed.metadata.createdAt === "number"
            );
        }
        catch {
            return false;
        }
    }
}

/**
 * Create a dependency cache manager instance.
 * This is the primary export for use throughout the application.
 */
export function createDependencyCacheManager(
    projectRoot?: string,
    packageVersion?: string
): DependencyCacheManager {
    return new FileDependencyCacheManager(projectRoot, packageVersion);
}
