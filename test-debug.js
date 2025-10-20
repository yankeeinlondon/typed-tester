import { test_command } from './bin/typed.js';
import { projectUsing, resetProjectCache } from './bin/typed.js';

// Reset and change to fixture directory
process.chdir('./tests/fixtures/fast-test-project');
resetProjectCache();

const opt = {
  json: true,
  quiet: false,
  verbose: false,
  warn: [],
  'show-passing': false,
  'ignore-outside': true,
  clear: false,
  files: false,
  slow: false,
  'only-errors': false,
  'show-symbols': false
};

console.log('=== CALLING test_command ===');
await test_command(opt, []);
console.log('=== DONE ===');
