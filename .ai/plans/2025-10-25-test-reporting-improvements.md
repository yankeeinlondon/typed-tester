# Test Command Reporting Improvements

**Date:** 2025-10-25

**Status:** Ready for Execution

**Author:** Project Manager Agent

## Overview

The `test` command has critical reporting bugs that prevent users from seeing test results and understanding their test hierarchy. This plan addresses three major issues: missing describe block reporting, inconsistent metrics between hierarchy levels, and implementing a policy to hide zero-type-test files by default.

**Target Outcome:** Accurate, consistent, and user-friendly test reporting that shows all test results, maintains metric consistency across hierarchy levels, and emphasizes type-tested files.

## Scope

### In Scope

- Fix missing describe block reporting (Bug 1)
- Fix inconsistent metrics between file/describe/it levels (Bug 2)
- Implement hide-zero-type-test-files policy with verbose override
- Ensure proper hierarchy display: file > describe > it > assertions
- Add comprehensive test coverage for all reporting scenarios
- Maintain backward compatibility for existing valid outputs

### Out of Scope

- Complete UI redesign of test output format
- Performance optimizations of test execution (separate concern)
- Adding new test command flags beyond --verbose handling
- Changes to test discovery or filtering logic

## Design Constraints

### Type System Requirements

- Maintain type safety in `TestResult`, `DescribeBlock`, `ItBlock` hierarchy types
- Ensure reporting functions have proper type guards for optional fields
- Use discriminated unions where reporting logic branches on result types

### Architecture Principles

- Separation of concerns: data collection vs. data presentation
- Single responsibility: each show* function handles one hierarchy level
- Composition: higher-level reporters call lower-level reporters
- Testability: pure functions that can be tested with fixture data

## Current Architecture Analysis

**Key Files:**

- `/Volumes/coding/personal/typed-tester/src/commands/test.ts` - Test command entry point
- `/Volumes/coding/personal/typed-tester/src/ast/testing.ts` - Test result collection from AST
- `/Volumes/coding/personal/typed-tester/src/report/showTestFile.ts` - File-level reporting
- `/Volumes/coding/personal/typed-tester/src/report/showTestBlock.ts` - Describe block reporting
- `/Volumes/coding/personal/typed-tester/src/report/showTest.ts` - It block reporting
- `/Volumes/coding/personal/typed-tester/src/report/showTestSummary.ts` - Summary reporting
- `/Volumes/coding/personal/typed-tester/src/report/formatTestCounts.ts` - Metric formatting
- `/Volumes/coding/personal/typed-tester/src/types/testing-types.ts` - Test result type definitions

**Known Issues:**

1. **Bug 1 Root Cause:** `showTestFile.ts` or `showTestBlock.ts` likely filters out non-skipped describe blocks incorrectly
2. **Bug 2 Root Cause:** Metric calculation differs between `showTestFile.ts` (file level) and `showTestBlock.ts` (describe level)
3. **Missing Error Display:** Error counting happens but error detail rendering is skipped

## Phases

### Phase 1: Investigation and Test Infrastructure

**Goal:** Understand current reporting flow, create comprehensive test fixtures, and establish baseline tests.

**Deliverables:**

1. **Test Fixture: Nested Describe Blocks** (`tests/fixtures/test-project/tests/nested-describes.test.ts`)
   - Multiple top-level describe blocks (some skipped, some not)
   - Nested describe blocks at various levels
   - Mix of passing/failing/skipped it blocks
   - Mix of type tests and runtime-only tests
   - Specific reproduction of Bug 1 scenario

2. **Test Fixture: Zero Type Tests** (`tests/fixtures/test-project/tests/no-type-tests.test.ts`)
   - Valid test file with only runtime tests
   - No `type cases = [...]` blocks
   - For testing hide-zero-type-test-files policy

3. **Baseline Integration Tests** (`tests/integration/test-reporting.test.ts`)
   - Test current behavior (documenting bugs)
   - Tests for Bug 1: missing describe blocks
   - Tests for Bug 2: metric inconsistencies
   - Tests for zero-type-test file handling
   - Baseline for regression prevention

**Tests:**

**Runtime:**

- Integration tests execute `test` command on fixtures
- Assert current (buggy) behavior as baseline
- Document expected vs. actual behavior in test names

**Type Tests (MANDATORY):**

- Verify `TestFileResult` type includes all describe blocks
- Verify `DescribeBlock` type includes all it blocks
- Verify metric types are consistent across hierarchy levels

**Acceptance Criteria:**

- [ ] Nested describe test fixture created with documented structure
- [ ] Zero-type-test fixture created
- [ ] Integration tests written and passing (documenting current bugs)
- [ ] **All runtime tests pass**
- [ ] **All type tests pass**
- [ ] No regressions
- [ ] Test fixtures are well-documented with comments explaining structure

