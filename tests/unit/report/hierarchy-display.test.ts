import { describe, it, expect, beforeEach } from "vitest";
import type { Expect } from "inferred-types/types";
import type { AssertEqual, AssertExtends } from "inferred-types";
import type { TestFile, TestBlock } from "~/types";
import { shouldShowDescribeLevel, getIndentLevel, isRedundantSingleDescribe } from "~/report/hierarchy";

describe("Hierarchy Display Rules", () => {

    describe("shouldShowDescribeLevel()", () => {

        it("should return false for single top-level describe (redundant)", () => {
            const testFile: TestFile = {
                filepath: "/test.ts",
                skip: false,
                skippedTests: 0,
                blocks: [
                    {
                        filepath: "/test.ts",
                        skip: false,
                        description: "Single Top Level",
                        tests: [],
                        startLine: 1,
                        endLine: 10,
                        diagnostics: []
                    }
                ],
                importSymbols: [],
                duration: 0,
                testLines: 10,
                typeTests: 0,
                assertions: 0
            };

            const result = shouldShowDescribeLevel(testFile);

            expect(result).toBe(false);

            type cases = [
                Expect<AssertEqual<typeof result, boolean>>
            ];
        });

        it("should return true for multiple top-level describes", () => {
            const testFile: TestFile = {
                filepath: "/test.ts",
                skip: false,
                skippedTests: 0,
                blocks: [
                    {
                        filepath: "/test.ts",
                        skip: false,
                        description: "First Block",
                        tests: [],
                        startLine: 1,
                        endLine: 10,
                        diagnostics: []
                    },
                    {
                        filepath: "/test.ts",
                        skip: false,
                        description: "Second Block",
                        tests: [],
                        startLine: 11,
                        endLine: 20,
                        diagnostics: []
                    }
                ],
                importSymbols: [],
                duration: 0,
                testLines: 20,
                typeTests: 0,
                assertions: 0
            };

            const result = shouldShowDescribeLevel(testFile);

            expect(result).toBe(true);

            type cases = [
                Expect<AssertEqual<typeof result, boolean>>
            ];
        });

        it("should return true when single describe has nested describes", () => {
            const testFile: TestFile = {
                filepath: "/test.ts",
                skip: false,
                skippedTests: 0,
                blocks: [
                    {
                        filepath: "/test.ts",
                        skip: false,
                        description: "Top Level",
                        tests: [],
                        blocks: [
                            {
                                filepath: "/test.ts",
                                skip: false,
                                description: "Nested",
                                tests: [],
                                startLine: 2,
                                endLine: 5,
                                diagnostics: []
                            }
                        ],
                        startLine: 1,
                        endLine: 10,
                        diagnostics: []
                    }
                ],
                importSymbols: [],
                duration: 0,
                testLines: 10,
                typeTests: 0,
                assertions: 0
            };

            const result = shouldShowDescribeLevel(testFile);

            expect(result).toBe(true);

            type cases = [
                Expect<AssertEqual<typeof result, boolean>>
            ];
        });

        it("should return true when no describe blocks (file-level tests)", () => {
            const testFile: TestFile = {
                filepath: "/test.ts",
                skip: false,
                skippedTests: 0,
                blocks: [],
                importSymbols: [],
                duration: 0,
                testLines: 0,
                typeTests: 0,
                assertions: 0
            };

            const result = shouldShowDescribeLevel(testFile);

            expect(result).toBe(true);

            type cases = [
                Expect<AssertEqual<typeof result, boolean>>
            ];
        });

        it("should return true when single describe is 'Areas OUTSIDE of tests blocks'", () => {
            const testFile: TestFile = {
                filepath: "/test.ts",
                skip: false,
                skippedTests: 0,
                blocks: [
                    {
                        filepath: "/test.ts",
                        skip: false,
                        description: "Areas OUTSIDE of tests blocks",
                        tests: [],
                        startLine: 0,
                        endLine: 0,
                        diagnostics: []
                    }
                ],
                importSymbols: [],
                duration: 0,
                testLines: 0,
                typeTests: 0,
                assertions: 0
            };

            const result = shouldShowDescribeLevel(testFile);

            expect(result).toBe(true);

            type cases = [
                Expect<AssertEqual<typeof result, boolean>>
            ];
        });
    });

    describe("isRedundantSingleDescribe()", () => {

        it("should identify single top-level describe as redundant", () => {
            const block: TestBlock = {
                filepath: "/test.ts",
                skip: false,
                description: "Single Top Level",
                tests: [
                    {
                        filepath: "/test.ts",
                        skip: false,
                        description: "test 1",
                        startLine: 2,
                        endLine: 4,
                        diagnostics: [],
                        symbols: [],
                        hasTypeCases: false,
                        typeAssertionCount: 0
                    }
                ],
                startLine: 1,
                endLine: 10,
                diagnostics: []
            };

            const totalBlocks = 1;
            const hasNestedBlocks = false;

            const result = isRedundantSingleDescribe(block, totalBlocks, hasNestedBlocks);

            expect(result).toBe(true);

            type cases = [
                Expect<AssertEqual<typeof result, boolean>>
            ];
        });

        it("should not consider block redundant if it has nested blocks", () => {
            const block: TestBlock = {
                filepath: "/test.ts",
                skip: false,
                description: "Top Level",
                tests: [],
                blocks: [
                    {
                        filepath: "/test.ts",
                        skip: false,
                        description: "Nested",
                        tests: [],
                        startLine: 2,
                        endLine: 5,
                        diagnostics: []
                    }
                ],
                startLine: 1,
                endLine: 10,
                diagnostics: []
            };

            const totalBlocks = 1;
            const hasNestedBlocks = true;

            const result = isRedundantSingleDescribe(block, totalBlocks, hasNestedBlocks);

            expect(result).toBe(false);

            type cases = [
                Expect<AssertEqual<typeof result, boolean>>
            ];
        });

        it("should not consider block redundant if multiple blocks exist", () => {
            const block: TestBlock = {
                filepath: "/test.ts",
                skip: false,
                description: "First Block",
                tests: [],
                startLine: 1,
                endLine: 10,
                diagnostics: []
            };

            const totalBlocks = 2;
            const hasNestedBlocks = false;

            const result = isRedundantSingleDescribe(block, totalBlocks, hasNestedBlocks);

            expect(result).toBe(false);

            type cases = [
                Expect<AssertEqual<typeof result, boolean>>
            ];
        });

        it("should not consider 'Areas OUTSIDE of tests blocks' as redundant", () => {
            const block: TestBlock = {
                filepath: "/test.ts",
                skip: false,
                description: "Areas OUTSIDE of tests blocks",
                tests: [],
                startLine: 0,
                endLine: 0,
                diagnostics: []
            };

            const totalBlocks = 1;
            const hasNestedBlocks = false;

            const result = isRedundantSingleDescribe(block, totalBlocks, hasNestedBlocks);

            expect(result).toBe(false);

            type cases = [
                Expect<AssertEqual<typeof result, boolean>>
            ];
        });
    });

    describe("getIndentLevel()", () => {

        it("should return 1 for top-level block with multiple siblings", () => {
            const depth = 0;
            const isRedundant = false;

            const result = getIndentLevel(depth, isRedundant);

            expect(result).toBe(1);

            type cases = [
                Expect<AssertEqual<typeof result, number>>
            ];
        });

        it("should return 0 for redundant single top-level block", () => {
            const depth = 0;
            const isRedundant = true;

            const result = getIndentLevel(depth, isRedundant);

            expect(result).toBe(0);

            type cases = [
                Expect<AssertEqual<typeof result, number>>
            ];
        });

        it("should return depth + 1 for nested blocks", () => {
            const depth = 1;
            const isRedundant = false;

            const result = getIndentLevel(depth, isRedundant);

            expect(result).toBe(2);

            type cases = [
                Expect<AssertEqual<typeof result, number>>
            ];
        });

        it("should handle deeply nested blocks (3 levels)", () => {
            const depth = 2;
            const isRedundant = false;

            const result = getIndentLevel(depth, isRedundant);

            expect(result).toBe(3);

            type cases = [
                Expect<AssertEqual<typeof result, number>>
            ];
        });

        it("should reduce indent for redundant nested block", () => {
            const depth = 1;
            const isRedundant = true;

            const result = getIndentLevel(depth, isRedundant);

            expect(result).toBe(1);

            type cases = [
                Expect<AssertEqual<typeof result, number>>
            ];
        });
    });

    describe("Edge Cases", () => {

        it("should handle empty describe blocks gracefully", () => {
            const block: TestBlock = {
                filepath: "/test.ts",
                skip: false,
                description: "Empty Block",
                tests: [],
                startLine: 1,
                endLine: 3,
                diagnostics: []
            };

            const totalBlocks = 1;
            const hasNestedBlocks = false;

            const result = isRedundantSingleDescribe(block, totalBlocks, hasNestedBlocks);

            // Empty blocks should still follow redundancy rules
            expect(result).toBe(true);

            type cases = [
                Expect<AssertEqual<typeof result, boolean>>
            ];
        });

        it("should handle describe with only skipped tests", () => {
            const block: TestBlock = {
                filepath: "/test.ts",
                skip: false,
                description: "All Skipped",
                tests: [
                    {
                        filepath: "/test.ts",
                        skip: true,
                        description: "skipped test",
                        startLine: 2,
                        endLine: 4,
                        diagnostics: [],
                        symbols: [],
                        hasTypeCases: false,
                        typeAssertionCount: 0
                    }
                ],
                startLine: 1,
                endLine: 10,
                diagnostics: []
            };

            const totalBlocks = 1;
            const hasNestedBlocks = false;

            const result = isRedundantSingleDescribe(block, totalBlocks, hasNestedBlocks);

            // Skipped tests don't affect redundancy logic
            expect(result).toBe(true);

            type cases = [
                Expect<AssertEqual<typeof result, boolean>>
            ];
        });

        it("should handle max indent depth gracefully", () => {
            const depth = 10; // Very deep nesting
            const isRedundant = false;

            const result = getIndentLevel(depth, isRedundant);

            // Should still calculate correctly even at extreme depths
            expect(result).toBe(11);

            type cases = [
                Expect<AssertEqual<typeof result, number>>
            ];
        });
    });
});
