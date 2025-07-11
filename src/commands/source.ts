import chalk from "chalk";
import { AsOption } from "src/cli";
import { projectUsing, getFileDiagnostics } from "src/ast";
import { msg, fileLink, relativeFile } from "src/utils";
import type { FileDiagnostic } from "src/types";

interface DiagnosticSummary {
  totalFiles: number;
  filesWithErrors: number;
  filesWithWarnings: number;
  totalErrors: number;
  totalWarnings: number;
  errorsByCode: Map<number, number>;
  warningsByCode: Map<number, number>;
}

function analyzeSourceFiles(project: any, opt: AsOption<"source">): DiagnosticSummary {
  const sourceFiles = project.getSourceFiles();
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
    console.log(`  ${color(code.toString())}: ${chalk.bold(count)} occurrences`);
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

  const sourceFiles = project.getSourceFiles();
  msg(opt)(`- project found ${chalk.bold(sourceFiles.length)} source files [${chalk.dim(configFile)}]`);

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

  // Show breakdown by diagnostic code if verbose
  if (opt.verbose && (summary.totalErrors > 0 || summary.totalWarnings > 0)) {
    displayDiagnosticsByCode(summary.errorsByCode, "Error Codes", chalk.red);
    displayDiagnosticsByCode(summary.warningsByCode, "Warning Codes", chalk.yellow);
  }

  // Show files with issues if there are any and not too many
  if (opt.verbose && summary.filesWithErrors > 0 && summary.filesWithErrors <= 10) {
    msg(opt)("");
    msg(opt)("Files with errors:");
    
    for (const sourceFile of project.getSourceFiles()) {
      const diagnostics = getFileDiagnostics(sourceFile);
      const errors = diagnostics.filter(d => !opt.warn.includes(d.code));
      
      if (errors.length > 0) {
        const filepath = sourceFile.getFilePath();
        msg(opt)(`  - ${fileLink(relativeFile(filepath), filepath)} (${errors.length} errors)`);
      }
    }
  }

  const duration = performance.now() - start;
  if (!opt.quiet) {
    msg(opt)("");
    msg(opt)(`- command took ${chalk.bold(duration)}${chalk.italic.dim("ms")}`);
  }
}