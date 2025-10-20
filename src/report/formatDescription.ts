import type { JsDocInfo } from "~/types";
import chalk from "chalk";

/**
 * Formats JSDoc information into a concise, colorful description for table display
 */
export function formatDescription(jsDocs: JsDocInfo[], maxWidth: number): string {
    if (!jsDocs || jsDocs.length === 0) {
        return chalk.dim("(no description)");
    }

    const parts: string[] = [];
    const doc = jsDocs[0]; // Use first JSDoc block

    // Add main comment
    if (doc.comment) {
        const comment = truncateText(doc.comment.trim(), maxWidth - 10);
        parts.push(comment);
    }

    // Add @param tags
    const params = doc.tags.filter(t => t.tagName === 'param');
    if (params.length > 0) {
        const paramText = params.map(p => {
            const commentText = typeof p.comment === 'string'
                ? p.comment
                : Array.isArray(p.comment)
                    ? p.comment.map(c => (c && typeof c === 'object' && 'text' in c ? c.text : '')).join('')
                    : '';
            return `${chalk.italic(extractParamName(commentText))}`;
        }).join(', ');
        parts.push(chalk.dim('(') + paramText + chalk.dim(')'));
    }

    // Join with separator
    const result = parts.join(' ');

    // Ensure we don't exceed max width
    return truncateText(result, maxWidth);
}

export function truncateText(text: string, maxWidth: number): string {
    // Remove color codes for length calculation
    const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');

    if (stripped.length <= maxWidth) {
        return text;
    }

    // Find a good breaking point
    const truncated = text.substring(0, maxWidth - 3);
    return truncated + chalk.dim('...');
}

export function extractParamName(commentText: string): string {
    // Extract parameter name from "@param paramName description" format
    const match = commentText.match(/^(\w+)/);
    return match ? match[1] : '';
}
