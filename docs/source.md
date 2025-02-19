# `source` Command

While the _primary_ focus of this repo is to run "type tests", being being able to get insights into type problems which exist inside your source code can be helpful too. 

## Usage

```sh
typed source
```

This command will then list -- _by file_ -- all typescript errors found.

Output may look something like this:

```txt
Errors
-----------------------

src/watch.ts [23]
    - [c: 2307, l: 5, col: 53 ] - Cannot find module './commands/testing/getFileDiagnostics' or its corresponding type declarations.
    - [c: 2304, l: 9, col: 46 ] - Cannot find name 'ValidationOptions'.
    - [c: 7006, l: 11, col: 14 ] - Parameter 'i' implicitly has an 'any' type.
    - [c: 7006, l: 14, col: 14 ] - Parameter 'i' implicitly has an 'any' type.
    - [c: 7006, l: 24, col: 49 ] - Parameter 'i' implicitly has an 'any' type.
    - [c: 2304, l: 42, col: 46 ] - Cannot find name 'AsOption'.
    - [c: 2304, l: 43, col: 15 ] - Cannot find name 'getCache'.
    - [c: 2304, l: 47, col: 16 ] - Cannot find name 'getDependencies'.
    - [c: 2304, l: 59, col: 68 ] - Cannot find name 'core_dir'.
    - [c: 2304, l: 73, col: 3 ] - Cannot find name 'watcher_core'.
    - [c: 7006, l: 73, col: 27 ] - Parameter 'event' implicitly has an 'any' type.
    - [c: 7006, l: 73, col: 34 ] - Parameter 'targetPath' implicitly has an 'any' type.
    - [c: 7006, l: 73, col: 46 ] - Parameter 'targetPathNext' implicitly has an 'any' type.
    - [c: 2304, l: 77, col: 9 ] - Cannot find name 'coreFileChange'.
    - [c: 2304, l: 87, col: 17 ] - Cannot find name 'removeFromCache'.
    - [c: 2304, l: 112, col: 12 ] - Cannot find name 'hasDependency'.
    - [c: 2304, l: 113, col: 23 ] - Cannot find name 'getDependency'.
    - [c: 2345, l: 115, col: 170 ] - Argument of type 'unknown' is not assignable to parameter of type 'string'.
    - [c: 2304, l: 117, col: 15 ] - Cannot find name 'coreFileChange'.
    - [c: 2304, l: 123, col: 12 ] - Cannot find name 'hasDependency'.
    - [c: 2304, l: 124, col: 23 ] - Cannot find name 'getDependency'.
    - [c: 2345, l: 125, col: 168 ] - Argument of type 'unknown' is not assignable to parameter of type 'string'.
    - [c: 2304, l: 127, col: 13 ] - Cannot find name 'coreFileChange'.

- command took 1457.777ms
```

## Other Sections

- [Overview](./overview.md)
- [`test` Command](./test.md)
- [`symbols` Command](./symbols.md)
