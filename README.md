# `typed`

> a CLI and Vite plugin which runs "type tests" for your Typescript projects

## Install

You can install locally in a project or globally via `npm`:

```sh
# install globally
npm install -g typed
# install locally to a project (preferred)
npm install -D typed
```

> **Note:**
>
> in order for the _same_ version of Typescript to be used for type testing as you are using in your repo we include `typescript` as a "peer dependency" ... meaning it is required but not included. For any normal Typescript based project this is a non-issue as you'd clearly have already installed Typescript as a development dependency but if you _do_ install this globally so you can use the CLI where you like, then be sure to install a modern version of Typescript globally too.

When running as a local dependency you can interactively use the tool by running:

```sh
# run a command (e.g., "test", "diagnostics", etc.)
npx typed [cmd]
# get a CLI help menu
npx typed
```

But in general it is recommended to add a _script_ to your `package.json`:

```json
"scripts": {
    "test:types": "typed test"
}
```

## Usage

### As a CLI

The CLI has the following commands:

1. Type Testing:

    ```sh
    [npx] typed test [filter]
    ```

    This is the _primary_ utility for this repo will identify test files in your repo and run "type tests" on them. Runtime results are not a concern of this command, however, you can optionally "opt in" to get additional _type errors_ or _warnings_ outside of your core tests (although this is reserved to just the "test files").

    By default this library will cache your file dependencies (aka, what symbols does your test file use, and then what is the graph of types which make up those symbols) with the goal of being able to _watch_ and _report_ on changes as you code. To run your testing in "watch mode" add the `--watch` flag to the end of the command.

    The dependency caching will also cache an AST representation of all source files which were needed to complete your test coverage. This has valuable performance improvements but if you're ever feeling uncertain whether the cache is actually interfering with accurate results you can clear it at startup by adding the `--clear` flag. Refer to the **Cache Details** section below for more details.


2. Source Diagnostics:

    ```sh
    [npx] typed diagnostics [filter] [--show-warnings] [--only-top=10]
    ```

    Evaluates all of the sources files and provides the following metrics by file:

    - errors: type errors not reduced to warnings
    - warnings: type errors specified to show as warnings (such as type defined but not used)
    - performance metrics:
        - **AST build time**:  how long did it take to create an AST out of the file)
        - **Perf per Lines of Code**: build time by lines of code
        - **Perf per Symbol**: build time by symbols in file

3. Source Dependency Graph:

    ```sh
    [npx] typed graph [filter] 
    ```

    Produces a list of source _type symbols_ and their dependencies on other symbols.

4. Type Coverage:

    ```sh
    [npx] typed coverage
    ```

    Provides the following metrics:

    - total number of symbols found in source code
    - symbols tested directly (and coverage %)
    - symbols tested directly or indirectly (and coverage %)
  
    Note:
    - These metrics aren't perfect but they're better than the absence of metrics
    - The coverage relating to "directly or indirectly" means ...
      - Where the symbol was directly tested (aka, there was a direct test that symbol result in an expected type) _or_ (less ideally) that some other symbol _used_ the type to calculate a tested outcome.


### Using as Vite plugin

TBD. The first step is to make sure the CLI is mature and then we'll implement as a Vite plugin.


## Details

### Configuring "test files"

We attempt to find these for you by doing the following two things automatically:

1. If you have a `vite.config.ts` or `vitest.config.ts` file we will use the glob patterns defined there to identify candidate files.
2. If neither of the two above files are present then we will use the default _include_ pattern of: `{test,tests,src}/**/*.{test,spec}.ts`

Finally, if the ENV variable `TEST_FILES` or `VITE_TEST_FILES` is set then we will use this value over everything else.

### Cache Details

The cached data is stored in the root of the repo which you are testing and will appear in the following files:

- `.dependencies.json` - is a JSON dictionary whose keys are the test files which were tested, they map to hash values which represent the symbol at a point in time. If that point in time is no longer valid (aka, the cache is stale) then this hash key will no longer be available in the `.symbols.json` lookup
- `.symbols.json` is a JSON dictionary whose keys are _types_ in your source code and whose value corresponds to something similar to the following (refer to `SymbolDefn` in the source for an _always current_ definition): 

  ```ts
  export type SymbolDefn = {
      /** symbol name */
      symbol: string;
      /** source file */
      filepath: string;
      /** uses xxhash hasher to determine whether hosting file's contents have changed */
      file_hash: string;
      /** uses xxhash hasher to determine whether the specific text representing the symbol has changed */
      symbol_hash: string;
      /** serialized AST representation */
      ast: string;
  }
  ```

### To Git or Not to Git the Cache

Rather than state an opinion outright, I will say that users of this library _should consider_ whether the "cache files" should go into the git repo or be included as part of the `.gitignore`. It really comes down to:

1.  your confidence that the caching algorithm's ability to detect stale data and re-cache when necessary
2.  the benefits of the increased performance of running off a cache (this will be larger and larger as your types increase in quantity and complexity)


## Contributing and Reporting Issues

If you do find any issues with this library please consider making a pull request with a tested fix. If you're only going to enter an issue please be 100% sure that you've provided enough information to _easily_ reproduce your issue (or just don't submit it and live with manual cache breaking).


## License

MIT License

Copyright (c) 2024-PRESENT Ken Snyder<https://github.com/yankeeinlondon>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
