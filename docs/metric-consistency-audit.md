# Metric Consistency Audit

**Date:** 2025-10-26
**Phase:** 3 - Fix Bug 2 - Consistent Metrics Across Hierarchy
**Status:** Analysis Complete

---

## Executive Summary

**Problem:** Metrics (test count, type test count, assertion count) are calculated inconsistently across the test hierarchy (file/describe/it levels), leading to inaccurate reporting and user confusion.

**Root Cause:** Each reporting level uses different calculation approaches—file level uses flat mapping (incorrect for nested describes), describe level uses recursive counting (correct), and no unified calculation strategy exists.

**Impact:** Users see mismatched counts between file-level summaries and describe-level details, undermining trust in the tool's accuracy.

---

## Current Implementation Analysis

### File Level (`src/report/showTestFile.ts:98`)

**Location:** `showTestFile()` → `formatTestCounts()`

**Code:**
```typescript
// In formatTestCounts() at src/report/formatTestCounts.ts:11
const totalTests = testFile.blocks.flatMap(b => b.tests).length;
```

**Metrics Calculated:**
- `totalTests` - **INCORRECT for nested describes**
- `typeTests` - From `testFile.typeTests` (calculated during AST analysis)
- `assertions` - From `testFile.assertions` (calculated during AST analysis)

**Problem:**
- `flatMap(b => b.tests)` only gets immediate children of each top-level describe
- Ignores tests in nested describe blocks
- Example: File with structure `describe > describe > it` would miss the `it` block

**Example Bug:**
```typescript
// File structure:
describe("Level 1", () => {
    describe("Level 2", () => {
        it("test 1", () => { ... }); // This test is MISSED
        it("test 2", () => { ... }); // This test is MISSED
    });
});

// Current calculation:
// testFile.blocks = [Level 1 block]
// testFile.blocks.flatMap(b => b.tests) = []  // WRONG! Should be 2
```

**Accuracy:** ❌ INCORRECT

---

### Describe Block Level (`src/report/showTestBlock.ts:56-68`)

**Location:** `showTestBlock()` → internal `countTotalTests()` function

**Code:**
```typescript
function countTotalTests(b: TestBlock): number {
    let count = b.tests.length;
    if (b.blocks) {
        for (const nested of b.blocks) {
            count += countTotalTests(nested);
        }
    }
    return count;
}
const totalTests = countTotalTests(block);
```

**Metrics Calculated:**
- `totalTests` - **CORRECT** (recursive)
- `failingTests` - **CORRECT** (uses separate recursive `countFailingTests()`)
- `typeTests` - **MISSING** ❌
- `assertions` - **MISSING** ❌

**Problem:**
- Correctly counts total tests recursively
- **BUT** does NOT calculate or display:
  - How many tests have type assertions (`typeTests`)
  - How many total type assertions exist (`assertions`)
- Users cannot see type test coverage at describe level

**Accuracy:** ⚠️ PARTIAL - correct for test count, missing type metrics

---

### Test (it block) Level (`src/report/showTest.ts`)

**Location:** `showTest()`

**Code:**
```typescript
export function showTest(test: TypeTest, opt: AsOption<"test">, hasTypeTests = true) {
    // No metrics calculated or displayed
    // Only shows status icon and test description
}
```

**Metrics Calculated:**
- None - only displays test name and status

**Metrics Available (not displayed):**
- `test.hasTypeCases` - boolean indicating if test has type assertions
- `test.typeAssertionCount` - number of assertions in this test

**Problem:**
- Individual test metrics exist in the data structure but are not displayed
- Could be useful in verbose mode to show assertion count per test

**Accuracy:** ⚠️ N/A - metrics exist but not calculated/displayed

---

## Data Flow Analysis

### Where Metrics Come From

**Test File Level (`TestFile` interface):**
```typescript
export interface TestFile {
    typeTests: number;      // Calculated in AST analysis
    assertions: number;     // Calculated in AST analysis
    blocks: TestBlock[];
    // ...
}
```

**Source:** `src/ast/testing.ts` - calculated during AST traversal

**Test Block Level (`TestBlock` interface):**
```typescript
export interface TestBlock {
    tests: TypeTest[];
    blocks?: TestBlock[];  // Nested describes
    // NOTE: No typeTests or assertions fields!
}
```

