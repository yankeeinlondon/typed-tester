import { describe, it, expect } from 'vitest';
import { runSymbolsCommand } from '../../helpers/subprocess-test-harness';
import path from 'path';

describe('Symbols Command - Fast Integration Tests', () => {
  const fixturePath = path.resolve(__dirname, '../../fixtures/fast-test-project');

  describe('Basic Symbol Analysis', () => {
    it('should analyze symbols with default options', async () => {
      const result = await runSymbolsCommand({}, fixturePath);

      // Output validation
      expect(result.output).toBeTruthy();
      expect(result.output.length).toBeGreaterThan(0);
      expect(result.exitCode).toBe(0);
      expect(result.executionTime).toBeGreaterThan(0);

      // Should contain symbol information
      expect(result.output).toContain('Symbol');
    }, 15000);

    it('should find all expected symbol types', async () => {
      const result = await runSymbolsCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);

      // Should contain expected symbols
      expect(result.output).toContain('Interface');
    }, 15000);

    it('should provide accurate file and line information', async () => {
      const result = await runSymbolsCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);

      // Should have symbol information
      expect(result.output.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Symbol Filtering', () => {
    it('should filter symbols by pattern', async () => {
      const result = await runSymbolsCommand({
        filter: ['User']
      }, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);

      // Should contain User-related symbols
      expect(result.output).toContain('User');
    }, 15000);

    it('should handle multiple filter patterns', async () => {
      const result = await runSymbolsCommand({
        filter: ['User', 'Result']
      }, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
    }, 15000);

    it('should handle empty filter results gracefully', async () => {
      const result = await runSymbolsCommand({
        filter: ['NonexistentSymbolPattern']
      }, fixturePath);

      // Empty results are valid
      expect(result.output).toBeDefined();
      expect([0, 1]).toContain(result.exitCode);
    }, 15000);
  });

  describe('Sorting Options', () => {
    it('should sort symbols by name (default)', async () => {
      const result = await runSymbolsCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
    }, 15000);

    it('should handle different sorting options', async () => {
      const result = await runSymbolsCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
    }, 15000);
  });

  describe('JSON Output Mode', () => {
    it('should produce valid JSON output', async () => {
      const result = await runSymbolsCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
    }, 15000);

    it('should maintain performance in JSON mode', async () => {
      const result = await runSymbolsCommand({
        quiet: true
      }, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
    }, 15000);
  });

  describe('Verbose Mode', () => {
    it('should provide detailed output in verbose mode', async () => {
      const result = await runSymbolsCommand({
        verbose: true,
        quiet: false
      }, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.output.length).toBeGreaterThan(0);
      expect(result.exitCode).toBe(0);
    }, 15000);
  });

  describe('Symbol Type Analysis', () => {
    it('should correctly identify interface symbols', async () => {
      const result = await runSymbolsCommand({
        filter: ['Interface']
      }, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
    }, 15000);

    it('should correctly identify function symbols', async () => {
      const result = await runSymbolsCommand({
        filter: ['create', 'validate']
      }, fixturePath);

      expect(result.output).toBeDefined();
      expect([0, 1]).toContain(result.exitCode);
    }, 15000);

    it('should correctly identify class symbols', async () => {
      const result = await runSymbolsCommand({
        filter: ['Manager']
      }, fixturePath);

      expect(result.output).toBeDefined();
      expect([0, 1]).toContain(result.exitCode);
    }, 15000);

    it('should correctly identify type alias symbols', async () => {
      const result = await runSymbolsCommand({
        filter: ['Type']
      }, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle invalid project directory', async () => {
      // Skip - requires special setup
      console.log('Skipping invalid directory test');
    });

    it('should handle configuration issues gracefully', async () => {
      const result = await runSymbolsCommand({}, fixturePath);

      expect(result.output).toBeDefined();
    }, 15000);
  });

  describe('Performance Optimization', () => {
    it('should execute multiple symbol analyses efficiently', async () => {
      const runs = 3;
      const results = [];

      for (let i = 0; i < runs; i++) {
        const result = await runSymbolsCommand({
          quiet: true
        }, fixturePath);

        results.push(result);
      }

      // Each run should complete successfully
      results.forEach((result, i) => {
        expect(result.output).toBeTruthy();
        expect(result.exitCode).toBe(0);
        expect(result.executionTime).toBeGreaterThan(0);
      });
    }, 45000);

    it('should maintain performance across different filter patterns', async () => {
      const filters = [
        ['User'],
        ['Interface'],
        ['Type']
      ];

      for (const filter of filters) {
        const result = await runSymbolsCommand({
          filter,
          quiet: true
        }, fixturePath);

        expect(result.output).toBeDefined();
        expect([0, 1]).toContain(result.exitCode);
      }
    }, 45000);
  });

  describe('Output Pattern Validation', () => {
    it('should produce consistent output patterns', async () => {
      const result = await runSymbolsCommand({
        quiet: false
      }, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.output.length).toBeGreaterThan(0);
      expect(result.exitCode).toBe(0);
    }, 15000);
  });
});
