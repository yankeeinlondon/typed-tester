import { describe, it, expect } from 'vitest';
import { filterTestFilesByPattern } from '~/utils/testing';

describe('filterTestFilesByPattern', () => {
  it('should handle negative filters correctly', () => {
    const files = [
      '/project/src/index.ts',
      '/project/src/utils.ts',
      '/project/src/examples/foo.ts',
      '/project/src/examples/bar.ts',
      '/project/src/components/baz.ts'
    ];
    
    // Test negative filter: exclude files containing "examples"
    const result1 = filterTestFilesByPattern(files, ['!examples']);
    expect(result1).toEqual([
      '/project/src/index.ts',
      '/project/src/utils.ts',
      '/project/src/components/baz.ts'
    ]);
    
    // Test positive filter: include only files containing "examples"
    const result2 = filterTestFilesByPattern(files, ['examples']);
    expect(result2).toEqual([
      '/project/src/examples/foo.ts',
      '/project/src/examples/bar.ts'
    ]);
    
    // Test mixed filters: include files containing "src" but exclude those with "examples"
    const result3 = filterTestFilesByPattern(files, ['src', '!examples']);
    expect(result3).toEqual([
      '/project/src/index.ts',
      '/project/src/utils.ts',
      '/project/src/components/baz.ts'
    ]);
  });
  
  it('should handle only negative filters correctly', () => {
    const files = [
      '/project/src/index.ts',
      '/project/src/examples/foo.ts',
      '/project/src/examples/bar.ts',
      '/project/src/components/baz.ts'
    ];
    
    // When only negative filters are provided, it should start with all files
    // and then exclude those matching the negative patterns
    const result = filterTestFilesByPattern(files, ['!examples']);
    expect(result).toEqual([
      '/project/src/index.ts',
      '/project/src/components/baz.ts'
    ]);
    
    // Test with multiple negative filters
    const result2 = filterTestFilesByPattern(files, ['!examples', '!components']);
    expect(result2).toEqual([
      '/project/src/index.ts'
    ]);
  });
});