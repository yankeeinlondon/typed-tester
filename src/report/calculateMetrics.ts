import type { TestBlock, TestFile, TypeTest } from "~/types";
import type { AsOption } from "~/cli";
import { getErrorDiagnostics } from "~/ast";

/**
 * Unified metrics structure used across all hierarchy levels
 * (file, describe block, and individual test)
 */
export interface TestMetrics {
    /**
     * Total number of it() blocks at this level and below (recursively)
     */
    totalTests: number;

    /**
     * Number of tests that contain `type cases = [...]` declarations
     */
    typeTests: number;

    /**
     * Total number of type assertions across all `type cases` arrays
     */
    assertions: number;

    /**
     * Number of tests marked with .skip
     */
    skippedTests: number;

    /**
     * Total tests minus skipped tests
     */
    activeTests: number;

    /**
     * Number of tests with type errors (describe/block level only)
     */
    failingTests: number;
}

/**
 * Calculate metrics for a single test (leaf level).
 * This is the foundation of all metric calculations.
 */
export function calculateTestMetrics(test: TypeTest, opt: AsOption<"test">): TestMetrics {
    const hasErrors = getErrorDiagnostics(test.diagnostics as any[], opt).length > 0;

    return {
        totalTests: 1,
        typeTests: test.hasTypeCases ? 1 : 0,
        assertions: test.typeAssertionCount,
        skippedTests: test.skip ? 1 : 0,
        activeTests: test.skip ? 0 : 1,
        failingTests: hasErrors ? 1 : 0
    };
}

/**
 * Calculate metrics for a describe block (recursive).
 * Aggregates metrics from direct tests + nested describe blocks.
 */
export function calculateBlockMetrics(block: TestBlock, opt: AsOption<"test">): TestMetrics {
    // Calculate metrics from direct tests at this level
    const directMetrics = block.tests.reduce(
        (acc, test) => {
            const testMetrics = calculateTestMetrics(test, opt);
            return {
                totalTests: acc.totalTests + testMetrics.totalTests,
                typeTests: acc.typeTests + testMetrics.typeTests,
                assertions: acc.assertions + testMetrics.assertions,
                skippedTests: acc.skippedTests + testMetrics.skippedTests,
                activeTests: acc.activeTests + testMetrics.activeTests,
                failingTests: acc.failingTests + testMetrics.failingTests
            };
        },
        {
            totalTests: 0,
            typeTests: 0,
            assertions: 0,
            skippedTests: 0,
            activeTests: 0,
            failingTests: 0
        }
    );

    // If there are nested blocks, recursively calculate their metrics
    if (block.blocks && block.blocks.length > 0) {
        const nestedMetrics = block.blocks.reduce(
            (acc, nestedBlock) => {
                const blockMetrics = calculateBlockMetrics(nestedBlock, opt);
                return {
                    totalTests: acc.totalTests + blockMetrics.totalTests,
                    typeTests: acc.typeTests + blockMetrics.typeTests,
                    assertions: acc.assertions + blockMetrics.assertions,
                    skippedTests: acc.skippedTests + blockMetrics.skippedTests,
                    activeTests: acc.activeTests + blockMetrics.activeTests,
                    failingTests: acc.failingTests + blockMetrics.failingTests
                };
            },
            {
                totalTests: 0,
                typeTests: 0,
                assertions: 0,
                skippedTests: 0,
                activeTests: 0,
                failingTests: 0
            }
        );

        // Combine direct and nested metrics
        return {
            totalTests: directMetrics.totalTests + nestedMetrics.totalTests,
            typeTests: directMetrics.typeTests + nestedMetrics.typeTests,
            assertions: directMetrics.assertions + nestedMetrics.assertions,
            skippedTests: directMetrics.skippedTests + nestedMetrics.skippedTests,
            activeTests: directMetrics.activeTests + nestedMetrics.activeTests,
            failingTests: directMetrics.failingTests + nestedMetrics.failingTests
        };
    }

    // No nested blocks, return direct metrics
    return directMetrics;
}

/**
 * Calculate metrics for entire test file.
 * Aggregates metrics from all top-level describe blocks.
 */
export function calculateFileMetrics(file: TestFile, opt: AsOption<"test">): TestMetrics {
    // Aggregate metrics from all top-level blocks
    return file.blocks.reduce(
        (acc, block) => {
            const blockMetrics = calculateBlockMetrics(block, opt);
            return {
                totalTests: acc.totalTests + blockMetrics.totalTests,
                typeTests: acc.typeTests + blockMetrics.typeTests,
                assertions: acc.assertions + blockMetrics.assertions,
                skippedTests: acc.skippedTests + blockMetrics.skippedTests,
                activeTests: acc.activeTests + blockMetrics.activeTests,
                failingTests: acc.failingTests + blockMetrics.failingTests
            };
        },
        {
            totalTests: 0,
            typeTests: 0,
            assertions: 0,
            skippedTests: 0,
            activeTests: 0,
            failingTests: 0
        }
    );
}
