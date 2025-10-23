import type { BlockType } from "~/ast";
import type { FileDiagnostic, SymbolImport } from "./file-ast-types";
import type { SymbolReference } from "./symbol-ast-types";

export interface TypeTest {
    filepath: string;
    description: string;
    startLine: number;
    endLine: number;
    skip: boolean;
    readonly diagnostics: readonly FileDiagnostic[];
    readonly symbols: readonly SymbolReference[];
    /**
     * Whether this test block contains a `type cases = [...]` declaration
     */
    hasTypeCases: boolean;
    /**
     * The number of type assertions in the `type cases` array
     */
    typeAssertionCount: number;
}

export type Foo<T extends string> = `${T}Bar`;

export interface TestBlock extends BlockType {
    filepath: string;
    description: string;
    startLine: number;
    endLine: number;
    skip: boolean;
    diagnostics: FileDiagnostic[];
    tests: TypeTest[];
}

export interface TestFile {
    filepath: string;

    importSymbols: SymbolImport[];

    /**
     * Sets the whole file to be skipped if all the blocks
     * or all the tests are set to be skipped.
     */
    skip: boolean;
    skippedTests: number;
    blocks: TestBlock[];
    /**
     * The time it took to analyze the test file
     */
    duration: number;
    /**
     * The number of _lines_ in the file which the test blocks
     * consume. This is used on some performance metrics to
     * get a _slightly_ better view on the duration number
     * above.
     */
    testLines: number;
    /**
     * The total number of tests that contain type assertions
     * (tests with `hasTypeCases = true`)
     */
    typeTests: number;
    /**
     * The total number of type assertions across all tests
     * (sum of all `typeAssertionCount` values)
     */
    assertions: number;
}

export type SymbolFilterCallback = (sym: SymbolReference) => boolean;

export interface TestFileOptions {

    /**
     * By default, the filtering function will reduce symbols
     * captured to only those whose `kind` property is "type-defn"
     * as this is typically what we're concerned with in testing
     * but you can replace this function with whatever you like.
     */
    symbolsFilter?: SymbolFilterCallback;
}

export interface TestSummary {
    /** files which have diagnostics on this test criteria  */
    withDiagnostics: string[];
    slow: string[];
    filesWithErrors: number;
    filesWithWarnings: number;
    testsWithErrors: number;
    /** the number of tests which were skipped */
    skipped: number;
    /** the total number of tests found */
    tests: number;
    /** the total number of test files evaluated */
    testFiles: number;
    /** the total number of tests that contain type assertions */
    typeTests: number;
    /** the total number of type assertions across all tests */
    assertions: number;
}
