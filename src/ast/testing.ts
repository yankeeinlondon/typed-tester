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
    } catch (error) {
        // If there's any error in detection, return safe defaults
        console.error("Error detecting type cases:", error);
    }

    return {
        hasTypeCases: false,
        typeAssertionCount: 0
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

    // Find all `describe`, `it`, `test`, etc., function calls
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const callExpression of callExpressions) {
        const expressionText = callExpression.getExpression().getText();

        if (expressionText === "describe" || expressionText === "describe.skip") {
            // Handle group block (describe block)
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
            const blockBody = callExpression.getArguments()[1].asKindOrThrow(SyntaxKind.ArrowFunction).getBody();

            if (blockBody) {
                const innerCalls = blockBody.getDescendantsOfKind(SyntaxKind.CallExpression);
                for (const innerCall of innerCalls) {
                    const innerExpressionText = innerCall.getExpression().getText();

                    if (
                        innerExpressionText === "it"
                        || innerExpressionText === "test"
                        || innerExpressionText === "it.skip"
                        || innerExpressionText === "test.skip"
                    ) {
                        // Handle test block inside describe
                        const testDescription = innerCall.getArguments()[0].getText().replace(/['"]/g, "");
                        const testStartLine = innerCall.getStartLineNumber();
                        const testEndLine = innerCall.getEndLineNumber();
                        const testSkip = innerExpressionText.includes(".skip");
                        const symbols = innerCall.getDescendantsOfKind(SyntaxKind.Identifier).map(id => id.getSymbol()).filter(i => i) as Symbol[];

                        // Detect type cases in the test body
                        const testBodyArg = innerCall.getArguments()[1];
                        const testBody = testBodyArg?.asKind(SyntaxKind.ArrowFunction)?.getBody();
                        const typeCasesInfo = testBody ? detectTypeCases(testBody) : { hasTypeCases: false, typeAssertionCount: 0 };

                        tests.push({
                            filepath: sourceFile.getFilePath(),
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

            blocks.push({
                filepath: relativeFile(sourceFile.getFilePath()),
                description,
                startLine,
                endLine,
                skip,
                diagnostics: blockDiagnostics,
                tests,
            });
        }
    }

    // Calculate aggregate type test metrics
    const allTests = blocks.flatMap(b => b.tests);
    const typeTests = allTests.filter(t => t.hasTypeCases).length;
    const assertions = allTests.reduce((sum, test) => sum + test.typeAssertionCount, 0);

    return {
        filepath: relativeFile(sourceFile.getFilePath()),
        importSymbols: getImportsForFile(sourceFile).filter(i => !i.isExternalSource),
        skip: blocks.every(b => b.skip) || blocks.flatMap(b => b.tests).every(t => t.skip),
        skippedTests: blocks.reduce(
            (sum, block) => sum + (block.skip ? block.tests.length : 0)
                + (block.skip ? 0 : block.tests.filter(t => t.skip).length),
            0
        ),
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
