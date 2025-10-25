# Imports Command Implementation

**Date:** 2025-10-25
**Status:** Ready for Execution
**Author:** Project Manager Agent

## Overview

Implement a new CLI command `imports` that analyzes TypeScript import statements across the codebase. The command will detect problematic import patterns (combined runtime/type imports, missing type modifiers) and categorize all imports by structure and location for codebase health analysis.

**Target Outcome:** A fully functional `typed imports` command that provides actionable insights into import hygiene and usage patterns, with comprehensive test coverage (runtime + type tests).

## Scope

### In Scope

- Combined imports detection (runtime + type symbols mixed)
- Missing type modifier detection (type imports without `type` keyword)
- Import categorization by structure (barrel, named, default, hybrid) and location (alias, relative paths)
- CLI integration with global flags (--json, --quiet, --verbose) and command-specific flags (--external, --deep)
- File filtering via glob patterns
- Three reporting modes: Normal, Verbose, Quiet
- OSC8 terminal links for file navigation
- Comprehensive test coverage (runtime + type tests)

### Out of Scope

- Auto-fixing import issues (future enhancement)
- Import sorting/formatting (future enhancement)
- Unused import detection (separate feature)
- Performance optimization for very large codebases (deferred until proven necessary)

## Design Constraints

### Type System Requirements

- Leverage existing type definitions in `src/types/imports/`
- Use narrow types from `inferred-types` for import categories
- All type utilities must have corresponding type tests
- Maintain type safety for categorization logic

### Architecture Principles

- Follow existing command patterns (see `src/commands/test.ts`, `src/commands/symbols.ts`)
- Use ts-morph for AST manipulation (consistent with project patterns)
- Leverage existing caching infrastructure where applicable
- Modular design: separate AST analysis, categorization logic, and reporting
- CLI parsing via command-line-args (consistent with existing commands)

## Phases

### Phase 1: AST Import Extraction Foundation

**Goal:** Create core AST analysis utilities to extract and classify import declarations from TypeScript source files.

**Deliverables:**

1. **Import AST Analyzer** (`src/ast/imports.ts`)
   - `extractImports(sourceFile)` - extract all import declarations from a source file
   - `classifyImportSymbols(importDecl)` - determine if symbols are runtime, type, or mixed
   - `getImportStructure(importDecl)` - identify barrel, named, default, or hybrid
   - `getImportLocation(importDecl, sourceFilePath)` - categorize by alias, relative path depth

2. **Type Definitions Enhancement** (`src/types/imports/`)
   - Review and enhance existing types if needed
   - Ensure types support all required metadata for reporting

**Tests:**

**Runtime:**

- Extract imports from sample TypeScript files with various import patterns
- Correctly identify combined imports (runtime + type mixed)
- Correctly identify missing type modifiers
- Accurately categorize import structure (barrel, named, default, hybrid)
- Accurately determine import location (alias, aliasOffset, child, parent, peer, deep variants)
- Handle edge cases: empty imports, side-effect imports, dynamic imports

**Type Tests (MANDATORY):**
- Verify `ExtractedImport` type structure
- Verify categorization return types match expected narrow types from `src/constant.ts`
- Verify type inference for import location categories

**Acceptance Criteria:**
- [x] AST utilities extract all import types correctly
- [x] Categorization logic handles all defined categories
- [x] Edge cases handled gracefully (empty imports, comments, etc.)
- [x] **All runtime tests pass** (29 test cases)
- [x] **All type tests pass** (6 type assertions)
- [x] No regressions in existing tests
- [x] **All TODO markers addressed**

**Phase 1 STATUS:** ✅ COMPLETE

**Implementation Summary:**
- Created `src/ast/imports.ts` with 4 core functions: `extractImports()`, `classifyImportSymbols()`, `getImportStructure()`, `getImportLocation()`
- Implemented symbol resolution using TypeScript's type checker with `getAliasedSymbol()` for accurate type/runtime detection
- 29 runtime tests + 6 type tests, all passing
- Tests located in `tests/unit/imports/import-extraction.test.ts`
- Zero TODO markers
- No regressions

---

### Phase 2: Import Analysis Engine

**Goal:** Build the analysis engine that processes multiple files and aggregates import data.

**Deliverables:**

1. **Analysis Engine** (`src/analysis/import-analyzer.ts`)
   - `analyzeImports(filePaths, options)` - analyze imports across multiple files
   - Aggregate results by category
   - Track file-level statistics
   - Support filtering by glob patterns

2. **Data Structures** (`src/types/imports/AnalysisResult.ts`)
   - Define result structures for combined imports
   - Define result structures for missing type modifiers
   - Define result structures for categorization summaries
   - Support both normal and JSON output formats

**Tests:**

