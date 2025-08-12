# Feature

The `test` command originally has a `--filter` switch which was required to filter the files which you want to evaluate. We then removed the `--filter` switch and changed the behavior to just filter on any non-switch based string passed into ARGV.

- before `typed test --filter datetime`
- after `typed test datetime`

Somehow those changes seem to have been removed and so we need to add them back in.

Note: a `!` as the first character of the string makes the glob pattern a negation so: `typed test !datetime` tests all files that do NOT have "datetime" in their filepath. This is the normal behavior of fast-glob so should be fairly routine to implement.


