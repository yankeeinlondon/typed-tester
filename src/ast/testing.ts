import type { SourceFile, Symbol } from "ts-morph";
import type { SymbolFilterCallback, TestBlock, TestFile, TestFileOptions, TypeTest } from "../types/testing-types";
import { isString } from "inferred-types";
import { relativeFile } from "~/utils";
import { SyntaxKind } from "ts-morph";
import { getDiagnosticsBetweenLines } from "./diagnostics";
import { getFileDiagnostics, getImportsForFile } from "./files";
import { getProject } from "./project";
import { asSymbolReference } from "./symbols";

const symbolsFilter: SymbolFilterCallback = (sym) => {
    return sym.kind === "type-defn";
};

function calculateTestLines(blocks: TestBlock[]) {
    return blocks.flatMap(b => b.endLine - b.startLine).reduce(
        (sum, val) => sum + val,
        0
    );
}

/**
 * Detects and counts type assertions in a test block.
 * Looks for `type cases = [...]` declarations and counts the tuple elements.
 */
function detectTypeCases(testBody: any): { hasTypeCases: boolean; typeAssertionCount: number } {
    try {
        // Look for TypeAliasDeclaration nodes with name "cases"
        const typeAliases = testBody.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration);

        for (const typeAlias of typeAliases) {
            const name = typeAlias.getName();
            if (name === "cases") {
                // Found a `type cases = [...]` declaration
                const typeNode = typeAlias.getTypeNode();

                if (typeNode && typeNode.getKind() === SyntaxKind.TupleType) {
                    // Get the actual tuple elements (excluding commas and other syntax)
                    const elements = typeNode.getElements();
                    return {
                        hasTypeCases: true,
                        typeAssertionCount: elements.length
                    };
                }

                // If we found a "cases" type alias but couldn't count elements,
                // still mark it as having type cases
                return {
                    hasTypeCases: true,
                    typeAssertionCount: 0
                };
            }
        }
    }
    catch (error) {
        // If there's any error in detection, return safe defaults
        console.error("Error detecting type cases:", error);
    }

    return {
        hasTypeCases: false,
        typeAssertionCount: 0
    };
}

/**
 * Recursively processes a describe block and its nested children.
 * This function extracts:
 * - Direct "it" blocks as tests
 * - Nested "describe" blocks as child blocks
 */
