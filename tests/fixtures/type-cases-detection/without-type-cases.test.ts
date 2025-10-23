import { describe, it, expect } from 'vitest';

describe('Tests without type cases', () => {
    it('should be a runtime-only test', () => {
        const value = 'hello';
        expect(value).toBe('hello');
    });

    it('should also be runtime-only', () => {
        const result = 42;
        expect(result).toBe(42);
    });

    it('should be another runtime test', () => {
        const flag = true;
        expect(flag).toBe(true);
    });
});
