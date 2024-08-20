import { stripLeading } from "inferred-types";
import { hostname } from "os";
import { resolve } from "pathe";

/**
 * **link**`(text, link)`
 * 
 * Prints a link to the terminal using a relatively new 
 * [standard](https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda) for making pretty links.
 * 
 * You can use the following protocols for your links:
 * - `http` / `https`
 * - `file` (note format is `file://hostname/path/to/file.txt` and hostname 
 * IS required)
 * - `mailto`
 * - `
 */
export const link = (text: string, link: string) => {
  return `\x1b]8;;${link}\x1b\\${text}\x1b]8;;\x1b\\`
}
// '\x1b]8;;http://example.com\x1b\\This is a link\x1b]8;;\x1b\\'
/**
 * **fileLink**`(text, path)`
 * 
 * A version of `link` which eases use cases where the `file://hostname`
 * linking is desired. This will modify the path to ensure it's 
 * fully qualified and generate the hostname for you in a compliant 
 * manner.
 * 
 * This is a higher order function so that the system call required
 * to ask from the hostname is only done once.
 */
export const fileLink = (text: string, path: string) => {
    const rawPath = resolve(stripLeading(path, "file://"));
    
    return link(text, `file://${hostname()}${rawPath}`);
}


export const tsCodeLink = (code: number) => {
  const text = `${code}`;
  // https://typescript.tv/errors/#ts2344
  const url= `https://typescript.tv/errors/#ts${code}`
  return link(text, url);
}
