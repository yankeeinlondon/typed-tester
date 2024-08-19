import {  Diagnostic, DiagnosticCategory, DiagnosticMessageChain, SourceFile, ts } from "ts-morph";
import { SymbolReference } from "./symbol-ast-types";
import {  asSymbolReference, getSymbolDependencies } from "./symbols";
import { isTsDiagnostic, isTsMorphDiagnostic } from "src/type-guards";
import { isString } from "inferred-types";
import { getProject } from "./project";


export type FileMeta = {
  filepath: string;

  /**
   * symbols _imported_ by the file
   */
  imports: ImportMeta[];
  /**
   * symbols _defined_ in the file
   */
  symbols: SymbolReference[];
  /**
   * diagnostics found in the file
   */
  diagnostics: FileDiagnostic[];

  /**
   * A hash which detects whether the symbol's imported
   * have changed. Ordering, whitespace, and other aspects
   * are ignored.
   */
  importsHash: number;
  /**
   * A hash which detects whether the symbols which are 
   * _defined_ on the page have changed but **not** whether
   * the definition itself has changed.
   */
  symbolsHash: number;
  /**
   * A hash which detects change in the diagnostic status
   * of this file.
   */
  diagnosticsHash: number;

  /**
   * A hash which detects whether any of the other hashes
   * (besides `fileContentHash`) have changed.
   */
  fileHash: number;

  /**
   * helps to detect whether the textual content -- with edge 
   * whitespace trimmed -- has changed.
   */
  fileContentHash: number;
}

export type ImportMeta = {
  symbol: SymbolReference;
  as: string;
  source: string;
  exportKind: "default" | "named";
  /**
   * whether the import is for an external repo or something
   * within the current repo.
   */
  isExternalSource: boolean;
}

/**
 * **FileLookup**
 * 
 * Keys are relative filenames (from repo root or PWD if not repo),
 * values are the symbols which are found in the given file.
 */
export type FileLookup = {
  /** a hash of the last-updated date along with file contents */
  baseHash: number;
  /**
   * a hash of just the content (and with surrounding whitespace removed)
   */
  trimmedHash: number;
  /**
   * a map of the symbol's name to the hash value (as last measured)
   */
  symbols: Map<string, number>;


}


const determineIfExternal = (s: string): boolean => {
  return s.startsWith(".") || s.startsWith("src/") || s.startsWith("/")
    ? false
    : true
}

/**
 * Provides a list of symbols for the provided file
 */
export const getImportsForFile = (file: SourceFile): ImportMeta[] => {
  const importDeclarations = file.getImportDeclarations();
  const imported: ImportMeta[] = [];

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
            } as ImportMeta
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

export type FileDiagnostic = {
  code: number;
  category: DiagnosticCategory;
  msg: string;
  loc: {
    lineNumber: number;
    column: number;
    start: number | undefined;
    length: number | undefined;
  }
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

  return {
    code,
    msg,
    category,
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
  imports?: ImportMeta[] 
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
