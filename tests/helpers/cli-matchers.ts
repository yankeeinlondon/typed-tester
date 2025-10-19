import { expect } from 'vitest';
import type { ExpectStatic } from 'vitest';

/**
 * **CLI Matchers**
 *
 * Custom Vitest matchers for testing CLI output. These matchers help
 * validate terminal output including ANSI codes, hyperlinks, and
 * structured data without brittle string matching.
 *
 * @example
 * ```typescript
 * import { setupCliMatchers } from './helpers/cli-matchers';
 *
 * setupCliMatchers();
 *
 * it('should show error count', () => {
 *   const output = runCommand();
 *   expect(output).toHaveErrorCount(5);
 *   expect(output).toContainSymbol('UserService');
 * });
 * ```
 */

/**
 * Strip ANSI escape codes from terminal output
 *
 * @param text - Text with potential ANSI codes
 * @returns Clean text without formatting
 */
export function stripAnsiCodes(text: string): string {
  // Remove ANSI escape sequences
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Strip terminal hyperlinks from output
 *
 * @param text - Text with potential hyperlinks
 * @returns Text without hyperlink codes
 */
export function stripHyperlinks(text: string): string {
  // Remove OSC 8 hyperlink sequences: ]8;;url\text]8;;\
  return text.replace(/\]8;;[^\\\n]*\\([^\]]*)\]8;;?\\/g, '$1');
}

/**
 * Clean CLI output by removing all formatting
 *
 * @param text - Raw CLI output
 * @returns Clean text
 */
export function cleanCliOutput(text: string): string {
  let cleaned = stripAnsiCodes(text);
  cleaned = stripHyperlinks(cleaned);
  return cleaned.trim();
}

/**
 * Extract error count from CLI output
 *
 * Looks for patterns like:
 * - "5 errors"
 * - "3 of 10 tests had errors"
 * - "No errors!"
 *
 * @param output - CLI output text
 * @returns Error count or null if not found
 */
export function extractErrorCount(output: string): number | null {
  const cleaned = cleanCliOutput(output);

  // Check for "No errors!" or "0 errors"
  if (/no errors|0 errors/i.test(cleaned)) {
    return 0;
  }

  // Match "N errors" pattern
  const simpleMatch = cleaned.match(/(\d+)\s+errors?/i);
  if (simpleMatch) {
    return parseInt(simpleMatch[1], 10);
  }

  // Match "N of M tests had errors" pattern
  const testsMatch = cleaned.match(/(\d+)\s+of\s+\d+\s+tests?\s+had\s+errors?/i);
  if (testsMatch) {
    return parseInt(testsMatch[1], 10);
  }

  return null;
}

/**
 * Extract warning count from CLI output
 *
 * @param output - CLI output text
 * @returns Warning count or null if not found
 */
