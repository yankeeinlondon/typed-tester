import type { SymbolMeta } from "~/types";

/**
 * **functionDescription**`(symbol)`
 *
 * Formats a description for function symbols, extracting the main JSDoc
 * comment and parameter information when available.
 */
export function functionDescription(symbol: SymbolMeta): string {
    // Extract JSDoc comment
    const doc = symbol.jsDocs?.[0];
    if (!doc) {
        return `Function ${symbol.name}`;
    }

    // Get main comment
    const comment = doc.comment?.trim();
    if (!comment) {
        return `Function ${symbol.name}`;
    }

    // Extract param tags for signature hint
    const params = doc.tags.filter(t => t.tagName === "param");
    if (params.length > 0) {
        const paramNames = params.map((p) => {
            const commentText = typeof p.comment === "string"
                ? p.comment
                : Array.isArray(p.comment)
                    ? p.comment.map(c => (c && typeof c === "object" && "text" in c ? c.text : "")).join("")
                    : "";
            // Extract just the parameter name (first word)
            const match = commentText.match(/^(\w+)/);
            return match ? match[1] : "";
        }).filter(Boolean);

        if (paramNames.length > 0) {
            return `${comment} (${paramNames.join(", ")})`;
        }
    }

    return comment;
}
