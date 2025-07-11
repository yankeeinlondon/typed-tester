When I run the symbols sub-command and pass in the `--json` flag like so:

```sh
typed symbols --json
```

it does provide valid JSON but the the property called `generics` is always empty even when it should not be.

The symbols in this repo which have generics include:

- `SymbolMeta`, 
- and I've added a test type called `Foo<T>` too so we have a second variant

I have now noticed that in fact any symbol which has a generic is **not** exported at all as part of the resultant JSON! It seems this symbol entry must be silently failing but still returning all the symbols which do not have a generic.

## Please Note

The last time I asked this question I got this suggested change to the `src/commands/symbols.ts` file:

```delta
 <<<<<<< SEARCH
 function getSymbolGenerics(symbol: Symbol): TypeGeneric[] {
   const declarations = symbol.getDeclarations();
 =======
 function getSymbolGenerics(symbol: Symbol): TypeGeneric[] {
   const declarations = (symbol.getAliasedSymbol() || symbol).getDeclarations();
 >>>>>>> REPLACE
 ```

 This is not only not helpful -- as we are very much trying to avoid duplicates which come from aliases -- but also it doesn't fix anything!

