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

## Testing Guidelines

Tests use Vitest with `describe()` and `it()` blocks. All tests follow TDD principles.

**CRITICAL: This is library code. Type tests are MANDATORY, not optional.**

### Type Test Syntax - MANDATORY PATTERN

**ALL type tests MUST follow this exact structure:**

```typescript
import type { Expect, AssertEqual, AssertExtends } from "inferred-types/types";

describe("myFunction()", () => {
    it("should do something", () => {
        const result = myFunction("input");

        // Runtime assertion
        expect(result).toBe("expected");

        // Type assertion - ALWAYS in the same it() block
        type cases = [
            Expect<AssertEqual<typeof result, "expected">>
        ];
    });
});
```

**🚨 RED FLAGS - These patterns indicate WRONG type tests:**

- ❌ Separate `describe("Type Tests")` blocks
- ❌ Using `typeof` with `expect()` assertions (e.g., `expect(typeof x).toBe("string")`)
- ❌ Checking `extends` with runtime conditional logic (e.g., `const _check: T extends U ? true : false`)
- ❌ Runtime tests in one section, "type tests" in another

**✅ Correct pattern**: Runtime and type assertions side-by-side in the same `it()` block using `type cases = [...]` array.

**See also:** `docs/type-testing.md` and `tests/examples/canonical-type-test-pattern.test.ts` for complete examples.

### Type Testing Requirements

This library heavily leverages TypeScript's type system with:

- Complex generics and conditional types
- `inferred-types` utilities for narrow type inference
- Provider-specific type narrowing
- Compile-time type safety guarantees

**Every phase MUST include comprehensive type tests alongside runtime tests.** Type tests validate:

- Generic type inference works correctly
- Conditional types resolve to expected types
- Type narrowing behaves as designed
- `inferred-types` utilities produce correct narrow types
- Return types match specifications

### CRITICAL: How to Verify Type Tests

**YOU MUST RUN BOTH TEST COMMANDS:**

1. **Runtime tests**: `pnpm test` - Tests behavior during execution
2. **Type tests**: `pnpm test:types` - Type-checks test files with `typed-tester`

**IMPORTANT**: A test file only passes type tests if it type-checks without TypeScript errors. The `typed-tester` tool runs TypeScript type checking on test files and reports any type errors as test failures.

**DO NOT declare type tests complete until:**

- ✅ `pnpm test` exits with code 0
- ✅ `pnpm test:types` exits with code 0 and shows "🎉 No errors!"

Type assertions (`as`, type annotations) may be needed in tests to satisfy TypeScript's type checker while maintaining test validity.

### Testing Strategy by Symbol Type

- **Type utilities**: Type tests ONLY (testing narrow types from `inferred-types`)
- **Functions**: BOTH runtime AND type tests
  - Runtime: Validate behavior and edge cases
  - Type: Validate generic inference, return types, parameter constraints
- **Classes**: Runtime tests primarily, type tests for generic class methods

## 🔍 First-Line Scan: Trigger Word Detection

**BEFORE reading the full checklist, scan the user's message for these high-priority triggers:**

**Planning triggers** → Use `planning` skill + `project-manager` sub-agent:
- Keywords: "plan", "think harder", "build a plan", "approach", "design", "strategy", "architect", "break down", "roadmap", "phases"

**Testing triggers** → **MANDATORY** invoke `testing` skill:
- Any mention of: "test", "tests", "testing", "TDD", "test coverage"
- About to create/edit any `.test.ts` file

**Research triggers** → Use `Explore` sub-agent:
- Question words + architecture: "how does X work?", "where is Y?", "what's the structure?"

**Phase execution triggers** → Use `phase-executor` sub-agent:
- "execute phase", "implement phase", "build phase", "TDD cycle"
- ONLY for new features, NOT refactoring/infrastructure

If ANY trigger word matches, proceed to the full Decision Checklist.

## Quick Decision Checklist

Before starting ANY task, evaluate these checkpoints:

- [ ] **Is this a planning request?**
  - Keywords: plan, think, approach, design, strategy, architect, break down, build a plan, create a strategy
  - → YES: Invoke `planning` skill, strongly consider `project-manager` sub-agent

- [ ] **Am I about to write test files?** (⚠️ MANDATORY check)
  - Any creation/editing of `.test.ts` files
  - → YES: MUST invoke `testing` skill first - no exceptions

- [ ] **Is this a new feature/functionality?** (not refactoring/migration)
  - → YES: Consider `phase-executor` for TDD implementation
  - → NO: Infrastructure/refactoring can proceed directly

- [ ] **Is this codebase exploration/research?**
  - → YES: Use `Explore` sub-agent instead of direct Grep/Glob

- [ ] **Did I announce my approach before starting?**
  - → NO: State what I'm about to do and why (see Validation Protocol below)

### ⚠️ MANDATORY OPENING PROTOCOL

**BEFORE responding to ANY user request, you MUST:**

1. **Scan for trigger words** from the checklists above
2. **Announce your interpretation** using the Validation Protocol
3. **Wait for implicit/explicit approval** before proceeding

**This is NOT optional.** Every response must begin with this validation, even for seemingly simple tasks.

