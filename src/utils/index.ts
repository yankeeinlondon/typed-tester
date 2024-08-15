export * from "./msg";
import { relative } from "pathe";



/** make file reference relative from current working directory */
export const rel = (file: string) => file.startsWith("file:")
  ? relative(process.cwd(), file.replace(/file:/, ""))
  : relative(process.cwd(), file);
