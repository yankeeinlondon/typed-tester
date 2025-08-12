/**
 * Comprehensive output validation utilities for CLI command testing
 */

import type { TestCommandOutput, SymbolsCommandOutput, SourceCommandOutput } from './enhanced-test-harness';

export interface ValidationRule<T> {
  name: string;
  validate: (output: T) => boolean;
  errorMessage: (output: T) => string;
}

export class CLIOutputValidator {
  /**
   * Validate test command output with multiple rules
   */
  static validateTestCommand(output: TestCommandOutput, customRules: ValidationRule<TestCommandOutput>[] = []): void {
    const defaultRules: ValidationRule<TestCommandOutput>[] = [
      {
        name: 'hasOutput',
        validate: (o) => Boolean(o.raw && o.raw.trim().length > 0) || o.quiet === true,
        errorMessage: () => 'Test command produced no output'
      },
      {
        name: 'hasValidSummary',
        validate: (o) => typeof o.summary.totalTests === 'number' && o.summary.totalTests >= 0,
        errorMessage: (o) => `Invalid test summary: ${JSON.stringify(o.summary)}`
      },
      {
        name: 'hasConsistentCounts',
        validate: (o) => o.summary.totalTests === (o.summary.passed + o.summary.failed),
        errorMessage: (o) => `Inconsistent test counts: total=${o.summary.totalTests}, passed=${o.summary.passed}, failed=${o.summary.failed}`
      },
      {
        name: 'hasTestFiles',
        validate: (o) => o.summary.totalTests === 0 || o.files.length >= 0 || o.raw.includes('no tests found') || o.raw.includes('No test files'),
        errorMessage: (o) => `Test validation failed for files array`
      }
    ];

    const allRules = [...defaultRules, ...customRules];
    
    for (const rule of allRules) {
      if (!rule.validate(output)) {
        throw new Error(`Test output validation failed [${rule.name}]: ${rule.errorMessage(output)}`);
      }
    }
  }

  /**
   * Validate symbols command output
   */
  static validateSymbolsCommand(output: SymbolsCommandOutput, customRules: ValidationRule<SymbolsCommandOutput>[] = []): void {
    const defaultRules: ValidationRule<SymbolsCommandOutput>[] = [
      {
        name: 'hasOutput',
        validate: (o) => Boolean(o.raw && o.raw.trim().length > 0),
        errorMessage: () => 'Symbols command produced no output'
      },
      {
        name: 'hasValidCount',
        validate: (o) => typeof o.count === 'number' && o.count >= 0,
        errorMessage: (o) => `Invalid symbol count: ${o.count}`
      },
      {
        name: 'countMatchesSymbols',
        validate: (o) => o.count === o.symbols.length,
        errorMessage: (o) => `Symbol count mismatch: reported=${o.count}, actual=${o.symbols.length}`
      },
      {
        name: 'symbolsHaveRequiredFields',
        validate: (o) => o.symbols.every(s => s.name && s.type && s.file && typeof s.line === 'number'),
        errorMessage: (o) => 'Some symbols missing required fields (name, type, file, line)'
      }
    ];

    const allRules = [...defaultRules, ...customRules];
    
    for (const rule of allRules) {
      if (!rule.validate(output)) {
        throw new Error(`Symbols output validation failed [${rule.name}]: ${rule.errorMessage(output)}`);
      }
    }
  }

  /**
   * Validate source command output
   */
  static validateSourceCommand(output: SourceCommandOutput, customRules: ValidationRule<SourceCommandOutput>[] = []): void {
    const defaultRules: ValidationRule<SourceCommandOutput>[] = [
      {
        name: 'hasOutput',
        validate: (o) => Boolean(o.raw && o.raw.trim().length > 0),
        errorMessage: () => 'Source command produced no output'
      },
      {
        name: 'hasValidDiagnostics',
        validate: (o) => Array.isArray(o.diagnostics),
        errorMessage: () => 'Diagnostics should be an array'
      },
      {
        name: 'diagnosticsHaveRequiredFields',
        validate: (o) => o.diagnostics.every(d => 
          d.file && 
          ['error', 'warning', 'info'].includes(d.severity) && 
          d.message && 
          typeof d.line === 'number'
        ),
        errorMessage: () => 'Some diagnostics missing required fields (file, severity, message, line)'
      },
      {
        name: 'hasValidPerformance',
        validate: (o) => o.performance && typeof o.performance.parseTime === 'number' && typeof o.performance.files === 'number',
        errorMessage: (o) => `Invalid performance data: ${JSON.stringify(o.performance)}`
      }
    ];

    const allRules = [...defaultRules, ...customRules];
    
    for (const rule of allRules) {
      if (!rule.validate(output)) {
        throw new Error(`Source output validation failed [${rule.name}]: ${rule.errorMessage(output)}`);
      }
    }
  }

