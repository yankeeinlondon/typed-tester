import type { DependencyNode, FQN } from "~/types";
import { cwd } from "node:process";
// Temporary stub for @yankeeinlondon/ask until package is properly installed
import { relative } from "pathe";

const createChoices = (choices: Record<string, any>) => choices;
const ask = {
    select: async (question: string, choices: any) => {
        console.log(`[STUB] ${question}`);
        const values = Object.values(choices);
        return values[0]; // Return first choice for now
    },
    checkbox: async (question: string, choices: any[]) => {
        console.log(`[STUB] ${question}`);
        return choices.slice(0, 1).map(c => c.value); // Return first choice
    },
    confirm: async (message: string) => {
        console.log(`[STUB] ${message}`);
        return true; // Default to yes
    },
    input: async (message: string, defaultValue?: string) => {
        console.log(`[STUB] ${message}`);
        return defaultValue || "";
    }
};

/**
 * **selectSymbolFromMatches**
 *
 * Interactively selects a symbol when multiple symbols match a pattern.
 * Returns the selected symbol's FQN or null if user cancels.
 */
export async function selectSymbolFromMatches(
    matches: DependencyNode[],
    pattern: string
): Promise<FQN | null> {
    if (matches.length === 0) {
        console.log(`No symbols found matching pattern: ${pattern}`);
        return null;
    }

    if (matches.length === 1) {
        return matches[0].symbol;
    }

    console.log(`\nFound ${matches.length} symbols matching "${pattern}":`);

    // Create user-friendly display names for symbols
    const choices = createChoices(
        matches.reduce((acc, node) => {
            const displayName = createSymbolDisplayName(node);
            return {
                ...acc,
                [displayName]: node.symbol
            };
        }, {} as Record<string, FQN>)
    );

    try {
        const answer = await ask.select(
            "Which symbol do you want to analyze?",
            choices
        );

        return answer as FQN;
    }
    catch {
    // User cancelled or error occurred
        console.log("Selection cancelled.");
        return null;
    }
}

/**
 * **selectMultipleSymbolsFromMatches**
 *
 * Interactively selects multiple symbols when multiple symbols match patterns.
 * Returns an array of selected symbol FQNs.
 */
export async function selectMultipleSymbolsFromMatches(
    matches: DependencyNode[],
    maxSelections: number = 10
): Promise<FQN[]> {
    if (matches.length === 0) {
        return [];
    }

    if (matches.length <= maxSelections) {
        return matches.map(m => m.symbol);
    }

    console.log(`\nFound ${matches.length} symbols (showing first ${maxSelections}):`);

    // Show top matches and ask if user wants to proceed or refine search
    const topMatches = matches.slice(0, maxSelections);
    const choices = createChoices({
        "Proceed with all shown symbols": "all",
        "Select specific symbols": "select",
        "Cancel and refine search pattern": "cancel"
    });

    const action = await ask.select(
        `Do you want to proceed with all ${topMatches.length} symbols or select specific ones?`,
        choices
    );

    switch (action) {
        case "all":
            return topMatches.map(m => m.symbol);

        case "select":
            return await selectSpecificSymbols(topMatches);

        case "cancel":
        default:
            return [];
    }
}

/**
 * **selectSpecificSymbols**
 *
 * Allows user to select specific symbols from a list using checkboxes.
 */
async function selectSpecificSymbols(symbols: DependencyNode[]): Promise<FQN[]> {
    const choices = symbols.map(node => ({
        name: createSymbolDisplayName(node),
        value: node.symbol,
        checked: false
    }));

    try {
        const selected = await ask.checkbox(
            "Select symbols to analyze:",
            choices
        );

        return selected;
    }
    catch {
        console.log("Selection cancelled.");
        return [];
    }
}

/**
 * **createSymbolDisplayName**
 *
 * Creates a user-friendly display name for a symbol.
 * Format: "SymbolName [kind] in file.ts:line"
 */
export function createSymbolDisplayName(node: DependencyNode): string {
    const { meta } = node;
    const prettyPath = relative(cwd(), meta.filepath);

    let displayName = `${meta.name} [${meta.kind}]`;

    if (meta.filepath && meta.startLine !== undefined) {
        displayName += ` in ${prettyPath}:${meta.startLine}`;
    }
    else if (meta.filepath) {
        displayName += ` in ${prettyPath}`;
    }

    // Add dependency count for context
    const depCount = node.dependencies.length;
    const depText = depCount === 1 ? "1 dependency" : `${depCount} dependencies`;
    displayName += ` (${depText})`;

    return displayName;
}

