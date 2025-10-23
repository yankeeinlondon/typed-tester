import { describe, it, expect } from 'vitest';
import type { Expect, AssertEqual } from 'inferred-types/types';

describe('Tests with mixed cases', () => {
    it('runtime test only', () => {
        const value = 'hello';
        expect(value).toBe('hello');
    });

    it('with 2 type assertions', () => {
        const str = 'world';
        const num = 42;

        expect(str).toBe('world');

        type cases = [
            Expect<AssertEqual<typeof str, string>>,
            Expect<AssertEqual<typeof num, number>>
        ];
    });

    it('another runtime test only', () => {
        const result = true;
        expect(result).toBe(true);
    });

    it('with 4 type assertions', () => {
        const a = 1;
        const b = 'two';
        const c = true;
        const d = null;

        type cases = [
            Expect<AssertEqual<typeof a, number>>,
            Expect<AssertEqual<typeof b, string>>,
            Expect<AssertEqual<typeof c, boolean>>,
            Expect<AssertEqual<typeof d, null>>
        ];
    });
});
