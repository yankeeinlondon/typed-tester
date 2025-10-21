/**
 * Removes all ANSI escape codes from a string, including:
 * - SGR codes (colors, bold, etc): \x1b[...m
 * - OSC 8 hyperlinks: \x1b]8;;...\x1b\\
 */
export function stripAnsi(text: string): string {
    // Remove SGR codes (Select Graphic Rendition)
    // eslint-disable-next-line no-control-regex
    let result = text.replace(/\x1B\[[0-9;]*m/g, "");

    // Remove OSC 8 hyperlinks
    // eslint-disable-next-line no-control-regex
    result = result.replace(/\x1B\]8;;[^\x1B]*\x1B\\/g, "");

    return result;
}
