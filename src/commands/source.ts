import chalk from "chalk";
import { AsOption } from "src/cli";
import { projectUsing, getFileDiagnostics } from "src/ast";
import { msg, fileLink, relativeFile, tsCodeLink } from "src/utils";

interface DiagnosticSummary {
  totalFiles: number;
  filesWithErrors: number;
  filesWithWarnings: number;
  totalErrors: number;
  totalWarnings: number;
  errorsByCode: Map<number, number>;
  warningsByCode: Map<number, number>;
}

function isTestFile(filePath: string): boolean {
  // Exclude files matching Vitest test patterns
  if (filePath.match(/\.test\.(ts|js|tsx|jsx)$/)) return true;
  if (filePath.match(/\.spec\.(ts|js|tsx|jsx)$/)) return true;
  
  // Exclude files under test or tests directories
  if (filePath.includes('/test/') || filePath.includes('/tests/')) return true;
  if (filePath.includes('\\test\\') || filePath.includes('\\tests\\')) return true;
  
  return false;
}

function analyzeSourceFiles(project: any, opt: AsOption<"source">): DiagnosticSummary {
  const allSourceFiles = project.getSourceFiles();
  
  // Filter out test files (Vitest patterns and test/tests directories)
  const nonTestFiles = allSourceFiles.filter((file: any) => !isTestFile(file.getFilePath()));
  
  // Apply user filter if specified
  const sourceFiles = opt.filter && opt.filter.length > 0 
    ? nonTestFiles.filter((file: any) => 
        opt.filter.some(filter => file.getFilePath().includes(filter))
      )
    : nonTestFiles;
  
  const summary: DiagnosticSummary = {
    totalFiles: sourceFiles.length,
    filesWithErrors: 0,
    filesWithWarnings: 0,
    totalErrors: 0,
    totalWarnings: 0,
    errorsByCode: new Map(),
    warningsByCode: new Map()
  };

  for (const sourceFile of sourceFiles) {
    const diagnostics = getFileDiagnostics(sourceFile);
    
    let fileHasErrors = false;
    let fileHasWarnings = false;

    for (const diagnostic of diagnostics) {
      const isWarning = opt.warn.includes(diagnostic.code);
      
      if (isWarning) {
        summary.totalWarnings++;
        fileHasWarnings = true;
        summary.warningsByCode.set(
          diagnostic.code, 
          (summary.warningsByCode.get(diagnostic.code) || 0) + 1
        );
      } else {
        summary.totalErrors++;
        fileHasErrors = true;
        summary.errorsByCode.set(
          diagnostic.code, 
          (summary.errorsByCode.get(diagnostic.code) || 0) + 1
        );
      }
    }

    if (fileHasErrors) summary.filesWithErrors++;
    if (fileHasWarnings) summary.filesWithWarnings++;
  }

  return summary;
}

function displayDiagnosticsByCode(
  diagnosticsByCode: Map<number, number>, 
  label: string, 
  color: (str: string) => string
) {
  if (diagnosticsByCode.size === 0) return;

  console.log(`\n${label}:`);
  const sortedCodes = Array.from(diagnosticsByCode.entries())
    .sort((a, b) => b[1] - a[1]); // Sort by count, descending

  for (const [code, count] of sortedCodes) {
    console.log(`  ${color(tsCodeLink(code))}: ${chalk.bold(count)} occurrences`);
  }
}

