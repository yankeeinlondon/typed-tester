# Feature

## Context

When a user types no parameter, or when they explicitly type `--help` they will be presented with the help screen.

## Change

This largely works the way we'd like it to but with this feature we'll add the version number of the CLI (taken from package.json) and include it right after the CLI's name. 

### Before

```sh
Typed

  Typescript type testing and diagnostics.
```

### After

```sh
Typed v0.9.0

  Typescript type testing and diagnostics.
```

- The `v` should be dimmed using `chalk` library
- The semantic version number normal text but the `Typed` title should be made bold


