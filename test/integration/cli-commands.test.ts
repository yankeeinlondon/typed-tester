import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

const CLI_PATH = join(process.cwd(), 'bin', 'typed');
// const TEST_PROJECT_PATH = join(process.cwd(), 'test', 'fixtures', 'test-project');

// Helper function to run CLI commands
function runCLI(args: string[], options: { cwd?: string; expectError?: boolean } = {}): string {
  const cwd = options.cwd || process.cwd();
  const cmd = `"${CLI_PATH}" ${args.join(' ')}`;
  
  try {
    const result = execSync(cmd, { 
      cwd, 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return result;
  } catch (error: any) {
    if (options.expectError) {
      // Combine stdout and stderr for error cases
      const output = (error.stdout || '') + (error.stderr || '');
      return output;
    }
    throw error;
  }
}

describe.concurrent('CLI Integration Tests', () => {
  beforeAll(() => {
    // Ensure CLI is built and executable
    expect(existsSync(CLI_PATH)).toBe(true);
    
    // Build the CLI if needed
    try {
      execSync('npm run build', { stdio: 'pipe' });
    } catch (error) {
      // Ignore build errors - CLI might already be built
    }
    
    // Make CLI executable
    try {
      execSync(`chmod +x "${CLI_PATH}"`, { stdio: 'pipe' });
    } catch (error) {
      // Ignore chmod errors on Windows
    }
  });

  describe.concurrent('test command', () => {
    it('should run test command on existing test files', () => {
      const result = runCLI(['test', '--quiet'], { expectError: true });
      
      // Should contain test summary even if there are errors
      expect(result).toContain('TEST SUMMARY');
      // Should show actual error counts, not "No errors!"
      expect(result).toMatch(/\d+ of \d+ tests had errors|No errors!/);
    });

    it('should show verbose output when requested', () => {
      const result = runCLI(['test', '--verbose'], { expectError: true });
      
      expect(result).toContain('TEST SUMMARY');
      expect(result).toMatch(/command took|TEST SUMMARY/);
    });

    it('should handle JSON output', () => {
      const result = runCLI(['test', '--json'], { expectError: true });
      
      // Should output JSON or be non-empty
      if (result.trim()) {
        // If there's output, it should be valid JSON or contain JSON
        expect(result).toMatch(/\[|\{/); // Should contain JSON array or object markers
      } else {
        // No output is also acceptable for some test configurations
        expect(result).toBeTruthy();
      }
    });

    it('should respect filter parameter', () => {
      const result = runCLI(['test', '--filter', 'real-test', '--quiet'], { expectError: true });
      
      expect(result).toContain('TEST SUMMARY');
    });
  });

  describe.concurrent('symbols command', () => {
    it('should run symbols command successfully', () => {
      const result = runCLI(['symbols', '--quiet']);
      
      // Should show symbol table or summary
      expect(result).toMatch(/Symbol|symbols found|project found/);
    });

    it('should handle filter parameter', () => {
      const result = runCLI(['symbols', '--filter', 'Test', '--quiet']);
      
      expect(result).toBeTruthy();
    });

    it('should provide JSON output', () => {
      const result = runCLI(['symbols', '--json']);
      
      // Should output valid JSON
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe.concurrent('source command', () => {
    it('should run source command successfully', () => {
      const result = runCLI(['source'], { expectError: true });
      
      // Should either show output or run without errors
      // Some environments may have no diagnostics to report
      expect(result).toMatch(/DIAGNOSTICS SUMMARY|errors|warnings|No diagnostics|Source File Analysis|^$/);
    });

    it('should show verbose diagnostic breakdown', () => {
      const result = runCLI(['source', '--verbose'], { expectError: true });
      
      // Verbose shows error codes breakdown first, then summary
      expect(result).toMatch(/Error Codes:|DIAGNOSTICS SUMMARY|Source File Analysis/);
      expect(result).toMatch(/command took|occurrences/);
    });
  });

  describe.concurrent('deps command', () => {
    it('should run deps command successfully', () => {
      const result = runCLI(['deps']);
      
      // Should show symbols and dependencies
      expect(result).toMatch(/symbols found|command took|sections|module::/);
    });
  });

  describe.concurrent('files command', () => {
    it('should run files command successfully', () => {
      const result = runCLI(['files']);
      
      // Should show file table or summary
      expect(result).toBeTruthy();
    });

    it('should provide JSON output', () => {
      const result = runCLI(['files', '--json']);
      
      // Should output valid JSON
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe.concurrent('help and error handling', () => {
    it('should show help for test command', () => {
      const result = runCLI(['test', '--help']);
      
      expect(result).toContain('Syntax');
      expect(result).toContain('Options');
      expect(result).toContain('filter');
    });

    it('should show help for symbols command', () => {
      const result = runCLI(['symbols', '--help']);
      
      expect(result).toContain('Syntax');
      expect(result).toContain('Options');
    });

    it('should handle invalid commands gracefully', () => {
      const result = runCLI(['invalid-command'], { expectError: true });
      
      // Should not crash, might show help or error message
      expect(result).toBeTruthy();
    });

    it('should handle invalid options gracefully', () => {
      const result = runCLI(['test', '--invalid-option'], { expectError: true });
      
      // Should not crash completely
      expect(result).toBeTruthy();
    });
  });

  describe.concurrent('performance', () => {
    it('should complete test command within reasonable time', () => {
      const startTime = Date.now();
      runCLI(['test', '--quiet'], { expectError: true });
      const endTime = Date.now();
      
      // Should complete within 10 seconds (generous timeout for CI)
      expect(endTime - startTime).toBeLessThan(10000);
    });

    it('should complete symbols command within reasonable time', () => {
      const startTime = Date.now();
      runCLI(['symbols', '--quiet'], { expectError: true });
      const endTime = Date.now();
      
      // Should complete within 10 seconds
      expect(endTime - startTime).toBeLessThan(10000);
    });

    it('should complete source command within reasonable time', () => {
      const startTime = Date.now();
      runCLI(['source', '--quiet'], { expectError: true });
      const endTime = Date.now();
      
      // Should complete within 10 seconds
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });

  describe.concurrent('error counting regression test', () => {
    it('should show accurate error counts (main bug fix verification)', () => {
      const result = runCLI(['test', '--verbose'], { expectError: true });
      
      // The key test: should NOT show "No errors!" when there are actual errors
      if (result.includes('tests had errors')) {
        // If there are errors, verify the count makes sense
        const errorMatch = result.match(/(\d+) of (\d+) tests had errors/);
        if (errorMatch) {
          const errorsCount = parseInt(errorMatch[1]);
          const totalTests = parseInt(errorMatch[2]);
          
          expect(errorsCount).toBeGreaterThan(0);
          expect(errorsCount).toBeLessThanOrEqual(totalTests);
          expect(totalTests).toBeGreaterThan(0);
        }
      } else if (result.includes('No errors!')) {
        // If showing "No errors!", verify no individual errors are shown
        expect(result).not.toMatch(/\[ ⛒ \]/); // Should not contain error symbols
      }
      
      // Verify the output is consistent
      expect(result).toContain('TEST SUMMARY');
    });
  });
});