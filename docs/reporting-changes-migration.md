# Test Reporting Changes - Migration Guide

This guide explains changes to test reporting behavior and how they might affect your workflow.

## Overview of Changes

The test reporting system has been improved with several enhancements:

1. **Bug Fix: Missing Describe Blocks** - All non-skipped describe blocks are now displayed
2. **Bug Fix: Inconsistent Metrics** - Metrics are now calculated consistently across all hierarchy levels
3. **New Feature: Hide Zero-Type-Test Files** - Runtime-only test files are hidden by default
4. **Enhancement: Smart Hierarchy Display** - Redundant single describe blocks are hidden for cleaner output

## Breaking Changes

### None

**Good news:** There are **no breaking changes** to the API or command-line interface.

All changes are improvements to the visual output and do not affect:
- How tests are discovered
- How tests are executed
- How errors are reported
- Any command-line flags or options
- Any configuration files

## Behavior Changes

### 1. More Describe Blocks Visible (Bug Fix)

**Before:** Some non-skipped describe blocks were missing from output.

**After:** All non-skipped describe blocks are now correctly displayed.

**Impact:**
- You'll see **more output** for tests with multiple describe blocks
- This is a **bug fix**, so the new behavior is correct
- No action needed from you

**Example:**

Before (incorrect):
```
 ✓ test.ts (5 tests)
    [ ✓ ] First Block
       [ ✓ ] should work
    # Second Block was missing!
```

After (correct):
```
 ✓ test.ts (5 tests)
    [ ✓ ] First Block
       [ ✓ ] should work
    [ ✓ ] Second Block
       [ ✓ ] should also work
```

---

### 2. Consistent Metrics (Bug Fix)

**Before:** Metrics at file/describe/it levels were sometimes inconsistent.

**After:** Metrics are calculated consistently across all levels.

**Impact:**
- Metrics now **add up correctly**
- File metrics = sum of describe metrics
- Describe metrics = sum of nested describe + it metrics
- This is a **bug fix**, so the new behavior is correct
- No action needed from you

**Example:**

Before (incorrect):
```
 ✓ test.ts (5 tests, 2 type tests)  # Incorrect totals
    [ ✓ ] Block 1 [3 tests, 2 type tests]
    [ ✓ ] Block 2 [2 tests, 1 type test]  # Doesn't add up!
```

After (correct):
```
 ✓ test.ts (5 tests, 3 type tests)  # Correct totals
    [ ✓ ] Block 1 [3 tests, 2 type tests]
    [ ✓ ] Block 2 [2 tests, 1 type test]  # Now adds up: 3+1=4, 2+1=3 ✓
```

---

### 3. Zero-Type-Test Files Hidden by Default (New Feature)

**Before:** All test files shown, regardless of whether they contain type tests.

**After:** Test files with zero type tests are hidden by default.

**Impact:**
- **Less output** in default mode
- Summary shows how many files are hidden
- Use `--verbose` flag to see all files

**Migration Action:**

If you want to **always see all files** (including runtime-only files):

```bash
# Add --verbose to your test command
typed test --verbose
```

Or create an alias:
```bash
alias typed-test="typed test --verbose"
```

**Example:**

Before:
```
 ✓ calculator.test.ts (5 tests, 3 type tests)
    ...

 ✓ helpers.test.ts (3 tests, 0 type tests)  # Shown
    ...

TEST SUMMARY:
- 0 of 8 tests had errors
- 2 test files
```

After (default):
```
 ✓ calculator.test.ts (5 tests, 3 type tests)
    ...

TEST SUMMARY:
- 1 runtime-only file hidden (use --verbose to show)  # New hint
- 0 of 5 tests had errors
- 1 test file (1 hidden)
```

After (with --verbose):
```
 ✓ calculator.test.ts (5 tests, 3 type tests)
    ...

 ✓ helpers.test.ts (3 tests, 0 type tests)  # Now shown
    ...

TEST SUMMARY:
- 0 of 8 tests had errors
- 2 test files
```

---

### 4. Redundant Single Describe Hidden (Enhancement)

**Before:** All describe blocks shown, even when redundant.

**After:** Single top-level describe with no nesting is hidden (cleaner output).

**Impact:**
- **Less output** for simple test files
- Tests appear directly under file (no redundant describe level)
- Only affects **single** top-level describe with **no nesting**

**Migration Action:**

None needed. This is a visual improvement.

**Example:**

Before:
```
 ✓ calculator.test.ts (2 tests)
    [ ✓ ] Calculator Tests  # Redundant
       [ ✓ ] should add
       [ ✓ ] should subtract
```

