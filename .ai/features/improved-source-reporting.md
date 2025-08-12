# Improved Reporting Feature

Currently when we run the `typed source` command we get output that looks something like this in the console:

```txt
Source File Analysis
-------------------------------
- project found 1629 source files (569 test files excluded) [tsconfig.json]
- analyzing TypeScript diagnostics...

DIAGNOSTICS SUMMARY:

- 2987 errors across 1219 files

Error Codes:
  2307: 1877 occurrences
  2321: 248 occurrences
  2314: 214 occurrences
  2344: 174 occurrences
  18046: 157 occurrences
  2339: 83 occurrences
  2345: 48 occurrences
  2589: 39 occurrences
  2322: 27 occurrences
  2536: 14 occurrences
  2315: 13 occurrences
  2707: 12 occurrences
  2304: 10 occurrences
  2769: 9 occurrences
  2590: 8 occurrences
  2456: 7 occurrences
  2552: 6 occurrences
  2550: 6 occurrences
  18048: 5 occurrences
  1343: 4 occurrences
  2538: 4 occurrences
  2358: 3 occurrences
  2732: 2 occurrences
  2823: 2 occurrences
  2349: 2 occurrences
  2802: 2 occurrences
  2731: 2 occurrences
  2306: 2 occurrences
  2742: 1 occurrences
  2352: 1 occurrences
  2469: 1 occurrences
  2721: 1 occurrences
  2551: 1 occurrences
  2574: 1 occurrences
  1009: 1 occurrences

- command took 67864.090041ms
```

In addition, if a user adds the `-v` (verbose) flag then they will also get a "Files with errors:" section added to the end. It should look something like this:

```txt
Files with errors:
  - modules/runtime/src/datetime/asDate.ts (8 errors)
  - modules/runtime/src/datetime/asDateTime.ts (4 errors)
  - modules/runtime/src/datetime/asEpochTimestamp.ts (2 errors)
  - modules/runtime/src/datetime/asIsoDate.ts (3 errors)
  - modules/runtime/src/datetime/asIsoDateTime.ts (2 errors)
  - modules/runtime/src/datetime/dateObjectToIso.ts (3 errors)
  - modules/runtime/src/datetime/daysInMonth.ts (3 errors)
  - modules/runtime/src/datetime/getDay.ts (2 errors)
  - modules/runtime/src/datetime/getDaysBetween.ts (1 errors)
  - modules/runtime/src/datetime/getMonthAbbrev.ts (3 errors)
  - modules/runtime/src/datetime/getMonthName.ts (3 errors)
  - modules/runtime/src/datetime/getMonthNumber.ts (6 errors)
  - modules/runtime/src/datetime/getSeason.ts (3 errors)
  - modules/runtime/src/datetime/getToday.ts (1 errors)
  - modules/runtime/src/datetime/getTomorrow.ts (1 errors)
  - modules/runtime/src/datetime/getWeekNumber.ts (1 errors)
  - modules/runtime/src/datetime/getYear.ts (2 errors)
```

While this is a useful starting point, there are a few key improvements we'd like to make:

## Improvements for this Feature

1. Error Name: the code is useful and users will start to recognize error codes they get a lot but a short name for each code would make the results in the basic summary much more useful:

    Instead of reporting the following:

    ```txt
    2307: 1877 occurrences
    ```

    we should instead report like so:

    ```txt
    [cd 2307, count 1877 ] - Cannot find module '{0}' or its corresponding type declarations.
    ```

    - be sure that the code is still a "link" using the already existing `toCodeLink()` function.
    - use an aesthetically pleasing set of colors for the various aspects of the report

2. Files analyzed

    Currently we report something along the lines of:

    ```txt
    - project found 1629 source files (569 test files excluded) [tsconfig.json]
    ```

    This _kind_ of message is good but should be rephrased so things are clearer. Here's an 
    example of what we should aim for:

    ```txt
    - of 1629 source files, the analysis will focus on 350 files after removing:
        - 629 test files were ignored
        - 650 files were excluded because they didn't match the filter expression "datetime"
    ```

    - the above example assumes that we've not only run the "source" command but that we've followed it with one or more text globs which will be used to identify a subset of files rather than the whole code base.
      - currently to apply a filter you must use the syntax `--filter datetime` but instead I'd like any text parameter passed in (excluding switches) to contribute to the filtering
      - multiple filter items should be allowed 
      - as an example:

        ```txt
        typed source datetime !IsAfter -v
        ```

        - the `-v` tag is still recognized even though it follows multiple filter items
        - the filter items `datetime` and `!IsAfter` will be brought in and used by fast-glob which can accept multiple glob patterns
          - any glob pattern starting with a `!` is a negation all others are _additive_ to the file scope
          - this behavior should be inline with the normal behavior of the `fast-glob` module.

      - Earlier we 

3. Verbose Flag

    when using the `-v`/`--verbose` flag with the "source" command we should change the following:

    - do NOT add another "Files with errors:" section as we do currently, instead ...
    - For each error type we report on we will list the files with this particular error underneath
    - The formatting of a filename should be made by a new function we'll add in the `src/utils` directory called `prettyPath()` it will -- using `chalk` -- make the path component of a file be "dim" but the last segment which includes the filename should be just a normal color. 
    - In addition to the filenames being printed with our newly created `prettyPath()` function we should ornament the end of the line for each file with an indicator of the number of instances this file has of that error

    Here's a simplified example (without colors being represented) of the what the output mike look like:

    ```txt
      Source File Analysis
      -------------------------------
      - project found 1629 source files (569 test files excluded) [tsconfig.json]
      - analyzing TypeScript diagnostics...

      DIAGNOSTICS SUMMARY:

      - 2987 errors across 1219 files

      Errors:
        [ cd: 2307, count: ${number} ] - Cannot find module '{0}' or its corresponding type declarations.
            - modules/runtime/src/datetime/getYear.ts ()

        2321: 248 occurrences

    ```
