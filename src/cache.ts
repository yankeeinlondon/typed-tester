import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { FileDiagnostics } from "./getFileDiagnostics";
import chalk from "chalk";

export const CACHE_FILE = ".ts-test-cache";

let cache: Record<string, FileDiagnostics> = {};

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
