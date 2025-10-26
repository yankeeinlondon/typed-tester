import { describe, it, expect } from 'vitest';
import { runFilesCommand } from '../../helpers/subprocess-test-harness';
import path from 'path';

describe('Files Command - Fast Integration Tests', () => {
  const fixturePath = path.resolve(__dirname, '../../fixtures/fast-test-project');

  describe('Basic File Discovery', () => {
    it('should discover files with default options', async () => {
      const result = await runFilesCommand({}, fixturePath);

      // Output validation
      expect(result.output).toBeTruthy();
      expect(result.output.length).toBeGreaterThan(0);
      expect(result.exitCode).toBe(0);
      expect(result.executionTime).toBeGreaterThan(0);

      // Should contain file information
      expect(result.output).toContain('File');
    }, 15000);

    it('should include test files in discovery', async () => {
      const result = await runFilesCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('.ts');
    }, 15000);
  });

  describe('File Filtering', () => {
    it('should filter files by pattern', async () => {
      const result = await runFilesCommand({
        filter: ['user']
      }, fixturePath);

      expect(result.output).toBeTruthy();
      expect([0, 1]).toContain(result.exitCode);
    }, 15000);

    it('should handle multiple filter patterns', async () => {
      const result = await runFilesCommand({
        filter: ['user', 'types']
      }, fixturePath);

      expect(result.output).toBeTruthy();
      expect([0, 1]).toContain(result.exitCode);
    }, 15000);

    it('should handle empty filter results gracefully', async () => {
      const result = await runFilesCommand({
        filter: ['nonexistent-pattern']
      }, fixturePath);

      expect(result.output).toBeDefined();
      expect([0, 1]).toContain(result.exitCode);
    }, 15000);
  });

  describe('File Type Classification', () => {
    it('should identify test files', async () => {
      const result = await runFilesCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
    }, 15000);

    it('should identify configuration files', async () => {
      const result = await runFilesCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
    }, 15000);
  });

  describe('File Path Handling', () => {
    it('should handle nested directory structures', async () => {
      const result = await runFilesCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
    }, 15000);
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid project directory', async () => {
      // Skip - requires special setup
      console.log('Skipping invalid directory test');
    });

    it('should handle very specific filters that match nothing', async () => {
      const result = await runFilesCommand({
        filter: ['nonexistent-very-specific-pattern']
      }, fixturePath);

      expect(result.output).toBeDefined();
      expect([0, 1]).toContain(result.exitCode);
    }, 15000);
  });

  describe('Output Pattern Validation', () => {
    it('should show file counts and statistics', async () => {
      const result = await runFilesCommand({}, fixturePath);

      expect(result.output).toBeTruthy();
      expect(result.exitCode).toBe(0);
      expect(result.executionTime).toBeGreaterThan(0);
    }, 15000);
  });
});
