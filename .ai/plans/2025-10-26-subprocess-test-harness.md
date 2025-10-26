# Subprocess Test Harness Refactoring

**Date:** 2025-10-26
**Status:** Ready for Execution
**Author:** Project Manager Agent

## Overview

Rewrite the integration test harness to use subprocess execution instead of in-process console interception. The current harness (`tests/helpers/enhanced-test-harness.ts`) is fundamentally flawed - it tries to capture console output by overriding `console.log/error` in the same process, which breaks in the Vitest environment. Over 40 integration tests are failing with "Test command produced no output", yet manual CLI execution works perfectly.

**Target Outcome:** A robust subprocess-based test harness that executes `bin/typed.js` as a real subprocess, captures actual stdout/stderr streams, and passes all 40+ existing integration tests.

## Scope

### In Scope

- Subprocess execution infrastructure using `child_process.spawn()`
- Real stdout/stderr stream capture (no console overrides)
- Support for all CLI commands: test, symbols, source, deps, files
- Exit code handling and error detection
- Performance tracking preservation
- JSON and text output parsing
- Migration of all existing integration tests
- Backward compatibility during migration

### Out of Scope

- Changes to CLI command implementations (only test infrastructure)
- New CLI features or commands
- Performance optimizations beyond current baseline
- Unit test changes (only integration tests affected)

## Design Constraints

### Architecture Principles

- **Real subprocess execution**: Tests must run CLI in separate process like real usage
- **No console tricks**: Eliminate all `console.log/error` overrides
- **Stream-based capture**: Use native Node.js stream APIs for output capture
- **Backward compatible**: New harness must support existing test patterns during migration
- **Performance preservation**: Must maintain or improve test execution speed
- **Error transparency**: Clear error messages when subprocess fails

### Testing Requirements

- **Runtime tests only**: This is infrastructure code - subprocess behavior is runtime
- **Integration-focused**: Tests validate end-to-end subprocess execution
- **Real CLI execution**: Tests must use actual `bin/typed.js` subprocess
- **Coverage**: All CLI commands (test, symbols, source, deps, files) must have subprocess tests

## Phases

### Phase 1: Core Subprocess Execution Infrastructure

**Goal:** Build and test the fundamental subprocess execution machinery that will replace console interception.

**Deliverables:**

1. **Subprocess Executor Module** (`tests/helpers/subprocess-executor.ts`)
   - `executeCliCommand()` function that spawns `bin/typed.js` subprocess
   - Captures stdout and stderr separately using stream listeners
   - Returns exit code, stdout content, stderr content, execution time
   - Handles subprocess errors and timeouts
   - Provides TypeScript types for execution results

2. **Subprocess Executor Tests** (`tests/unit/helpers/subprocess-executor.test.ts`)
   - Test successful command execution with output capture
   - Test error handling for invalid commands
   - Test exit code detection (0 for success, non-zero for failure)
   - Test timeout handling for long-running commands
   - Test stdout vs stderr separation
   - Test UTF-8 encoding and special characters

**Tests:**

**Runtime:**
- Execute simple CLI command (`bin/typed.js --help`) and verify output captured
- Execute command with JSON output and verify parseable
- Execute failing command and verify non-zero exit code
- Execute command with stderr output and verify separation from stdout
- Execute command with timeout and verify cleanup
- Execute multiple commands sequentially and verify isolation
- **Minimum 6 tests**

**Acceptance Criteria:**

- [ ] `subprocess-executor.ts` implements subprocess execution with stream capture
- [ ] All subprocess executor tests pass (6+ tests)
- [ ] Subprocess captures stdout and stderr separately
- [ ] Exit codes correctly detected (0 = success, non-zero = failure)
- [ ] Timeout mechanism prevents hanging tests
- [ ] TypeScript types exported for execution results
- [ ] No console overrides used
- [ ] No regressions in existing tests

**Phase 1 STATUS:** ✅ COMPLETE (2025-10-26)

---

### Phase 2: Test Command Subprocess Support

**Goal:** Integrate subprocess executor with the test harness specifically for the `test` command, replacing console interception.

**Deliverables:**

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

**Tests:**

**Runtime:**
- Execute `test` command on fixture with all passing tests
- Execute `test` command on fixture with type errors and verify error detection
- Execute `test` command on fixture with warnings and verify warning detection
- Execute `test` command with `--filter` flag and verify filtering works
- Execute `test` command with `--json` flag and verify JSON parsing
- Verify performance metrics captured correctly
- Verify exit codes: 0 for clean pass, non-zero for errors
- **Minimum 7 tests**

**Acceptance Criteria:**

- [ ] `subprocess-test-harness.ts` implements test command via subprocess
- [ ] All test command integration tests pass (7+ tests)
- [ ] JSON output correctly parsed into structured results
- [ ] Error and warning counts accurately extracted
- [ ] Performance tracking preserved from old harness
- [ ] Backward-compatible API for gradual migration
- [ ] No console overrides in new code
- [ ] No regressions in existing tests

