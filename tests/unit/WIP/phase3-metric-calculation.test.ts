import { describe, it, expect } from "vitest";
import type { TestFile, TestBlock, TypeTest } from "~/types";
import type { AsOption } from "~/cli";
import type { Expect, AssertEqual, AssertExtends } from "inferred-types/types";

// Import the functions we're going to implement
import { calculateTestMetrics, calculateBlockMetrics, calculateFileMetrics, type TestMetrics } from "~/report/calculateMetrics";

// Helper to create minimal CLI options for testing
const createTestOptions = (): AsOption<"test"> => ({
    "ignore-outside": false,
    "only-errors": false,
    "show-passing": false,
    "show-symbols": false,
    "slow": false,
    "verbose": false,
    "metrics": false,
    "warn": [], // Empty array means no warnings to ignore
    command: "test",
    _: []
});

describe("calculateTestMetrics()", () => {
    it("should calculate metrics for a test with type cases", () => {
        const test: TypeTest = {
            filepath: "/test.ts",
            description: "test with types",
            startLine: 1,
            endLine: 10,
            skip: false,
            diagnostics: [],
            symbols: [],
            hasTypeCases: true,
            typeAssertionCount: 3
        };

        const opt = createTestOptions();
        const result = calculateTestMetrics(test, opt);

        expect(result.totalTests).toBe(1);
        expect(result.typeTests).toBe(1);
        expect(result.assertions).toBe(3);
        expect(result.skippedTests).toBe(0);
        expect(result.activeTests).toBe(1);
        expect(result.failingTests).toBe(0);

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });

    it("should calculate metrics for a test without type cases", () => {
        const test: TypeTest = {
            filepath: "/test.ts",
            description: "runtime only test",
            startLine: 1,
            endLine: 10,
            skip: false,
            diagnostics: [],
            symbols: [],
            hasTypeCases: false,
            typeAssertionCount: 0
        };

        const opt = createTestOptions();
        const result = calculateTestMetrics(test, opt);

        expect(result.totalTests).toBe(1);
        expect(result.typeTests).toBe(0);
        expect(result.assertions).toBe(0);
        expect(result.skippedTests).toBe(0);
        expect(result.activeTests).toBe(1);

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });

    it("should calculate metrics for a skipped test", () => {
        const test: TypeTest = {
            filepath: "/test.ts",
            description: "skipped test",
            startLine: 1,
            endLine: 10,
            skip: true,
            diagnostics: [],
            symbols: [],
            hasTypeCases: true,
            typeAssertionCount: 5
        };

        const opt = createTestOptions();
        const result = calculateTestMetrics(test, opt);

        expect(result.totalTests).toBe(1);
        expect(result.typeTests).toBe(1);
        expect(result.assertions).toBe(5);
        expect(result.skippedTests).toBe(1);
        expect(result.activeTests).toBe(0); // skipped test = not active

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });

    it("should handle test with errors", () => {
        const test: TypeTest = {
            filepath: "/test.ts",
            description: "failing test",
            startLine: 1,
            endLine: 10,
            skip: false,
            diagnostics: [
                {
                    code: 2344,
                    category: 1, // Error
                    msg: "Type error",
                    filepath: "/test.ts",
                    loc: {
                        lineNumber: 5,
                        column: 10,
                        start: 100,
                        length: 10
                    }
                }
            ],
            symbols: [],
            hasTypeCases: true,
            typeAssertionCount: 2
        };

        const opt = createTestOptions();
        const result = calculateTestMetrics(test, opt);

        expect(result.totalTests).toBe(1);
        expect(result.typeTests).toBe(1);
        expect(result.assertions).toBe(2);
        expect(result.failingTests).toBe(1);

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });
});

