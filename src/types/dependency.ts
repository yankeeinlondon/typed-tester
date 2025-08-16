import { FQN, SymbolKind, SymbolMeta, } from "./symbol-ast-types";

/**
 * **Dependency** (Legacy)
 * 
 * Represents a dependency between one symbol and another. 
 * 
 * - all symbols are _referenced_ using a `FQN` (fully qualified name)
 * - **Note:** This type is maintained for backward compatibility.
 *   Use `DependencyNode` for new dependency analysis features.
 */
export type Dependency = {
    /**
     * reference to the symbol being evaluated
     */
    symbol: FQN;

    /**
     * a hash of the symbols implementation so change can be detected
     */
    hash: number;

    /**
     * A reference to all the symbols this symbol is _dependent_ on
     */
    dependencies: FQN[];
}

/**
 * **DependencyNode**
 * 
 * Enhanced dependency representation with bi-directional relationships
 * and caching metadata for efficient dependency graph operations.
 */
export type DependencyNode = {
  /** The symbol this dependency represents */
  symbol: FQN;
  
  /** Hash of symbol implementation for change detection */
  hash: number;
  
  /** Direct dependencies (first-order only) */
  dependencies: FQN[];
  
  /** Symbols that depend on this symbol (reverse dependencies) */
  dependents: FQN[];
  
  /** Cached metadata for quick access */
  meta: SymbolMeta;
  
  /** Analysis timestamp for cache invalidation */
  analyzedAt: number;
}

/**
 * **DependencyGraph**
 * 
 * Complete dependency graph for a project with statistics and metadata.
 */
export type DependencyGraph = {
  /** All nodes in the dependency graph */
  nodes: Map<FQN, DependencyNode>;
  
  /** Project-level metadata */
  projectHash: number;
  lastUpdated: number;
  
  /** Statistics for reporting */
  stats: {
    totalSymbols: number;
    totalDependencies: number;
    circularDependencies: FQN[][];
    maxDepth: number;
  };
}

/**
 * **DependencyTraversal**
 * 
 * Result of traversing a dependency graph from a root symbol.
 */
export type DependencyTraversal = {
  /** Starting symbol for traversal */
  root: FQN;
  
  /** All nodes in dependency order */
  dependencies: Array<{
    symbol: FQN;
    depth: number;
    path: FQN[];
  }>;
  
  /** Circular dependencies found during traversal */
  cycles: FQN[][];
  
  /** Maximum dependency depth */
  maxDepth: number;
}

/**
 * **DependencyCache**
 * 
 * Cache structure for dependency graph persistence.
 */
export type DependencyCache = {
  /** Full dependency graph */
  graph: DependencyGraph;
  
  /** File modification hashes for invalidation */
  fileHashes: Map<string, number>;
  
  /** Project configuration hash */
  configHash: number;
  
  /** Cache metadata */
  metadata: {
    version: string;
    createdAt: number;
    lastAccessed: number;
  };
}

/**
 * **DependencyCacheManager**
 * 
 * Interface for managing dependency cache operations.
 */
export interface DependencyCacheManager {
  load(): DependencyCache | null;
  save(cache: DependencyCache): void;
  invalidate(): void;
  isValid(projectFiles: string[]): boolean;
  getSymbolDependencies(fqn: FQN): DependencyTraversal | null;
  updateSymbol(symbol: SymbolMeta): void;
}
