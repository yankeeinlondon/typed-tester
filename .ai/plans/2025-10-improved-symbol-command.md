# Improved Symbol Command Implementation Plan

## Overview

This plan details the implementation of enhanced filtering, new CLI flags, and improved output formatting for the `symbols` command in typed-tester.

## Changes Summary

### 1. New CLI Flags

#### 1.1 Runtime Filter (`--runtime` / `-r`)

- **Purpose**: Filter to show only runtime symbols (functions, classes, variables)
- **Implementation**: Filter based on `isFunction`, `isVariable`, or symbol kind being `class`, `function`, `const-function`
- **Mutually exclusive with**: `--types` flag

#### 1.2 Types Filter (`--types` / `-t`)

- **Purpose**: Filter to show only design-time type symbols
- **Implementation**: Filter based on `isTypeSymbol` property
- **Mutually exclusive with**: `--runtime` flag

#### 1.3 Case Sensitive Filter (`--case-sensitive` / `-c`)

- **Purpose**: Make filter criteria case-sensitive (default is case-insensitive)
- **Implementation**: Affects how positional filter arguments are processed
- **Default**: Case-insensitive matching

### 2. Filter Mechanism Changes

#### 2.1 Remove `--filter` Flag

- Remove the existing `--filter` / `-f` flag from options
- All non-flag arguments become filter criteria

#### 2.2 Positional Filter Arguments

Positional arguments (non-flag parameters) will be treated as filter criteria with two modes:

##### Quoted Tokens (Literal Match)

- **Format**: Single or double quotes around the token
- **Behavior**:
  - Case-sensitive exact match only
  - Must match symbol name exactly
  - No substring matching
- **Examples**:
  - `"StripLeading"` matches `StripLeading` only
  - `"StripLeading"` does NOT match `stripLeading`, `StripLeadingLast`, or `MaybeStripLeading`

##### Unquoted Tokens (Substring Match)

- **Format**: No quotes around the token
- **Behavior**:
  - Case-insensitive by default (unless `--case-sensitive` flag is set)
  - Substring match with wildcards at start and end (glob pattern `*token*`)
  - Matches any symbol name containing the token
- **Examples**:
  - `strip` matches `StripLeading`, `stripLeading`, `MaybeStripLeading`, etc.
  - `strip` with `--case-sensitive` matches `stripLeading` but not `StripLeading`

### 3. Output Format Changes

#### 3.1 New Default Column Layout

**Old layout**: Symbol | Filepath | Dependencies
**New layout**: Symbol | Description | Dependencies

#### 3.2 Symbol Column with Links

- **Current behavior**: Symbol names displayed with generics
- **New behavior**:
  - Symbol names become clickable terminal links
  - Link format: `file://FULLY_QUALIFIED_PATH:LINE_NUMBER`
  - Use absolute paths for proper link functionality
  - Preserve existing formatting (bold names, dim generics)
  - Example link: `file:///Users/ken/coding/typed-tester/src/types.ts:42`

#### 3.3 New Description Column

- **Source**: Extract from `jsDocs` property on `SymbolMeta`
- **Content includes**:
  - Main JSDoc comment text
  - Parameter descriptions from `@param` tags
  - Return descriptions from `@returns` tags
  - Other relevant JSDoc tags

- **Formatting requirements**:
  - Use tasteful combination of colors for readability
  - Use italics for parameter names
  - Use bold for tag names (e.g., `@param`, `@returns`)
  - Use dim/gray for separators or less important text
  - Keep formatting concise for table display
  - Truncate long descriptions with ellipsis if needed
  - Multi-line support for better readability in wider terminals

- **Column width**:
  - Dynamic based on terminal width (similar to filepath column logic)
  - Recommended: 40-60 characters depending on terminal width
  - Priority: Symbol (32) > Description (40-60) > Dependencies (remaining)

#### 3.4 Filepath Column (Preserved)

- Keep the existing filepath formatting logic in `prettyMultiLinePath()`
- Store filepath data in output but don't display in table
- Available for future use or alternative output modes

## Implementation Steps

**IMPORTANT - Test-Driven Development (TDD) Approach**

Every phase MUST follow this strict workflow:

