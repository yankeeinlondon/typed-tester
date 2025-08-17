import { relative } from "pathe";
import { getProjectRoot } from "~/ast";

/**
 * returns a _relative_ filepath from the project's root
 */
export function relativeFile(filepath: string) {
    return relative(getProjectRoot(), filepath);
}
