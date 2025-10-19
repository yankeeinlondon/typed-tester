import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { stripAnsiCodes, stripHyperlinks } from './cli-matchers';

/**
 * **SnapshotMatcher**
 *
 * Snapshot testing utility for CLI output. Captures complex terminal output
 * and compares against saved snapshots, with options for normalization
 * and update modes.
 *
 * @example
 * ```typescript
 * const matcher = new SnapshotMatcher('tests/__snapshots__');
 *
 * matcher.matchOutput(cliOutput, 'test-command-verbose');
 *
 * // Update snapshots
 * matcher.updateSnapshots = true;
 * matcher.matchOutput(cliOutput, 'test-command-verbose');
 * ```
 */
export class SnapshotMatcher {
  private snapshotDir: string;
  private updateSnapshots: boolean = false;
  private snapshots = new Map<string, string>();

  constructor(snapshotDir: string = join(process.cwd(), 'tests', '__snapshots__')) {
    this.snapshotDir = snapshotDir;

    // Check for UPDATE_SNAPSHOTS environment variable
    if (process.env.UPDATE_SNAPSHOTS === 'true' || process.env.UPDATE_SNAPSHOTS === '1') {
      this.updateSnapshots = true;
    }
  }

  /**
   * Match output against a saved snapshot
   *
   * @param actual - Actual output to compare
   * @param snapshotName - Name of the snapshot
   * @param options - Matching options
   * @throws Error if snapshots don't match (unless in update mode)
   */
  matchOutput(
    actual: string,
    snapshotName: string,
    options: {
      /** Normalize output before comparison */
      normalize?: boolean;
      /** Strip ANSI codes */
      stripAnsi?: boolean;
      /** Strip hyperlinks */
      stripLinks?: boolean;
      /** Custom normalizer function */
      normalizer?: (text: string) => string;
    } = {}
  ): void {
    const snapshotPath = this.getSnapshotPath(snapshotName);

    let normalized = actual;

    // Apply normalization options
    if (options.normalize !== false) {
      normalized = this.normalizeOutput(normalized);
    }

    if (options.stripAnsi !== false) {
      normalized = stripAnsiCodes(normalized);
    }

    if (options.stripLinks !== false) {
      normalized = stripHyperlinks(normalized);
    }

    if (options.normalizer) {
      normalized = options.normalizer(normalized);
    }

    // Update or compare
    if (this.updateSnapshots) {
      this.saveSnapshot(snapshotPath, normalized);
      this.snapshots.set(snapshotName, normalized);
      console.log(`✓ Updated snapshot: ${snapshotName}`);
    } else {
      const expected = this.loadSnapshot(snapshotPath);

      if (expected === null) {
        // No snapshot exists, create it
        this.saveSnapshot(snapshotPath, normalized);
        this.snapshots.set(snapshotName, normalized);
        console.log(`✓ Created snapshot: ${snapshotName}`);
      } else if (expected !== normalized) {
        this.throwSnapshotMismatch(snapshotName, expected, normalized);
      }
    }
  }

  /**
   * Match output against inline snapshot (stored in memory)
   *
   * @param actual - Actual output
   * @param snapshotName - Name of snapshot
   * @param expected - Expected snapshot (optional)
   */
  matchInline(actual: string, snapshotName: string, expected?: string): void {
    const normalized = this.normalizeOutput(stripAnsiCodes(actual));

    if (!expected) {
      this.snapshots.set(snapshotName, normalized);
      console.log(`✓ Created inline snapshot: ${snapshotName}`);
    } else if (expected !== normalized) {
      this.throwSnapshotMismatch(snapshotName, expected, normalized);
    }
  }

  /**
   * Normalize output for consistent snapshots
   *
   * - Normalizes line endings
   * - Trims trailing whitespace
   * - Removes timestamps and dynamic values
   *
   * @param output - Raw output
   * @returns Normalized output
   */
  normalizeOutput(output: string): string {
    let normalized = output;

    // Normalize line endings
    normalized = normalized.replace(/\r\n/g, '\n');

    // Remove trailing whitespace from each line
    normalized = normalized
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n');

    // Remove common dynamic values
    normalized = this.removeDynamicValues(normalized);

    return normalized.trim();
  }

  /**
   * Remove dynamic values from output
   *
   * @param text - Text to process
   * @returns Text with dynamic values replaced
   */
  private removeDynamicValues(text: string): string {
    let processed = text;

    // Replace timestamps
    processed = processed.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, '<TIMESTAMP>');
    processed = processed.replace(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g, '<TIMESTAMP>');

    // Replace durations in milliseconds
    processed = processed.replace(/\d+ms/g, '<DURATION>ms');
    processed = processed.replace(/\d+\.\d+ms/g, '<DURATION>ms');

    // Replace file sizes
    processed = processed.replace(/\d+(\.\d+)?\s*(KB|MB|GB|bytes)/g, '<SIZE>');

