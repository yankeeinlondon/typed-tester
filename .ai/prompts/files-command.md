---
files: 
    - "src/commands/files.ts"
---

I've created a boilerplate starting point for the `files` command and I'd like you to build it out for me.

### Functional Goals

- list all files in the project which define a type symbols
- for each file there should be a list of the symbols, along with the line numbers where they can be found.
- output types should be tabular by default but switch to a JSON array if the `--json` flag is set
- use the formatting approach shown in the `src/commands/symbols.ts` command as the template for how to do this.
- also remember that the `tty-table` package is being used for tabular outputs

