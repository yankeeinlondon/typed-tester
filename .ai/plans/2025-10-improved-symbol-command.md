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

### Phase 1: CLI Options Update

**File**: `src/cli/options.ts`

1. Update the `symbols` command options:
   - Remove `filter` option
   - Add `runtime` flag (Boolean, alias: "r")
   - Add `types` flag (Boolean, alias: "t")
   - Add `case-sensitive` flag (Boolean, alias: "c")

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

### Phase 2: Filter Logic Update

**File**: `src/commands/symbols.ts`

1. Update `filterSymbols()` function signature and implementation:

```typescript
interface FilterOptions {
    filters: string[];           // positional arguments
    caseSensitive: boolean;      // --case-sensitive flag
    runtime?: boolean;           // --runtime flag
    types?: boolean;             // --types flag
}

function filterSymbols(
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

function matchesFilter(symbolName: string, filter: string, caseSensitive: boolean): boolean {
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

2. Update `symbols_command()` to use positional arguments:

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

### Phase 3: Description Formatting Utility

**New File**: `src/report/formatDescription.ts`

Create a utility to format JSDoc information into a readable description:

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

function truncateText(text: string, maxWidth: number): string {
    // Remove color codes for length calculation
    const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');

    if (stripped.length <= maxWidth) {
        return text;
    }

    // Find a good breaking point
    const truncated = text.substring(0, maxWidth - 3);
    return truncated + chalk.dim('...');
}

function extractParamName(commentText: string): string {
    // Extract parameter name from "@param paramName description" format
    const match = commentText.match(/^(\w+)/);
    return match ? match[1] : '';
}
```

### Phase 4: Terminal Link Utility

**New File**: `src/report/terminalLink.ts`

Create a utility to generate terminal hyperlinks:

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

### Phase 5: Update Screen Reporter

**File**: `src/report/symbolsScreen.ts`

1. Update imports:

```typescript
import { formatDescription } from "./formatDescription";
import { createTerminalLink } from "./terminalLink";
```

2. Modify column definitions:

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

### Phase 6: Update Type Definitions

**File**: `src/cli/cli-types.ts` (or wherever AsOption type is defined)

Ensure the `AsOption<"symbols">` type includes new fields and positional args:

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

### Phase 7: Update Main CLI Entry Point

**File**: `src/typed.ts`

Update the symbols command invocation to pass positional arguments:

```typescript
case "symbols": {
    const [, opts, positionalArgs] = create_cli();
    await symbols_command(opts as any, positionalArgs);
    break;
}
```

## Testing Strategy

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

## Timeline Estimate

- Phase 1 (CLI Options): 30 minutes
- Phase 2 (Filter Logic): 1 hour
- Phase 3 (Description Formatting): 1 hour
- Phase 4 (Terminal Links): 30 minutes
- Phase 5 (Screen Reporter): 1 hour
- Phase 6 (Type Definitions): 15 minutes
- Phase 7 (CLI Entry): 15 minutes
- Testing: 2 hours
- Documentation: 30 minutes

**Total**: ~7 hours

## Future Enhancements

1. Add `--format` flag to choose column layout
2. Support for custom column selection
3. Interactive mode with filtering
4. Export to different formats (CSV, Markdown table)
5. Symbol dependency graph visualization in terminal
