import chalk from "chalk";
import { AsOption } from "src/cli";
import { projectUsing, getFileDiagnostics } from "src/ast";
import { msg, fileLink, relativeFile, tsCodeLink, diagnosticLookup, prettyPath } from "src/utils";

interface DiagnosticSummary {
  totalFiles: number;
  filesWithErrors: number;
  filesWithWarnings: number;
  totalErrors: number;
  totalWarnings: number;
  errorsByCode: Map<number, number>;
  warningsByCode: Map<number, number>;
  errorsByCodeAndFile: Map<number, Map<string, number>>;
  warningsByCodeAndFile: Map<number, Map<string, number>>;
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

function analyzeSourceFiles(opt: AsOption<"source">, sourceFiles: any[]): DiagnosticSummary {
  const summary: DiagnosticSummary = {
    totalFiles: sourceFiles.length,
    filesWithErrors: 0,
    filesWithWarnings: 0,
    totalErrors: 0,
    totalWarnings: 0,
    errorsByCode: new Map(),
    warningsByCode: new Map(),
    errorsByCodeAndFile: new Map(),
    warningsByCodeAndFile: new Map()
  };

  for (const sourceFile of sourceFiles) {
    const diagnostics = getFileDiagnostics(sourceFile);
    
    let fileHasErrors = false;
    let fileHasWarnings = false;

    for (const diagnostic of diagnostics) {
      const isWarning = opt.warn.includes(diagnostic.code);
      
      const filePath = sourceFile.getFilePath();
      
      if (isWarning) {
        summary.totalWarnings++;
        fileHasWarnings = true;
        summary.warningsByCode.set(
          diagnostic.code, 
          (summary.warningsByCode.get(diagnostic.code) || 0) + 1
        );
        
        // Track by code and file for verbose reporting
        if (!summary.warningsByCodeAndFile.has(diagnostic.code)) {
          summary.warningsByCodeAndFile.set(diagnostic.code, new Map());
        }
        const fileMap = summary.warningsByCodeAndFile.get(diagnostic.code)!;
        fileMap.set(filePath, (fileMap.get(filePath) || 0) + 1);
      } else {
        summary.totalErrors++;
        fileHasErrors = true;
        summary.errorsByCode.set(
          diagnostic.code, 
          (summary.errorsByCode.get(diagnostic.code) || 0) + 1
        );
        
        // Track by code and file for verbose reporting
        if (!summary.errorsByCodeAndFile.has(diagnostic.code)) {
          summary.errorsByCodeAndFile.set(diagnostic.code, new Map());
        }
        const fileMap = summary.errorsByCodeAndFile.get(diagnostic.code)!;
        fileMap.set(filePath, (fileMap.get(filePath) || 0) + 1);
      }
    }

    if (fileHasErrors) summary.filesWithErrors++;
    if (fileHasWarnings) summary.filesWithWarnings++;
  }

  return summary;
}

function displayDiagnosticsByCode(
  diagnosticsByCode: Map<number, number>, 
  diagnosticsByCodeAndFile: Map<number, Map<string, number>>,
  label: string, 
  color: (str: string) => string,
  opt: AsOption<"source">
) {
  if (diagnosticsByCode.size === 0) return;

  console.log(`\n${label}:`);
  const sortedCodes = Array.from(diagnosticsByCode.entries())
    .sort((a, b) => b[1] - a[1]); // Sort by count, descending

  for (const [code, count] of sortedCodes) {
    const diagnostic = diagnosticLookup(code);
    const description = diagnostic instanceof Error ? "Unknown diagnostic" : (diagnostic as any).message;
    
    msg(opt)(`[cd: ${color(tsCodeLink(code))}, count: ${chalk.bold(count)}] - ${description}`);
    
    // Show affected files in verbose mode
    if (opt.verbose && diagnosticsByCodeAndFile.has(code)) {
      const fileMap = diagnosticsByCodeAndFile.get(code)!;
      const sortedFiles = Array.from(fileMap.entries())
        .sort((a, b) => b[1] - a[1]); // Sort by error count per file
      
      for (const [filePath, fileCount] of sortedFiles) {
        msg(opt)(`  - ${prettyPath(relativeFile(filePath))} (${fileCount})`);
      }
    }
  }
}

export async function source_command(opt: AsOption<"source">, positionalArgs: string[] = []) {
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
  const testFilesExcluded = allSourceFiles.length - nonTestFiles.length;
  
  // Apply positional args as filters (same approach as test command)
  let filteredFiles = nonTestFiles;
  let excludedByFilter = 0;
  
  if (positionalArgs.length > 0) {
    filteredFiles = Array.from(new Set(
      positionalArgs.flatMap(filter => 
        nonTestFiles.filter(file => file.getFilePath().includes(filter))
      )
    ));
    excludedByFilter = nonTestFiles.length - filteredFiles.length;
  }
  
  // Enhanced file analysis reporting
  msg(opt)(`- of ${chalk.bold(allSourceFiles.length)} source files, the analysis will focus on ${chalk.bold(filteredFiles.length)} files after removing:`);
  
  if (testFilesExcluded > 0) {
    msg(opt)(`  - ${chalk.yellow(testFilesExcluded)} test files were ignored`);
  }
  
  if (excludedByFilter > 0) {
    msg(opt)(`  - ${chalk.yellow(excludedByFilter)} files were excluded because they didn't match the filter expression`);
  }
  
  if (testFilesExcluded === 0 && excludedByFilter === 0) {
    msg(opt)(`  - no files were excluded`);
  }
  
  if (positionalArgs.length > 0) {
    msg(opt)(`  - filter patterns applied: ${chalk.dim(positionalArgs.join(', '))}`);
  }
  
  msg(opt)(`  - using config: ${chalk.dim(configFile)}`);

  // Analyze diagnostics directly
  msg(opt)(`- analyzing TypeScript diagnostics...`);
  const summary = analyzeSourceFiles(opt, filteredFiles);

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
    displayDiagnosticsByCode(summary.errorsByCode, summary.errorsByCodeAndFile, "Error Codes", chalk.red, opt);
    displayDiagnosticsByCode(summary.warningsByCode, summary.warningsByCodeAndFile, "Warning Codes", chalk.yellow, opt);
  }

  const duration = performance.now() - start;
  if (!opt.quiet) {
    msg(opt)("");
    msg(opt)(`- command took ${chalk.bold(duration)}${chalk.italic.dim("ms")}`);
  }
}