# Phase 2: Test Command Subprocess Support

**Plan:** Subprocess Test Harness Refactoring
**Phase:** 2 of 5
**Started:** 2025-10-26
**Status:** In Progress

## Phase Goal

Integrate subprocess executor with the test harness specifically for the `test` command, replacing console interception.

## Deliverables

1. **Subprocess Test Harness** (`tests/helpers/subprocess-test-harness.ts`)
   - `runTestCommand()` function using subprocess executor
   - Parses JSON output from `test` command
   - Extracts error/warning counts, file results, execution time
   - Maintains performance tracking integration
   - Provides backward-compatible API with enhanced-test-harness

2. **Test Command Integration Tests** (`tests/integration/fast/test-subprocess.fast.test.ts`)
   - Test `test` command with passing tests
   - Test `test` command with failing tests
   - Test `test` command with type errors
   - Test `test` command with warnings
   - Test JSON output parsing
   - Test performance tracking
   - **Minimum 7 runtime tests**

## Starting Test Position

```xml
<test-snapshot date="2025-10-26" phase="2">
  <runtime-tests>
    <total>557</total>
    <passed>556</passed>
    <failed>0</failed>
    <skipped>1</skipped>
    <status>ALL PASSING</status>
    <note>Phase 1 added 9 subprocess executor tests</note>
  </runtime-tests>

  <type-tests>
    <status>Same baseline as Phase 1 (expected failures in fixtures)</status>
  </type-tests>
</test-snapshot>
```

## Repo Starting Position

**Last Commit:** f9de86e0300e58df43c0820b858d8f2e55a926a9

**Dirty Files:**
```
 M .dependencies.json
```

**Branch:** main

**Phase 1 Artifacts:**
- `tests/helpers/subprocess-executor.ts` - Core subprocess execution
- `tests/unit/helpers/subprocess-executor.test.ts` - 9 tests passing

## Acceptance Criteria

- [ ] `subprocess-test-harness.ts` implements test command via subprocess
- [ ] All test command integration tests pass (7+ tests)
- [ ] JSON output correctly parsed into structured results
- [ ] Error and warning counts accurately extracted
- [ ] Performance tracking preserved from old harness
- [ ] Backward-compatible API for gradual migration
- [ ] No console overrides in new code
- [ ] No regressions in existing tests

## Work Log

### 2025-10-26 - Session Start

- Captured SNAPSHOT: 557 tests (556 passing, 1 skipped)
- Created this log file
- Ready to write tests in `tests/integration/fast/`

**Next:** Write comprehensive integration tests for test command subprocess execution.
