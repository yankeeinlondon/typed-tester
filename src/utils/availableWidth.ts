/**
 * **availableWidth**`() -> number`
 *
 * Returns the width(in characters) of the terminal this script is running in.
 *
 * - if there is no way to link back to the terminal's width then 80 will be used
 * as a default.
 */
export function availableWidth(): number {
    // Try to get terminal width from stdout
    if (process.stdout.columns !== undefined && process.stdout.columns > 0) {
        return process.stdout.columns;
    }

    // Try to get from environment variables
    if (process.env.COLUMNS) {
        const width = Number.parseInt(process.env.COLUMNS, 10);
        if (!Number.isNaN(width) && width > 0) {
            return width;
        }
    }

    // Default fallback
    return 80;
}
