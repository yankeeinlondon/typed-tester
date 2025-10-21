import type { SymbolMeta } from "~/types";

/**
 * **typeDescription**`(symbol)`
 *
 * Formats a description for type definitions (interfaces, type aliases).
 * Extracts the main JSDoc comment and shows generic constraints if present.
 */
export function typeDescription(symbol: SymbolMeta): string {
    // Extract JSDoc comment
    const doc = symbol.jsDocs?.[0];
    if (!doc) {
        // Fallback based on flags
        if (symbol.flags.includes("Interface")) {
            return `Interface ${symbol.name}`;
        }
        return `Type ${symbol.name}`;
    }

    // Get main comment
    const comment = doc.comment?.trim();
    if (!comment) {
        if (symbol.flags.includes("Interface")) {
            return `Interface ${symbol.name}`;
        }
        return `Type ${symbol.name}`;
    }

    return comment;
}
