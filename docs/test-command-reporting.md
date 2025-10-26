# Test Command Reporting Guide

This guide explains how the `typed test` command reports test results, including the hierarchy display, metric calculations, and file filtering.

## Table of Contents

- [Overview](#overview)
- [Hierarchy Display](#hierarchy-display)
- [Metric Calculations](#metric-calculations)
- [File Filtering](#file-filtering)
- [Output Format](#output-format)
- [Examples](#examples)

---

## Overview

The `typed test` command runs type tests and provides detailed, hierarchical output showing:
- Test file results with status icons
- Describe block organization
- Individual test results
- Type test counts and assertions
- Type errors and their locations

The reporting system follows these principles:
1. **Clarity**: Clear visual hierarchy from file → describe → it → assertions
2. **Consistency**: Metrics calculated consistently across all levels
3. **Focus**: Emphasize type-tested files by hiding runtime-only files by default
4. **Efficiency**: Hide redundant information while preserving meaningful structure

---

## Hierarchy Display

### Test Hierarchy Levels

Tests are organized in a four-level hierarchy:

```
File
└── Describe Block (optional, may be hidden)
    └── Nested Describe Block (always shown if present)
        └── It Block (test)
            └── Assertions (type tests)
```

### When Describe Blocks Are Shown

**The display logic depends on the structure:**

#### Single Top-Level Describe (Hidden if Redundant)

When a test file has a single `describe` block with no nesting, showing it would be redundant:

```typescript
// Example: single-describe.test.ts
describe("Calculator Tests", () => {
  it("should add numbers", () => { ... });
  it("should subtract numbers", () => { ... });
});
```

**Output (redundant describe hidden):**
```
 ✓ calculator.test.ts (2 tests, 2 type tests)
    [ ✓ ] should add numbers
    [ ✓ ] should subtract numbers
```

#### Multiple Top-Level Describes (All Shown)

When multiple `describe` blocks exist at the top level, all are shown:

```typescript
// Example: multiple-describes.test.ts
describe("Addition", () => {
  it("should add positive numbers", () => { ... });
});

describe("Subtraction", () => {
  it("should subtract numbers", () => { ... });
});
```

**Output (all describes shown):**
```
 ✓ calculator.test.ts (2 tests, 2 type tests)
    [ ✓ ] Addition [1 test, 1 type test]
       [ ✓ ] should add positive numbers
    [ ✓ ] Subtraction [1 test, 1 type test]
       [ ✓ ] should subtract numbers
```

#### Nested Describes (Always Shown)

Nested `describe` blocks are always shown because they provide meaningful organization:

```typescript
// Example: nested-describes.test.ts
describe("API", () => {
  describe("GET /users", () => {
    it("should return user list", () => { ... });
  });

  describe("POST /users", () => {
    it("should create user", () => { ... });
  });
});
```

**Output (nested describes always shown):**
```
 ✓ api.test.ts (2 tests, 2 type tests)
    [ ✓ ] API [2 tests, 2 type tests]
        [ ✓ ] GET /users [1 test, 1 type test]
           [ ✓ ] should return user list
        [ ✓ ] POST /users [1 test, 1 type test]
           [ ✓ ] should create user
```

### Special Section: "Areas OUTSIDE of tests blocks"

This section appears when TypeScript errors exist outside of `describe`/`it` blocks:

```
 ⤬ test.ts (1 test, 1 error)
    [ ⤬ ] Areas OUTSIDE of tests blocks [0 tests, 1 error]
       - [ ⛒, code: 2307 ] Cannot find module './missing'
    [ ✓ ] Tests [1 test]
       [ ✓ ] should work
```

This section is **always shown** (never hidden as redundant) because it represents structural errors that aren't part of test logic.

### Indentation Rules

Indentation follows these rules:

| Level | Indent | Example |
|-------|--------|---------|
| File | None | `✓ test.ts` |
| Top-level describe (shown) | 1 level (4 spaces) | `    [ ✓ ] Top Level` |
| Top-level describe (hidden) | 0 levels | Tests shown at file level |
| It block (under shown describe) | 2 levels (8 spaces) | `        [ ✓ ] should work` |
| It block (under hidden describe) | 1 level (4 spaces) | `    [ ✓ ] should work` |
| Nested describe (1 level deep) | 2 levels (8 spaces) | `        [ ✓ ] Nested` |
| It block (under nested) | 3 levels (12 spaces) | `            [ ✓ ] test` |

**Formula:**
- Base indent = 1 (4 spaces)
- Each nesting level adds 1 to indent
- Redundant single describe: reduce all indents by 1

---

## Metric Calculations

### What Metrics Are Shown

At every level (file, describe, it), you'll see:
- **Total tests**: Number of `it()` blocks
- **Type tests**: Number of tests containing type assertions
- **Assertions**: Total number of type assertions across all tests
- **Skipped**: Number of skipped tests (if any)

### Consistency Across Hierarchy

**All metrics are calculated consistently** using a unified metric calculator. This ensures:
- File-level metrics = sum of all describe-level metrics
- Describe-level metrics = sum of all nested describe metrics + direct it blocks
- It-level metrics = type tests and assertions in that specific test

**Example:**

```
 ✓ api.test.ts (5 tests, 3 type tests, 8 assertions)
    [ ✓ ] Authentication [3 tests, 2 type tests, 5 assertions]
        [ ✓ ] Login [2 tests, 2 type tests, 4 assertions]
           [ ✓ ] should login with credentials
           [ ✓ ] should reject invalid credentials
        [ ✓ ] Logout [1 test, 0 type tests, 1 assertion]
           [ ✓ ] should logout successfully
    [ ✓ ] Authorization [2 tests, 1 type test, 3 assertions]
       [ ✓ ] should check permissions
       [ ✓ ] should handle admin access
```

In this example:
- File total (5 tests) = Authentication (3) + Authorization (2) ✓
- Authentication (3 tests) = Login (2) + Logout (1) ✓
- File type tests (3) = Authentication (2) + Authorization (1) ✓

### How Metrics Are Calculated

- **Total tests**: Count of all `it()` blocks (including skipped)
- **Type tests**: Count of `it()` blocks containing `type cases = [...]` arrays
- **Assertions**: Sum of all type assertions within `type cases` arrays
- **Skipped**: Count of `it.skip()` or `it.todo()` blocks

---

## File Filtering

### Hide Zero-Type-Test Files (Default)

By default, test files with **zero type tests** are hidden from the output. This focuses attention on type-tested files.

**Example:**

If you have these test files:
- `calculator.test.ts` - 5 tests, 3 with type tests
- `helpers.test.ts` - 3 tests, 0 type tests (runtime only)

**Default output:**
```
 ✓ calculator.test.ts (5 tests, 3 type tests, 8 assertions)
    ...

TEST SUMMARY:

- 1 runtime-only file hidden (use --verbose to show)

- 0 of 5 tests had errors
- 0 of 1 test file had errors
- 3 of 5 tests have type tests (8 total assertions)
```

Notice:
- `helpers.test.ts` is not shown
- Summary mentions "1 runtime-only file hidden"
- Hint to use `--verbose` to show it

### Show All Files (Verbose Mode)

Use the `--verbose` (or `-v`) flag to show all files, including runtime-only files:

```bash
typed test --verbose
```

**Verbose output:**
```
 ✓ calculator.test.ts (5 tests, 3 type tests, 8 assertions)
    ...

 ✓ helpers.test.ts (3 tests, 0 type tests, 0 assertions)
    ...

TEST SUMMARY:

- 0 of 8 tests had errors
- 0 of 2 test files had errors
- 3 of 8 tests have type tests (8 total assertions)
```

Now `helpers.test.ts` is shown, and the summary reflects all files.

### Why This Default?

**Rationale:** `typed-tester` focuses on **type testing**. Runtime-only test files don't exercise the type system, so they're hidden by default to:
1. Reduce noise in output
2. Highlight files that actually test types
3. Encourage type test adoption

**Note:** You can still run `typed test` on runtime-only files—they just won't be shown in the default output unless you use `--verbose`.

---

## Output Format

### Status Icons

| Icon | Meaning | Color |
|------|---------|-------|
| ✓ | Pass (all tests passed) | Green |
| ⤬ | Error/Fail (type errors or failed tests) | Red |
| ⇣ | Skipped (all tests skipped) | Gray |
| ⛒ | Type Error (specific diagnostic) | Red |
| ⚠️ | Warning (downgraded error) | Yellow |

### File-Level Output

```
 ✓ path/to/test-file.test.ts (5 tests, 3 type tests, 8 assertions) 25ms
```

Components:
- `✓` - Status icon
- `path/to/test-file.test.ts` - File path (relative to project root)
- `(5 tests, 3 type tests, 8 assertions)` - Metrics
- `25ms` - Execution time

### Describe Block Output

```
    [ ✓ ] Describe Block Name [3 tests, 2 type tests, 5 assertions]
```

Components:
- Indentation (4 spaces per level)
- `[ ✓ ]` - Status icon in brackets
- `Describe Block Name` - Block description
- `[3 tests, 2 type tests, 5 assertions]` - Metrics in brackets

### It Block Output

```
       [ ✓ ] should do something
```

Components:
- Indentation (4 spaces per level)
- `[ ✓ ]` - Status icon in brackets
- `should do something` - Test description

### Error Output

```
       [ ⛒ ] should validate types
           - [ ⛒, code: 2344 ] Type 'string' does not satisfy the constraint 'number'.
              at line 42, column 10
```

Components:
- Test marked with error icon
- Error details indented below
- Error code (links to TypeScript documentation)
- Error message
- Location (line and column)

---

## Examples

### Example 1: Simple File with Single Describe

**Code:**
```typescript
// calculator.test.ts
describe("Calculator", () => {
  it("should add numbers", () => {
    const result = add(2, 3);
    expect(result).toBe(5);

    type cases = [
      Expect<AssertEqual<typeof result, number>>,
    ];
  });

  it("should subtract numbers", () => {
    const result = subtract(5, 3);
    expect(result).toBe(2);

    type cases = [
      Expect<AssertEqual<typeof result, number>>,
    ];
  });
});
```

**Output:**
```
 ✓ calculator.test.ts (2 tests, 2 type tests, 2 assertions) 15ms
    [ ✓ ] should add numbers
    [ ✓ ] should subtract numbers
```

**Why:** Single describe is hidden (redundant).

---

### Example 2: Multiple Top-Level Describes

**Code:**
```typescript
// math.test.ts
describe("Addition", () => {
  it("should add positive numbers", () => { ... });
});

describe("Subtraction", () => {
  it("should subtract numbers", () => { ... });
});

describe("Multiplication", () => {
  it("should multiply numbers", () => { ... });
});
```

**Output:**
```
 ✓ math.test.ts (3 tests, 3 type tests, 3 assertions) 18ms
    [ ✓ ] Addition [1 test, 1 type test, 1 assertion]
       [ ✓ ] should add positive numbers
    [ ✓ ] Subtraction [1 test, 1 type test, 1 assertion]
       [ ✓ ] should subtract numbers
    [ ✓ ] Multiplication [1 test, 1 type test, 1 assertion]
       [ ✓ ] should multiply numbers
```

**Why:** Multiple describes all shown.

---

### Example 3: Nested Describes

**Code:**
```typescript
// api.test.ts
describe("User API", () => {
  describe("GET /users", () => {
    it("should return user list", () => { ... });
    it("should filter by query", () => { ... });
  });

  describe("POST /users", () => {
    it("should create user", () => { ... });
  });
});
```

**Output:**
```
 ✓ api.test.ts (3 tests, 3 type tests, 6 assertions) 22ms
    [ ✓ ] User API [3 tests, 3 type tests, 6 assertions]
        [ ✓ ] GET /users [2 tests, 2 type tests, 4 assertions]
           [ ✓ ] should return user list
           [ ✓ ] should filter by query
        [ ✓ ] POST /users [1 test, 1 type test, 2 assertions]
           [ ✓ ] should create user
```

**Why:** Nested describes always shown.

---

### Example 4: File with Type Errors

**Code:**
```typescript
// failing.test.ts
describe("Type Validation", () => {
  it("should validate user type", () => {
    const user = { name: "Alice", age: 30 };

    type cases = [
      Expect<AssertEqual<typeof user, { name: string; age: string }>>, // ERROR: age is number
    ];
  });
});
```

**Output:**
```
 ⤬ failing.test.ts (1 test, 1 type test, 1 assertion, 1 error) 12ms
    [ ⤬ ] should validate user type
        - [ ⛒, code: 2344 ] Type 'false' does not satisfy the constraint 'true'.
           at line 8, column 10
           Expected: { name: string; age: string }
           Received: { name: string; age: number }
```

**Why:** Test has type error, shown with error icon and details.

---

### Example 5: Mixed Type-Tested and Runtime-Only Files

**Scenario:** Project has 3 test files:
- `typed.test.ts` - 5 tests, 3 with type tests
- `runtime-only.test.ts` - 2 tests, 0 type tests
- `helpers.test.ts` - 4 tests, 2 with type tests

**Default Output (without --verbose):**
```
 ✓ typed.test.ts (5 tests, 3 type tests, 8 assertions) 18ms
    ...

 ✓ helpers.test.ts (4 tests, 2 type tests, 4 assertions) 15ms
    ...

TEST SUMMARY:

- 1 runtime-only file hidden (use --verbose to show)

- 0 of 9 tests had errors
- 0 of 2 test files had errors
- 5 of 9 tests have type tests (12 total assertions)
```

**Verbose Output (with --verbose):**
```
 ✓ typed.test.ts (5 tests, 3 type tests, 8 assertions) 18ms
    ...

 ✓ runtime-only.test.ts (2 tests, 0 type tests, 0 assertions) 8ms
    ...

 ✓ helpers.test.ts (4 tests, 2 type tests, 4 assertions) 15ms
    ...

TEST SUMMARY:

- 0 of 11 tests had errors
- 0 of 3 test files had errors
- 5 of 11 tests have type tests (12 total assertions)
```

---

## Summary

The `typed test` reporting system provides:
- **Clear hierarchy**: File → Describe → It → Assertions
- **Consistent metrics**: Calculated uniformly at all levels
- **Focused output**: Hide runtime-only files by default
- **Smart hiding**: Hide redundant single describes
- **Detailed errors**: Show type errors with context

Use `--verbose` to see all files and `--help` for additional options.

For technical details on the hierarchy logic, see [`docs/hierarchy-display-rules.md`](./hierarchy-display-rules.md).
