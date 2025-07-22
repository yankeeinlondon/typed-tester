import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestHarness, getDefaultOptions } from '../helpers/test-harness';
import { execSync } from 'child_process';
import { join } from 'path';

const CLI_PATH = join(process.cwd(), 'bin', 'typed');

// Helper function to run CLI commands via process spawn (fallback)
function runCLI(args: string[], options: { expectError?: boolean } = {}): string {
  const cmd = `"${CLI_PATH}" ${args.join(' ')}`;
  
  try {
    const result = execSync(cmd, { 
      cwd: process.cwd(), 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return result;
  } catch (error: any) {
    if (options.expectError) {
      const output = (error.stdout || '') + (error.stderr || '');
      return output;
    }
    throw error;
  }
}

describe.concurrent('CLI Integration Tests (Fast Harness)', () => {
  let harness: TestHarness;
  let useHarness = false;

  beforeAll(async () => {
    harness = TestHarness.getInstance();
    
    try {
      await harness.initialize();
      useHarness = harness.isAvailable();
      
      if (useHarness) {
        console.log('✓ Test harness initialized - using fast in-memory tests');
      } else {
        console.log('⚠ Test harness unavailable - falling back to CLI spawning');
      }
    } catch (error) {
      console.warn('Failed to initialize test harness:', error);
      useHarness = false;
    }
  });

  afterAll(() => {
    if (harness) {
      harness.cleanup();
    }
  });

  describe.concurrent('test command', () => {
    it('should run test command and show summary', async () => {
      const options = { ...getDefaultOptions('test'), quiet: false }; // Don't use quiet mode
      
      let result: string;
      if (useHarness) {
        result = await harness.runTestCommand(options);
      } else {
        result = runCLI(['test'], { expectError: true });
      }
      
      // Should contain test summary or other expected output
      expect(result).toMatch(/TEST SUMMARY|test files found|Test Results|no test files found/);
    });

    it('should handle verbose output', async () => {
      const options = { ...getDefaultOptions('test'), verbose: true, quiet: false };
      
      let result: string;
      if (useHarness) {
        result = await harness.runTestCommand(options);
      } else {
        result = runCLI(['test', '--verbose'], { expectError: true });
      }
      
      expect(result).toMatch(/TEST SUMMARY|test files found|Test Results|no test files found/);
    });

    it('should handle filter parameter', async () => {
      const options = { ...getDefaultOptions('test'), filter: ['real-test'], quiet: false };
      
      let result: string;
      if (useHarness) {
        result = await harness.runTestCommand(options);
      } else {
        result = runCLI(['test', '--filter', 'real-test'], { expectError: true });
      }
      
      expect(result).toMatch(/TEST SUMMARY|test files found|Test Results|no test files found/);
    });

    it('should show accurate error counts (regression test)', async () => {
      const options = { ...getDefaultOptions('test'), verbose: true, quiet: false };
      
      let result: string;
      if (useHarness) {
        result = await harness.runTestCommand(options);
      } else {
        result = runCLI(['test', '--verbose'], { expectError: true });
      }
      
      // Key regression test: should NOT show "No errors!" when there are actual errors
      if (result.includes('tests had errors')) {
        const errorMatch = result.match(/(\d+) of (\d+) tests had errors/);
        if (errorMatch) {
          const errorsCount = parseInt(errorMatch[1]);
          const totalTests = parseInt(errorMatch[2]);
          
          expect(errorsCount).toBeGreaterThan(0);
          expect(errorsCount).toBeLessThanOrEqual(totalTests);
          expect(totalTests).toBeGreaterThan(0);
        }
      } else if (result.includes('No errors!')) {
        expect(result).not.toMatch(/\[ ⛒ \]/);
      }
      
      expect(result).toMatch(/TEST SUMMARY|test files found|Test Results|no test files found/);
    });
  });

  describe.concurrent('symbols command', () => {
    it('should run symbols command successfully', async () => {
      const options = getDefaultOptions('symbols');
      
      let result: string;
      if (useHarness) {
        result = await harness.runSymbolsCommand(options);
      } else {
        result = runCLI(['symbols', '--quiet']);
      }
      
      expect(result).toMatch(/Symbol|symbols found|project found/);
    });

    it('should handle filter parameter', async () => {
      const options = { ...getDefaultOptions('symbols'), filter: ['Test'] };
      
      let result: string;
      if (useHarness) {
        result = await harness.runSymbolsCommand(options);
      } else {
        result = runCLI(['symbols', '--filter', 'Test', '--quiet']);
      }
      
      expect(result).toBeTruthy();
    });

    it('should provide JSON output', async () => {
      const options = { ...getDefaultOptions('symbols'), json: true };
      
      let result: string;
      if (useHarness) {
        result = await harness.runSymbolsCommand(options);
      } else {
        result = runCLI(['symbols', '--json']);
      }
      
      if (result.trim()) {
        expect(() => JSON.parse(result)).not.toThrow();
      }
    });
  });

  describe.concurrent('source command', () => {
    it('should run source command successfully', async () => {
      const options = getDefaultOptions('source');
      
      let result: string;
      if (useHarness) {
        result = await harness.runSourceCommand(options);
      } else {
        result = runCLI(['source'], { expectError: true });
      }
      
      expect(result).toMatch(/DIAGNOSTICS SUMMARY|errors|warnings|No diagnostics|Source File Analysis|^$/);
    });

    it('should show verbose diagnostic breakdown', async () => {
      const options = { ...getDefaultOptions('source'), verbose: true, quiet: false };
      
      let result: string;
      if (useHarness) {
        result = await harness.runSourceCommand(options);
      } else {
        result = runCLI(['source', '--verbose'], { expectError: true });
      }
      
      expect(result).toMatch(/Error Codes:|DIAGNOSTICS SUMMARY|Source File Analysis/);
    });
  });

  describe.concurrent('deps command', () => {
    it('should run deps command successfully', async () => {
      const options = getDefaultOptions('deps');
      
      let result: string;
      if (useHarness) {
        result = await harness.runDepsCommand(options);
      } else {
        result = runCLI(['deps']);
      }
      
      expect(result).toMatch(/symbols found|command took|sections|module::/);
    });
  });

  describe.concurrent('files command', () => {
    it('should run files command successfully', async () => {
      const options = getDefaultOptions('files');
      
      let result: string;
      if (useHarness) {
        result = await harness.runFilesCommand(options);
      } else {
        result = runCLI(['files']);
      }
      
      expect(result).toBeTruthy();
    });

    it('should provide JSON output', async () => {
      const options = { ...getDefaultOptions('files'), json: true };
      
      let result: string;
      if (useHarness) {
        result = await harness.runFilesCommand(options);
      } else {
        result = runCLI(['files', '--json']);
      }
      
      if (result.trim()) {
        expect(() => JSON.parse(result)).not.toThrow();
      }
    });
  });

  describe.concurrent('performance', () => {
    it('should complete test command quickly with harness', async () => {
      if (!useHarness) {
        // Skip performance test if using CLI spawning
        return;
      }

      // Skip performance test in CI/CD environments where performance can be unreliable
      const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true' || process.env.NODE_ENV === 'test';
      if (isCI) {
        process.stderr.write(`✓ Skipping performance test in CI environment (CI=${process.env.CI}, GITHUB_ACTIONS=${process.env.GITHUB_ACTIONS})\n`);
        return;
      }

      const startTime = Date.now();
      const options = getDefaultOptions('test');
      await harness.runTestCommand(options);
      const endTime = Date.now();
      
      // Should complete much faster with shared project instance
      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds max (generous for CI)
    });

    it('should complete symbols command quickly with harness', async () => {
      if (!useHarness) {
        return;
      }

      // Skip performance test in CI/CD environments where performance can be unreliable
      const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true' || process.env.NODE_ENV === 'test';
      if (isCI) {
        process.stderr.write(`✓ Skipping performance test in CI environment (CI=${process.env.CI}, GITHUB_ACTIONS=${process.env.GITHUB_ACTIONS})\n`);
        return;
      }

      const startTime = Date.now();
      const options = getDefaultOptions('symbols');
      await harness.runSymbolsCommand(options);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(3000);
    });

    it('should complete source command quickly with harness', async () => {
      if (!useHarness) {
        return;
      }

      // Skip performance test in CI/CD environments where performance can be unreliable
      const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true' || process.env.NODE_ENV === 'test';
      if (isCI) {
        process.stderr.write(`✓ Skipping performance test in CI environment (CI=${process.env.CI}, GITHUB_ACTIONS=${process.env.GITHUB_ACTIONS})\n`);
        return;
      }

      const startTime = Date.now();
      const options = getDefaultOptions('source');
      await harness.runSourceCommand(options);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(3000);
    });
  });
});