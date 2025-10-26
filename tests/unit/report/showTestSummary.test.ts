import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showTestSummary } from '~/report/showTestSummary';
import type { TestSummary } from '~/types';

// Mock the fileLink and relativeFile utilities to avoid file system checks
vi.mock('~/utils', async () => {
  const actual = await vi.importActual<typeof import('~/utils')>('~/utils');
  return {
    ...actual,
    fileLink: vi.fn((prettyPath: string, _relPath: string) => prettyPath),
    relativeFile: vi.fn((path: string) => path)
  };
});

describe('showTestSummary() - Phase 4', () => {
  // Capture console.log output
  let consoleOutput: string[] = [];
  const mockLog = vi.fn((...args: any[]) => {
    consoleOutput.push(args.join(' '));
  });

  beforeEach(() => {
    consoleOutput = [];
    vi.spyOn(console, 'log').mockImplementation(mockLog);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Type test and assertion metrics', () => {
    it('should display type tests and assertions when both are present', () => {
      const summary: TestSummary = {
        filesWithErrors: 0,
            filesWithWarningsOutside: 0,
        testsWithErrors: 0,
        filesWithWarnings: 0,
        tests: 50,
        testFiles: 10,
        typeTests: 20,
        assertions: 85,
        skipped: 0,
        withDiagnostics: [],
        slow: []
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      // Runtime assertions
      expect(output).toContain('20');
      expect(output).toContain('50');
      expect(output).toContain('85');
      expect(output).toContain('type');
      expect(output).toContain('assertion');

      // Should display in a clear format mentioning type tests and assertions
      // Example: "20 of 50 tests had type assertions (85 total assertions)"
      // Or: "20 tests with type assertions (85 assertions)"
    });

    it('should display zero type tests and assertions when none present', () => {
      const summary: TestSummary = {
        filesWithErrors: 0,
            filesWithWarningsOutside: 0,
        testsWithErrors: 0,
        filesWithWarnings: 0,
        tests: 30,
        testFiles: 5,
        typeTests: 0,
        assertions: 0,
        skipped: 0,
        withDiagnostics: [],
        slow: []
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      // Should still show the metrics even when zero
      expect(output).toContain('0');
      expect(output).toContain('type');
    });

    it('should handle case where all tests have type assertions', () => {
      const summary: TestSummary = {
        filesWithErrors: 0,
            filesWithWarningsOutside: 0,
        testsWithErrors: 0,
        filesWithWarnings: 0,
        tests: 15,
        testFiles: 3,
        typeTests: 15, // All tests have type assertions
        assertions: 42,
        skipped: 0,
        withDiagnostics: [],
        slow: []
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      expect(output).toContain('15');
      expect(output).toContain('42');
    });

    it('should handle large numbers correctly', () => {
      const summary: TestSummary = {
        filesWithErrors: 0,
            filesWithWarningsOutside: 0,
        testsWithErrors: 0,
        filesWithWarnings: 0,
        tests: 1250,
        testFiles: 150,
        typeTests: 425,
        assertions: 1893,
        skipped: 0,
        withDiagnostics: [],
        slow: []
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      expect(output).toContain('1250');
      expect(output).toContain('425');
      expect(output).toContain('1893');
    });
  });

  describe('Existing functionality preservation', () => {
    it('should still display no errors message when tests pass', () => {
      const summary: TestSummary = {
        filesWithErrors: 0,
            filesWithWarningsOutside: 0,
        testsWithErrors: 0,
        filesWithWarnings: 0,
        tests: 50,
        testFiles: 10,
        typeTests: 20,
        assertions: 85,
        skipped: 0,
        withDiagnostics: [],
        slow: []
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      expect(output).toContain('No errors');
    });

    it('should display error counts when tests fail', () => {
      const summary: TestSummary = {
        filesWithErrors: 2,
            filesWithWarningsOutside: 0,
        testsWithErrors: 5,
        filesWithWarnings: 0,
        tests: 50,
        testFiles: 10,
        typeTests: 20,
        assertions: 85,
        skipped: 0,
        withDiagnostics: ['test1.ts', 'test2.ts'],
        slow: []
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      expect(output).toContain('5');
      expect(output).toContain('50');
      expect(output).toContain('tests');
      expect(output).toContain('had errors');
      expect(output).toContain('2');
      expect(output).toContain('10');
      expect(output).toContain('test files');
    });

    it('should display skipped test count', () => {
      const summary: TestSummary = {
        filesWithErrors: 0,
            filesWithWarningsOutside: 0,
        testsWithErrors: 0,
        filesWithWarnings: 0,
        tests: 50,
        testFiles: 10,
        typeTests: 20,
        assertions: 85,
        skipped: 3,
        withDiagnostics: [],
        slow: []
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      expect(output).toContain('3');
      expect(output).toContain('skipped');
    });

    it('should display slow files', () => {
      const summary: TestSummary = {
        filesWithErrors: 0,
            filesWithWarningsOutside: 0,
        testsWithErrors: 0,
        filesWithWarnings: 0,
        tests: 50,
        testFiles: 10,
        typeTests: 20,
        assertions: 85,
        skipped: 0,
        withDiagnostics: [],
        slow: ['slow-test1.ts', 'slow-test2.ts']
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      expect(output).toContain('slow');
      expect(output).toContain('2');
    });

    it('should display warnings', () => {
      const summary: TestSummary = {
        filesWithErrors: 0,
            filesWithWarningsOutside: 0,
        testsWithErrors: 0,
        filesWithWarnings: 2,
        tests: 50,
        testFiles: 10,
        typeTests: 20,
        assertions: 85,
        skipped: 0,
        withDiagnostics: [],
        slow: []
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      expect(output).toContain('2');
      expect(output).toContain('warnings');
    });
  });

  describe('Edge cases', () => {
    it('should handle summary with no tests executed', () => {
      const summary: TestSummary = {
        filesWithErrors: 0,
            filesWithWarningsOutside: 0,
        testsWithErrors: 0,
        filesWithWarnings: 0,
        tests: 0,
        testFiles: 0,
        typeTests: 0,
        assertions: 0,
        skipped: 0,
        withDiagnostics: [],
        slow: []
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      expect(output).toContain('no tests executed');
    });

    it('should handle single test correctly (singular vs plural)', () => {
      const summary: TestSummary = {
        filesWithErrors: 0,
            filesWithWarningsOutside: 0,
        testsWithErrors: 0,
        filesWithWarnings: 0,
        tests: 1,
        testFiles: 1,
        typeTests: 1,
        assertions: 3,
        skipped: 1,
        withDiagnostics: [],
        slow: []
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      // Should handle singular "test was skipped" not "tests were skipped"
      expect(output).toMatch(/test was skipped|1.*skipped/);
    });

    it('should handle all tests skipped', () => {
      const summary: TestSummary = {
        filesWithErrors: 0,
            filesWithWarningsOutside: 0,
        testsWithErrors: 0,
        filesWithWarnings: 0,
        tests: 0,
        testFiles: 5,
        typeTests: 0,
        assertions: 0,
        skipped: 25,
        withDiagnostics: [],
        slow: []
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      expect(output).toContain('25');
      expect(output).toContain('skipped');
    });
  });

  describe('Terminology consistency', () => {
    it('should use "tests" for it blocks (not doubled count)', () => {
      const summary: TestSummary = {
        filesWithErrors: 0,
            filesWithWarningsOutside: 0,
        testsWithErrors: 0,
        filesWithWarnings: 0,
        tests: 26, // This should be the count of it() blocks, matching Vitest
        testFiles: 1,
        typeTests: 13,
        assertions: 52,
        skipped: 0,
        withDiagnostics: [],
        slow: []
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      // Should use the word "tests" to refer to it() blocks
      expect(output).toContain('tests');
      expect(output).toContain('26');
    });

    it('should distinguish between "tests" and "type assertions"', () => {
      const summary: TestSummary = {
        filesWithErrors: 2,
            filesWithWarningsOutside: 0,
        testsWithErrors: 3,
        filesWithWarnings: 0,
        tests: 50,
        testFiles: 10,
        typeTests: 20,
        assertions: 85,
        skipped: 0,
        withDiagnostics: ['test1.ts', 'test2.ts'],
        slow: []
      };

      showTestSummary(summary);

      const output = consoleOutput.join('\n');

      // Should clearly distinguish between tests (it blocks) and assertions
      expect(output).toContain('tests');
      expect(output).toContain('assertion');
    });
  });
});
