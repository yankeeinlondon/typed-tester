import { describe, it, expect } from 'vitest';
import chalk from 'chalk';

describe('file filtering with positional arguments', () => {
    // Mock file list for testing
    const mockFiles = [
        'src/utils/index.ts',
        'src/utils/prettyPath.ts',
        'src/commands/source.ts',
        'src/commands/test.ts',
        'test/unit/utils.test.ts',
        'test/integration/commands.test.ts',
        'modules/runtime/datetime/index.ts',
        'modules/runtime/string/index.ts'
    ];

    it('should filter files by single pattern', () => {
        const pattern = 'utils';
        const filtered = mockFiles.filter(f => f.includes(pattern));

        expect(filtered).toHaveLength(3);
        expect(filtered).toContain('src/utils/index.ts');
        expect(filtered).toContain('src/utils/prettyPath.ts');
        expect(filtered).toContain('test/unit/utils.test.ts');
    });

    it('should filter files by multiple patterns', () => {
        const patterns = ['utils', 'commands'];
        const filtered = mockFiles.filter(f =>
            patterns.some(p => f.includes(p))
        );

        expect(filtered).toHaveLength(6);
        expect(filtered).toContain('src/utils/index.ts');
        expect(filtered).toContain('src/commands/source.ts');
        expect(filtered).toContain('test/integration/commands.test.ts');
    });

    it('should handle negation patterns', () => {
        // In the actual implementation, negation would be handled by fast-glob
        // Here we simulate the logic
        const includePattern = 'runtime';
        const excludePattern = 'string'; // Would be !string in actual usage

        const filtered = mockFiles
            .filter(f => f.includes(includePattern))
            .filter(f => !f.includes(excludePattern));

        expect(filtered).toHaveLength(1);
        expect(filtered).toContain('modules/runtime/datetime/index.ts');
        expect(filtered).not.toContain('modules/runtime/string/index.ts');
    });

    it('should report excluded file counts', () => {
        const totalFiles = mockFiles.length;
        const testFiles = mockFiles.filter(f => f.includes('test')).length;
        const pattern = 'utils';
        const matchingFiles = mockFiles
            .filter(f => !f.includes('test'))
            .filter(f => f.includes(pattern));

        const nonTestFiles = totalFiles - testFiles;
        const excludedByFilter = nonTestFiles - matchingFiles.length;

        expect(testFiles).toBe(3); // Actually 3 test files in our mock data
        expect(excludedByFilter).toBe(3); // commands and runtime files
        expect(matchingFiles.length).toBe(2); // utils/index.ts and utils/prettyPath.ts
    });

    describe('file reporting', () => {
        it('should show clear file exclusion reasons', () => {
            const totalFiles = 100;
            const testFiles = 30;
            const filteredOut = 20;
            const analyzed = totalFiles - testFiles - filteredOut;

            // Simulate the improved reporting message
            const message = `Analysis will consider ${chalk.bold.yellow(analyzed)} files of ${chalk.bold(totalFiles)} typescript files
  - ${testFiles} test files were ignored
  - ${filteredOut} files were excluded because they didn't match the filter expression`;

            expect(message).toContain('Analysis will consider 50 files of 100 typescript files');
            expect(message).toContain('30 test files were ignored');
            expect(message).toContain('20 files were excluded');
        });

        it('should show filter patterns when applied', () => {
            const patterns = ['utils', 'commands', '!test'];
            const message = `filter patterns applied: ${patterns.join(', ')}`;

            expect(message).toBe('filter patterns applied: utils, commands, !test');
        });

        it('should handle no filters gracefully', () => {
            const patterns: string[] = [];
            const analyzed = 70; // after removing test files
            const testFiles = 30;
            const totalFiles = 100;

            const message = patterns.length > 0
                ? `filter patterns applied: ${patterns.join(', ')}`
                : `${totalFiles} typescript files found, analysis will consider ${analyzed} files after removing:
  - ${testFiles} test files were ignored`;

            expect(message).not.toContain('filter patterns');
            expect(message).toContain('30 test files were ignored');
        });
    });
});