**Violation check:** If you find yourself typing code or implementation details without first announcing your approach, STOP and restart with the validation protocol.

### 🎯 Meta-Rule: When in Doubt, Use Tools

**Default assumption:** Any task that isn't a direct question requiring a brief answer should use skills or sub-agents.

**Uncertainty threshold:** If you're thinking "should I use a sub-agent for this?", the answer is YES.

**Context preservation:** Your main context is precious. Delegate substantial work to sub-agents to keep your window clear for coordination.

### Overview: Skills vs Sub-agents

**Skills** (invoked via `Skill` tool):

- Lightweight consultations that load domain-specific guidance
- Minimal context window cost
- Use for quick reference, syntax checks, standards review
- Available: `planning`, `testing`, `development`, `parsing`

**Sub-agents** (invoked via `Task` tool):

- Autonomous agents that execute in separate contexts
- Heavy lifting that preserves main orchestrator context
- Use for complex, multi-step work
- **Custom:** `project-manager`, `phase-executor`
- **Built-in:** `Explore`, `general-purpose`

### Context Management Strategy

**Main Orchestrator** (Claude Code - you):

- High-level coordination
- User interaction and questions
- Simple, focused tasks
- Monitoring sub-agent progress

**Skills** (< 1k tokens each):

- Quick consultations before direct work
- Understanding syntax and patterns
- Reviewing quality standards

**Sub-agents** (isolated context):

- Codebase research and exploration
- Plan creation and maintenance
- Complete TDD cycle execution
- Complex multi-phase implementations

**Key principle:** Sub-agents preserve your main context window for coordination. Use them proactively for any substantial work.

### Orchestration Validation Protocol

Before starting execution on any task, follow this validation protocol:

1. **Announce my interpretation**:
   - "I recognize this as a [planning/testing/implementation/research] request"
   - Identify key trigger words from user's request

2. **State intended approach**:
   - "I will use [skill/sub-agent/direct approach] because [specific reason]"
   - Reference which checkpoint from the Decision Checklist applies

3. **Provide alternative if uncertain**:
   - "Alternatively, I could [other approach] if you prefer"
   - Let user course-correct before investing effort

4. **Proceed only after validation**:
   - User may implicitly approve (no response = proceed)
   - Or explicitly approve/redirect

**Example validation:**

```
User: "think harder and build a plan for the API refactor"

My response:
"I recognize this as a planning request (keywords: 'think', 'build a plan').

I will:
1. Invoke the `planning` skill to understand TDD workflow approach
2. Use the `project-manager` sub-agent to create a formal plan in `.ai/plans/`
3. Present the plan for your approval before execution

This ensures we have a comprehensive, phase-based approach. Proceeding now..."
```

### When to Use Skills Directly

Invoke skills when you need quick guidance before direct implementation:

**planning skill**:

- Before creating inline mini-plans
- Understanding TDD workflow structure
- Quick consultation on phase breakdown
- **Triggers**:
  - Question form: "how should I approach...", "what's the TDD process..."
  - Imperative form: "build a plan", "think about", "design a strategy", "architect", "break this down"

**testing skill** (⚠️ MANDATORY BEFORE WRITING TESTS):

- **ALWAYS invoke before writing ANY test file** - no exceptions
- When user explicitly requests tests
- Understanding type test syntax (`type cases = [...]`)
- Reviewing canonical test examples
- Understanding runtime vs type test distinction
- **Triggers**:
  - Explicit requests: "write tests", "add test coverage", "TDD approach"
  - Implicit: About to create/edit any `.test.ts` file

**CRITICAL RULE**: If you are about to create/edit a `.test.ts` file, you MUST invoke the testing skill first. This prevents runtime/type test confusion and ensures proper test patterns.



**development skill**:

- Before implementing features with uncommitted changes
- Understanding TODO prevention requirements
- Reviewing quality standards
- Understanding completion criteria
- Triggers: "implement feature", "build functionality", "add capability"

**parsing skill**:

- Understanding parsing utilities in this library
- Working with template literal types
- Text transformation patterns

**CRITICAL RULES:**

1. **ALWAYS invoke `testing` skill** before writing tests (prevents runtime/type test confusion)
2. **ALWAYS invoke `development` skill** before implementing with uncommitted changes
3. Skills are consultations, not substitutes for sub-agents

### When to Use Sub-agents

Use sub-agents to preserve context and leverage specialized capabilities:

#### Custom Project Sub-agents

**project-manager** (`.claude/agents/project-manager.md`):

- Creating comprehensive project plans
- Breaking down features into TDD phases
- Updating existing plans
- Output: Plan file in `.ai/plans/YYYY-MM-DD-{name}.md`
- **Triggers**:
  - Question form: "how should we plan...", "what's the roadmap for..."
  - Imperative form: "plan this feature", "create a roadmap", "break this down into phases", "build a plan for", "think harder about", "design the implementation", "create a strategy for"

**phase-executor** (`.claude/agents/phase-executor.md`):

