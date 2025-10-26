import type { AnalysisResult } from "../../types/imports/AnalysisResult";

/**
 * **formatImportsAsJson**
 *
 * Formats analysis results as JSON for programmatic use.
 *
 * Output is pretty-printed with 2-space indentation.
 * No ANSI color codes or OSC8 hyperlinks are included.
 */
export function formatImportsAsJson(result: AnalysisResult): string {
    // Create a clean object without functions
    const cleanResult = {
        files: result.files.map(file => ({
            path: file.path,
            imports: file.imports.map((imp) => {
                const { toString, ...rest } = imp as any;
                return rest;
            }),
        })),
        combinedImports: result.combinedImports.map((imp) => {
            const { toString, ...rest } = imp;
            return rest;
        }),
        missingTypeModifiers: result.missingTypeModifiers.map((imp) => {
            const { toString, ...rest } = imp;
            return rest;
        }),
        categorized: result.categorized,
    };

    return JSON.stringify(cleanResult, null, 2);
}