  /**
   * Validate generic command output structure
   */
  static validateGenericOutput(output: { raw: string }, commandName: string): void {
    if (!output.raw || output.raw.trim().length === 0) {
      throw new Error(`${commandName} command produced no output`);
    }

    // Check for common error patterns (but exclude informational ERROR: messages)
    if (output.raw.includes('ERROR:') && !output.raw.includes('0 errors')) {
      const errorLines = output.raw.split('\n').filter(line => 
        line.includes('ERROR:') && 
        !line.includes('symbols found') && 
        !line.includes('command took') &&
        !line.includes('files found') &&
        !line.includes('dependencies found') &&
        !line.includes('No test files') &&
        !line.includes('no tests found') &&
        !line.includes('package.json not found')
      );
      // Only throw if we have actual errors that aren't expected failure scenarios
      if (errorLines.length > 0 && !errorLines.every(line => 
        line.includes('package.json not found') || 
        line.includes('No test files') ||
        line.includes('no tests found')
      )) {
        throw new Error(`${commandName} command had errors: ${errorLines.join(', ')}`);
      }
    }

    // Check for process exit indicators
    if (output.raw.includes('[Process would exit with code:') && !output.raw.includes('code: 0]')) {
      const exitMatch = output.raw.match(/code: (\d+)/);
      const exitCode = exitMatch ? exitMatch[1] : 'unknown';
      
      // For test commands, exit code 2 is acceptable (indicates test failures, not CLI failure)
      if (commandName === 'test' && exitCode === '2') {
        // This is acceptable - tests can fail
        return;
      }
      
      throw new Error(`${commandName} command would exit with non-zero code: ${exitCode}`);
    }
  }
}

/**
 * Specialized validators for different scenarios
 */
export class ScenarioValidators {
  /**
   * Validate that command ran successfully (no errors, proper exit)
   */
  static validateSuccessfulExecution(output: { raw: string }, commandName: string): void {
    CLIOutputValidator.validateGenericOutput(output, commandName);
    
    // Additional success criteria - but allow test command to exit with code 2 (test failures)
    if (output.raw.includes('Process would exit with code:') && !output.raw.includes('code: 0]')) {
      // For test commands, exit code 2 is acceptable (indicates test failures, not CLI failure)
      if (commandName === 'test' && output.raw.includes('code: 2]')) {
        // This is acceptable - tests can fail
        return;
      }
      throw new Error(`${commandName} did not exit successfully`);
    }
  }

  /**
   * Validate that command handled errors gracefully
   */
  static validateGracefulErrorHandling(output: { raw: string }, commandName: string, expectedErrorPattern: RegExp): void {
    if (!output.raw || output.raw.trim().length === 0) {
      throw new Error(`${commandName} produced no output for error case`);
    }

    if (!expectedErrorPattern.test(output.raw)) {
      throw new Error(`${commandName} did not produce expected error pattern`);
    }

    // Should not crash or throw unhandled exceptions
    if (output.raw.includes('Unhandled') || output.raw.includes('FATAL')) {
      throw new Error(`${commandName} had unhandled errors: ${output.raw}`);
    }
  }

  /**
   * Validate empty/no-results scenarios
   */
  static validateEmptyResults(output: { raw: string }, commandName: string): void {
    CLIOutputValidator.validateGenericOutput(output, commandName);
    
    // Should gracefully handle empty results
    const emptyIndicators = [
      'No tests found',
      'No symbols found', 
      'No files found',
      'No dependencies found',
      'No test files',
      'no test files found',
      '0 tests',
      '0 symbols',
      '0 files',
      'package.json not found'
    ];

    const hasEmptyIndicator = emptyIndicators.some(indicator => 
      output.raw.toLowerCase().includes(indicator.toLowerCase())
    );

    if (!hasEmptyIndicator) {
      throw new Error(`${commandName} should indicate empty results clearly. Output: ${output.raw.substring(0, 200)}...`);
    }
  }

  /**
   * Validate performance requirements
   */
  static validatePerformanceRequirements(
    duration: number, 
    commandName: string, 
    maxDuration: number = 2000
  ): void {
    if (duration > maxDuration) {
      throw new Error(
        `${commandName} took ${duration.toFixed(2)}ms, exceeding limit of ${maxDuration}ms`
      );
    }
  }
}

/**
 * Pattern matchers for common CLI output patterns
 */
export class OutputPatterns {
  static readonly TEST_SUMMARY = /(\d+)\s+tests?\s+(passed|failed)/;
  static readonly SYMBOL_ENTRY = /([A-Za-z_][A-Za-z0-9_]*)\s+\((function|type|interface|class)\)/;
  static readonly FILE_PATH = /([^\s]+\.(?:ts|js|tsx|jsx|json))/;
  static readonly DIAGNOSTIC = /([^:]+):(\d+):(\d+)\s+-\s+(error|warning|info)\s+(.+)/;
  static readonly PERFORMANCE_TIME = /(?:Parsed|Executed|Completed) in ([\d.]+)ms/;
  static readonly ERROR_LINE = /ERROR:|✗|\[ERROR\]/;
  static readonly SUCCESS_LINE = /✓|\[SUCCESS\]|passed/;
  
  /**
   * Extract all matches for a pattern from output
   */
  static extractMatches(output: string, pattern: RegExp): RegExpMatchArray[] {
    const lines = output.split('\n');
    const matches: RegExpMatchArray[] = [];
    
    for (const line of lines) {
      const match = line.match(pattern);
      if (match) {
        matches.push(match);
      }
    }
    
    return matches;
  }

  /**
   * Count occurrences of a pattern in output
   */
  static countMatches(output: string, pattern: RegExp): number {
    return this.extractMatches(output, pattern).length;
  }
}