/**
 * **filterSymbolsByGlobPatterns**
 *
 * Filters symbols using glob patterns on symbol names and file paths.
 * Supports multiple patterns and returns symbols that match any pattern.
 */
export function filterSymbolsByGlobPatterns(
    symbols: DependencyNode[],
    patterns: string[]
): DependencyNode[] {
    if (!patterns || patterns.length === 0) {
        return symbols;
    }

    const regexes = patterns.map(pattern => globToRegex(pattern));

    return symbols.filter((symbol) => {
        const { meta } = symbol;

        // Test against symbol name
        if (regexes.some(regex => regex.test(meta.name))) {
            return true;
        }

        // Test against file path
        const relativePath = relative(cwd(), meta.filepath);
        if (regexes.some(regex => regex.test(relativePath))) {
            return true;
        }

        // Test against FQN
        if (regexes.some(regex => regex.test(meta.fqn))) {
            return true;
        }

        return false;
    });
}

/**
 * **confirmAction**
 *
 * Asks user to confirm an action with a yes/no prompt.
 */
export async function confirmAction(message: string): Promise<boolean> {
    try {
        const confirmed = await ask.confirm(message);
        return confirmed;
    }
    catch {
        return false;
    }
}

/**
 * **askForRefinedPattern**
 *
 * Asks user to enter a refined search pattern.
 */
export async function askForRefinedPattern(
    currentPattern: string,
    matchCount: number
): Promise<string | null> {
    console.log(`Current pattern "${currentPattern}" matched ${matchCount} symbols.`);

    try {
        const newPattern = await ask.input(
            "Enter a more specific pattern (or press Enter to cancel):",
            currentPattern
        );

        return newPattern.trim() || null;
    }
    catch {
        return null;
    }
}

/**
 * **prettyPath**
 *
 * Creates a pretty, relative path for display.
 */
export function prettyPath2(filePath: string): string {
    return relative(cwd(), filePath);
}

/**
 * Convert a glob pattern to a regular expression.
 */
function globToRegex(pattern: string): RegExp {
    // Escape special regex characters except * and ?
    const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".");

    return new RegExp(`^${escaped}$`, "i");
}

/**
 * **handleSymbolSelection**
 *
 * Main function to handle symbol selection workflow.
 * Handles filtering, selection, and fallback scenarios.
 */
export async function handleSymbolSelection(
    allSymbols: DependencyNode[],
    patterns: string[],
    isGraphMode: boolean = false
): Promise<DependencyNode[]> {
    // Apply pattern filtering
    const filteredSymbols = patterns.length > 0
        ? filterSymbolsByGlobPatterns(allSymbols, patterns)
        : allSymbols;

    if (filteredSymbols.length === 0) {
        console.log("No symbols found matching the specified patterns.");
        return [];
    }

    // For graph mode, we need exactly one symbol
    if (isGraphMode) {
        if (filteredSymbols.length === 1) {
            return filteredSymbols;
        }

        const selectedFQN = await selectSymbolFromMatches(
            filteredSymbols,
            patterns.join(", ")
        );

        if (!selectedFQN) {
            return [];
        }

        const selectedSymbol = filteredSymbols.find(s => s.symbol === selectedFQN);
        return selectedSymbol ? [selectedSymbol] : [];
    }

    // For list mode, handle multiple symbols
    const maxSymbolsForListMode = 50;

    if (filteredSymbols.length <= maxSymbolsForListMode) {
        return filteredSymbols;
    }

    // Too many symbols, ask user what to do
    const confirmed = await confirmAction(
        `Found ${filteredSymbols.length} symbols. Show first ${maxSymbolsForListMode}? (or 'n' to refine search)`
    );

    if (!confirmed) {
        const newPattern = await askForRefinedPattern(
            patterns.join(", "),
            filteredSymbols.length
        );

        if (newPattern) {
            return handleSymbolSelection(allSymbols, [newPattern], isGraphMode);
        }

        return [];
    }

    return filteredSymbols.slice(0, maxSymbolsForListMode);
}
