# Hierarchy Display Rules

This document defines the rules for displaying the test hierarchy in `typed-tester` output.

## Hierarchy Levels

The test reporting system follows this hierarchy:

```
File
└── Describe Block (optional, may be hidden)
    └── Nested Describe Block (always shown if present)
        └── It Block (test)
            └── Assertions (type tests)
```

## Core Display Rules

### 1. File Level (Always Shown)

The file level is always displayed with:
- File path (relative to project root)
- Test counts (total tests, type tests, assertions)
- Status icon (✓, ⤬, ⇣)
- Timing information
- Warning count (if applicable)

### 2. Top-Level Describe Blocks (Conditional)

**Rule: Hide single top-level describe if it's redundant**

A single top-level describe block is considered **redundant** and should be hidden when:
- There is exactly ONE top-level describe block in the file, AND
- It has NO nested describe blocks, AND
- It is NOT the special "Areas OUTSIDE of tests blocks" section

**When to SHOW single top-level describe:**
- Multiple top-level describe blocks exist
- Single describe has nested describe blocks inside it
- Single describe is "Areas OUTSIDE of tests blocks"
- File has no describe blocks (tests at file level)

**Why this rule exists:**
When a test file has a single describe block wrapping all tests, showing it creates visual redundancy:

```
# Redundant (bad):
 ✓ calculator.test.ts (5 tests, 3 type tests)
    [ ✓ ] Calculator Tests [5 tests, 3 type tests]
       [ ✓ ] should add numbers
       [ ✓ ] should subtract numbers
       ...

# Clean (good):
 ✓ calculator.test.ts (5 tests, 3 type tests)
    [ ✓ ] should add numbers
    [ ✓ ] should subtract numbers
    ...
```

### 3. Nested Describe Blocks (Always Shown)

Nested describe blocks are ALWAYS shown because they provide meaningful organizational context.

```
 ✓ api.test.ts (10 tests, 5 type tests)
    [ ✓ ] GET /users [3 tests, 2 type tests]
       [ ✓ ] should return user list
       [ ✓ ] should filter by query
    [ ✓ ] POST /users [2 tests, 1 type test]
       [ ✓ ] should create user
```

### 4. Special Section: "Areas OUTSIDE of tests blocks"

This special section is shown when:
- TypeScript errors exist outside of describe/it blocks
- Errors are in imports, top-level code, or type definitions

This section is ALWAYS shown (never hidden as redundant) because it represents structural errors.

## Indentation Rules

Indentation follows these rules:

| Level | Indent | Example |
|-------|--------|---------|
| File | None | `✓ test.ts` |
| Top-level describe (shown) | 1 level (4 spaces) | `    [ ✓ ] Top Level` |
| Top-level describe (hidden) | 0 levels | Tests shown at file level |
| It block (under shown describe) | 2 levels (8 spaces) | `          [ ✓ ] should work` |
| It block (under hidden describe) | 1 level (4 spaces) | `    [ ✓ ] should work` |
| Nested describe (1 level deep) | 2 levels (8 spaces) | `        [ ✓ ] Nested` |
| It block (under nested) | 3 levels (12 spaces) | `            [ ✓ ] test` |

**Formula:**
- Base indent = 1 (4 spaces)
- Each nesting level adds 1 to indent
- Redundant single describe: reduce all indents by 1

## Edge Cases

### Empty Describe Blocks

Empty describe blocks (no tests, no nested blocks) are shown with their status but no children:

```
 ✓ test.ts (0 tests)
    [ ⇣ ] Empty Block
```

### All Tests Skipped

Blocks where all tests are skipped are marked with skip icon (⇣):

```
 ⇣ test.ts (2 tests, 2 tests skipped)
    [ ⇣ ] Skipped Block
```

### Deeply Nested Describes (3+ levels)

There is no arbitrary limit on nesting depth. Each level adds one indent level:

```
 ✓ test.ts (5 tests)
    [ ✓ ] Level 1 [5 tests]
        [ ✓ ] Level 2 [3 tests]
            [ ✓ ] Level 3 [2 tests]
               [ ✓ ] should work
```

