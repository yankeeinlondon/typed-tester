import { describe, it, expect } from 'vitest';
import { EnhancedTestHarness, getOptimizedDefaultOptions } from './tests/helpers/enhanced-test-harness';
import path from 'path';

describe('Debug Single Test', () => {
  let harness: EnhancedTestHarness;

  it('should handle comprehensive test suite execution', async () => {
    harness = EnhancedTestHarness.getInstance();
    const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/fast-test-project');

    console.log('[DEBUG] Initializing harness at:', fixturePath);
    await harness.initialize(fixturePath);

    const options = {
      ...getOptimizedDefaultOptions('test'),
      'show-passing': true,
      'show-symbols': true
    };

    console.log('[DEBUG] Running test command with options:', JSON.stringify(options, null, 2));

    const { result, metrics } = await harness.runTestCommand(options);

    console.log('[DEBUG] Raw output length:', result.raw.length);
    console.log('[DEBUG] First 200 chars:', result.raw.substring(0, 200));
    console.log('[DEBUG] Summary:', result.summary);

    expect(result.raw.length).toBeGreaterThan(0);

    await harness.cleanup();
  });
});