**Phase 2 STATUS:** ✅ COMPLETE (2025-10-26)

---

### Phase 3: Other Commands Subprocess Support

**Goal:** Extend subprocess harness to support all remaining CLI commands (symbols, source, deps, files).

**Deliverables:**

1. **Full Subprocess Harness** (`tests/helpers/subprocess-test-harness.ts` - extended)
   - `runSymbolsCommand()` for symbols command
   - `runSourceCommand()` for source command
   - `runDepsCommand()` for deps command
   - `runFilesCommand()` for files command
   - Unified output parsing for JSON and text formats
   - Error handling for all command types

2. **Multi-Command Integration Tests** (`tests/integration/fast/multi-command-subprocess.fast.test.ts`)
   - Test symbols command with text output
   - Test symbols command with JSON output
   - Test source command with diagnostics
   - Test deps command with list view
   - Test deps command with graph view
   - Test files command with file listing

**Tests:**

**Runtime:**
- Execute `symbols` command and verify symbol listing
- Execute `symbols --json` and verify JSON output parsing
- Execute `source` command and verify diagnostic reporting
- Execute `deps` command in list mode and verify dependency output
- Execute `deps --graph` and verify graph visualization
- Execute `files` command and verify file listing
- Test all commands with `--filter` flag variations
- Verify exit codes for all commands
- **Minimum 8 tests**

**Acceptance Criteria:**

- [ ] All CLI commands supported via subprocess (test, symbols, source, deps, files)
- [ ] All multi-command integration tests pass (8+ tests)
- [ ] JSON parsing works for all commands that support `--json`
- [ ] Text output parsing handles formatting correctly
- [ ] Error detection works for all command types
- [ ] Filter flags work correctly via subprocess
- [ ] Unified API for all command types
- [ ] No regressions in existing tests

**Phase 3 STATUS:** ✅ COMPLETE (2025-10-26)

---

### Phase 4: Integration Test Migration

**Goal:** Migrate all 40+ existing integration tests from enhanced-test-harness to subprocess-test-harness.

**Deliverables:**

1. **Migrated Integration Tests**
   - Update `tests/integration/fast/*.fast.test.ts` to use subprocess harness
   - Update `tests/integration/*.test.ts` to use subprocess harness
   - Remove console override code from test setup
   - Verify all tests pass with subprocess execution

2. **Harness Consolidation**
   - Deprecate `enhanced-test-harness.ts`
   - Rename `subprocess-test-harness.ts` to `test-harness.ts`
   - Update exports in `tests/helpers/index.ts`
   - Remove unused console interception code

**Tests:**

**Runtime:**
- All existing integration tests continue to pass (40+ tests)
- No new test failures introduced by migration
- Performance maintained or improved
- **Verify 40+ existing tests pass**

**Acceptance Criteria:**

- [ ] All integration tests migrated to subprocess harness
- [ ] All 40+ integration tests passing
- [ ] `enhanced-test-harness.ts` removed
- [ ] `subprocess-test-harness.ts` renamed to `test-harness.ts`
- [ ] No console override code remains
- [ ] Test execution time maintained or improved
- [ ] Clean test output (no spurious warnings)
- [ ] Documentation updated in test helpers
- [ ] No regressions in any tests

**Phase 4 STATUS:** Not Started

---

### Phase 5: Performance Optimization and Edge Cases

**Goal:** Optimize subprocess execution performance and handle edge cases robustly.

**Deliverables:**

1. **Performance Optimizations**
   - Subprocess pooling for faster test execution (if beneficial)
   - Stream buffering tuning for large outputs
   - Timeout configuration per command type
   - Memory management for long test runs

2. **Edge Case Handling**
   - Very large output handling (multi-MB JSON)
   - Extremely long-running commands
   - Concurrent subprocess execution
   - Process cleanup on test interruption
   - Error recovery and retry logic

3. **Edge Case Tests** (`tests/integration/subprocess-edge-cases.test.ts`)
   - Test large output handling
   - Test timeout scenarios
   - Test concurrent execution
   - Test process cleanup
   - Test error recovery

**Tests:**

**Runtime:**
- Execute command with very large output (10MB+) and verify capture
- Execute long-running command and verify timeout handling
- Execute 5 commands concurrently and verify isolation
- Interrupt test mid-execution and verify cleanup
- Execute failing command and verify error recovery
- **Minimum 5 tests**

**Acceptance Criteria:**

- [ ] Performance optimizations implemented
- [ ] All edge case tests pass (5+ tests)
- [ ] Large outputs handled without memory issues
- [ ] Timeouts configured appropriately per command
- [ ] Concurrent execution safe and performant
- [ ] Process cleanup robust on interruption
- [ ] Error recovery prevents cascade failures
- [ ] No regressions in existing tests

**Phase 5 STATUS:** Not Started

---

## Testing Strategy

**CRITICAL: This is infrastructure code. Runtime tests validate subprocess behavior.**

### Test Organization

**Unit Tests** (`tests/unit/helpers/`):
- Subprocess executor core functionality
- Output parsing logic
- Error handling mechanisms
- Stream management

