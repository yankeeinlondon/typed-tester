import { describe, it, expect, vi } from 'vitest';
import type { SymbolMeta } from '~/types';

// We'll need to export these functions from symbols.ts for testing
import { filterSymbols, matchesFilter } from '~/commands/symbols';

describe('matchesFilter', () => {
    describe('quoted tokens (literal match)', () => {
        it('should match exact symbol name with double quotes', () => {
            expect(matchesFilter('StripLeading', '"StripLeading"', false)).toBe(true);
        });

        it('should match exact symbol name with single quotes', () => {
            expect(matchesFilter('StripLeading', "'StripLeading'", false)).toBe(true);
        });

        it('should NOT match partial when quoted', () => {
            expect(matchesFilter('StripLeadingLast', '"StripLeading"', false)).toBe(false);
            expect(matchesFilter('MaybeStripLeading', '"StripLeading"', false)).toBe(false);
        });

        it('should be case-sensitive for quoted tokens', () => {
            expect(matchesFilter('stripLeading', '"StripLeading"', false)).toBe(false);
            expect(matchesFilter('StripLeading', '"stripLeading"', false)).toBe(false);
        });
    });

    describe('unquoted tokens (substring match)', () => {
        it('should match substring case-insensitively by default', () => {
            expect(matchesFilter('StripLeading', 'strip', false)).toBe(true);
            expect(matchesFilter('stripLeading', 'strip', false)).toBe(true);
            expect(matchesFilter('MaybeStripLeading', 'strip', false)).toBe(true);
        });

        it('should match substring case-sensitively when flag is set', () => {
            expect(matchesFilter('stripLeading', 'strip', true)).toBe(true);
            expect(matchesFilter('StripLeading', 'strip', true)).toBe(false);
        });

        it('should match anywhere in the string', () => {
            expect(matchesFilter('MaybeStripLeadingLast', 'Leading', false)).toBe(true);
            expect(matchesFilter('TestUserService', 'user', false)).toBe(true);
        });
    });
});

describe('filterSymbols', () => {
    const mockSymbols: SymbolMeta[] = [
        {
            name: 'UserType',
            isTypeSymbol: true,
            isFunction: false,
            isVariable: false,
            kind: 'type-defn',
        } as SymbolMeta,
        {
            name: 'userService',
            isTypeSymbol: false,
            isFunction: true,
            isVariable: false,
            kind: 'const-function',
        } as SymbolMeta,
        {
            name: 'UserClass',
            isTypeSymbol: false,
            isFunction: false,
            isVariable: false,
            kind: 'class',
        } as SymbolMeta,
        {
            name: 'getUserData',
            isTypeSymbol: false,
            isFunction: true,
            isVariable: false,
            kind: 'function',
        } as SymbolMeta,
    ];

    describe('runtime/types filtering', () => {
        it('should filter to only runtime symbols with --runtime flag', () => {
            const result = filterSymbols(mockSymbols, {
                filters: [],
                caseSensitive: false,
                runtime: true,
            });

            expect(result.length).toBe(3); // userService, UserClass, getUserData
            expect(result.every(s => !s.isTypeSymbol)).toBe(true);
        });

        it('should filter to only type symbols with --types flag', () => {
            const result = filterSymbols(mockSymbols, {
                filters: [],
                caseSensitive: false,
                types: true,
            });

            expect(result.length).toBe(1); // UserType
            expect(result.every(s => s.isTypeSymbol)).toBe(true);
        });

        it('should show all symbols when both flags are set (with warning)', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

            const result = filterSymbols(mockSymbols, {
                filters: [],
                caseSensitive: false,
                runtime: true,
                types: true,
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Cannot use both --runtime and --types')
            );
            expect(result.length).toBe(mockSymbols.length);

            consoleSpy.mockRestore();
        });
    });

    describe('name filtering', () => {
        it('should filter with unquoted substring (case-insensitive)', () => {
            const result = filterSymbols(mockSymbols, {
                filters: ['user'],
                caseSensitive: false,
            });

            expect(result.length).toBe(4); // UserType, userService, UserClass, getUserData
        });

        it('should filter with quoted exact match', () => {
            const result = filterSymbols(mockSymbols, {
                filters: ['"UserType"'],
                caseSensitive: false,
            });

            expect(result.length).toBe(1);
            expect(result[0].name).toBe('UserType');
        });

        it('should support multiple filters (OR logic)', () => {
            const result = filterSymbols(mockSymbols, {
                filters: ['"UserType"', 'service'],
                caseSensitive: false,
            });

            expect(result.length).toBe(2); // UserType, userService
        });
    });
});
