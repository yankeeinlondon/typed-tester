import { asTestFile, getProjectRoot, TestFile } from "src/ast";
import { SourceFile } from "ts-morph";
import { getHasher, TEST_CACHE_FILE } from "./cache";
import { existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from "fs";
import { join, relative } from "pathe";
import chalk from "chalk";




let TEST_LOOKUP = new Map<string, TestFile>();


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

export const cacheTestFiles = (files?: SourceFile[]) => {
  const hasher = getHasher();
  clearTestCache();

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
  files: string[]
) => {
  const h = getHasher();
  const initialCacheSize = initializeTestCache();
  let updated: string[] = [];
  let added : string[] = [];

  const _tasks: Promise<any>[] = [];

  for (const file of files) {
    if (TEST_LOOKUP.has(file)) {
      // file exists in cache
      const meta = statSync(join(getProjectRoot(), file));
      const current = TEST_LOOKUP.get(file) as TestFile;
      if (
        meta.atime == current.atime &&
        meta.size == current.size
      ) {
        // appears to be no change
        // no-op
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
            cacheData: { hash, size: meta.size, atime: meta.atime }
          });
          
          TEST_LOOKUP.set(file, newTest);
        }
      }

    } else {
      // wasn't in cache so we'll add it
      added.push(file);
      TEST_LOOKUP.set(file, await asTestFile(file));
    }
  }

  if (added.length > 0 || updated.length > 0) {
    saveTestCache();
  }

  return {
    initialCacheSize,
    currentSize: TEST_LOOKUP.size,
    updated,
    added,
    hasGrown: TEST_LOOKUP.size > initialCacheSize,
    hasBeenUpdated: updated.length > 0
  }
}