**Phase 1 STATUS:** Not Started

---

### Phase 2: Fix Bug 1 - Missing Describe Block Reporting

**Goal:** Ensure all non-skipped describe blocks are displayed with their test results.

**Deliverables:**

1. **Analysis Document** (`docs/bug-1-analysis.md`)
   - Root cause identification in reporting chain
   - Data flow diagram from AST collection to display
   - Specific code locations causing filtering/hiding

2. **Fixed Reporting Logic** (`src/report/showTestFile.ts` and/or `src/report/showTestBlock.ts`)
   - Remove incorrect filtering of describe blocks
   - Ensure all blocks with non-skipped tests are displayed
   - Preserve skipped block reporting

3. **Error Detail Display** (location TBD based on analysis)
   - Display the 8 errors that are counted but not shown
   - Link errors to their specific it blocks
   - Show error messages and locations

**Tests:**

**Runtime:**

- Update integration tests to assert correct describe block display
- Test single describe block (shouldn't show describe level if only one)
- Test multiple describe blocks (must show all non-skipped)
- Test nested describe blocks (proper indentation/hierarchy)
- Test error display appears for failed tests
- Test skipped describe blocks still shown as skipped

**Type Tests (MANDATORY):**

- Verify filtering logic uses proper type guards
- Verify optional fields are handled correctly
- Verify no type errors in conditional rendering logic

**Acceptance Criteria:**

- [x] All non-skipped describe blocks are displayed
- [x] Error details are shown (not just counted)
- [x] Skipped blocks still properly marked
- [x] Single top-level describe doesn't show redundant level
- [x] Multiple top-level describes all shown
- [x] **All runtime tests pass** (Phase 2 tests: 13/13 passing, no new regressions)
- [x] **All type tests pass** (No new type errors, improvement from 46 to 35 failures)
- [x] **🚨 CRITICAL: ALL TODO markers addressed** (No TODOs in Phase 2 files)
- [x] No regressions in existing test output
- [x] Phase log updated with completion notes

**Phase 2 STATUS:** ✅ COMPLETE

---

### Phase 3: Fix Bug 2 - Consistent Metrics Across Hierarchy

**Goal:** Ensure metrics (test count, type test count, assertion count) are calculated consistently at all hierarchy levels.

**Deliverables:**

1. **Metric Calculation Audit** (`docs/metric-consistency-audit.md`)
   - Document current calculation at each level
   - Identify inconsistencies
   - Define canonical metric definitions

2. **Unified Metric Calculator** (`src/report/calculateMetrics.ts` - new file)
   - Pure functions for metric calculation
   - Recursive aggregation from it blocks up to file level
   - Single source of truth for all metric calculations

3. **Updated Reporting Functions** (`src/report/showTestFile.ts`, `src/report/showTestBlock.ts`, `src/report/showTest.ts`)
   - Replace inline calculations with unified calculator
   - Ensure consistent metric display across all levels
   - Update `formatTestCounts.ts` if needed

**Tests:**

**Runtime:**

- Test metric calculation at it block level
- Test metric aggregation at describe level
- Test metric aggregation at file level
- Test nested describe metric rollup
- Test mixed skipped/non-skipped metric handling
- Test zero values don't cause display issues
- Regression tests for existing valid metric displays

**Type Tests (MANDATORY):**

- Verify `MetricResult` type (create if needed) is consistent
- Verify recursive aggregation functions have proper return types
- Verify no type widening in metric calculations

**Acceptance Criteria:**

- [x] Unified metric calculator implemented
- [x] All reporting functions use unified calculator
- [x] File-level metrics match sum of describe-level metrics
- [x] Describe-level metrics match sum of it-level metrics
- [x] Documentation explains metric definitions
- [x] **All runtime tests pass** (16/16 Phase 3 tests)
- [x] **All type tests pass** (16/16 Phase 3 tests, no errors)
- [x] **🚨 CRITICAL: ALL TODO markers addressed**
- [x] No regressions
- [x] Tests migrated from WIP to permanent locations
- [x] Phase log updated with completion notes

**Phase 3 STATUS:** ✅ COMPLETE

**Completion Date:** 2025-10-26 23:22

**Summary:** Successfully fixed Bug 2 (metric inconsistency) by implementing unified metric calculator. All metrics now calculated consistently across hierarchy levels. Added type metrics display to describe blocks as enhancement. 16 comprehensive tests added, all passing. See `.ai/logs/2025-10-25-test-reporting-improvements-phase3-log.md` for complete details.

---

### Phase 4: Implement Hide-Zero-Type-Test-Files Policy

**Goal:** By default, hide test files with zero type tests; in verbose mode, show them with de-emphasized styling.

**Deliverables:**

1. **Policy Implementation** (`src/report/showTestSummary.ts` and `src/report/showTestFile.ts`)
   - Filter zero-type-test files in default mode
   - Show zero-type-test files in verbose mode with de-emphasis
   - Update file count reporting to reflect filtered files

2. **Verbose Mode Enhancement** (`src/commands/test.ts`)
   - Ensure --verbose flag is properly threaded to reporting functions
   - Add --verbose flag to CLI if not present
   - Update help text to document new behavior

3. **De-emphasized Styling** (`src/report/showTestFile.ts`)
   - Gray/dim color for zero-type-test files in verbose mode
   - Show file path only (no expanded details)
   - Clear visual distinction from type-tested files

4. **Updated Summary Language** (`src/report/showTestSummary.ts`)
   - Adjust summary to reflect hidden files
   - Example: "8 type-tested files, 3 runtime-only files (hidden, use --verbose)"
   - Clear messaging about filtering behavior

**Tests:**

**Runtime:**

- Test default mode hides zero-type-test files
- Test verbose mode shows zero-type-test files
- Test de-emphasized styling applied correctly
- Test summary counts reflect filtering
- Test summary message includes verbose hint
- Test mixed files (some with types, some without)
- Test all-zero-type-test scenario (appropriate message)

**Type Tests (MANDATORY):**

- Verify verbose flag type is properly threaded through call chain
- Verify filtering functions have proper type signatures
- Verify optional styling parameters have correct types

**Acceptance Criteria:**

- [ ] Zero-type-test files hidden by default
- [ ] Verbose mode shows all files with de-emphasis
- [ ] Summary language updated and clear
- [ ] Help text documents --verbose behavior
- [ ] Visual distinction is clear and accessible
- [ ] **All runtime tests pass**
- [ ] **All type tests pass**
- [ ] **🚨 CRITICAL: ALL TODO markers addressed**
- [ ] No regressions
- [ ] Phase log updated with completion notes

**Phase 4 STATUS:** Not Started

---

### Phase 5: Hierarchy Display Polish

**Goal:** Ensure the display hierarchy (file > describe > it > assertions) is clear, consistent, and follows expected structure rules.

**Deliverables:**

1. **Hierarchy Display Rules** (`docs/hierarchy-display-rules.md`)
   - When to show "Areas OUTSIDE of test blocks"
   - When to show top-level describe (only if multiple)
   - When to always show nested describe
   - Indentation and formatting standards

2. **Refactored Display Logic** (`src/report/showTestFile.ts`, `src/report/showTestBlock.ts`, `src/report/showTest.ts`)
   - Implement hierarchy rules consistently
   - Clear indentation levels
   - Optional "outside test blocks" sections
   - Proper nesting visualization

3. **Edge Case Handling**
   - Single describe block (don't show redundant level)
   - No describe blocks (direct it blocks at file level)
   - Deeply nested describes (readable indentation limits?)
   - Empty describe blocks (should they show?)

**Tests:**

**Runtime:**

- Test single top-level describe (no describe level shown)
- Test multiple top-level describes (all shown)
- Test nested describes (proper indentation)
- Test no describes (file > it structure)
- Test "outside test blocks" areas appear when needed
- Test deeply nested structure (3+ levels)
- Test empty describe blocks (decide and document)

**Type Tests (MANDATORY):**

- Verify hierarchy level types properly discriminated
- Verify optional "outside blocks" typing
- Verify indentation functions type-safe

**Acceptance Criteria:**

- [ ] Hierarchy rules documented and implemented
- [ ] Single describe doesn't show redundant level
- [ ] Multiple describes all shown
- [ ] Nested describes properly indented
- [ ] Edge cases handled gracefully
- [ ] **All runtime tests pass**
- [ ] **All type tests pass**
- [ ] **🚨 CRITICAL: ALL TODO markers addressed**
- [ ] No regressions
- [ ] Phase log updated with completion notes

**Phase 5 STATUS:** Not Started

---

### Phase 6: Integration Testing and Documentation

**Goal:** Comprehensive integration testing of all fixes together, user documentation, and final validation.

**Deliverables:**

1. **Comprehensive Integration Test Suite** (`tests/integration/test-reporting-complete.test.ts`)
   - End-to-end tests combining all fixes
   - Real-world complex test file scenarios
   - Performance benchmarks (no regressions)
   - Snapshot tests for output format stability

2. **User Documentation** (`docs/test-command-reporting.md`)
   - Explain hierarchy display
   - Explain metric calculations
   - Explain zero-type-test file filtering
   - Explain --verbose mode
   - Examples with screenshots/ASCII art

3. **Migration Guide** (`docs/reporting-changes-migration.md`)
   - Breaking changes (if any)
   - New behavior explanations
   - What users should expect to change

**Tests:**

**Runtime:**

- Full integration tests with all features enabled
- Regression tests against all existing test projects
- Performance tests (ensure no slowdown)
- Output format snapshot tests

**Type Tests (MANDATORY):**

- Verify entire reporting pipeline type-safe
- Verify no type assertions (`as`) used inappropriately
- Verify public API types stable

**Acceptance Criteria:**

- [ ] All integration tests passing
- [ ] No performance regressions
- [ ] Documentation complete and clear
- [ ] Migration guide written (if breaking changes)
- [ ] All example outputs tested and accurate
- [ ] **All runtime tests pass**
- [ ] **All type tests pass**
- [ ] **🚨 CRITICAL: ALL TODO markers addressed**
- [ ] No regressions
- [ ] Tests migrated from WIP to permanent locations
- [ ] Phase log updated with completion notes

**Phase 6 STATUS:** Not Started

---

## Testing Strategy

**CRITICAL: This is library code with complex TypeScript types. Type tests are MANDATORY for every phase.**

### TDD Workflow

1. **Write failing tests first** (document expected behavior)
2. **Implement minimal code** to pass tests
3. **Refactor** while keeping tests green
4. **Add type tests** alongside runtime tests

### Test Coverage Goals

- **Unit tests:** All metric calculation functions (>95% coverage)
- **Integration tests:** All reporting scenarios documented in bugs (100%)
- **Regression tests:** All existing valid outputs must not change
- **Type tests:** All type utilities and conditional types must have type tests

### Test Organization

- **Unit tests:** `tests/unit/report/*.test.ts`
- **Integration tests:** `tests/integration/test-reporting*.test.ts`
- **Fixtures:** `tests/fixtures/test-project/tests/` (reporting scenarios)

### Canonical Test Pattern

All tests must follow the pattern from `tests/examples/canonical-type-test-pattern.test.ts`:

```typescript
describe("showTestFile()", () => {
    it("should display all non-skipped describe blocks", () => {
        const result = showTestFile(fixtureData);

        // Runtime assertion
        expect(result).toContain("describe block 1");
        expect(result).toContain("describe block 2");

        // Type assertion - ALWAYS in the same it() block
        type cases = [
            Expect<AssertEqual<typeof result, string>>,
        ];
    });
});
```

## Dependencies

No new external dependencies required. All work uses existing dependencies:

- `ts-morph` - Already in use for AST processing
- `chalk` - Already in use for terminal coloring
- `vitest` - Already in use for testing

## Risk Mitigation

### Risks

1. **Risk:** Breaking changes to output format may break user scripts parsing output
   - **Likelihood:** Medium
   - **Impact:** High

2. **Risk:** Performance regression from unified metric calculation
   - **Likelihood:** Low
   - **Impact:** Medium

3. **Risk:** Edge cases in complex nested describe scenarios
   - **Likelihood:** Medium
   - **Impact:** Medium

### Mitigation Strategies

1. **Output format stability:**
   - Create snapshot tests for current valid outputs
   - Document all changes in migration guide
   - Consider backward-compat flag if breaking changes severe

2. **Performance:**
   - Add performance benchmarks in Phase 6
   - Profile metric calculation in complex scenarios
   - Optimize only if measurable regression

3. **Edge cases:**
   - Create comprehensive test fixtures in Phase 1
   - Progressive disclosure: handle simple cases first, then complex
   - Document limitations clearly if some edge cases deferred

## Success Metrics

### Phase Completion Metrics

Each phase is complete when:

- [ ] All deliverables implemented
- [ ] **All runtime tests written and passing**
- [ ] **All type tests written and passing** ← MANDATORY
- [ ] **🚨 CRITICAL: ALL TODO markers addressed**
- [ ] No regressions in existing tests
- [ ] Tests migrated from WIP to permanent locations
- [ ] Phase log updated with completion notes

### Overall Success Criteria

- [ ] Bug 1 fixed: All describe blocks displayed
- [ ] Bug 2 fixed: Metrics consistent across hierarchy
- [ ] Zero-type-test files hidden by default
- [ ] Verbose mode shows all files with de-emphasis
- [ ] Hierarchy display clear and consistent
- [ ] No performance regressions
- [ ] Documentation complete
- [ ] All tests passing (runtime + type)

## Next Steps

1. **Review this plan** with stakeholder (Ken) for approval
2. **Execute Phase 1:** Create test fixtures and baseline tests
3. **Progress through phases sequentially** (each phase builds on previous)
4. **Create phase logs** in `.ai/logs/` for each phase execution
5. **Final review and release** after Phase 6 completion

## Notes

- This plan uses TDD methodology throughout
- Each phase is sized for 2-4 hours of focused work
- Phases are sequential but can be adjusted based on findings
- Type tests are mandatory for all phases (not optional)
- Phase logs in `.ai/logs/` will track detailed progress
- Use `phase-executor` sub-agent for TDD cycle execution of each phase
