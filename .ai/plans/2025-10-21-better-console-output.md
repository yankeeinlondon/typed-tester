# Better Console Output

**Created**: 2025-10-21
**Status**: Pending Review

## Context / Background

The recent feature `.ai/plans/2-25-10-improved-symbol-command.md` was marked "completed" but has critical output quality issues:

1. **Non-clickable symbols**: The first column (symbol names) is supposed to be clickable links to source files, but currently returns plain text. The code comment in `src/report/symbolsScreen.ts:40-43` explains that `tty-table` breaks column width calculations when ANSI escape codes (including OSC 8 terminal links) are present.

2. **Broken description formatting**: The Description column shows raw Markdown syntax (`**text**` appears literally instead of bold formatting), and the layout is poor with center-aligned text that looks unprofessional.

3. **Underutilized link utilities**: We have well-tested link utilities (`fileLink`, `urlLink`, `tsCodeLink`) that aren't being leveraged where they should be.

4. **Missing output utilities**: While stub files were created for output utilities (`availableWidth`, `wordWrap`, `mdToConsole`, `centerText`, `rightJustifyText`), they have since been implemented but aren't being used in the symbol command output.

5. **Incomplete symbol formatters**: Stub files exist for category-specific formatters (`type-description.ts`, `function-description.ts`, `class-description.ts`, etc.) but they're all empty functions.

## Goals

1. Make symbol names in the symbols table clickable links to their source files
2. Properly render Markdown in descriptions using `mdToConsole()`
3. Implement category-specific description formatters for different symbol types
4. Improve overall visual quality and professionalism of console output
5. Ensure all link utilities are used where appropriate throughout the codebase

## Technical Constraints

- **tty-table limitation**: The current table library (`tty-table`) doesn't handle ANSI escape sequences properly for width calculations, causing layout issues with terminal links
- **Solution approach**: Either switch to a better table library (e.g., `cli-table3`) or implement custom table rendering that's ANSI-aware

## Implementation Plan

### Phase 1: Implement Category-Specific Symbol Description Formatters

**Objective**: Create specialized formatters for different symbol types (functions, types, classes, etc.) that produce meaningful, concise descriptions.

**Scope**:

- Implement `functionDescription()` in `src/report/symbol-description/function-description.ts`
- Implement `typeDescription()` in `src/report/symbol-description/type-description.ts`
- Implement `classDescription()` in `src/report/symbol-description/class-description.ts`
- Implement `typeUtilityDescription()` in `src/report/symbol-description/type-utility-description.ts`
- Implement `constDescription()` in `src/report/symbol-description/const-description.ts`

**Key Requirements**:

- Each formatter should receive `SymbolMeta` and return a formatted string
- Formatters should extract relevant information based on symbol category:
  - Functions: signature, parameters, return type
  - Types: type definition, constraints
  - Classes: constructor signature, key methods
  - Type utilities: input/output type transformations
  - Constants: value type and description
- Output should be optimized for console display (concise but informative)
- Should use JSDoc information when available

**Test Strategy**:

- Runtime tests for each formatter function
- Test with real symbol metadata from fixtures
- Edge cases: missing JSDoc, complex generics, long signatures

---

### Phase 2: Integrate mdToConsole and Enhanced Description Formatting

**Objective**: Update `formatDescription()` to use category-specific formatters and properly render Markdown to console.

**Scope**:

- Modify `src/report/formatDescription.ts` to:
  - Route to appropriate category-specific formatter based on symbol type
  - Use `mdToConsole()` to convert Markdown syntax to ANSI formatting
  - Use `wordWrap()` for intelligent text wrapping
  - Implement better truncation that respects word boundaries
- Ensure descriptions are left-aligned (not centered) for better readability

**Key Requirements**:

- Dispatch to correct formatter: `formatDescription(symbolMeta) → categoryFormatter(symbolMeta) → mdToConsole(markdown)`
- Markdown bold (`**text**`) should render as actual bold text in terminal
- Markdown italic (`*text*`) should render as italic
- Markdown code (`` `code` ``) should render with appropriate highlighting
- Text should wrap intelligently at word boundaries
- Must respect `maxWidth` constraint for table column

**Test Strategy**:

- Runtime tests verifying Markdown conversion
- Test with various symbol categories
- Test wrapping behavior with long descriptions
- Visual regression testing (manual verification of console output)

---

### Phase 3: Fix Clickable Symbol Names (Table Library Migration)

**Objective**: Make symbol names in the symbols table clickable links to their source files.

**Scope**:

- Evaluate and switch from `tty-table` to an ANSI-aware table library (likely `cli-table3` or custom implementation)
- Update `src/report/symbolsScreen.ts` to:
  - Use `fileLink()` to create clickable symbol names
  - Maintain current table structure and column layout
  - Ensure proper column width calculations with ANSI codes
- Update dependency list in `package.json`

**Key Requirements**:

- Symbol names must be clickable links using `fileLink(symbolName, filepath)`
- Links should include line numbers: `fileLink(name,`${filepath}:${startLine}`)`
- Table layout must remain clean and aligned
- Column widths must be calculated based on visible text (ignoring ANSI codes)
- Maintain color coding for dependencies (red=module, yellow=local, cyan=external, magenta=graph)

**Test Strategy**:

- Integration tests verifying link generation
- Manual testing: click links in various terminals (VSCode, iTerm2, Terminal.app)
- Visual regression testing of table layout
- Test with symbols at various line numbers
- Test with long file paths

---

### Phase 4: Audit and Enhance Link Usage Across Codebase

**Objective**: Ensure link utilities (`fileLink`, `urlLink`, `tsCodeLink`) are used consistently throughout the codebase wherever applicable.

**Scope**:

- Search codebase for places where links could/should be used
- Common targets:
  - Error messages referencing files
  - Diagnostic output showing file locations
  - Help text with URLs
  - TypeScript error codes
- Update found locations to use appropriate link utilities

**Key Requirements**:

- All file references in user-facing output should use `fileLink()`
- All URLs in user-facing output should use `urlLink()`
- All TypeScript error codes should use `tsCodeLink()`
- Console output should be consistently "clickable" where relevant

**Test Strategy**:

- Search for patterns: file paths in console output, URLs, TS error codes
- Manual testing of each updated location
- Integration tests for commands that output file paths

---

## Success Criteria

- [ ] Symbol names in symbols table are clickable links that open files at correct line numbers
- [ ] Markdown formatting in descriptions renders properly (bold, italic, code)
- [ ] Each symbol category has a meaningful, category-specific description format
- [ ] Table layout is clean and professional
- [ ] All console output uses appropriate link utilities
- [ ] No regressions in existing tests
- [ ] Visual quality significantly improved over current output

## Dependencies

- `cli-table3` (or alternative ANSI-aware table library) - to be determined in Phase 3
- Existing utilities: `fileLink`, `urlLink`, `mdToConsole`, `wordWrap`

## Notes

- The general-purpose `link()` function has been un-exported intentionally to force usage of specific link types (`fileLink`, `urlLink`, `tsCodeLink`)
- Each phase follows TDD workflow: SNAPSHOT → CREATE LOG → WRITE TESTS → IMPLEMENT → CLOSE OUT
- Phases should be executed sequentially, with user approval before proceeding to next phase
