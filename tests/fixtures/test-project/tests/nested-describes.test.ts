/**
 * Test Fixture: Nested Describe Blocks
 *
 * Purpose: Reproduce Bug 1 - missing describe block reporting
 *
 * This fixture contains:
 * - Multiple top-level describe blocks (2 non-skipped, 1 skipped)
 * - Nested describe blocks at various levels (2-3 levels deep)
 * - Mix of passing/failing/skipped it blocks
 * - Mix of type tests and runtime-only tests
 *
 * Expected Behavior:
 * - All non-skipped describe blocks should be displayed
 * - Nested hierarchy should be clear with proper indentation
 * - Single top-level describe should NOT show describe level
 * - Multiple top-level describes should ALL be shown
 * - Skipped blocks should be marked as skipped
 */

import type { Expect, Equal, AssertExtends } from "@type-challenges/utils";
import { describe, it } from "vitest";

// ===== TOP-LEVEL DESCRIBE 1: Multiple nested levels =====
describe("Top Level Block 1", () => {

    describe("Nested Level 1A", () => {

        it("should pass - runtime only", () => {
            const value = "test";
            // No type cases - runtime only test
        });

        it("should pass - with type test", () => {
            const value: string = "test";

            type cases = [
                Expect<Equal<typeof value, string>>,
            ];
        });

        describe("Deeply Nested 1A-1", () => {

            it("should fail - type mismatch", () => {
                const value: string = "test";

                type cases = [
                    Expect<Equal<typeof value, number>>, // Will fail
                ];
            });

            it("should pass - type test", () => {
                const num: number = 42;

                type cases = [
                    Expect<Equal<typeof num, number>>,
                ];
            });
        });

        describe("Deeply Nested 1A-2", () => {

            it("should pass - runtime only", () => {
                const result = true;
                // No type test
            });
        });
    });

    describe("Nested Level 1B", () => {

        it("should pass - multiple type assertions", () => {
            const str: string = "hello";
            const num: number = 42;
            const bool: boolean = true;

            type cases = [
                Expect<Equal<typeof str, string>>,
                Expect<Equal<typeof num, number>>,
                Expect<Equal<typeof bool, boolean>>,
            ];
        });

        it.skip("should be skipped", () => {
            // Skipped test
        });
    });
});

// ===== TOP-LEVEL DESCRIBE 2: Single level nesting =====
describe("Top Level Block 2", () => {

    describe("Nested Level 2A", () => {

        it("should pass - type test", () => {
            type StringType = string;

            type cases = [
                Expect<AssertExtends<StringType, string>>,
            ];
        });
    });

    it("should pass - direct child of top-level", () => {
        const value = "direct";
        // Runtime only, direct child of top-level describe
    });
});

// ===== TOP-LEVEL DESCRIBE 3: Skipped block =====
describe.skip("Top Level Block 3 (Skipped)", () => {

    it("should never run", () => {
        const value = "skipped";
    });

    describe("Nested in skipped", () => {

        it("also skipped", () => {
            const x = 1;
        });
    });
});

// ===== TOP-LEVEL DESCRIBE 4: All tests skipped =====
describe("Top Level Block 4 (All Tests Skipped)", () => {

    it.skip("skipped test 1", () => {
        const a = 1;
    });

    it.skip("skipped test 2", () => {
        const b = 2;
    });
});
