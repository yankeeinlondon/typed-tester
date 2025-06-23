import { join } from "pathe";
import { createCache } from "./cache";
import { FileMeta, FQN, SymbolMetaWithDeps } from "~/types";
import { getProjectRoot, TestFile } from "./ast";

const root = getProjectRoot();
export const SYMBOL_CACHE_FILE = join(root, `/.ts-symbol-lookup.json`);
export const FILE_CACHE_FILE = join(root, `/.ts-file-lookup.json`);
export const TEST_CACHE_FILE = join(root, `/.ts-test-lookup.json`);

export const Symbols = createCache(
    new Map<FQN,SymbolMetaWithDeps>(),
    "fqn",
    SYMBOL_CACHE_FILE
);

export const SourceFiles = createCache(
    new Map<string, FileMeta>(),
    "filepath",
    FILE_CACHE_FILE
);

/**
 * A cache of all the Tests found in the repo
 */
export const Tests = createCache(
    new Map<string, TestFile>(),
    "filepath",
    TEST_CACHE_FILE
)

