import type { FileDiagnostic, TypeTest } from "../types";
import type { AsOption } from "../cli";
import chalk from "chalk";
import { getErrorDiagnostics } from "../ast";
import { getTerminalTheme } from "../utils";
import { showDiagnostic } from "./showDiagnostic";

export function showTest(test: TypeTest, opt: AsOption<"test">, hasTypeTests = true, indentLevel = 2) {
    const testErrors = getErrorDiagnostics(test.diagnostics as FileDiagnostic[], opt);
    const theme = getTerminalTheme();

    const status = test.skip
        ? chalk.bold.dim(` ⇣ `)
        : testErrors.length > 0
            ? hasTypeTests
                ? chalk.bold.red(` ⛒ `)
                : theme === "light"
                    ? chalk.hex("#CD5C5C").bold(` ⛒ `)
                    : chalk.hex("#8B0000").bold(` ⛒ `)
            : test.diagnostics.length > 0
                ? hasTypeTests
                    ? chalk.bold.yellow(` ⚠️ `)
                    : theme === "light"
                        ? chalk.hex("#DAA520").bold(` ⚠️ `)
                        : chalk.hex("#996600").bold(` ⚠️ `)
                : hasTypeTests
                    ? chalk.bold.green(` ✔ `)
                    : theme === "light"
                        ? chalk.hex("#AAAAAA").bold(` ✔ `)
                        : chalk.hex("#555555").bold(` ✔ `);

    // Calculate indent based on hierarchy level
    const indent = "    ".repeat(indentLevel + 1); // +1 for test level
    const testLine = `${indent}[${status}] ${test.description}`;

    if (!opt["only-errors"] || testErrors.length > 0) {
        console.log(testLine);
    }
    for (const err of testErrors) {
        showDiagnostic(err, test.filepath, opt);
    }
}
