import {  Diagnostic,  SourceFile, ts } from "ts-morph";
import { SymbolReference } from "./symbol-ast-types";
import {  asSymbolReference, getSymbolDependencies } from "./symbols";
import { isTsDiagnostic } from "src/type-guards";
import { isString } from "inferred-types";
import { getProject } from "./project";
import { FileDiagnostic, SymbolImport } from "./file-ast-types";
import { relativeFile } from "src/utils";



const determineIfExternal = (s: string): boolean => {
  return s.startsWith(".") || s.startsWith("src/") || s.startsWith("/")
    ? false
    : true
}

/**
 * Provides a list of symbols for the provided file
 */
export const getImportsForFile = (file: SourceFile): SymbolImport[] => {
  const importDeclarations = file.getImportDeclarations();
  const imported: SymbolImport[] = [];

  importDeclarations.map(iDecl => {

    // named imports
    iDecl.getNamedImports().map(namedImport => {
        const symbol = namedImport.getSymbol();
        const alias = namedImport.getAliasNode()?.getText() || namedImport.getName();
        if (symbol) {
          imported.push(
            { 
              symbol: asSymbolReference(symbol), 
              as: alias, 
              source: iDecl.getModuleSpecifierValue(),
              exportKind: "named",
              isExternalSource: determineIfExternal(iDecl.getModuleSpecifierValue())
            } as SymbolImport
          );
        }
    });

    // default import
    if (iDecl.getDefaultImport()) {
        const defaultSymbol = iDecl.getDefaultImport()?.getSymbol();
        const alias = iDecl.getDefaultImport()?.getText();
        if (defaultSymbol && alias) {
            imported.push({ 
              symbol: asSymbolReference(defaultSymbol), 
              as: alias,
              source: iDecl.getModuleSpecifierValue(),
              exportKind: "default",
              isExternalSource: determineIfExternal(iDecl.getModuleSpecifierValue())
            });
        }
    }

  });

  return imported;
}


/**
 * **asFileDiagnostic**`(diag)`
 * 
 * Takes a `Diagnostic` from **ts-morph** and summarizes to a _serializable_
 * `FileDiagnostic`.
 */
export const asFileDiagnostic = (
  diagnostic: Diagnostic | ts.Diagnostic): FileDiagnostic => {

  const code = isTsDiagnostic(diagnostic) 
    ? diagnostic.code
    : diagnostic.getCode();
  
  const msg = isTsDiagnostic(diagnostic) 
    ? isString(diagnostic.messageText) ? diagnostic.messageText : "getMessageText" in diagnostic && typeof diagnostic.getMessageText === "function" ? diagnostic.getMessageText() : "UNKNOWN"
    : diagnostic.getMessageText();


  const category = isTsDiagnostic(diagnostic) 
    ? diagnostic.category 
    : diagnostic.getCategory();
  const start = isTsDiagnostic(diagnostic) ? diagnostic.start : diagnostic.getStart();
  const length = isTsDiagnostic(diagnostic) ? diagnostic.length : diagnostic.getLength();
  const { line, character } = isTsDiagnostic(diagnostic)
    ?  {line: start || 0, character: length || 0}
    : 
      ts.getLineAndCharacterOfPosition(
        (diagnostic.getSourceFile() as SourceFile).compilerNode, 
        diagnostic.getStart() || 0
      );
  const filepath = isTsDiagnostic(diagnostic)
      ? diagnostic.file?.fileName
      : diagnostic.getSourceFile()?.getFilePath();

  return {
    code,
    msg,
    category,
    filepath: filepath ? relativeFile(filepath) : undefined,
    loc: {
      lineNumber: line + 1,
      column: character + 1,
      start,
      length
    }
  }
}


/**
 * **getSymbolsDefinedInFile**`(file, [imports])`
 * 
 * Given a `SourceFile`, will report on both _exported_ and _local_ symbols
 * defined in the file while _excluding_ any files which were imported
 * but not defined here.
 * 
 * **Note:** providing _imports_ is not required -- they will be inferred automatically
 * -- but if you already have them then you can pass them in as a mild
 * performance boost.
 */
export const getSymbolsDefinedInFile = (
  file: SourceFile,
  imports?: SymbolImport[] 
): SymbolReference[] => {
  const imported = imports?.map(i => i.symbol.fqn) || getImportsForFile(file).map(i => i.symbol.fqn);
  const exported = file.getExportSymbols();
  const local = exported.flatMap(s => getSymbolDependencies(s).filter(i => i.scope === "local"))

  return [
    ...exported.map(i => asSymbolReference(i)),
    ...local.map(i => asSymbolReference(i))
      .filter(i => i.kind !== "property") // cuts down on noise
      .filter(i => !imported.includes(i.fqn)) // avoid imported symbols
  ];
}

/**
 * gets all the diagnostics for a given file.
 */
export const getFileDiagnostics = (
  file: string | SourceFile
): FileDiagnostic[] => {
  const fileSource = isString(file)
    ? getProject().addSourceFileAtPath(file)
    : file;

  return fileSource.getPreEmitDiagnostics().map(d => asFileDiagnostic(d));
}
