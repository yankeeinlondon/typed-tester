import { existsSync, readFileSync } from "node:fs";
import fg from "fast-glob";
import { relative } from "pathe";
import { getProjectRoot } from "~/ast";

const DEFAULT_GLOB = [
    "{src,test,tests}/**/*.{test,spec}.ts",
    "![node_modules]"
];

/**
 * get's an array of files in the repo
 */
export function getTestFiles() {
    const env = process.env.TEST_FILES || process.env.VITE_TEST_FILES;

    if (env) {
        return fg.globSync([env, "!node_modules"]);
    }
    else {
        if (existsSync(relative(getProjectRoot(), "/.typed-tester-glob"))) {
            const glob = readFileSync(
                relative(getProjectRoot(), "/.typed-tester-glob"),
                "utf-8"
            );
            return fg.globSync([glob, "!node_modules"]);
        }

        return fg.globSync(DEFAULT_GLOB);
    }
}

/**
 * Simple glob pattern matcher for basic * and ? wildcards
 */
function simpleGlobMatch(str: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape regex special chars
        .replace(/\*/g, ".*") // * matches any characters
        .replace(/\?/g, "."); // ? matches single character

    const regex = new RegExp(`^${regexPattern}$`, "i");
    return regex.test(str);
}

/**
 * Filter test files by patterns, supporting negation with '!' prefix.
 * Supports basic glob patterns with * and ? wildcards.
 *
 * @param files - Array of file paths to filter
 * @param patterns - Array of filter patterns (supports '!' prefix for negation)
 * @returns Filtered array of file paths
 */
export function filterTestFilesByPattern(files: string[], patterns: string[]): string[] {
    if (!patterns || patterns.length === 0) {
        return files;
    }

    // Separate positive and negative patterns
    const positivePatterns: string[] = [];
    const negativePatterns: string[] = [];

    for (const pattern of patterns) {
        if (pattern.startsWith("!")) {
            negativePatterns.push(pattern.slice(1)); // Remove '!' prefix
        }
        else {
            positivePatterns.push(pattern);
        }
    }

    let filteredFiles = files;

    // Apply positive patterns first (if any) - match files containing the pattern
    if (positivePatterns.length > 0) {
        filteredFiles = files.filter(file =>
            positivePatterns.some((pattern) => {
                // Check if pattern contains glob characters
                if (pattern.includes("*") || pattern.includes("?")) {
                    // For glob patterns, try to match the pattern anywhere in the path
                    return simpleGlobMatch(file, `*${pattern}*`)
                        || simpleGlobMatch(file, pattern);
                }
                else {
                    // For simple strings, use includes for substring matching
                    return file.includes(pattern);
                }
            })
        );
    }

    // Apply negative patterns (exclude files matching any negative pattern)
    if (negativePatterns.length > 0) {
        filteredFiles = filteredFiles.filter(file =>
            !negativePatterns.some((pattern) => {
                // Same logic as positive patterns but for exclusion
                if (pattern.includes("*") || pattern.includes("?")) {
                    return simpleGlobMatch(file, `*${pattern}*`)
                        || simpleGlobMatch(file, pattern);
                }
                else {
                    return file.includes(pattern);
                }
            })
        );
    }

    return filteredFiles;
}
