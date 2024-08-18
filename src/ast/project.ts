import { existsSync } from "node:fs";
import findRoot from "find-root";
import { cwd } from "node:process";
import { join } from "pathe";
import { LanguageService, Project, TypeChecker } from "ts-morph";
import { createFullyQualifiedNameForSymbol, getSymbolKind, getSymbolScope } from "./symbols";
import { SymbolKind } from "./symbol-ast-types";
import { getHasher } from "src/cache";

/** the TypeChecker for the evaluated project */
let typeChecker: TypeChecker | null = null;
/** the **ts-morph** `Project` */
let project: Project | null = null;

/**
 * the `tsconfig.json` file used to define project
 */
let configFile: string | null = null;

/**
 * the _hash_ of the config file used to define the project
 */
let configHash: number | null = null; 

let projectRoot: string | null = null;
let languageService: LanguageService | null = null;

export const initializeProjectTypeChecker = (p: Project) => {
  typeChecker = p.getTypeChecker();
}

export const getConfigHash = () => {
  if(configHash) {
    return configHash
  } else {
    throw new Error(`you must use projectUsing to initialize the configHash which calls to getConfigHash() use!`)
  }
}

export const getProjectTypeChecker = () => {
  if (typeChecker) {
    return typeChecker;
  } else {
    throw new Error(`call to getProjectTypeChecker() called prior to type checker being initialized!`)
  }
}

export const getLanguageService = () => {
  if (languageService) {
    return languageService
  } else {
    throw new Error(`language service was not setup!`)
  }
}

export const getProjectRoot = () => {
  if (projectRoot) {
    return projectRoot;
  } else {
    projectRoot = findRoot(process.cwd()) || process.cwd();
    return projectRoot;
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
 * @returns [ prj: Project, location: string, root: string ]
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
    configFile = found;
    configHash = getHasher()(found);

    initializeProjectTypeChecker(project);
    languageService = project.getLanguageService();

    return [ project, found, getProjectRoot()] as [
      Project, string, string
    ];
  }
}


export function getAllSymbolsInProject(
  project: Project
): { name: string, fqn: string, kind: SymbolKind }[] {
  const allSymbols: { name: string, fqn: string, kind: SymbolKind }[] = [];
  const accountedFor: string[] = [];

  project.getSourceFiles().forEach(sourceFile => {
      sourceFile.forEachDescendant(node => {
          const symbol = node.getSymbol();
          if (symbol) {
            const kind = getSymbolKind(symbol);
            const scope = getSymbolScope(symbol);
            const fqn = createFullyQualifiedNameForSymbol(symbol);
            if (
              scope === "module" && 
              !accountedFor.includes(fqn)
            ) {
              accountedFor.push(fqn);
              allSymbols.push({
                  name: symbol.getName(),
                  fqn,
                  kind
              });

            }
          }
      });
  });

  return allSymbols;
}
