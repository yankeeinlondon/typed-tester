# Fix Deps Command

- The primary idea behind the `deps` command is to express the dependencies that one symbol has on other symbols (recursively)
- By default when we run `typed deps` it will evaluate all symbols and report on all symbols.
- I haven't used this command in a while and it appears that it no longer works

Let's take this opportunity to refactor it:

- we need a efficient (memory and time) way to cache symbols in a project and then create a dependency graph for each symbol
- a "rough draft" in terms of thinking does exist but it must be first questioned and improved upon:

## Current Thinking on Caching Symbols and Deps

THIS SECTION NEEDS AN ARCHITECT TO REVIEW AND DESIGN

- we create a cache of all symbols; shaped something like this:

      ```ts
      // look up a symbol by it's fully qualified name
      const symbols = new Map<FQN,SymbolMeta>();
      ```

- once all symbols that the project defines reside in the cache we can then iterate over these symbols to create a dependency graph for each of these symbols
  - this might take a shape something like:

      ```ts
      const dependencies = new WeakMap<SymbolMeta, Dependency>;
      ```

- once all local dependencies have been cached we're ready to 
  - now we can lookup any symbol in the project in `symbols` and get back the `SymbolMeta` for it; with the `SymbolMeta` we can then lookup it's dependency graph.
- a new type `Dependency` can be found in src/ast/dependency.ts:
  - this type can be modified to suite our design as it has no use yet
  - it is meant to represent a starting point for thinking about how we might model dependencies

NOTE: in our symbols cache we only want to capture symbol definition and not _re-exports_ of symbols which are defined elsewhere.

## CLI command interface

I think there are two sorts of queries the "deps" command should service:

1. List View

    - the list view should support the reporting on several (even possibly ALL) symbols in the project
    - the list view is the _default_ view for the CLI command so no CLI switches are needed to activate it
    - In the list view we will simply report on the first-order dependencies of each object rather than try to represent any sort of full dependency graph
    - any string parameters which are not switches (aka, don't start with `-` character) will be treated as glob patterns to match on and reduce the project symbol set.

    Example:

    ```txt
    # lists all symbols which have `Get` as part of their name along with a list of their dependencies
    typed deps Get --list
    ```

2. Detail/Graph View

   - the detail view allows us to see a full dependency graph of a single system:
     - not just the direct dependencies but also the dependencies of dependencies
   - to choose this view over the list view a use must use the `--graph` switch
   - unlike the list view, the detail/graph view will focus on only one symbol
     - in the same way that list view works, all non-switch parameters are used as glob patterns to reduce the symbols
     - if the parameters result in reducing the number of Symbols down to just one:
       - then that is the symbol that will be used
       - in all other cases the list of remaining symbols will be presented as choices and the user will interactively  choose which one they want to evaluate.

        > Note: we should use the `@yankeeinlondon/ask` library for interactive questions to the user on the console. This dependency has been added to the package.json but is not currently being used.

        As an example of how we might use it:

        ```ts
        import { createChoices, ask } from "@yankeeinlondon/ask";

        // the remaining symbol names after glob patterns applied
        const remainingSymbols: string[] = [...];

        // the available options 
        const choices = createChoices(remainingSymbols.reduce(
            (acc, i) => ({
                ...acc,
                [prettyPath(i)]: i
            }), {}
        ));

        const answer = await ask.select("Which symbol do you want to evaluate?", choices);
        ```

   - the output of this view is hierarchical and might look something like:

        ```txt
        DoSomething<T> in filename
          - Trim<T> in filename
            - StringSubset<T,U> in filename
                - IsLiteral<T> in filename
                - WhoYurUncle<T> in filename
            - SomethingElse<T> in filename
          - Length<T> in filename
        ```

Both views need to be able to produce a valid JSON output if the `--json` flag is selected:

- the JSON output should offer more details than the screen output as we intentionally limit information to the screen so that it stays focused on just the relevant info
- the List View and the Detail View should probably both just return the `Dependency` graphs for the symbols which were selected.