**Source:** `src/ast/testing.ts` - structure defined, but no aggregated metrics

**Test Level (`TypeTest` interface):**
```typescript
export interface TypeTest {
    hasTypeCases: boolean;
    typeAssertionCount: number;
    // ...
}
```

**Source:** `src/ast/testing.ts` - calculated per test during AST analysis

---

## Identified Inconsistencies

### 1. Test Count Calculation Mismatch

**File Level:** Flat mapping (incorrect for nested)
**Describe Level:** Recursive counting (correct)

**Result:** File-level count can be LOWER than sum of describe-level counts when nested describes exist.

**Example:**
```
File: example.test.ts
├─ describe "Outer" (3 tests)  ← Describe level shows 3 correctly
│  ├─ it "test 1"
│  └─ describe "Inner"
│     ├─ it "test 2"
│     └─ it "test 3"
└─ Summary: (1 test)  ← File level shows 1 incorrectly!
```

---

### 2. Type Metrics Missing at Describe Level

**File Level:** Shows `typeTests` and `assertions`
**Describe Level:** Shows neither

**Result:** Users cannot understand type test coverage at describe block granularity.

**Example:**
```
File: example.test.ts (5 tests, 3 type tests, 10 assertions)
└─ describe "Feature A" [5 tests, no errors]
   ├─ it "test 1"
   ├─ it "test 2" (has type cases)
   └─ it "test 3" (has type cases)

Q: How many type tests are in "Feature A"?
A: Unknown - not displayed! Should be "2 type tests, 8 assertions"
```

---

### 3. No Unified Calculation Strategy

**Current State:**
- File level: uses `testFile.typeTests` (from AST)
- Describe level: calculates on-the-fly with custom recursive function
- No shared logic between levels

**Result:**
- Duplication of calculation logic
- Risk of divergence if one is updated without the other
- Hard to maintain and verify correctness

---

## Canonical Metric Definitions

### Metrics

1. **`totalTests`** - Total number of `it()` blocks at this level and below (recursively)
   - **Scope:** File, Describe, It(1)
   - **Calculation:** Recursive sum of all `test.length` in hierarchy
   - **Example:** File with 3 describes, each with 2 tests = 6 total tests

2. **`typeTests`** - Number of tests that contain `type cases = [...]` declarations
   - **Scope:** File, Describe
   - **Calculation:** Count of tests where `test.hasTypeCases === true`
   - **Example:** 6 total tests, 4 have type cases = 4 type tests

3. **`assertions`** - Total number of type assertions across all `type cases` arrays
   - **Scope:** File, Describe
   - **Calculation:** Sum of all `test.typeAssertionCount` values
   - **Example:** 4 type tests with [3, 2, 5, 1] assertions = 11 assertions

4. **`skippedTests`** - Number of tests marked with `.skip`
   - **Scope:** File, Describe
   - **Calculation:** Count of tests where `test.skip === true`
   - **Example:** 6 total tests, 1 skipped = 1 skipped test

5. **`failingTests`** - Number of tests with type errors
   - **Scope:** Describe only (already calculated correctly)
   - **Calculation:** Count of tests where `getErrorDiagnostics(test.diagnostics).length > 0`

6. **`activeTests`** - Total tests minus skipped tests
   - **Scope:** File (currently calculated correctly in `formatTestCounts`)
   - **Calculation:** `totalTests - skippedTests`

---

### Calculation Rules

**Bottom-Up Aggregation:**
- Start at leaf level (individual `it` blocks)
- Aggregate metrics recursively upward through nested describes
- Top-level file metrics are sum of all top-level describe blocks

**Recursive Formula:**
```typescript
For a given level L (TestBlock or TestFile):

totalTests(L) = L.tests.length + sum(totalTests(L.blocks[i])) for all nested blocks
typeTests(L) = count(L.tests where hasTypeCases) + sum(typeTests(L.blocks[i]))
assertions(L) = sum(L.tests[j].typeAssertionCount) + sum(assertions(L.blocks[i]))
skippedTests(L) = count(L.tests where skip) + sum(skippedTests(L.blocks[i]))
```

**Consistency Invariant:**
```
File metrics MUST equal sum of all top-level describe blocks
Describe metrics MUST equal sum of its tests + sum of nested describe blocks
```

---

## Proposed Solution Architecture

