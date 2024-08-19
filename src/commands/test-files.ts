import chalk from "chalk";
import { relative } from "pathe";
import { analyzeTestFile, getErrorDiagnosticsBetweenLines, getWarningDiagnosticsBetweenLines, projectUsing } from "src/ast";
import { initializeHasher } from "src/cache";
import { AsOption } from "src/cli";
import { prettyPath } from "src/report";
import { getTestFiles, msg } from "src/utils";


export const test_files_command = async (opt: AsOption<"test-files">) => {
  const start = performance.now();
  await initializeHasher();

  // SOURCE FILES

  if (opt.filter) {
    msg(opt)(chalk.bold(`Test Files (filter: ${chalk.dim(opt.filter)})`));
    msg(opt)(`----------------------------------------------------------`);
  }  else {
    msg(opt)(chalk.bold(`Test Files`));
    msg(opt)(`----------------------------------------------------------`);
  }

  const [_project, configFile, root] = projectUsing(
    opt.config 
      ? [ opt.config ] 
      : [
          `test/tsconfig.json`, 
          `tests/tsconfig.json`, 
          `tsconfig.json`,
          `src/tsconfig.json`
        ]
  );

  if (!opt.config) {
    msg(opt)(`- configuration for project's tests found in ${chalk.blue(configFile)}`);
  }

  let testFiles = getTestFiles();
  msg(opt)(`- there are ${chalk.bold(testFiles.length)} across the project`);
  if (opt?.filter?.length || 0 > 0) {
    testFiles = Array.from(new Set(
      opt.filter.flatMap(f => testFiles.filter(i => i.includes(f)))
    ));
    msg(opt)(`- after applying filters [${chalk.dim(opt.filter.join(', '))}], ${chalk.bold(testFiles.length)} files remain to report on`)
  }

  if(testFiles.length >0) {
    console.log();
    console.log(chalk.bold.green(`Test Results:`));
  }

  if (opt.json) {
    const data = testFiles.map(tf => analyzeTestFile(tf));

    console.log(JSON.stringify(data));
    
  } else {
    // console out

    for (const testFile of testFiles) {
      const results = analyzeTestFile(testFile);
      const file = relative(root, testFile);
      console.log(`\n 🗳️  ${prettyPath(file)}: `);
      for (const block of results.blocks) {
        const blockErrors = getErrorDiagnosticsBetweenLines(
          testFile, 
          block.startLine,
          block.endLine,
          opt
        );
        const blockWarnings = getWarningDiagnosticsBetweenLines(
          testFile, 
          block.startLine,
          block.endLine,
          opt
        );

        const testsInBlock = `${block.tests.length} ${chalk.italic(block.tests.length === 1 ? "test" : "tests")}`;
        const errorsInBlock = blockErrors.length > 0
          ? `, ${chalk.red.bold(blockErrors.length)} ${chalk.red("err")}`
          : ``
  
        const warningsInBlock = blockWarnings.length > 0
        ? `, ${chalk.yellowBright.bold(blockWarnings.length)} ${chalk.yellowBright("warn")}`
        : ``
  
        if (!opt.verbose) {
          console.log(`    - ${block.description} [${testsInBlock}${errorsInBlock}${warningsInBlock}]`);
  
        } else {
          console.log(`\n    - ${block.description} [${testsInBlock}]`);
          for (const t of block.tests) {
            const testErrors = getErrorDiagnosticsBetweenLines(
              testFile, 
              t.startLine,
              t.endLine,
              opt
            );
            const testWarnings = getErrorDiagnosticsBetweenLines(
              testFile, 
              t.startLine,
              t.endLine,
              opt
            );

            
            const status = testErrors.length > 0
              ? chalk.bold.red(` ⛒ `)
              : testWarnings.length > 0
              ? chalk.bold.yellow(` ⚠️ `)
              : chalk.bold.green(` ✔ `);
            console.log(`      [${status}] ${t.description}`);
            for (const err of testErrors) {
              console.log(`          - ${err.msg} [ ${chalk.italic.dim("cd:")} ${err.code},${chalk.italic.dim("l:")} ${err.loc.lineNumber}, ${chalk.italic.dim("col:")} ${err.loc.column} ]`);
            }
            if (testErrors.length > 0) {
              console.log();
            }

            
          }
          
        }
  
      }
    }
  } // end console out
}
