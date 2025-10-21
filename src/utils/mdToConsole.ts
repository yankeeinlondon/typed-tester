import chalk from "chalk";

/**
 * Helper function to format H1 headings
 */
function h1Tag(text: string): string {
    return chalk.bold.underline.cyan(text);
}

/**
 * Helper function to format H2 headings
 */
function h2Tag(text: string): string {
    return chalk.bold.cyan(text);
}

/**
 * Helper function to format H3 headings
 */
function h3Tag(text: string): string {
    return chalk.cyan(text);
}

/**
 * Helper function to format italic text
 */
function italics(text: string): string {
    return chalk.italic(text);
}

/**
 * Helper function to format bold text
 */
function bold(text: string): string {
    return chalk.bold(text);
}

/**
 * Helper function to format code blocks
 */
function codeBlock(text: string, lang: string): string {
    // Format code with a different color and indent
    const lines = text.split("\n");
    const formatted = lines.map(line => `  ${chalk.gray(line)}`).join("\n");
    return lang ? `${chalk.dim(`[${lang}]`)}\n${formatted}` : formatted;
}

/**
 * Helper function to format inline code
 */
function inlineCode(text: string): string {
    return chalk.cyan(text);
}

/**
 * **mdToConsole**`(md)`
 *
 * Takes in text which may have Markdown content in it and converts it to
 * text with appropriate console ANSI codes applied.
 */
export function mdToConsole(md: string): string {
    let result = md;

    // Code blocks (must be done before inline code)
    // Match: ```lang\ncode\n```
    result = result.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
        return codeBlock(code.trim(), lang || "");
    });

    // Inline code
    // Match: `code`
    result = result.replace(/`([^`]+)`/g, (_match, code) => {
        return inlineCode(code);
    });

    // Bold (must be done before italics to handle ***)
    // Match: **text** or __text__
    result = result.replace(/\*\*(.+?)\*\*/g, (_match, text) => {
        return bold(text);
    });
    result = result.replace(/__(.+?)__/g, (_match, text) => {
        return bold(text);
    });

    // Italics
    // Match: *text* or _text_
    result = result.replace(/\*(.+?)\*/g, (_match, text) => {
        return italics(text);
    });
    result = result.replace(/_(.+?)_/g, (_match, text) => {
        return italics(text);
    });

    // Headings (H1, H2, H3)
    // Match: ### Heading
    result = result.replace(/^###\s+(.+)$/gm, (_match, text) => {
        return h3Tag(text);
    });
    result = result.replace(/^##\s+(.+)$/gm, (_match, text) => {
        return h2Tag(text);
    });
    result = result.replace(/^#\s+(.+)$/gm, (_match, text) => {
        return h1Tag(text);
    });

    return result;
}
