import type {
  DependencyCache,
  DependencyGraph,
  DependencyNode
} from '~/types/dependency';
import type { FQN, SymbolMeta } from '~/types/symbol-ast-types';
import { writeFileSync, readFileSync, existsSync, unlinkSync, statSync, utimesSync } from 'fs';
import { join } from 'path';

/**
 * **CacheTestUtils**
 *
 * Utilities for testing cache functionality including creation,
 * validation, invalidation, and performance measurement.
 *
 * @example
 * ```typescript
 * const utils = new CacheTestUtils('/tmp/test-cache');
 *
 * const cache = utils.createMockCache({
 *   symbols: [symbol1, symbol2]
 * });
 *
 * utils.saveCacheFile(cache);
 * utils.simulateFileChange('/src/index.ts');
 * const isValid = utils.validateCacheStructure(cache);
 * ```
 */
export class CacheTestUtils {
  private cacheDir: string;
  private cacheFilePath: string;

  constructor(cacheDir: string = process.cwd()) {
    this.cacheDir = cacheDir;
    this.cacheFilePath = join(cacheDir, '.dependencies.json');
  }

  /**
   * Create a mock dependency cache with default values
   *
   * @param options - Options for customizing the cache
   * @returns Mock DependencyCache
   */
  createMockCache(options: {
    symbols?: SymbolMeta[];
    version?: string;
    files?: string[];
  } = {}): DependencyCache {
    const symbols = options.symbols || [];
    const nodes = new Map<FQN, DependencyNode>();

    // Create dependency nodes from symbols
    for (const symbol of symbols) {
      nodes.set(symbol.fqn, {
        symbol: symbol.fqn,
        hash: this.hashString(symbol.name),
        dependencies: [],
        dependents: [],
        meta: symbol,
        analyzedAt: Date.now()
      });
    }

    const graph: DependencyGraph = {
      nodes,
      projectHash: this.hashString('test-project'),
      lastUpdated: Date.now(),
      stats: {
        totalSymbols: symbols.length,
        totalDependencies: 0,
        circularDependencies: [],
        maxDepth: 0
      }
    };

    const fileHashes = new Map<string, number>();
    const files = options.files || [];
    for (const file of files) {
      fileHashes.set(file, this.hashString(file));
    }

    return {
      graph,
      fileHashes,
      configHash: this.hashString('tsconfig'),
      metadata: {
        version: options.version || '0.1.0',
        createdAt: Date.now(),
        lastAccessed: Date.now()
      }
    };
  }

  /**
   * Create a cache with dependency relationships
   *
   * @param dependencies - Array of [dependent, dependency] FQN pairs
   * @param symbols - Symbol metadata
   * @returns Mock cache with dependencies
   */
  createCacheWithDependencies(
    dependencies: Array<[FQN, FQN]>,
    symbols: SymbolMeta[]
  ): DependencyCache {
    const cache = this.createMockCache({ symbols });

    // Add dependency relationships
    for (const [dependent, dependency] of dependencies) {
      const dependentNode = cache.graph.nodes.get(dependent);
      const dependencyNode = cache.graph.nodes.get(dependency);

      if (dependentNode && dependencyNode) {
        if (!dependentNode.dependencies.includes(dependency)) {
          dependentNode.dependencies.push(dependency);
        }
        if (!dependencyNode.dependents.includes(dependent)) {
          dependencyNode.dependents.push(dependent);
        }
      }
    }

    // Update statistics
    const totalDeps = Array.from(cache.graph.nodes.values())
      .reduce((sum, node) => sum + node.dependencies.length, 0);

    cache.graph.stats.totalDependencies = totalDeps;

    return cache;
  }

  /**
   * Create a cache with circular dependencies
   *
   * @param cycles - Array of FQN arrays representing cycles
   * @param symbols - Symbol metadata
   * @returns Mock cache with circular dependencies
   */
  createCacheWithCycles(
    cycles: FQN[][],
    symbols: SymbolMeta[]
  ): DependencyCache {
    const cache = this.createMockCache({ symbols });

    // Create circular dependencies
    for (const cycle of cycles) {
      for (let i = 0; i < cycle.length; i++) {
        const current = cycle[i];
        const next = cycle[(i + 1) % cycle.length];

        const currentNode = cache.graph.nodes.get(current);
        const nextNode = cache.graph.nodes.get(next);

        if (currentNode && nextNode) {
          if (!currentNode.dependencies.includes(next)) {
            currentNode.dependencies.push(next);
          }
          if (!nextNode.dependents.includes(current)) {
            nextNode.dependents.push(current);
          }
        }
      }
    }

    cache.graph.stats.circularDependencies = cycles;

    return cache;
  }

