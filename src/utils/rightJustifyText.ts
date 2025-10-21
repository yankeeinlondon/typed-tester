import { availableWidth } from "./availableWidth";
import { consumedWidth } from "./consumedWidth";
import { wordWrap } from "./wordWrap";

/**
 * **rightJustifyText**`(text, width)`
 *
 * Splits text based on width parameters and ensures each line is
 * right justified.
 *
 * @param text - The text to right-justify
 * @param width - The preferred width (starts looking for word breaks)
 * @param forceWidth - The maximum width (forces wrap if exceeded)
 * @returns Array of right-justified lines
 */
export function rightJustifyText(
    text: string,
    width: number = availableWidth() - 5,
    forceWidth: number = availableWidth()
): string[] {
    // First, wrap the text to fit within the width constraints
    const lines = wordWrap(text, width, forceWidth);

    // Right-justify each line
    return lines.map((line) => {
        const lineWidth = consumedWidth(line);
        const padding = Math.max(0, forceWidth - lineWidth);
        return " ".repeat(padding) + line;
    });
}