**Integration Tests** (`tests/integration/`):
- End-to-end CLI command execution
- Real subprocess spawning with actual `bin/typed.js`
- Output capture and parsing
- All CLI commands (test, symbols, source, deps, files)

### TDD Workflow

For each phase:

1. **Write failing tests first** - Test subprocess behavior before implementing
2. **Implement minimum code** - Make tests pass with subprocess executor
3. **Refactor** - Clean up subprocess handling, improve error messages
4. **Verify** - Run full test suite to ensure no regressions

### Coverage Goals

- 100% of CLI commands supported via subprocess
- All existing integration tests migrated and passing
- Edge cases covered (timeouts, errors, large outputs)
- Performance regression prevented

### Test Execution

```bash
# Run subprocess executor unit tests
pnpm test tests/unit/helpers/subprocess-executor.test.ts

# Run integration tests with subprocess harness
pnpm test tests/integration/fast/

# Run all tests
pnpm test

# Verify no type errors (should not be affected)
pnpm test:types
```

## Dependencies

**No new external dependencies required:**

- `child_process` (Node.js built-in)
- `stream` (Node.js built-in)
- `path` (Node.js built-in)
- Existing test infrastructure (Vitest, test helpers)

## Risk Mitigation

### Risks

1. **Subprocess overhead**: Spawning processes might slow down tests
   - **Likelihood**: Medium
   - **Impact**: Medium

2. **Platform differences**: Subprocess behavior might vary on Windows vs Unix
   - **Likelihood**: Low (CLI already cross-platform)
   - **Impact**: Medium

3. **Race conditions**: Async subprocess execution might introduce timing issues
   - **Likelihood**: Medium
   - **Impact**: High

4. **Migration breakage**: Existing tests might need significant updates
   - **Likelihood**: Medium
   - **Impact**: High

### Mitigation Strategies

1. **Subprocess overhead**:
   - Measure baseline performance before migration
   - Implement subprocess pooling if needed
   - Use fast integration tests (`.fast.test.ts`) for critical paths

2. **Platform differences**:
   - Test on both Unix and Windows in CI
   - Use Node.js path utilities for cross-platform compatibility
   - Handle platform-specific newlines (`\n` vs `\r\n`)

3. **Race conditions**:
   - Use proper Promise handling for subprocess completion
   - Implement timeout mechanisms
   - Test concurrent execution explicitly

4. **Migration breakage**:
   - Gradual migration phase-by-phase
   - Keep old harness until migration complete
   - Verify each test individually after migration

## Success Metrics

### Overall Success Criteria

- [ ] All 40+ integration tests passing with subprocess harness
- [ ] Zero console override code remaining
- [ ] Test execution time maintained or improved (baseline: <10s for fast suite)
- [ ] No false positives (spurious "no output" errors eliminated)
- [ ] All CLI commands supported (test, symbols, source, deps, files)
- [ ] Clean subprocess cleanup (no orphaned processes)

### Phase Completion Metrics

Each phase is complete when:

- [ ] All deliverables implemented
- [ ] All runtime tests written and passing
- [ ] No regressions in existing tests
- [ ] Phase-specific acceptance criteria met
- [ ] Code reviewed for subprocess best practices
- [ ] Documentation updated if needed

### Performance Benchmarks

**Baseline (current broken harness):**
- Fast integration suite: ~8-12s (when working)
- Full integration suite: ~30-40s (when working)

**Target (subprocess harness):**
- Fast integration suite: <12s (within 50% of baseline)
- Full integration suite: <50s (within 50% of baseline)
- Individual test: <2s (fast test requirement)

## Migration Plan

### Phase-by-Phase Approach

1. **Phase 1**: Build subprocess executor foundation (no migration)
2. **Phase 2**: Add test command support (parallel with old harness)
3. **Phase 3**: Add other commands support (parallel with old harness)
4. **Phase 4**: Migrate all tests, remove old harness
5. **Phase 5**: Optimize and harden

### Backward Compatibility

During Phases 2-3:
- Both harnesses available
- New tests use subprocess harness
- Old tests continue using enhanced harness
- No breaking changes to test APIs

### Migration Cutover

In Phase 4:
- Migrate tests one file at a time
- Verify each file before moving to next
- Track migration progress with checklist
- Remove old harness only after 100% migration

## Next Steps

1. **Review and approve this plan** - Ensure approach is sound before execution
2. **Execute Phase 1** - Build subprocess executor core
3. **Execute Phase 2** - Add test command support
4. **Execute Phase 3** - Add remaining commands
5. **Execute Phase 4** - Complete migration
6. **Execute Phase 5** - Optimize and harden

## Notes

- This is infrastructure refactoring, NOT a new feature - no type tests required
- Focus on runtime behavior: subprocess execution, stream capture, output parsing
- Gradual migration reduces risk of breaking all tests at once
- Subprocess approach is more robust and realistic than console interception
- Once complete, integration tests will work exactly like manual CLI usage
