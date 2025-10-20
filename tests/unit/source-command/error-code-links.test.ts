import { describe, it, expect } from 'vitest';
import { tsCodeLink } from '~/utils/link';
import { diagnosticLookup } from '~/utils/diagnosticLookup';

describe('error code links', () => {
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

    it('should work with various error codes', () => {
        const codes = [2307, 2339, 2344, 2322];

        for (const code of codes) {
            const link = tsCodeLink(code);
            expect(link).toContain(String(code));
            expect(link).toContain(`https://typescript.tv/errors/#ts${code}`);
        }
    });
});
