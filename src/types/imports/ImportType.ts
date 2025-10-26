import type { StringKeys } from "inferred-types";
import type { IMPORT_TYPES } from "~/constants";

/**
 * a category for imports
 */
export type ImportCategory = StringKeys<typeof IMPORT_TYPES>[number];

/**
 * **ImportType**
 *
 * Information describing a categorized import found
 * in the project.
 */
export interface ImportType {
    /** the category of the import */
    category: ImportCategory;
    /** the module specifier (e.g., 'chalk', '~/utils', './foo') */
    from: string;
    /** the file the import was found in */
    file: string;
    /** the line number where the import is located */
    line: number;
    /** the import statement's text */
    content: string;

    /**
     * when exported as a string we will export a
     * _console friendly_ string.
     */
    toString: () => string;
}
