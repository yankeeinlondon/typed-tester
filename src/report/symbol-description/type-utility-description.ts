import type { SymbolMeta } from "~/types";

/**
 * **typeUtilityDescription**`(symbol)`
 *
 * Formats a description for type utility symbols (generic type transformers).
 * These are typically type aliases with generics that transform input types.
 */
export function typeUtilityDescription(symbol: SymbolMeta): string {
    // Extract JSDoc comment
    const doc = symbol.jsDocs?.[0];
    if (!doc) {
        if (symbol.generics.length > 0) {
            const genericNames = symbol.generics.map(g => g.name).join(", ");
            return `Type utility ${symbol.name}<${genericNames}>`;
        }
        return `Type utility ${symbol.name}`;
    }

    // Get main comment
    const comment = doc.comment?.trim();
    if (!comment) {
        if (symbol.generics.length > 0) {
            const genericNames = symbol.generics.map(g => g.name).join(", ");
            return `Type utility ${symbol.name}<${genericNames}>`;
        }
        return `Type utility ${symbol.name}`;
    }

    return comment;
}
