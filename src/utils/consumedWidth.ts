
import stringWidth from 'string-width';

/**
 * **consumedWidth**`(text) -> number`
 *
 * Tests a given text string to see how many _visible_ characters there are.
 *
 * - ansi escape codes for color, formatting, and OSC 8 are ignored in the calculation
 * - wide characters (emoji, CJK characters) are counted as 2 columns
 * - combining characters and zero-width characters are handled correctly
 */
export function consumedWidth(text: string): number {
    return stringWidth(text);
}
