# Fix Deps Command - Finalized Implementation Plan

## Executive Summary

This plan provides a comprehensive strategy for implementing a robust `deps` command that shows symbol dependencies in the `typed-tester` CLI tool. The implementation leverages existing TypeScript AST analysis capabilities while introducing efficient caching and interactive features for both list and graph views of symbol dependencies.

## Architecture Analysis

### Current Codebase Assets

1. **Symbol Analysis Infrastructure** (`src/ast/symbols.ts`):
   - `asSymbolMeta()` - converts ts-morph Symbol to SymbolMeta
   - `getSymbolDependencies()` - extracts FQN dependencies for a symbol
   - `createFullyQualifiedNameForSymbol()` - creates unique identifiers
   - `getSymbolScope()` - determines local/module/external scope

2. **Type System** (`src/types/`):
   - `SymbolMeta` - comprehensive symbol metadata
   - `SymbolMetaWithDeps` - extends with bi-directional dependencies  
   - `Dependency` - basic dependency representation (needs enhancement)
   - `FQN` - fully qualified name type system

3. **CLI Infrastructure** (`src/cli/`, `src/commands/`):
   - Command-line argument parsing with `command-line-args`
   - Existing pattern for JSON/screen output
   - Global options (config, json, quiet, verbose, filter)

4. **Project Management** (`src/ast/project.ts`):
   - `projectUsing()` - loads TypeScript project
   - `getProjectTypeChecker()` - provides AST analysis
   - `getAllSymbolsInProject()` - symbol discovery

### Gaps Identified

1. **No Caching Infrastructure**: Current implementation has no caching system
2. **Limited Dependency Data**: Current `Dependency` type needs enhancement
3. **Missing Interactive Library**: `@yankeeinlondon/ask` not in dependencies
4. **No Graph Algorithms**: No dependency traversal or cycle detection
5. **Basic Deps Command**: Current implementation only lists symbols, no dependencies

## Enhanced Data Structures

### 1. Enhanced Dependency Type

```typescript
// src/types/dependency.ts
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
```

### 2. Caching Strategy

```typescript
// src/cache/dependency-cache.ts
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

export interface DependencyCacheManager {
  load(): DependencyCache | null;
  save(cache: DependencyCache): void;
  invalidate(): void;
  isValid(projectFiles: string[]): boolean;
  getSymbolDependencies(fqn: FQN): DependencyTraversal | null;
  updateSymbol(symbol: SymbolMeta): void;
}
```

## Implementation Phases

### Phase 1: Foundation Infrastructure (3-4 hours)

#### 1.1 Enhance Type Definitions

- **File**: `src/types/dependency.ts`
- **Tasks**:
  - Replace basic `Dependency` with enhanced `DependencyNode`
  - Add `DependencyGraph` and `DependencyTraversal` types
  - Add caching types (`DependencyCache`, etc.)

#### 1.2 Create Caching Infrastructure  

- **File**: `src/cache/dependency-cache.ts`
- **Tasks**:
  - Implement `DependencyCacheManager` interface
  - Add file-based cache storage (`.dependencies.json`)
  - Implement cache validation using file modification times
  - Add cache invalidation strategies

#### 1.3 Add Missing Dependencies

- **File**: `package.json`
- **Tasks**:
  - Add `@yankeeinlondon/ask` for interactive prompts
  - Verify all graph-related dependencies are available

### Phase 2: Core Dependency Analysis Engine (4-5 hours)

#### 2.1 Enhance Symbol Analysis

- **File**: `src/ast/symbols.ts`
- **Tasks**:
  - Extend `getSymbolDependencies()` to build full dependency nodes
  - Add reverse dependency calculation (`getDependents()`)
  - Implement cycle detection algorithm
  - Add dependency depth calculation

#### 2.2 Create Dependency Graph Builder

- **File**: `src/ast/dependency-graph.ts` (new)
- **Tasks**:
  - Implement `buildDependencyGraph(project: Project): DependencyGraph`
  - Add incremental graph updates
  - Implement graph traversal algorithms
  - Add circular dependency detection

