# `test` Command

The heart of this repo is intended to allow you to create "type tests" like this:

```ts
import { Expect, Equal } from "@type-challenges/utils";
import { describe, it } from "vite";

describe("Example", () => {

  it("type test", () => {
    const foo = "hello";
    
    type cases = [
      Expect<Equal<typeof foo, "hello">>,
    ];

  });
});
```

and have them produce comprehensible errors in real-time which can be used by your CI-CD process to ensure not only _runtime tests_ pass but so do all _type tests_.


## Usage

```sh
typed test
```

Will produce results similar to these:

```txt
Test Results:
---------------------------------------------
 ⤬  tests/data/tests/real-test.test.ts (3 tests)
    [ ⤬ ] A real test [2 tests, 2 errors]
          [ ⛒ ] should have a type error
           - [  ⛒ , cd: 2344, l: 16, col: 14 ] Type 'false' does not satisfy the constraint 'true'.
           - [  ⛒ , cd: 2322, l: 19, col: 7 ] Type 'true' is not assignable to type 'false'.
          [ ✔ ] should NOT have a type error
    [ ⤬ ] Another real test group [1 test, 1 error]
          [ ⛒ ] using a good import
           - [  ⛒ , cd: 6196, l: 44, col: 10 ] 'cases' is declared but never used.
 ⤬  tests/data/tests/unused-import.test.ts (1 tests, 66ms, 6053μs/line)
    [ ⇣ ] Areas OUTSIDE of tests blocks
```

If you're using [Wezterm](https://wezterm.org/) -- or any console which support the new emerging standard for hyperlinks in the console -- you will get clickable links not only to the files reported on but also a link to the typescript error's definition online.

### Test Files

In terms of identifying your "test files" this repo will try to use "magic" to identify your test files. That magic is largely just that it will look for:

- `.ts` files in _tests_, _test_, or _source_ directories which have `.test.ts` or `.spec.ts` in the filename

If you just want a confirmation of _which_ files this command is "seeing" as your test files you can run:

```sh
typed test --files
```

If the auto-matcher doesn't work for your file naming conventions, or you have your `tsconfig.json` in an unusual place you can adjust this with:

- the `--config` or `-c` flags allow you point to an explicit location for your `tsconfig.json` file
- the `--match` or `-m` flags allow you use a different **glob** pattern for matching tests

Here's a simple example:

```sh
typed test -c some/odd/place/tsconfig.json -m "tests/*-spec.ts"
```

> **Note:** because we're doing static analysis we do need both the test files _and_ the `tsconfig.json`.


## Other Sections

- [Overview](./overview.md)
- [`symbols` Command](./symbols.md)
- [`source` Command](./source.md)