### 1. Unified Metric Calculator Module

**File:** `src/report/calculateMetrics.ts` (new file)

**Purpose:** Single source of truth for all metric calculations

**Functions:**
```typescript
// Calculate metrics for a single test (leaf level)
function calculateTestMetrics(test: TypeTest): TestMetrics

// Calculate metrics for a describe block (recursive)
function calculateBlockMetrics(block: TestBlock, opt: AsOption<"test">): TestMetrics

// Calculate metrics for entire file (aggregates top-level blocks)
function calculateFileMetrics(file: TestFile, opt: AsOption<"test">): TestMetrics
```

**Type Definition:**
```typescript
interface TestMetrics {
    totalTests: number;
    typeTests: number;
    assertions: number;
    skippedTests: number;
    activeTests: number;
    failingTests: number;  // describe level only
}
```

### 2. Update Reporting Functions

**Changes Required:**

1. **`src/report/formatTestCounts.ts`**
   - Replace inline calculation with `calculateFileMetrics(testFile, opt)`
   - Ensures correct recursive counting

2. **`src/report/showTestBlock.ts`**
   - Replace inline `countTotalTests()` with `calculateBlockMetrics(block, opt)`
   - Add display of `typeTests` and `assertions` to block line
   - Example: `[5 tests, 3 type tests, 10 assertions, no errors]`

3. **`src/report/showTest.ts`**
   - Optionally add assertion count in verbose mode
   - Example: ` ✔  should work (3 assertions)`

### 3. Add Type Tests to TestBlock Interface

**Consideration:** Should we add `typeTests` and `assertions` to `TestBlock` during AST analysis?

**Decision:** NO - calculate on-demand in reporting layer
- **Reason:** Separation of concerns - AST focuses on structure extraction, reporting calculates metrics for display
- **Performance:** Negligible - recursive calculation is fast (O(n) where n = tests)
- **Flexibility:** Allows filtering by options (e.g., skip ignored tests) without re-analyzing AST

---

## Validation Strategy

### Test Coverage

1. **Unit Tests** (new file: `tests/unit/WIP/phase3-metric-calculation.test.ts`)
   - Test `calculateTestMetrics()` with various test configurations
   - Test `calculateBlockMetrics()` with flat and nested describes
   - Test `calculateFileMetrics()` matches expected values
   - Test edge cases: empty blocks, all skipped, no type tests

2. **Integration Tests** (update existing: `tests/unit/WIP/test-reporting.test.ts`)
   - Use `nested-describes.test.ts` fixture to verify correct counts
   - Verify file-level counts match describe-level aggregation
   - Verify output display includes type metrics at all levels

3. **Type Tests** (MANDATORY)
   - Verify `TestMetrics` type is consistent
   - Verify return types of calculator functions
   - Verify no type widening in calculations

### Regression Prevention

**Invariant Checks:**
```typescript
// File level metrics MUST equal sum of top-level blocks
const fileTotalTests = calculateFileMetrics(file).totalTests;
const blockSum = file.blocks.map(b => calculateBlockMetrics(b).totalTests).reduce((a,b) => a+b, 0);
expect(fileTotalTests).toBe(blockSum);
```

**Snapshot Tests:**
- Capture current output for existing valid test files
- Ensure metric changes don't alter output format unexpectedly

---

## Acceptance Criteria

- [ ] Unified metric calculator implemented in `src/report/calculateMetrics.ts`
- [ ] All reporting functions use unified calculator (no inline calculations)
- [ ] File-level metrics match sum of top-level describe-level metrics
- [ ] Describe-level metrics match sum of its tests + nested blocks
- [ ] Describe blocks display `typeTests` and `assertions` counts
- [ ] Documentation explains metric definitions clearly
- [ ] All runtime tests pass
- [ ] All type tests pass
- [ ] No regressions in existing test output
- [ ] Validation tests confirm invariants hold

---

## Next Steps

1. ✅ Complete this audit document
2. ⏭️ Write tests for unified metric calculator (TDD)
3. ⏭️ Implement `src/report/calculateMetrics.ts`
4. ⏭️ Update `src/report/formatTestCounts.ts`
5. ⏭️ Update `src/report/showTestBlock.ts`
6. ⏭️ Run full test suite and verify no regressions
7. ⏭️ Update phase log with completion notes
