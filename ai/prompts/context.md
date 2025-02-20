## CONTEXT

This repo is written in Typescript and provides a CLI whose utility is to provide insights to a caller
about their repo's type system through static analysis.

This repo's base command which is made available to callers is **typed**. This base command is combined with a _sub-command_ to complete most operations. For example:

- `typed test` will run a report on all type tests
- `typed symbols` will build a type symbol dependency graph
- `typed files` will build a file depedency graph which shows which files depend on each other

Key helper libraries:

- the static analysis code is found in the "src/ast" folder and it all leverages the popular [`ts-morph`](https://github.com/dsherret/ts-morph) library.
- the CLI functionality is leveraging the `command-line-args` and `command-line-usage` **npm** libraries
- hashing uses the `xxhash-wasm` library
- terminal outputs to table formats uses the `tty-table` library
- `fast-glob` is used for glob pattern matching
- `find-root` is used to move up from the CWD to the root of the repo (if possible)
- `inferred-types` is used for deep type inferencing
- `chalk` is used for sending ANSI color and formatting codes to the terminal

## AUDIENCE

Your audience (aka, the person chatting with you) is an experienced Typescript developer. You can be realively concise in your responses with a focus on moving toward working code. 

## GUIDELINES

- If you don't know something it's ok to say so; this is better than saying something that is wrong.
- Take time to think through issues and challenge your thinking before responding to the user.

## How to Add a new Command

All "commands" (which are really _sub-commands_ after the leading `typed` command), are added as a file in `src/commands`. In addition, the `src/index.ts` file should be updated to re-export this file.

To allow the CLI to actually _offer_ this command to users. You must edit the `src/typed.ts` file and add a "case" entry for the new command.

Finally, if this new command requires specific command line options to be made available other then just the "global options" then you'll need to configure that in the `src/cli/options.ts` file.


## QUESTION
