import chalk from "chalk";
import { 
  getDiagnosticsOutsideBlocks, 
  getErrorDiagnostics, 
  getProjectRoot, 
  getWarningDiagnostics, 
  isSlowTest, 
  isVerySlowTest, 
  TestFile 
} from "src/ast";
import { AsOption } from "src/cli";
import { fileLink } from "src/utils";
import { prettyPath } from "./prettyPath";
import { relative } from "pathe";
import { showTestBlock } from "./showTestBlock";

export const showTestFile = (
  test: TestFile, 
  opt: AsOption<"test">
) => {
  /**
   * errors contained in test blocks
   */
  const blockErrors = getErrorDiagnostics(
    [
      ...test.blocks.flatMap(b => b.diagnostics)
    ],
    opt
  );
  /**
   * warnings contained in test blocks
   */
  const blockWarnings = getWarningDiagnostics(
    [
      ...test.blocks.flatMap(b => b.diagnostics)
    ],
    opt
  );
  /** errors outside test blocks */
  const outsideErrors = getErrorDiagnostics(getDiagnosticsOutsideBlocks(
    test.filepath,
    ...test.blocks
  ), opt);

  /** warnings outside test blocks */
  const outsideWarnings = getWarningDiagnostics(getDiagnosticsOutsideBlocks(
    test.filepath,
    ...test.blocks
  ), opt);

  const warningCount = opt["ignore-outside"]
  ? blockWarnings.length
  : blockWarnings.length + outsideWarnings.length;

  const hasErrors = opt["ignore-outside"]
    ? blockErrors.length > 0
    : (blockErrors.length + outsideErrors.length) > 0;

  const hasWarnings = warningCount > 0;
  const warningMsg = hasWarnings  
    ? chalk.dim.italic(`with ${chalk.reset.bold.yellow(warningCount)} warnings`)
    : "";
  
  if (!opt["ignore-outside"] && outsideErrors.length > 0) {
    test.blocks = [{
        filepath: test.filepath,
        skip: false,
        description: "Areas OUTSIDE of tests blocks",
        tests: [],
        startLine: 0,
        endLine: 0,
        diagnostics: outsideErrors
      },
      ...test.blocks
    ]
  }

  const fileStatusIcon = test.skip
  ? chalk.dim(`⇣`)
  : hasErrors
    ? chalk.red.bold(`⤬`)
    : chalk.green.bold(`✓`);
  const file = relative(getProjectRoot(), test.filepath);

  const testNumber = test.blocks.flatMap(b => b.tests).length;
  const skippedTests = test.skippedTests > 0 
    ? `, ${chalk.yellow(test.skippedTests)} ${test.skippedTests === 1 ? "test" : "tests"} skipped`
    : ""
  const testCount = !opt.verbose && !opt["show-passing"]
    ? chalk.dim(`${testNumber - test.skippedTests} tests${skippedTests}`)
    : "";

  const msPerFile = Math.floor(test.duration);
  const microSecPerLine = msPerFile === 0 || test.testLines === 0
    ? 0 
    : Math.floor(1000*(test.duration/test.testLines));
  const perfCondition = isSlowTest(test) || isVerySlowTest(test);

  const commaNoVerbose = opt.verbose ? "" : ", "
  const timingWarning = isVerySlowTest(test)
    ? `${commaNoVerbose}${chalk.red.bold(Math.floor(test.duration))}${chalk.dim.italic.red("ms")}, ${chalk.red.bold(microSecPerLine)}${chalk.dim.italic.red("μs/line")}`
    : isSlowTest(test)
      ? `${commaNoVerbose}${chalk.yellowBright.bold(msPerFile)}${chalk.dim.italic.yellowBright("ms")}, ${chalk.yellowBright.bold(microSecPerLine)}${chalk.dim.italic.yellowBright("μs/line")}`
      : opt.verbose
        ? `${chalk.gray.bold(Math.floor(test.duration))}${chalk.dim.italic.gray("ms")}, ${chalk.gray.bold(microSecPerLine)}${chalk.dim.italic.gray("μs/line")}`
        : "";

  // FILE LINE
  if (!opt.slow || perfCondition) {
    if(!opt["only-errors"] || hasErrors) {
      console.log(` ${fileStatusIcon}  ${fileLink(prettyPath(file), test.filepath)} ${chalk.dim("(")}${testCount}${timingWarning}${chalk.dim(")")} ${warningMsg}`);
      if(opt["show-symbols"]) {
        const symbols = test.importSymbols.filter(
          s => !s.isExternalSource && s.as !== "cases" && s.symbol.kind === "type-defn"
        );
        console.log(`     ${symbols.map(i => chalk.reset.bgGray.whiteBright(i.as)).join(", ")} `);
        
      }
    }
  }

  if(
    (hasErrors || opt["show-passing"] || opt.verbose) && !test.skip
  ) {
    for (const block of test.blocks) {
      showTestBlock(block, opt);
    }
  }

}
