# `deps` Command

The `deps` command provides comprehensive dependency analysis for TypeScript projects, showing how symbols depend on each other throughout your codebase. It supports both quick overview capabilities and detailed dependency tree analysis with intelligent caching for performance.

## Overview

The deps command analyzes TypeScript symbols and their relationships, offering two distinct views:

- **List View** (default): Shows first-order dependencies for multiple symbols
- **Graph View** (`--graph`): Shows complete dependency tree for a single symbol

## Quick Start

```bash
# Show all exported symbols with their direct dependencies
typed deps

# Show symbols matching a pattern
typed deps --filter="User*"

# Show full dependency tree for a specific symbol
typed deps UserService --graph

# Clear cache and rebuild dependency analysis
typed deps --clear-cache
```

## Command Syntax

```bash
typed deps [patterns...] [options]
```

### Patterns

Patterns are glob-style filters that match symbol names or file paths:

- `typed deps User*` - Symbols starting with "User"
- `typed deps --filter="*Service"` - Symbols ending with "Service" 
- `typed deps --filter="src/types/*"` - Symbols in specific paths

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--filter`, `-f` | Filter symbols by glob pattern(s) | - |
| `--graph` | Show full dependency tree (single symbol) | `false` |
| `--clear-cache` | Clear dependency cache and rebuild | `false` |
| `--depth N` | Maximum traversal depth for graph view | `50` |
| `--json` | Output in JSON format | `false` |
| `--quiet`, `-q` | Minimal output | `false` |
| `--verbose`, `-v` | Detailed analysis output | `false` |

## Views and Output Formats

### List View (Default)

Shows multiple symbols with their direct (first-order) dependencies and dependents.

**Screen Output:**

```txt
Showing 12 symbols with their direct dependencies:

UserService [class]
  src/services/user.ts:15
  Dependencies (3):
    User [type-defn]
    Repository [type-defn] 
    Logger [class]
  Used by (2):
    UserController
    AuthService

AuthService [class]
  src/services/auth.ts:8
  Dependencies (2):
    UserService [class]
    TokenManager [class]
  No dependents

Project Summary:
Total symbols: 209
  Local symbols: 45
  Module symbols: 66
  External symbols: 98
Total dependencies: 547
Maximum dependency depth: 8

Filtered Results:
Showing 12 symbols
Average dependencies per shown symbol: 2.3
Analysis took 156.8ms
```

**JSON Output:**

```json
{
  "view": "list",
  "symbols": [
    {
      "symbol": "module::1234::UserService",
      "name": "UserService",
      "kind": "class",
      "dependencies": [
        {"fqn": "module::5678::User", "name": "User"},
        {"fqn": "module::9012::Repository", "name": "Repository"}
      ],
      "dependents": [
        {"fqn": "module::3456::UserController", "name": "UserController"}
      ],
      "meta": {
        "filepath": "src/services/user.ts",
        "startLine": 15,
        "endLine": 45
      }
    }
  ],
  "stats": {
    "totalSymbols": 209,
    "totalShown": 12,
    "byScope": {
      "local": 45,
      "module": 66, 
      "external": 98,
      "graph": 0
    },
    "byKind": {
      "type-defn": 85,
      "class": 24,
      "function": 18,
      "interface": 12,
      "external-type": 70
    },
    "totalDependencies": 547,
    "circularDependencies": 2,
    "maxDepth": 8,
    "averageDependencies": 2.3
  },
  "duration": 145.7
}
```

### Graph View

Shows complete dependency tree for a single symbol with full traversal.

**Screen Output:**

```
Dependency tree for: UserService [class]
Location: src/services/user.ts:15
FQN: module::1234::UserService

  User [type-defn]
    UserProfile [type-defn]
      Address [type-defn]
      ContactInfo [type-defn]
  Repository [type-defn]
    DatabaseConnection [class]
  Logger [class]
    LogLevel [type-defn]

