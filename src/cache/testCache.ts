import { asTestFile, FileDiagnostic, getErrorDiagnostics, getFileDiagnostics, getProjectRoot, getWarningDiagnostics, hasDiagnostics, isSlowTest, isVerySlowTest, TestFile, TestSummary } from "src/ast";
import { getHasher, TEST_CACHE_FILE } from "./cache";
import { existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from "fs";
import { join, relative } from "pathe";
import chalk from "chalk";
import { AsOption } from "src/cli";




let TEST_LOOKUP = new Map<string, TestFile>();
let SUMMARY_LOOKUP = new Map<number, TestSummary>();

const cache_file = () => join(getProjectRoot(), TEST_CACHE_FILE);


export const hasTestCacheFile = () => {
  return existsSync(cache_file());
}



export const clearTestCache = (file?: boolean) => {
  TEST_LOOKUP = new Map<string, TestFile>();
  if (hasTestCacheFile() && file) {
    unlinkSync(cache_file());
  }
}



export const updateTestCache = (
  ...files: TestFile[]
) => {
  for (const file of files) {
    TEST_LOOKUP.set(file.filepath, file)
  }
}

export const loadTestCache = (): number => {
  if (hasTestCacheFile()) {
    try {
      const data = JSON.parse(readFileSync(cache_file(), "utf-8")) as TestFile[];
      clearTestCache();
      updateTestCache(...data);

      return TEST_LOOKUP.size
    } catch (e) {
      const file = chalk.blue(relative(getProjectRoot(), cache_file()));
      throw new Error(`Problems loading the TestCache file located at ${file} into the cache as a an array of TestFile objects!`)
    }
  } else {
    clearTestCache();
    return 0;
  }
}

/**
 * initializes the in-memory cache (from the
 * file cache where possible) and returns the
 * number of files currently in cache.
 */
export const initializeTestCache = () => {
  return loadTestCache();
}

export const saveTestCache = () => {
  const data = Array.from(TEST_LOOKUP.values());
  // 
  writeFileSync(cache_file(), JSON.stringify(data), "utf-8")
}


const getTestCacheSummary = (
  filesWithDiagnostics: string[], 
  opt: AsOption<null>
) => {
  const diagnosticsByFile: FileDiagnostic[][] = filesWithDiagnostics
    .map(f => getFileDiagnostics(f));
  const errAndWarnByFile = diagnosticsByFile.map(d => {
    return {
      errors: getErrorDiagnostics(d, opt),
      warnings: getWarningDiagnostics(d, opt)
    }
  })
  let filesWithErrors = 0;
  let testsWithErrors = 0;
  let filesWithWarnings = 0;

  for (const d of errAndWarnByFile) {
    if (d.errors.length> 0) {
      filesWithErrors = filesWithErrors + 1;
    }
    if (d.warnings.length> 0) {
      filesWithWarnings = filesWithWarnings + 1;
    }
    
    testsWithErrors = filesWithErrors + d.errors.length;
  }

  return {
    filesWithErrors,
    testsWithErrors,
    filesWithWarnings,
  }
}

/**
 * refreshes the cache for certain set of files:
 * 
 * - if file doesn't yet exist in cache then it is added
 * - if file _does_ exist in the cache:
 *     - the file size and last accessed dates are compared and if the
 * same then the cache file is used
 *     - if there is a variation in file specs, then a hash of the 
 * file -- trimmed of whitespace -- will be performed
 * and the hash will be compared to the cache hash value to determine
 * if a substantive change occurred
 */
export const refreshTestCache = async (
  files: string[],
  opt: AsOption<"test">
) => {
  const h = getHasher();
  const initialCacheSize = initializeTestCache();
  let updated: string[] = [];
  let added : string[] = [];
  let cacheHits = 0;
  let earlyCacheHits = 0;
  let cacheMisses = 0;
  let withDiagnostics: string[] = [];
  let slow: string[] = [];
  let tests = 0;
  let skipped = 0;

  for (const file of files) {
    if (TEST_LOOKUP.has(file)) {
      // file exists in cache
      const meta = statSync(join(getProjectRoot(), file));
      const current = TEST_LOOKUP.get(file) as TestFile;
      if (
        new Date(meta.ctime).getSeconds() == new Date(current.ctime).getSeconds() &&
        meta.size == current.size
      ) {
        // appears to be no change based on file characteristics
        cacheHits = cacheHits + 1;
        earlyCacheHits = earlyCacheHits + 1;
        if(isVerySlowTest(current) || isSlowTest(current)) {
          slow.push(file);
        }
        if(hasDiagnostics(current)) {
          withDiagnostics.push(file)
        };
        tests = tests + current.blocks.flatMap(b => b.tests.length).reduce(
          (sum, val) => sum + val,
          0
        )
        skipped = skipped + current.skippedTests;
      } else {
        // file props indicate possible change
        const data = readFileSync(
          join(getProjectRoot(), file), "utf-8"
        ).trim();
        const hash = h(data);
        if (hash !== current.hash) {
          // update cache
          updated.push(file);
          const newTest = await asTestFile(file, {
            cacheData: { hash, size: meta.size, ctime: meta.ctime }
          });
          cacheMisses = cacheMisses + 1;
          if (isVerySlowTest(newTest) || isSlowTest(newTest)) {
            slow.push(file);
          }
          TEST_LOOKUP.set(file, newTest);
          tests = tests + newTest.blocks.flatMap(b => b.tests.length).reduce(
            (sum, val) => sum + val,
            0
          );
          skipped = skipped + current.skippedTests;
        } else {
          // found in cache after checking hash
          if (isVerySlowTest(current) || isSlowTest(current)) {
            slow.push(file);
          }
          cacheHits = cacheHits + 1;
          tests = tests + current.blocks.flatMap(
            b => b.skip ? 0 : b.tests.filter(t => !t.skip).length
          ).reduce(
            (sum, val) => sum + val,
            0
          );
          skipped = skipped + current.skippedTests;
        }
      }

    } else {
      // wasn't in cache so we'll add it
      added.push(file);
      TEST_LOOKUP.set(file, await asTestFile(file));
      cacheMisses = cacheMisses + 1;
    }
  }

  if (added.length > 0 || updated.length > 0) {
    saveTestCache();
  }

  let results = {
    initialCacheSize,
    currentSize: TEST_LOOKUP.size,
    updated,
    added,
    cacheHits,
    earlyCacheHits,
    cacheMisses,
    withDiagnostics,
    hasGrown: TEST_LOOKUP.size > initialCacheSize,
    hasBeenUpdated: updated.length > 0,
    tests,
    testFiles: files.length,
    slow,
    skipped,
    ...getTestCacheSummary(withDiagnostics, opt)
  }

  const key  = getHasher()(
    files.sort((a,b) => a.localeCompare(b)).join("-")
  );

  SUMMARY_LOOKUP.set(key, {
    withDiagnostics,
    slow,
    tests,
    testFiles: files.length,
    filesWithErrors: results.filesWithErrors,
    filesWithWarnings: results.filesWithWarnings,
    testsWithErrors: results.testsWithErrors
  } as TestSummary);

  return results;
}

export const getTestSummary = (files: string[]) => {
  const key  = getHasher()(
    files.sort((a,b) => a.localeCompare(b)).join("-")
  );

  return SUMMARY_LOOKUP.get(key)
}