export async function source_command(opt: AsOption<"source">) {
  const start = performance.now();

  msg(opt)(chalk.bold(`Source File Analysis`));
  msg(opt)(`-------------------------------`);

  const [project, configFile] = projectUsing(opt.config 
    ? [opt.config] 
    : [`src/tsconfig.json`, `tsconfig.json`]
  );

  const allSourceFiles = project.getSourceFiles();
  
  // Filter out test files
  const nonTestFiles = allSourceFiles.filter(file => !isTestFile(file.getFilePath()));
  
  const filteredCount = opt.filter && opt.filter.length > 0 
    ? nonTestFiles.filter(file => 
        opt.filter.some(filter => file.getFilePath().includes(filter))
      ).length
    : nonTestFiles.length;
  
  const filterDesc = opt.filter && opt.filter.length > 0 
    ? ` (${filteredCount} after user filtering)`
    : '';
  
  const testFilesExcluded = allSourceFiles.length - nonTestFiles.length;
  const excludeDesc = testFilesExcluded > 0 
    ? ` (${testFilesExcluded} test files excluded)`
    : '';
  
  msg(opt)(`- project found ${chalk.bold(nonTestFiles.length)} source files${excludeDesc}${filterDesc} [${chalk.dim(configFile)}]`);

  // Analyze diagnostics directly
  msg(opt)(`- analyzing TypeScript diagnostics...`);
  const summary = analyzeSourceFiles(project, opt);

  // Display summary
  msg(opt)("");
  msg(opt)(chalk.bold("DIAGNOSTICS SUMMARY:"));
  msg(opt)("");

  if (summary.totalErrors === 0 && summary.totalWarnings === 0) {
    msg(opt)(`- 🎉 ${chalk.green.bold("No diagnostics found!")}`);
  } else {
    if (summary.totalErrors > 0) {
      msg(opt)(`- ${chalk.red.bold(summary.totalErrors)} ${chalk.italic("errors")} across ${chalk.bold(summary.filesWithErrors)} files`);
    }
    if (summary.totalWarnings > 0) {
      msg(opt)(`- ${chalk.yellow.bold(summary.totalWarnings)} ${chalk.italic("warnings")} across ${chalk.bold(summary.filesWithWarnings)} files`);
    }
  }

  // Show breakdown by diagnostic code
  if (summary.totalErrors > 0 || summary.totalWarnings > 0) {
    displayDiagnosticsByCode(summary.errorsByCode, "Error Codes", chalk.red);
    displayDiagnosticsByCode(summary.warningsByCode, "Warning Codes", chalk.yellow);
  }

  // Show files with issues if there are any
  if (opt.verbose && summary.filesWithErrors > 0) {
    msg(opt)("");
    msg(opt)("Files with errors:");
    
    // Get the same filtered source files used in analysis
    const allSourceFiles = project.getSourceFiles();
    
    // Filter out test files
    const nonTestFiles = allSourceFiles.filter(file => !isTestFile(file.getFilePath()));
    
    const sourceFiles = opt.filter && opt.filter.length > 0 
      ? nonTestFiles.filter(file => 
          opt.filter.some(filter => file.getFilePath().includes(filter))
        )
      : nonTestFiles;
    
    for (const sourceFile of sourceFiles) {
      const diagnostics = getFileDiagnostics(sourceFile);
      const errors = diagnostics.filter(d => !opt.warn.includes(d.code));
      
      if (errors.length > 0) {
        const filepath = sourceFile.getFilePath();
        msg(opt)(`  - ${fileLink(relativeFile(filepath), filepath)} (${errors.length} errors)`);
        
        // Show individual error details if there aren't too many total errors
        if (summary.totalErrors <= 50) {
          for (const error of errors.slice(0, 5)) { // Limit to first 5 per file
            const line = error.loc?.lineNumber || '?';
            const col = error.loc?.column || '?';
            msg(opt)(`    ${chalk.red('•')} Line ${line}:${col} - ${chalk.dim(error.msg)} ${chalk.gray(`(${error.code})`)}`);
          }
          if (errors.length > 5) {
            msg(opt)(`    ${chalk.dim(`... and ${errors.length - 5} more errors`)}`);
          }
        }
      }
    }
    
    // If there are too many errors to show details, suggest filtering
    if (summary.totalErrors > 50) {
      msg(opt)("");
      msg(opt)(`${chalk.yellow('Note:')} Too many errors to show details. Use ${chalk.blue('--filter')} to focus on specific files.`);
    }
  }

  const duration = performance.now() - start;
  if (!opt.quiet) {
    msg(opt)("");
    msg(opt)(`- command took ${chalk.bold(duration)}${chalk.italic.dim("ms")}`);
  }
}