describe("calculateBlockMetrics() - Flat Describe Blocks", () => {
    it("should calculate metrics for a block with multiple tests", () => {
        const block: TestBlock = {
            filepath: "/test.ts",
            description: "Feature A",
            startLine: 1,
            endLine: 50,
            skip: false,
            diagnostics: [],
            tests: [
                {
                    filepath: "/test.ts",
                    description: "test 1",
                    startLine: 5,
                    endLine: 10,
                    skip: false,
                    diagnostics: [],
                    symbols: [],
                    hasTypeCases: true,
                    typeAssertionCount: 3
                },
                {
                    filepath: "/test.ts",
                    description: "test 2",
                    startLine: 12,
                    endLine: 18,
                    skip: false,
                    diagnostics: [],
                    symbols: [],
                    hasTypeCases: true,
                    typeAssertionCount: 2
                },
                {
                    filepath: "/test.ts",
                    description: "test 3",
                    startLine: 20,
                    endLine: 25,
                    skip: false,
                    diagnostics: [],
                    symbols: [],
                    hasTypeCases: false,
                    typeAssertionCount: 0
                }
            ]
        };

        const opt = createTestOptions();
        const result = calculateBlockMetrics(block, opt);

        expect(result.totalTests).toBe(3);
        expect(result.typeTests).toBe(2);
        expect(result.assertions).toBe(5); // 3 + 2 + 0
        expect(result.skippedTests).toBe(0);
        expect(result.activeTests).toBe(3);

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });

    it("should handle block with some skipped tests", () => {
        const block: TestBlock = {
            filepath: "/test.ts",
            description: "Feature B",
            startLine: 1,
            endLine: 50,
            skip: false,
            diagnostics: [],
            tests: [
                {
                    filepath: "/test.ts",
                    description: "test 1",
                    startLine: 5,
                    endLine: 10,
                    skip: false,
                    diagnostics: [],
                    symbols: [],
                    hasTypeCases: true,
                    typeAssertionCount: 4
                },
                {
                    filepath: "/test.ts",
                    description: "test 2",
                    startLine: 12,
                    endLine: 18,
                    skip: true, // SKIPPED
                    diagnostics: [],
                    symbols: [],
                    hasTypeCases: true,
                    typeAssertionCount: 2
                }
            ]
        };

        const opt = createTestOptions();
        const result = calculateBlockMetrics(block, opt);

        expect(result.totalTests).toBe(2);
        expect(result.typeTests).toBe(2); // Both have type cases, even if one is skipped
        expect(result.assertions).toBe(6); // 4 + 2
        expect(result.skippedTests).toBe(1);
        expect(result.activeTests).toBe(1);

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });

    it("should handle empty block", () => {
        const block: TestBlock = {
            filepath: "/test.ts",
            description: "Empty Block",
            startLine: 1,
            endLine: 10,
            skip: false,
            diagnostics: [],
            tests: []
        };

        const opt = createTestOptions();
        const result = calculateBlockMetrics(block, opt);

        expect(result.totalTests).toBe(0);
        expect(result.typeTests).toBe(0);
        expect(result.assertions).toBe(0);
        expect(result.skippedTests).toBe(0);
        expect(result.activeTests).toBe(0);

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });
});