#### 2.3 Integrate with Project Management

- **File**: `src/ast/project.ts`
- **Tasks**:
  - Add `getDependencyGraph()` function
  - Integrate with caching system
  - Add cache invalidation on project changes

### Phase 3: CLI Command Implementation (3-4 hours)

#### 3.1 Update CLI Options

- **File**: `src/cli/options.ts`
- **Tasks**:
  - Add `--graph` flag for detail view
  - Add `--clear-cache` option for cache management
  - Ensure `--filter` supports glob patterns
  - Add `--depth` option for graph traversal limits

#### 3.2 Implement Interactive Symbol Selection

- **File**: `src/utils/interactive.ts` (new)
- **Tasks**:
  - Implement symbol selection using `@yankeeinlondon/ask`
  - Add glob pattern filtering for symbol names
  - Create user-friendly symbol display names
  - Handle multi-symbol selection gracefully

#### 3.3 Enhance Deps Command

- **File**: `src/commands/deps.ts`
- **Tasks**:
  - Implement list view (default) showing first-order dependencies
  - Implement graph view with full dependency traversal
  - Add filtering by glob patterns
  - Integrate interactive symbol selection
  - Add cache management options

### Phase 4: Output and Reporting (2-3 hours)

#### 4.1 Create Dependency Formatters

- **File**: `src/report/deps-output.ts` (new)
- **Tasks**:
  - Implement list view formatter (tabular, concise)
  - Implement graph view formatter (hierarchical tree)
  - Add JSON output support
  - Add statistics reporting (cycles, depth, etc.)

#### 4.2 Enhance Output Utilities

- **File**: `src/report/index.ts`
- **Tasks**:
  - Export new dependency formatters
  - Add dependency-specific utility functions
  - Ensure consistent styling with existing commands

### Phase 5: Testing and Validation (2-3 hours)

#### 5.1 Unit Tests

- **File**: `tests/unit/deps-command.test.ts` (new)
- **Tasks**:
  - Test dependency graph building
  - Test cache management
  - Test filtering and selection logic
  - Test circular dependency detection

#### 5.2 Integration Tests  

- **File**: `tests/integration/fast/deps-enhanced.fast.test.ts` (new)
- **Tasks**:
  - Test full CLI workflow
  - Test interactive symbol selection
  - Test JSON output format
  - Test cache invalidation scenarios

## Detailed API Specifications

### Command Interface

```bash
# List view (default) - shows first-order dependencies
typed deps [patterns...] [--filter=glob] [--json] [--clear-cache]

# Examples:
typed deps                    # Show all exported symbols and their direct deps
typed deps "Get*"            # Show symbols matching glob pattern  
typed deps --filter="*Type*" # Filter symbols containing "Type"

# Graph view - shows full dependency tree for single symbol
typed deps [patterns...] --graph [--depth=N] [--json]

# Examples:
typed deps MyType --graph              # Full dependency tree for MyType
typed deps "Get*" --graph             # Interactive selection if multiple matches
typed deps GetUser --graph --depth=3  # Limit dependency depth to 3 levels
```

### JSON Output Format

#### List View JSON

```json
{
  "view": "list",
  "symbols": [
    {
      "symbol": "local::1234::GetUser",
      "name": "GetUser", 
      "kind": "type-defn",
      "dependencies": [
        "ext::5678::Promise", 
        "local::1234::User"
      ],
      "dependents": ["local::1234::UserService"],
      "meta": {
        "filepath": "src/types/user.ts",
        "startLine": 15,
        "endLine": 20
      }
    }
  ],
  "stats": {
    "totalSymbols": 45,
    "totalShown": 12,
    "averageDependencies": 2.3
  },
  "duration": 234.5
}
```

#### Graph View JSON

