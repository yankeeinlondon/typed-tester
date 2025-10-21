import { consumedWidth } from "./consumedWidth";

/**
 * **wordWrap**`(content)`
 *
 * Takes textual content in and splits into lines of content based two
 * length based parameters:
 *
 *     1. `startWrap` represents the time at which we want to start looking
 *      for a word boundary to split the line.
 *     2. `forceWrap` represents the point at which we will FORCE a word wrap
 *
 * This utility returns an array of strings which meet the length specification
 * which was provided.
 *
 * - it is _ansi-aware_ so that formatting codes which don't take any horizontal
 * space in the terminal are properly accounted for
 * - newline characters are treated as explicit line breaks and pre-split
 */
export function wordWrap(
    content: string,
    startWrap: number,
    forceWrap: number
): string[] {
    // Handle empty content
    if (!content || content.trim().length === 0) {
        return [];
    }

    // Pre-split on newlines (explicit line breaks)
    const explicitLines = content.split("\n");

    const result: string[] = [];

    for (const line of explicitLines) {
        // Preserve empty lines
        if (line.trim().length === 0) {
            result.push(line);
            continue;
        }

        // Wrap this line
        const wrappedLines = wrapLine(line, startWrap, forceWrap);
        result.push(...wrappedLines);
    }

    return result;
}

/**
 * Wraps a single line of text according to startWrap and forceWrap constraints.
 * Uses ANSI-aware width calculation.
 */
function wrapLine(line: string, startWrap: number, forceWrap: number): string[] {
    const result: string[] = [];
    let remaining = line;

    while (remaining.length > 0) {
        const visibleWidth = consumedWidth(remaining);

        // If the remaining text fits within startWrap, we're done
        if (visibleWidth <= startWrap) {
            result.push(remaining);
            break;
        }

        // Need to wrap - try to find a word boundary before startWrap
        let wrapPoint = findWrapPoint(remaining, startWrap, forceWrap);

        // If no good wrap point found, force wrap at forceWrap
        if (wrapPoint === -1) {
            wrapPoint = findForceWrapPoint(remaining, forceWrap);
        }

        // Extract the line to add
        const wrappedLine = remaining.substring(0, wrapPoint).trimEnd();
        result.push(wrappedLine);

        // Continue with the rest
        remaining = remaining.substring(wrapPoint).trimStart();
    }

    return result;
}

/**
 * Finds the best word boundary to wrap at, preferring positions near startWrap
 * but ensuring we don't exceed forceWrap.
 */
function findWrapPoint(text: string, startWrap: number, forceWrap: number): number {
    let bestWrapPoint = -1;
    let currentWidth = 0;
    let currentIndex = 0;

    // Track ANSI escape sequences to skip over them
    while (currentIndex < text.length) {
        // Check for ANSI escape sequence
        if (text[currentIndex] === "\x1B") {
            // Skip the entire ANSI sequence
            const ansiEnd = findAnsiEnd(text, currentIndex);
            currentIndex = ansiEnd;
            continue;
        }

        // Regular character - update width
        const char = text[currentIndex];
        const charWidth = getCharWidth(char);
        currentWidth += charWidth;

        // If we've exceeded forceWrap, we must stop
        if (currentWidth > forceWrap) {
            break;
        }

        // Track word boundaries (spaces)
        if (char === " " || char === "\t") {
            if (currentWidth <= startWrap) {
                // Ideal wrap point - within startWrap
                bestWrapPoint = currentIndex + 1;
            }
            else if (currentWidth <= forceWrap) {
                // Acceptable wrap point - between startWrap and forceWrap
                if (bestWrapPoint === -1) {
                    bestWrapPoint = currentIndex + 1;
                }
            }
        }

        currentIndex++;
    }

    return bestWrapPoint;
}

/**
 * Forces a wrap at forceWrap by breaking at the character level.
 */
function findForceWrapPoint(text: string, forceWrap: number): number {
    let currentWidth = 0;
    let currentIndex = 0;

    while (currentIndex < text.length) {
        // Check for ANSI escape sequence
        if (text[currentIndex] === "\x1B") {
            const ansiEnd = findAnsiEnd(text, currentIndex);
            currentIndex = ansiEnd;
            continue;
        }

        // Regular character - check if adding it would exceed forceWrap
        const char = text[currentIndex];
        const charWidth = getCharWidth(char);

        if (currentWidth + charWidth > forceWrap) {
            // This character would exceed forceWrap, wrap before it
            return currentIndex === 0 ? 1 : currentIndex;
        }

        currentWidth += charWidth;
        currentIndex++;
    }

    // If we got here, the entire text fits
    return text.length;
}

/**
 * Finds the end of an ANSI escape sequence starting at the given index.
 */
function findAnsiEnd(text: string, start: number): number {
    if (text[start] !== "\x1B") {
        return start + 1;
    }

    let i = start + 1;

    // Handle OSC sequences (e.g., OSC 8 hyperlinks): \x1b]...\x1b\\
    if (i < text.length && text[i] === "]") {
        i++;
        while (i < text.length) {
            if (text[i] === "\x1B" && i + 1 < text.length && text[i + 1] === "\\") {
                return i + 2;
            }
            i++;
        }
        return text.length;
    }

    // Handle CSI sequences (most common): \x1b[...m or \x1b[...letter
    if (i < text.length && text[i] === "[") {
        i++;
        while (i < text.length) {
            const char = text[i];
            // CSI sequences end with a letter (A-Z, a-z)
            if ((char >= "A" && char <= "Z") || (char >= "a" && char <= "z")) {
                return i + 1;
            }
            i++;
        }
        return text.length;
    }

    // Other escape sequences - advance to next character
    return i + 1;
}

/**
 * Gets the display width of a single character.
 * Note: This is a simplified version. For full accuracy, we'd use a library
 * like 'string-width', but for basic cases this works.
 */
function getCharWidth(char: string): number {
    const code = char.charCodeAt(0);

    // Zero-width characters
    if (code === 0x200B || code === 0x200C || code === 0x200D) {
        return 0;
    }

    // Combining characters (simplified check)
    if (code >= 0x0300 && code <= 0x036F) {
        return 0;
    }

    // Wide characters (emoji, CJK) - simplified check
    // Full-width: 0x1100-0x115F, 0x2E80-0x9FFF, 0xAC00-0xD7A3, 0xF900-0xFAFF, 0xFE10-0xFE19, 0xFE30-0xFE6F, 0xFF00-0xFF60, 0xFFE0-0xFFE6
    if (
        (code >= 0x1100 && code <= 0x115F)
        || (code >= 0x2E80 && code <= 0x9FFF)
        || (code >= 0xAC00 && code <= 0xD7A3)
        || (code >= 0xF900 && code <= 0xFAFF)
        || (code >= 0xFE10 && code <= 0xFE19)
        || (code >= 0xFE30 && code <= 0xFE6F)
        || (code >= 0xFF00 && code <= 0xFF60)
        || (code >= 0xFFE0 && code <= 0xFFE6)
    ) {
        return 2;
    }

    // Emoji (simplified - checking common ranges)
    // Most emoji are in the supplementary planes, which require surrogate pairs
    if (code >= 0xD800 && code <= 0xDFFF) {
        return 2; // Surrogate pair, likely emoji
    }

    // Default to width 1 for most characters
    return 1;
}
