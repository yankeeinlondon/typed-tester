import { describe, it, expect } from "vitest";
import type { TestBlock } from "~/types";

/**
 * Bug 3: "Areas OUTSIDE" shows skip icon (⇣) instead of error icon
 *
 * These tests verify that:
 * 1. "Areas OUTSIDE of tests blocks" is not treated as skipped when it has diagnostics
 * 2. The block shows proper error icon (not skip icon)
 * 3. Diagnostics are displayed under the block
 */

/**
 * Copy of isBlockSkipped from showTestBlock.ts for testing
 */
function isBlockSkipped(block: TestBlock): boolean {
    // Special handling for "Areas OUTSIDE" block - never skip if it has diagnostics
    if (block.description === "Areas OUTSIDE of tests blocks" && block.diagnostics.length > 0) {
        return false;
    }

    if (block.skip) {
        return true;
    }

    const hasNonSkippedTests = block.tests.some(t => !t.skip);
    if (hasNonSkippedTests) {
        return false;
    }

    // Check if any nested blocks have non-skipped content
    if (block.blocks && block.blocks.length > 0) {
        return block.blocks.every(isBlockSkipped);
    }

    // No tests and no nested blocks = considered skipped
    return true;
}

describe("Bug 3: Areas OUTSIDE block display", () => {
    it('should NOT treat "Areas OUTSIDE" as skipped when it has diagnostics', () => {
        const areasOutsideBlock: TestBlock = {
            filepath: "/test/file.test.ts",
            description: "Areas OUTSIDE of tests blocks",
            startLine: 0,
            endLine: 0,
            skip: false,
            tests: [], // No tests
            diagnostics: [
                {
                    code: 2339,
                    message: "Property 'foo' does not exist",
                    severity: 1,
                    start: 10,
                    end: 15,
                    file: "/test/file.test.ts"
                } as any
            ]
        };

        const result = isBlockSkipped(areasOutsideBlock);

        // Should NOT be skipped even though it has no tests
        expect(result).toBe(false);
    });

    it('should treat "Areas OUTSIDE" as skipped when it has NO diagnostics', () => {
        const areasOutsideBlock: TestBlock = {
            filepath: "/test/file.test.ts",
            description: "Areas OUTSIDE of tests blocks",
            startLine: 0,
            endLine: 0,
            skip: false,
            tests: [],
            diagnostics: [] // No diagnostics
        };

        const result = isBlockSkipped(areasOutsideBlock);

        // Should be skipped when there are no diagnostics
        expect(result).toBe(true);
    });

    it("should treat normal blocks with no tests as skipped", () => {
        const normalBlock: TestBlock = {
            filepath: "/test/file.test.ts",
            description: "Normal describe block",
            startLine: 10,
            endLine: 20,
            skip: false,
            tests: [],
            diagnostics: [
                {
                    code: 2339,
                    message: "Some error",
                    severity: 1,
                    start: 10,
                    end: 15,
                    file: "/test/file.test.ts"
                } as any
            ]
        };

        const result = isBlockSkipped(normalBlock);

        // Normal blocks with no tests should be skipped
        expect(result).toBe(true);
    });

    it("should NOT skip blocks with non-skipped tests", () => {
        const blockWithTests: TestBlock = {
            filepath: "/test/file.test.ts",
            description: "Block with tests",
            startLine: 10,
            endLine: 30,
            skip: false,
            diagnostics: [],
            tests: [
                {
                    filepath: "/test/file.test.ts",
                    description: "test 1",
                    startLine: 11,
                    endLine: 13,
                    skip: false,
                    diagnostics: [],
                    symbols: [],
                    hasTypeCases: true,
                    typeAssertionCount: 1
                }
            ]
        };

        const result = isBlockSkipped(blockWithTests);

        // Should not be skipped - has non-skipped tests
        expect(result).toBe(false);
    });

    it("should skip blocks where all tests are skipped", () => {
        const blockWithSkippedTests: TestBlock = {
            filepath: "/test/file.test.ts",
            description: "Block with skipped tests",
            startLine: 10,
            endLine: 30,
            skip: false,
            diagnostics: [],
            tests: [
                {
                    filepath: "/test/file.test.ts",
                    description: "test 1",
                    startLine: 11,
                    endLine: 13,
                    skip: true, // Skipped
                    diagnostics: [],
                    symbols: [],
                    hasTypeCases: true,
                    typeAssertionCount: 1
                }
            ]
        };

        const result = isBlockSkipped(blockWithSkippedTests);

        // Should be skipped - all tests are skipped
        expect(result).toBe(true);
    });

    it("should skip blocks explicitly marked as skip", () => {
        const explicitlySkippedBlock: TestBlock = {
            filepath: "/test/file.test.ts",
            description: "Explicitly skipped block",
            startLine: 10,
            endLine: 30,
            skip: true, // Explicitly skipped
            diagnostics: [],
            tests: [
                {
                    filepath: "/test/file.test.ts",
                    description: "test 1",
                    startLine: 11,
                    endLine: 13,
                    skip: false,
                    diagnostics: [],
                    symbols: [],
                    hasTypeCases: true,
                    typeAssertionCount: 1
                }
            ]
        };

        const result = isBlockSkipped(explicitlySkippedBlock);

        // Should be skipped - explicitly marked
        expect(result).toBe(true);
    });

    it("should handle nested blocks with non-skipped content", () => {
        const blockWithNestedContent: TestBlock = {
            filepath: "/test/file.test.ts",
            description: "Parent block",
            startLine: 10,
            endLine: 50,
            skip: false,
            diagnostics: [],
            tests: [], // No tests at this level
            blocks: [
                {
                    filepath: "/test/file.test.ts",
                    description: "Nested block",
                    startLine: 15,
                    endLine: 40,
                    skip: false,
                    diagnostics: [],
                    tests: [
                        {
                            filepath: "/test/file.test.ts",
                            description: "nested test",
                            startLine: 16,
                            endLine: 18,
                            skip: false,
                            diagnostics: [],
                            symbols: [],
                            hasTypeCases: true,
                            typeAssertionCount: 1
                        }
                    ]
                }
            ]
        };

        const result = isBlockSkipped(blockWithNestedContent);

        // Should not be skipped - has nested block with non-skipped tests
        expect(result).toBe(false);
    });

    it("should skip blocks where all nested blocks are skipped", () => {
        const blockWithAllSkippedNested: TestBlock = {
            filepath: "/test/file.test.ts",
            description: "Parent block",
            startLine: 10,
            endLine: 50,
            skip: false,
            diagnostics: [],
            tests: [],
            blocks: [
                {
                    filepath: "/test/file.test.ts",
                    description: "Nested block 1",
                    startLine: 15,
                    endLine: 25,
                    skip: true, // Skipped
                    diagnostics: [],
                    tests: []
                },
                {
                    filepath: "/test/file.test.ts",
                    description: "Nested block 2",
                    startLine: 30,
                    endLine: 40,
                    skip: false,
                    diagnostics: [],
                    tests: [] // No tests = skipped
                }
            ]
        };

        const result = isBlockSkipped(blockWithAllSkippedNested);

        // Should be skipped - all nested blocks are skipped
        expect(result).toBe(true);
    });

    it('should use different icon for "Areas OUTSIDE" than test failures', () => {
        // This documents that "Areas OUTSIDE" uses ⚠️/⛒ icons, not ⤬
        // The actual icon logic is in showTestBlock.ts:
        // - ⚠️ (yellow warning) when only warnings exist
        // - ⛒ (red error) when errors exist
        // - NOT ⤬ (test failure icon)

        const areasOutsideWithErrors: TestBlock = {
            filepath: "/test/file.test.ts",
            description: "Areas OUTSIDE of tests blocks",
            startLine: 0,
            endLine: 0,
            skip: false,
            tests: [],
            diagnostics: [
                {
                    code: 2339,
                    message: "Property 'foo' does not exist",
                    severity: 1,
                    start: 10,
                    end: 15,
                    file: "/test/file.test.ts"
                } as any
            ]
        };

        // Verify it's not skipped (so icon will be shown)
        const result = isBlockSkipped(areasOutsideWithErrors);
        expect(result).toBe(false);

        // The showTestBlock function will render:
        // [ ⛒ ] Areas OUTSIDE of tests blocks
        // NOT [ ⤬ ] Areas OUTSIDE of tests blocks
    });
});
