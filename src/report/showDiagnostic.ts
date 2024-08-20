import chalk from "chalk";
import { FileDiagnostic } from "src/ast";
import { AsOption } from "src/cli";
import {  tsCodeLink } from "src/utils";


export const showDiagnostic = (
  diag: FileDiagnostic,
  filepath: string,
  opt: AsOption<"test-files">
) => {

  const isError = !opt.warn.includes(diag.code);

  const status = isError
  ? chalk.bold.red(` ⛒ `)
  : chalk.bold.yellow(` ⚠️ `);


  if (isError) {
    console.log(chalk.dim(`           - [ ${chalk.italic("cd:")} ${tsCodeLink(diag.code)}, ${chalk.italic("l:")} ${diag.loc.lineNumber}, ${chalk.italic.dim("col:")} ${diag.loc.column} ] ${chalk.reset(diag.msg)} `));
  }
}
