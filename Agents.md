# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`typed-tester` is a CLI tool for running "type tests" on TypeScript projects. It analyzes TypeScript source code, extracts type symbols, and validates type behavior through testing. The tool focuses on type-level testing rather than runtime testing.

## Core Architecture

### CLI Structure
- **Entry point**: `src/typed.ts` - main CLI script that routes commands
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

## Common Development Commands

### Build and Development
```bash
# Build the project (uses custom build script)
npm run build

# Watch mode during development
npm run watch

# Try the CLI locally
npm run try

# Release new version
npm run release
```

### Testing and Linting
```bash
# No tests currently - waiting for CLI refactor
npm test

# Lint with ESLint (uses @antfu/eslint-config)
npx eslint .
```

### AI Development Tools
```bash
# Run AST analysis tool
npm run ast

# Run AI chat tool
npm run ask
```

## CLI Commands Structure

The tool supports these main commands:
- `test` - Run type tests on test files
- `symbols` - Analyze and display type symbols
- `deps` - Show dependency graph between symbols
- `source` - Analyze source file diagnostics and performance
- `files` - List and analyze project files

Each command has its own options and can be filtered. Use `--help` with any command for details.

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

## TypeScript Configuration

- Uses path mapping with `~/*` aliasing to `src/*`
- Strict TypeScript settings enabled
- ESM modules with ES2022 target
- Builds to `bin/` directory