import { consumedWidth } from './consumedWidth';

/**
 * **padEndVisible**`(text, targetWidth) -> string`
 *
 * Pads a string with ANSI codes to a specific visible width.
 *
 * - The padding is added as actual spaces
 * - The visible terminal width will equal targetWidth
 * - ANSI codes are ignored when calculating width
 * - Wide characters (emoji, CJK) are counted correctly as 2 columns
 */
export function padEndVisible(text: string, targetWidth: number): string {
    const visLen = consumedWidth(text);
    if (visLen >= targetWidth) {
        return text;
    }

    const paddingNeeded = targetWidth - visLen;
    return text + " ".repeat(paddingNeeded);
}
