import { resolve } from "node:path";

/**
 * Creates a terminal hyperlink using OSC 8 escape sequence
 * Format: \x1b]8;;URL\x1b\\TEXT\x1b]8;;\x1b\\
 */
export function createTerminalLink(text: string, filepath: string, line?: number): string {
    // Convert to absolute path
    const absolutePath = resolve(filepath);

    // Create file:// URL with line number if provided
    const url = line !== undefined
        ? `file://${absolutePath}:${line}`
        : `file://${absolutePath}`;

    // OSC 8 hyperlink format
    const OSC = '\x1b]8;;';
    const SEP = '\x1b\\';

    return `${OSC}${url}${SEP}${text}${OSC}${SEP}`;
}

/**
 * Check if terminal supports hyperlinks
 * Most modern terminals do, but we can add detection if needed
 */
export function supportsHyperlinks(): boolean {
    // For now, assume support; can add terminal detection later
    // Common terminals that support: iTerm2, Terminal.app, VSCode, etc.
    return true;
}
