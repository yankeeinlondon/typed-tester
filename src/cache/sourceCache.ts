import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { 
  FileDiagnostic,
  FileMeta, 
  ImportMeta,
  SymbolMeta,
  SymbolReference,
  getConfigHash,
  getFileDiagnostics,
  getImportsForFile, 
  getProject, 
  getProjectRoot, 
  getSymbolsDefinedInFile 
} from "src/ast";
import {  getHasher } from "./cache";
import { join, relative } from "pathe";
import chalk from "chalk";
import { SourceFile } from "ts-morph";
import { getTestFiles, msg } from "src/utils";
import { AsOption } from "src/cli";

const SOURCE_CACHE_FILE = `/.ts-source-lookup` as const;

export type DiagnosticSummary = {
  byCategory: Record<string,{ count: number; files: Set<string> }>,
  byCode: Record<string,{ count: number; files: Set<string> }>
}

/**
 * the cache for source files
 */
let SOURCE_LOOKUP = new Map<string, FileMeta>();

let DIAG_SUMMARY: DiagnosticSummary = {
  byCategory: {},
  byCode: {},
}

/**
 * Provides the fully-qualified filepath to the source files cache file.
 * 
 * **Note:** there is a dynamic component which based on which 
 * `tsconfig.json` file was used for configuration of the project.
 */
export const sourceCacheFile = () => join(getProjectRoot(), `${SOURCE_CACHE_FILE}-${getConfigHash()}.json`);


export const hasSourceCacheFile = () => {
  return existsSync(sourceCacheFile());
}

export const saveSourceLookup = () => {
  const data = Array.from(SOURCE_LOOKUP.values());
  console.log(`saving to ${sourceCacheFile()}: ${data.length} records`);
  
  writeFileSync(sourceCacheFile(), JSON.stringify(data), "utf-8");
}

const hashFileImports = (imp: ImportMeta[]) => {
  const hasher = getHasher();
  return hasher(imp.map(i => i.symbol.name).join(","));
}

const hashFileSymbols = (sym: (SymbolMeta | SymbolReference)[]) => {
  const hasher = getHasher();
  return hasher(sym.map(i => i.name).join(","))
}

const hashFileDiagnostics = (sym: (FileDiagnostic)[]) => {
  const hasher = getHasher();
  return hasher(sym.map(i => `${i.loc.lineNumber}${i.loc.column}${i.code}`).join(","))
}

/**
 * Clears the source file lookup cache from memory.
 * 
 * Will also clear from disk if options `file` flag
 * is set to **true**.
 */
export const clearSourceCache = (file?: boolean) => {
  SOURCE_LOOKUP = new Map<string, FileMeta>();
  if(hasSourceCacheFile() && file) {
    unlinkSync(sourceCacheFile())
  }
}

const addDiagnosticByCategory = (
  filepath: string,
  diagnostics: FileDiagnostic[]
) => {
  for (const d of diagnostics) {
    if (d.category in DIAG_SUMMARY.byCategory) {
      DIAG_SUMMARY.byCategory[d.category] = { 
        count: DIAG_SUMMARY.byCategory[d.category].count + 1, 
        files: DIAG_SUMMARY.byCategory[d.category].files.add(filepath)
      };
    } else if (String(d.category)) {
      DIAG_SUMMARY.byCategory[d.category] = { 
        count: 1, 
        files: new Set<string>([filepath])
      };
    }
  }
}

const addDiagnosticByCode = (
  filepath: string,
  diagnostics: FileDiagnostic[]
) => {
  for (const d of diagnostics) {
    if ( d.code in DIAG_SUMMARY.byCode) {
      DIAG_SUMMARY.byCode[d.code] = { 
        count: DIAG_SUMMARY.byCode[d.code].count + 1, 
        files: DIAG_SUMMARY.byCode[d.code].files.add(filepath)
      };
    } else if (d.code) {
      DIAG_SUMMARY.byCode[d.code] = { 
        count: 1, 
        files: new Set<string>([filepath])
      };
    }
  }
}

/**
 * **cacheSourceFiles**`(files?: SourceFile[])`
 * 
 * Adds either the _provided_ source files or _all_ source files (if not provided)
 * to the in-memory `FileLookup` map.
 */