  /**
   * Save cache to file system
   *
   * @param cache - Cache to save
   * @param filepath - Optional custom file path
   */
  saveCacheFile(cache: DependencyCache, filepath?: string): void {
    const path = filepath || this.cacheFilePath;

    // Convert Maps to objects for JSON serialization
    const serializable = {
      graph: {
        nodes: Object.fromEntries(cache.graph.nodes),
        projectHash: cache.graph.projectHash,
        lastUpdated: cache.graph.lastUpdated,
        stats: {
          ...cache.graph.stats,
          circularDependencies: cache.graph.stats.circularDependencies
        }
      },
      fileHashes: Object.fromEntries(cache.fileHashes),
      configHash: cache.configHash,
      metadata: cache.metadata
    };

    writeFileSync(path, JSON.stringify(serializable, null, 2), 'utf-8');
  }

  /**
   * Load cache from file system
   *
   * @param filepath - Optional custom file path
   * @returns Loaded cache or null if doesn't exist
   */
  loadCacheFile(filepath?: string): DependencyCache | null {
    const path = filepath || this.cacheFilePath;

    if (!existsSync(path)) {
      return null;
    }

    const content = readFileSync(path, 'utf-8');
    const data = JSON.parse(content);

    // Convert objects back to Maps
    return {
      graph: {
        nodes: new Map(Object.entries(data.graph.nodes)),
        projectHash: data.graph.projectHash,
        lastUpdated: data.graph.lastUpdated,
        stats: data.graph.stats
      },
      fileHashes: new Map(Object.entries(data.fileHashes)),
      configHash: data.configHash,
      metadata: data.metadata
    };
  }

  /**
   * Simulate a file change by updating its modification time
   *
   * @param filepath - Relative file path
   * @param touchTime - Optional timestamp (defaults to now)
   */
  simulateFileChange(filepath: string, touchTime?: number): void {
    const fullPath = join(this.cacheDir, filepath);

    if (!existsSync(fullPath)) {
      // Create the file if it doesn't exist
      writeFileSync(fullPath, '// modified', 'utf-8');
    } else {
      // Touch the file to update modification time
      const time = touchTime ? new Date(touchTime) : new Date();
      utimesSync(fullPath, time, time);
    }
  }

  /**
   * Get file modification hash (simulates cache hash calculation)
   *
   * @param filepath - Absolute file path
   * @returns Hash value
   */
  getFileHash(filepath: string): number {
    if (!existsSync(filepath)) {
      return 0;
    }

    const stats = statSync(filepath);
    // Simple hash: mtimeMs + file size
    return Math.floor(stats.mtimeMs + stats.size);
  }

