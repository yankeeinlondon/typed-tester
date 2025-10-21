
import { stripAnsi } from './stripAnsi';

/**
 * **consumedWidth**`(text) -> number`
 *
 * Calculates the maximum terminal width consumed by text, handling:
 *
 * - ANSI escape codes for color, formatting, and OSC 8 are ignored
 * - Wide characters (emoji, CJK characters) are counted as 2 columns
 * - Combining characters and zero-width characters are handled correctly
 * - Newlines reset the column count (returns max width across all lines)
 * - Tabs advance to the next tab stop (multiples of 8)
 */
export function consumedWidth(text: string): number {
    // First strip ANSI codes
    const stripped = stripAnsi(text);

    let currentWidth = 0;
    let maxWidth = 0;
    const TAB_STOP = 8;

    // Iterate through each character
    for (let i = 0; i < stripped.length; i++) {
        const code = stripped.codePointAt(i);
        if (code === undefined) continue;

        // Skip the second code unit of surrogate pairs
        if (code > 0xFFFF) {
            i++; // Surrogate pair uses 2 code units
        }

        // Newline resets current width
        if (code === 0x0A) { // \n
            maxWidth = Math.max(maxWidth, currentWidth);
            currentWidth = 0;
            continue;
        }

        // Tab advances to next tab stop
        if (code === 0x09) { // \t
            const nextTabStop = Math.ceil((currentWidth + 1) / TAB_STOP) * TAB_STOP;
            currentWidth = nextTabStop;
            continue;
        }

        // Other control characters (0 columns)
        if (
            code < 0x20 ||     // C0 control characters (excluding \n and \t handled above)
            code === 0x7F ||   // DEL
            code === 0x200B || // Zero-width space
            code === 0x200C || // Zero-width non-joiner
            code === 0x200D || // Zero-width joiner
            code === 0xFEFF    // Zero-width no-break space
        ) {
            continue;
        }

        // Combining marks (0 columns)
        if (
            (code >= 0x0300 && code <= 0x036F) || // Combining Diacritical Marks
            (code >= 0x1AB0 && code <= 0x1AFF) || // Combining Diacritical Marks Extended
            (code >= 0x1DC0 && code <= 0x1DFF) || // Combining Diacritical Marks Supplement
            (code >= 0x20D0 && code <= 0x20FF) || // Combining Diacritical Marks for Symbols
            (code >= 0xFE20 && code <= 0xFE2F)    // Combining Half Marks
        ) {
            continue;
        }

        // Wide characters (2 columns)
        // Emoji ranges
        if (
            (code >= 0x1F300 && code <= 0x1F9FF) || // Misc Symbols and Pictographs, Emoticons, etc.
            (code >= 0x1FA00 && code <= 0x1FA6F) || // Extended Pictographic
            (code >= 0x2600 && code <= 0x26FF) ||   // Misc symbols
            (code >= 0x2700 && code <= 0x27BF) ||   // Dingbats
            (code >= 0x1F000 && code <= 0x1F02F) || // Mahjong Tiles
            (code >= 0x1F0A0 && code <= 0x1F0FF) || // Playing Cards
            // CJK ranges
            (code >= 0x3000 && code <= 0x303F) ||   // CJK Symbols and Punctuation
            (code >= 0x3040 && code <= 0x309F) ||   // Hiragana
            (code >= 0x30A0 && code <= 0x30FF) ||   // Katakana
            (code >= 0x3100 && code <= 0x312F) ||   // Bopomofo
            (code >= 0x3130 && code <= 0x318F) ||   // Hangul Compatibility Jamo
            (code >= 0x3190 && code <= 0x319F) ||   // Kanbun
            (code >= 0x31A0 && code <= 0x31BF) ||   // Bopomofo Extended
            (code >= 0x31C0 && code <= 0x31EF) ||   // CJK Strokes
            (code >= 0x3200 && code <= 0x32FF) ||   // Enclosed CJK Letters and Months
            (code >= 0x3300 && code <= 0x33FF) ||   // CJK Compatibility
            (code >= 0x3400 && code <= 0x4DBF) ||   // CJK Unified Ideographs Extension A
            (code >= 0x4E00 && code <= 0x9FFF) ||   // CJK Unified Ideographs
            (code >= 0xA960 && code <= 0xA97F) ||   // Hangul Jamo Extended-A
            (code >= 0xAC00 && code <= 0xD7AF) ||   // Hangul Syllables
            (code >= 0xD7B0 && code <= 0xD7FF) ||   // Hangul Jamo Extended-B
            (code >= 0xF900 && code <= 0xFAFF) ||   // CJK Compatibility Ideographs
            (code >= 0xFE10 && code <= 0xFE19) ||   // Vertical forms
            (code >= 0xFE30 && code <= 0xFE4F) ||   // CJK Compatibility Forms
            (code >= 0xFF00 && code <= 0xFF60) ||   // Fullwidth Forms
            (code >= 0xFFE0 && code <= 0xFFE6) ||   // Fullwidth Forms
            (code >= 0x20000 && code <= 0x2FFFD) || // CJK Unified Ideographs Extension B-F
            (code >= 0x30000 && code <= 0x3FFFD)    // CJK Unified Ideographs Extension G
        ) {
            currentWidth += 2;
            continue;
        }

        // Regular characters (1 column)
        currentWidth += 1;
    }

    // Return the maximum width seen across all lines
    return Math.max(maxWidth, currentWidth);
}
