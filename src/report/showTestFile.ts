import chalk from "chalk";
import { getDiagnosticsOutsideBlocks, getErrorDiagnostics, getProjectRoot, getWarningDiagnostics, TestFile } from "src/ast";
import { AsOption } from "src/cli";
import { fileLink } from "src/utils";
import { prettyPath } from "./prettyPath";
import { relative } from "pathe";
import { showTestBlock } from "./showTestBlock";

export const showTestFile = (
  test: TestFile, 
  opt: AsOption<"test-files">
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
        description: "Areas OUTSIDE of tests blocks",
        tests: [],
        startLine: 0,
        endLine: 0,
        diagnostics: outsideErrors
      },
      ...test.blocks
    ]
  }

  const fileStatusIcon = hasErrors
  ? chalk.red.bold(`⤬`)
  : chalk.green.bold(`✓`);
  const file = relative(getProjectRoot(), test.filepath);

  const testCount = !opt.verbose && !opt["show-passing"]
    ? chalk.dim(`(${test.blocks.flatMap(b => b.tests).length})`)
    : "";

  // FILE LINE
  console.log(` ${fileStatusIcon}  ${fileLink(prettyPath(file), test.filepath)} ${testCount} ${warningMsg}`);

  if(hasErrors || opt["show-passing"] || opt.verbose) {
    for (const block of test.blocks) {
      showTestBlock(block, opt);
    }
  }

}
