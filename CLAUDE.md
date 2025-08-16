# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`typed-tester` is a CLI tool for running "type tests" on TypeScript projects. It analyzes TypeScript source code, extracts type symbols, validates type behavior through testing, and provides comprehensive dependency analysis. The tool focuses on type-level testing rather than runtime testing, with sophisticated caching and performance optimization.

## Core Architecture

### CLI Structure
- **Entry point**: `src/typed.ts` - main CLI script that routes commands
- **Shell wrapper**: `src/typed` - bash script that detects JS runtime (bun/node/deno) and executes the transpiled JS
- **CLI creation**: `src/cli/create_cli.ts` - handles command-line argument parsing using `command-line-args`
- **Commands**: `src/commands/` - contains implementation for each CLI command (test, symbols, deps, source, files)

### Key Architectural Components

1. **AST Processing** (`src/ast/`):
   - Uses `ts-morph` library for TypeScript AST manipulation
   - `project.ts` - manages TypeScript projects and compiler API with intelligent caching
   - `symbols.ts` - extracts and analyzes TypeScript symbols with performance optimizations
   - `dependency-graph.ts` - builds and manages complex dependency graphs with cycle detection
   - `files.ts` - handles file-level AST operations
   - `diagnostics.ts` - processes TypeScript compiler diagnostics

2. **Dependency System** (`src/types/dependency.ts`, `src/cache/dependency-cache.ts`):
   - Advanced dependency graph building with bi-directional relationships
   - Sophisticated caching with file-based persistence and automatic invalidation
   - Cycle detection algorithms using depth-first search
   - Performance-optimized symbol analysis limiting excessive traversal

3. **Type System** (`src/types/`):
   - Comprehensive type definitions for all internal data structures
   - `symbol-ast-types.ts` - types for symbol analysis and AST data with Fully Qualified Names (FQN)
   - `dependency.ts` - types for dependency graph operations, caching, and traversal
   - `file-ast-types.ts` - types for file-level operations
   - `testing-types.ts` - types for test execution and results

4. **Caching Architecture**:
   - Multi-layered caching system for performance optimization
   - File-based dependency cache (`.dependencies.json`) with intelligent invalidation
   - In-memory caching with automatic cleanup
   - Hash-based change detection for files and symbols

5. **Reporting System** (`src/report/`):
   - `symbolsScreen.ts` - formatted table output for symbols with dependency information
   - `symbolsJson.ts` - JSON output format for programmatic use
   - Color-coded dependency visualization by scope (local, module, external)

## Common Development Commands

### Build and Development
```bash
# Build the project (uses custom multi-step build process)
npm run build

# Watch mode during development (uses tsup)
npm run watch

# Try the CLI locally using bun runtime (preferred for development)
npm run try [command] [options]
# Example: npm run try test --filter="*.test.ts"
# Example: npm run try symbols --filter="MyType"
# Example: npm run try deps --clear-cache

# Release new version (uses bumpp)
npm run release

# Get TypeScript diagnostics
npm run diagnostics
```

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run a single test file
npx vitest tests/unit/basic.test.ts

# Run tests matching a pattern
npx vitest --run "test-command"
```

### Linting and Type Checking
```bash
# Lint with ESLint (uses @antfu/eslint-config)
npx eslint .

# Typecheck without emitting (fast validation)
npx tsc --noEmit

# Timeout-based TypeScript checking for performance testing
timeout 10s npx tsc --noEmit
```

## CLI Commands

The tool supports five main commands:
- `test` - Run type tests on test files (primary command)
- `symbols` - Analyze and display type symbols with their dependencies
- `deps` - Show dependency graph between symbols (list and graph views)
- `source` - Analyze source file diagnostics and performance metrics
- `files` - List and analyze project files

### Advanced Dependency Analysis
The `deps` command provides two views:
- **List View** (default): Shows multiple symbols with direct dependencies and dependents
- **Graph View** (`--graph`): Shows complete dependency tree for a single symbol with cycle detection

### Local CLI Usage
```bash
# Using npm run try (preferred for development)
npm run try test
npm run try symbols --filter="MyType"
npm run try deps UserService --graph
npm run try source --show-warnings

# Using npx (after build)
npx typed test
npx typed symbols --help

# Direct execution (after build)
./bin/typed test
./bin/typed deps --clear-cache
```

## Key Dependencies

- **ts-morph**: TypeScript compiler API wrapper for AST manipulation
- **command-line-args**: CLI argument parsing
- **fast-glob**: File pattern matching for test discovery
- **chalk**: Terminal coloring for output formatting
- **@yankeeinlondon/ask**: Interactive CLI prompts for symbol selection
- **inferred-types**: Advanced TypeScript utility types

## Cache System

### Cache Files
- **`.dependencies.json`**: Comprehensive dependency graph cache with metadata
- **`.symbols.json`**: Symbol metadata cache (if present)

### Cache Architecture
- File modification hash-based invalidation using `mtimeMs + fileSize`
- Project configuration hash for detecting tsconfig changes
- Multi-factor validation (version, files, config, new files)
- Automatic cache rebuilding when invalidated

### Cache Performance
- Cold run (no cache): 2+ minutes for large projects
- Warm run (valid cache): <500ms
- Cache validation: <1s per file change

## Type System Architecture

### Fully Qualified Names (FQN)
Each symbol receives a unique identifier for precise tracking:
- **Local Symbol**: `local::<hash>::<name>` (file-scoped, not exported)
- **Module Symbol**: `module::<hash>::<name>` (exported from project)
- **External Symbol**: `ext::<hash>::<name>` (from node_modules)

### Symbol Classification
- `type-defn` - Type definitions, interfaces
- `class` - Class definitions
- `function` - Function declarations  
- `const-function` - Arrow function variables
- `property` - Object/class properties
- `external-type` - Types from external libraries

### Dependency Graph Features
- Bi-directional dependency tracking (dependencies and dependents)
- Circular dependency detection with DFS algorithms
- Performance-optimized traversal with depth limiting
- Interactive symbol selection for large result sets

## Performance Optimizations

### AST Processing Optimizations
- Targeted node traversal instead of `forEachDescendant()`
- Early termination for symbols with many dependencies (50+ limit)
- Visited node tracking to prevent duplicate processing
- Declaration limiting (max 3 per symbol) for performance

### Memory Management
- Lazy loading of symbols during traversal
- Explicit cleanup of large AST structures
- Depth limiting to prevent infinite analysis
- Streaming output for large JSON results

## Project Configuration

### TypeScript Configuration
- Uses path mapping with `~/*` aliasing to `src/*`
- Strict TypeScript settings enabled
- ESM modules with ES2022 target
- Builds to `bin/` directory using `tsdown`

### Test Configuration (Vitest)
- Test files: `tests/**/*.test.ts` and `tests/**/*.fast.test.ts`
- Unit tests in `tests/unit/`
- Integration tests in `tests/integration/`
- Fast integration tests in `tests/integration/fast/` (optimized for <2s per command)
- Test fixtures in `tests/fixtures/` (excluded from test runs)
- Uses Vitest with Node environment
- Concurrent test execution enabled for performance

### Build Process
Multi-step process using `npm-run-all`:
1. **Clean**: Remove existing `bin/` directory
2. **Create**: Make new `bin/` directory  
3. **Transpile**: Use `tsdown` to compile TypeScript to ESM JavaScript
4. **Copy**: Copy shell wrapper script to `bin/`
5. **Permissions**: Set execute permissions on shell script (Unix/Mac only)