- Executing complete TDD cycle for ONE phase (new features only, not refactoring/migrations)
- Has all three skills (planning, testing, development)
- Follows: SNAPSHOT → CREATE LOG → WRITE TESTS → IMPLEMENT → TODO SCAN → CLOSEOUT
- Output: Phase log in `.ai/logs/` + implemented code
- **Triggers**:
  - "execute phase N", "implement phase", "TDD cycle for...", "build phase N"
  - Use ONLY for new features/functionality, NOT for refactoring or infrastructure changes

**See `.claude/agents/README.md` for detailed workflow patterns and examples.**

#### Built-in Sub-agents

**Explore**:

- Broad codebase research
- Finding patterns across multiple files
- Understanding architecture
- Triggers: "how does X work?", "where is Y handled?", "what's the structure of..."
- **IMPORTANT:** Use instead of direct Grep/Glob for open-ended searches

**general-purpose**:

- Complex multi-step research
- Tasks requiring multiple tool combinations
- When other sub-agents don't fit

### Decision Tree

```
┌─ Task Request
│
├─ Is this a quick consultation? (< 5 min)
│  └─ YES → Invoke appropriate Skill, then proceed
│
├─ Is this codebase research/exploration?
│  └─ YES → Use Explore sub-agent
│
├─ Does this need a comprehensive plan?
│  └─ YES → Use project-manager sub-agent
│
├─ Is this executing a complete phase from a plan?
│  └─ YES → Use phase-executor sub-agent
│
├─ Is this direct implementation work?
│  ├─ Are you about to write tests?
│  │  └─ YES → MANDATORY: Invoke testing skill first
│  ├─ Are there uncommitted changes?
│  │  └─ YES → MANDATORY: Invoke development skill first
│  └─ Proceed with implementation
│
└─ Is this complex, multi-step, context-heavy?
   └─ YES → Use general-purpose sub-agent
```

### 🚫 Prohibited Patterns

**NEVER do these things:**

- ❌ Create plans in `@docs/` or anywhere other than `.ai/plans/`
- ❌ Skip the Validation Protocol, even for "quick" tasks
- ❌ Write tests without invoking the `testing` skill first
- ❌ Start implementation without announcing your approach
- ❌ Use direct Grep/Glob for open-ended codebase exploration
- ❌ Execute phases without using `phase-executor` (for new features)
- ❌ Assume a task is "too simple" for skills/sub-agents

**When in doubt:** Use a skill or sub-agent. The cost of over-consulting is low; the cost of skipping validation is high (wasted effort, wrong patterns, context bloat).

### Workflow Examples

**Example 1: Planning Request (user says "think harder and build a plan")**

✅ **Correct approach:**

```
1. Announce: "I recognize this as a planning request (keywords: 'think harder', 'build a plan')"
2. Invoke `planning` skill for consultation
3. Use `project-manager` sub-agent to create `.ai/plans/YYYY-MM-DD-{name}.md`
4. Present plan to user for approval
5. Execute according to plan (using phase-executor for new features, or directly for infrastructure)
```

❌ **Incorrect approach:**

```
1. Create inline plan in @docs/ without consulting skills
2. Immediately execute without approval
3. Never use project-manager sub-agent
```

**Example 2: User asks "how does error handling work?"**

```
1. Announce: "I recognize this as a codebase research request"
2. Use Explore sub-agent → researches codebase
3. Agent returns findings
4. Summarize for user
```

**Example 3: User asks "add tests for the parseDate function"**

✅ **Correct approach:**

```
1. Announce: "I'm about to write test files - invoking testing skill (MANDATORY)"
2. Invoke testing skill → review type test syntax, understand patterns
3. Write tests directly in main context
4. Simple, focused task
```

❌ **Incorrect approach:**

```
1. Start writing tests immediately without testing skill
2. Risk using wrong test patterns (runtime vs type tests)
```

**Example 4: User asks "implement a new authentication feature"**

✅ **Correct approach:**

```
1. Announce: "New feature request - will use project-manager + phase-executor"
2. Use project-manager sub-agent → creates comprehensive plan
3. Review plan with user
4. For each phase: Use phase-executor sub-agent
5. Monitor via logs, coordinate, handle blockers
```

**Example 5: User asks "refactor the build configuration"**

✅ **Correct approach:**

```
1. Announce: "Refactoring/infrastructure work - can proceed directly (not a new feature)"
2. Check git status for uncommitted changes
3. If uncommitted: Invoke development skill
4. Proceed with refactoring directly (no phase-executor needed)
```

**Example 6: User asks "migrate to pnpm catalogs"**

✅ **Correct approach (what I should do next time):**

```
1. Announce: "Planning request for infrastructure migration"
2. Invoke planning skill
3. Use project-manager sub-agent → creates plan in .ai/plans/
4. Present for approval
5. Execute directly (infrastructure, not new feature - no phase-executor)
```

❌ **Incorrect approach (what I did):**

```
1. Created plan myself in @docs/
2. Immediately executed
3. Never consulted skills or sub-agents
```

**Consequences of incorrect approach:**
- Plan in wrong location (not discoverable in `.ai/plans/`)
- Missed expertise from planning skill
- Potential pattern violations
- Context window bloated with planning work
- No structured phase breakdown
- Lost opportunity for user feedback before execution
