import { Project } from "ts-morph";

let project: Project;

/**
 * Sets up a project in **ts-morph** without adding any files yet
 */
export const setupProject = (configFile: string): Project => {
  project = new Project({
    tsConfigFilePath: configFile,
    skipAddingFilesFromTsConfig: true
  });

  return project;
}

export const getProject = () => {
  if(!project) {
    throw new Error(`You must call setupProject() prior to using the getProject() method.`)
  }

  return project;
}