function processDescribeBlock(
    callExpression: any,
    filepath: string | SourceFile,
    fileDiagnostics: readonly FileDiagnostic[],
    config: { symbolsFilter: SymbolFilterCallback }
): TestBlock {
    const expressionText = callExpression.getExpression().getText();
    const description = callExpression.getArguments()[0].getText().replace(/['"]/g, "");
    const startLine = callExpression.getStartLineNumber();
    const endLine = callExpression.getEndLineNumber();
    const skip = expressionText.includes(".skip");

    const blockDiagnostics = getDiagnosticsBetweenLines(
        fileDiagnostics,
        startLine,
        endLine
    );

    const tests: TypeTest[] = [];
    const nestedBlocks: TestBlock[] = [];
    const blockBody = callExpression.getArguments()[1].asKindOrThrow(SyntaxKind.ArrowFunction).getBody();

    if (blockBody) {
        // Get ONLY the immediate children of this describe block's body
        // Use getChildrenOfKind instead of getDescendantsOfKind to avoid getting deeply nested calls
        const statements = blockBody.getKind() === SyntaxKind.Block
            ? blockBody.getStatements()
            : [blockBody];

        for (const statement of statements) {
            // Find call expressions in this statement
            const calls = statement.getDescendantsOfKind(SyntaxKind.CallExpression);

            for (const call of calls) {
                const callText = call.getExpression().getText();

                // Check if this is a direct child (not nested deeper)
                // We do this by checking if the call's parent chain includes another describe/it
                let isDirectChild = true;
                let parent = call.getParent();

                while (parent && parent !== statement) {
                    if (parent.getKind() === SyntaxKind.CallExpression) {
                        const parentCallText = (parent as any).getExpression()?.getText();
                        if (
                            parentCallText === "describe" ||
                            parentCallText === "describe.skip" ||
                            parentCallText === "it" ||
                            parentCallText === "it.skip" ||
                            parentCallText === "test" ||
                            parentCallText === "test.skip"
                        ) {
                            isDirectChild = false;
                            break;
                        }
                    }
                    parent = parent.getParent();
                }

                if (!isDirectChild) {
                    continue;
                }

                if (callText === "describe" || callText === "describe.skip") {
                    // Recursively process nested describe block
                    const nestedBlock = processDescribeBlock(call, filepath, fileDiagnostics, config);
                    nestedBlocks.push(nestedBlock);
                }
                else if (
                    callText === "it" ||
                    callText === "test" ||
                    callText === "it.skip" ||
                    callText === "test.skip"
                ) {
                    // Handle test block (it/test)
                    const testDescription = call.getArguments()[0].getText().replace(/['"]/g, "");
                    const testStartLine = call.getStartLineNumber();
                    const testEndLine = call.getEndLineNumber();
                    const testSkip = callText.includes(".skip");
                    const symbols = call.getDescendantsOfKind(SyntaxKind.Identifier).map(id => id.getSymbol()).filter(i => i) as Symbol[];

                    // Detect type cases in the test body
                    const testBodyArg = call.getArguments()[1];
                    const testBody = testBodyArg?.asKind(SyntaxKind.ArrowFunction)?.getBody();
                    const typeCasesInfo = testBody ? detectTypeCases(testBody) : { hasTypeCases: false, typeAssertionCount: 0 };

                    tests.push({
                        filepath: isString(filepath) ? filepath : filepath.getFilePath(),
                        description: testDescription,
                        startLine: testStartLine,
                        endLine: testEndLine,
                        skip: testSkip,
                        diagnostics: getDiagnosticsBetweenLines(
                            filepath,
                            testStartLine,
                            testEndLine
                        ),
                        symbols: symbols
                            .map(i => asSymbolReference(i))
                            .filter(config.symbolsFilter),
                        hasTypeCases: typeCasesInfo.hasTypeCases,
                        typeAssertionCount: typeCasesInfo.typeAssertionCount,
                    });
                }
            }
        }
    }

    return {
        filepath: relativeFile(isString(filepath) ? filepath : filepath.getFilePath()),
        description,
        startLine,
        endLine,
        skip,
        diagnostics: blockDiagnostics,
        tests,
        blocks: nestedBlocks.length > 0 ? nestedBlocks : undefined,
    };
}

/**
 * **asTestFile**`(filePath, options)` -> `Promise<TestFile>`
 *
 * Providing a filepath to a file, this function will convert
 * it into a `TestFile` structure.
 */
export async function asTestFile(
    filepath: string | SourceFile,
    options?: TestFileOptions
): Promise<TestFile> {
    const start = performance.now();
    const sourceFile = isString(filepath)
        ? getProject().addSourceFileAtPath(filepath)
        : filepath;

    const config = {
        symbolsFilter: options?.symbolsFilter || symbolsFilter,
        cacheData: {}
    };

    const fileDiagnostics = getFileDiagnostics(filepath);
    const blocks: TestBlock[] = [];

    // Find ONLY top-level describe blocks (not nested ones)
    // We'll process nesting recursively within processDescribeBlock
    const statements = sourceFile.getStatements();

    for (const statement of statements) {
        // Find all call expressions in this top-level statement
        const calls = statement.getDescendantsOfKind(SyntaxKind.CallExpression);

        for (const call of calls) {
            const callText = call.getExpression().getText();

            if (callText === "describe" || callText === "describe.skip") {
                // Check if this is a top-level describe (not nested in another describe)
                let isTopLevel = true;
                let parent = call.getParent();

                while (parent && parent !== statement) {
                    if (parent.getKind() === SyntaxKind.CallExpression) {
                        const parentCallText = (parent as any).getExpression()?.getText();
                        if (parentCallText === "describe" || parentCallText === "describe.skip") {
                            isTopLevel = false;
                            break;
                        }
                    }
                    parent = parent.getParent();
                }

                if (isTopLevel) {
                    const block = processDescribeBlock(call, filepath, fileDiagnostics, config);
                    blocks.push(block);
                }
            }
        }
    }

    // Calculate aggregate type test metrics (recursively count from all blocks)
    function countTests(blocks: TestBlock[]): { tests: TypeTest[]; typeTests: number; assertions: number } {
        let allTests: TypeTest[] = [];
        let typeTestCount = 0;
        let assertionCount = 0;

        for (const block of blocks) {
            // Add tests from this block
            allTests = allTests.concat(block.tests);
            typeTestCount += block.tests.filter(t => t.hasTypeCases).length;
            assertionCount += block.tests.reduce((sum, t) => sum + t.typeAssertionCount, 0);

            // Recursively count from nested blocks
            if (block.blocks && block.blocks.length > 0) {
                const nested = countTests(block.blocks);
                allTests = allTests.concat(nested.tests);
                typeTestCount += nested.typeTests;
                assertionCount += nested.assertions;
            }
        }

        return { tests: allTests, typeTests: typeTestCount, assertions: assertionCount };
    }

    const { tests: allTests, typeTests, assertions } = countTests(blocks);

    return {
        filepath: relativeFile(sourceFile.getFilePath()),
        importSymbols: getImportsForFile(sourceFile).filter(i => !i.isExternalSource),
        skip: blocks.every(b => b.skip) || allTests.every(t => t.skip),
        skippedTests: allTests.filter(t => t.skip).length,
        blocks,
        duration: performance.now() - start,
        testLines: calculateTestLines(blocks),
        typeTests,
        assertions
    };
}

export function isVerySlowTest(test: TestFile) {
    const msPerFile = Math.floor(test.duration);
    const microSecPerLine = msPerFile === 0 || test.testLines === 0
        ? 0
        : Math.floor(1000 * (test.duration / test.testLines));

    return (
        test.duration > 300 || microSecPerLine > 2500
    );
}

export function isSlowTest(test: TestFile) {
    const msPerFile = Math.floor(test.duration);
    const microSecPerLine = msPerFile === 0 || test.testLines === 0
        ? 0
        : Math.floor(1000 * (test.duration / test.testLines));

    return (
        test.duration > 100 && microSecPerLine > 500
    );
}
