import { describe, it, expect } from 'vitest';
import { join } from 'pathe';
import { fileLink } from '~/utils/link';
import { prettyPath } from '~/utils/prettyPath';
import { relativeFile } from '~/utils/relativeFile';

describe('source command file link generation', () => {
    describe('absolute path handling', () => {
        it('should generate file links with absolute paths', () => {
            // Simulate what ts-morph returns (repo-relative path)
            const tsomorphPath = 'src/report/showDiagnostic.ts';
            
            // Simulate project root
            const projectRoot = '/Volumes/coding/personal/typed-tester';
            
            // Convert to absolute path as the fix does
            const absolutePath = tsomorphPath.startsWith('/') 
                ? tsomorphPath 
                : join(projectRoot, tsomorphPath);
            
            // This is what the source command now does
            const displayText = prettyPath(relativeFile(absolutePath));
            const link = fileLink(displayText, absolutePath);
            
            // The link should contain the absolute path
            expect(absolutePath).toBe('/Volumes/coding/personal/typed-tester/src/report/showDiagnostic.ts');
            expect(link).toContain('file://');
            expect(link).toContain(absolutePath);
            expect(link).toContain('showDiagnostic.ts'); // Display text should include filename
        });

        it('should handle already absolute paths', () => {
            // If ts-morph somehow returns an absolute path
            const tsomorphPath = '/Volumes/coding/personal/typed-tester/src/utils/index.ts';
            const projectRoot = '/Volumes/coding/personal/typed-tester';
            
            // The fix checks if path starts with '/'
            const absolutePath = tsomorphPath.startsWith('/') 
                ? tsomorphPath 
                : join(projectRoot, tsomorphPath);
            
            expect(absolutePath).toBe(tsomorphPath);
            
            const displayText = prettyPath(relativeFile(absolutePath));
            const link = fileLink(displayText, absolutePath);
            
            expect(link).toContain('file://');
            expect(link).toContain(absolutePath);
        });

        it('should handle Windows-style paths', () => {
            // Simulate Windows path from ts-morph
            const tsomorphPath = 'src\\report\\showDiagnostic.ts';
            const projectRoot = 'C:\\Users\\dev\\typed-tester';
            
            // join from pathe should handle this correctly
            const absolutePath = tsomorphPath.match(/^[A-Z]:/) 
                ? tsomorphPath 
                : join(projectRoot, tsomorphPath);
            
            // pathe normalizes paths to use forward slashes
            expect(absolutePath).toContain('C:/Users/dev/typed-tester');
            expect(absolutePath).toContain('showDiagnostic.ts');
        });
    });

    describe('display text formatting', () => {
        it('should use relative path for display while keeping absolute path for link', () => {
            const absolutePath = '/Volumes/coding/personal/typed-tester/src/commands/source.ts';
            const projectRoot = '/Volumes/coding/personal/typed-tester';
            
            // Mock relativeFile behavior
            const relativePath = absolutePath.replace(projectRoot + '/', '');
            expect(relativePath).toBe('src/commands/source.ts');
            
            // prettyPath formats the display
            const displayText = prettyPath(relativePath);
            
            // Display should show relative path with formatting
            expect(displayText).toContain('source.ts');
            expect(displayText).not.toContain('/Volumes/coding');
            
            // But the link itself should use absolute path
            const link = fileLink(displayText, absolutePath);
            expect(link).toContain(absolutePath);
        });
    });
});