⚠️  Circular dependencies detected (1):
  UserService → AuthService → UserService

Dependency Analysis:
Total dependencies for this symbol: 7
Maximum depth: 3

Project Overview:
Total symbols in project: 209
  Local: 45, Module: 66, External: 98
Total project dependencies: 547
Analysis took 234.5ms
```

**JSON Output:**

```json
{
  "view": "graph",
  "root": "module::1234::UserService",
  "rootMeta": {
    "name": "UserService",
    "kind": "class",
    "filepath": "src/services/user.ts",
    "startLine": 15
  },
  "dependencies": [
    {
      "symbol": "module::5678::User",
      "depth": 1,
      "path": ["module::1234::UserService", "module::5678::User"],
      "meta": {...}
    }
  ],
  "cycles": [
    ["module::1234::UserService", "module::7890::AuthService"]
  ],
  "maxDepth": 3,
  "stats": {
    "totalDependencies": 7,
    "cyclesFound": 1,
    "projectStats": {
      "totalSymbols": 209,
      "byScope": {
        "local": 45,
        "module": 66,
        "external": 98,
        "graph": 0
      },
      "byKind": {
        "type-defn": 85,
        "class": 24,
        "function": 18,
        "interface": 12,
        "external-type": 70
      },
      "totalProjectDependencies": 547,
      "circularDependencies": 2,
      "maxDepth": 8
    }
  },
  "duration": 234.5
}
```

## Interactive Symbol Selection

When multiple symbols match your patterns, the tool provides interactive selection:

```bash
$ typed deps "Get*" --graph

Found 5 symbols matching "Get*":
? Which symbol do you want to analyze?
❯ GetUser [function] in src/api/user.ts:12 (3 dependencies)
  GetProfile [function] in src/api/profile.ts:8 (1 dependency)
  GetSettings [type-defn] in src/types/settings.ts:5 (2 dependencies)
  GetResponse [type-defn] in src/types/api.ts:15 (0 dependencies)
  GetHandler [class] in src/handlers/get.ts:20 (4 dependencies)
```

For list view with many matches:

```bash
Found 45 symbols matching "User*":
? Do you want to proceed with all 45 symbols or select specific ones?
❯ Proceed with all shown symbols
  Select specific symbols  
  Cancel and refine search pattern
```

## Caching System

The deps command implements a sophisticated multi-layer caching system for optimal performance.

### Cache Architecture

```txt
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Memory Cache  │───▶│  Disk Cache      │───▶│  Fresh Analysis │
│   (Runtime)     │    │  (.dependencies. │    │  (ts-morph AST) │
│                 │    │   json)          │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
       ▲                        ▲                        ▲
       │                        │                        │
   <500ms access          5s validation          2min+ build time
