/**
 * Removes all ANSI escape codes from a string, including:
 * - SGR codes (colors, bold, etc): \x1b[...m
 * - OSC 8 hyperlinks: \x1b]8;;...\x1b\\
 */
export function stripAnsi(text: string): string {
    // Remove SGR codes (Select Graphic Rendition)
    let result = text.replace(/\x1b\[[0-9;]*m/g, '');

    // Remove OSC 8 hyperlinks
    result = result.replace(/\x1b\]8;;[^\x1b]*\x1b\\/g, '');

    return result;
}

/**
 * Gets the visible length of a string (excluding ANSI codes)
 */
export function visibleLength(text: string): number {
    return stripAnsi(text).length;
}

/**
 * Pads a string with ANSI codes to a specific visible width
 * The padding is added as actual spaces, so the visible length equals targetWidth
 */
export function padEndVisible(text: string, targetWidth: number): string {
    const visLen = visibleLength(text);
    if (visLen >= targetWidth) {
        return text;
    }

    const paddingNeeded = targetWidth - visLen;
    return text + " ".repeat(paddingNeeded);
}

/**
 * Truncates text to a maximum visible width, preserving ANSI codes
 * If the text needs truncation, adds "..." to the end
 */
export function truncateVisible(text: string, maxWidth: number): string {
    const stripped = stripAnsi(text);

    if (stripped.length <= maxWidth) {
        return text;
    }

    // For now, if we need to truncate, just return the stripped version truncated
    // A more sophisticated version would preserve ANSI codes up to the truncation point
    return stripped.slice(0, maxWidth - 3) + "...";
}
