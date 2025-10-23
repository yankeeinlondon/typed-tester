import { describe, it, expect } from 'vitest';
import type { Expect, AssertEqual } from 'inferred-types/types';

describe('Tests with type cases', () => {
    it('should have 3 type assertions', () => {
        const value1 = 'hello';
        const value2 = 42;
        const value3 = true;

        expect(value1).toBe('hello');

        type cases = [
            Expect<AssertEqual<typeof value1, string>>,
            Expect<AssertEqual<typeof value2, number>>,
            Expect<AssertEqual<typeof value3, boolean>>
        ];
    });

    it('should have 1 type assertion', () => {
        const result = 'world';
        expect(result).toBe('world');

        type cases = [
            Expect<AssertEqual<typeof result, string>>
        ];
    });

    it('should have 5 type assertions', () => {
        const a = 1;
        const b = 2;
        const c = 3;
        const d = 4;
        const e = 5;

        type cases = [
            Expect<AssertEqual<typeof a, number>>,
            Expect<AssertEqual<typeof b, number>>,
            Expect<AssertEqual<typeof c, number>>,
            Expect<AssertEqual<typeof d, number>>,
            Expect<AssertEqual<typeof e, number>>
        ];
    });
});
