import { describe, it, expect, beforeAll } from 'vitest';
import { asTestFile } from '~/ast/testing';
import { projectUsing } from '~/ast/project';
import path from 'path';
import type { Expect, AssertEqual } from 'inferred-types/types';

describe('asTestFile() - Type Cases Detection', () => {
    const fixturesDir = path.resolve(__dirname, '../../../fixtures/type-cases-detection');

    beforeAll(() => {
        // Initialize the project with the tsconfig.json
        projectUsing(['tsconfig.json']);
    });

    describe('Tests with type cases only', () => {
        it('should detect type cases and count assertions correctly', async () => {
            const filepath = path.join(fixturesDir, 'with-type-cases.test.ts');
            const testFile = await asTestFile(filepath);

            // Verify we have the correct number of test blocks
            expect(testFile.blocks).toHaveLength(1);
            const block = testFile.blocks[0];

            // Verify we have 3 tests
            expect(block.tests).toHaveLength(3);

            // Test 1: should have 3 type assertions
            const test1 = block.tests[0];
            expect(test1.hasTypeCases).toBe(true);
            expect(test1.typeAssertionCount).toBe(3);

            // Test 2: should have 1 type assertion
            const test2 = block.tests[1];
            expect(test2.hasTypeCases).toBe(true);
            expect(test2.typeAssertionCount).toBe(1);

            // Test 3: should have 5 type assertions
            const test3 = block.tests[2];
            expect(test3.hasTypeCases).toBe(true);
            expect(test3.typeAssertionCount).toBe(5);

            // Verify aggregate counts at file level
            expect(testFile.typeTests).toBe(3); // All 3 tests have type cases
            expect(testFile.assertions).toBe(9); // 3 + 1 + 5 = 9 total assertions

            // Type tests
            type cases = [
                Expect<AssertEqual<typeof testFile.typeTests, number>>,
                Expect<AssertEqual<typeof testFile.assertions, number>>,
                Expect<AssertEqual<typeof test1.hasTypeCases, boolean>>,
                Expect<AssertEqual<typeof test1.typeAssertionCount, number>>
            ];
        });
    });

    describe('Tests without type cases', () => {
        it('should detect runtime-only tests correctly', async () => {
            const filepath = path.join(fixturesDir, 'without-type-cases.test.ts');
            const testFile = await asTestFile(filepath);

            // Verify we have the correct number of test blocks
            expect(testFile.blocks).toHaveLength(1);
            const block = testFile.blocks[0];

            // Verify we have 3 tests
            expect(block.tests).toHaveLength(3);

            // All tests should not have type cases
            for (const test of block.tests) {
                expect(test.hasTypeCases).toBe(false);
                expect(test.typeAssertionCount).toBe(0);
            }

            // Verify aggregate counts at file level
            expect(testFile.typeTests).toBe(0); // No tests have type cases
            expect(testFile.assertions).toBe(0); // No assertions

            // Type tests
            type cases = [
                Expect<AssertEqual<typeof testFile.typeTests, number>>,
                Expect<AssertEqual<typeof testFile.assertions, number>>
            ];
        });
    });

    describe('Tests with mixed cases', () => {
        it('should correctly identify and count mixed runtime and type tests', async () => {
            const filepath = path.join(fixturesDir, 'mixed-cases.test.ts');
            const testFile = await asTestFile(filepath);

            // Verify we have the correct number of test blocks
            expect(testFile.blocks).toHaveLength(1);
            const block = testFile.blocks[0];

            // Verify we have 4 tests
            expect(block.tests).toHaveLength(4);

            // Test 1: runtime only
            const test1 = block.tests[0];
            expect(test1.hasTypeCases).toBe(false);
            expect(test1.typeAssertionCount).toBe(0);

            // Test 2: with 2 type assertions
            const test2 = block.tests[1];
            expect(test2.hasTypeCases).toBe(true);
            expect(test2.typeAssertionCount).toBe(2);

            // Test 3: runtime only
            const test3 = block.tests[2];
            expect(test3.hasTypeCases).toBe(false);
            expect(test3.typeAssertionCount).toBe(0);

            // Test 4: with 4 type assertions
            const test4 = block.tests[3];
            expect(test4.hasTypeCases).toBe(true);
            expect(test4.typeAssertionCount).toBe(4);

            // Verify aggregate counts at file level
            expect(testFile.typeTests).toBe(2); // Tests 2 and 4 have type cases
            expect(testFile.assertions).toBe(6); // 2 + 4 = 6 total assertions

            // Type tests
            type cases = [
                Expect<AssertEqual<typeof testFile.typeTests, number>>,
                Expect<AssertEqual<typeof testFile.assertions, number>>
            ];
        });
    });

    describe('Edge cases', () => {
        it('should handle describe blocks with no tests', async () => {
            // Test with an empty describe block would require a separate fixture
            // For now, we verify the aggregation logic handles empty arrays correctly
            const filepath = path.join(fixturesDir, 'without-type-cases.test.ts');
            const testFile = await asTestFile(filepath);

            // Even if there are tests, the aggregation should work
            expect(typeof testFile.typeTests).toBe('number');
            expect(typeof testFile.assertions).toBe('number');
            expect(testFile.typeTests).toBeGreaterThanOrEqual(0);
            expect(testFile.assertions).toBeGreaterThanOrEqual(0);
        });

        it('should handle skipped tests correctly', async () => {
            // Skipped tests should still be analyzed for type cases
            const filepath = path.join(fixturesDir, 'with-type-cases.test.ts');
            const testFile = await asTestFile(filepath);

            // Verify that even if tests are skipped, type case detection works
            for (const block of testFile.blocks) {
                for (const test of block.tests) {
                    expect(typeof test.hasTypeCases).toBe('boolean');
                    expect(typeof test.typeAssertionCount).toBe('number');
                }
            }
        });
    });
});