However, developers should be aware that excessive nesting (4+ levels) may impact readability.

### No Describe Blocks

When a file has tests directly at the top level (no describe blocks), tests are shown with file-level indent:

```
 ✓ simple.test.ts (2 tests)
    [ ✓ ] should work directly
    [ ✓ ] another test
```

## Implementation Functions

The hierarchy logic is implemented in `src/report/hierarchy.ts`:

### `shouldShowDescribeLevel(testFile: TestFile): boolean`

Determines whether describe blocks should be shown at all for this file.

Returns `false` only when:
- Exactly 1 top-level block exists
- That block has no nested blocks
- That block is not "Areas OUTSIDE of tests blocks"

### `isRedundantSingleDescribe(block: TestBlock, totalBlocks: number, hasNestedBlocks: boolean): boolean`

Determines if a specific block is a redundant single describe.

Returns `true` when:
- `totalBlocks === 1` (only this block at top level)
- `hasNestedBlocks === false` (no nesting)
- Block description is not "Areas OUTSIDE of tests blocks"

### `getIndentLevel(depth: number, isRedundant: boolean): number`

Calculates the indent level for a block.

- `depth`: Nesting depth (0 = top-level, 1 = first nested, etc.)
- `isRedundant`: Whether this is a redundant single describe

Returns:
- `depth + 1` for normal blocks (0 becomes 1, 1 becomes 2, etc.)
- `depth` for redundant blocks (0 becomes 0, reducing all children by 1)

## Examples

### Example 1: Single Describe (Hidden)

**File structure:**
```typescript
describe("Calculator", () => {
  it("should add", () => { ... });
  it("should subtract", () => { ... });
});
```

**Output:**
```
 ✓ calculator.test.ts (2 tests)
    [ ✓ ] should add
    [ ✓ ] should subtract
```

### Example 2: Multiple Describes (All Shown)

**File structure:**
```typescript
describe("Addition", () => {
  it("should add positive", () => { ... });
});

describe("Subtraction", () => {
  it("should subtract", () => { ... });
});
```

**Output:**
```
 ✓ calculator.test.ts (2 tests)
    [ ✓ ] Addition [1 test]
       [ ✓ ] should add positive
    [ ✓ ] Subtraction [1 test]
       [ ✓ ] should subtract
```

### Example 3: Nested Describes (All Shown)

**File structure:**
```typescript
describe("API", () => {
  describe("GET /users", () => {
    it("should return list", () => { ... });
  });

  describe("POST /users", () => {
    it("should create user", () => { ... });
  });
});
```

**Output:**
```
 ✓ api.test.ts (2 tests)
    [ ✓ ] API [2 tests]
        [ ✓ ] GET /users [1 test]
           [ ✓ ] should return list
        [ ✓ ] POST /users [1 test]
           [ ✓ ] should create user
```

### Example 4: Areas OUTSIDE (Always Shown)

**File structure:**
```typescript
import { InvalidType } from "./missing"; // Error here

describe("Tests", () => {
  it("should work", () => { ... });
});
```

**Output:**
```
 ⤬ test.ts (1 test, 1 error)
    [ ⤬ ] Areas OUTSIDE of tests blocks [0 tests, 1 error]
       - [ ⛒, code: 2307 ] Cannot find module './missing'
    [ ✓ ] Tests [1 test]
       [ ✓ ] should work
```

## Status Icons Legend

| Icon | Meaning | Color |
|------|---------|-------|
| ✓ | Pass | Green |
| ⤬ | Error/Fail | Red |
| ⇣ | Skipped | Gray |
| ⛒ | Type Error | Red |
| ⚠️ | Warning | Yellow |

## Future Considerations

### Collapsing Deep Nesting

If deep nesting becomes problematic, consider:
- Max indent level (e.g., cap at 5 levels)
- Collapsible sections in interactive mode
- Tree-view ASCII art for very deep structures

### Filtering Options

Potential future flags:
- `--max-depth N`: Only show N levels of nesting
- `--flatten`: Show all tests at same level
- `--tree`: Use tree-view ASCII characters (├── └──)
