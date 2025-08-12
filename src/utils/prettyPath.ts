import chalk from "chalk";
import { dirname, basename } from "pathe";

/**
 * **prettyPath**`(path)`
 * 
 * Formats a file path for display by dimming the directory portion
 * while keeping the filename normal.
 * 
 * @param path - The file path to format
 * @returns A formatted string with dimmed directory and normal filename
 * 
 * @example
 * ```ts
 * prettyPath("/path/to/file.ts")
 * // Returns: chalk.dim("/path/to/") + "file.ts"
 * ```
 */
export function prettyPath(path: string): string {
  const dir = dirname(path);
  const file = basename(path);
  
  // Handle root path special case
  if (path === "/") {
    return chalk.dim("/");
  }
  
  // If there's no directory (just a filename), return the filename as-is
  if (dir === "." || dir === "") {
    return file;
  }
  
  // Return dimmed directory + normal filename
  return chalk.dim(dir + "/") + file;
}