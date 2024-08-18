import { globSync } from "fast-glob";
import { existsSync, readFileSync } from "fs";
import { relative } from "pathe";
import { getProjectRoot } from "src/ast";

const DEFAULT_GLOB = [
  "{src,test,tests}/**/*.{test,spec}.ts",
  "![node_modules]"
]

export const getTestFiles = () => {
  const env = process.env.TEST_FILES || process.env.VITE_TEST_FILES;

  if (env) {
    return globSync([env, "!node_modules"]);
  } else {
    if (existsSync(relative(getProjectRoot(), "/.typed-tester-glob"))) {
      const glob = readFileSync(
        relative(getProjectRoot(), "/.typed-tester-glob"), 
        "utf-8"
      );
      return globSync([glob, "!node_modules"]);
    } 


    return globSync(DEFAULT_GLOB)
  }
}