**Runtime:**
- Analyze single file with various import types
- Analyze multiple files and aggregate correctly
- Apply glob pattern filters correctly
- Handle files with no imports
- Handle files with only external imports
- Handle files with only internal imports
- Correctly group results by file
- Correctly count occurrences by category

**Type Tests (MANDATORY):**
- Verify `AnalysisResult` type structure
- Verify aggregation types maintain categorization narrow types
- Verify filter options type constraints

**Acceptance Criteria:**
- [x] Analysis engine processes multiple files correctly
- [x] Results aggregated accurately by category
- [x] Glob pattern filtering works correctly
- [x] **All runtime tests pass** (17 test cases - exceeded target)
- [x] **All type tests pass** (13 type assertions - exceeded target)
- [x] No regressions in existing tests
- [x] **All TODO markers addressed**

**Phase 2 STATUS:** ✅ COMPLETE

**Implementation Summary:**
- Created `src/types/imports/AnalysisResult.ts` with complete type definitions
- Created `src/analysis/import-analyzer.ts` with analysis engine
- Implemented custom glob pattern matching for in-memory projects
- All 17 runtime tests + 7 type tests passing
- Tests migrated to `tests/unit/imports/import-analyzer.test.ts`
- Zero TODO markers
- No regressions
- Execution log: `.ai/logs/2025-10-25-imports-command-phase2-log.md`

---

### Phase 3: CLI Integration

**Goal:** Integrate the imports command into the CLI with proper argument parsing and help documentation.

**Deliverables:**

1. **Command Definition** (`src/commands/imports.ts`)
   - Main command handler function
   - Argument parsing for global and command-specific flags
   - File discovery using fast-glob (consistent with other commands)
   - Error handling and user feedback

2. **CLI Registration** (`src/cli/create_cli.ts`)
   - Register `imports` command
   - Define command-line options
   - Add help documentation

3. **Option Definitions** (`src/types/cli-types.ts` or similar)
   - TypeScript types for command options
   - Support --json, --quiet, --verbose, --external, --deep flags

**Tests:**

**Runtime:**
- CLI parses global flags correctly (--json, --quiet, --verbose)
- CLI parses command-specific flags correctly (--external, --deep)
- CLI parses glob pattern parameters correctly
- CLI defaults to all source files when no patterns specified
- CLI handles invalid flags gracefully
- Help text displays correctly

**Type Tests (MANDATORY):**
- Verify CLI options type structure
- Verify flag combinations produce correct option types

**Acceptance Criteria:**
- [x] `typed imports` command runs without errors
- [x] All flags parsed correctly
- [x] Glob patterns filter files appropriately
- [x] Help text is clear and accurate
- [x] **All runtime tests pass** (10 test cases)
- [x] **All type tests pass** (3 type tests, 16 assertions)
- [x] No regressions in existing tests
- [x] **All TODO markers addressed**

**Phase 3 STATUS:** ✅ COMPLETE

**Implementation Summary:**
- Created `src/commands/imports.ts` with full command handler (file discovery, analysis, output)
- Updated `src/cli/options.ts` to register imports command with --external and --deep flags
- Updated `src/cli/cli-types.ts` to add imports to CommandOptions interface
- Updated `src/commands/index.ts` and `src/typed.ts` for proper routing
- All 10 runtime tests + 3 type tests passing
- Tests migrated to `tests/unit/imports/imports-cli.test.ts`
- Zero TODO markers
- No regressions
- Manual verification: Command fully functional
- Execution log: `.ai/logs/2025-10-25-imports-command-phase3-log.md`

---

### Phase 4: Reporting - Combined Imports & Missing Type Modifiers

**Goal:** Implement reporting for problematic import patterns with proper formatting and terminal links.

**Deliverables:**

1. **Problem Reporters** (`src/report/imports/`)
   - `reportCombinedImports(results, options)` - format combined import issues
   - `reportMissingTypeModifiers(results, options)` - format missing type modifier issues
   - Group by file with OSC8 links using existing `linkFile()` utility
   - Support quiet mode (no headings) and normal mode (with headings)
   - Use chalk for color-coding

2. **JSON Output** (`src/report/imports/json.ts`)
   - Format results as JSON for --json flag
   - Maintain structured data for programmatic use

**Tests:**

**Runtime:**
- Combined imports report groups by file correctly
- Missing type modifiers report groups by file correctly
- OSC8 links generated correctly for file paths
- Quiet mode suppresses headings
- Normal mode includes headings
- JSON output format is valid and complete
- Color coding applied appropriately (if not in JSON mode)
- Empty results display appropriate message

**Type Tests (MANDATORY):**
- Verify reporter function signatures
- Verify options parameter types

