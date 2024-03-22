import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { FileDiagnostics, getFileDiagnostics } from "./getFileDiagnostics";
import chalk from "chalk";
import xxhash from "xxhash-wasm";
import { ValidationOptions } from "./typeValidation";
export type Hasher = Awaited<ReturnType<typeof xxhash>>["h32"];

export const CACHE_FILE = ".ts-test-cache";

export type Dependency = {
  /** files which are _dependant_ on the given **dependency** */
  dependents: Set<string>;
  /** the hash representing the content of a given dependency */
  hash: number;
}

let hasher: Hasher | null = null;

let cache: Record<string, FileDiagnostics> = {};

/**
 * A dictionary lookup where:
 * 
 * - the _keys_ represent files which are "depended on" by at least one of the files
 * being monitored.
 * - the _values_ represent a dictionary with all of the dependent files along with a _hash_
 * representing the content of dependency
 */
let dependencyGraph: Record<string, Dependency> = {};

export const initializeHasher = async() => {
  const {h32} = await xxhash();
  hasher = h32;
}

/**
 * **getDependency**(file)
 * 
 * Get's a `Dependency` for a particular file (or throws error if doesn't exist).
 */
export const getDependency = (file: string) => {
  if (!hasDependency(file)) {
    throw new Error(`The file "${file}" is not being tracked as a dependency!`);
  }

  return dependencyGraph[file];
}

/**
 * **getDependencies**()
 * 
 * Get's the full dictionary cache of dependencies being tracked.
 */
export const getDependencies = () => {
  return dependencyGraph;
}

/**
 * hashes the content passed in using the **xxhash** hashing algorithm
 */
export const h = (content: string): number => {
  if (!hasher) {
    throw new Error(`Call to cache.hash() prior to initialization of the hasher!`);
  }

  return hasher(content);
}

/**
 * validates that the given _file_ and _hash value_ have not changed.
 */
export const validateCache = (file: string, hashValue: number) => {
  return h(readFileSync(file, "utf-8")) === hashValue;
}

/**
 * adds a given file to the dependency list for an imported symbol
 */
export const addDependency = (file: string, dependsOn: string) => {
  if (!dependencyGraph[dependsOn]) {
    dependencyGraph[dependsOn]={
      hash: h(readFileSync(dependsOn, "utf-8")),
      dependents: new Set<string>()
    }
  }
  
  dependencyGraph[dependsOn].dependents.add(file);

  return dependencyGraph;
}

/**
 * **removeDependency**(file, dependsOn)
 * 
 * Removes a dependency between a core _file_ and another file (which is seen as
 * a dependency).
 */
export const removeDependency = (file: string, dependsOn: string) => {
  if (dependencyGraph[dependsOn]) {
    dependencyGraph[dependsOn].dependents.delete(file);
  }
}

/**
 * **hasDependency**(file)
 * 
 * Checks whether a file is considered a dependency by any core files
 */
export const hasDependency = (file: string) => {
  return file in dependencyGraph ? true : false;
}

/**
 * Updates the cache with information from a particular file dependency.
 * 
 * Note: _does not_ update cache to disk
 */
export const updateCache = (
  diagnostics: FileDiagnostics, 
  opts: ValidationOptions
) => {
  const file = diagnostics.file;
  const oldDeps = diagnostics?.deps || [];

  delete cache[file];

  cache = {
    ...cache,
    [file]: getFileDiagnostics(file, {...opts, force: true})
  }

  const removed = oldDeps.filter(i => !cache[file].deps.includes(i));
  const added = cache[file].deps.filter(i => !oldDeps.includes(i));

  for (const item of removed) {
    removeDependency(file, item);
  }
  for (const item of added) {
    addDependency(file, item);
  }

  return cache;
}

/**
 * remove a file from the cache
 */
export const removeFromCache = (file: string) => {
  delete cache[file];

  return cache;
}

/**
 * **getCache**([force])
 * 
 * Get the full cache dictionary.
 */
export const getCache = (force?: boolean) => {
  if(Object.keys(cache).length === 0 || force) {
    if(existsSync(CACHE_FILE)) {
      const data = readFileSync(CACHE_FILE, "utf-8");
      try {
        cache = JSON.parse(data) as Record<string, FileDiagnostics>;
      } catch(e) {
        console.log(`${chalk.red.bold("Invalid Cache File!")} Cache file is being removed!`);
        cache = {};
        unlinkSync(CACHE_FILE);
      }
    }
  }

  return cache;
}

/**
 * **saveCache**(data)
 * 
 * Saves the cache to disk. If `data` is passed in then this will be used, otherwise
 * the current state managed by the **cache** module will be used.
 */
export const saveCache = (data: FileDiagnostics[]): Record<string, FileDiagnostics> => {
  cache = data.reduce(
    (acc, item) => {
      return {
        ...acc,
        [item.file]: item
      }
    }, {} as Record<string, FileDiagnostics>
  );

  writeFileSync(CACHE_FILE, JSON.stringify(cache), "utf-8")
  return cache;
}

export const clearCache = () => {
  cache = {};
  saveCache([]);
}