  /**
   * Validate cache structure
   *
   * @param cache - Cache to validate
   * @returns True if cache is valid
   */
  validateCacheStructure(cache: DependencyCache): boolean {
    // Check required fields exist
    if (!cache.graph || !cache.fileHashes || !cache.metadata) {
      return false;
    }

    // Check graph has nodes
    if (!(cache.graph.nodes instanceof Map)) {
      return false;
    }

    // Check all nodes have required properties
    for (const [fqn, node] of cache.graph.nodes) {
      if (!node.symbol || !node.meta || !Array.isArray(node.dependencies)) {
        return false;
      }

      // Verify FQN matches
      if (node.symbol !== fqn) {
        return false;
      }

      // Verify all dependencies exist in graph
      for (const dep of node.dependencies) {
        if (!cache.graph.nodes.has(dep)) {
          return false;
        }
      }

      // Verify bidirectional relationships
      for (const dep of node.dependencies) {
        const depNode = cache.graph.nodes.get(dep);
        if (depNode && !depNode.dependents.includes(fqn)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Measure cache operation performance
   *
   * @param operation - Function to measure
   * @returns Performance metrics
   */
  measureCachePerformance(operation: () => void): {
    duration: number;
    memoryBefore: NodeJS.MemoryUsage;
    memoryAfter: NodeJS.MemoryUsage;
    memoryDelta: number;
  } {
    const memoryBefore = process.memoryUsage();
    const startTime = performance.now();

    operation();

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();

    return {
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      memoryDelta: memoryAfter.heapUsed - memoryBefore.heapUsed
    };
  }

  /**
   * Compare two caches for equality
   *
   * @param cache1 - First cache
   * @param cache2 - Second cache
   * @returns True if caches are equivalent
   */
  compareCaches(cache1: DependencyCache, cache2: DependencyCache): boolean {
    // Compare metadata
    if (cache1.metadata.version !== cache2.metadata.version) {
      return false;
    }

    // Compare number of nodes
    if (cache1.graph.nodes.size !== cache2.graph.nodes.size) {
      return false;
    }

    // Compare each node
    for (const [fqn, node1] of cache1.graph.nodes) {
      const node2 = cache2.graph.nodes.get(fqn);
      if (!node2) {
        return false;
      }

      if (node1.hash !== node2.hash) {
        return false;
      }

      if (node1.dependencies.length !== node2.dependencies.length) {
        return false;
      }

      // Check dependencies match (order-independent)
      const deps1 = new Set(node1.dependencies);
      const deps2 = new Set(node2.dependencies);
      if (deps1.size !== deps2.size) {
        return false;
      }
      for (const dep of deps1) {
        if (!deps2.has(dep)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Delete cache file
   */
  deleteCacheFile(filepath?: string): void {
    const path = filepath || this.cacheFilePath;
    if (existsSync(path)) {
      unlinkSync(path);
    }
  }

  /**
   * Check if cache file exists
   */
  cacheFileExists(filepath?: string): boolean {
    const path = filepath || this.cacheFilePath;
    return existsSync(path);
  }

  /**
   * Get cache file age in milliseconds
   */
  getCacheAge(filepath?: string): number | null {
    const path = filepath || this.cacheFilePath;
    if (!existsSync(path)) {
      return null;
    }

    const stats = statSync(path);
    return Date.now() - stats.mtimeMs;
  }

  /**
   * Simple string hash function (for testing)
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Create cache test utilities instance
 *
 * @param cacheDir - Directory for cache operations
 */
export function createCacheUtils(cacheDir?: string): CacheTestUtils {
  return new CacheTestUtils(cacheDir);
}

/**
 * Performance benchmarking utilities for cache operations
 */
export class CachePerformanceBenchmark {
  private results: Array<{
    name: string;
    duration: number;
    memory: number;
  }> = [];

  /**
   * Run a benchmark test
   *
   * @param name - Benchmark name
   * @param operation - Operation to benchmark
   * @param iterations - Number of iterations (default 1)
   */
  benchmark(name: string, operation: () => void, iterations: number = 1): void {
    const utils = new CacheTestUtils();
    let totalDuration = 0;
    let totalMemory = 0;

    for (let i = 0; i < iterations; i++) {
      const metrics = utils.measureCachePerformance(operation);
      totalDuration += metrics.duration;
      totalMemory += metrics.memoryDelta;
    }

    this.results.push({
      name,
      duration: totalDuration / iterations,
      memory: totalMemory / iterations
    });
  }

  /**
   * Get benchmark results
   */
  getResults(): Array<{ name: string; duration: number; memory: number }> {
    return this.results;
  }

  /**
   * Print benchmark results to console
   */
  printResults(): void {
    console.log('\n=== Cache Performance Benchmark Results ===\n');
    console.log('Operation'.padEnd(40), 'Duration (ms)'.padStart(15), 'Memory (MB)'.padStart(15));
    console.log('-'.repeat(70));

    for (const result of this.results) {
      const memoryMB = (result.memory / 1024 / 1024).toFixed(2);
      console.log(
        result.name.padEnd(40),
        result.duration.toFixed(2).padStart(15),
        memoryMB.padStart(15)
      );
    }

    console.log('\n');
  }

  /**
   * Reset benchmark results
   */
  reset(): void {
    this.results = [];
  }
}

/**
 * Create a performance benchmark instance
 */
export function createCacheBenchmark(): CachePerformanceBenchmark {
  return new CachePerformanceBenchmark();
}
