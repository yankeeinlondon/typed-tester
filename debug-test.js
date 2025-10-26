#!/usr/bin/env node
/**
 * Debug script to test console capture mechanism
 */

async function testConsoleCapture() {
  let captured = '';
  const originalLog = console.log;
  const originalError = console.error;

  // Set up capture just like the test harness does
  console.log = (...args) => {
    const message = args.join(' ');
    captured += message + '\n';
    originalLog('[LOG CAPTURED]', message.substring(0, 60));
  };

  console.error = (...args) => {
    const message = args.join(' ');
    captured += message + '\n';
    originalError('[ERROR CAPTURED]', message.substring(0, 60));
  };

  // Simulate what test_command does
  console.error('- configuration for project\'s tests found in tsconfig.json');
  console.error('- there are 4 test files across the project');

  const testData = [{test: 'data', foo: 'bar'}];
  console.log(JSON.stringify(testData));

  // Restore
  console.log = originalLog;
  console.error = originalError;

  console.log('\n=== RESULTS ===');
  console.log('Captured length:', captured.length);
  console.log('Captured has content:', captured.trim().length > 0);
  console.log('First 200 chars:', captured.substring(0, 200));
}

testConsoleCapture();
