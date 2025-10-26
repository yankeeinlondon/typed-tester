/**
 * Test Fixture: Single Describe Block (Should be hidden)
 *
 * This file has a single top-level describe with NO nested describes.
 * Expected: The describe level should NOT be shown (redundant)
 */

import type { Expect, Equal } from "@type-challenges/utils";
import { describe, it } from "vitest";

describe("Calculator Tests", () => {

    it("should add numbers correctly", () => {
        const result = 1 + 1;

        type cases = [
            Expect<Equal<typeof result, number>>
        ];
    });

    it("should subtract numbers correctly", () => {
        const result = 5 - 3;

        type cases = [
            Expect<Equal<typeof result, number>>
        ];
    });

    it("should multiply numbers correctly", () => {
        const result = 3 * 4;

        type cases = [
            Expect<Equal<typeof result, number>>
        ];
    });
});