describe("calculateBlockMetrics() - Nested Describe Blocks", () => {
    it("should recursively calculate metrics for nested blocks", () => {
        const block: TestBlock = {
            filepath: "/test.ts",
            description: "Outer Block",
            startLine: 1,
            endLine: 100,
            skip: false,
            diagnostics: [],
            tests: [
                {
                    filepath: "/test.ts",
                    description: "outer test",
                    startLine: 5,
                    endLine: 10,
                    skip: false,
                    diagnostics: [],
                    symbols: [],
                    hasTypeCases: true,
                    typeAssertionCount: 1
                }
            ],
            blocks: [
                {
                    filepath: "/test.ts",
                    description: "Inner Block 1",
                    startLine: 20,
                    endLine: 50,
                    skip: false,
                    diagnostics: [],
                    tests: [
                        {
                            filepath: "/test.ts",
                            description: "inner test 1",
                            startLine: 25,
                            endLine: 30,
                            skip: false,
                            diagnostics: [],
                            symbols: [],
                            hasTypeCases: true,
                            typeAssertionCount: 2
                        },
                        {
                            filepath: "/test.ts",
                            description: "inner test 2",
                            startLine: 32,
                            endLine: 38,
                            skip: false,
                            diagnostics: [],
                            symbols: [],
                            hasTypeCases: false,
                            typeAssertionCount: 0
                        }
                    ]
                },
                {
                    filepath: "/test.ts",
                    description: "Inner Block 2",
                    startLine: 60,
                    endLine: 90,
                    skip: false,
                    diagnostics: [],
                    tests: [
                        {
                            filepath: "/test.ts",
                            description: "inner test 3",
                            startLine: 65,
                            endLine: 70,
                            skip: false,
                            diagnostics: [],
                            symbols: [],
                            hasTypeCases: true,
                            typeAssertionCount: 3
                        }
                    ]
                }
            ]
        };

        const opt = createTestOptions();
        const result = calculateBlockMetrics(block, opt);

        // 1 outer + 2 in block1 + 1 in block2 = 4 total
        expect(result.totalTests).toBe(4);
        // 1 outer + 1 in block1 + 1 in block2 = 3 type tests
        expect(result.typeTests).toBe(3);
        // 1 + 2 + 0 + 3 = 6 assertions
        expect(result.assertions).toBe(6);
        expect(result.skippedTests).toBe(0);
        expect(result.activeTests).toBe(4);

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });

    it("should handle deeply nested blocks (3+ levels)", () => {
        const block: TestBlock = {
            filepath: "/test.ts",
            description: "Level 1",
            startLine: 1,
            endLine: 200,
            skip: false,
            diagnostics: [],
            tests: [],
            blocks: [
                {
                    filepath: "/test.ts",
                    description: "Level 2",
                    startLine: 10,
                    endLine: 100,
                    skip: false,
                    diagnostics: [],
                    tests: [],
                    blocks: [
                        {
                            filepath: "/test.ts",
                            description: "Level 3",
                            startLine: 20,
                            endLine: 50,
                            skip: false,
                            diagnostics: [],
                            tests: [
                                {
                                    filepath: "/test.ts",
                                    description: "deep test",
                                    startLine: 25,
                                    endLine: 30,
                                    skip: false,
                                    diagnostics: [],
                                    symbols: [],
                                    hasTypeCases: true,
                                    typeAssertionCount: 5
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const opt = createTestOptions();
        const result = calculateBlockMetrics(block, opt);

        expect(result.totalTests).toBe(1);
        expect(result.typeTests).toBe(1);
        expect(result.assertions).toBe(5);

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });

    it("should handle mixed nested and flat structure", () => {
        const block: TestBlock = {
            filepath: "/test.ts",
            description: "Mixed Block",
            startLine: 1,
            endLine: 150,
            skip: false,
            diagnostics: [],
            tests: [
                // Direct tests at this level
                {
                    filepath: "/test.ts",
                    description: "direct test 1",
                    startLine: 5,
                    endLine: 10,
                    skip: false,
                    diagnostics: [],
                    symbols: [],
                    hasTypeCases: true,
                    typeAssertionCount: 2
                },
                {
                    filepath: "/test.ts",
                    description: "direct test 2",
                    startLine: 12,
                    endLine: 18,
                    skip: true,
                    diagnostics: [],
                    symbols: [],
                    hasTypeCases: false,
                    typeAssertionCount: 0
                }
            ],
            blocks: [
                // Nested block
                {
                    filepath: "/test.ts",
                    description: "Nested Block",
                    startLine: 30,
                    endLine: 60,
                    skip: false,
                    diagnostics: [],
                    tests: [
                        {
                            filepath: "/test.ts",
                            description: "nested test",
                            startLine: 35,
                            endLine: 40,
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

        const opt = createTestOptions();
        const result = calculateBlockMetrics(block, opt);

        expect(result.totalTests).toBe(3); // 2 direct + 1 nested
        expect(result.typeTests).toBe(2); // 1 direct + 1 nested
        expect(result.assertions).toBe(3); // 2 + 0 + 1
        expect(result.skippedTests).toBe(1);
        expect(result.activeTests).toBe(2);

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });
});

describe("calculateFileMetrics()", () => {
    it("should calculate metrics for file with single top-level block", () => {
        const file: TestFile = {
            filepath: "/test.ts",
            importSymbols: [],
            skip: false,
            skippedTests: 0,
            duration: 100,
            testLines: 50,
            typeTests: 2, // These will be recalculated
            assertions: 5,
            blocks: [
                {
                    filepath: "/test.ts",
                    description: "Single Block",
                    startLine: 1,
                    endLine: 50,
                    skip: false,
                    diagnostics: [],
                    tests: [
                        {
                            filepath: "/test.ts",
                            description: "test 1",
                            startLine: 5,
                            endLine: 10,
                            skip: false,
                            diagnostics: [],
                            symbols: [],
                            hasTypeCases: true,
                            typeAssertionCount: 3
                        },
                        {
                            filepath: "/test.ts",
                            description: "test 2",
                            startLine: 12,
                            endLine: 18,
                            skip: false,
                            diagnostics: [],
                            symbols: [],
                            hasTypeCases: true,
                            typeAssertionCount: 2
                        }
                    ]
                }
            ]
        };

        const opt = createTestOptions();
        const result = calculateFileMetrics(file, opt);

        expect(result.totalTests).toBe(2);
        expect(result.typeTests).toBe(2);
        expect(result.assertions).toBe(5);
        expect(result.skippedTests).toBe(0);
        expect(result.activeTests).toBe(2);

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });

    it("should calculate metrics for file with multiple top-level blocks", () => {
        const file: TestFile = {
            filepath: "/test.ts",
            importSymbols: [],
            skip: false,
            skippedTests: 1,
            duration: 200,
            testLines: 100,
            typeTests: 3, // Will be recalculated
            assertions: 8,
            blocks: [
                {
                    filepath: "/test.ts",
                    description: "Block 1",
                    startLine: 1,
                    endLine: 40,
                    skip: false,
                    diagnostics: [],
                    tests: [
                        {
                            filepath: "/test.ts",
                            description: "test 1",
                            startLine: 5,
                            endLine: 10,
                            skip: false,
                            diagnostics: [],
                            symbols: [],
                            hasTypeCases: true,
                            typeAssertionCount: 3
                        },
                        {
                            filepath: "/test.ts",
                            description: "test 2",
                            startLine: 15,
                            endLine: 20,
                            skip: true,
                            diagnostics: [],
                            symbols: [],
                            hasTypeCases: false,
                            typeAssertionCount: 0
                        }
                    ]
                },
                {
                    filepath: "/test.ts",
                    description: "Block 2",
                    startLine: 50,
                    endLine: 90,
                    skip: false,
                    diagnostics: [],
                    tests: [
                        {
                            filepath: "/test.ts",
                            description: "test 3",
                            startLine: 55,
                            endLine: 60,
                            skip: false,
                            diagnostics: [],
                            symbols: [],
                            hasTypeCases: true,
                            typeAssertionCount: 2
                        },
                        {
                            filepath: "/test.ts",
                            description: "test 4",
                            startLine: 65,
                            endLine: 70,
                            skip: false,
                            diagnostics: [],
                            symbols: [],
                            hasTypeCases: true,
                            typeAssertionCount: 3
                        }
                    ]
                }
            ]
        };

        const opt = createTestOptions();
        const result = calculateFileMetrics(file, opt);

        expect(result.totalTests).toBe(4);
        expect(result.typeTests).toBe(3);
        expect(result.assertions).toBe(8); // 3 + 0 + 2 + 3
        expect(result.skippedTests).toBe(1);
        expect(result.activeTests).toBe(3);

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });

    it("should handle file with nested blocks correctly", () => {
        const file: TestFile = {
            filepath: "/test.ts",
            importSymbols: [],
            skip: false,
            skippedTests: 0,
            duration: 150,
            testLines: 75,
            typeTests: 2, // Will be recalculated
            assertions: 6,
            blocks: [
                {
                    filepath: "/test.ts",
                    description: "Outer Block",
                    startLine: 1,
                    endLine: 100,
                    skip: false,
                    diagnostics: [],
                    tests: [
                        {
                            filepath: "/test.ts",
                            description: "outer test",
                            startLine: 5,
                            endLine: 10,
                            skip: false,
                            diagnostics: [],
                            symbols: [],
                            hasTypeCases: true,
                            typeAssertionCount: 3
                        }
                    ],
                    blocks: [
                        {
                            filepath: "/test.ts",
                            description: "Inner Block",
                            startLine: 20,
                            endLine: 50,
                            skip: false,
                            diagnostics: [],
                            tests: [
                                {
                                    filepath: "/test.ts",
                                    description: "inner test",
                                    startLine: 25,
                                    endLine: 30,
                                    skip: false,
                                    diagnostics: [],
                                    symbols: [],
                                    hasTypeCases: true,
                                    typeAssertionCount: 3
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const opt = createTestOptions();
        const result = calculateFileMetrics(file, opt);

        // Bug fix: should count BOTH outer and inner tests
        expect(result.totalTests).toBe(2); // Not 1!
        expect(result.typeTests).toBe(2);
        expect(result.assertions).toBe(6); // 3 + 3

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });

    it("should handle file with no blocks", () => {
        const file: TestFile = {
            filepath: "/test.ts",
            importSymbols: [],
            skip: false,
            skippedTests: 0,
            duration: 50,
            testLines: 10,
            typeTests: 0,
            assertions: 0,
            blocks: []
        };

        const opt = createTestOptions();
        const result = calculateFileMetrics(file, opt);

        expect(result.totalTests).toBe(0);
        expect(result.typeTests).toBe(0);
        expect(result.assertions).toBe(0);
        expect(result.skippedTests).toBe(0);
        expect(result.activeTests).toBe(0);

        type cases = [
            Expect<AssertEqual<typeof result, TestMetrics>>
        ];
    });
});

describe("Metric Calculation - Consistency Invariants", () => {
    it("should maintain file metrics = sum of top-level blocks", () => {
        const file: TestFile = {
            filepath: "/test.ts",
            importSymbols: [],
            skip: false,
            skippedTests: 0,
            duration: 200,
            testLines: 100,
            typeTests: 4,
            assertions: 10,
            blocks: [
                {
                    filepath: "/test.ts",
                    description: "Block 1",
                    startLine: 1,
                    endLine: 40,
                    skip: false,
                    diagnostics: [],
                    tests: [
                        { filepath: "/test.ts", description: "t1", startLine: 5, endLine: 10, skip: false, diagnostics: [], symbols: [], hasTypeCases: true, typeAssertionCount: 3 }
                    ]
                },
                {
                    filepath: "/test.ts",
                    description: "Block 2",
                    startLine: 50,
                    endLine: 90,
                    skip: false,
                    diagnostics: [],
                    tests: [
                        { filepath: "/test.ts", description: "t2", startLine: 55, endLine: 60, skip: false, diagnostics: [], symbols: [], hasTypeCases: true, typeAssertionCount: 2 },
                        { filepath: "/test.ts", description: "t3", startLine: 65, endLine: 70, skip: false, diagnostics: [], symbols: [], hasTypeCases: true, typeAssertionCount: 5 }
                    ]
                }
            ]
        };

        const opt = createTestOptions();
        const fileMetrics = calculateFileMetrics(file, opt);
        const block1Metrics = calculateBlockMetrics(file.blocks[0], opt);
        const block2Metrics = calculateBlockMetrics(file.blocks[1], opt);

        // INVARIANT: File total = sum of block totals
        expect(fileMetrics.totalTests).toBe(block1Metrics.totalTests + block2Metrics.totalTests);
        expect(fileMetrics.typeTests).toBe(block1Metrics.typeTests + block2Metrics.typeTests);
        expect(fileMetrics.assertions).toBe(block1Metrics.assertions + block2Metrics.assertions);

        type cases = [
            Expect<AssertEqual<typeof fileMetrics, TestMetrics>>,
            Expect<AssertEqual<typeof block1Metrics, TestMetrics>>,
            Expect<AssertEqual<typeof block2Metrics, TestMetrics>>
        ];
    });

    it("should maintain block metrics = tests + nested blocks", () => {
        const block: TestBlock = {
            filepath: "/test.ts",
            description: "Parent Block",
            startLine: 1,
            endLine: 100,
            skip: false,
            diagnostics: [],
            tests: [
                { filepath: "/test.ts", description: "direct", startLine: 5, endLine: 10, skip: false, diagnostics: [], symbols: [], hasTypeCases: true, typeAssertionCount: 2 }
            ],
            blocks: [
                {
                    filepath: "/test.ts",
                    description: "Child Block",
                    startLine: 20,
                    endLine: 50,
                    skip: false,
                    diagnostics: [],
                    tests: [
                        { filepath: "/test.ts", description: "nested", startLine: 25, endLine: 30, skip: false, diagnostics: [], symbols: [], hasTypeCases: true, typeAssertionCount: 3 }
                    ]
                }
            ]
        };

        const opt = createTestOptions();
        const parentMetrics = calculateBlockMetrics(block, opt);
        const childMetrics = calculateBlockMetrics(block.blocks![0], opt);

        // INVARIANT: Parent total >= child total
        expect(parentMetrics.totalTests).toBeGreaterThanOrEqual(childMetrics.totalTests);

        // INVARIANT: Parent should include direct tests + child tests
        expect(parentMetrics.totalTests).toBe(1 + childMetrics.totalTests);
        expect(parentMetrics.assertions).toBe(2 + childMetrics.assertions);

        type cases = [
            Expect<AssertEqual<typeof parentMetrics, TestMetrics>>,
            Expect<AssertEqual<typeof childMetrics, TestMetrics>>
        ];
    });
});
