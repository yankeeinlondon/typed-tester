import type { TypeTest } from "src/ast";
import type { AsOption } from "src/cli";
import type { FileDiagnostic } from "src/types";
import chalk from "chalk";
import { getErrorDiagnostics } from "src/ast";
import { showDiagnostic } from "./showDiagnostic";

export function showTest(test: TypeTest, opt: AsOption<"test">) {
    const testErrors = getErrorDiagnostics(test.diagnostics as FileDiagnostic[], opt);

    const status = test.skip
        ? chalk.bold.dim(` ⇣ `)
        : testErrors.length > 0
            ? chalk.bold.red(` ⛒ `)
            : test.diagnostics.length > 0
                ? chalk.bold.yellow(` ⚠️ `)
                : chalk.bold.green(` ✔ `);

    const testLine = `          [${status}] ${test.description}`;

    if (!opt["only-errors"] || testErrors.length > 0) {
        console.log(testLine);
    }
    for (const err of testErrors) {
        showDiagnostic(err, test.filepath, opt);
    }
}