```json
{
  "view": "graph",
  "root": "local::1234::GetUser",
  "dependencies": [
    {
      "symbol": "ext::5678::Promise",
      "depth": 1,
      "path": ["local::1234::GetUser", "ext::5678::Promise"]
    },
    {
      "symbol": "local::1234::User", 
      "depth": 1,
      "path": ["local::1234::GetUser", "local::1234::User"]
    },
    {
      "symbol": "local::1234::UserProfile",
      "depth": 2, 
      "path": ["local::1234::GetUser", "local::1234::User", "local::1234::UserProfile"]
    }
  ],
  "cycles": [],
  "maxDepth": 3,
  "duration": 123.4
}
```

### Caching Strategy Details

1. **File-based Cache**: Store in `.dependencies.json` at project root
2. **Invalidation Triggers**:
   - TypeScript source file modifications (using file hashes)
   - `tsconfig.json` changes
   - Manual cache clearing (`--clear-cache`)
3. **Cache Structure**:
   - Symbol-level granularity for incremental updates
   - File modification time tracking
   - Project configuration fingerprinting
4. **Performance Targets**:
   - Initial analysis: <5s for medium projects (500+ symbols)
   - Cached access: <500ms for any operation
   - Incremental updates: <1s per modified file

## Integration Considerations

### 1. Existing Symbol System Integration

- Leverage `asSymbolMeta()` for consistent symbol processing
- Use existing `getSymbolDependencies()` as foundation
- Maintain compatibility with current FQN system

### 2. CLI Pattern Consistency

- Follow existing command option patterns
- Use consistent JSON output format structure
- Maintain same error handling and messaging patterns

### 3. Testing Integration

- Use existing test harness infrastructure
- Follow established test file organization
- Leverage existing fixture projects

### 4. Performance Considerations

- Build on ts-morph project caching
- Implement lazy loading for large dependency graphs
- Use streaming for large JSON outputs

## Risk Mitigation

### 1. Circular Dependency Handling

- **Risk**: Infinite loops during graph traversal
- **Mitigation**: Implement visited node tracking and cycle detection
- **Fallback**: Configurable depth limits and timeout mechanisms

### 2. Memory Usage with Large Projects

- **Risk**: Large dependency graphs consuming excessive memory
- **Mitigation**: Implement lazy loading and partial graph building
- **Fallback**: Streaming output and garbage collection hints

### 3. Cache Invalidation Complexity

- **Risk**: Stale cache data causing incorrect dependency information
- **Mitigation**: Conservative invalidation using file modification times
- **Fallback**: Manual cache clearing option and cache validation

### 4. Interactive Selection UX

- **Risk**: Poor user experience with many symbol matches
- **Mitigation**: Smart filtering, fuzzy matching, and pagination
- **Fallback**: Graceful degradation to list all matches

## Success Metrics

### Functional Requirements

- ✅ List view shows all exported symbols with direct dependencies
- ✅ Graph view shows complete dependency tree for selected symbol
- ✅ Interactive symbol selection works for ambiguous patterns
- ✅ JSON output provides machine-readable dependency data
- ✅ Caching improves subsequent command performance by 80%+

### Performance Requirements  

- ✅ Initial analysis completes in <5s for 500+ symbol projects
- ✅ Cached operations complete in <500ms
- ✅ Memory usage stays under 512MB for large projects
- ✅ Cache invalidation occurs correctly on file modifications

### Quality Requirements

- ✅ Circular dependencies are detected and reported
- ✅ External dependencies are properly categorized
- ✅ All dependency relationships are accurately captured
- ✅ Output formatting is consistent with other commands

## Implementation Timeline

- **Phase 1** (Foundation): 3-4 hours
- **Phase 2** (Core Engine): 4-5 hours  
- **Phase 3** (CLI Implementation): 3-4 hours
- **Phase 4** (Output/Reporting): 2-3 hours
- **Phase 5** (Testing): 2-3 hours

**Total Estimated Effort**: 14-19 hours

## Conclusion

This finalized implementation plan provides a robust foundation for building a comprehensive dependency analysis tool. The phased approach ensures systematic development while leveraging existing codebase assets. The enhanced caching strategy and interactive features will provide users with both quick overview capabilities and detailed dependency analysis as needed.

The plan addresses all requirements from the original draft while improving upon the caching strategy, defining precise data structures, and providing detailed specifications for both implementation and testing.
