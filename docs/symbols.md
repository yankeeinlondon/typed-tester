# `symbols` Command

The _symbols_ command provides a tabular view of all of the **type** symbols in your project. Output might look something like the following:

```txt
  ┌──────────────────────────┬────────────┬─────────────────────────────────────────┬─────────────────────────────┐
  │          Symbol          │    Hash    │              Dependencies               │          filepath            │
  ├──────────────────────────┼────────────┼─────────────────────────────────────────┼─────────────────────────────┤
  │ SymbolImport             │ 3539241414 │             SymbolReference             │          src/ast/           │
  │                          │            │                                         │      file-ast-types.ts       │
  ├──────────────────────────┼────────────┼─────────────────────────────────────────┼─────────────────────────────┤
  │ FileDiagnostic           │ 3250706160 │                                         │          src/ast/           │
  │                          │            │                                         │      file-ast-types.ts       │
  ├──────────────────────────┼────────────┼─────────────────────────────────────────┼─────────────────────────────┤
  │ SymbolKind               │ 3956361228 │                                         │          src/ast/           │
  │                          │            │                                         │     symbol-ast-types.ts     │
  ├──────────────────────────┼────────────┼─────────────────────────────────────────┼─────────────────────────────┤
  │ SymbolScope              │ 3891381351 │                                         │          src/ast/           │
  │                          │            │                                         │     symbol-ast-types.ts     │
  ├──────────────────────────┼────────────┼─────────────────────────────────────────┼─────────────────────────────┤
  │ SymbolFlagKey            │ 2345275127 │                                         │          src/ast/           │
  │                          │            │                                         │     symbol-ast-types.ts     │
  ├──────────────────────────┼────────────┼─────────────────────────────────────────┼─────────────────────────────┤
  │ TypeGeneric              │ 997644223  │                                         │          src/ast/           │
  │                          │            │                                         │     symbol-ast-types.ts     │
  ├──────────────────────────┼────────────┼─────────────────────────────────────────┼─────────────────────────────┤
  │ JsDocInfo                │ 3450552296 │                JsDocTag                 │          src/ast/           │
  │                          │            │                                         │     symbol-ast-types.ts     │
  ├──────────────────────────┼────────────┼─────────────────────────────────────────┼─────────────────────────────┤
  │ SymbolReference          │ 1807084356 │               SymbolKind                │          src/ast/           │
  │                          │            │                                         │     symbol-ast-types.ts     │
  ├──────────────────────────┼────────────┼─────────────────────────────────────────┼─────────────────────────────┤
  │ JsDocTag                 │ 3493625031 │                                         │          src/ast/           │
  │                          │            │                                         │     symbol-ast-types.ts     │
  ├──────────────────────────┼────────────┼─────────────────────────────────────────┼─────────────────────────────┤
  │ TypeTest                 │ 3136554204 │     FileDiagnostic, SymbolReference     │          src/ast/           │
  │                          │            │                                         │      testing-types.ts       │
  └──────────────────────────┴────────────┴─────────────────────────────────────────┴─────────────────────────────┘
```

It provides info on:

- **Symbol Name** - the name of the symbol (but we guess you figured that one out)
- **Hash** - the cached has value of this symbol (used for tracking changes)
- **Dependencies** - any types which the given symbol relies on for it's own function
- **File Path** - the file path to where the given symbol is defined

> Notes: 
> 
> - the tabular format is width _responsive_ so if you're working in a fairly constrained space in the terminal some columns may be removed to have it fit in legible format.
> - The dependencies are color coded based on where the dependency originates from

## Alternative Output Formats

### JSON format

The JSON format is available by adding `--json` to the CLI and you will get an array of `SymbolImport` objects returned to you. Each imported symbol has a 0:M set of dependencies which are represented by the `SymbolReference` type.

### SVG Graph

- this is not currently implemented but is a desired feature

## Notes on Caching

- the cache file `.ts-symbol-lookup.json` will be created at the root of your project when you first run this command. 
- we recommend adding `.ts-*` to your `.gitignore` file so that these cache files don't make it into the repo itself.

## Other Sections

- [Overview](./overview.md)
- [`test` Command](./test.md)
- [`source` Command](./source.md)