export function extractWarningCount(output: string): number | null {
  const cleaned = cleanCliOutput(output);

  if (/no warnings|0 warnings/i.test(cleaned)) {
    return 0;
  }

  const match = cleaned.match(/(\d+)\s+warnings?/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if output contains a specific symbol name
 *
 * @param output - CLI output text
 * @param symbolName - Symbol name to find
 * @returns True if symbol is found
 */
export function containsSymbol(output: string, symbolName: string): boolean {
  const cleaned = cleanCliOutput(output);
  // Match symbol name as word boundary to avoid partial matches
  const regex = new RegExp(`\\b${symbolName}\\b`);
  return regex.test(cleaned);
}

/**
 * Check if output contains a TypeScript diagnostic code
 *
 * @param output - CLI output text
 * @param code - Diagnostic code (e.g., 2307)
 * @returns True if code is found
 */
export function containsDiagnosticCode(output: string, code: number): boolean {
  const cleaned = cleanCliOutput(output);
  // Look for code as standalone number or in pattern like "TS2307" or "cd: 2307"
  const patterns = [
    new RegExp(`\\bTS${code}\\b`),
    new RegExp(`\\b${code}\\b`),
    new RegExp(`cd:\\s*${code}`)
  ];

  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Check if output contains a clickable hyperlink
 *
 * @param output - CLI output text (may contain ANSI escape codes)
 * @param url - URL to find (partial match)
 * @returns True if hyperlink is found
 */
export function containsClickableLink(output: string, url: string): boolean {
  // Look for OSC 8 hyperlink format: ]8;;URL\TEXT]8;;\
  const hyperlinkRegex = /\]8;;([^\\\n]*)\\/g;
  const matches = output.matchAll(hyperlinkRegex);

  for (const match of matches) {
    if (match[1].includes(url)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract file paths from CLI output
 *
 * @param output - CLI output text
 * @returns Array of file paths found
 */
export function extractFilePaths(output: string): string[] {
  const cleaned = cleanCliOutput(output);
  const paths: string[] = [];

  // Match common file patterns
  const patterns = [
    /([^\s]+\.(?:ts|tsx|js|jsx|json))/g,
    /([^\s]+\/[^\s]+\.(?:ts|tsx|js|jsx))/g
  ];

  for (const pattern of patterns) {
    const matches = cleaned.matchAll(pattern);
    for (const match of matches) {
      const path = match[1];
      if (!paths.includes(path)) {
        paths.push(path);
      }
    }
  }

  return paths;
}

/**
 * Validate that output has proper path formatting
 * (directory dimmed, filename bright)
 *
 * @param output - CLI output text with ANSI codes
 * @param filepath - File path to check
 * @returns True if path is formatted correctly
 */
export function hasCorrectPathFormatting(output: string, filepath: string): boolean {
  // Check if the directory part uses dim formatting (\x1b[2m)
  // and filename is not dimmed
  const parts = filepath.split('/');
  if (parts.length < 2) {
    return true; // Single file, no directory to dim
  }

  const filename = parts[parts.length - 1];
  const directory = parts.slice(0, -1).join('/');

  // Look for pattern: dim(directory/)filename
  const pattern = new RegExp(`\\x1b\\[2m[^\\x1b]*${directory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\x1b]*\\x1b\\[0m.*${filename}`);

  return pattern.test(output);
}

// Custom matcher interface for TypeScript
interface CustomMatchers<R = unknown> {
  toHaveErrorCount(expected: number): R;
  toHaveWarningCount(expected: number): R;
  toContainSymbol(symbolName: string): R;
  toContainDiagnosticCode(code: number): R;
  toHaveClickableLink(url: string): R;
  toContainFilePath(filepath: string): R;
  toHaveCorrectPathFormatting(filepath: string): R;
  toMatchCleanOutput(expected: string): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

/**
 * Set up custom CLI matchers for Vitest
 * Call this in your test setup file or at the top of test files
 */
export function setupCliMatchers(): void {
  expect.extend({
    /**
     * Check if output has expected error count
     */
    toHaveErrorCount(received: string, expected: number) {
      const actual = extractErrorCount(received);

      return {
        pass: actual === expected,
        message: () => {
          if (actual === null) {
            return `Expected output to contain error count, but none was found.\nOutput: ${received.substring(0, 200)}...`;
          }
          return `Expected ${expected} errors, but found ${actual}`;
        },
        actual,
        expected
      };
    },

    /**
     * Check if output has expected warning count
     */
    toHaveWarningCount(received: string, expected: number) {
      const actual = extractWarningCount(received);

      return {
        pass: actual === expected,
        message: () => {
          if (actual === null) {
            return `Expected output to contain warning count, but none was found.\nOutput: ${received.substring(0, 200)}...`;
          }
          return `Expected ${expected} warnings, but found ${actual}`;
        },
        actual,
        expected
      };
    },

    /**
     * Check if output contains a specific symbol
     */
    toContainSymbol(received: string, symbolName: string) {
      const pass = containsSymbol(received, symbolName);

      return {
        pass,
        message: () =>
          pass
            ? `Expected output not to contain symbol "${symbolName}"`
            : `Expected output to contain symbol "${symbolName}"`,
        actual: cleanCliOutput(received),
        expected: symbolName
      };
    },

    /**
     * Check if output contains a diagnostic code
     */
    toContainDiagnosticCode(received: string, code: number) {
      const pass = containsDiagnosticCode(received, code);

      return {
        pass,
        message: () =>
          pass
            ? `Expected output not to contain diagnostic code ${code}`
            : `Expected output to contain diagnostic code ${code}`,
        actual: cleanCliOutput(received),
        expected: code
      };
    },

    /**
     * Check if output contains a clickable hyperlink
     */
    toHaveClickableLink(received: string, url: string) {
      const pass = containsClickableLink(received, url);

      return {
        pass,
        message: () =>
          pass
            ? `Expected output not to contain clickable link to "${url}"`
            : `Expected output to contain clickable link to "${url}"`,
        actual: received.substring(0, 500),
        expected: url
      };
    },

    /**
     * Check if output contains a file path
     */
    toContainFilePath(received: string, filepath: string) {
      const paths = extractFilePaths(received);
      const pass = paths.some(p => p.includes(filepath));

      return {
        pass,
        message: () =>
          pass
            ? `Expected output not to contain file path "${filepath}"`
            : `Expected output to contain file path "${filepath}". Found: ${paths.join(', ')}`,
        actual: paths,
        expected: filepath
      };
    },

    /**
     * Check if output has correct path formatting
     */
    toHaveCorrectPathFormatting(received: string, filepath: string) {
      const pass = hasCorrectPathFormatting(received, filepath);

      return {
        pass,
        message: () =>
          pass
            ? `Expected path "${filepath}" not to have correct formatting`
            : `Expected path "${filepath}" to have correct formatting (dimmed directory, bright filename)`,
        actual: received.substring(0, 300),
        expected: filepath
      };
    },

    /**
     * Match against clean output (no ANSI codes)
     */
    toMatchCleanOutput(received: string, expected: string) {
      const cleaned = cleanCliOutput(received);
      const pass = cleaned.includes(expected);

      return {
        pass,
        message: () =>
          pass
            ? `Expected clean output not to contain "${expected}"`
            : `Expected clean output to contain "${expected}"`,
        actual: cleaned,
        expected
      };
    }
  });
}
