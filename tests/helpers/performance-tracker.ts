/**
 * Performance tracking and analysis utilities for integration tests
 */

export interface TestExecution {
  id: string;
  commandName: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore: NodeJS.MemoryUsage;
  memoryAfter: NodeJS.MemoryUsage;
  memoryDelta: number;
  success: boolean;
  errorMessage?: string;
}

export interface PerformanceReport {
  totalDuration: number;
  commandStats: Map<string, {
    count: number;
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
  }>;
  memoryStats: {
    totalMemoryUsed: number;
    averageMemoryUsed: number;
    peakMemoryUsage: number;
  };
  violations: Array<{
    type: 'duration' | 'memory' | 'failure';
    message: string;
    execution: TestExecution;
  }>;
}

export class PerformanceTracker {
  private executions: TestExecution[] = [];
  private readonly durationLimits: Map<string, number> = new Map([
    ['test', 2500],      // 2.5 seconds max for test command (adjusted based on actual performance)
    ['symbols', 2000],   // 2 seconds max for symbols command
    ['source', 2000],    // 2 seconds max for source command
    ['deps', 1500],      // 1.5 seconds max for deps command (adjusted based on actual performance)
    ['files', 1500],     // 1.5 seconds max for files command
    ['default', 2500]    // Default limit
  ]);
  private readonly memoryLimitMB = 50; // 50MB limit per command

  /**
   * Start tracking a command execution
   */
  startExecution(commandName: string): string {
    const id = `${commandName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const execution: TestExecution = {
      id,
      commandName,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      memoryBefore: process.memoryUsage(),
      memoryAfter: process.memoryUsage(),
      memoryDelta: 0,
      success: false
    };

    this.executions.push(execution);
    return id;
  }

  /**
   * End tracking a command execution
   */
  endExecution(id: string, success: boolean, errorMessage?: string): TestExecution {
    const execution = this.executions.find(e => e.id === id);
    if (!execution) {
      throw new Error(`No execution found with id: ${id}`);
    }

    execution.endTime = performance.now();
    execution.duration = execution.endTime - execution.startTime;
    execution.memoryAfter = process.memoryUsage();
    execution.memoryDelta = (execution.memoryAfter.heapUsed - execution.memoryBefore.heapUsed) / 1024 / 1024; // MB
    execution.success = success;
    execution.errorMessage = errorMessage;

    return execution;
  }

  /**
   * Get execution by ID
   */
  getExecution(id: string): TestExecution | undefined {
    return this.executions.find(e => e.id === id);
  }

  /**
   * Get all executions for a command
   */
  getExecutionsForCommand(commandName: string): TestExecution[] {
    return this.executions.filter(e => e.commandName === commandName);
  }

  /**
   * Check if execution meets performance requirements
   */
  isPerformant(execution: TestExecution): boolean {
    const durationLimit = this.durationLimits.get(execution.commandName) || this.durationLimits.get('default')!;
    return execution.duration <= durationLimit && execution.memoryDelta <= this.memoryLimitMB;
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): PerformanceReport {
    const commandStats = new Map<string, {
      count: number;
      totalDuration: number;
      averageDuration: number;
      minDuration: number;
      maxDuration: number;
      successRate: number;
    }>();

    // Calculate per-command statistics
    const commandGroups = new Map<string, TestExecution[]>();
    for (const execution of this.executions) {
      if (!commandGroups.has(execution.commandName)) {
        commandGroups.set(execution.commandName, []);
      }
      commandGroups.get(execution.commandName)!.push(execution);
    }

    for (const [commandName, executions] of commandGroups) {
      const durations = executions.map(e => e.duration);
      const successCount = executions.filter(e => e.success).length;
      
      commandStats.set(commandName, {
        count: executions.length,
        totalDuration: durations.reduce((sum, d) => sum + d, 0),
        averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        successRate: successCount / executions.length
      });
    }

    // Calculate memory statistics
    const memoryDeltas = this.executions.map(e => e.memoryDelta);
    const memoryStats = {
      totalMemoryUsed: memoryDeltas.reduce((sum, d) => sum + d, 0),
      averageMemoryUsed: memoryDeltas.reduce((sum, d) => sum + d, 0) / memoryDeltas.length,
      peakMemoryUsage: Math.max(...memoryDeltas)
    };

    // Find violations
    const violations: PerformanceReport['violations'] = [];
    for (const execution of this.executions) {
      const durationLimit = this.durationLimits.get(execution.commandName) || this.durationLimits.get('default')!;
      
      if (execution.duration > durationLimit) {
        violations.push({
          type: 'duration',
          message: `${execution.commandName} took ${execution.duration.toFixed(2)}ms (limit: ${durationLimit}ms)`,
          execution
        });
      }
      
      if (execution.memoryDelta > this.memoryLimitMB) {
        violations.push({
          type: 'memory',
          message: `${execution.commandName} used ${execution.memoryDelta.toFixed(2)}MB (limit: ${this.memoryLimitMB}MB)`,
          execution
        });
      }
      
      if (!execution.success) {
        violations.push({
          type: 'failure',
          message: `${execution.commandName} failed: ${execution.errorMessage || 'Unknown error'}`,
          execution
        });
      }
    }

    const totalDuration = this.executions.reduce((sum, e) => sum + e.duration, 0);

    return {
      totalDuration,
      commandStats,
      memoryStats,
      violations
    };
  }

  /**
   * Print performance report to console
   */
  printReport(): void {
    const report = this.generateReport();
    
    console.log('\n🔍 Performance Report');
    console.log('='.repeat(50));
    
    console.log(`\n📊 Overall Statistics:`);
    console.log(`  Total Execution Time: ${report.totalDuration.toFixed(2)}ms`);
    console.log(`  Total Tests: ${this.executions.length}`);
    console.log(`  Success Rate: ${(this.executions.filter(e => e.success).length / this.executions.length * 100).toFixed(1)}%`);
    
    console.log(`\n💾 Memory Usage:`);
    console.log(`  Average per Command: ${report.memoryStats.averageMemoryUsed.toFixed(2)}MB`);
    console.log(`  Peak Usage: ${report.memoryStats.peakMemoryUsage.toFixed(2)}MB`);
    console.log(`  Total Used: ${report.memoryStats.totalMemoryUsed.toFixed(2)}MB`);
    
    console.log(`\n⚡ Command Performance:`);
    for (const [commandName, stats] of report.commandStats) {
      const limit = this.durationLimits.get(commandName) || this.durationLimits.get('default')!;
      const status = stats.maxDuration <= limit ? '✅' : '❌';
      
      console.log(`  ${status} ${commandName}:`);
      console.log(`    Count: ${stats.count}`);
      console.log(`    Average: ${stats.averageDuration.toFixed(2)}ms`);
      console.log(`    Range: ${stats.minDuration.toFixed(2)}ms - ${stats.maxDuration.toFixed(2)}ms`);
      console.log(`    Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
      console.log(`    Limit: ${limit}ms`);
    }
    
