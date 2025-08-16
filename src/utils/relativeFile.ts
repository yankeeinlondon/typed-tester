import { relative } from "pathe";
import { getProjectRoot } from "src/ast";

/**
 * returns a _relative_ filepath from the project's root
 */
export function relativeFile(filepath: string) {
    return relative(getProjectRoot(), filepath);
}
