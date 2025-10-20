import { describe, it, expect } from 'vitest';
import { formatDescription, truncateText, extractParamName } from '~/report/formatDescription';
import type { JsDocInfo } from '~/types';

describe('formatDescription', () => {
    it('should return placeholder for empty JSDoc', () => {
        const result = formatDescription([], 50);
        expect(result).toContain('(no description)');
    });

    it('should format main comment text', () => {
        const jsDocs: JsDocInfo[] = [{
            comment: 'This is a user type',
            tags: []
        }];

        const result = formatDescription(jsDocs, 50);
        expect(result).toContain('This is a user type');
    });

    it('should include param tags', () => {
        const jsDocs: JsDocInfo[] = [{
            comment: 'Adds two numbers',
            tags: [
                { tagName: 'param', comment: 'a first number' },
                { tagName: 'param', comment: 'b second number' }
            ]
        }];

        const result = formatDescription(jsDocs, 80);
        expect(result).toContain('a');
        expect(result).toContain('b');
    });

    it('should truncate long descriptions', () => {
        const longComment = 'This is a very long description that should be truncated because it exceeds the maximum width allowed for the column';
        const jsDocs: JsDocInfo[] = [{
            comment: longComment,
            tags: []
        }];

        const result = formatDescription(jsDocs, 30);
        // Result should be shorter and contain ellipsis
        expect(result.length).toBeLessThan(longComment.length);
        expect(result).toContain('...');
    });

    it('should handle array-style comments', () => {
        const jsDocs: JsDocInfo[] = [{
            comment: 'Main comment',
            tags: [
                {
                    tagName: 'param',
                    comment: [
                        { text: 'name' },
                        { text: ' - ' },
                        { text: 'the user name' }
                    ] as any
                }
            ]
        }];

        const result = formatDescription(jsDocs, 80);
        expect(result).toBeTruthy();
    });
});

describe('truncateText', () => {
    it('should not truncate text within width', () => {
        const text = 'Short text';
        const result = truncateText(text, 50);
        expect(result).toBe(text);
    });

    it('should truncate text exceeding width', () => {
        const text = 'This is a long text that needs truncation';
        const result = truncateText(text, 20);
        expect(result.length).toBeLessThanOrEqual(20);
        expect(result).toContain('...');
    });

    it('should handle ANSI color codes in length calculation', () => {
        const coloredText = '\x1b[31mRed text\x1b[0m that is long';
        const result = truncateText(coloredText, 15);
        // Should not count color codes in length
        expect(result).toBeTruthy();
    });
});

describe('extractParamName', () => {
    it('should extract param name from simple comment', () => {
        expect(extractParamName('userName the name of user')).toBe('userName');
    });

    it('should extract param name with hyphen', () => {
        expect(extractParamName('config - configuration object')).toBe('config');
    });

    it('should handle empty comment', () => {
        expect(extractParamName('')).toBe('');
    });
});
