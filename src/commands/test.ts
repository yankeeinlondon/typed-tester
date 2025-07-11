import type { AsOption } from "src/cli";
import process from "node:process";
import chalk from "chalk";
import { asTestFile, getDiagnosticsOutsideBlocks, getErrorDiagnostics, projectUsing } from "src/ast";
import { showTestFile } from "src/report/showTestFile";
import { showTestSummary } from "src/report/showTestSummary";
import { getTestFiles, msg } from "src/utils";
import { shout } from "src/utils/shout";
import type { TestFile, TestSummary } from "src/types";

function calculateTestSummary(testFiles: TestFile[], opt: AsOption<"test">): TestSummary {
  let filesWithErrors = 0;
  let testsWithErrors = 0;
  let filesWithWarnings = 0;
  let tests = 0;
  let skipped = 0;
  const slow: string[] = [];
  const withDiagnostics: string[] = [];

  for (const testFile of testFiles) {
    const allDiagnostics = testFile.blocks.flatMap(b => b.diagnostics);
    const errors = allDiagnostics.filter(d => !opt.warn.includes(d.code));
    const warnings = allDiagnostics.filter(d => opt.warn.includes(d.code));
    
    if (errors.length > 0) filesWithErrors++;
    if (warnings.length > 0) filesWithWarnings++;
    
    // Count individual tests that have errors, not total error count
    let testsWithErrorsInThisFile = 0;
    for (const block of testFile.blocks) {
      for (const test of block.tests) {
        const testErrors = test.diagnostics.filter(d => !opt.warn.includes(d.code));
        if (testErrors.length > 0) {
          testsWithErrorsInThisFile++;
        }
      }
    }
    testsWithErrors += testsWithErrorsInThisFile;
    
    tests += testFile.blocks.flatMap(b => b.tests).length;
    skipped += testFile.skippedTests;
    
    if (allDiagnostics.length > 0) {
      withDiagnostics.push(testFile.filepath);
    }
    
    // Check for slow tests (duration > 1000ms or testLines ratio indicates slowness)
    if (testFile.duration > 1000 || (testFile.duration / testFile.testLines > 10)) {
      slow.push(testFile.filepath);
    }
  }

  return {
    filesWithErrors,
    testsWithErrors,
    filesWithWarnings,
    tests,
    testFiles: testFiles.length,
    skipped,
    withDiagnostics,
    slow
  };
}

export async function test_command(opt: AsOption<"test">) {
  const start = performance.now();

  const [_project, configFile] = projectUsing(
    opt.config
      ? [opt.config]
      : [
          `test/tsconfig.json`,
          `tests/tsconfig.json`,
          `tsconfig.json`,
          `src/tsconfig.json`,
        ],
  );

  if (!opt.config) {
    shout(opt)(`- configuration for project's tests found in ${chalk.blue(configFile)}`);
  }

  let testFileList = getTestFiles();
  shout(opt)(`- there are ${chalk.bold(testFileList.length)} ${chalk.italic("test files")} across the project`);

  // filter test files
  if ((opt?.filter?.length || 0) > 0) {
    testFileList = Array.from(new Set(
      opt.filter.flatMap(f => testFileList.filter(i => i.includes(f))),
    ));
    shout(opt)(`- after applying filters [${chalk.dim(opt.filter.join(", "))}], ${chalk.bold(testFileList.length)} files remain to report on`);
  }

  const filterDesc = opt?.filter?.length > 0
    ? ` [ filter: ${chalk.dim(opt.filter.join(", "))} ]`
    : "";

  msg(opt)();
  msg(opt)(chalk.bold.green(`Test Results${filterDesc}:`));
  msg(opt)(chalk.bold.green(`---------------------------------------------`));

  // Analyze all test files directly
  const testFiles = await Promise.all(
    testFileList.map(file => asTestFile(file))
  );

  if (testFiles.length > 0 && !opt.json) {
    for (const testFile of testFiles) {
      showTestFile(testFile, opt);
    }

    const summary = calculateTestSummary(testFiles, opt);
    showTestSummary(summary);
  }
  else if (!opt.json) {
    msg(opt)(`- no test files found with the give filter ${filterDesc}`);
  }

  if (!opt.verbose) {
    msg(opt)();
    msg(opt)(`- use ${chalk.blue("--verbose")} to get more details`);
    if ((!opt["show-passing"])) {
      msg(opt)(`- use ${chalk.blue("--show-passing")} to show passing tests (not just erroring tests)`);
    }
  }

  if (opt.json) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(testFiles));
  }

  // Determine exit code based on error types
  let exitCode = 0;
  const summary = calculateTestSummary(testFiles, opt);
  
  if (summary.filesWithErrors > 0) {
    // Check if there are errors outside test blocks
    let hasErrorsOutsideBlocks = false;
    let hasErrorsInsideBlocks = false;

    for (const testFile of testFiles) {
      // Get all error diagnostics for this file
      const allErrors = getErrorDiagnostics(testFile.filepath, opt);

      if (allErrors.length > 0) {
        const allBlocks = testFile.blocks;

        // Get errors outside test blocks
        const errorsOutside = getDiagnosticsOutsideBlocks(allErrors, ...allBlocks);

        if (errorsOutside.length > 0) {
          hasErrorsOutsideBlocks = true;
        }

        if (allErrors.length > errorsOutside.length) {
          hasErrorsInsideBlocks = true;
        }

        // Early exit if we've found both types
        if (hasErrorsInsideBlocks && hasErrorsOutsideBlocks) {
          break;
        }
      }
    }

    if (hasErrorsInsideBlocks) {
      exitCode = 2;
    }
    else if (hasErrorsOutsideBlocks) {
      exitCode = 1;
    }
  }

  const duration = performance.now() - start;
  if (!opt.quiet) {
    msg(opt)("");
    msg(opt)(`- command took ${chalk.bold(duration)}${chalk.italic.dim("ms")}`);
  }

  if (exitCode > 0) {
    process.exit(exitCode);
  }
}