export const cacheSourceFiles = (opt: AsOption<null>) =>  (files?: SourceFile[]) => {
  const hasher = getHasher();
  clearSourceCache(true);

  // because test files can live intermittently with
  // source files we need to exclude them here
  const testFiles: string[] = getTestFiles();

  const cache: FileMeta[] = [];
  
  const sfs = (
    files  
    ? files 
    : getProject().getSourceFiles()
  ).filter(
    f => !testFiles.includes( relative(getProjectRoot(), f.getFilePath()) )
  );

  for (const file of sfs) {
    const start = performance.now();
    const filepath = relative(getProjectRoot(), file.getFilePath());
    if(opt.verbose) {
      process.stderr.write(`- caching ${chalk.blue(filepath)}: [ `)
    }
    const imports = getImportsForFile(file)
      .sort((a,b) => a.symbol.name.localeCompare(b.symbol.name));
    if(opt.verbose) {
        process.stderr.write(chalk.dim("imports"))
    }
    const symbols = getSymbolsDefinedInFile(file, imports)
      .sort((a,b) => a.name.localeCompare(b.name));
    if(opt.verbose) {
        process.stderr.write(chalk.dim(", symbols"))
    }

    const diagnostics = getFileDiagnostics(file)
      .sort(
        (a,b) => a.loc.lineNumber - b.loc.lineNumber 
      );
    if(opt.verbose) {
        process.stderr.write(chalk.dim(", diagnostics"))
    }

    const importsHash = hashFileImports(imports);
    const symbolsHash = hashFileSymbols(symbols);
    const diagnosticsHash = hashFileDiagnostics(diagnostics);

    const fileHash = hasher(`${importsHash}-${symbolsHash}-${diagnosticsHash}`);
    const fileContentHash = hasher(file.getText().trim());

    if(opt.verbose) {
      const duration = Math.floor((performance.now()- start) * 10000)/10000;
      const timing = duration > 300
        ? `in ${chalk.red.bold(duration)}${chalk.red.italic("ms")}`
        : duration > 100
        ? `in ${chalk.yellowBright.bold(duration)}${chalk.yellowBright.italic("ms")}`
        : `in ${chalk.reset.bold(duration)}${chalk.italic("ms")}`
      process.stderr.write(
        `, ${chalk.dim("hashed")} ${chalk.bold("]")} ${timing}\n`
      )
    }

    cache.push({
      filepath,
      imports,
      symbols,
      diagnostics,
      importsHash,
      symbolsHash,
      diagnosticsHash,
      fileHash,
      fileContentHash
    })
  }

  updateSourceCache(...cache);
}

export const getSourceDiagnosticSummary = () => {
  return DIAG_SUMMARY as Readonly<DiagnosticSummary>;
}

/**
 * **getDiagnosticsByCode**`(opt)`
 * 
 * Returns `errors`, `warnings`, and `filesWithError`:
 * 
 * - `errors` - [ code, count, files: string[] ]
 * - `warnings` - [ code, count, files: string[] ]
 * - `filesWithError` - string[]
 */
export const getDiagnosticsByCode  = <T extends AsOption<null>>(opt: T): {
  errors: [code: number, count: number, files: string[]][],
  warnings: [code: number, count: number, files: string[]][],
  filesWithError: string[]
}  => {
  const warning_codes = opt.warn;
  
  const errors: [
    code: number, 
    count: number, 
    files: string[]
  ][] = Object.keys(DIAG_SUMMARY.byCode).reduce(
    (acc, key) => warning_codes.includes(Number(key))
    ? acc
    : [
      ...acc, 
      [
        Number(key), 
        DIAG_SUMMARY.byCode[key].count, 
        Array.from(DIAG_SUMMARY.byCode[key].files)
      ]
    ]
    ,
    [] as [code: number, count: number, files: string[]][]
  );
  const filesWithError = new Set<string>(
    errors.flatMap(e => e[2])
  );

  const warnings: [
    code: number, 
    count: number, 
    files: string[]
  ][] = Object.keys(DIAG_SUMMARY.byCode).reduce(
    (acc, key) => !warning_codes.includes(Number(key))
      ? acc
      : [
          ...acc, 
          [
            Number(key), 
            DIAG_SUMMARY.byCode[key].count, 
            Array.from(DIAG_SUMMARY.byCode[key].files)
          ]
        ]
    ,
    [] as [code: number, count: number, files: string[]][]
  );

  return {
    errors: errors.sort((a,b) => a[0] - b[0]),
    warnings: warnings.sort((a,b) => a[0] - b[0]),
    filesWithError: Array.from(filesWithError)
  }
}

export const getCachedSourceFiles = (): number => {
  return SOURCE_LOOKUP.size;
}

export const lookupSourceFile = (filepath: string): FileMeta | null=> {
  if (SOURCE_LOOKUP.has(filepath)) {
    return SOURCE_LOOKUP.get(filepath) as FileMeta;
  } else {
    return null;
  }
}

/**
 * Updates or adds files to the file lookup cache while
 * maintaining the in-memory diagnostics summary.
 */
export const updateSourceCache = (...files: FileMeta[]) =>  {
  for (const f  of files) {
    SOURCE_LOOKUP.set(f.filepath, f);
    addDiagnosticByCategory(f.filepath, f.diagnostics);
    addDiagnosticByCode(f.filepath, f.diagnostics);
  }
} 

export const initializeSourceCache = (opt: AsOption<null>) => {
  clearSourceCache();

  if (hasSourceCacheFile()) {
    try {
      const data = JSON.parse(readFileSync(sourceCacheFile(), "utf-8")) as FileMeta[];
      updateSourceCache(...data);
    } catch(e) {
      throw new Error(`Problems loading the source cache file: ${chalk.blue(sourceCacheFile())}\nErr msg: ${String(e)}`)
    }
  } else {
    // no cache file found
    clearSourceCache();
    cacheSourceFiles(opt)();
    saveSourceLookup();
  }
  return SOURCE_LOOKUP;
}
