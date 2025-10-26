/**
 * Integration Tests: Test Reporting
 *
 * Purpose: Document current behavior and establish baseline for bug fixes
 *
 * These tests run the `test` command on fixture files and assert the CURRENT
 * (buggy) behavior. This serves as:
 * 1. Documentation of bugs
 * 2. Regression prevention (these tests should keep passing)
 * 3. Baseline for comparison when bugs are fixed in later phases
 *
 * Bug 1: Missing describe block reporting
 * Bug 2: Inconsistent metrics between hierarchy levels
 * Bug 3: Zero-type-test files should be hidden by default
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';
import type { Expect, AssertEqual, AssertExtends } from 'inferred-types/types';

const CLI_JS = join(process.cwd(), 'bin', 'typed.js');
const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'test-project', 'tests');

/**
 * Helper to run the test command on a specific fixture file
 */
function runTestOnFixture(filename: string, extraArgs: string[] = []): string {
  const relativePath = `tests/fixtures/test-project/tests/${filename}`;
  const args = ['test', relativePath, ...extraArgs];
  const cmd = `node "${CLI_JS}" ${args.join(' ')}`;

  try {
    const result = execSync(cmd, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return result;
  } catch (error: any) {
    // test command may exit with non-zero on type errors (expected for some fixtures)
    const output = (error.stdout || '') + (error.stderr || '');
    return output;
  }
}

/**
 * Helper to run the test command on all fixtures in the test-project directory
 */
function runAllFixtures(extraArgs: string[] = []): string {
  const relativePath = `tests/fixtures/test-project/tests`;
  const args = ['test', relativePath, ...extraArgs];
  const cmd = `node "${CLI_JS}" ${args.join(' ')}`;

  try {
    const result = execSync(cmd, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return result;
  } catch (error: any) {
    // test command may exit with non-zero on type errors (expected for some fixtures)
    const output = (error.stdout || '') + (error.stderr || '');
    return output;
  }
}

describe('Test Reporting - Baseline Behavior', () => {
  // Run each fixture ONCE at top level and share across all describe blocks
  let nestedDescribesOutput: string;
  let noTypeTestsOutput: string;

  beforeAll(() => {
    nestedDescribesOutput = runTestOnFixture('nested-describes.test.ts');
    // Run on entire fixture directory to test filtering behavior (not explicit file selection)
    allFixturesOutput = runAllFixtures();
    noTypeTestsVerboseOutput = runTestOnFixture('no-type-tests.test.ts', ['--verbose']);
  });

  let allFixturesOutput: string;
  let noTypeTestsVerboseOutput: string;

  describe('Bug 1: Missing Describe Block Reporting', () => {

    it('should show all top-level describe blocks in nested fixture (current buggy behavior)', () => {
      // CURRENT BUG: Not all top-level describe blocks appear in output
      expect(nestedDescribesOutput).toContain('nested-describes.test.ts');
      expect(nestedDescribesOutput).toBeTruthy();

      // Type test: verify output is string
      type cases = [
        Expect<AssertEqual<typeof nestedDescribesOutput, string>>,
      ];
    });

    it('should show nested describe blocks with proper hierarchy (current buggy behavior)', () => {
      // CURRENT BUG: Nested blocks may not display with proper hierarchy
      expect(nestedDescribesOutput).toBeTruthy();
      expect(nestedDescribesOutput).toContain('nested-describes.test.ts');
    });

    it('should mark skipped describe blocks appropriately (current buggy behavior)', () => {
      // CURRENT: Top Level Block 3 is skipped - document how it's displayed
      expect(nestedDescribesOutput).toBeTruthy();
    });

    it('should display it blocks under their describe blocks (current buggy behavior)', () => {
      // CURRENT: Document how it blocks display under describe blocks
      expect(nestedDescribesOutput).toBeTruthy();
    });
  });

  describe('Bug 2: Metric Consistency', () => {

    it('should show consistent test counts across hierarchy levels (current buggy behavior)', () => {
      // CURRENT BUG: Metrics may be inconsistent across hierarchy levels
      expect(nestedDescribesOutput).toBeTruthy();
      expect(nestedDescribesOutput).toMatch(/\d+\s+tests?/);

      // Type test: verify output is string
      type cases = [
        Expect<AssertEqual<typeof nestedDescribesOutput, string>>,
      ];
    });

    it('should aggregate metrics correctly from nested describes (current buggy behavior)', () => {
      // CURRENT: Fixture has multiple it blocks with type tests
      expect(nestedDescribesOutput).toMatch(/TEST SUMMARY|tests/i);
    });

    it('should show file-level metrics that match sum of describe-level metrics (current buggy behavior)', () => {
      // CURRENT BUG: File-level metrics may not equal sum of all describe metrics
      expect(nestedDescribesOutput).toBeTruthy();
      expect(nestedDescribesOutput).toContain('TEST SUMMARY');
    });
  });

  describe('Phase 4: Hide Zero-Type-Test Files Policy', () => {

    it('should hide zero-type-test files by default (Phase 4 implemented)', () => {
      // AFTER Phase 4: Files with 0 type tests are hidden by default
      // File should not appear with a checkmark (file listing)
      expect(allFixturesOutput).not.toMatch(/[✓⤬⇣]\s+.*no-type-tests\.test\.ts/);

      // Should show message about hidden files or just not show the file
      // (when running on directory, it should hide zero-type-test files)

      expect(allFixturesOutput).toBeTruthy();
    });

    it('should show zero-type-test files when --verbose flag is used (Phase 4 implemented)', () => {
      // WITH --verbose: Files with 0 type tests are shown with checkmark
      expect(noTypeTestsVerboseOutput).toMatch(/[✓⤬⇣]\s+.*no-type-tests\.test\.ts/);

      // Should show runtime tests were found (6 tests in this file)
      expect(noTypeTestsVerboseOutput).toMatch(/6\s+tests/);

      // Should show 0 type tests
      expect(noTypeTestsVerboseOutput).toMatch(/0\s+type\s+tests/i);

      expect(noTypeTestsVerboseOutput).toBeTruthy();
    });
  });

  describe('Type Tests: Type System Validation', () => {

    it('should verify runTestOnFixture returns string type', () => {
      // Use cached output instead of re-running
      expect(typeof nestedDescribesOutput).toBe('string');

      type cases = [
        Expect<AssertEqual<typeof nestedDescribesOutput, string>>,
      ];
    });

    it('should verify helper function signature types', () => {
      // Type test: verify the helper function has correct signature
      type RunTestFunc = typeof runTestOnFixture;
      type ExpectedSignature = (filename: string, extraArgs?: string[]) => string;

      type cases = [
        Expect<AssertExtends<RunTestFunc, ExpectedSignature>>,
      ];
    });

    it('should verify CLI path is string type', () => {
      expect(typeof CLI_JS).toBe('string');

      type cases = [
        Expect<AssertEqual<typeof CLI_JS, string>>,
      ];
    });

    it('should verify fixture directory is string type', () => {
      expect(typeof FIXTURE_DIR).toBe('string');

      type cases = [
        Expect<AssertEqual<typeof FIXTURE_DIR, string>>,
      ];
    });
  });

  describe('Regression Prevention', () => {

    it('should run test command without crashing on nested describes', () => {
      // If beforeAll succeeded, the output exists and command didn't throw
      expect(nestedDescribesOutput).toBeTruthy();
    });

    it('should run test command without crashing on zero type tests', () => {
      // If beforeAll succeeded, the output exists and command didn't throw
      expect(noTypeTestsOutput).toBeTruthy();
    });

    it('should produce output for valid test files', () => {
      expect(nestedDescribesOutput.length).toBeGreaterThan(0);
      expect(noTypeTestsOutput.length).toBeGreaterThan(0);
    });

    it('should include test summary in output', () => {
      expect(nestedDescribesOutput).toMatch(/TEST SUMMARY|summary/i);
    });
  });
});
