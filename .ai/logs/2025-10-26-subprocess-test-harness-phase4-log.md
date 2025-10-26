# Phase 4: Integration Test Migration

**Plan:** Subprocess Test Harness Refactoring
**Phase:** 4 of 5
**Started:** 2025-10-26
**Status:** 🚧 IN PROGRESS

## Phase Goal

Migrate all 40+ existing integration tests from enhanced-test-harness to subprocess-test-harness, fixing the "Test command produced no output" failures.

## The Problem

The enhanced-test-harness uses console interception (`console.log` overrides) to capture CLI output when running commands in-process. This fundamentally doesn't work in the Vitest environment because:

1. The CLI commands output to real stdout/stderr streams
2. Console overrides don't capture stream-based output
3. Result: "Test command produced no output" errors in all integration tests

The fix: Migrate to subprocess execution where we capture real stdout/stderr streams.

## Starting Test Position

```xml
<test-snapshot date="2025-10-26" phase="4-start">
  <unit-tests>
    <total>557</total>
    <passed>556</passed>
    <skipped>1</skipped>
    <status>ALL PASSING</status>
  </unit-tests>
  <integration-tests>
    <total>183</total>
    <passed>115</passed>
    <failed>39</failed>
    <skipped>29</skipped>
    <status>39 FAILURES - "Test command produced no output"</status>
  </integration-tests>
</test-snapshot>
```

## Failing Test Files (6 files, 39 failures)

1. ✅ **tests/integration/fast/test.fast.test.ts** - NOT STARTED (at least 5 test failures)
2. ❌ **tests/integration/fast/symbols.fast.test.ts** - NOT STARTED (5 test failures)
3. ❌ **tests/integration/fast/source.fast.test.ts** - NOT STARTED (13 test failures)
4. ❌ **tests/integration/fast/files.fast.test.ts** - NOT STARTED (11 test failures)
5. ❌ **tests/integration/fast/deps.fast.test.ts** - NOT STARTED (likely has failures)
6. ❌ **tests/integration/fast/suite-validation.fast.test.ts** - NOT STARTED (status unknown)
7. ❌ **tests/integration/cli-commands-harness.test.ts** - NOT STARTED (2 test failures)
8. ❌ **tests/integration/test-reporting.test.ts** - NOT STARTED (3 test failures)

## Deliverables

1. **Migrated Integration Tests**
   - Update all test files to use subprocess-test-harness
   - Remove enhanced-test-harness imports
   - Remove console override setup
   - Simplify tests (no need for complex harness initialization)

2. **Harness Consolidation**
   - Remove `enhanced-test-harness.ts` (964 lines of console interception code)
   - Update any remaining references

## Acceptance Criteria

- [ ] All integration tests migrated to subprocess harness
- [ ] All 39+ failing integration tests now passing
- [ ] `enhanced-test-harness.ts` removed
- [ ] No console override code remains
- [ ] Test execution time maintained or improved
- [ ] Clean test output (no spurious warnings)
- [ ] No regressions in any tests

## Work Log

### 2025-10-26 - Phase 4 Start

- Captured SNAPSHOT: 556 unit tests passing, 39 integration tests failing
- Identified root cause: console interception doesn't work in Vitest environment
- Created this log file
- Ready to migrate test files one by one

### Migration Strategy

For each test file:
1. Read the current file to understand test structure
2. Remove enhanced-test-harness imports and initialization
3. Replace `harness.runXCommand()` with subprocess-test-harness functions
4. Simplify assertions (subprocess returns clean output, exit codes)
5. Run tests to verify migration successful
6. Move to next file

### Key Differences: Enhanced vs Subprocess Harness

**Enhanced (console interception):**
```typescript
const harness = EnhancedTestHarness.getInstance();
await harness.initialize(fixturePath);
const { result, metrics } = await harness.runTestCommand(options);
// Complex parsing of captured console output
```

**Subprocess (real execution):**
```typescript
const result = await runTestCommand(options, fixturePath);
// Clean stdout/stderr from real subprocess
expect(result.output).toContain(...);
expect(result.exitCode).toBe(0);
```

## Next Steps

1. Migrate `tests/integration/fast/test.fast.test.ts` (simplest, most critical)
2. Migrate `tests/integration/fast/symbols.fast.test.ts`
3. Migrate `tests/integration/fast/source.fast.test.ts`
4. Migrate `tests/integration/fast/files.fast.test.ts`
5. Migrate `tests/integration/fast/deps.fast.test.ts`
6. Migrate `tests/integration/fast/suite-validation.fast.test.ts`
7. Migrate remaining test files
8. Remove enhanced-test-harness.ts
9. Run full test suite and verify 100% passing
10. Update main plan to mark Phase 4 complete