```

### Cache Storage Format

**File:** `.dependencies.json` (project root)

```json
{
  "graph": {
    "nodes": [
      ["module::1234::UserService", {
        "symbol": "module::1234::UserService",
        "hash": 1547892345,
        "dependencies": ["module::5678::User"],
        "dependents": ["module::3456::UserController"],
        "meta": {...},
        "analyzedAt": 1692123456789
      }]
    ],
    "projectHash": 987654321,
    "lastUpdated": 1692123456789,
    "stats": {
      "totalSymbols": 209,
      "totalDependencies": 2795,
      "circularDependencies": [],
      "maxDepth": 8
    }
  },
  "fileHashes": [
    ["src/services/user.ts", 1547892345],
    ["src/types/user.ts", 1547892346]
  ],
  "configHash": 123456789,
  "metadata": {
    "version": "0.9.5",
    "createdAt": 1692123456789,
    "lastAccessed": 1692123456789
  }
}
```

### Cache Invalidation Algorithm

The caching system uses a multi-factor invalidation strategy:

```typescript
function isCacheValid(cache: DependencyCache, projectFiles: string[]): boolean {
  // 1. Version compatibility check
  if (cache.metadata.version !== currentVersion) return false;
  
  // 2. File modification check
  for (const [filePath, cachedHash] of cache.fileHashes) {
    const currentHash = getFileModificationHash(filePath);
    if (currentHash !== cachedHash) return false;
  }
  
  // 3. New files check
  for (const filePath of projectFiles) {
    if (!cache.fileHashes.has(filePath)) return false;
  }
  
  // 4. Project configuration check  
  if (cache.configHash !== getCurrentConfigHash()) return false;
  
  return true;
}
```

**Hash Generation:**

- **File Hash**: `mtimeMs + fileSize` (detects content and timestamp changes)
- **Config Hash**: Based on tsconfig path and initialization time
- **Symbol Hash**: Based on symbol definition text (for change detection)

### Cache Performance Characteristics

| Operation | Cold (No Cache) | Warm (Valid Cache) | Invalid Cache |
|-----------|-----------------|-------------------|---------------|
| **Initial Load** | 2+ minutes | <500ms | 2+ minutes |
| **Incremental Update** | N/A | <1s per file | 2+ minutes |
| **Memory Usage** | 200-500MB | <50MB | 200-500MB |
| **Disk Usage** | N/A | 5-20MB | 5-20MB |

### Cache Management

```bash
# Clear all caches and rebuild
typed deps --clear-cache

# Check cache status (verbose mode)
typed deps --verbose

# Force fresh analysis without saving to cache  
typed deps --no-cache  # (planned feature)
```

**Automatic Cache Management:**

- Cache is validated every 5 seconds during runtime
- Invalid cache triggers automatic rebuild
- Memory cache cleared between CLI invocations
- Disk cache persists across sessions

## Symbol Analysis Deep Dive

### Symbol Classification

The dependency analysis categorizes TypeScript symbols into specific kinds:

| Symbol Kind | Description | Example |
|-------------|-------------|---------|
| `type-defn` | Type definitions, interfaces | `interface User`, `type Status` |
| `type-constraint` | Generic constraints | `T extends string` |
| `external-type` | Types from node_modules | `Promise<T>`, `Array<T>` |
| `function` | Function declarations | `function getUser()` |
| `const-function` | Arrow function variables | `const getUser = () => {}` |
| `class` | Class definitions | `class UserService` |
| `property` | Object/class properties | Properties within interfaces |
| `scalar` | Primitive values | `string`, `number`, `boolean` |
| `container` | Complex objects | Object types, arrays |

### Fully Qualified Names (FQN)

Each symbol receives a unique FQN for precise identification:

**Format:** `{scope}::{hash}::{name}`

- **Local Symbol**: `local::1234::HelperFunction` (file-scoped, not exported)
- **Module Symbol**: `module::5678::UserService` (exported from project)  
- **External Symbol**: `ext::9012::Promise` (from node_modules)

**Hash Generation:**

- **Local/Module**: Hash of symbol definition code
- **External**: Hash of source package name

### Dependency Detection Algorithm

```typescript
function getSymbolDependencies(symbol: Symbol): FQN[] {
  const dependencies: Set<FQN> = new Set();
  const typeChecker = getProjectTypeChecker();
  
  // 1. Analyze each declaration of the symbol
  for (const declaration of symbol.getDeclarations()) {
    
    // 2. Find all referenced symbols within the declaration
    declaration.forEachDescendant(node => {
      if (Node.isIdentifier(node)) {
        const referencedSymbol = typeChecker.getSymbolAtLocation(node);
        
        if (referencedSymbol && !isGenericSymbol(referencedSymbol)) {
          const fqn = createFullyQualifiedNameForSymbol(referencedSymbol);
          
          // 3. Exclude self-references
          if (fqn !== symbol.getFQN()) {
            dependencies.add(fqn);
          }
        }
      }
    });
  }
  
  return Array.from(dependencies);
}
```

### Circular Dependency Detection

The system implements depth-first search with recursion stack tracking:

```typescript
function detectCycles(nodes: Map<FQN, DependencyNode>): FQN[][] {
  const cycles: FQN[][] = [];
  const visited = new Set<FQN>();
  const recursionStack = new Set<FQN>();
  
  const dfs = (fqn: FQN, path: FQN[]): void => {
    if (recursionStack.has(fqn)) {
      // Cycle detected - extract cycle from path
      const cycleStart = path.indexOf(fqn);
      const cycle = [...path.slice(cycleStart), fqn];
      cycles.push(cycle);
      return;
    }
    
    if (visited.has(fqn)) return;
    
    visited.add(fqn);
    recursionStack.add(fqn);
    
    const node = nodes.get(fqn);
    if (node) {
      for (const depFQN of node.dependencies) {
        dfs(depFQN, [...path, fqn]);
      }
    }
    
    recursionStack.delete(fqn);
  };
  
  // Start DFS from each unvisited node
  for (const fqn of nodes.keys()) {
    if (!visited.has(fqn)) {
      dfs(fqn, []);
    }
  }
  
  return cycles;
}
```

## Performance Optimization

### Memory Management

- **Lazy Loading**: Symbols loaded on-demand during traversal
- **Streaming Output**: Large JSON outputs streamed to prevent memory spikes
- **Garbage Collection**: Explicit cleanup of large AST structures
- **Depth Limiting**: Configurable traversal limits prevent infinite analysis

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| **Initial Analysis** | O(n²) where n = symbols | Full dependency discovery |
| **Cycle Detection** | O(n + e) where e = edges | DFS with path tracking |  
| **Graph Traversal** | O(d × b) where d = depth, b = branching | Limited by `--depth` option |
| **Cache Validation** | O(f) where f = files | File modification check |

### Optimization Strategies

```typescript
// 1. Parallel symbol processing (planned)
const symbolBatches = chunk(allSymbols, CPU_COUNT);
const results = await Promise.all(
  symbolBatches.map(batch => processSymbolBatch(batch))
);

