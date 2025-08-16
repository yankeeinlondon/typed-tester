import { existsSync } from "node:fs";
import findRoot from "find-root";
import { cwd } from "node:process";
import { join } from "pathe";
import { LanguageService, Project, TypeChecker, Symbol } from "ts-morph";
import { createFullyQualifiedNameForSymbol, getSymbolKind, getSymbolScope, asSymbolMeta } from "./symbols";

// Simple string hash function (copied from symbols.ts to avoid circular import)
const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
};
import { SymbolKind } from "../types/symbol-ast-types";
import { DependencyGraph } from "~/types/dependency";
import { buildDependencyGraph, updateDependencyGraph } from "./dependency-graph";
import { createDependencyCacheManager } from "~/cache/dependency-cache";

/** the TypeChecker for the evaluated project */
let typeChecker: TypeChecker | null = null;
/** the **ts-morph** `Project` */
let project: Project | null = null;

/**
 * the _hash_ of the config file used to define the project
 */
let configHash: number | null = null; 

let projectRoot: string | null = null;
let languageService: LanguageService | null = null;

/** Cached dependency graph for the current project */
let cachedDependencyGraph: DependencyGraph | null = null;
/** Last time files were checked for modifications */
let lastFileCheckTime: number = 0;

export const initializeProjectTypeChecker = (p: Project) => {
  typeChecker = p.getTypeChecker();
}

export const getConfigHash = () => {
  if(configHash !== null) {
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
    // Generate a simple hash based on the config file path and timestamp
    configHash = simpleHash(found + Date.now().toString());

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

/**
 * **getAllSymbolObjectsInProject**
 * 
 * Returns actual Symbol objects instead of metadata objects.
 * Used by dependency graph building.
 */
export function getAllSymbolObjectsInProject(project: Project): Symbol[] {
  const allSymbols: Symbol[] = [];
  const accountedFor: string[] = [];

  project.getSourceFiles().forEach(sourceFile => {
      sourceFile.forEachDescendant(node => {
          const symbol = node.getSymbol();
          if (symbol) {
            const scope = getSymbolScope(symbol);
            const fqn = createFullyQualifiedNameForSymbol(symbol);
            if (
              scope === "module" && 
              !accountedFor.includes(fqn)
            ) {
              accountedFor.push(fqn);
              allSymbols.push(symbol);
            }
          }
      });
  });

  return allSymbols;
}

/**
 * **getDependencyGraph**
 * 
 * Gets the dependency graph for the current project, using cache when possible.
 * Automatically handles cache invalidation and rebuilding when files change.
 */
export function getDependencyGraph(options: {
  forceRebuild?: boolean;
  useCache?: boolean;
} = {}): DependencyGraph {
  const { forceRebuild = false, useCache = true } = options;
  
  if (!project) {
    throw new Error("Project not initialized. Call projectUsing() first.");
  }

  const cacheManager = createDependencyCacheManager(getProjectRoot());
  const projectFiles = getProjectFiles(project);
  
  // Check if we can use cached graph
  if (useCache && !forceRebuild && cachedDependencyGraph) {
    // Check if files have changed since last check
    const now = Date.now();
    if (now - lastFileCheckTime > 5000) { // Check every 5 seconds
      lastFileCheckTime = now;
      
      if (!cacheManager.isValid(projectFiles)) {
        console.log("Dependency cache invalidated due to file changes");
        cachedDependencyGraph = null;
      }
    }
    
    if (cachedDependencyGraph) {
      return cachedDependencyGraph;
    }
  }

  // Try to load from disk cache
  if (useCache && !forceRebuild) {
    const cachedData = cacheManager.load();
    if (cachedData && cacheManager.isValid(projectFiles)) {
      console.log("Loaded dependency graph from cache");
      cachedDependencyGraph = cachedData.graph;
      return cachedDependencyGraph;
    }
  }

  // Build fresh dependency graph
  console.log("Building fresh dependency graph...");
  const dependencyGraph = buildDependencyGraph(project);
  
  // Cache the result
  cachedDependencyGraph = dependencyGraph;
  
  if (useCache) {
    const fileHashes = new Map(
      projectFiles.map(path => [path, getFileModificationHash(path)])
    );
    
    cacheManager.save({
      graph: dependencyGraph,
      fileHashes,
      configHash: getConfigHash(),
      metadata: {
        version: "0.9.5", // TODO: Get from package.json
        createdAt: Date.now(),
        lastAccessed: Date.now()
      }
    });
  }
  
  return dependencyGraph;
}

/**
 * **invalidateDependencyCache**
 * 
 * Clears both in-memory and disk dependency cache.
 */
export function invalidateDependencyCache(): void {
  cachedDependencyGraph = null;
  lastFileCheckTime = 0;
  
  const cacheManager = createDependencyCacheManager(getProjectRoot());
  cacheManager.invalidate();
  
  console.log("Dependency cache invalidated");
}

/**
 * **getProjectFiles**
 * 
 * Gets all TypeScript source files in the project.
 */
function getProjectFiles(project: Project): string[] {
  return project.getSourceFiles()
    .filter(file => !file.isInNodeModules())
    .map(file => file.getFilePath());
}

/**
 * **getFileModificationHash**
 * 
 * Gets a simple hash based on file modification time and size.
 */
function getFileModificationHash(filePath: string): number {
  try {
    const fs = require('fs');
    const stats = fs.statSync(filePath);
    return stats.mtimeMs + stats.size;
  } catch {
    return 0;
  }
}
