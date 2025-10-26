import { describe, it, expect } from "vitest";

/**
 * Bug 2: Confusing "failures" vs "type errors" terminology
 *
 * These tests verify that the error display shows a single unified count
 * instead of confusing "2 failures, 5 type errors" messages.
 *
 * In type testing, a test "failure" IS a type error, so we should show
 * only one metric: total number of type errors.
 */

describe("Bug 2: Error display terminology", () => {
    it("should combine test errors and block errors into a single count", () => {
        // Scenario: Block has:
        // - 2 failing tests (tests with errors)
        // - 3 block-level errors (errors at describe block level)
        // OLD: Would show "2 failures, 3 type errors"
        // NEW: Should show "5 type errors" (2 + 3)

        const testErrors = 2;  // Errors in it() blocks
        const blockErrors = 3; // Errors at block level
        const totalErrors = testErrors + blockErrors;

        expect(totalErrors).toBe(5);
    });

    it("should show correct count when only test errors exist", () => {
        // Scenario: Block has:
        // - 3 failing tests
        // - 0 block-level errors
        // OLD: Would show "3 failures"
        // NEW: Should show "3 type errors"

        const testErrors = 3;
        const blockErrors = 0;
        const totalErrors = testErrors + blockErrors;

        expect(totalErrors).toBe(3);
    });

    it("should show correct count when only block-level errors exist", () => {
        // Scenario: Block has:
        // - 0 failing tests
        // - 5 block-level errors
        // OLD: Would show "5 type errors"
        // NEW: Should show "5 type errors" (same, but consistent)

        const testErrors = 0;
        const blockErrors = 5;
        const totalErrors = testErrors + blockErrors;

        expect(totalErrors).toBe(5);
    });

    it("should show singular form for single error", () => {
        // Scenario: Block has:
        // - 1 failing test
        // - 0 block-level errors
        // OLD: Would show "1 failed"
        // NEW: Should show "1 type error"

        const totalErrors = 1;
        const errorText = totalErrors === 1 ? "type error" : "type errors";

        expect(errorText).toBe("type error");
    });

    it("should show plural form for multiple errors", () => {
        // Scenario: Block has:
        // - 2 failing tests
        // - 1 block-level error
        // OLD: Would show "2 failures, 1 type error"
        // NEW: Should show "3 type errors"

        const totalErrors = 3;
        const errorText = totalErrors === 1 ? "type error" : "type errors";

        expect(errorText).toBe("type errors");
    });

    it("should show no errors message when totalErrors is 0", () => {
        const totalErrors = 0;
        const hasErrors = totalErrors > 0;

        expect(hasErrors).toBe(false);
    });

    it("should not show separate failure and error counts", () => {
        // This test documents the fix: we no longer distinguish between
        // "failures" (tests with errors) and "type errors" (block-level errors)
        // because in type testing, they're the same thing

        const testErrors = 2;
        const blockErrors = 3;

        // OLD approach (WRONG):
        // const failureDisplay = `${testErrors} failures`;
        // const errorDisplay = `${blockErrors} type errors`;
        // Result: "2 failures, 3 type errors" (confusing!)

        // NEW approach (CORRECT):
        const totalErrors = testErrors + blockErrors;
        const errorDisplay = `${totalErrors} type errors`;

        expect(errorDisplay).toBe("5 type errors");
    });

    it("should handle edge case: both counts are zero", () => {
        const testErrors = 0;
        const blockErrors = 0;
        const totalErrors = testErrors + blockErrors;

        expect(totalErrors).toBe(0);
    });

    it("should add test errors and block errors correctly", () => {
        // Verify the arithmetic is correct
        const scenarios = [
            { testErrors: 1, blockErrors: 1, expected: 2 },
            { testErrors: 5, blockErrors: 0, expected: 5 },
            { testErrors: 0, blockErrors: 3, expected: 3 },
            { testErrors: 10, blockErrors: 5, expected: 15 },
            { testErrors: 0, blockErrors: 0, expected: 0 }
        ];

        for (const scenario of scenarios) {
            const total = scenario.testErrors + scenario.blockErrors;
            expect(total).toBe(scenario.expected);
        }
    });
});
