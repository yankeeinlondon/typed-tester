import {  SyntaxKind, Symbol, SourceFile } from "ts-morph";
import { TestBlock, TestFile, TypeTest } from "./testing-ast-types";
import {  getFileDiagnostics } from "./files";
import {  asSymbolReference } from "./symbols";
import { SymbolReference } from "./symbol-ast-types";
import { isString } from "inferred-types";
import { getProject } from "./project";
import { getDiagnosticsBetweenLines } from "./diagnostics";
import { readFileSync, statSync } from "fs";
import { getHasher } from "src/cache";
import { readFile, stat } from "fs/promises";
import { relativeFile } from "src/utils";


const TEST_SYMBOLS = ["it", "test", "describe", "Expect", "Equal", "cases", "NotEqual", "expect"]

const removeTestSymbols = (symbols: SymbolReference[]) => {{
  return symbols.filter(i => !TEST_SYMBOLS.includes(i.name))
}}

export type SymbolFilterCallback = (sym: SymbolReference) => boolean;

export type TestFileOptions = {
  /**
   * If the caller already has cache data then they can provide
   * it here to avoid to recomputing it.
   */
  cacheData?: { hash: number; atime: Date; size: number };

  /**
   * By default, the filtering function will reduce symbols
   * captured to only those whose `kind` property is "type-defn"
   * as this is typically what we're concerned with in testing
   * but you can replace this function with whatever you like.
   */
  symbolsFilter?: SymbolFilterCallback;
}

const symbolsFilter: SymbolFilterCallback = (sym) => {
  return sym.kind === "type-defn"
}

const cacheData = async (source: SourceFile) => {
  const h = getHasher();
  const file = source.getFilePath();
  const [meta, contents] = await Promise.all([
    stat(file),
    readFile(file, "utf-8")
  ]);
  return {
    size: meta.size,
    atime: meta.atime,
    hash: h(contents.trim())
  }
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
    const sourceFile = isString(filepath)
      ? getProject().addSourceFileAtPath(filepath)
      : filepath;

    const config = {
      symbolsFilter: options?.symbolsFilter || symbolsFilter,
      cacheData: options?.cacheData || await cacheData(sourceFile)
    }

    const fileDiagnostics = getFileDiagnostics(filepath);

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
                      innerExpressionText === "it" || 
                      innerExpressionText === "test" 
                    ) {
                        // Handle test block inside describe
                        const testDescription = innerCall.getArguments()[0].getText().replace(/['"]/g, "");
                        const testStartLine = innerCall.getStartLineNumber();
                        const testEndLine = innerCall.getEndLineNumber();
                        const symbols = innerCall.getDescendantsOfKind(SyntaxKind.Identifier).map(id => id.getSymbol()).filter(i => i) as Symbol[];

                        tests.push({
                            filepath: sourceFile.getFilePath(),
                            description: testDescription,
                            startLine: testStartLine,
                            endLine: testEndLine,
                            diagnostics: getDiagnosticsBetweenLines(
                              filepath, 
                              testStartLine, 
                              testEndLine
                            ),
                            symbols: symbols
                              .map(i => asSymbolReference(i))
                              .filter(config.symbolsFilter),
                        });
                    }
                }
            }

            blocks.push({
                filepath: relativeFile(sourceFile.getFilePath()),
                description: description,
                startLine: startLine,
                endLine: endLine,
                diagnostics: blockDiagnostics,
                tests: tests,
            });
        }
    }


    return {
      filepath: relativeFile(sourceFile.getFilePath()),
      atime: config.cacheData.atime,
      hash: config.cacheData.hash,
      size: config.cacheData.size,
      blocks,
    };
}
