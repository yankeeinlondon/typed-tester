# Overview of Typed Tester

The original goal of this repo -- and still it's primary focus -- is to run "type tests" which can compliment your runtime tests in **Vitest** (or whatever runner you prefer).

For more on this function, read about the [`test` Command](./test.md).

In addition to this functionality this repo also provides:

- [`source` Command](./source.md)
  - analyze your source files for errors across all files
- [`symbols` Command](./symbols.md)
  - view all the type symbols defined in your project and the dependencies these symbols have

> **Note:** this library leverages the popular [ts-morph](https://github.com/dsherret/ts-morph) library for static analysis.


