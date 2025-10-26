import { EnhancedTestHarness, getOptimizedDefaultOptions } from './tests/helpers/enhanced-test-harness';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function debugTest() {
  const harness = EnhancedTestHarness.getInstance();
  const fixturePath = path.resolve(__dirname, 'tests/fixtures/fast-test-project');

  console.log('Initializing harness...');
  await harness.initialize(fixturePath);

  if (!harness.isAvailable()) {
    throw new Error('Harness failed to initialize');
  }

  console.log('Running test command with show-passing and show-symbols...');
  const options = {
    ...getOptimizedDefaultOptions('test'),
    'show-passing': true,
    'show-symbols': true
  };

  console.log('Options:', JSON.stringify(options, null, 2));

  try {
    const { result, metrics } = await harness.runTestCommand(options);

    console.log('\n=== RESULTS ===');
    console.log('Raw output length:', result.raw.length);
    console.log('Raw output has content:', result.raw.trim().length > 0);
    console.log('First 200 chars of raw:', result.raw.substring(0, 200));
    console.log('Summary:', result.summary);
    console.log('Files count:', result.files.length);
    console.log('Symbols count:', result.symbols.length);
    console.log('Duration:', metrics.duration);
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  }

  await harness.cleanup();
}

debugTest();
