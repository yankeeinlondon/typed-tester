import { describe, it, expect, afterEach } from 'vitest';
import {
  FixtureManager,
  MockASTBuilder,
  CacheTestUtils,
  SnapshotMatcher,
  setupCliMatchers,
  extractErrorCount,
  stripAnsiCodes
} from './index';

describe('Test Helpers Validation', () => {
  describe('FixtureManager', () => {
    const manager = new FixtureManager();

    afterEach(() => {
      manager.cleanup();
    });

    it('should create temporary projects', () => {
      const project = manager.createProject({
        'index.ts': 'export const x = 1;'
      });

      expect(project).toBeDefined();
      expect(project.getSourceFiles()).toHaveLength(1);
    });

    it('should create presets', () => {
      const project = manager.createPreset('basic');

      expect(project).toBeDefined();
      expect(project.getSourceFiles().length).toBeGreaterThan(0);
    });
  });

  describe('MockASTBuilder', () => {
    const builder = new MockASTBuilder();

    it('should create mock symbols', () => {
      const symbol = builder.createSymbol({
        name: 'TestSymbol',
        kind: 'type-defn'
      });

      expect(symbol.name).toBe('TestSymbol');
      expect(symbol.kind).toBe('type-defn');
      expect(symbol.fqn).toContain('TestSymbol');
    });

    it('should create mock diagnostics', () => {
      const diagnostic = builder.createDiagnostic({
        code: 2307,
        msg: 'Cannot find module'
      });

      expect(diagnostic.code).toBe(2307);
      expect(diagnostic.msg).toBe('Cannot find module');
    });

    it('should create test files', () => {
      const testFile = builder.createTestFile({
        filepath: '/tests/example.test.ts'
      });

      expect(testFile.filepath).toBe('/tests/example.test.ts');
      expect(testFile.blocks).toHaveLength(1);
    });
  });

  describe('CacheTestUtils', () => {
    const utils = new CacheTestUtils();

    afterEach(() => {
      utils.deleteCacheFile();
    });

    it('should create mock caches', () => {
      const builder = new MockASTBuilder();
      const cache = utils.createMockCache({
        symbols: [
          builder.createSymbol({ name: 'User' }),
          builder.createSymbol({ name: 'Service' })
        ]
      });

      expect(cache.graph.nodes.size).toBe(2);
      expect(utils.validateCacheStructure(cache)).toBe(true);
    });

    it('should measure performance', () => {
      const metrics = utils.measureCachePerformance(() => {
        // Simple operation
        const arr = Array(1000).fill(0);
        arr.forEach(x => x + 1);
      });

      expect(metrics.duration).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryDelta).toBeDefined();
    });
  });

  describe('CLI Matchers', () => {
    it('should extract error counts', () => {
      const output1 = '5 errors found in the project';
      const output2 = '3 of 10 tests had errors';
      const output3 = 'No errors!';

      expect(extractErrorCount(output1)).toBe(5);
      expect(extractErrorCount(output2)).toBe(3);
      expect(extractErrorCount(output3)).toBe(0);
    });

    it('should strip ANSI codes', () => {
      const colored = '\x1b[31mRed text\x1b[0m';
      const stripped = stripAnsiCodes(colored);

      expect(stripped).toBe('Red text');
    });

    it('should detect symbols in output', () => {
      setupCliMatchers();

      const output = 'Found symbols: UserService, DatabaseConnection';

      expect(output).toContainSymbol('UserService');
      expect(output).toContainSymbol('DatabaseConnection');
    });
  });

  describe('SnapshotMatcher', () => {
    const matcher = new SnapshotMatcher();

    it('should create instance', () => {
      expect(matcher).toBeDefined();
      expect(matcher.isUpdateMode()).toBe(false);
    });

    it('should normalize output', () => {
      const input = 'Line 1  \r\nLine 2  \r\n  Line 3  ';
      const normalized = matcher.normalizeOutput(input);

      expect(normalized).not.toContain('\r');
      expect(normalized.split('\n').every(line => !line.endsWith(' '))).toBe(true);
    });
  });
});
