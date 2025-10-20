import { describe, it, expect } from 'vitest';
import { prettyPath } from '~/utils/prettyPath';
import { diagnosticLookup } from '~/utils/diagnosticLookup';
import chalk from 'chalk';

describe('verbose mode output', () => {
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
