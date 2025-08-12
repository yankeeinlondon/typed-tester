import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  EnhancedTestHarness, 
  getOptimizedDefaultOptions,
  PerformanceAssertions,
  OutputValidators
} from '../../helpers/enhanced-test-harness';
import { CLIOutputValidator, ScenarioValidators, OutputPatterns } from '../../helpers/output-validators';
import { globalPerformanceTracker } from '../../helpers/performance-tracker';
import path from 'path';

describe('Files Command - Fast Integration Tests', () => {
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

  describe('Basic File Discovery', () => {
    it('should discover files with default options', async () => {
      const options = getOptimizedDefaultOptions('files');
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      // Performance validation - file discovery should be very fast
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-default');
      PerformanceAssertions.expectMemoryUsage(metrics, 600, 'files-default');
      
      // Output validation
      CLIOutputValidator.validateGenericOutput(result, 'files');
      ScenarioValidators.validateSuccessfulExecution(result, 'files');
      
      // Files-specific validations
      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
      
      // Should find our fixture files
      expect(result.files.some(f => f.includes('.ts'))).toBe(true);
      expect(result.files.some(f => f.includes('complex-types.ts'))).toBe(true);
    });

    it('should discover TypeScript files specifically', async () => {
      const options = getOptimizedDefaultOptions('files');
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-typescript');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // Should find TypeScript files in our fixture
      const tsFiles = result.files.filter(f => f.endsWith('.ts'));
      expect(tsFiles.length).toBeGreaterThan(0);
      
      // Check for expected files from our fixture
      expect(result.files.some(f => f.includes('complex-types.ts'))).toBe(true);
    });

    it('should include test files in discovery', async () => {
      const options = getOptimizedDefaultOptions('files');
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-test-files');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // Should find test files
      const testFiles = result.files.filter(f => 
        f.includes('.test.ts') || f.includes('.spec.ts')
      );
      expect(testFiles.length).toBeGreaterThan(0);
      
      // Should find our fixture test files
      expect(result.files.some(f => f.includes('comprehensive.test.ts'))).toBe(true);
      expect(result.files.some(f => f.includes('error-cases.test.ts'))).toBe(true);
    });

    it('should handle quiet mode efficiently', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        quiet: true
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      // Quiet mode should be faster
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-quiet');
      CLIOutputValidator.validateGenericOutput(result, 'files');
    });
  });

  describe('File Filtering', () => {
    it('should filter files by pattern', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        filter: ['complex-types'] // Focus on specific file
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-filter');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // Should only find files matching the pattern
      expect(result.files.every(f => f.includes('complex-types'))).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should handle multiple filter patterns', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        filter: ['complex-types', 'comprehensive'] // Multiple patterns
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-multi-filter');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // Should find files matching either pattern
      expect(result.files.some(f => f.includes('complex-types'))).toBe(true);
      expect(result.files.some(f => f.includes('comprehensive'))).toBe(true);
    });

    it('should filter by file extension patterns', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        filter: ['.ts'] // TypeScript files only
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-extension');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // All results should be TypeScript files
      expect(result.files.every(f => f.includes('.ts'))).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should handle empty filter results gracefully', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        filter: ['nonexistent-file-pattern']
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-empty-filter');
      ScenarioValidators.validateEmptyResults(result, 'files');
      
      expect(result.files.length).toBe(0);
    });
  });

  describe('File Type Classification', () => {
    it('should identify source files', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        filter: ['src/'] // Source directory
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-source');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // Should find source files
      expect(result.files.some(f => f.includes('src/'))).toBe(true);
      expect(result.files.some(f => f.includes('complex-types.ts'))).toBe(true);
    });

    it('should identify test files', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        filter: ['tests/', '.test.', '.spec.'] // Test patterns
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-tests');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // Should find test files
      const testFiles = result.files.filter(f => 
        f.includes('tests/') || 
        f.includes('.test.') || 
        f.includes('.spec.')
      );
      expect(testFiles.length).toBeGreaterThan(0);
    });

    it('should identify configuration files', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        filter: ['tsconfig', 'package.json'] // Config files
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-config');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // Should find configuration files from our fixture
      expect(result.files.some(f => f.includes('tsconfig.json'))).toBe(true);
      expect(result.files.some(f => f.includes('package.json'))).toBe(true);
    });
  });

  describe('Output Formats', () => {
    it('should produce JSON output when requested', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        json: true
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-json');
      
      // JSON output should be parseable
      expect(() => JSON.parse(result.raw)).not.toThrow();
      
      const jsonData = JSON.parse(result.raw);
      expect(Array.isArray(jsonData) || typeof jsonData === 'object').toBe(true);
      
      // Should contain file information
      if (Array.isArray(jsonData)) {
        expect(jsonData.length).toBeGreaterThan(0);
      }
    });

    it('should maintain performance in JSON mode', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        json: true,
        quiet: true
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-json-fast');
      expect(result.raw).toBeTruthy();
    });

    it('should provide verbose file information', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        verbose: true,
        quiet: false
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-verbose');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // Verbose mode should provide more detailed output
      expect(result.raw.length).toBeGreaterThan(100);
    });
  });

  describe('File Path Handling', () => {
    it('should handle relative paths correctly', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        filter: ['./src/'] // Relative path
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-relative');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // Should handle relative paths
      expect(result.files.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide absolute or normalized paths', async () => {
      const options = getOptimizedDefaultOptions('files');
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-paths');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // File paths should be well-formed
      for (const file of result.files.slice(0, 5)) { // Check first 5
        expect(file).toBeTruthy();
        expect(typeof file).toBe('string');
        expect(file.length).toBeGreaterThan(0);
      }
    });

    it('should handle nested directory structures', async () => {
      const options = getOptimizedDefaultOptions('files');
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-nested');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // Should find files in nested directories
      expect(result.files.some(f => f.includes('src/'))).toBe(true);
      expect(result.files.some(f => f.includes('tests/'))).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid project directory', async () => {
      const originalCwd = process.cwd();
      
      try {
        process.chdir('/tmp');
        
        const options = getOptimizedDefaultOptions('files');
        const { result, metrics } = await harness.runFilesCommand(options);
        
        PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-invalid-dir');
        ScenarioValidators.validateGracefulErrorHandling(
          result,
          'files',
          /no files found|cannot find|not found/i
        );
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle configuration file issues', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        config: 'nonexistent-config.json'
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-bad-config');
      // Should fall back gracefully
      expect(result.raw).toBeDefined();
    });

    it('should handle directory permission issues gracefully', async () => {
      // This test simulates what might happen with permission issues
      const options = {
        ...getOptimizedDefaultOptions('files'),
        filter: ['/root/'] // Likely inaccessible directory
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-permissions');
      // Should handle gracefully without crashing
      expect(result.raw).toBeDefined();
    });

    it('should handle very specific filters that match nothing', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        filter: ['extremelySpecificPatternThatShouldNeverMatch123456']
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-no-match');
      ScenarioValidators.validateEmptyResults(result, 'files');
      
      expect(result.files.length).toBe(0);
    });
  });

  describe('Performance Optimization', () => {
    it('should execute multiple file discoveries efficiently', async () => {
      const runs = 3;
      const results = [];
      
      for (let i = 0; i < runs; i++) {
        const options = {
          ...getOptimizedDefaultOptions('files'),
          quiet: true
        };
        
        const { result, metrics } = await harness.runFilesCommand(options);
        
        PerformanceAssertions.expectExecutionTime(metrics, 2500, `files-run-${i}`);
        results.push({ result, metrics });
      }
      
      // File discovery should be consistently fast
      const durations = results.map(r => r.metrics.duration);
      expect(durations[1]).toBeLessThanOrEqual(durations[0] * 1.2);
      expect(durations[2]).toBeLessThanOrEqual(durations[0] * 1.2);
      
      // Results should be consistent (same project)
      const fileCounts = results.map(r => r.result.files.length);
      expect(new Set(fileCounts).size).toBe(1); // All should be the same
    });

    it('should handle large directory trees efficiently', async () => {
      // Test with no filter to scan entire project
      const options = {
        ...getOptimizedDefaultOptions('files'),
        verbose: false,
        quiet: true
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-large-scan');
      PerformanceAssertions.expectMemoryUsage(metrics, 350, 'files-large-scan');
      
      CLIOutputValidator.validateGenericOutput(result, 'files');
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should maintain performance across different filter complexities', async () => {
      const filterComplexities = [
        ['src'], // Simple filter
        ['src/', 'tests/'], // Multiple directories
        ['.ts', '.json', '.md'], // Multiple extensions
        ['complex', 'comprehensive', 'error'], // Multiple patterns
      ];
      
      for (const [index, filter] of filterComplexities.entries()) {
        const options = {
          ...getOptimizedDefaultOptions('files'),
          filter,
          quiet: true
        };
        
        const { result, metrics } = await harness.runFilesCommand(options);
        
        PerformanceAssertions.expectExecutionTime(metrics, 2500, `files-complexity-${index}`);
        expect(result.files.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Warning Configuration', () => {
    it('should handle warning configurations', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        warn: ['ts2322', 'ts2345'] // Type errors
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-warnings');
      CLIOutputValidator.validateGenericOutput(result, 'files');
    });

    it('should handle warning suppression', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        warn: [] // Suppress all warnings
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-no-warnings');
      CLIOutputValidator.validateGenericOutput(result, 'files');
    });
  });

  describe('Output Pattern Validation', () => {
    it('should produce consistent file path patterns', async () => {
      const options = getOptimizedDefaultOptions('files');
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-patterns');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // Check for file path patterns in output
      const fileMatches = OutputPatterns.extractMatches(result.raw, OutputPatterns.FILE_PATH);
      expect(fileMatches.length).toBeGreaterThan(0);
      
      // Each match should be a valid file path
      for (const match of fileMatches.slice(0, 5)) { // Check first 5
        const filePath = match[1];
        expect(filePath).toBeTruthy();
        expect(filePath.includes('.')).toBe(true); // Should have extension
      }
    });

    it('should show file counts and statistics', async () => {
      const options = {
        ...getOptimizedDefaultOptions('files'),
        verbose: true
      };
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-stats');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // Should contain file count information
      const countPattern = /(\d+)\s+(files?|found)/i;
      expect(countPattern.test(result.raw)).toBe(true);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should manage memory efficiently during file discovery', async () => {
      const options = getOptimizedDefaultOptions('files');
      
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-memory');
      PerformanceAssertions.expectMemoryUsage(metrics, 150, 'files-memory');
      
      CLIOutputValidator.validateGenericOutput(result, 'files');
    });

    it('should handle multiple consecutive discoveries', async () => {
      const runs = 3;
      
      for (let i = 0; i < runs; i++) {
        const options = {
          ...getOptimizedDefaultOptions('files'),
          quiet: true
        };
        
        const { result, metrics } = await harness.runFilesCommand(options);
        
        PerformanceAssertions.expectExecutionTime(metrics, 2500, `files-consecutive-${i}`);
        PerformanceAssertions.expectMemoryUsage(metrics, 350, `files-consecutive-${i}`);
        
        CLIOutputValidator.validateGenericOutput(result, 'files');
      }
    });
  });

  describe('Integration with Other Commands', () => {
    it('should work correctly after other commands', async () => {
      // Run symbols command first
      const symbolsOptions = getOptimizedDefaultOptions('symbols');
      await harness.runSymbolsCommand(symbolsOptions);
      
      // Then run files command
      const filesOptions = getOptimizedDefaultOptions('files');
      const { result, metrics } = await harness.runFilesCommand(filesOptions);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-after-symbols');
      CLIOutputValidator.validateGenericOutput(result, 'files');
      
      // Should work independently
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should provide consistent file lists', async () => {
      const runs = 2;
      const results = [];
      
      for (let i = 0; i < runs; i++) {
        const options = {
          ...getOptimizedDefaultOptions('files'),
          quiet: true
        };
        
        const { result, metrics } = await harness.runFilesCommand(options);
        
        PerformanceAssertions.expectExecutionTime(metrics, 2500, `files-consistent-${i}`);
        results.push(result);
      }
      
      // File lists should be identical (same project)
      expect(results[0].files.length).toBe(results[1].files.length);
      
      // Sort both arrays and compare
      const sorted1 = results[0].files.sort();
      const sorted2 = results[1].files.sort();
      expect(sorted1).toEqual(sorted2);
    });
  });
});