    // Replace memory values
    processed = processed.replace(/\d+(\.\d+)?\s*MB/g, '<MEMORY>MB');

    // Replace absolute paths (keep relative structure)
    processed = processed.replace(/\/[^\s]+\/typed-tester\//g, '<PROJECT_ROOT>/');
    processed = processed.replace(/[A-Z]:\\.+?\\typed-tester\\/g, '<PROJECT_ROOT>\\');

    // Replace hash values
    processed = processed.replace(/::(\d+)::/g, '::<HASH>::');

    return processed;
  }

  /**
   * Load snapshot from file
   *
   * @param path - Snapshot file path
   * @returns Snapshot content or null if doesn't exist
   */
  private loadSnapshot(path: string): string | null {
    if (!existsSync(path)) {
      return null;
    }

    return readFileSync(path, 'utf-8');
  }

  /**
   * Save snapshot to file
   *
   * @param path - Snapshot file path
   * @param content - Snapshot content
   */
  private saveSnapshot(path: string, content: string): void {
    const dir = dirname(path);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(path, content, 'utf-8');
  }

  /**
   * Get snapshot file path
   *
   * @param snapshotName - Snapshot name
   * @returns Full path to snapshot file
   */
  private getSnapshotPath(snapshotName: string): string {
    return join(this.snapshotDir, `${snapshotName}.snap`);
  }

  /**
   * Throw snapshot mismatch error
   *
   * @param name - Snapshot name
   * @param expected - Expected snapshot
   * @param actual - Actual output
   */
  private throwSnapshotMismatch(name: string, expected: string, actual: string): never {
    const diff = this.generateDiff(expected, actual);

    throw new Error(
      `Snapshot mismatch: ${name}\n\n` +
      `Expected:\n${this.formatSnapshot(expected)}\n\n` +
      `Actual:\n${this.formatSnapshot(actual)}\n\n` +
      `Diff:\n${diff}\n\n` +
      `To update snapshots, run with UPDATE_SNAPSHOTS=true`
    );
  }

  /**
   * Format snapshot for display
   *
   * @param snapshot - Snapshot text
   * @returns Formatted snapshot
   */
  private formatSnapshot(snapshot: string): string {
    const lines = snapshot.split('\n');
    const maxLines = 50;

    if (lines.length <= maxLines) {
      return snapshot;
    }

    const shown = lines.slice(0, maxLines).join('\n');
    return `${shown}\n... (${lines.length - maxLines} more lines)`;
  }

  /**
   * Generate simple diff between strings
   *
   * @param expected - Expected string
   * @param actual - Actual string
   * @returns Diff output
   */
  private generateDiff(expected: string, actual: string): string {
    const expectedLines = expected.split('\n');
    const actualLines = actual.split('\n');
    const diff: string[] = [];

    const maxLen = Math.max(expectedLines.length, actualLines.length);

    for (let i = 0; i < maxLen; i++) {
      const exp = expectedLines[i] || '';
      const act = actualLines[i] || '';

      if (exp === act) {
        diff.push(`  ${exp}`);
      } else {
        if (exp) diff.push(`- ${exp}`);
        if (act) diff.push(`+ ${act}`);
      }

      // Limit diff output
      if (diff.length > 100) {
        diff.push('... (diff truncated)');
        break;
      }
    }

    return diff.join('\n');
  }

  /**
   * Enable snapshot update mode
   */
  enableUpdateMode(): void {
    this.updateSnapshots = true;
  }

  /**
   * Disable snapshot update mode
   */
  disableUpdateMode(): void {
    this.updateSnapshots = false;
  }

  /**
   * Check if update mode is enabled
   */
  isUpdateMode(): boolean {
    return this.updateSnapshots;
  }

  /**
   * Clear all in-memory snapshots
   */
  clearSnapshots(): void {
    this.snapshots.clear();
  }

  /**
   * Get all in-memory snapshots
   */
  getSnapshots(): Map<string, string> {
    return new Map(this.snapshots);
  }
}

/**
 * Create a snapshot matcher instance
 *
 * @param snapshotDir - Directory for snapshot files
 */
export function createSnapshotMatcher(snapshotDir?: string): SnapshotMatcher {
  return new SnapshotMatcher(snapshotDir);
}

/**
 * Vitest helper for snapshot testing
 *
 * @example
 * ```typescript
 * import { matchSnapshot } from './helpers/snapshot-matcher';
 *
 * it('should match snapshot', () => {
 *   const output = runCommand();
 *   matchSnapshot(output, 'command-output');
 * });
 * ```
 */
export function matchSnapshot(actual: string, name: string, options?: Parameters<SnapshotMatcher['matchOutput']>[2]): void {
  const matcher = new SnapshotMatcher();
  matcher.matchOutput(actual, name, options);
}
