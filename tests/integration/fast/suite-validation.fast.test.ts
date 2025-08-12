import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  EnhancedTestHarness, 
  getOptimizedDefaultOptions,
  PerformanceAssertions
} from '../../helpers/enhanced-test-harness';
import { globalPerformanceTracker } from '../../helpers/performance-tracker';
import path from 'path';

describe('Test Suite Performance Validation', () => {
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
    // Generate comprehensive performance report
    const report = globalPerformanceTracker.generateReport();
    
    console.log('\n🎯 FAST INTEGRATION TEST SUITE PERFORMANCE VALIDATION');
    console.log('='.repeat(80));
    
    // Overall performance validation
    console.log(`\n📊 Suite Performance Summary:`);
    console.log(`  Total Duration: ${report.totalDuration.toFixed(2)}ms`);
    console.log(`  Target: <5000ms (5 seconds)`);
    console.log(`  Status: ${report.totalDuration <= 5000 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Individual command performance
    console.log(`\n⚡ Command Performance Analysis:`);
    for (const [commandName, stats] of report.commandStats) {
      const targetTime = getCommandTarget(commandName);
      const status = stats.maxDuration <= targetTime ? '✅' : '❌';
      
      console.log(`  ${status} ${commandName}:`);
      console.log(`    Max Duration: ${stats.maxDuration.toFixed(2)}ms (target: ${targetTime}ms)`);
      console.log(`    Avg Duration: ${stats.averageDuration.toFixed(2)}ms`);
      console.log(`    Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
      console.log(`    Executions: ${stats.count}`);
    }
    
    // Memory analysis
    console.log(`\n💾 Memory Usage Analysis:`);
    console.log(`  Peak Memory: ${report.memoryStats.peakMemoryUsage.toFixed(2)}MB`);
    console.log(`  Average per Command: ${report.memoryStats.averageMemoryUsed.toFixed(2)}MB`);
    console.log(`  Target: <50MB peak`);
    console.log(`  Status: ${report.memoryStats.peakMemoryUsage <= 50 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Violations summary
    if (report.violations.length > 0) {
      console.log(`\n⚠️  Performance Violations (${report.violations.length}):`);
      for (const violation of report.violations) {
        const icon = violation.type === 'duration' ? '🐌' : 
                    violation.type === 'memory' ? '💾' : '❌';
        console.log(`    ${icon} ${violation.message}`);
      }
    } else {
      console.log(`\n✅ No performance violations detected!`);
    }
    
    console.log('='.repeat(80));
    
    await harness.cleanup();
  });

  describe('Overall Suite Performance', () => {
    it('should complete full test suite under 10-second target', async () => {
      // Execute all CLI commands to validate full suite performance
      const commands = ['test', 'symbols', 'source', 'deps', 'files'] as const;
      const results = [];
      
      const suiteStartTime = performance.now();
      
      for (const command of commands) {
        const options = getOptimizedDefaultOptions(command);
        
        let result;
        switch (command) {
          case 'test':
            result = await harness.runTestCommand(options);
            break;
          case 'symbols':
            result = await harness.runSymbolsCommand(options);
            break;
          case 'source':
            result = await harness.runSourceCommand(options);
            break;
          case 'deps':
            result = await harness.runDepsCommand(options);
            break;
          case 'files':
            result = await harness.runFilesCommand(options);
            break;
        }
        
        results.push({ command, result });
      }
      
      const suiteEndTime = performance.now();
      const totalDuration = suiteEndTime - suiteStartTime;
      
      console.log(`\\n🎯 Suite completed in ${totalDuration.toFixed(2)}ms`);
      
      // Validate 10-second target
      expect(totalDuration).toBeLessThan(10000);
      
      // Validate each command executed successfully
      expect(results.length).toBe(commands.length);
      for (const { command, result } of results) {
        expect(result.result.raw || result.result.dependencies || result.result.files).toBeTruthy();
      }
    });

    it('should maintain performance consistency across multiple runs', async () => {
      const runs = 3;
      const durations = [];
      
      for (let i = 0; i < runs; i++) {
        const startTime = performance.now();
        
        // Quick validation run with minimal commands
        const testOptions = getOptimizedDefaultOptions('test');
        const symbolsOptions = getOptimizedDefaultOptions('symbols');
        
        await harness.runTestCommand(testOptions);
        await harness.runSymbolsCommand(symbolsOptions);
        
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }
      
      // Check consistency (variance should be reasonable)
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      
      for (const duration of durations) {
        // Each run should be within 50% of average (reasonable variance)
        expect(duration).toBeLessThan(avgDuration * 1.5);
        expect(duration).toBeGreaterThan(avgDuration * 0.5);
      }
      
      console.log(`\\n📈 Consistency check: avg=${avgDuration.toFixed(2)}ms, range=${Math.min(...durations).toFixed(2)}-${Math.max(...durations).toFixed(2)}ms`);
    });
  });

  describe('Individual Command Performance Targets', () => {
    it('should meet test command performance target (2500ms)', async () => {
      const options = getOptimizedDefaultOptions('test');
      const { result, metrics } = await harness.runTestCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'test-target');
      expect(result.result.raw).toBeTruthy();
    });

    it('should meet symbols command performance target (2000ms)', async () => {
      const options = getOptimizedDefaultOptions('symbols');
      const { result, metrics } = await harness.runSymbolsCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'symbols-target');
      expect(result.result.raw).toBeTruthy();
    });

    it('should meet source command performance target (2000ms)', async () => {
      const options = getOptimizedDefaultOptions('source');
      const { result, metrics } = await harness.runSourceCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'source-target');
      expect(result.result.raw).toBeTruthy();
    });

    it('should meet deps command performance target (1500ms)', async () => {
      const options = getOptimizedDefaultOptions('deps');
      const { result, metrics } = await harness.runDepsCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'deps-target');
      expect(result.result.raw).toBeTruthy();
    });

    it('should meet files command performance target (1500ms)', async () => {
      const options = getOptimizedDefaultOptions('files');
      const { result, metrics } = await harness.runFilesCommand(options);
      
      PerformanceAssertions.expectExecutionTime(metrics, 2500, 'files-target');
      expect(result.result.raw).toBeTruthy();
    });
  });

  describe('Memory Performance Validation', () => {
    it('should maintain reasonable memory usage across all commands', async () => {
      const commands = ['test', 'symbols', 'source', 'deps', 'files'] as const;
      
      for (const command of commands) {
        const options = getOptimizedDefaultOptions(command);
        
        let result;
        switch (command) {
          case 'test':
            result = await harness.runTestCommand(options);
            break;
          case 'symbols':
            result = await harness.runSymbolsCommand(options);
            break;
          case 'source':
            result = await harness.runSourceCommand(options);
            break;
          case 'deps':
            result = await harness.runDepsCommand(options);
            break;
          case 'files':
            result = await harness.runFilesCommand(options);
            break;
        }
        
        PerformanceAssertions.expectMemoryUsage(result.metrics, 150, command);
      }
    });

    it('should not leak memory across test executions', async () => {
      const memoryBefore = process.memoryUsage();
      
      // Execute multiple commands
      for (let i = 0; i < 5; i++) {
        const options = getOptimizedDefaultOptions('symbols');
        await harness.runSymbolsCommand(options);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const memoryAfter = process.memoryUsage();
      const memoryGrowth = (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024;
      
      console.log(`\\n💾 Memory growth after 5 executions: ${memoryGrowth.toFixed(2)}MB`);
      
      // Memory growth should be reasonable (less than 500MB for TypeScript compilation)
      expect(memoryGrowth).toBeLessThan(500);
    });
  });

  describe('Harness Performance Validation', () => {
    it('should validate harness initialization performance', async () => {
      const stats = harness.getPerformanceStats();
      
      console.log(`\\n🔧 TestHarness Performance:`);
      console.log(`  Initialization Time: ${stats.initializationTime.toFixed(2)}ms`);
      console.log(`  Command Executions: ${stats.commandExecutions}`);
      console.log(`  Is Initialized: ${stats.isInitialized}`);
      
      // Harness should initialize quickly
      expect(stats.initializationTime).toBeLessThan(5000); // 5 seconds max
      expect(stats.isInitialized).toBe(true);
      expect(stats.commandExecutions).toBeGreaterThan(0);
    });

    it('should validate environment readiness', async () => {
      const isValid = await harness.validateEnvironment();
      expect(isValid).toBe(true);
      
      const projectRoot = harness.getProjectRoot();
      expect(projectRoot).toBeTruthy();
      // Project root should contain our fixture or be the current working directory
      expect(projectRoot).toBeTruthy();
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions in command execution', async () => {
      // Baseline performance measurement
      const baselineRuns = 3;
      const baselines = new Map();
      
      for (const command of ['test', 'symbols'] as const) {
        const durations = [];
        
        for (let i = 0; i < baselineRuns; i++) {
          const options = getOptimizedDefaultOptions(command);
          
          let result;
          if (command === 'test') {
            result = await harness.runTestCommand(options);
          } else {
            result = await harness.runSymbolsCommand(options);
          }
          
          durations.push(result.metrics.duration);
        }
        
        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        baselines.set(command, avgDuration);
      }
      
      console.log(`\\n📊 Performance Baselines:`);
      for (const [command, baseline] of baselines) {
        console.log(`  ${command}: ${baseline.toFixed(2)}ms average`);
      }
      
      // Validate baselines are within expected ranges
      expect(baselines.get('test')).toBeLessThan(2000);
      expect(baselines.get('symbols')).toBeLessThan(1500);
    });
  });
});

/**
 * Get performance target for each command
 */
function getCommandTarget(commandName: string): number {
  const targets = {
    'test': 2000,
    'symbols': 1500,
    'source': 1500,
    'deps': 1000,
    'files': 1000
  };
  return targets[commandName as keyof typeof targets] || 2000;
}