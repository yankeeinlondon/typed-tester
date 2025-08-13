# Fix Deps Command

- The primary idea behind the `deps` command is to express the dependencies that one symbol has on other symbols
- By default when we run `typed deps` it will evaluate all symbols and report on all symbols.
- I haven't used this command in a while and it appears that it no longer works

Let's take this opportunity to refactor it:

- there is a new `Dependency` and `
