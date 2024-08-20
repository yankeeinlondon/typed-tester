import {  SyntaxKind, Symbol, SourceFile } from "ts-morph";
import { SymbolFilterCallback, TestBlock, TestFile, TestFileOptions, TypeTest } from "./testing-types";
import {  getFileDiagnostics, getImportsForFile } from "./files";
import {  asSymbolReference } from "./symbols";
import { isString } from "inferred-types";
import { getProject } from "./project";
import { getDiagnosticsBetweenLines } from "./diagnostics";
import { getHasher } from "src/cache";
import { readFile, stat } from "fs/promises";
import { relativeFile } from "src/utils";


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
    ctime: meta.ctime,
    hash: h(contents.trim())
  }
}

const calculateTestLines  = (blocks: TestBlock[]) => {
  return blocks.flatMap(b => b.endLine-b.startLine).reduce(
    (sum, val) => sum + val, 0
  )
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
    cacheData: options?.cacheData || await cacheData(sourceFile)
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
      const skip = expressionText.includes('.skip');

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
            innerExpressionText === "test" || 
            innerExpressionText === "it.skip" || 
            innerExpressionText === "test.skip"
          ) {
            // Handle test block inside describe
            const testDescription = innerCall.getArguments()[0].getText().replace(/['"]/g, "");
            const testStartLine = innerCall.getStartLineNumber();
            const testEndLine = innerCall.getEndLineNumber();
            const testSkip = innerExpressionText.includes('.skip');
            const symbols = innerCall.getDescendantsOfKind(SyntaxKind.Identifier).map(id => id.getSymbol()).filter(i => i) as Symbol[];

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
            });
          }
        }
      }

      blocks.push({
        filepath: relativeFile(sourceFile.getFilePath()),
        description: description,
        startLine: startLine,
        endLine: endLine,
        skip: skip,
        diagnostics: blockDiagnostics,
        tests: tests,
      });
    }
  }

  return {
    filepath: relativeFile(sourceFile.getFilePath()),
    importSymbols: getImportsForFile(sourceFile).filter(i => !i.isExternalSource),
    ctime: config.cacheData.ctime,
    hash: config.cacheData.hash,
    size: config.cacheData.size,
    skip: blocks.every(b => b.skip) || blocks.flatMap(b => b.tests).every(t => t.skip),
    skippedTests: blocks.reduce(
      (sum,block) => sum + (block.skip ? block.tests.length : 0)
      + (block.skip ? 0 : block.tests.filter(t => t.skip).length)
      ,
      0
    ),
    blocks,
    duration: performance.now() - start,
    testLines: calculateTestLines(blocks)
  };
}



export const isVerySlowTest = (test: TestFile) => {
  const msPerFile = Math.floor(test.duration);
  const microSecPerLine = msPerFile === 0 || test.testLines === 0
    ? 0 
    : Math.floor(1000*(test.duration/test.testLines));
  
  return (
    test.duration > 300 || microSecPerLine > 2500
  )
}

export const isSlowTest = (test: TestFile) => {
  const msPerFile = Math.floor(test.duration);
  const microSecPerLine = msPerFile === 0 || test.testLines === 0
    ? 0 
    : Math.floor(1000*(test.duration/test.testLines));
  
  return (
    test.duration > 100 && microSecPerLine > 500
  )
}
