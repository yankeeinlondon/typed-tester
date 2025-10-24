import { stdin, stdout } from "node:process";

export type TerminalTheme = 'light' | 'dark' | 'unknown';

interface RgbColor {
    r: number;
    g: number;
    b: number;
}

/**
 * Calculate the luma (perceived brightness) of an RGB color
 * Returns a value between 0 (black) and 1 (white)
 * Formula: luma = (0.299 * R + 0.587 * G + 0.114 * B) / 255
 */
function calculateLuma(rgb: RgbColor): number {
    return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

/**
 * Parse the terminal's OSC 11 response to extract RGB values
 * Response format: "]11;rgb:RRRR/GGGG/BBBB"
 * We extract the first 2 hex digits from each 4-digit component
 */
function parseOscResponse(response: string): RgbColor | null {
    // Strip the OSC prefix
    const prefix = "]11;rgb:";
    if (!response.includes(prefix)) {
        return null;
    }

    const colorPart = response.substring(response.indexOf(prefix) + prefix.length);

    // Parse RGB values from positions [0..2], [5..7], [10..12]
    // Example: "3838/a4a4/c9c9" -> r=0x38, g=0xa4, b=0xc9
    const r = parseInt(colorPart.substring(0, 2), 16);
    const g = parseInt(colorPart.substring(5, 7), 16);
    const b = parseInt(colorPart.substring(10, 12), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return null;
    }

    return { r, g, b };
}

/**
 * Query the terminal's background color using OSC 11 escape sequence
 * Returns RGB color or null if the terminal doesn't respond or parsing fails
 */
async function queryTerminalBackgroundColor(timeoutMs = 100): Promise<RgbColor | null> {
    // Only query if we have a TTY
    if (!stdin.isTTY || !stdout.isTTY) {
        return null;
    }

    return new Promise((resolve) => {
        let responseBuffer = '';
        let wasRawMode = stdin.isRaw;
        let wasPaused = stdin.isPaused();
        let timeout: NodeJS.Timeout;

        const cleanup = () => {
            stdin.setRawMode(wasRawMode);
            stdin.removeListener('data', onData);
            // Always pause stdin after query to prevent keeping the process alive
            // We resumed it for the query, so we need to pause it when done
            stdin.pause();
            clearTimeout(timeout);
        };

        const onData = (chunk: Buffer) => {
            responseBuffer += chunk.toString();

            // Check if we have a complete response (ends with BEL or ST)
            if (responseBuffer.includes('\x07') || responseBuffer.includes('\x1b\\')) {
                cleanup();
                const rgb = parseOscResponse(responseBuffer);
                resolve(rgb);
            }
        };

        // Set timeout to avoid hanging
        timeout = setTimeout(() => {
            cleanup();
            resolve(null);
        }, timeoutMs);

        try {
            // Enable raw mode to read the response
            stdin.setRawMode(true);
            // Resume stdin to receive data
            stdin.resume();
            // Use .on() not .once() to handle chunked responses
            stdin.on('data', onData);

            // Send OSC 11 query: ESC ] 11 ; ? BEL
            stdout.write('\x1b]11;?\x07');
        } catch (error) {
            cleanup();
            resolve(null);
        }
    });
}

/**
 * Detect whether the terminal has a light or dark background
 * Returns 'light', 'dark', or 'unknown' if detection fails
 *
 * This function queries the terminal once and caches the result
 */
let cachedTheme: TerminalTheme | null = null;

export async function detectTerminalTheme(): Promise<TerminalTheme> {
    // Return cached result if available
    if (cachedTheme !== null) {
        return cachedTheme;
    }

    // Query the terminal background color
    const rgb = await queryTerminalBackgroundColor();

    if (rgb === null) {
        // Default to 'dark' if detection fails (most developer terminals are dark)
        cachedTheme = 'dark';
        return cachedTheme;
    }

    // Calculate luma to determine if background is light or dark
    const luma = calculateLuma(rgb);

    // Threshold: luma > 0.6 is considered light, <= 0.6 is dark
    cachedTheme = luma > 0.6 ? 'light' : 'dark';

    return cachedTheme;
}

/**
 * Synchronous version that returns the cached theme or 'dark' as default
 * Use this after calling detectTerminalTheme() at least once
 */
export function getTerminalTheme(): TerminalTheme {
    return cachedTheme ?? 'dark';
}
