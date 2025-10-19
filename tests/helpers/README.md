# Test Helpers

This directory contains utilities for testing the `typed-tester` CLI application. These helpers provide specialized functionality for creating fixtures, validating output, and testing AST operations.

## Available Helpers

### 1. **FixtureManager** (`fixture-manager.ts`)

Create temporary TypeScript projects for isolated testing.

```typescript
import { FixtureManager } from '../helpers/fixture-manager';
import { afterEach, describe, it, expect } from 'vitest';

describe('My AST test', () => {
  const manager = new FixtureManager();

  afterEach(() => {
    manager.cleanup();
  });

  it('should analyze symbols', () => {
    const project = manager.createProject({
      'src/types.ts': 'export type User = { id: number; name: string; }',
      'src/index.ts': 'import type { User } from "./types";'
    });

    const sourceFiles = project.getSourceFiles();
    expect(sourceFiles).toHaveLength(2);
  });

  it('can use presets', () => {
    const project = manager.createPreset('with-types');
    // Project already has common type definitions
  });
});
```

**Presets:**

- `basic` - Simple project with utility functions
- `with-types` - Project with type definitions and imports
- `with-errors` - Project with intentional type errors
- `with-dependencies` - Project with dependency relationships

### 2. **CLI Matchers** (`cli-matchers.ts`)

Custom Vitest matchers for validating CLI output.

```typescript
import { setupCliMatchers } from '../helpers/cli-matchers';
import { describe, it, expect } from 'vitest';

setupCliMatchers(); // Call once in setup

describe('CLI output tests', () => {
  it('should validate error counts', () => {
    const output = runCommand();

    expect(output).toHaveErrorCount(5);
    expect(output).toContainSymbol('UserService');
    expect(output).toContainDiagnosticCode(2307);
    expect(output).toHaveClickableLink('https://typescript.tv/errors');
  });

  it('should validate file paths', () => {
    const output = runCommand();

    expect(output).toContainFilePath('src/index.ts');
    expect(output).toHaveCorrectPathFormatting('src/utils/helper.ts');
  });
});
```

**Available Matchers:**

- `toHaveErrorCount(n)` - Check error count in output
- `toHaveWarningCount(n)` - Check warning count
- `toContainSymbol(name)` - Verify symbol appears in output
- `toContainDiagnosticCode(code)` - Check for TypeScript error code
- `toHaveClickableLink(url)` - Validate terminal hyperlinks
- `toContainFilePath(path)` - Check file path appears
- `toHaveCorrectPathFormatting(path)` - Validate path formatting (dimmed dir, bright file)
- `toMatchCleanOutput(text)` - Match against ANSI-stripped output

### 3. **MockASTBuilder** (`mock-ast-builder.ts`)

Create mock AST objects for unit testing without full project setup.

```typescript
import { MockASTBuilder, MockSymbolPresets } from '../helpers/mock-ast-builder';
import { describe, it, expect } from 'vitest';

describe('Dependency graph tests', () => {
  const builder = new MockASTBuilder();

  it('should create mock symbols', () => {
    const symbol = builder.createSymbol({
      name: 'UserService',
      kind: 'class',
      filepath: '/src/services/user.ts'
    });

    expect(symbol.name).toBe('UserService');
    expect(symbol.kind).toBe('class');
  });

  it('should create test files with errors', () => {
    const testFile = builder.createTestFile({
      blocks: [
        builder.createTestBlock({
          diagnostics: [
            builder.createDiagnostic({ code: 2307 })
          ]
        })
      ]
    });

    expect(testFile.blocks[0].diagnostics).toHaveLength(1);
  });
});

// Use presets for common scenarios
describe('Using presets', () => {
  const presets = new MockSymbolPresets();

  it('should create user service module', () => {
    const { types, classes } = presets.createUserServiceModule();

    expect(types).toHaveLength(2);
    expect(classes).toHaveLength(1);
  });

  it('should create dependency chain', () => {
    const symbols = presets.createDependencyChain();

    expect(symbols).toHaveLength(3);
    expect(symbols[2].refs).toContainEqual(
      expect.objectContaining({ name: 'DerivedType' })
    );
  });
});
```

### 4. **CacheTestUtils** (`cache-test-utils.ts`)

Utilities for testing cache functionality.

