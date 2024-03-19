import ts from "typescript";
import path from "pathe";
import {isObject} from "inferred-types";
import chalk from "chalk";

export const isSpecificDiagnostic = <T>(val: T): val is T & Diagnostic<"specific"> => {
    return isObject(val) && (val as any)?.kind === "specific"
}

export type Diagnostic<T extends "specific" | "general" = "specific" | "general"> = {
    kind: "Diagnostic";
    type: T;
    file: string;
    category: ts.DiagnosticCategory;
    code: number;
    source: string | undefined;
    relatedInformation: ts.DiagnosticRelatedInformation[] | undefined;
    msg: string;
} & (T extends "specific" 
            ? {
                line: T extends "specific" ? number : never;
                character: T extends "specific" ? number : never;
            } 
        : NonNullable<unknown>);

export const checkTypeScriptFile = (filePath: string): [0|1, ts.EmitResult, Diagnostic[]] => {
  // Load the base tsconfig.json
  const configFile = ts.readConfigFile("tsconfig.json", ts.sys.readFile);

  // Override the "files" property to only include the specific file
  configFile.config.include = [filePath];

  // Parse the configuration, including command line options
  const parsedCommandLine = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname("tsconfig.json")
  );

  // Create a program with the selected file and compilation settings
  const program = ts.createProgram(parsedCommandLine.fileNames, parsedCommandLine.options);

  // Perform the type check
  const emitResult = program.emit();
  const diagnostics: Diagnostic[] = [];
  const allDiagnostics = ts
      .getPreEmitDiagnostics(program)
      .concat(emitResult.diagnostics);

  allDiagnostics.forEach(diagnostic => {
      if (diagnostic.file) {
            const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start || 0);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            diagnostics.push({
                kind: "Diagnostic",
                type: "specific",
                category: diagnostic.category,
                code: diagnostic.code,
                source: diagnostic.source,
                relatedInformation: diagnostic.relatedInformation,
                file: filePath,
                msg: `(${chalk.dim("l:")} ${line + 1}, ${chalk.dim("c:")}${character + 1}): ${message}`,
                line,
                character
            })
      } else {
            diagnostics.push({
                kind: "Diagnostic",
                type: "general",
                category: diagnostic.category,
                file: filePath,
                source: diagnostic.source,
                relatedInformation: diagnostic.relatedInformation,
                code: diagnostic.code,
                msg: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
            })
      }
  });

  const exitCode = diagnostics.length === 0 && !emitResult.emitSkipped
    ? 0 
    : 1;
  return [exitCode, emitResult, diagnostics as Diagnostic[]]
}
