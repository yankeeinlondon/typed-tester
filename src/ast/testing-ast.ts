import { Project, SyntaxKind, Symbol, SourceFile } from "ts-morph";
import { TestBlock, TestFile, TypeTest } from "./testing-ast-types";
import { asFileDiagnostic, getFileDiagnostics } from "./files";
import { isTsMorphDiagnostic } from "src/type-guards";
import {  asSymbolReference } from "./symbols";
import { SymbolReference } from "./symbol-ast-types";
import { isString } from "inferred-types";
import { getProject } from "./project";
import { getDiagnosticsBetweenLines } from "./diagnostics";

const TEST_SYMBOLS = ["it", "test", "describe", "Expect", "Equal", "cases", "NotEqual", "expect"]

const removeTestSymbols = (symbols: SymbolReference[]) => {{
  return symbols.filter(i => !TEST_SYMBOLS.includes(i.name))
}}

/**
 * **analyzeTestFile**`(filePath)`
 * 
 * Returns the structure of a test file; first by test blocks (e.g., describe blocks)
 * and then by the individual tests.
 */
export function analyzeTestFile(filepath: string | SourceFile): TestFile {
    const sourceFile = isString(filepath)
      ? getProject().addSourceFileAtPath(filepath)
      : filepath;

    const diagnostics = getFileDiagnostics(filepath);

    const blocks: TestBlock[] = [];

    // Find all `describe`, `it`, `test`, etc., function calls
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const callExpression of callExpressions) {
        const expressionText = callExpression.getExpression().getText();

        if (expressionText === "describe") {
            // Handle group block (describe block)
            const description = callExpression.getArguments()[0].getText().replace(/['"]/g, "");
            const startLine = callExpression.getStartLineNumber();
            const endLine = callExpression.getEndLineNumber();

            const tests: TypeTest[] = [];

            const blockBody = callExpression.getArguments()[1].asKindOrThrow(SyntaxKind.ArrowFunction).getBody();
            if (blockBody) {
                const innerCalls = blockBody.getDescendantsOfKind(SyntaxKind.CallExpression);
                for (const innerCall of innerCalls) {
                    const innerExpressionText = innerCall.getExpression().getText();

                    if (
                      innerExpressionText === "it" || 
                      innerExpressionText === "test" 
                    ) {
                        // Handle test block inside describe
                        const testDescription = innerCall.getArguments()[0].getText().replace(/['"]/g, "");
                        const testStartLine = innerCall.getStartLineNumber();
                        const testEndLine = innerCall.getEndLineNumber();
                        const symbols = innerCall.getDescendantsOfKind(SyntaxKind.Identifier).map(id => id.getSymbol()).filter(i => i) as Symbol[];

                        tests.push({
                            description: testDescription,
                            startLine: testStartLine,
                            endLine: testEndLine,
                            diagnostics: getDiagnosticsBetweenLines(
                              filepath, 
                              testStartLine, 
                              testEndLine
                            ),
                            symbols: removeTestSymbols(
                              symbols.map(i => asSymbolReference(i))
                            ),
                        });
                    }
                }
            }

            blocks.push({
                description: description,
                startLine: startLine,
                endLine: endLine,
                diagnostics:
                  callExpression.getSourceFile()
                    .getPreEmitDiagnostics()
                    .filter(d => isTsMorphDiagnostic(d))
                    .map(d => asFileDiagnostic(d)),
                tests: tests,
            });
        }
    }

    return {
      filepath: filepath,
      blocks,
    };
}
