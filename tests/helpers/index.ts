/**
 * Test Helper Utilities
 *
 * Centralized exports for all test helper utilities.
 */

// Fixture Management
export {
  FixtureManager,
  createFixtureManager
} from './fixture-manager';

// CLI Output Matchers
export {
  setupCliMatchers,
  stripAnsiCodes,
  stripHyperlinks,
  cleanCliOutput,
  extractErrorCount,
  extractWarningCount,
  containsSymbol,
  containsDiagnosticCode,
  containsClickableLink,
  extractFilePaths,
  hasCorrectPathFormatting
} from './cli-matchers';

// Mock AST Builders
export {
  MockASTBuilder,
  MockSymbolPresets,
  createMockBuilder,
  createMockPresets
} from './mock-ast-builder';

// Cache Test Utilities
export {
  CacheTestUtils,
  CachePerformanceBenchmark,
  createCacheUtils,
  createCacheBenchmark
} from './cache-test-utils';

// Snapshot Testing
export {
  SnapshotMatcher,
  createSnapshotMatcher,
  matchSnapshot
} from './snapshot-matcher';

// Test Harness (existing)
export {
  TestHarness,
  getDefaultOptions
} from './test-harness';

export {
  EnhancedTestHarness,
  getOptimizedDefaultOptions,
  PerformanceAssertions,
  OutputValidators
} from './enhanced-test-harness';

// Performance Tracker (existing)
export type { PerformanceMetrics } from './enhanced-test-harness';
