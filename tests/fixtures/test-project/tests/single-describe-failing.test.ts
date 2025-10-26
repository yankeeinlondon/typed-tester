/**
 * Test Fixture: Single Describe Block with Errors (Should hide describe, show tests directly)
 */

import type { Expect, Equal } from "@type-challenges/utils";
import { describe, it } from "vitest";

describe("Calculator Tests with Errors", () => {

    it("should fail - wrong type", () => {
        const result = "hello";

        type cases = [
            Expect<Equal<typeof result, number>> // FAIL: string !== number
        ];
    });

    it("should pass - correct type", () => {
        const result = 42;

        type cases = [
            Expect<Equal<typeof result, number>>
        ];
    });
});