// 2. Incremental dependency updates
function updateDependencyGraph(
  graph: DependencyGraph,
  changedFiles: string[]
): DependencyGraph {
  const affectedSymbols = getSymbolsInFiles(changedFiles);
  
  // Only recompute affected portions
  for (const symbol of affectedSymbols) {
    updateSymbolDependencies(graph, symbol);
  }
  
  return graph;
}

// 3. Memory-efficient traversal
function* traverseDependenciesGenerator(
  graph: DependencyGraph,
  root: FQN
): Generator<DependencyInfo> {
  // Yield dependencies one at a time
  const stack = [{ fqn: root, depth: 0 }];
  
  while (stack.length > 0) {
    const { fqn, depth } = stack.pop()!;
    const node = graph.nodes.get(fqn);
    
    if (node) {
      yield { fqn, depth, node };
      
      for (const depFQN of node.dependencies) {
        stack.push({ fqn: depFQN, depth: depth + 1 });
      }
    }
  }
}
```

## Integration with Other Commands

The deps command shares infrastructure with other typed-tester commands:

### Shared Components

- **Symbol Cache**: Used by `symbols` command for consistency
- **Type Checker**: Shared ts-morph TypeChecker instance  
- **Project Management**: Common project loading and configuration
- **Output Formatting**: Consistent JSON schemas across commands

### Cross-Command Workflows

```bash
# 1. Identify symbols with complex dependencies
typed deps --json | jq '.symbols[] | select(.dependencies | length > 5)'

# 2. Analyze high-dependency symbols
typed symbols --filter="UserService" --verbose

# 3. Test symbols with many dependencies
typed test --filter="**/user-service.test.ts"

# 4. Check source health of dependency-heavy files
typed source src/services/user.ts
```

## Troubleshooting

### Common Issues

**"No symbols found matching pattern"**

```bash
# Check available symbols first
typed symbols --filter="*User*"

