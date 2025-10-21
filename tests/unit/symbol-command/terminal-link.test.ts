import { describe, it, expect } from 'vitest';
import { createTerminalLink, supportsHyperlinks } from '~/report/terminalLink';
import { resolve } from 'node:path';

describe('createTerminalLink', () => {
    it('should create OSC 8 hyperlink with file URL', () => {
        const result = createTerminalLink('MyType', '/path/to/file.ts');

        // Should contain OSC 8 escape sequences
        expect(result).toContain('\x1b]8;;');
        expect(result).toContain('file://');
        expect(result).toContain('MyType');
    });

    it('should include line number in URL when provided', () => {
        const result = createTerminalLink('MyType', '/path/to/file.ts', 42);

        expect(result).toContain('file://');
        expect(result).toContain(':42');
    });

    it('should use absolute path', () => {
        const relativePath = 'src/types.ts';
        const result = createTerminalLink('Type', relativePath, 10);

        const absolutePath = resolve(relativePath);
        expect(result).toContain(absolutePath);
    });

    it('should preserve original text in link', () => {
        const text = 'SomeSymbol<T>';
        const result = createTerminalLink(text, '/file.ts');

        // Text should appear between escape sequences
        expect(result).toContain(text);
    });

    it('should create link without line number when not provided', () => {
        const result = createTerminalLink('MyType', '/path/to/file.ts');

        // Should NOT contain line number separator
        expect(result).not.toMatch(/:\d+/);
    });
});

describe('supportsHyperlinks', () => {
    it('should return boolean', () => {
        const result = supportsHyperlinks();
        expect(typeof result).toBe('boolean');
    });

    it('should currently always return true (placeholder)', () => {
        // Current implementation assumes support
        expect(supportsHyperlinks()).toBe(true);
    });
});
