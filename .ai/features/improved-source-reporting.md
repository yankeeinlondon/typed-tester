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

1. Clickable Codes: using the existing `tsCodeLink()` function in `src/utils/link` to make each of the Typescript error codes clickable so that a user can go to a page where more information is provided about the error.
2. Error Name: the code is useful and users will start to recognize error codes they get a lot but a short name for each code would make the results in the basic summary much more useful:

    Instead of reporting the following:

    ```txt
    2307: 1877 occurrences
    ```

    we should instead prepend the error's name:

    
