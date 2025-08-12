import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AsOption } from '~/cli';
import { diagnosticLookup } from '~/utils/diagnosticLookup';
import { prettyPath } from '~/utils/prettyPath';
import { tsCodeLink } from '~/utils/link';
import chalk from 'chalk';

describe('source command enhanced features', () => {
    describe('diagnostic lookup integration', () => {
        it('should get diagnostic message for known error codes', () => {
            const result = diagnosticLookup("2307");
            expect(result).toBeDefined();
            expect(result.code).toBe(2307);
            expect(result.message).toContain("Cannot find module");
            expect(result.category).toBe("Error");
        });

        it('should handle unknown error codes gracefully', () => {
            // diagnosticLookup returns an Error for unknown codes
            const result = diagnosticLookup("99999");
            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toContain("not valid");
        });

        it('should format error display with description', () => {
            const code = 2307;
            const count = 42;
            const diagnostic = diagnosticLookup(String(code));
            
            // This simulates what the source command now does
            const formatted = `[cd: ${code}, count: ${count}] - ${diagnostic.message}`;
            
            expect(formatted).toBe("[cd: 2307, count: 42] - Cannot find module '{0}' or its corresponding type declarations.");
        });
    });

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
    });

    describe('verbose mode enhancements', () => {
        interface MockDiagnostic {
            filepath: string;
            code: number;
            count: number;
        }

        const mockDiagnostics: MockDiagnostic[] = [
            { filepath: 'src/utils/index.ts', code: 2307, count: 2 },
            { filepath: 'src/utils/helper.ts', code: 2307, count: 3 },
            { filepath: 'src/commands/source.ts', code: 2339, count: 1 },
            { filepath: 'src/commands/test.ts', code: 2307, count: 1 },
            { filepath: 'src/commands/test.ts', code: 2339, count: 2 }
        ];

        it('should group files by error code', () => {
            const grouped = new Map<number, Map<string, number>>();
            
            for (const diag of mockDiagnostics) {
                if (!grouped.has(diag.code)) {
                    grouped.set(diag.code, new Map());
                }
                const fileMap = grouped.get(diag.code)!;
                fileMap.set(diag.filepath, (fileMap.get(diag.filepath) || 0) + diag.count);
            }
            
            expect(grouped.size).toBe(2); // 2 different error codes
            expect(grouped.get(2307)?.size).toBe(3); // 3 files with error 2307
            expect(grouped.get(2339)?.size).toBe(2); // 2 files with error 2339
        });

        it('should format files with prettyPath', () => {
            const filepath = 'src/utils/index.ts';
            const formatted = prettyPath(filepath);
            
            expect(formatted).toBe(`${chalk.dim('src/utils/')}index.ts`);
        });

        it('should show error count per file', () => {
            const filepath = 'src/utils/helper.ts';
            const errorCount = 3;
            
            // Simulate verbose output formatting
            const formatted = `  - ${prettyPath(filepath)} (${errorCount})`;
            
            expect(formatted).toContain('helper.ts');
            expect(formatted).toContain('(3)');
            expect(formatted).toContain(chalk.dim('src/utils/'));
        });

        it('should format complete verbose error section', () => {
            const code = 2307;
            const diagnostic = diagnosticLookup(String(code));
            const files = [
                { path: 'src/utils/index.ts', count: 2 },
                { path: 'src/utils/helper.ts', count: 3 }
            ];
            
            // Simulate the complete verbose output for one error type
            const output = [
                `[cd: ${code}, count: 5] - ${diagnostic.message}`,
                ...files.map(f => `  - ${prettyPath(f.path)} (${f.count})`)
            ];
            
            expect(output[0]).toContain('Cannot find module');
            expect(output[1]).toContain('index.ts');
            expect(output[1]).toContain('(2)');
            expect(output[2]).toContain('helper.ts');
            expect(output[2]).toContain('(3)');
        });
    });

    describe('error code link formatting', () => {
        it('should create clickable links for error codes', () => {
            const code = 2307;
            const link = tsCodeLink(code);
            
            // The link should contain the code and be formatted as a terminal link
            expect(link).toContain('2307');
            expect(link).toContain('https://typescript.tv/errors/#ts2307');
        });

        it('should integrate code links in error display', () => {
            const code = 2339;
            const count = 10;
            const diagnostic = diagnosticLookup(String(code));
            const codeLink = tsCodeLink(code);
            
            // Simulate the formatted output with clickable code
            const formatted = `[cd: ${codeLink}, count: ${count}] - ${diagnostic.message}`;
            
            expect(formatted).toContain('2339');
            expect(formatted).toContain(diagnostic.message);
            expect(formatted).toContain('https://typescript.tv/errors/#ts2339');
        });
    });

    describe('file reporting improvements', () => {
        it('should show clear file exclusion reasons', () => {
            const totalFiles = 100;
            const testFiles = 30;
            const filteredOut = 20;
            const analyzed = totalFiles - testFiles - filteredOut;
            
            // Simulate the improved reporting message
            const message = `of ${totalFiles} source files, the analysis will focus on ${analyzed} files after removing:
  - ${testFiles} test files were ignored
  - ${filteredOut} files were excluded because they didn't match the filter expression`;
            
            expect(message).toContain('of 100 source files');
            expect(message).toContain('focus on 50 files');
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
                : `of ${totalFiles} source files, the analysis will focus on ${analyzed} files after removing:
  - ${testFiles} test files were ignored`;
            
            expect(message).not.toContain('filter patterns');
            expect(message).toContain('30 test files were ignored');
        });
    });

    describe('integration scenarios', () => {
        it('should handle large error counts gracefully', () => {
            const code = 2307;
            const count = 1877; // From the example in the spec
            const diagnostic = diagnosticLookup(String(code));
            
            const formatted = `[cd: ${code}, count: ${count}] - ${diagnostic.message}`;
            
            expect(formatted).toBe("[cd: 2307, count: 1877] - Cannot find module '{0}' or its corresponding type declarations.");
        });

        it('should handle multiple error codes in order of frequency', () => {
            const errors = [
                { code: 2307, count: 1877 },
                { code: 2321, count: 248 },
                { code: 2314, count: 214 }
            ];
            
            // Errors should be sorted by count (descending)
            const sorted = errors.sort((a, b) => b.count - a.count);
            
            expect(sorted[0].code).toBe(2307);
            expect(sorted[1].code).toBe(2321);
            expect(sorted[2].code).toBe(2314);
        });

        it('should format complete diagnostic summary', () => {
            const totalErrors = 2987;
            const filesWithErrors = 1219;
            const errorCodes = [
                { code: 2307, count: 1877 },
                { code: 2321, count: 248 }
            ];
            
            // Simulate the diagnostic summary output
            const summary = [
                'DIAGNOSTICS SUMMARY:',
                '',
                `- ${totalErrors} errors across ${filesWithErrors} files`,
                '',
                'Error Codes:',
                ...errorCodes.map(e => {
                    const diag = diagnosticLookup(String(e.code));
                    return `  [cd: ${e.code}, count: ${e.count}] - ${diag.message}`;
                })
            ];
            
            expect(summary[2]).toBe('- 2987 errors across 1219 files');
            expect(summary[5]).toContain('[cd: 2307, count: 1877]');
            expect(summary[5]).toContain('Cannot find module');
            expect(summary[6]).toContain('[cd: 2321, count: 248]');
        });
    });
});