```typescript
import { CacheTestUtils, createCacheBenchmark } from '../helpers/cache-test-utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Cache tests', () => {
  let utils: CacheTestUtils;

  beforeEach(() => {
    utils = new CacheTestUtils('/tmp/test-cache');
  });

  afterEach(() => {
    utils.deleteCacheFile();
  });

  it('should create and validate cache', () => {
    const cache = utils.createMockCache({
      symbols: [
        builder.createSymbol({ name: 'User' }),
        builder.createSymbol({ name: 'Service' })
      ],
      files: ['/src/index.ts', '/src/types.ts']
    });

    expect(utils.validateCacheStructure(cache)).toBe(true);
  });

  it('should detect file changes', () => {
    const cache = utils.createMockCache();
    utils.saveCacheFile(cache);

    // Simulate file change
    utils.simulateFileChange('/src/index.ts');

    const hash = utils.getFileHash('/tmp/test-cache/src/index.ts');
    expect(hash).toBeGreaterThan(0);
  });

  it('should benchmark cache operations', () => {
    const benchmark = createCacheBenchmark();

    benchmark.benchmark('Load cache', () => {
      const cache = utils.loadCacheFile();
    }, 10);

    const results = benchmark.getResults();
    expect(results[0].duration).toBeLessThan(100); // Should be fast
  });
});
```

### 5. **SnapshotMatcher** (`snapshot-matcher.ts`)

Snapshot testing for complex CLI output.

```typescript
import { SnapshotMatcher, matchSnapshot } from '../helpers/snapshot-matcher';
import { describe, it } from 'vitest';

describe('Snapshot tests', () => {
  it('should match CLI output snapshot', () => {
    const output = runTestCommand();

    // Automatically strips ANSI codes and normalizes output
    matchSnapshot(output, 'test-command-verbose');
  });

  it('should match with custom normalization', () => {
    const matcher = new SnapshotMatcher();

    matcher.matchOutput(output, 'custom-snapshot', {
      stripAnsi: true,
      stripLinks: true,
      normalizer: (text) => text.replace(/\d+ms/g, '<TIME>')
    });
  });
});
```

**Update snapshots:**

```bash
UPDATE_SNAPSHOTS=true npm test
```

### 6. **TestHarness** (`test-harness.ts`, `enhanced-test-harness.ts`)

Reusable TypeScript project instances for integration tests. These helpers share a single `ts-morph` Project instance across tests to dramatically improve performance.

```typescript
import { TestHarness, getDefaultOptions } from '../helpers/test-harness';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Integration tests', () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = TestHarness.getInstance();
    await harness.initialize();
  });

  afterAll(() => {
    harness.cleanup();
  });

  it('should run test command', async () => {
    const options = getDefaultOptions('test');
    const output = await harness.runTestCommand(options);

    expect(output).toContain('TEST SUMMARY');
  });
});
```

## Best Practices

### 1. **Always Clean Up**

```typescript
import { afterEach } from 'vitest';

afterEach(() => {
  manager.cleanup();
  utils.deleteCacheFile();
});
```

### 2. **Use Presets for Common Scenarios**

```typescript
// Instead of manually creating files
const project = manager.createPreset('with-dependencies');

// Instead of building mock objects
const symbols = presets.createUserServiceModule();
```

### 3. **Combine Helpers**

```typescript
describe('Complex test', () => {
  const manager = new FixtureManager();
  const builder = new MockASTBuilder();

  it('should work together', () => {
    const project = manager.createProject({
      'src/index.ts': 'export const x = 42;'
    });

    const symbol = builder.createSymbol({
      name: 'x',
      kind: 'const-function'
    });

    // Test with real project and mock data
  });
});
```

### 4. **Performance Testing**

```typescript
it('should complete in reasonable time', () => {
  const utils = new CacheTestUtils();

  const metrics = utils.measureCachePerformance(() => {
    // Your operation here
  });

  expect(metrics.duration).toBeLessThan(1000); // 1 second max
  expect(metrics.memoryDelta).toBeLessThan(50 * 1024 * 1024); // 50MB max
});
```

## Helper Development

When adding new helpers:

1. Add to this README
2. Export from `tests/helpers/index.ts` (if exists)
3. Include TypeScript type definitions
4. Provide usage examples
5. Write tests for the helper itself

## Testing the Helpers

Helpers should be tested in `tests/helpers/*.test.ts` to ensure they work correctly.

```typescript
// tests/helpers/fixture-manager.test.ts
import { FixtureManager } from './fixture-manager';

describe('FixtureManager', () => {
  it('should create temporary projects', () => {
    const manager = new FixtureManager();
    const project = manager.createProject({
      'index.ts': 'export const x = 1;'
    });

    expect(project.getSourceFiles()).toHaveLength(1);
    manager.cleanup();
  });
});
```
