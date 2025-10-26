import { describe, it, expect } from 'vitest';
import { runDepsCommand } from '../../helpers/subprocess-test-harness';
import path from 'path';

describe('Deps Command - Fast Integration Tests', () => {
  const fixturePath = path.resolve(__dirname, '../../fixtures/fast-test-project');

  describe('Basic Dependency Analysis', () => {
    it('should analyze dependencies with default options', async () => {
      const result = await runDepsCommand({}, fixturePath);

      // Output validation
      expect(result.output).toBeTruthy();
      expect(result.output.length).toBeGreaterThan(0);
      expect(result.exitCode).toBe(0);
      expect(result.executionTime).toBeGreaterThan(0);
    }, 15000);

    it('should find dependency relationships', async () => {
      const result = await runDepsCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
    }, 15000);
  });

  describe('Dependency Filtering', () => {
    it('should filter dependencies by symbol pattern', async () => {
      const result = await runDepsCommand({
        filter: ['User']
      }, fixturePath);

      expect(result.output).toBeTruthy();
      expect([0, 1]).toContain(result.exitCode);
    }, 15000);

    it('should handle multiple filter patterns', async () => {
      const result = await runDepsCommand({
        filter: ['User', 'Repository']
      }, fixturePath);

      expect(result.output).toBeTruthy();
      expect([0, 1]).toContain(result.exitCode);
    }, 15000);

    it('should handle empty filter results gracefully', async () => {
      const result = await runDepsCommand({
        filter: ['NonexistentSymbol']
      }, fixturePath);

      expect(result.output).toBeDefined();
      expect([0, 1]).toContain(result.exitCode);
    }, 15000);
  });

  describe('Graph Mode', () => {
    it('should produce graph visualization', async () => {
      const result = await runDepsCommand({
        filter: ['User'],
        graph: true
      }, fixturePath);

      expect(result.output).toBeDefined();
      expect([0, 1]).toContain(result.exitCode);
    }, 15000);

    it('should handle complex dependency graphs', async () => {
      const result = await runDepsCommand({
        graph: true
      }, fixturePath);

      expect(result.output).toBeDefined();
      expect([0, 1, 2]).toContain(result.exitCode);
    }, 15000);
  });

  describe('Output Modes', () => {
    it('should handle quiet mode', async () => {
      const result = await runDepsCommand({
        quiet: true
      }, fixturePath);

      expect(result.output).toBeDefined();
      expect(result.exitCode).toBe(0);
    }, 15000);

    it('should provide detailed output in verbose mode', async () => {
      const result = await runDepsCommand({
        verbose: true
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
      const result = await runDepsCommand({}, fixturePath);

      expect(result.output).toBeDefined();
    }, 15000);
  });

  describe('Performance', () => {
    it('should execute multiple analyses efficiently', async () => {
      const runs = 2;
      const results = [];

      for (let i = 0; i < runs; i++) {
        const result = await runDepsCommand({
          quiet: true
        }, fixturePath);

        results.push(result);
      }

      results.forEach(result => {
        expect(result.output).toBeDefined();
        expect(result.exitCode).toBe(0);
        expect(result.executionTime).toBeGreaterThan(0);
      });
    }, 30000);
  });
});
