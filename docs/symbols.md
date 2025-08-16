# `symbols` Command

The _symbols_ command provides a tabular view of all of the **type** symbols in your project. It analyzes exported type symbols and their dependencies using the project's dependency graph system.

```txt
  ┌─────────────────────┬───────────────────┬─────────────────────────────────┐
  │       Symbol        │     filepath      │          Dependencies           │
  ├─────────────────────┼───────────────────┼─────────────────────────────────┤
  │ AsOption<TCmd>      │     src/cli/      │                                 │
  │                     │   cli-types.ts    │                                 │
  ├─────────────────────┼───────────────────┼─────────────────────────────────┤
  │ SymbolMeta          │      src/types/   │    FQN, SymbolKind, SymbolScope │
  │                     │ symbol-ast-types  │                                 │
  │                     │       .ts         │                                 │
  ├─────────────────────┼───────────────────┼─────────────────────────────────┤
  │ DependencyNode      │     src/types/    │       FQN, SymbolMeta           │
  │                     │   dependency.ts   │                                 │
  └─────────────────────┴───────────────────┴─────────────────────────────────┘
```

## Features

- **Symbol Analysis**: Shows exported type symbols from your TypeScript project
- **Dependency Integration**: Leverages the same dependency graph system used by the `deps` command
- **Intelligent Filtering**: Filter symbols by name or pattern to focus on specific types
- **Performance Optimized**: Uses efficient caching and analysis strategies
- **Responsive Layout**: Table adjusts to terminal width for optimal readability

## Information Displayed

- **Symbol Name** - The name of the type symbol, including generic parameters if present
- **File Path** - Relative path to where the symbol is defined (truncated for readability)
- **Dependencies** - Other symbols this type depends on, color-coded by scope:
  - 🟡 **Local** - symbols defined in the same file
  - 🔴 **Module** - symbols from other files in your project
  - 🔵 **External** - symbols from external libraries
  - 🟣 **Graph** - other dependency graph relationships

## Usage Examples

```bash
# Show all exported type symbols (limited to 10 by default)
typed symbols

# Filter symbols by name pattern
typed symbols --filter="Option"
typed symbols --filter="Symbol*"

# Show specific symbols with multiple filters
typed symbols --filter="AsOption" --filter="SymbolMeta"

# Get detailed output without sampling limit
typed symbols --filter="*"

# Output in JSON format for programmatic use
typed symbols --json
```

## Integration with Dependency System

The symbols command is fully integrated with the project's dependency graph:

- **Shared Cache**: Uses the same `.dependencies.json` cache as the `deps` command
- **Consistent Analysis**: Same symbol analysis engine ensures consistency
- **Performance**: Leverages cached dependency data when available
- **Cross-Reference**: Symbols shown here can be analyzed in detail with `deps --graph`

## Alternative Output Formats

### JSON format

The JSON format is available by adding `--json` to the CLI and you will get an array of `SymbolMeta` objects with dependency information:

```json
[
  {
    "name": "AsOption",
    "fqn": "src/cli/cli-types.ts::AsOption",
    "kind": "type-defn",
    "scope": "module",
    "filepath": "src/cli/cli-types.ts",
    "startLine": 15,
    "endLine": 18,
    "deps": [
      {
        "name": "TCmd",
        "fqn": "src/cli/cli-types.ts::TCmd",
        "kind": "type-constraint",
        "scope": "local"
      }
    ]
  }
]
```

### SVG Graph

- This is planned for future implementation as part of the enhanced dependency visualization features

## Performance Notes

The symbols command is optimized for performance:

- **Intelligent Sampling**: Shows a sample of 10 symbols by default to avoid overwhelming output
- **Efficient Filtering**: Use `--filter` to narrow results and improve performance
- **Shared Caching**: Reuses dependency analysis from the `deps` command when available
- **Direct Analysis**: Falls back to optimized direct symbol analysis when needed

## Cache Files

The symbols command integrates with the project's caching system:

- **`.dependencies.json`**: Shared cache with the `deps` command for dependency data
- **`.symbols.json`**: Symbol metadata cache (if present)
- **Recommendation**: Add these cache files to `.gitignore` unless you want to commit them for team performance benefits

## Related Commands

- [`deps`](./deps.md) - Analyze symbol dependencies in detail
- [`test`](./test.md) - Run type tests on symbols
- [`source`](./source.md) - Analyze source file metrics

## Other Sections

- [Overview](./overview.md)
- [`test` Command](./test.md)
- [`source` Command](./source.md)
- [`deps` Command](./deps.md)