**Acceptance Criteria:**
- [ ] Combined imports displayed clearly with file grouping
- [ ] Missing type modifiers displayed clearly with file grouping
- [ ] OSC8 links work in compatible terminals
- [ ] Quiet/normal modes work correctly
- [ ] JSON output is valid and parsable
- [ ] **All runtime tests pass** (15+ test cases)
- [ ] **All type tests pass** (6+ type assertions)
- [ ] No regressions in existing tests
- [ ] **All TODO markers addressed**

**Phase 4 STATUS:** Not Started

---

### Phase 5: Reporting - Import Categorization

**Goal:** Implement comprehensive import categorization reporting with normal and verbose modes.

**Deliverables:**

1. **Categorization Reporter** (`src/report/imports/categorization.ts`)
   - `reportCategorization(results, options)` - format categorization summaries
   - Normal mode: count summaries for each category
   - Verbose mode: add CSV list of external dependencies
   - Verbose mode: add detailed lists for other categories
   - Support --external flag (verbose for external deps only)
   - Support --deep flag (verbose for parent(deep) and child(deep) only)

2. **Formatting Utilities** (`src/report/imports/format.ts`)
   - Format category counts in readable table format
   - Format CSV lists for dependencies
   - Format detailed category breakdowns

**Tests:**

**Runtime:**
- Normal mode shows count summaries for all categories
- Verbose mode adds external dependency CSV list
- Verbose mode adds details for internal categories
- --external flag shows verbose output for external only
- --deep flag shows verbose output for deep paths only
- Flag combinations work correctly (--external --deep)
- Empty categories handled gracefully
- Large external dependency lists formatted readably

**Type Tests (MANDATORY):**
- Verify reporter options type structure
- Verify category formatting maintains narrow types

**Acceptance Criteria:**
- [ ] Normal mode displays count summaries clearly
- [ ] Verbose mode adds appropriate details
- [ ] --external and --deep flags work correctly
- [ ] Output is readable and well-formatted
- [ ] **All runtime tests pass** (18+ test cases)
- [ ] **All type tests pass** (7+ type assertions)
- [ ] No regressions in existing tests
- [ ] **All TODO markers addressed**

**Phase 5 STATUS:** Not Started

---

### Phase 6: Integration & End-to-End Testing

**Goal:** Ensure all components work together seamlessly with comprehensive integration tests.

**Deliverables:**

1. **Integration Tests** (`tests/integration/imports-command.test.ts`)
   - Full command execution with real TypeScript files
   - Test all reporting modes (normal, quiet, verbose)
   - Test all flag combinations
   - Test glob pattern filtering
   - Test JSON output mode
   - Test error scenarios (invalid files, empty results)

2. **Fixture Files** (`tests/fixtures/imports/`)
   - Create sample TypeScript files with various import patterns
   - Include files with combined imports
   - Include files with missing type modifiers
   - Include files with various categorization patterns
   - Include files with edge cases

3. **Documentation Update** (`README.md` or `docs/commands.md`)
   - Document the imports command
   - Provide usage examples
   - Explain categorization scheme
   - Show sample output

**Tests:**

**Runtime:**
- End-to-end command execution succeeds
- All fixture patterns detected correctly
- Output matches expected format for each mode
- Glob patterns filter fixtures correctly
- JSON output is valid and complete
- Error handling produces helpful messages

**Type Tests (MANDATORY):**
- Verify end-to-end type flow from CLI to output
- Verify fixture files type-check correctly

**Acceptance Criteria:**
- [ ] All integration tests pass
- [ ] Command works with real codebases (test on typed-tester itself)
- [ ] Documentation is clear and complete
- [ ] **All runtime tests pass** (15+ test cases)
- [ ] **All type tests pass** (5+ type assertions)
- [ ] No regressions in existing tests
- [ ] **All TODO markers addressed**
- [ ] Command ready for production use

**Phase 6 STATUS:** Not Started

---

## Testing Strategy

**CRITICAL: This is library code with complex TypeScript types. Type tests are MANDATORY for every phase.**

### Test Organization

- **Unit Tests**: `tests/unit/imports/` - test individual utilities (AST extraction, categorization)
- **Integration Tests**: `tests/integration/imports-command.test.ts` - test full command execution
- **Fixtures**: `tests/fixtures/imports/` - sample TypeScript files for testing

### TDD Workflow

Each phase follows strict TDD:

1. **SNAPSHOT** - Capture current state, scan for uncommitted changes
2. **CREATE LOG** - Initialize phase log in `.ai/logs/`
3. **WRITE TESTS** - Write failing tests first (runtime + type tests)
4. **IMPLEMENT** - Implement features to make tests pass
5. **TODO SCAN** - Ensure NO TODO markers remain in code
6. **CLOSEOUT** - Update phase log, verify all tests pass

### Coverage Goals

