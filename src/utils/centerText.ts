import stringWidth from "string-width";
import { availableWidth } from "./availableWidth";
import { wordWrap } from "./wordWrap";

/**
 * **centerText**`(text, width, forceWidth)`
 *
 * Centers text within the specified width, with ANSI-aware string handling.
 * First wraps the text if needed, then centers each line.
 *
 * @param text - The text to center
 * @param width - The preferred width (starts looking for word breaks)
 * @param forceWidth - The maximum width (forces wrap if exceeded)
 * @returns Array of centered lines
 */
export function centerText(
    text: string,
    width: number = availableWidth() - 5,
    forceWidth: number = availableWidth()
): string[] {
    // First, wrap the text to fit within the width constraints
    const lines = wordWrap(text, width, forceWidth);

    // Center each line
    return lines.map((line) => {
        const lineWidth = stringWidth(line);
        const padding = Math.max(0, Math.floor((forceWidth - lineWidth) / 2));
        return " ".repeat(padding) + line;
    });
}