After:
```
 ✓ calculator.test.ts (2 tests)
    [ ✓ ] should add        # Cleaner
    [ ✓ ] should subtract
```

**Note:** This only applies when:
- There's exactly ONE top-level describe
- It has NO nested describes
- It's NOT the special "Areas OUTSIDE" section

Multiple describes or nested describes are always shown.

---

## When Will I See Different Output?

### You'll See More Output If:

1. **You have multiple describe blocks** (Bug fix - they're now all shown)
2. **You use --verbose flag** (Runtime-only files now visible)

### You'll See Less Output If:

3. **Your test file has a single describe** (Redundant level hidden)
4. **You have runtime-only test files** (Hidden by default without --verbose)

---

## Common Scenarios

### Scenario 1: Simple Test File

**File structure:**
```typescript
describe("Calculator", () => {
  it("should add", () => { ... });
  it("should subtract", () => { ... });
});
```

**Change:** Describe level hidden (redundant).

**Before:**
```
 ✓ calculator.test.ts
    [ ✓ ] Calculator
       [ ✓ ] should add
       [ ✓ ] should subtract
```

**After:**
```
 ✓ calculator.test.ts
    [ ✓ ] should add
    [ ✓ ] should subtract
```

---

### Scenario 2: Multiple Describes

**File structure:**
```typescript
describe("Addition", () => { ... });
describe("Subtraction", () => { ... });
```

**Change:** All describes now shown (bug fix).

**Before (buggy):**
```
 ✓ calculator.test.ts
    [ ✓ ] Addition
       [ ✓ ] should add
    # Subtraction was missing!
```

**After (correct):**
```
 ✓ calculator.test.ts
    [ ✓ ] Addition
       [ ✓ ] should add
    [ ✓ ] Subtraction
       [ ✓ ] should subtract
```

---

### Scenario 3: Runtime-Only Test File

**File:** `helpers.test.ts` with no type tests.

**Change:** Hidden by default.

**Before:**
```
 ✓ helpers.test.ts (3 tests, 0 type tests)
    ...
```

**After (default):**
```
# File not shown

TEST SUMMARY:
- 1 runtime-only file hidden (use --verbose to show)
```

**After (with --verbose):**
```
 ✓ helpers.test.ts (3 tests, 0 type tests)
    ...

TEST SUMMARY:
# No mention of hidden files
```

---

## FAQ

### Q: Why are my runtime-only test files hidden?

**A:** By default, `typed-tester` focuses on type testing. Runtime-only files don't exercise the type system, so they're hidden to reduce noise.

Use `--verbose` to show them:
```bash
typed test --verbose
```

### Q: Why did my describe block disappear?

**A:** If you have a **single** top-level describe with **no nesting**, it's now hidden to reduce redundancy. This only affects the visual output—your tests still run normally.

If you want it visible, add **another** top-level describe or **nest** describes inside it.

### Q: Will this break my CI/CD pipeline?

**A:** No. All changes are visual improvements to the output. Test execution, error detection, and exit codes remain unchanged.

### Q: Can I revert to the old behavior?

**A:** There's no flag to revert bug fixes (they're fixes, not features). For zero-type-test file filtering, use `--verbose` to see all files.

### Q: Are there any performance changes?

**A:** No. These changes only affect the reporting layer, not test execution or analysis performance.

### Q: Do I need to update my test files?

**A:** No. All changes are to the reporting output, not to how you write or structure tests.

---

## Recommended Actions

1. **Review your test output** after updating to see the improvements
2. **Add --verbose to your workflow** if you rely on seeing runtime-only files
3. **Update any scripts that parse output** (if you have any) to account for new format
4. **Report any issues** if you encounter unexpected behavior

---

## Summary of Changes

| Change | Type | Impact | Action Needed |
|--------|------|--------|---------------|
| All describe blocks shown | Bug Fix | More output | None |
| Consistent metrics | Bug Fix | Correct totals | None |
| Hide zero-type-test files | Feature | Less output | Use `--verbose` if needed |
| Hide redundant single describe | Enhancement | Cleaner output | None |

---

## Getting Help

If you encounter issues or have questions:

1. Check the [Test Reporting Guide](./test-command-reporting.md)
2. Check the [Hierarchy Display Rules](./hierarchy-display-rules.md)
3. Use `typed test --help` for command options
4. Report issues at [github.com/typed-tester/issues](https://github.com/typed-tester/issues)

---

**Version:** These changes were introduced in version 0.14.0
**Date:** 2025-10-26
