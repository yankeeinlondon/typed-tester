import chalk from "chalk";
import { getErrorDiagnostics, getWarningDiagnostics, TestBlock } from "src/ast";
import { AsOption } from "src/cli";
import { fileLink } from "src/utils";
import { showTest } from "./showTest";
import { showDiagnostic } from "./showDiagnostic";


export const showTestBlock = (
  block: TestBlock, 
  opt: AsOption<"test">
) => {
  const errors = getErrorDiagnostics(block.diagnostics, opt);
  const warnings = getWarningDiagnostics(block.diagnostics, opt);
  const hasError = errors.length > 0;
  const skip = block.skip || block.tests.filter(t => !t.skip).length === 0;

  if ((hasError || opt["show-passing"] || opt.verbose)&& !opt.slow) {
    const blockStatusIcon = skip
      ? chalk.dim(`⇣`)
      : hasError
        ? chalk.red.bold(`⤬`)
        : chalk.green.bold(`✓`);
  
    const testDisplay = `${block.tests.length} ${chalk.italic(block.tests.length === 1 ? "test" : "tests")}`;
    const errDisplay = errors.length >  0
      ? errors.length === 1 
        ? chalk.red(`1 ${chalk.italic("error")}`) 
        : chalk.red(`${errors.length} ${chalk.italic("errors")}`)
      : chalk.green.dim.italic("no errors");
  
    const warningDisplay = warnings.length >  0
      ? warnings.length > 0
        ? ", " + chalk.yellowBright(`1 ${chalk.italic("warning")}`) 
        : ", " + chalk.yellowBright(`${warnings.length} ${chalk.italic("warnings")}`)
      : "";
  
    const blockLine = `    [ ${blockStatusIcon} ] ${fileLink(block.description, block.filepath)} [${testDisplay}, ${errDisplay}${warningDisplay}]`
    const skipBlockLine = `    [ ${blockStatusIcon} ] ${fileLink(block.description, block.filepath)}`
  
    if(skip) {
      console.log(skipBlockLine);
    } else {
      console.log(blockLine);
    }
  
    if((opt["show-passing"] || hasError ) && !skip) {
      if (block.tests.length > 0 || opt["show-passing"]) {
        for (const t of block.tests) {
          showTest(t, opt)
        }
      } else {
        for (const d of errors) {
          showDiagnostic(d, block.filepath, opt)
        }
      }
    }
  }
}
