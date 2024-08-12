import {  SourceFile } from "ts-morph";
import { getProject } from "./setupProject";
import { addDependency } from "./cache/cache";

let baseUrl: string;
let paths: { [key: string]: string[] };

function resolvePathAlias(path: string): string {
  if (!baseUrl) {
    baseUrl = getProject().getCompilerOptions().baseUrl || ''; // Adjust as needed
    paths = getProject().getCompilerOptions().paths || {};
  }
  // Iterate through all path aliases
  for (const [pattern, resolutions] of Object.entries(paths)) {
      const regex = new RegExp(`^${pattern.replace('*', '(.*)')}$`);
      const match = path.match(regex);
      if (match && resolutions.length > 0) {
          // Replace pattern with actual path using the first resolution
          const resolvedPath = resolutions[0].replace('*', match[1]);
          return `${baseUrl}/${resolvedPath}`;
      }
  }
  // Return the original path if no aliases match
  return path;
}

/**
 * Given a file which has been analyzed by ts-morph, this function will build a list
 * of dependencies this file has on other files which are internal to the repo.
 */
export function getFileDependencies(file: string, source: SourceFile): string[] {
  const localImports: string[] = [];
  
  source.getImportDeclarations().forEach(importDeclaration => {
      let moduleSpecifier = importDeclaration.getModuleSpecifierValue();
      // Handle path aliases
      moduleSpecifier = resolvePathAlias(moduleSpecifier);
      if (!moduleSpecifier.startsWith('.') && !moduleSpecifier.startsWith('/')) {
          // Skip external modules
          return;
      }
      const resolvedNode = importDeclaration.getModuleSpecifierSourceFile();
      if (resolvedNode) {
          localImports.push(resolvedNode.getFilePath());
      } else {
          // Attempt to resolve based on alias and baseUrl if normal resolution fails
          const potentialPath = getProject().getSourceFiles().find(f =>
              f.getFilePath().endsWith(moduleSpecifier + '.ts') ||
              f.getFilePath().endsWith(moduleSpecifier + '.tsx'),
          );
          if (potentialPath) {
              localImports.push(potentialPath.getFilePath());
          }
      }
  });
  localImports.forEach(dep => addDependency(file, dep));

  return localImports;
}

