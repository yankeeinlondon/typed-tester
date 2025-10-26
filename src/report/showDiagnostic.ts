import type { FileDiagnostic } from "../types";
import type { AsOption } from "../cli";
import chalk from "chalk";
import { tsCodeLink } from "../utils";

export function showDiagnostic(
    diag: FileDiagnostic,
    _filepath: string,
    opt: AsOption<"test">,
    isOutsideTest = false
) {
    // Type issues outside tests are WARNINGS (not errors)
    // Type issues inside tests are ERRORS (test failures)
    const isWarning = isOutsideTest || opt.warn.includes(diag.code);

    const status = isWarning
        ? chalk.bold.yellow(` ⚠️ `)
        : chalk.bold.red(` ⛒ `);

    // Show both warnings and errors (previously only showed errors)
    console.log(chalk.dim(`           - [ ${status}, ${chalk.italic("cd:")} ${tsCodeLink(diag.code)}, ${chalk.italic("l:")} ${diag.loc.lineNumber}, ${chalk.italic.dim("col:")} ${diag.loc.column} ] ${chalk.reset(diag.msg)} `));
}
