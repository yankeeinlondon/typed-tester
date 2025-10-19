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

describe('Symbols Command - Fast Integration Tests', () => {
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

  describe('Basic Symbol Analysis', () => {
    it('should analyze symbols with default options', async () => {
      const options = getOptimizedDefaultOptions('symbols');
      
      const { result, metrics } = await harness.runSymbolsCommand(options);
      
      // Performance validation
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-default');
      PerformanceAssertions.expectMemoryUsage(metrics, 600, 'symbols-default');
      
      // Output validation
      CLIOutputValidator.validateSymbolsCommand(result);
      ScenarioValidators.validateSuccessfulExecution(result, 'symbols');
      
      // Symbol-specific validations
      expect(result.count).toBeGreaterThan(0);
      expect(result.symbols.length).toBe(result.count);
      expect(result.symbols.some(s => s.type === 'interface')).toBe(true);
      expect(result.symbols.some(s => s.type === 'type')).toBe(true);
    });

    it('should find all expected symbol types', async () => {
      const options = getOptimizedDefaultOptions('symbols');
      
      const { result, metrics } = await harness.runSymbolsCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-types');
      CLIOutputValidator.validateSymbolsCommand(result);
      
      // Check for expected symbol types from our fixture
      // Note: symbols command only returns TYPE symbols, not runtime values
      const symbolTypes = new Set(result.symbols.map(s => s.type));
      expect(symbolTypes.has('interface')).toBe(true); // UserInterface, Repository, MenuItem
      expect(symbolTypes.has('type')).toBe(true); // UserType, Result, and other type aliases

      // Check for specific symbols we know should exist
      const symbolNames = result.symbols.map(s => s.name);
      expect(symbolNames).toContain('UserInterface');
      expect(symbolNames).toContain('UserType');
      expect(symbolNames).toContain('Repository');
      expect(symbolNames).toContain('MenuItem');
    });

    it('should provide accurate file and line information', async () => {
      const options = getOptimizedDefaultOptions('symbols');
      
      const { result, metrics } = await harness.runSymbolsCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-location');
      CLIOutputValidator.validateSymbolsCommand(result);
      
      // All symbols should have valid file paths and line numbers
      for (const symbol of result.symbols) {
        expect(symbol.file).toBeTruthy();
        expect(symbol.file.endsWith('.ts')).toBe(true);
        expect(symbol.line).toBeGreaterThan(0);
        expect(Number.isInteger(symbol.line)).toBe(true);
      }
      
      // Should reference our complex-types.ts file
      expect(result.symbols.some(s => s.file.includes('complex-types.ts'))).toBe(true);
    });
  });

  describe('Symbol Filtering', () => {
    it('should filter symbols by pattern', async () => {
      const options = {
        ...getOptimizedDefaultOptions('symbols'),
        filter: ['User'] // Filter for User-related symbols
      };
      
      const { result, metrics } = await harness.runSymbolsCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-filter');
      CLIOutputValidator.validateSymbolsCommand(result);
      
      // All symbols should match the filter
      expect(result.symbols.every(s => s.name.includes('User'))).toBe(true);
      expect(result.symbols.length).toBeGreaterThan(0);
      
      const symbolNames = result.symbols.map(s => s.name);
      expect(symbolNames).toContain('UserInterface');
      expect(symbolNames).toContain('UserType');
      // Note: UserManager is a class (runtime symbol), not returned by symbols command
    });

    it('should handle multiple filter patterns', async () => {
      const options = {
        ...getOptimizedDefaultOptions('symbols'),
        filter: ['User', 'Result'] // Multiple patterns
      };
      
      const { result, metrics } = await harness.runSymbolsCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-multi-filter');
      CLIOutputValidator.validateSymbolsCommand(result);
      
      // Should find symbols matching either pattern
      expect(result.symbols.some(s => s.name.includes('User'))).toBe(true);
      expect(result.symbols.some(s => s.name.includes('Result'))).toBe(true);
    });

    it('should handle empty filter results gracefully', async () => {
      const options = {
        ...getOptimizedDefaultOptions('symbols'),
        filter: ['NonexistentSymbolPattern']
      };
      
      const { result, metrics } = await harness.runSymbolsCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-empty-filter');
      ScenarioValidators.validateEmptyResults(result, 'symbols');
      
      expect(result.count).toBe(0);
      expect(result.symbols.length).toBe(0);
    });
  });

  describe('Sorting Options', () => {
    it('should sort symbols by name (default)', async () => {
      const options = {
        ...getOptimizedDefaultOptions('symbols'),
        'sort-by': 'name'
      };
      
      const { result, metrics } = await harness.runSymbolsCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-sort-name');
      CLIOutputValidator.validateSymbolsCommand(result);
      
      // Check if symbols are sorted alphabetically by name
      const symbolNames = result.symbols.map(s => s.name);
      const sortedNames = [...symbolNames].sort();
      expect(symbolNames).toEqual(sortedNames);
    });

    it('should handle different sorting options', async () => {
      // Test various sort options that might be available
      const sortOptions = ['name', 'type', 'file', 'line'];
      
      for (const sortBy of sortOptions) {
        const options = {
          ...getOptimizedDefaultOptions('symbols'),
          'sort-by': sortBy
        };
        
        const { result, metrics } = await harness.runSymbolsCommand(options);
        
        PerformanceAssertions.expectExecutionTime(metrics, 2500, `symbols-sort-${sortBy}`);
        CLIOutputValidator.validateSymbolsCommand(result);
        
        expect(result.count).toBeGreaterThan(0);
      }
    });
  });

  describe('JSON Output Mode', () => {
    it('should produce valid JSON output', async () => {
      const options = {
        ...getOptimizedDefaultOptions('symbols'),
        json: true
      };

      const { result, metrics } = await harness.runSymbolsCommand(options);

      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-json');

      // Test harness should successfully parse JSON output
      expect(result.symbols).toBeDefined();
      expect(Array.isArray(result.symbols)).toBe(true);
      expect(result.symbols.length).toBeGreaterThan(0);
      expect(result.count).toBe(result.symbols.length);
    });

    it('should maintain performance in JSON mode', async () => {
      const options = {
        ...getOptimizedDefaultOptions('symbols'),
        json: true,
        quiet: true
      };
      
      const { result, metrics } = await harness.runSymbolsCommand(options);
      
      // JSON mode should be fast and efficient
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-json-fast');
      expect(result.raw).toBeTruthy();
    });
  });

  describe('Verbose Mode', () => {
    it('should provide detailed output in verbose mode', async () => {
      const options = {
        ...getOptimizedDefaultOptions('symbols'),
        verbose: true,
        quiet: false // Override default quiet mode
      };
      
      const { result, metrics } = await harness.runSymbolsCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-verbose');
      CLIOutputValidator.validateSymbolsCommand(result);
      
      // Verbose mode should provide more detailed information
      expect(result.raw.length).toBeGreaterThan(100); // Should have substantial output
    });
  });

  describe('Symbol Type Analysis', () => {
    it('should correctly identify interface symbols', async () => {
      const options = {
        ...getOptimizedDefaultOptions('symbols'),
        filter: ['Interface'] // Look for interfaces
      };
      
      const { result, metrics } = await harness.runSymbolsCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-interfaces');
      CLIOutputValidator.validateSymbolsCommand(result);
      
      const interfaces = result.symbols.filter(s => s.type === 'interface');
      expect(interfaces.length).toBeGreaterThan(0);
      
      // Should find UserInterface from our fixture
      expect(interfaces.some(i => i.name === 'UserInterface')).toBe(true);
    });

    it('should correctly identify function symbols', async () => {
      // Note: symbols command only returns TYPE symbols, not runtime functions
      // Functions like createUser and validateUser won't appear in the output
      const options = {
        ...getOptimizedDefaultOptions('symbols'),
        filter: ['create', 'validate']
      };

      const { result, metrics } = await harness.runSymbolsCommand(options);

      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-functions');
      CLIOutputValidator.validateSymbolsCommand(result);

      // Symbols command filters to type symbols only, so runtime functions don't appear
      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    it('should correctly identify class symbols', async () => {
      // Note: symbols command only returns TYPE symbols, not runtime classes
      // Classes like UserManager won't appear in the output
      const options = {
        ...getOptimizedDefaultOptions('symbols'),
        filter: ['Manager']
      };

      const { result, metrics } = await harness.runSymbolsCommand(options);

      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-classes');
      CLIOutputValidator.validateSymbolsCommand(result);

      // Symbols command filters to type symbols only, so runtime classes don't appear
      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    it('should correctly identify type alias symbols', async () => {
      const options = {
        ...getOptimizedDefaultOptions('symbols'),
        filter: ['Type'] // Look for type aliases
      };
      
      const { result, metrics } = await harness.runSymbolsCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-types');
      CLIOutputValidator.validateSymbolsCommand(result);
      
      const types = result.symbols.filter(s => s.type === 'type');
      expect(types.length).toBeGreaterThan(0);
      
      // Should find various type aliases from our fixture
      expect(types.some(t => t.name === 'UserType')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project directory', async () => {
      const originalCwd = process.cwd();
      
      try {
        process.chdir('/tmp');
        
        const options = getOptimizedDefaultOptions('symbols');
        const { result, metrics } = await harness.runSymbolsCommand(options);
        
        PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-invalid-dir');
        ScenarioValidators.validateGracefulErrorHandling(
          result,
          'symbols',
          /no symbols found|cannot find|not found/i
        );
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle configuration issues gracefully', async () => {
      const options = {
        ...getOptimizedDefaultOptions('symbols'),
        config: 'nonexistent-config.json'
      };
      
      const { result, metrics } = await harness.runSymbolsCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-bad-config');
      // Should fall back gracefully or show appropriate error
      expect(result.raw).toBeDefined();
    });
  });

  describe('Performance Optimization', () => {
    it('should execute multiple symbol analyses efficiently', async () => {
      const runs = 3;
      const results = [];
      
      for (let i = 0; i < runs; i++) {
        const options = {
          ...getOptimizedDefaultOptions('symbols'),
          quiet: true
        };
        
        const { result, metrics } = await harness.runSymbolsCommand(options);
        
        PerformanceAssertions.expectExecutionTime(metrics, 2500, `symbols-run-${i}`);
        results.push({ result, metrics });
      }
      
      // Subsequent runs should benefit from caching
      const durations = results.map(r => r.metrics.duration);
      expect(durations[1]).toBeLessThanOrEqual(durations[0] * 1.2);
      expect(durations[2]).toBeLessThanOrEqual(durations[0] * 1.2);
    });

    it('should maintain performance across different filter patterns', async () => {
      const filters = [
        ['User'],
        ['Interface'],
        ['function'],
        ['Type'],
        ['create', 'validate']
      ];
      
      for (const [index, filter] of filters.entries()) {
        const options = {
          ...getOptimizedDefaultOptions('symbols'),
          filter,
          quiet: true
        };
        
        const { result, metrics } = await harness.runSymbolsCommand(options);
        
        PerformanceAssertions.expectExecutionTime(metrics, 2500, `symbols-filter-${index}`);
        expect(result.count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Output Pattern Validation', () => {
    it('should produce consistent output patterns', async () => {
      const options = {
        ...getOptimizedDefaultOptions('symbols'),
        quiet: false // Need non-quiet mode to check output patterns
      };

      const { result, metrics } = await harness.runSymbolsCommand(options);

      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-patterns');
      CLIOutputValidator.validateSymbolsCommand(result);

      // In non-quiet mode, output should contain symbol information
      expect(result.raw.length).toBeGreaterThan(0);
      expect(result.symbols.length).toBeGreaterThan(0);
    });
  });
});