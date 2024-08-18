import { FileDiagnostic, getProjectRoot } from "src/ast";
import { SourceFile } from "ts-morph";
import { getHasher, TEST_CACHE_FILE } from "./cache";
import { existsSync, unlinkSync } from "fs";
import { join } from "pathe";

export type Test = {
  name: string;
  diagnostics: FileDiagnostic[];
  hash: number;
}

/**
 * a `TestBlock` represents a "describe" code block in your
 * your test file. It contains `0:M` tests within this block.
 */
export type TestBlock = {
  name: string;
  diagnostics: FileDiagnostic[];
  tests: Test[];

  /**
   * a hash which captures the full state of this test block:
   * 
   * - `name`
   * - `diagnostics`
   * - `tests`
   */
  hash: number;
}


export type TestMeta = {
  filepath: string;

  blocks: TestBlock[];
  outsideBlocks: {
    diagnostics: FileDiagnostic[];
    /**
     * a hash of all diagnostics which were found
     * outside of a "describe" block.
     */
    hash: number;
  }

  /**
   * a hash which indicates which "describe" blocks 
   * exist but **not** the diagnostics in that block,
   * just whether the same blocks are present along
   * with the same test names.
   */
  blocksHash: number;
  /**
   * a hash representing all the diagnostics found
   * in the file (regardless of location/block).
   */
  diagnosticsHash: number;

}


let TEST_LOOKUP = new Map<string, TestMeta>();


const cache_file = () => join(getProjectRoot(), TEST_CACHE_FILE);


export const hasTestCacheFile = () => {
  return existsSync(cache_file());
}



export const clearTestCache = () => {
  TEST_LOOKUP = new Map<string, TestMeta>();
  if (hasTestCacheFile()) {
    unlinkSync(cache_file());
  }
}

export const cacheTestFiles = (files?: SourceFile[]) => {
  const hasher = getHasher();
  clearTestCache();

}
