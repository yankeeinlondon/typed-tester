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
