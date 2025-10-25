import type { Project } from "ts-morph";
import type { CombinedImport } from "./CombinedImport";
import type { MissingTypeModifier } from "./MissingTypeModifier";
import type { ImportType } from "./ImportType";

/**
 * **AnalysisOptions**
 *
 * Options for analyzing imports across files.
 */
export type AnalysisOptions = {
    /**
     * The ts-morph Project instance to use for analysis.
     * If not provided, a new project will be created.
     */
    project?: Project;

    /**
     * Whether to treat file paths as glob patterns.
     *
     * When `true`, the file paths will be matched using glob patterns
     * and all matching files will be analyzed.
     *
     * When `false` (default), file paths are treated as exact paths.
     */
    useGlob?: boolean;
};

/**
 * **FileImportSummary**
 *
 * Summary of imports for a single file.
 */
export type FileImportSummary = {
    /**
     * The file path
     */
    path: string;

    /**
     * All imports found in this file
     */
    imports: ImportType[];
};

/**
 * **AnalysisResult**
 *
 * The complete result of analyzing imports across one or more files.
 *
 * This structure aggregates all import data and provides multiple views:
 * - File-by-file breakdown
 * - Combined imports (runtime + type mixed)
 * - Missing type modifiers
 * - Categorized imports by structure and location
 */
export type AnalysisResult = {
    /**
     * File-by-file breakdown of imports
     */
    files: FileImportSummary[];

    /**
     * All combined imports (runtime + type symbols mixed) found across all files
     */
    combinedImports: CombinedImport[];

    /**
     * All imports with missing type modifiers found across all files
     */
    missingTypeModifiers: MissingTypeModifier[];

    /**
     * All imports categorized by structure and location
     *
     * Categories include:
     * - `external` - imports from node_modules
     * - `relativePeerBarrel`, `relativePeerNamed`, etc. - internal imports
     *
     * See `ImportCategory` for complete list.
     */
    categorized: Record<string, ImportType[]>;
};
