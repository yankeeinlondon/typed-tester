import { describe, it, expect } from 'vitest';
import { join, resolve } from 'pathe';
import { fileLink } from '~/utils/link';
import { prettyPath } from '~/utils/prettyPath';
import { relativeFile } from '~/utils/relativeFile';

describe('source command file link generation', () => {
    describe('absolute path handling', () => {
        it('should generate file links with absolute paths', () => {
            // Use the actual project root
            const projectRoot = resolve(process.cwd());

            // Simulate what ts-morph returns (repo-relative path) - use a file that actually exists
            const tsMorphPath = 'src/utils/link.ts';

            // Convert to absolute path as the fix does
            const absolutePath = tsMorphPath.startsWith('/')
                ? tsMorphPath
                : join(projectRoot, tsMorphPath);

            // This is what the source command now does
            const displayText = prettyPath(relativeFile(absolutePath));
            const link = fileLink(displayText, absolutePath);

            // The link should contain the absolute path
            expect(absolutePath).toContain('src/utils/link.ts');
            expect(link).toContain('file://');
            expect(link).toContain(absolutePath);
            expect(link).toContain('link.ts'); // Display text should include filename
        });

        it('should handle already absolute paths', () => {
            // Use the actual project root
            const projectRoot = resolve(process.cwd());

            // If ts-morph somehow returns an absolute path - use a file that exists
            const tsMorphPath = join(projectRoot, 'src/utils/index.ts');

            // The fix checks if path starts with '/'
            const absolutePath = tsMorphPath.startsWith('/')
                ? tsMorphPath
                : join(projectRoot, tsMorphPath);

            expect(absolutePath).toBe(tsMorphPath);

            const displayText = prettyPath(relativeFile(absolutePath));
            const link = fileLink(displayText, absolutePath);

            expect(link).toContain('file://');
            expect(link).toContain(absolutePath);
        });

        it('should handle Windows-style paths', () => {
            // Simulate Windows path from ts-morph
            const tsMorphPath = 'src\\report\\showDiagnostic.ts';
            const projectRoot = 'C:\\Users\\dev\\typed-tester';
            
            // join from pathe should handle this correctly
            const absolutePath = tsMorphPath.match(/^[A-Z]:/) 
                ? tsMorphPath 
                : join(projectRoot, tsMorphPath);
            
            // pathe normalizes paths to use forward slashes
            expect(absolutePath).toContain('C:/Users/dev/typed-tester');
            expect(absolutePath).toContain('showDiagnostic.ts');
        });
    });

    describe('display text formatting', () => {
        it('should use relative path for display while keeping absolute path for link', () => {
            // Use the actual project root
            const projectRoot = resolve(process.cwd());
            const absolutePath = join(projectRoot, 'src/commands/source.ts');

            // Mock relativeFile behavior
            const relativePath = absolutePath.replace(projectRoot + '/', '');
            expect(relativePath).toBe('src/commands/source.ts');

            // prettyPath formats the display
            const displayText = prettyPath(relativePath);

            // Display should show relative path with formatting
            expect(displayText).toContain('source.ts');
            expect(displayText).not.toContain(projectRoot);

            // But the link itself should use absolute path
            const link = fileLink(displayText, absolutePath);
            expect(link).toContain(absolutePath);
        });
    });
});
