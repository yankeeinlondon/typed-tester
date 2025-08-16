import { relative } from "pathe";

/** make file reference relative from current working directory */
export function rel(file: string) {
    return file.startsWith("file:")
        ? relative(process.cwd(), file.replace(/file:/, ""))
        : relative(process.cwd(), file);
}
