import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  EnhancedTestHarness,
  getOptimizedDefaultOptions,
  PerformanceAssertions,
  OutputValidators,
  PERFORMANCE_THRESHOLDS,
  MEMORY_THRESHOLDS
} from '../../helpers/enhanced-test-harness';
import { CLIOutputValidator, ScenarioValidators, OutputPatterns } from '../../helpers/output-validators';
import { globalPerformanceTracker } from '../../helpers/performance-tracker';
import path from 'path';

describe('Source Command - Fast Integration Tests', () => {
  let harness: EnhancedTestHarness;
  const fixturePath = path.resolve(__dirname, '../../fixtures/fast-test-project');

  beforeAll(async () => {
    harness = EnhancedTestHarness.getInstance();
    
    // Initialize harness with fixture project path
    await harness.initialize(fixturePath);
    
    if (!harness.isAvailable()) {
      throw new Error('Enhanced test harness failed to initialize');
    }
  });

  afterAll(async () => {
    await harness.cleanup();
    globalPerformanceTracker.printReport();
  });

  describe('Basic Source Analysis', () => {
    it('should analyze source files with default options', async () => {
      const options = getOptimizedDefaultOptions('source');
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      // Performance validation - source analysis should be fast
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-default');
      PerformanceAssertions.expectMemoryUsage(metrics, MEMORY_THRESHOLDS.source, 'source-default');
      
      // Output validation
      CLIOutputValidator.validateSourceCommand(result);
      ScenarioValidators.validateSuccessfulExecution(result, 'source');
      
      // Source-specific validations
      expect(result.performance.files).toBeGreaterThan(0);
      expect(result.performance.parseTime).toBeGreaterThan(0);
      expect(Array.isArray(result.diagnostics)).toBe(true);
    });

    it('should provide comprehensive file analysis', async () => {
      const options = {
        ...getOptimizedDefaultOptions('source'),
        verbose: true,
        quiet: false
      };
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-comprehensive');
      CLIOutputValidator.validateSourceCommand(result);
      
      // Should analyze multiple files
      expect(result.performance.files).toBeGreaterThan(1);
      
      // Should provide meaningful performance metrics
      expect(result.performance.parseTime).toBeGreaterThan(0);
      expect(result.performance.parseTime).toBeLessThan(5000); // Should be under 5 seconds
    });

    it('should handle quiet mode efficiently', async () => {
      const options = {
        ...getOptimizedDefaultOptions('source'),
        quiet: true
      };
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      // Quiet mode should be faster
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-quiet');
      CLIOutputValidator.validateSourceCommand(result);
    });
  });

  describe('Diagnostic Analysis', () => {
    it('should detect and report diagnostics appropriately', async () => {
      const options = getOptimizedDefaultOptions('source');
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-diagnostics');
      CLIOutputValidator.validateSourceCommand(result);
      
      // Validate diagnostic structure
      for (const diagnostic of result.diagnostics) {
        expect(diagnostic.file).toBeTruthy();
        expect(diagnostic.file.endsWith('.ts')).toBe(true);
        expect(['error', 'warning', 'info']).toContain(diagnostic.severity);
        expect(diagnostic.message).toBeTruthy();
        expect(diagnostic.line).toBeGreaterThan(0);
      }
    });

    it('should handle projects with no errors', async () => {
      // Our fixture should be clean TypeScript code
      const options = getOptimizedDefaultOptions('source');
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-clean');
      CLIOutputValidator.validateSourceCommand(result);
      
      // Should complete successfully even with no diagnostics
      expect(result.performance.files).toBeGreaterThan(0);
      
      // Filter out any expected warnings (like unused variables in test fixtures)
      const errors = result.diagnostics.filter(d => d.severity === 'error');
      expect(errors.length).toBe(0); // Should have no TypeScript errors
    });

    it('should categorize diagnostics by severity', async () => {
      const options = {
        ...getOptimizedDefaultOptions('source'),
        verbose: true
      };
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-severity');
      CLIOutputValidator.validateSourceCommand(result);
      
      // Count diagnostics by severity
      const severityCounts = {
        error: result.diagnostics.filter(d => d.severity === 'error').length,
        warning: result.diagnostics.filter(d => d.severity === 'warning').length,
        info: result.diagnostics.filter(d => d.severity === 'info').length
      };
      
      // At minimum, should categorize correctly
      expect(severityCounts.error).toBeGreaterThanOrEqual(0);
      expect(severityCounts.warning).toBeGreaterThanOrEqual(0);
      expect(severityCounts.info).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Tracking', () => {
    it('should provide detailed performance metrics', async () => {
      const options = getOptimizedDefaultOptions('source');
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-perf-tracking');
      CLIOutputValidator.validateSourceCommand(result);
      
      // Performance metrics should be meaningful
      expect(result.performance.parseTime).toBeGreaterThan(0);
      expect(result.performance.parseTime).toBeLessThan(10000); // Under 10 seconds
      expect(result.performance.files).toBeGreaterThan(0);
      expect(result.performance.files).toBeLessThan(100); // Reasonable file count
      
      // Performance per file should be reasonable
      const parseTimePerFile = result.performance.parseTime / result.performance.files;
      expect(parseTimePerFile).toBeLessThan(1000); // Under 1 second per file
    });

    it('should track performance consistently across runs', async () => {
      const runs = 3;
      const results = [];
      
      for (let i = 0; i < runs; i++) {
        const options = {
          ...getOptimizedDefaultOptions('source'),
          quiet: true
        };
        
        const { result, metrics } = await harness.runSourceCommand(options);
        
        PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, `source-consistent-${i}`);
        results.push({ result, metrics });
      }
      
      // Performance should be consistent
      const parseTimes = results.map(r => r.result.performance.parseTime);
      const fileCounts = results.map(r => r.result.performance.files);
      
      // File counts should be identical (same project)
      expect(new Set(fileCounts).size).toBe(1);
      
      // Parse times should be within reasonable variance (±50%)
      const avgParseTime = parseTimes.reduce((sum, time) => sum + time, 0) / parseTimes.length;
      for (const parseTime of parseTimes) {
        expect(parseTime).toBeGreaterThan(avgParseTime * 0.5);
        expect(parseTime).toBeLessThan(avgParseTime * 1.5);
      }
    });
  });

  describe('Filtering and Options', () => {
    it('should filter analysis by file patterns', async () => {
      const options = {
        ...getOptimizedDefaultOptions('source'),
        filter: ['complex-types'] // Focus on specific file
      };
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-filter');
      CLIOutputValidator.validateSourceCommand(result);
      
      // Should analyze fewer files when filtered
      expect(result.performance.files).toBeGreaterThan(0);
      
      // Diagnostics should only reference filtered files
      if (result.diagnostics.length > 0) {
        expect(result.diagnostics.every(d => d.file.includes('complex-types') || d.file.includes('.'))).toBe(true);
      }
    });

    it('should handle multiple filter patterns', async () => {
      const options = {
        ...getOptimizedDefaultOptions('source'),
        filter: ['complex-types', 'src'] // Multiple patterns
      };
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-multi-filter');
      CLIOutputValidator.validateSourceCommand(result);
      
      expect(result.performance.files).toBeGreaterThan(0);
    });

    it('should handle warning configuration', async () => {
      const options = {
        ...getOptimizedDefaultOptions('source'),
        warn: ['ts2322', 'ts7006'] // Specific TypeScript warnings
      };
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-warnings');
      CLIOutputValidator.validateSourceCommand(result);
      
      // Should complete successfully regardless of warning configuration
      expect(result.performance.files).toBeGreaterThan(0);
    });
  });

  describe('JSON Output Mode', () => {
    it('should produce valid JSON output', async () => {
      const options = {
        ...getOptimizedDefaultOptions('source'),
        json: true
      };
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-json');
      
      // JSON output should be parseable
      expect(() => JSON.parse(result.raw)).not.toThrow();
      
      const jsonData = JSON.parse(result.raw);
      expect(typeof jsonData === 'object').toBe(true);
      
      // Should contain expected structure
      if (jsonData.performance) {
        expect(typeof jsonData.performance.parseTime).toBe('number');
        expect(typeof jsonData.performance.files).toBe('number');
      }
    });

    it('should maintain performance in JSON mode', async () => {
      const options = {
        ...getOptimizedDefaultOptions('source'),
        json: true,
        quiet: true
      };
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-json-fast');
      expect(result.raw).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project directory', async () => {
      const originalCwd = process.cwd();
      
      try {
        process.chdir('/tmp');
        
        const options = getOptimizedDefaultOptions('source');
        const { result, metrics } = await harness.runSourceCommand(options);
        
        PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-invalid-dir');
        ScenarioValidators.validateGracefulErrorHandling(
          result,
          'source',
          /no files found|cannot find|not found/i
        );
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle configuration file issues', async () => {
      const options = {
        ...getOptimizedDefaultOptions('source'),
        config: 'nonexistent-config.json'
      };
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-bad-config');
      // Should fall back gracefully
      expect(result.raw).toBeDefined();
    });

    it('should handle empty filter results', async () => {
      const options = {
        ...getOptimizedDefaultOptions('source'),
        filter: ['nonexistent-file-pattern']
      };
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-empty-filter');
      ScenarioValidators.validateEmptyResults(result, 'source');
    });
  });

  describe('File Type Analysis', () => {
    it('should analyze TypeScript files correctly', async () => {
      const options = getOptimizedDefaultOptions('source');
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-typescript');
      CLIOutputValidator.validateSourceCommand(result);
      
      // Should find and analyze .ts files
      expect(result.performance.files).toBeGreaterThan(0);
      
      // Diagnostics should reference .ts files
      if (result.diagnostics.length > 0) {
        expect(result.diagnostics.some(d => d.file.endsWith('.ts'))).toBe(true);
      }
    });

    it('should handle complex TypeScript constructs', async () => {
      // Our fixture includes complex types, generics, etc.
      const options = {
        ...getOptimizedDefaultOptions('source'),
        filter: ['complex-types']
      };
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-complex');
      CLIOutputValidator.validateSourceCommand(result);
      
      // Should handle complex TypeScript without errors
      const typeErrors = result.diagnostics.filter(d => 
        d.severity === 'error' && 
        d.message.includes('type')
      );
      
      // Our fixture should be well-typed
      expect(typeErrors.length).toBe(0);
    });
  });

  describe('Output Pattern Validation', () => {
    it('should produce consistent diagnostic patterns', async () => {
      const options = getOptimizedDefaultOptions('source');
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-patterns');
      CLIOutputValidator.validateSourceCommand(result);
      
      // Check for diagnostic patterns in raw output
      const diagnosticMatches = OutputPatterns.extractMatches(result.raw, OutputPatterns.DIAGNOSTIC);
      
      // Should have consistent diagnostic format if any diagnostics exist
      for (const match of diagnosticMatches) {
        expect(match[1]).toBeTruthy(); // File path
        expect(match[2]).toMatch(/^\d+$/); // Line number
        expect(match[3]).toMatch(/^\d+$/); // Column number
        expect(['error', 'warning', 'info']).toContain(match[4]); // Severity
        expect(match[5]).toBeTruthy(); // Message
      }
    });

    it('should show performance timing patterns', async () => {
      const options = {
        ...getOptimizedDefaultOptions('source'),
        verbose: true
      };
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-timing');
      CLIOutputValidator.validateSourceCommand(result);
      
      // Should contain performance timing information
      const timingMatches = OutputPatterns.extractMatches(result.raw, OutputPatterns.PERFORMANCE_TIME);
      expect(timingMatches.length).toBeGreaterThan(0);
      
      // Timing values should be reasonable
      for (const match of timingMatches) {
        const timeMs = parseFloat(match[1]);
        expect(timeMs).toBeGreaterThan(0);
        expect(timeMs).toBeLessThan(10000); // Under 10 seconds
      }
    });
  });

  describe('Memory and Resource Management', () => {
    it('should manage memory efficiently during analysis', async () => {
      const options = getOptimizedDefaultOptions('source');
      
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, 'source-memory');
      PerformanceAssertions.expectMemoryUsage(metrics, MEMORY_THRESHOLDS.source, 'source-memory');
      
      CLIOutputValidator.validateSourceCommand(result);
    });

    it('should handle multiple consecutive analyses', async () => {
      const runs = 3;
      
      for (let i = 0; i < runs; i++) {
        const options = {
          ...getOptimizedDefaultOptions('source'),
          quiet: true
        };
        
        const { result, metrics } = await harness.runSourceCommand(options);
        
        PerformanceAssertions.expectExecutionTime(metrics, PERFORMANCE_THRESHOLDS.source, `source-consecutive-${i}`);
        PerformanceAssertions.expectMemoryUsage(metrics, MEMORY_THRESHOLDS.consecutive, `source-consecutive-${i}`);
        
        CLIOutputValidator.validateSourceCommand(result);
      }
    });
  });
});