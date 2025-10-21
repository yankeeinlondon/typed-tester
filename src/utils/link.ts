import { 
    EnsureLeading, 
    ensureLeading, 
    isString, 
    isUndefined, 
    narrow, 
    Never, 
    NumberLike, 
    stripLeading 
} from "inferred-types";
import { resolve, join } from "pathe";
import { existsSync } from "node:fs";
import { cwd } from "node:process";
import { InvalidFilePath } from "~/errors";

export const CONSOLE_LINK_PREAMBLE = narrow(`\x1B]8;;`);
export const CONSOLE_LINK_DELIMITER = narrow(`\x1B\\`);
export const CONSOLE_LINK_CLOSURE = narrow(`\x1B]8;;\x1B\\`)

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
function link<
    T extends string,
    L extends string
>(text: T, link: L): `${typeof CONSOLE_LINK_PREAMBLE}${L}${typeof CONSOLE_LINK_DELIMITER}${T}${typeof CONSOLE_LINK_CLOSURE}` {
    return `${CONSOLE_LINK_PREAMBLE}${link}${CONSOLE_LINK_DELIMITER}${text}${CONSOLE_LINK_CLOSURE}`;
}

type FileLinkRtn<
    T,
    P
> = undefined extends P
? T
: `\x1B]8;;file://${string}\x1B\\${T}\x1B]8;;\x1B\\`;

/**
 * **fileLink**`(text, path)`
 *
 * Provides a console-friendly way (_OSC 8 escape codes_) to display text and 
 * have that text be linked to a valid file in the filesystem.
 * 
 * **Note:** 
 * 
 * - if _undefined_ is passed for the path then the text will be returned
 * "as is" (also meaning it will NOT be clickable)
 * - if the filepath is provide but NOT valid then a `InvalidFilePath` error 
 * will be thrown.
 */
export function fileLink<
    T extends string,
    P extends string | undefined = undefined
>(
    text: T,
    path?: P
): FileLinkRtn<T,P> {
    if (isUndefined(path)) {
        return text as FileLinkRtn<T,P>;
    }

    // Strip file:// protocol if present
    const cleanPath = stripLeading(path, "file://");

    // Try path as-is first (handles truly absolute paths)
    let fullPath = resolve(cleanPath);

    // If doesn't exist and starts with "/", try stripping it (project-relative path)
    if (!existsSync(fullPath) && cleanPath.startsWith("/")) {
        fullPath = resolve(stripLeading(cleanPath, "/"));
    }

    if (existsSync(fullPath)) {
        return link(text, `file://${fullPath}`) as FileLinkRtn<T,P>
    } else {
        throw InvalidFilePath(`The path '${fullPath}' is not a valid path on the file system!`);
    }
}

type UrlLinkReturn<
    T extends string,
    U extends string | undefined
> = U extends string
    ? `${typeof CONSOLE_LINK_PREAMBLE}${EnsureLeading<U, "https://">}${typeof CONSOLE_LINK_DELIMITER}${T}${typeof CONSOLE_LINK_CLOSURE}`
    : `${typeof CONSOLE_LINK_PREAMBLE}${EnsureLeading<T, "https://">}${typeof CONSOLE_LINK_DELIMITER}${T}${typeof CONSOLE_LINK_CLOSURE}`;

/**
 * **urlLink**`(text, path)`
 *
 * Provides a console-friendly way (_OSC 8 escape codes_) to display text
 * and have that text be linked to a URL.
 *
 * - if no URL is stated then the text will be assumed to be a URL
 *
 * **Related:** `
 */
export function urlLink<T extends string, U extends string | undefined = undefined>(
    text: T,
    url?: U
): UrlLinkReturn<T, U> {
    const finalizedUrl = (
        isString(url)
        ? ensureLeading(url, "https://") as any
        : ensureLeading(text, "https://") as any
    ) as U extends string
        ? EnsureLeading<U, "https://">
        : EnsureLeading<T, "https://">;

    return link(text, finalizedUrl) as UrlLinkReturn<T, U>;
}

/**
 * **tsCodeLink**`(code: number)`
 * 
 * Given a valid Typescript error code, this function will return the code
 * escape code's to make this a valid URL link to [`typescript.tv`](https://typescript.tv/)'s
 * useful descriptions of errors. These escape code should work for a majority
 * of modern console/terminal apps.
 */
export function tsCodeLink<T extends NumberLike>(code: T) {
    const text = `${code}`;
    // https://typescript.tv/errors/#ts2344
    const url = `https://typescript.tv/errors/#ts${code}` ;
    return link(text, url) as `\x1B]8;;https://typescript.tv/errors/#ts${T}\\${T}\x1B]8;;\x1B\\`;
}