1. **Baseline First**: Capture current test state before any changes
2. **Write Tests**: Create tests that demonstrate the new functionality
3. **Verify Failure**: Confirm tests fail (proving they're valid)
4. **Implement**: Write the minimum code to make tests pass
5. **Verify Success**: Ensure ALL tests pass with NO regressions

**Test Baseline Directory Structure**

Before starting, create the baseline directory:

```bash
mkdir -p .ai/test-baselines
```

Each phase will save test results to this directory for comparison:
- `phase1-baseline.txt` - Starting point for Phase 1
- `phase1-complete.txt` - Phase 1 completion state
- `phase2-baseline.txt` - Starting point for Phase 2 (should match phase1-complete.txt)
- ... and so on

**Regression Detection**

Between phases, verify that the baseline matches the previous completion:

```bash
# Example: Verify Phase 2 starts clean from Phase 1
diff .ai/test-baselines/phase1-complete.txt .ai/test-baselines/phase2-baseline.txt
```

Any differences indicate external changes or incomplete cleanup from the previous phase.

---

### Phase 1: CLI Options Update

**Functional Goal**: Update CLI option definitions to support new flags and remove deprecated filter flag.

#### Step 1.1: Baseline Current Test Status

Run the complete test suite and capture the baseline:

```bash
npm test 2>&1 | tee .ai/test-baselines/phase1-baseline.txt
```

Record:
- Total tests run
- Tests passing
- Tests failing (with specific failures)
- Overall test suite health

#### Step 1.2: Write Unit Tests (Test-First)

**File**: `tests/unit/cli-options.test.ts` (create if doesn't exist)

Write tests that verify the new CLI options structure:

```typescript
import { describe, it, expect } from 'vitest';
import { command_options } from '~/cli/options';

describe('symbols command options', () => {
    it('should include runtime flag option', () => {
        const symbolsOptions = command_options.symbols;
        const runtimeOpt = symbolsOptions.find(opt => opt.name === 'runtime');

        expect(runtimeOpt).toBeDefined();
        expect(runtimeOpt?.type).toBe(Boolean);
        expect(runtimeOpt?.alias).toBe('r');
    });

    it('should include types flag option', () => {
        const symbolsOptions = command_options.symbols;
        const typesOpt = symbolsOptions.find(opt => opt.name === 'types');

        expect(typesOpt).toBeDefined();
        expect(typesOpt?.type).toBe(Boolean);
        expect(typesOpt?.alias).toBe('t');
    });

    it('should include case-sensitive flag option', () => {
        const symbolsOptions = command_options.symbols;
        const caseSensitiveOpt = symbolsOptions.find(opt => opt.name === 'case-sensitive');

        expect(caseSensitiveOpt).toBeDefined();
        expect(caseSensitiveOpt?.type).toBe(Boolean);
        expect(caseSensitiveOpt?.alias).toBe('c');
    });

    it('should NOT include deprecated filter option', () => {
        const symbolsOptions = command_options.symbols;
        const filterOpt = symbolsOptions.find(opt => opt.name === 'filter');

        expect(filterOpt).toBeUndefined();
    });

    it('should still include clear flag option', () => {
        const symbolsOptions = command_options.symbols;
        const clearOpt = symbolsOptions.find(opt => opt.name === 'clear');

        expect(clearOpt).toBeDefined();
        expect(clearOpt?.type).toBe(Boolean);
    });
});
```

**Expected Result**: These tests should FAIL initially.

#### Step 1.3: Verify Tests Fail

Run the new tests to confirm they fail as expected:

```bash
npm test -- tests/unit/cli-options.test.ts
```

Document the failures - this confirms tests are valid and will detect when implementation is complete.

#### Step 1.4: Implement CLI Options Changes

**File**: `src/cli/options.ts`

Update the `symbols` command options:

```typescript
symbols: [
    CMD,
    {
        name: "runtime",
        type: Boolean,
        alias: "r",
        description: `filter to show only runtime symbols (functions, classes, variables)`
    },
    {
        name: "types",
        type: Boolean,
        alias: "t",
        description: `filter to show only design-time type symbols`
    },
    {
        name: "case-sensitive",
        type: Boolean,
        alias: "c",
        description: `treat filter criteria as case-sensitive (default: case-insensitive)`
    },
    {
        name: "clear",
        type: Boolean,
        description: `clear the symbol cache and rebuild from scratch`
    },
],
```

#### Step 1.5: Verify All Tests Pass

Run the full test suite to ensure:

```bash
npm test
```

**Success Criteria**:
- [ ] All new unit tests pass
- [ ] No regressions in existing tests
- [ ] Test count matches: (baseline passing + new passing tests)
- [ ] Zero test failures beyond baseline

Save results:

```bash
npm test 2>&1 | tee .ai/test-baselines/phase1-complete.txt
```

### Phase 2: Filter Logic Update

**Functional Goal**: Implement smart filter matching with quoted/unquoted handling and runtime/types filtering.

#### Step 2.1: Baseline Current Test Status

Run the complete test suite and capture the baseline:

```bash
npm test 2>&1 | tee .ai/test-baselines/phase2-baseline.txt
```

Compare against Phase 1 completion to ensure we're starting clean.

#### Step 2.2: Write Unit Tests (Test-First)

**File**: `tests/unit/symbol-filtering.test.ts` (new file)

Write comprehensive tests for the filtering logic:

```typescript
import { describe, it, expect } from 'vitest';
import type { SymbolMeta } from '~/types';

// We'll need to export these functions from symbols.ts for testing
import { filterSymbols, matchesFilter } from '~/commands/symbols';

describe('matchesFilter', () => {
    describe('quoted tokens (literal match)', () => {
        it('should match exact symbol name with double quotes', () => {
            expect(matchesFilter('StripLeading', '"StripLeading"', false)).toBe(true);
        });

        it('should match exact symbol name with single quotes', () => {
            expect(matchesFilter('StripLeading', "'StripLeading'", false)).toBe(true);
        });

        it('should NOT match partial when quoted', () => {
            expect(matchesFilter('StripLeadingLast', '"StripLeading"', false)).toBe(false);
            expect(matchesFilter('MaybeStripLeading', '"StripLeading"', false)).toBe(false);
        });

        it('should be case-sensitive for quoted tokens', () => {
            expect(matchesFilter('stripLeading', '"StripLeading"', false)).toBe(false);
            expect(matchesFilter('StripLeading', '"stripLeading"', false)).toBe(false);
        });
    });

    describe('unquoted tokens (substring match)', () => {
        it('should match substring case-insensitively by default', () => {
            expect(matchesFilter('StripLeading', 'strip', false)).toBe(true);
            expect(matchesFilter('stripLeading', 'strip', false)).toBe(true);
            expect(matchesFilter('MaybeStripLeading', 'strip', false)).toBe(true);
        });

        it('should match substring case-sensitively when flag is set', () => {
            expect(matchesFilter('stripLeading', 'strip', true)).toBe(true);
            expect(matchesFilter('StripLeading', 'strip', true)).toBe(false);
        });

        it('should match anywhere in the string', () => {
            expect(matchesFilter('MaybeStripLeadingLast', 'Leading', false)).toBe(true);
            expect(matchesFilter('TestUserService', 'user', false)).toBe(true);
        });
    });
});

describe('filterSymbols', () => {
    const mockSymbols: SymbolMeta[] = [
        {
            name: 'UserType',
            isTypeSymbol: true,
            isFunction: false,
            isVariable: false,
            kind: 'type-defn',
        } as SymbolMeta,
        {
            name: 'userService',
            isTypeSymbol: false,
            isFunction: true,
            isVariable: false,
            kind: 'const-function',
        } as SymbolMeta,
        {
            name: 'UserClass',
            isTypeSymbol: false,
            isFunction: false,
            isVariable: false,
            kind: 'class',
        } as SymbolMeta,
        {
            name: 'getUserData',
            isTypeSymbol: false,
            isFunction: true,
            isVariable: false,
            kind: 'function',
        } as SymbolMeta,
    ];

    describe('runtime/types filtering', () => {
        it('should filter to only runtime symbols with --runtime flag', () => {
            const result = filterSymbols(mockSymbols, {
                filters: [],
                caseSensitive: false,
                runtime: true,
            });

            expect(result.length).toBe(3); // userService, UserClass, getUserData
            expect(result.every(s => !s.isTypeSymbol)).toBe(true);
        });

        it('should filter to only type symbols with --types flag', () => {
            const result = filterSymbols(mockSymbols, {
                filters: [],
                caseSensitive: false,
                types: true,
            });

            expect(result.length).toBe(1); // UserType
            expect(result.every(s => s.isTypeSymbol)).toBe(true);
        });

        it('should show all symbols when both flags are set (with warning)', () => {
            const consoleSpy = vi.spyOn(console, 'warn');

            const result = filterSymbols(mockSymbols, {
                filters: [],
                caseSensitive: false,
                runtime: true,
                types: true,
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Cannot use both --runtime and --types')
            );
            expect(result.length).toBe(mockSymbols.length);
        });
    });

    describe('name filtering', () => {
        it('should filter with unquoted substring (case-insensitive)', () => {
            const result = filterSymbols(mockSymbols, {
                filters: ['user'],
                caseSensitive: false,
            });

            expect(result.length).toBe(3); // UserType, userService, getUserData
        });

        it('should filter with quoted exact match', () => {
            const result = filterSymbols(mockSymbols, {
                filters: ['"UserType"'],
                caseSensitive: false,
            });

            expect(result.length).toBe(1);
            expect(result[0].name).toBe('UserType');
        });

        it('should support multiple filters (OR logic)', () => {
            const result = filterSymbols(mockSymbols, {
                filters: ['"UserType"', 'service'],
                caseSensitive: false,
            });

            expect(result.length).toBe(2); // UserType, userService
        });
    });
});
```

**Expected Result**: These tests should FAIL initially because functions don't exist yet.

#### Step 2.3: Verify Tests Fail

Run the new tests:

```bash
npm test -- tests/unit/symbol-filtering.test.ts
```

Document failures to confirm test validity.

#### Step 2.4: Implement Filter Logic

**File**: `src/commands/symbols.ts`

Add the filter logic implementation:

```typescript
// Export these for testing
export interface FilterOptions {
    filters: string[];           // positional arguments
    caseSensitive: boolean;      // --case-sensitive flag
    runtime?: boolean;           // --runtime flag
    types?: boolean;             // --types flag
}

export function filterSymbols(
    symbols: SymbolMeta[],
    options: FilterOptions
): SymbolMeta[] {
    let filtered = symbols;

    // Apply runtime/types filters first
    if (options.runtime && options.types) {
        // Both flags set - show warning and ignore both
        console.warn("Cannot use both --runtime and --types flags; showing all symbols");
    } else if (options.runtime) {
        filtered = filtered.filter(s =>
            s.isFunction || s.isVariable ||
            s.kind === 'class' || s.kind === 'function' || s.kind === 'const-function'
        );
    } else if (options.types) {
        filtered = filtered.filter(s => s.isTypeSymbol);
    }

    // Apply name filters if provided
    if (options.filters.length === 0) {
        return filtered.slice(0, MAX_SYMBOLS); // Show sample if no filter
    }

    return filtered.filter(symbol =>
        options.filters.some(filter => matchesFilter(symbol.name, filter, options.caseSensitive))
    );
}

export function matchesFilter(symbolName: string, filter: string, caseSensitive: boolean): boolean {
    // Check if filter is quoted (literal match)
    const isQuoted = (filter.startsWith('"') && filter.endsWith('"')) ||
                     (filter.startsWith("'") && filter.endsWith("'"));

    if (isQuoted) {
        // Literal case-sensitive exact match
        const literalFilter = filter.slice(1, -1); // Remove quotes
        return symbolName === literalFilter;
    } else {
        // Substring match
        if (caseSensitive) {
            return symbolName.includes(filter);
        } else {
            return symbolName.toLowerCase().includes(filter.toLowerCase());
        }
    }
}
```

Update `symbols_command()` to use positional arguments:

```typescript
export async function symbols_command(opt: AsOption<"symbols">, positionalArgs: string[]) {
    // ... existing setup code ...

    // Filter symbols based on user input
    const symbols = filterSymbols(allSymbols, {
        filters: positionalArgs,
        caseSensitive: opt['case-sensitive'] || false,
        runtime: opt.runtime,
        types: opt.types
    });

    // Update messaging
    if (positionalArgs.length === 0 && !opt.quiet) {
        msg(opt)(`- showing sample of symbols (use filter arguments to narrow results)`);
    } else if (positionalArgs.length > 0) {
        msg(opt)(`- filtered to ${chalk.bold(symbols.length)} symbols matching: ${chalk.dim(positionalArgs.join(", "))}`);
    }

    // ... rest of existing code ...
}
```

#### Step 2.5: Verify All Tests Pass

Run the full test suite:

```bash
npm test
```

**Success Criteria**:
- [ ] All new unit tests in `symbol-filtering.test.ts` pass
- [ ] No regressions in existing tests
- [ ] Test count = (Phase 1 complete + new Phase 2 tests)
- [ ] Zero test failures beyond baseline

Save results:

```bash
npm test 2>&1 | tee .ai/test-baselines/phase2-complete.txt
```

### Phase 3: Description Formatting Utility

**Functional Goal**: Create utilities to format JSDoc comments into concise, colorful descriptions for table display.

#### Step 3.1: Baseline Current Test Status

```bash
npm test 2>&1 | tee .ai/test-baselines/phase3-baseline.txt
```

#### Step 3.2: Write Unit Tests (Test-First)

**File**: `tests/unit/format-description.test.ts` (new file)

```typescript
import { describe, it, expect } from 'vitest';
import { formatDescription, truncateText, extractParamName } from '~/report/formatDescription';
import type { JsDocInfo } from '~/types';

describe('formatDescription', () => {
    it('should return placeholder for empty JSDoc', () => {
        const result = formatDescription([], 50);
        expect(result).toContain('(no description)');
    });

    it('should format main comment text', () => {
        const jsDocs: JsDocInfo[] = [{
            comment: 'This is a user type',
            tags: []
        }];

        const result = formatDescription(jsDocs, 50);
        expect(result).toContain('This is a user type');
    });

    it('should include param tags', () => {
        const jsDocs: JsDocInfo[] = [{
            comment: 'Adds two numbers',
            tags: [
                { tagName: 'param', comment: 'a first number' },
                { tagName: 'param', comment: 'b second number' }
            ]
        }];

        const result = formatDescription(jsDocs, 80);
        expect(result).toContain('a');
        expect(result).toContain('b');
    });

    it('should truncate long descriptions', () => {
        const longComment = 'This is a very long description that should be truncated because it exceeds the maximum width allowed for the column';
        const jsDocs: JsDocInfo[] = [{
            comment: longComment,
            tags: []
        }];

        const result = formatDescription(jsDocs, 30);
        // Result should be shorter and contain ellipsis
        expect(result.length).toBeLessThan(longComment.length);
        expect(result).toContain('...');
    });

    it('should handle array-style comments', () => {
        const jsDocs: JsDocInfo[] = [{
            comment: 'Main comment',
            tags: [
                {
                    tagName: 'param',
                    comment: [
                        { text: 'name' },
                        { text: ' - ' },
                        { text: 'the user name' }
                    ] as any
                }
            ]
        }];

        const result = formatDescription(jsDocs, 80);
        expect(result).toBeTruthy();
    });
});

describe('truncateText', () => {
    it('should not truncate text within width', () => {
        const text = 'Short text';
        const result = truncateText(text, 50);
        expect(result).toBe(text);
    });

    it('should truncate text exceeding width', () => {
        const text = 'This is a long text that needs truncation';
        const result = truncateText(text, 20);
        expect(result.length).toBeLessThanOrEqual(20);
        expect(result).toContain('...');
    });

    it('should handle ANSI color codes in length calculation', () => {
        const coloredText = '\x1b[31mRed text\x1b[0m that is long';
        const result = truncateText(coloredText, 15);
        // Should not count color codes in length
        expect(result).toBeTruthy();
    });
});

describe('extractParamName', () => {
    it('should extract param name from simple comment', () => {
        expect(extractParamName('userName the name of user')).toBe('userName');
    });

    it('should extract param name with hyphen', () => {
        expect(extractParamName('config - configuration object')).toBe('config');
    });

    it('should handle empty comment', () => {
        expect(extractParamName('')).toBe('');
    });
});
```

**Expected Result**: Tests should FAIL (module doesn't exist yet).

#### Step 3.3: Verify Tests Fail

```bash
npm test -- tests/unit/format-description.test.ts
```

#### Step 3.4: Implement Description Formatting

**New File**: `src/report/formatDescription.ts`

Create the formatting utility:

```typescript
import type { JsDocInfo } from "~/types";
import chalk from "chalk";

/**
 * Formats JSDoc information into a concise, colorful description for table display
 */
export function formatDescription(jsDocs: JsDocInfo[], maxWidth: number): string {
    if (!jsDocs || jsDocs.length === 0) {
        return chalk.dim("(no description)");
    }

    const parts: string[] = [];
    const doc = jsDocs[0]; // Use first JSDoc block

    // Add main comment
    if (doc.comment) {
        const comment = truncateText(doc.comment.trim(), maxWidth - 10);
        parts.push(comment);
    }

    // Add @param tags
    const params = doc.tags.filter(t => t.tagName === 'param');
    if (params.length > 0) {
        const paramText = params.map(p => {
            const commentText = typeof p.comment === 'string'
                ? p.comment
                : Array.isArray(p.comment)
                    ? p.comment.map(c => c?.text || '').join('')
                    : '';
            return `${chalk.italic(extractParamName(commentText))}`;
        }).join(', ');
        parts.push(chalk.dim('(') + paramText + chalk.dim(')'));
    }

    // Join with separator
    const result = parts.join(' ');

    // Ensure we don't exceed max width
    return truncateText(result, maxWidth);
}

export function truncateText(text: string, maxWidth: number): string {
    // Remove color codes for length calculation
    const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');

    if (stripped.length <= maxWidth) {
        return text;
    }

    // Find a good breaking point
    const truncated = text.substring(0, maxWidth - 3);
    return truncated + chalk.dim('...');
}

export function extractParamName(commentText: string): string {
    // Extract parameter name from "@param paramName description" format
    const match = commentText.match(/^(\w+)/);
    return match ? match[1] : '';
}
```

#### Step 3.5: Verify All Tests Pass

```bash
npm test
```

**Success Criteria**:
- [ ] All new unit tests in `format-description.test.ts` pass
- [ ] No regressions in existing tests
- [ ] Test count = (Phase 2 complete + new Phase 3 tests)

Save results:

```bash
npm test 2>&1 | tee .ai/test-baselines/phase3-complete.txt
```

### Phase 4: Terminal Link Utility

**Functional Goal**: Create utilities to generate OSC 8 terminal hyperlinks for clickable file paths.

#### Step 4.1: Baseline Current Test Status

```bash
npm test 2>&1 | tee .ai/test-baselines/phase4-baseline.txt
```

#### Step 4.2: Write Unit Tests (Test-First)

**File**: `tests/unit/terminal-link.test.ts` (new file)

```typescript
import { describe, it, expect } from 'vitest';
import { createTerminalLink, supportsHyperlinks } from '~/report/terminalLink';
import { resolve } from 'node:path';

describe('createTerminalLink', () => {
    it('should create OSC 8 hyperlink with file URL', () => {
        const result = createTerminalLink('MyType', '/path/to/file.ts');

        // Should contain OSC 8 escape sequences
        expect(result).toContain('\x1b]8;;');
        expect(result).toContain('file://');
        expect(result).toContain('MyType');
    });

    it('should include line number in URL when provided', () => {
        const result = createTerminalLink('MyType', '/path/to/file.ts', 42);

        expect(result).toContain('file:///');
        expect(result).toContain(':42');
    });

    it('should use absolute path', () => {
        const relativePath = 'src/types.ts';
        const result = createTerminalLink('Type', relativePath, 10);

        const absolutePath = resolve(relativePath);
        expect(result).toContain(absolutePath);
    });

    it('should preserve original text in link', () => {
        const text = 'SomeSymbol<T>';
        const result = createTerminalLink(text, '/file.ts');

        // Text should appear between escape sequences
        expect(result).toContain(text);
    });

    it('should create link without line number when not provided', () => {
        const result = createTerminalLink('MyType', '/path/to/file.ts');

        // Should NOT contain line number separator
        expect(result).not.toMatch(/:\d+/);
    });
});

describe('supportsHyperlinks', () => {
    it('should return boolean', () => {
        const result = supportsHyperlinks();
        expect(typeof result).toBe('boolean');
    });

    it('should currently always return true (placeholder)', () => {
        // Current implementation assumes support
        expect(supportsHyperlinks()).toBe(true);
    });
});
```

**Expected Result**: Tests should FAIL (module doesn't exist).

#### Step 4.3: Verify Tests Fail

```bash
npm test -- tests/unit/terminal-link.test.ts
```

#### Step 4.4: Implement Terminal Link Utility

**New File**: `src/report/terminalLink.ts`

Create the terminal link utility:

```typescript
import { resolve } from "node:path";

/**
 * Creates a terminal hyperlink using OSC 8 escape sequence
 * Format: \x1b]8;;URL\x1b\\TEXT\x1b]8;;\x1b\\
 */
export function createTerminalLink(text: string, filepath: string, line?: number): string {
    // Convert to absolute path
    const absolutePath = resolve(filepath);

    // Create file:// URL with line number if provided
    const url = line !== undefined
        ? `file://${absolutePath}:${line}`
        : `file://${absolutePath}`;

    // OSC 8 hyperlink format
    const OSC = '\x1b]8;;';
    const SEP = '\x1b\\';

    return `${OSC}${url}${SEP}${text}${OSC}${SEP}`;
}

/**
 * Check if terminal supports hyperlinks
 * Most modern terminals do, but we can add detection if needed
 */
export function supportsHyperlinks(): boolean {
    // For now, assume support; can add terminal detection later
    // Common terminals that support: iTerm2, Terminal.app, VSCode, etc.
    return true;
}
```

#### Step 4.5: Verify All Tests Pass

```bash
npm test
```

**Success Criteria**:
- [ ] All new unit tests in `terminal-link.test.ts` pass
- [ ] No regressions in existing tests
- [ ] Test count = (Phase 3 complete + new Phase 4 tests)

Save results:

```bash
npm test 2>&1 | tee .ai/test-baselines/phase4-complete.txt
```

### Phase 5: Update Screen Reporter

**Functional Goal**: Update the screen output to use new description column and terminal links instead of filepath.

#### Step 5.1: Baseline Current Test Status

```bash
npm test 2>&1 | tee .ai/test-baselines/phase5-baseline.txt
```

#### Step 5.2: Write Unit Tests (Test-First)

**File**: `tests/unit/symbols-screen.test.ts` (new file)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { symbolsScreen } from '~/report/symbolsScreen';
import type { SymbolMeta } from '~/types';

describe('symbolsScreen', () => {
    let consoleOutput: string[] = [];
    let originalLog: typeof console.log;

    beforeEach(() => {
        consoleOutput = [];
        originalLog = console.log;
        console.log = (msg: string) => {
            consoleOutput.push(msg);
        };
    });

    afterEach(() => {
        console.log = originalLog;
    });

    it('should display symbols with description column', () => {
        const mockSymbols: SymbolMeta[] = [
            {
                name: 'UserType',
                filepath: '/path/to/user.ts',
                startLine: 10,
                jsDocs: [{
                    comment: 'Represents a user',
                    tags: []
                }],
                generics: [],
                deps: []
            } as any
        ];

        symbolsScreen(mockSymbols);

        const output = consoleOutput.join('\n');
        // Should contain "Description" header
        expect(output).toContain('Description');
        // Should NOT contain "Filepath" as a column header
        expect(output).not.toMatch(/Filepath\s+\|/);
    });

    it('should create terminal links for symbols', () => {
        const mockSymbols: SymbolMeta[] = [
            {
                name: 'MyType',
                filepath: '/path/to/file.ts',
                startLine: 42,
                jsDocs: [],
                generics: [],
                deps: []
            } as any
        ];

        symbolsScreen(mockSymbols);

        const output = consoleOutput.join('\n');
        // Should contain OSC 8 escape sequences
        expect(output).toContain('\x1b]8;;');
    });

    it('should format JSDoc descriptions', () => {
        const mockSymbols: SymbolMeta[] = [
            {
                name: 'calculate',
                filepath: '/path/to/math.ts',
                startLine: 5,
                jsDocs: [{
                    comment: 'Calculates the sum',
                    tags: [
                        { tagName: 'param', comment: 'a first number' },
                        { tagName: 'param', comment: 'b second number' }
                    ]
                }],
                generics: [],
                deps: []
            } as any
        ];

        symbolsScreen(mockSymbols);

        const output = consoleOutput.join('\n');
        expect(output).toContain('Calculates');
    });

    it('should display dependency legend', () => {
        symbolsScreen([]);

        const output = consoleOutput.join('\n');
        // Should have legend explaining dependency colors
        expect(output).toContain('module dependency');
        expect(output).toContain('local dependency');
        expect(output).toContain('external');
    });
});
```

**Expected Result**: Tests may partially pass (symbolsScreen exists) but will fail on new behavior.

#### Step 5.3: Verify Tests Fail (for new behavior)

```bash
npm test -- tests/unit/symbols-screen.test.ts
```

#### Step 5.4: Implement Screen Reporter Updates

**File**: `src/report/symbolsScreen.ts`

Update imports:

```typescript
import { formatDescription } from "./formatDescription";
import { createTerminalLink } from "./terminalLink";
```

Modify column definitions and table rendering:

```typescript
export function symbolsScreen(rows: SymbolMeta[]) {
    const columns: number = process.stdout.columns;

    // Calculate dynamic widths
    const descWidth: number = columns > 150
        ? 60
        : columns > 120
            ? 50
            : columns > 100 ? 40 : 35;

    const header = [
        {
            value: "name",
            alias: "Symbol",
            width: SYMBOL_COL_LEN,
            align: "left",
            formatter: (v: [string, TypeGeneric[], string, number]) => {
                const [name, generics, filepath, startLine] = v;

                // Format symbol name with generics
                const symbolText = formatSymbolName(name, generics);

                // Create terminal link
                return createTerminalLink(symbolText, filepath, startLine);
            }
        },
        {
            alias: "Description",
            value: "description",
            width: descWidth,
            formatter: (v: JsDocInfo[]) => formatDescription(v, descWidth)
        },
        {
            alias: "Dependencies",
            value: "deps",
            width: 50,
            formatter: (v: SymbolMeta[]) => {
                return v.map(i => i.scope === "local"
                    ? chalk.yellow(i.name)
                    : i.scope === "module"
                        ? chalk.red(i.name)
                        : i.scope === "graph"
                            ? chalk.magenta(i.name)
                            : chalk.cyan(i.name)
                ).join(", ");
            }
        },
    ];

    const output = Table(header, rows.map((i) => {
        const deps: SymbolMeta[] = (i as any).deps || [];

        return {
            ...i,
            name: [i.name, i.generics, i.filepath, i.startLine],
            description: i.jsDocs,
            filepath: prettyMultiLinePath(i.filepath, pathWidth - 8), // Keep for future use
            deps,
        };
    })).render();

    console.log(output);
    console.log();
    console.log(`    ${chalk.red("⏺")} - module dependency`);
    console.log(`    ${chalk.yellow("⏺")} - local dependency (${chalk.italic("defined in same file as symbol")})`);
    console.log(`    ${chalk.cyan("⏺")} - external dependency`);
    console.log(`    ${chalk.magenta("⏺")} - graph dependency`);
}

function formatSymbolName(name: string, generics: TypeGeneric[]): string {
    const withGenerics = () => `${chalk.bold(name)}<${generics.map(i => chalk.reset.dim(i.name)).join(",")}>`;
    const genericsDisplayLength = generics.reduce((acc, i) => acc + i.name.length, 0);

    return generics.length > 0
        ? (name.length + genericsDisplayLength + 4) > SYMBOL_COL_LEN
                ? withGenerics().replace("<", "\n<")
                : withGenerics()
        : chalk.bold(name);
}
```

#### Step 5.5: Verify All Tests Pass

```bash
npm test
```

**Success Criteria**:
- [ ] All new unit tests in `symbols-screen.test.ts` pass
- [ ] No regressions in existing tests
- [ ] Test count = (Phase 4 complete + new Phase 5 tests)

Save results:

```bash
npm test 2>&1 | tee .ai/test-baselines/phase5-complete.txt
```

### Phase 6: Update Type Definitions

**Functional Goal**: Ensure TypeScript types support new CLI options and positional arguments.

#### Step 6.1: Baseline Current Test Status

```bash
npm test 2>&1 | tee .ai/test-baselines/phase6-baseline.txt
```

#### Step 6.2: Write Unit Tests (Test-First)

**File**: `tests/unit/cli-types.test.ts` (new file or add to existing)

```typescript
import { describe, it, expect } from 'vitest';
import { create_cli } from '~/cli/create_cli';

describe('CLI type handling for symbols command', () => {
    it('should parse positional arguments correctly', () => {
        // Mock process.argv for testing
        const originalArgv = process.argv;
        process.argv = ['node', 'typed', 'symbols', 'UserType', 'Config'];

        const [command, opts, positionalArgs] = create_cli();

        expect(command).toBe('symbols');
        expect(positionalArgs).toEqual(['UserType', 'Config']);

        process.argv = originalArgv;
    });

    it('should parse runtime flag', () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'typed', 'symbols', '--runtime'];

        const [command, opts] = create_cli();

        expect(command).toBe('symbols');
        expect(opts.runtime).toBe(true);

        process.argv = originalArgv;
    });

    it('should parse types flag', () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'typed', 'symbols', '--types'];

        const [command, opts] = create_cli();

        expect(command).toBe('symbols');
        expect(opts.types).toBe(true);

        process.argv = originalArgv;
    });

    it('should parse case-sensitive flag', () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'typed', 'symbols', '--case-sensitive'];

        const [command, opts] = create_cli();

        expect(command).toBe('symbols');
        expect(opts['case-sensitive']).toBe(true);

        process.argv = originalArgv;
    });

    it('should handle mixed flags and positional args', () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'typed', 'symbols', 'user', '--runtime', 'config'];

        const [command, opts, positionalArgs] = create_cli();

        expect(command).toBe('symbols');
        expect(opts.runtime).toBe(true);
        expect(positionalArgs).toContain('user');
        expect(positionalArgs).toContain('config');

        process.argv = originalArgv;
    });
});
```

**Expected Result**: Tests should pass if CLI parsing already works, or fail if types need updates.

#### Step 6.3: Verify Test Status

```bash
npm test -- tests/unit/cli-types.test.ts
```

#### Step 6.4: Update Type Definitions (if needed)

**File**: `src/cli/cli-types.ts` (or wherever AsOption type is defined)

Ensure the `AsOption<"symbols">` type includes new fields:

```typescript
// The command handler should receive positional arguments
type SymbolsOptions = {
    runtime?: boolean;
    types?: boolean;
    'case-sensitive'?: boolean;
    clear?: boolean;
    json?: boolean;
    quiet?: boolean;
    verbose?: boolean;
    config?: string;
};
```

Update the function signature in `src/commands/symbols.ts`:

```typescript
export async function symbols_command(
    opt: AsOption<"symbols">,
    positionalArgs: string[] = []
): Promise<void>
```

#### Step 6.5: Verify All Tests Pass

```bash
npm test
```

**Success Criteria**:
- [ ] All new unit tests in `cli-types.test.ts` pass
- [ ] No TypeScript compilation errors
- [ ] No regressions in existing tests

Save results:

```bash
npm test 2>&1 | tee .ai/test-baselines/phase6-complete.txt
```

### Phase 7: Update Main CLI Entry Point

**Functional Goal**: Wire up the symbols command to pass positional arguments through the CLI.

#### Step 7.1: Baseline Current Test Status

```bash
npm test 2>&1 | tee .ai/test-baselines/phase7-baseline.txt
```

#### Step 7.2: Write Integration Tests (Test-First)

**File**: `tests/integration/symbols-cli.test.ts` (new file)

```typescript
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('symbols CLI integration', () => {
    it('should accept positional filter arguments', () => {
        const result = execSync(
            'npm run try symbols User --quiet',
            { encoding: 'utf-8' }
        );

        // Should execute without errors
        expect(result).toBeTruthy();
    });

    it('should accept runtime flag', () => {
        const result = execSync(
            'npm run try symbols --runtime --quiet',
            { encoding: 'utf-8' }
        );

        expect(result).toBeTruthy();
    });

    it('should accept types flag', () => {
        const result = execSync(
            'npm run try symbols --types --quiet',
            { encoding: 'utf-8' }
        );

        expect(result).toBeTruthy();
    });

    it('should accept case-sensitive flag with filter', () => {
        const result = execSync(
            'npm run try symbols user --case-sensitive --quiet',
            { encoding: 'utf-8' }
        );

        expect(result).toBeTruthy();
    });

    it('should handle quoted filter arguments', () => {
        const result = execSync(
            'npm run try symbols \\"UserType\\" --quiet',
            { encoding: 'utf-8', shell: '/bin/bash' }
        );

        expect(result).toBeTruthy();
    });
});
```

**Expected Result**: Tests should FAIL (positional args not wired yet).

#### Step 7.3: Verify Tests Fail

```bash
npm test -- tests/integration/symbols-cli.test.ts
```

#### Step 7.4: Update Main CLI Entry Point

**File**: `src/typed.ts`

Update the symbols command invocation to pass positional arguments:

```typescript
case "symbols": {
    const [, opts, positionalArgs] = create_cli();
    await symbols_command(opts as any, positionalArgs);
    break;
}
```

#### Step 7.5: Verify All Tests Pass

Run the complete test suite to ensure everything works end-to-end:

```bash
npm test
```

**Success Criteria**:
- [ ] All integration tests in `symbols-cli.test.ts` pass
- [ ] All unit tests from previous phases still pass
- [ ] No regressions across entire test suite
- [ ] Test count = (Phase 6 complete + new Phase 7 tests)
- [ ] Manual smoke test: `npm run try symbols User --runtime` works correctly

Save results:

```bash
npm test 2>&1 | tee .ai/test-baselines/phase7-complete.txt
```

Compare with baseline:

```bash
diff .ai/test-baselines/phase1-baseline.txt .ai/test-baselines/phase7-complete.txt
```

## Testing Strategy (Summary)

### Unit Tests

**File**: `tests/unit/symbols-command.test.ts`

1. Test filter matching logic:
   - Quoted literal match (case-sensitive)
   - Unquoted substring match (case-insensitive)
   - Unquoted with `--case-sensitive` flag
   - Multiple filters (OR logic)

2. Test runtime/types filtering:
   - `--runtime` filters correctly
   - `--types` filters correctly
   - Both flags together (warning scenario)

3. Test description formatting:
   - Handles missing JSDoc
   - Formats main comment
   - Includes param tags
   - Truncates long text appropriately

4. Test terminal link generation:
   - Creates correct file:// URLs
   - Includes line numbers
   - Uses absolute paths

### Integration Tests

**File**: `tests/integration/symbols-filter.test.ts`

1. Test end-to-end filtering:
   - Run command with quoted filter
   - Run command with unquoted filter
   - Run command with `--runtime` flag
   - Run command with `--types` flag
   - Run command with `--case-sensitive` flag

2. Test output formatting:
   - Verify description column appears
   - Verify links are generated (check for OSC 8 sequences)
   - Verify dependency colors

## Migration Notes

### Breaking Changes

- The `--filter` / `-f` flag is removed
- Users must use positional arguments instead
- Filter behavior changes from exact substring to glob-like matching

### Backward Compatibility

- Existing users using `--filter` will need to update their scripts
- Recommend adding a deprecation warning in the transition period
- Consider adding a migration guide to documentation

### Documentation Updates

**File**: `README.md`

Update the symbols command documentation:

```markdown
### symbols Command

Analyze and display type symbols with their dependencies.

#### Usage

```bash
typed symbols [filters...] [options]
```

#### Filter Arguments

Positional arguments (non-flags) are treated as filters:

- **Quoted tokens** (`"exact"` or `'exact'`): Case-sensitive exact match
  - Example: `typed symbols "UserType"` matches only `UserType`

- **Unquoted tokens** (`substring`): Case-insensitive substring match
  - Example: `typed symbols user` matches `UserType`, `userService`, `getUser`, etc.

#### Options

- `--runtime`, `-r`: Show only runtime symbols (functions, classes, variables)
- `--types`, `-t`: Show only design-time type symbols
- `--case-sensitive`, `-c`: Make unquoted filters case-sensitive
- `--clear`: Clear symbol cache and rebuild
- `--json`: Output in JSON format
- `--quiet`, `-q`: Minimal output

#### Examples

```bash
# Show all exported type symbols (sample)
typed symbols

# Find symbols containing "user" (case-insensitive)
typed symbols user

# Find exact symbol "UserType" (case-sensitive)
typed symbols "UserType"

# Show only runtime symbols containing "service"
typed symbols service --runtime

# Show only type symbols, case-sensitive filter
typed symbols Type --types --case-sensitive

# Multiple filters (OR logic)
typed symbols user config settings
```

#### Output Columns

- **Symbol**: Symbol name with terminal link to source file
- **Description**: JSDoc comment and parameter information
- **Dependencies**: Colored by scope (local/module/external/graph)

```

## Risk Assessment

### Low Risk
- Adding new CLI flags (backward compatible)
- Terminal link generation (degrades gracefully on unsupported terminals)
- Description formatting (non-breaking addition)

### Medium Risk
- Removing `--filter` flag (breaking change)
  - Mitigation: Add deprecation warning first, document migration path
- Filter matching logic changes (behavioral change)
  - Mitigation: Comprehensive testing, clear documentation

### High Risk
- None identified

## Performance Considerations

1. **JSDoc Extraction**: Already implemented in `getSymbolsJSDocInfo()`, no new overhead
2. **Terminal Links**: Minimal string concatenation overhead
3. **Description Formatting**: Single pass over JSDoc array, negligible impact
4. **Filter Matching**: More sophisticated but still O(n) where n = number of symbols

## Success Criteria

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] CLI flags work as specified
- [ ] Positional filter arguments work correctly
- [ ] Quoted/unquoted filter logic implemented
- [ ] Description column displays properly
- [ ] Terminal links work in major terminals (iTerm2, Terminal.app, VSCode)
- [ ] Documentation updated
- [ ] No performance regression

## Timeline Estimate (TDD Approach)

Each phase now follows Test-Driven Development with baseline → test writing → implementation → verification.

- **Phase 1** (CLI Options):
  - Baseline: 5 min
  - Test writing: 20 min
  - Implementation: 15 min
  - Verification: 10 min
  - **Subtotal**: 50 minutes

- **Phase 2** (Filter Logic):
  - Baseline: 5 min
  - Test writing: 45 min
  - Implementation: 45 min
  - Verification: 15 min
  - **Subtotal**: 1 hour 50 minutes

- **Phase 3** (Description Formatting):
  - Baseline: 5 min
  - Test writing: 30 min
  - Implementation: 30 min
  - Verification: 10 min
  - **Subtotal**: 1 hour 15 minutes

- **Phase 4** (Terminal Links):
  - Baseline: 5 min
  - Test writing: 20 min
  - Implementation: 20 min
  - Verification: 10 min
  - **Subtotal**: 55 minutes

- **Phase 5** (Screen Reporter):
  - Baseline: 5 min
  - Test writing: 35 min
  - Implementation: 40 min
  - Verification: 15 min
  - **Subtotal**: 1 hour 35 minutes

- **Phase 6** (Type Definitions):
  - Baseline: 5 min
  - Test writing: 20 min
  - Implementation: 15 min
  - Verification: 10 min
  - **Subtotal**: 50 minutes

- **Phase 7** (CLI Entry Point):
  - Baseline: 5 min
  - Test writing: 25 min
  - Implementation: 10 min
  - Verification: 15 min
  - **Subtotal**: 55 minutes

- **Documentation**: 45 minutes
- **Final Integration Testing**: 30 minutes

**Total**: ~9 hours 30 minutes

**Note**: The TDD approach adds approximately 2.5 hours to the original estimate but provides:
- Comprehensive test coverage from the start
- Immediate detection of regressions between phases
- Higher confidence in correctness
- Living documentation through tests

## Future Enhancements

1. Add `--format` flag to choose column layout
2. Support for custom column selection
3. Interactive mode with filtering
4. Export to different formats (CSV, Markdown table)
5. Symbol dependency graph visualization in terminal

---

## Implementation Checklist

Before you begin, ensure:

- [ ] Create test baseline directory: `mkdir -p .ai/test-baselines`
- [ ] Add `.ai/test-baselines/` to `.gitignore` (optional - these are implementation artifacts)
- [ ] Current test suite is passing (establish clean baseline)
- [ ] Understanding of TDD workflow: Baseline → Test → Fail → Implement → Pass

**Phase Completion Checklist** (repeat for each phase):

- [ ] Baseline captured (`.ai/test-baselines/phaseN-baseline.txt`)
- [ ] Unit tests written demonstrating new functionality
- [ ] Tests verified to fail initially (confirming test validity)
- [ ] Implementation completed
- [ ] All new tests passing
- [ ] No regressions in existing tests
- [ ] Completion state saved (`.ai/test-baselines/phaseN-complete.txt`)
- [ ] Next phase baseline matches current completion (if applicable)

**Final Verification** (after Phase 7):

- [ ] All 7 phases completed successfully
- [ ] Complete test suite passing
- [ ] Manual smoke testing of CLI:
  - `npm run try symbols User` (basic filter)
  - `npm run try symbols "UserType"` (quoted exact match)
  - `npm run try symbols --runtime` (runtime filter)
  - `npm run try symbols --types` (types filter)
  - `npm run try symbols user --case-sensitive` (case-sensitive)
- [ ] Terminal links work in your terminal (clickable file paths)
- [ ] Description column displays JSDoc comments
- [ ] Documentation updated in README.md

---

## Key Principles

1. **Never skip test writing** - Tests are written BEFORE implementation
2. **Always verify failures** - If tests don't fail initially, they're not valid
3. **Track baselines religiously** - Every phase starts with a snapshot
4. **Zero regressions tolerated** - Any existing test failure stops progress
5. **Phase isolation** - Each phase completes fully before moving to the next

**Success is not measured by speed, but by test coverage and zero regressions.**
