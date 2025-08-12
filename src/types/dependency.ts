
export type DependentSymbol = {
    /** the symbol name */
    name: string;
    /** the filepath where this symbol is defined */
    file: string;
}



export type Dependency = {
    /** the source symbol being evaluated */
    source: string;
    /** the file location of the source file */
    sourceFile: string;

    dependencies: DependentSymbol[];
}
