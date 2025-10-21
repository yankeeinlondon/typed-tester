import type { SymbolMeta } from "~/types";

/**
 * **constDescription**`(symbol)`
 *
 * Formats a description for constant/variable symbols, extracting the
 * main JSDoc comment when available.
 */
export function constDescription(symbol: SymbolMeta): string {
    // Extract JSDoc comment
    const doc = symbol.jsDocs?.[0];
    if (!doc) {
        return `Constant ${symbol.name}`;
    }

    // Get main comment
    const comment = doc.comment?.trim();
    if (!comment) {
        return `Constant ${symbol.name}`;
    }

    return comment;
}
