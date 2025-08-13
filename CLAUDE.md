# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`typed-tester` is a CLI tool for running "type tests" on TypeScript projects. It analyzes TypeScript source code, extracts type symbols, and validates type behavior through testing. The tool focuses on type-level testing rather than runtime testing.

## Core Architecture

### CLI Structure
- **Entry point**: `src/typed.ts` - main CLI script that routes commands
- **Shell wrapper**: `src/typed` - bash script that detects JS runtime (bun/node/deno) and executes the transpiled JS
- **CLI creation**: `src/cli/create_cli.ts` - handles command-line argument parsing using `command-line-args`
- **Commands**: `src/commands/` - contains implementation for each CLI command (test, symbols, deps, source, files)

### Key Architectural Components

1. **AST Processing** (`src/ast/`):
   - Uses `ts-morph` library for TypeScript AST manipulation
   - `project.ts` - manages TypeScript projects and compiler API
   - `symbols.ts` - extracts and analyzes TypeScript symbols
   - `files.ts` - handles file-level AST operations
   - `diagnostics.ts` - processes TypeScript compiler diagnostics

2. **Caching System** (`src/cache/`):
   - Multi-layered caching for performance optimization
   - `symbolCache.ts` - caches type symbol definitions and their AST representations
   - `sourceCache.ts` - caches source file AST data
   - `testCache.ts` - caches test file analysis results
   - Uses `xxhash-wasm` for fast hashing to detect file changes

3. **Type System** (`src/types/`):
   - Comprehensive type definitions for all internal data structures
   - `symbol-ast-types.ts` - types for symbol analysis and AST data
   - `file-ast-types.ts` - types for file-level operations
   - `cache-types.ts` - types for caching system
   - `testing-types.ts` - types for test execution and results

4. **Type Guards** (`src/type-guards/`):
   - Runtime type validation using TypeScript type guards
   - Extensive validation for CLI commands, symbols, diagnostics, etc.

5. **Test Harness** (`tests/helpers/`):
   - `test-harness.ts` - reuses TypeScript compiler instance between tests for performance
   - `enhanced-test-harness.ts` - extended testing capabilities
   - `performance-tracker.ts` - tracks and validates performance metrics
   - `output-validators.ts` - validates CLI output format

## Common Development Commands

### Build and Development
```bash
# Build the project (uses custom multi-step build process)
npm run build

# Watch mode during development (uses tsup)
npm run watch

# Try the CLI locally using bun runtime
npm run try [command] [options]
# Example: npm run try test --filter="*.test.ts"

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

### Linting
```bash
# Lint with ESLint (uses @antfu/eslint-config)
npx eslint .

# Typecheck without emitting (fast validation)
npx tsc --noEmit
```

## CLI Commands

The tool supports these main commands:
- `test` - Run type tests on test files (primary command)
- `symbols` - Analyze and display type symbols from source files
- `deps` - Show dependency graph between symbols
- `source` - Analyze source file diagnostics and performance metrics
- `files` - List and analyze project files

Each command has its own options and can be filtered. Use `--help` with any command for details.

### Local CLI Usage
```bash
# Using npm run try (preferred for development)
npm run try test
npm run try symbols --filter="MyType"
npm run try source --show-warnings

# Using npx (after build)
npx typed test
npx typed symbols --help

# Direct execution (after build)
./bin/typed test
```

## Key Dependencies

- **ts-morph**: TypeScript compiler API wrapper for AST manipulation
- **command-line-args**: CLI argument parsing
- **fast-glob**: File pattern matching for test discovery
- **xxhash-wasm**: Fast hashing for cache invalidation
- **chalk**: Terminal coloring for output formatting

## Cache Files

The tool generates cache files in the project root:
- `.dependencies.json` - maps test files to symbol hashes
- `.symbols.json` - cached symbol definitions and AST data

These files can be gitignored or committed depending on team preference for build performance vs. repository size.

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
The build uses a multi-step process (`npm run build`):
1. Clean: Remove existing `bin/` directory
2. Create: Make new `bin/` directory
3. Transpile: Use `tsdown` to compile TypeScript to ESM JavaScript
4. Copy: Copy shell wrapper script to `bin/`
5. Permissions: Set execute permissions on shell script (Unix/Mac only)