import type { SymbolMeta } from "~/types";

/**
 * **classDescription**`(symbol)`
 *
 * Formats a description for class symbols, extracting the main JSDoc
 * comment when available.
 */
export function classDescription(symbol: SymbolMeta): string {
    // Extract JSDoc comment
    const doc = symbol.jsDocs?.[0];
    if (!doc) {
        return `Class ${symbol.name}`;
    }

    // Get main comment
    const comment = doc.comment?.trim();
    if (!comment) {
        return `Class ${symbol.name}`;
    }

    return comment;
}
