
import wrapAnsi from "wrap-ansi";
import stringWidth from "string-width";

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

    // Use wrap-ansi for the main wrapping logic
    // wrap-ansi handles ANSI codes properly and wraps at word boundaries
    const wrapped = wrapAnsi(content, forceWrap, {
        hard: true, // Enable hard wrapping at forceWrap
        wordWrap: true, // Enable word wrapping
        trim: false, // Don't trim whitespace
    });

    // Split into lines
    const lines = wrapped.split("\n");

    // Check if any line exceeds startWrap and needs to be wrapped more aggressively
    const result: string[] = [];
    for (const line of lines) {
        const width = stringWidth(line);
        if (width > startWrap && width <= forceWrap) {
            // Line is between startWrap and forceWrap
            // Try to wrap at word boundary around startWrap
            const rewrapped = wrapAnsi(line, startWrap, {
                hard: false, // Soft wrap to prefer word boundaries
                wordWrap: true,
                trim: false,
            });
            result.push(...rewrapped.split("\n"));
        }
        else {
            result.push(line);
        }
    }

    return result;
}
