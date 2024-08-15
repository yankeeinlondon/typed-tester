import { existsSync } from "node:fs";
import findRoot from "find-root";
import { cwd } from "node:process";
import { join } from "pathe";
import { Project, TypeChecker } from "ts-morph";


let typeChecker: TypeChecker | null = null;
let project: Project | null = null;

export const initializeProjectTypeChecker = (p: Project) => {
  typeChecker = p.getTypeChecker();
}

export const getProjectTypeChecker = () => {
  if (typeChecker) {
    return typeChecker;
  } else {
    throw new Error(`call to getProjectTypeChecker() called prior to type checker being initialized!`)
  }
}

export const getProject = () => {
  if (project) {
    return project
  } else {
    throw new Error("project was not initialized; use projectUsing() to start your project!")
  }
}

/**
 * Returns a **ts-morph** project from an array of possible **tsconfig** files, 
 * using the first match in the file system.
 * 
 * @returns [ prj: Project, location: string ]
 * 
 * Note: the search for files will start from the nearest repo's root filesystem
 * or the current working directory if that is not found.
 */
export const projectUsing = (candidates: string[]) => {
  const root = findRoot(cwd()) || cwd();
  const found = candidates.find(c => existsSync(join(root, c)));

  if (!found) {
    throw new Error(`No tsconfig file found in: ${candidates.join(', ')}`);
  } else {
    project = new Project({tsConfigFilePath: found});
    initializeProjectTypeChecker(project);

    return [ project, found] as [Project, string];
  }
}
