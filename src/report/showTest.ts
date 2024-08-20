import chalk from "chalk";
import {  getErrorDiagnostics, TypeTest } from "src/ast";
import { AsOption } from "src/cli";
import { showDiagnostic } from "./showDiagnostic";


export const showTest = (test: TypeTest, opt: AsOption<"test">) => {
  const testErrors = getErrorDiagnostics(test.diagnostics, opt);

  const status = testErrors.length > 0
  ? chalk.bold.red(` ⛒ `)
  : test.diagnostics.length > 0
  ? chalk.bold.yellow(` ⚠️ `)
  : chalk.bold.green(` ✔ `);

  const testLine = `          [${status}] ${test.description}`;

  if(!opt["only-errors"] || testErrors.length > 0) {
    console.log(testLine);
  }
  for (const err of testErrors) {
    showDiagnostic(err, test.filepath, opt);
  }
  
}