# Use broader patterns
typed deps --filter="*" | head -20
```

**"Cache validation failed"**

```bash
# Clear cache and rebuild
typed deps --clear-cache

# Check for file permission issues
ls -la .dependencies.json
```

**"Analysis taking too long"**

```bash
# Limit analysis scope
typed deps --filter="src/services/*" --depth=3

# Use quiet mode for faster execution
typed deps --quiet --filter="MyType"
```

**"Memory usage too high"**

```bash
# Reduce traversal depth
typed deps MyType --graph --depth=5

# Process smaller subsets
typed deps --filter="src/types/*" --json
```

### Debug Information

Enable verbose output for detailed analysis information:

```bash
typed deps --verbose MySymbol --graph
```

**Verbose Output Includes:**

- Cache hit/miss ratios
- Symbol analysis timing
- Memory usage statistics  
- File modification timestamps
- Dependency resolution details

## Examples

### Basic Usage

```bash
# Show all exported symbols and their dependencies
typed deps

# Filter by symbol name pattern
typed deps --filter="User*"
typed deps --filter="*Service"
typed deps --filter="Get*,Set*"

# Filter by file path
typed deps --filter="src/api/*"
typed deps --filter="**/*.service.ts"
```

### Graph Analysis

```bash
# Full dependency tree for specific symbol
typed deps UserService --graph

# Limit dependency depth
typed deps UserService --graph --depth=3

# Multiple pattern matching with interactive selection
typed deps "Auth*" --graph
```

### JSON Output and Processing

```bash
# Export all dependencies as JSON
typed deps --json > dependencies.json

# Find symbols with most dependencies
typed deps --json | jq '.symbols | sort_by(.dependencies | length) | reverse | .[0:5]'

# Find symbols with circular dependencies
typed deps --json | jq '.symbols[] | select(.dependencies[] | contains("circular"))'

# Export dependency graph for visualization
typed deps MyService --graph --json > service-deps.json
```

### Cache Management

```bash
# Clear cache before analysis
typed deps --clear-cache UserService --graph

# Verify cache performance
time typed deps UserService --graph  # First run (slow)
time typed deps UserService --graph  # Second run (fast)
```

### Advanced Filtering

```bash
# Complex pattern combinations
typed deps --filter="User*" --filter="Auth*" --filter="src/services/*"

# Interactive refinement for large result sets
typed deps "*" --graph  # Will prompt for selection

# Exclude external dependencies
typed deps --filter="!node_modules/**" UserService --graph
```

## API Reference

### Core Types

```typescript
// Dependency node with bi-directional relationships
type DependencyNode = {
  symbol: FQN;
  hash: number;
  dependencies: FQN[];
  dependents: FQN[];
  meta: SymbolMeta;
  analyzedAt: number;
}

// Complete project dependency graph
type DependencyGraph = {
  nodes: Map<FQN, DependencyNode>;
  projectHash: number;
  lastUpdated: number;
  stats: {
    totalSymbols: number;
    totalDependencies: number;
    circularDependencies: FQN[][];
    maxDepth: number;
  };
}

// Traversal result for graph view
type DependencyTraversal = {
  root: FQN;
  dependencies: Array<{
    symbol: FQN;
    depth: number;
    path: FQN[];
  }>;
  cycles: FQN[][];
  maxDepth: number;
}
```

### Main Functions

```typescript
// Build complete dependency graph for project
function buildDependencyGraph(project: Project): DependencyGraph

// Traverse dependencies from a root symbol
function traverseDependencies(
  graph: DependencyGraph, 
  rootFQN: FQN, 
  maxDepth?: number
): DependencyTraversal

// Find symbols matching glob patterns
function findSymbolsByPattern(
  graph: DependencyGraph, 
  pattern: string
): DependencyNode[]

// Detect circular dependencies
function detectCycles(nodes: Map<FQN, DependencyNode>): FQN[][]
```