- All AST utilities: 100% coverage (small, focused functions)
- Analysis engine: 95%+ coverage
- Reporters: 90%+ coverage
- Integration tests: Cover all user-facing scenarios

### Type Testing Requirements

**Every phase MUST include type tests for:**

- Function parameter types
- Return type inference
- Generic type parameters
- Conditional type resolution
- Narrow type preservation (especially for categorization)

Use `inferred-types` utilities for type assertions:

```typescript
import type { Expect, AssertEqual, AssertExtends } from "inferred-types/types";

type cases = [
  Expect<AssertEqual<typeof result, ExpectedType>>,
  Expect<AssertExtends<ActualType, BaseType>>
];
```

## Dependencies

### Existing Dependencies (No New Installations)

- `ts-morph` - AST manipulation
- `command-line-args` - CLI parsing
- `fast-glob` - file pattern matching
- `chalk` - terminal coloring
- `inferred-types` - type utilities

### Internal Dependencies

- `src/ast/project.ts` - TypeScript project management
- `src/utils/linkFile.ts` - OSC8 link generation
- `src/types/imports/` - existing type definitions
- `src/constant.ts` - import category constants

## Risk Mitigation

### Risks

1. **Complex Categorization Logic** - Many edge cases in import path resolution
   - Mitigation: Comprehensive unit tests for each category, test with real codebases early

2. **AST API Changes** - ts-morph API may have nuances not immediately obvious
   - Mitigation: Study existing AST utilities in `src/ast/`, follow established patterns

3. **Performance** - Analyzing many files may be slow
   - Mitigation: Profile during Phase 6, optimize if needed (caching, parallel processing)

4. **Terminal Compatibility** - OSC8 links may not work in all terminals
   - Mitigation: Use existing `linkFile()` utility which handles this, graceful degradation

5. **Type Test Complexity** - Narrow type testing for categories may be challenging
   - Mitigation: Leverage `inferred-types` utilities, study existing type tests in project

## Success Metrics

### Phase Completion Metrics

Each phase is complete when:

- [ ] All deliverables implemented
- [ ] **All runtime tests written and passing**
- [ ] **All type tests written and passing** (MANDATORY)
- [ ] **ALL TODO markers addressed** (CRITICAL)
- [ ] No regressions in existing tests
- [ ] Tests migrated from WIP to permanent locations
- [ ] Phase log updated with completion notes

### Overall Success Criteria

- [ ] Command executes without errors on typed-tester codebase
- [ ] All three analysis types (combined, missing, categorization) work correctly
- [ ] All reporting modes (normal, quiet, verbose, JSON) work correctly
- [ ] All flags (--json, --quiet, --verbose, --external, --deep) work correctly
- [ ] Glob pattern filtering works correctly
- [ ] Output is clear, readable, and actionable
- [ ] Documentation is complete and accurate
- [ ] 85%+ overall test coverage
- [ ] 100% type test coverage for all public APIs
- [ ] Zero TODO markers in shipped code
- [ ] Code follows project conventions and style

## Architecture Notes

### AST Extraction Strategy

Use ts-morph's `getImportDeclarations()` on `SourceFile` objects. For each `ImportDeclaration`:

- Check `isTypeOnly()` for type imports
- Use `getNamedImports()`, `getDefaultImport()`, `getNamespaceImport()` for structure
- Use `getModuleSpecifierValue()` for path analysis
- Leverage TypeScript's type checker to determine if symbols are type-only

### Categorization Algorithm

```typescript
function categorizeImport(importDecl: ImportDeclaration, sourceFilePath: string): ImportCategory {
  const specifier = importDecl.getModuleSpecifierValue();

  // External check
  if (isExternalModule(specifier)) return 'external';

  // Internal categorization
  const structure = getStructure(importDecl); // barrel | named | default | hybrid
  const location = getLocation(specifier, sourceFilePath); // alias | aliasOffset | child | parent | peer | deep variants

  return `${structure}-${location}` as ImportCategory;
}
```

### Caching Considerations

Import analysis is relatively fast (compared to dependency graph building). Initial implementation may skip caching. If performance becomes an issue in Phase 6:

- Cache import extraction results by file hash
- Invalidate cache when file changes
- Use existing cache infrastructure patterns

## Next Steps

1. **Review this plan** with the user for approval
2. **Execute Phase 1** using phase-executor sub-agent
3. **Iterate through phases** sequentially, validating each before proceeding
4. **Monitor progress** via phase logs in `.ai/logs/`
5. **Adjust plan** if blockers or requirements change discovered during implementation

---

**Plan Status:** Ready for Execution

**Estimated Total Effort:** 12-16 hours across 6 phases

**Dependencies:** None (all tooling already in place)

**Blockers:** None identified
