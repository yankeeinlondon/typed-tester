# Phase 3 Log: Fix Clickable Symbol Names (Table Library Migration)

**Plan**: Better Console Output
**Phase**: 3 of 4
**Started**: 2025-10-21

## Starting Test Position

### Runtime Tests

```xml
<test-results>
  <summary>
    <total-tests>229</total-tests>
    <passed-tests>226</passed-tests>
    <failed-tests>2</failed-tests>
    <skipped-tests>1</skipped-tests>
  </summary>

  <note>Same baseline failures as Phase 2 - no regressions</note>
</test-results>
```

## Repo Starting Position

### Recent Changes from Phase 2

**Files Modified:**

- src/report/formatDescription.ts (rewritten with category routing + mdToConsole)
- src/report/symbolsScreen.ts (updated to pass SymbolMeta)
- src/utils/mdToConsole.ts (inline code now cyan text, not background)

**Files Added:**

- tests/unit/report/enhanced-format-description.test.ts (19 tests)

## Phase 3 Work Begins

**Objective**: Make symbol names in the symbols table clickable links to their source files by migrating from `tty-table` to an ANSI-aware table library.

**Known Issue**: The comment in `symbolsScreen.ts:40-43` explains that `tty-table` breaks column width calculations when ANSI escape codes (OSC 8 terminal links) are present, which is why links were disabled.

### Research: Table Library Options

**Options Evaluated:**

1. **cli-table3** (chosen)
   - 17.8M weekly downloads vs 418K for tty-table
   - More robust ANSI color handling
   - Uses `string-width` (already in our dependencies) for proper width calculation
   - Better maintained and more popular

2. **tty-table** (current)
   - Breaks column width calculations with ANSI escape codes
   - Less popular, lower download counts
   - Issue documented in code comment

3. **Custom implementation**
   - Not needed - cli-table3 solves our problem

**Decision**: Migrate to cli-table3

### Implementation Summary

**Dependencies Changed:**
- Added: `cli-table3@0.6.5` (includes TypeScript types)
- Removed: `tty-table@4.2.3` (-37 total packages including dependencies)

**Files Modified:**
- `src/report/symbolsScreen.ts` - Complete rewrite using cli-table3 API
  - Changed from `Table(header, rows).render()` to `new Table(options)` with `push()` and `toString()`
  - Added `createTerminalLink()` calls to make symbol names clickable
  - Removed `colWidths` to prevent truncation of OSC 8 escape sequences
  - Set `wordWrap: false` to prevent link breakage
  - Simplified logic by moving formatters inline
- `src/commands/files.ts` - Migrated from tty-table to cli-table3 API
  - Updated import statement
  - Converted from old API `Table(header, rows).render()` to new API
  - Now uses `new Table(options)` with `push()` and `toString()`

**Files Created:**
- `tests/unit/report/clickable-symbol-names.test.ts` - 9 comprehensive tests
  - Terminal link generation tests (OSC 8 format validation)
  - File path and line number accuracy tests
  - Table layout integrity tests
  - Generics handling tests
  - Dependency column preservation tests

**Key Technical Challenge:**
cli-table3's `string-width` library doesn't recognize OSC 8 escape sequences as invisible characters (it only strips SGR color codes). This caused truncation of terminal links when using fixed `colWidths`.

**Solution:**
Removed `colWidths` constraint to allow auto-sizing, preventing truncation of escape sequences while maintaining table structure.

## Phase 3 Completion

**Completed**: 2025-10-21

**Final Test Count:**
- Runtime tests: 235 passed, 2 failed (baseline failures), 1 skipped
- Net change: +9 tests (all Phase 3 tests passing)
- No new failures introduced

**Test Migration:**
- Tests successfully migrated to `tests/unit/report/clickable-symbol-names.test.ts`
- WIP test file removed
- All 9 tests passing in permanent location

**Key Changes:**
- Symbol names in `symbols` command output are now clickable terminal links
- Links use OSC 8 format: `\x1B]8;;file:///path/to/file.ts:line\x1B\\text\x1B]8;;\x1B\\`
- Clicking symbol names opens the file at the correct line in supported terminals (iTerm2, VSCode, Terminal.app, etc.)
- Table rendering improved with cli-table3's better ANSI handling
- 37 fewer dependencies (removed tty-table and its deps)

**Notes:**
- cli-table3 properly handles SGR ANSI codes (colors, bold, italic) but not OSC 8 codes
- Auto-sizing columns instead of fixed widths prevents link truncation
- All existing functionality preserved (dependencies, descriptions, color coding)
- Ready for Phase 4: Audit and Enhance Link Usage Across Codebase

