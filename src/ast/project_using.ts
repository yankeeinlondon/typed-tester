import { existsSync } from "node:fs";
import findRoot from "find-root";
import { cwd } from "node:process";
import { join } from "pathe";
import { Project } from "ts-morph";

/**
 * Returns a **ts-morph** project from an array of possible **tsconfig** files, 
 * using the first match in the file system.
 * 
 * @returns [ prj: Project, location: string ]
 * 
 * Note: the search for files will start from the nearest repo's root filesystem
 * or the current working directory if that is not found.
 */
export const project_using = (candidates: string[]) => {
  const root = findRoot(cwd()) || cwd();
  const found = candidates.find(c => existsSync(join(root, c)));

  if (!found) {
    throw new Error(`No tsconfig file found in: ${candidates.join(', ')}`);
  } else {
    return [ new Project({tsConfigFilePath: found}), found] as [Project, string];
  }
}
