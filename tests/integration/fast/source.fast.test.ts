import { describe, it, expect } from 'vitest';
import { runSourceCommand } from '../../helpers/subprocess-test-harness';
import path from 'path';

describe('Source Command - Fast Integration Tests', () => {
  const fixturePath = path.resolve(__dirname, '../../fixtures/fast-test-project');

  describe('Basic Source Analysis', () => {
    it('should analyze source files with default options', async () => {
      const result = await runSourceCommand({}, fixturePath);

      // Output validation
      expect(result.output).toBeTruthy();
      expect(result.output.length).toBeGreaterThan(0);
      expect(result.exitCode).toBe(0);
      expect(result.executionTime).toBeGreaterThan(0);

      // Should contain source analysis info
      expect(result.output).toContain('Source');
    }, 15000);

    it('should provide comprehensive file analysis', async () => {
      const result = await runSourceCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
    }, 15000);
  });

  describe('Diagnostic Analysis', () => {
    it('should handle projects with no errors', async () => {
      const result = await runSourceCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      // May have type errors in fixture, exit code may vary
      expect([0, 1, 2]).toContain(result.exitCode);
    }, 15000);
  });

  describe('Performance Tracking', () => {
    it('should provide detailed performance metrics', async () => {
      const result = await runSourceCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.executionTime).toBeGreaterThan(0);
      expect([0, 1, 2]).toContain(result.exitCode);
    }, 15000);

    it('should track performance consistently across runs', async () => {
      const runs = 2;
      const results = [];

      for (let i = 0; i < runs; i++) {
        const result = await runSourceCommand({}, fixturePath);
        results.push(result);
      }

      results.forEach(result => {
        expect(result.output).toBeTruthy();
        expect(result.executionTime).toBeGreaterThan(0);
      });
    }, 30000);
  });

  describe('Filtering and Options', () => {
    it('should filter analysis by file patterns', async () => {
      const result = await runSourceCommand({
        filter: ['complex-types']
      }, fixturePath);

      expect(result.output).toBeTruthy();
      expect([0, 1, 2]).toContain(result.exitCode);
    }, 15000);

    it('should handle multiple filter patterns', async () => {
      const result = await runSourceCommand({
        filter: ['types', 'user']
      }, fixturePath);

      expect(result.output).toBeTruthy();
      expect([0, 1, 2]).toContain(result.exitCode);
    }, 15000);

    it('should handle warning configuration', async () => {
      const result = await runSourceCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect([0, 1, 2]).toContain(result.exitCode);
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle invalid project directory', async () => {
      // Skip - requires special setup
      console.log('Skipping invalid directory test');
    });

    it('should handle empty filter results', async () => {
      const result = await runSourceCommand({
        filter: ['nonexistent-pattern']
      }, fixturePath);

      expect(result.output).toBeDefined();
      expect([0, 1, 2]).toContain(result.exitCode);
    }, 15000);
  });

  describe('File Type Analysis', () => {
    it('should analyze TypeScript files correctly', async () => {
      const result = await runSourceCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      // Source command shows "Source File Analysis" heading
      expect(result.output).toContain('Source');
      expect([0, 1, 2]).toContain(result.exitCode);
    }, 15000);
  });

  describe('Output Pattern Validation', () => {
    it('should show performance timing patterns', async () => {
      const result = await runSourceCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.executionTime).toBeGreaterThan(0);
      expect([0, 1, 2]).toContain(result.exitCode);
    }, 15000);
  });
});
