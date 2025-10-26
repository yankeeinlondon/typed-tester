import type { TestSummary } from "~/types";
import chalk from "chalk";
import { fileLink, relativeFile } from "~/utils";
import { prettyPath } from "./prettyPath";

export function showTestSummary<T extends TestSummary>(test: T) {
    console.log();
    console.log(chalk.bold(`TEST SUMMARY:`));
    console.log();

    // Show hidden files message if applicable
    if (test.hiddenFiles && test.hiddenFiles > 0) {
        const fileWord = test.hiddenFiles === 1 ? "file" : "files";
        console.log(chalk.dim(`- ${test.hiddenFiles} runtime-only ${fileWord} hidden (use ${chalk.blue("--verbose")} to show)`));
        console.log();
    }

    if (test.testsWithErrors === 0) {
        if (test.testFiles - test.skipped !== 0) {
            console.log(`- 🎉 ${chalk.green.bold("No errors!")}`);
        }
        else {
            console.log(`- no tests executed`);
        }
    }
    else {
        console.log(`- ${chalk.red.bold(test.testsWithErrors)} ${chalk.italic("of")} ${test.tests} ${chalk.bold("tests")} had errors `);
        console.log(`- ${chalk.red.bold(test.filesWithErrors)} ${chalk.italic("of")} ${chalk.bold(test.testFiles)} ${chalk.bold("test files")} had errors`);
    }

    // Display type test and assertion metrics
    if (test.tests > 0) {
        const typeTestsText = test.typeTests === 1 ? "test has" : "tests have";
        const assertionsText = test.assertions === 1 ? "assertion" : "assertions";
        console.log(
            `- ${chalk.cyan.bold(test.typeTests)} ${chalk.italic("of")} ${test.tests} ${typeTestsText} type tests `
            + `(${chalk.cyan.bold(test.assertions)} total ${assertionsText})`
        );
    }

    if (test.skipped > 0) {
        console.log(`- ${chalk.yellowBright.bold(test.skipped)} ${test.skipped === 1 ? "test was" : "tests were"} skipped`);
    }
    if (test.filesWithWarnings !== 0) {
        console.log(`- ${chalk.yellowBright.bold(test.filesWithWarnings)} files with warnings`);
    }
    if (test.slow.length > 0) {
        console.log(`- ${chalk.yellowBright(test.slow.length)} slow files detected:`);
        for (const file of test.slow) {
            console.log(`   - ${fileLink(prettyPath(file), relativeFile(file))}`);
        }
    }
}
