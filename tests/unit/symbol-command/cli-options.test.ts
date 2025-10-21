import { describe, it, expect } from 'vitest';
import { command_options } from '~/cli/options';

describe('symbols command options', () => {
    it('should include runtime flag option', () => {
        const symbolsOptions = command_options.symbols;
        const runtimeOpt = symbolsOptions.find(opt => opt.name === 'runtime');

        expect(runtimeOpt).toBeDefined();
        expect(runtimeOpt?.type).toBe(Boolean);
        expect((runtimeOpt as any)?.alias).toBe('r');
    });

    it('should include types flag option', () => {
        const symbolsOptions = command_options.symbols;
        const typesOpt = symbolsOptions.find(opt => opt.name === 'types');

        expect(typesOpt).toBeDefined();
        expect(typesOpt?.type).toBe(Boolean);
        expect((typesOpt as any)?.alias).toBe('t');
    });

    it('should include case-sensitive flag option', () => {
        const symbolsOptions = command_options.symbols;
        const caseSensitiveOpt = symbolsOptions.find(opt => opt.name === 'case-sensitive');

        expect(caseSensitiveOpt).toBeDefined();
        expect(caseSensitiveOpt?.type).toBe(Boolean);
        expect((caseSensitiveOpt as any)?.alias).toBe('s');
    });

    it('should NOT include deprecated filter option', () => {
        const symbolsOptions = command_options.symbols;
        const filterOpt = symbolsOptions.find(opt => opt.name === 'filter');

        expect(filterOpt).toBeUndefined();
    });

    it('should still include clear flag option', () => {
        const symbolsOptions = command_options.symbols;
        const clearOpt = symbolsOptions.find(opt => opt.name === 'clear');

        expect(clearOpt).toBeDefined();
        expect(clearOpt?.type).toBe(Boolean);
    });
});