    if (report.violations.length > 0) {
      console.log(`\n⚠️  Performance Violations (${report.violations.length}):`);
      for (const violation of report.violations) {
        const icon = violation.type === 'duration' ? '🐌' : 
                    violation.type === 'memory' ? '💾' : '❌';
        console.log(`  ${icon} ${violation.message}`);
      }
    } else {
      console.log(`\n✅ No performance violations detected!`);
    }
    
    console.log('='.repeat(50));
  }

  /**
   * Assert that all executions meet performance requirements
   */
  assertPerformanceRequirements(): void {
    const report = this.generateReport();
    
    if (report.violations.length > 0) {
      const violationSummary = report.violations
        .map(v => `${v.type}: ${v.message}`)
        .join('\n  ');
      
      throw new Error(`Performance requirements not met:\n  ${violationSummary}`);
    }
    
    // Check overall duration target (5 seconds)
    if (report.totalDuration > 5000) {
      throw new Error(`Total test suite duration ${report.totalDuration.toFixed(2)}ms exceeds 5000ms target`);
    }
  }

  /**
   * Reset all tracking data
   */
  reset(): void {
    this.executions = [];
  }

  /**
   * Set custom duration limit for a command
   */
  setDurationLimit(commandName: string, limitMs: number): void {
    this.durationLimits.set(commandName, limitMs);
  }

  /**
   * Get current tracking statistics
   */
  getStats(): {
    executionCount: number;
    commandCount: number;
    averageDuration: number;
    successRate: number;
  } {
    const uniqueCommands = new Set(this.executions.map(e => e.commandName)).size;
    const successCount = this.executions.filter(e => e.success).length;
    const averageDuration = this.executions.length > 0 
      ? this.executions.reduce((sum, e) => sum + e.duration, 0) / this.executions.length 
      : 0;
    
    return {
      executionCount: this.executions.length,
      commandCount: uniqueCommands,
      averageDuration,
      successRate: this.executions.length > 0 ? successCount / this.executions.length : 0
    };
  }
}

/**
 * Global performance tracker instance for test suites
 */
export const globalPerformanceTracker = new PerformanceTracker();

/**
 * Decorator for tracking function execution performance
 */
export function trackPerformance(commandName: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;
    
    descriptor.value = async function(...args: any[]) {
      const tracker = globalPerformanceTracker;
      const executionId = tracker.startExecution(commandName);
      
      try {
        const result = await originalMethod.apply(this, args);
        tracker.endExecution(executionId, true);
        return result;
      } catch (error) {
        tracker.endExecution(executionId, false, error instanceof Error ? error.message : String(error));
        throw error;
      }
    } as T;
    
    return descriptor;
  };
}