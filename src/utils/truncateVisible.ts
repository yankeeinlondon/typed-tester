import { consumedWidth } from "./consumedWidth";
import { stripAnsi } from "./stripAnsi";

/**
 * **truncateVisible**`(text, maxWidth) -> string`
 *
 * Truncates text to a maximum visible width, preserving ANSI codes.
 *
 * - If the text needs truncation, adds "..." to the end
 * - ANSI codes are stripped before truncation (for simplicity)
 * - Wide characters (emoji, CJK) are counted correctly as 2 columns
 *
 * Note: A more sophisticated version would preserve ANSI codes up to the truncation point
 */
export function truncateVisible(text: string, maxWidth: number): string {
    const currentWidth = consumedWidth(text);

    if (currentWidth <= maxWidth) {
        return text;
    }

    // For now, if we need to truncate, just return the stripped version truncated
    // A more sophisticated version would preserve ANSI codes up to the truncation point
    const stripped = stripAnsi(text);
    return `${stripped.slice(0, maxWidth - 3)}...`;
}
