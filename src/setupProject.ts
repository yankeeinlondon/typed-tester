import { Project } from "ts-morph";

/**
 * Sets up a project in **ts-morph** without adding any files yet
 */
export const setupProject = (configFile: string): Project => {
  const prj = new Project({
    tsConfigFilePath: configFile,
    skipAddingFilesFromTsConfig: true
  });

  return prj;
}
