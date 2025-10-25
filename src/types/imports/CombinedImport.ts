
/**
 * **CombinedImport**
 * 
 * A diagnostic type that is used to highlight an import which
 * imports both **runtime** and **type** symbols from a single
 * import statement.
 * 
 * This is considered a bad practice because all type symbols
 * should ideally use the `type` modifier to express clearly
 * to the type system that the symbol is a type.
 */
export type CombinedImport = {
    kind: "combined-import";

    /** 
     * the source/path that was used as the source for the import 
     */
    source: string;
    /** 
     * the symbols in the import which are type symbols
     */
    typeSymbols: string[];
    /**
     * the symbols in the import which are runtime symbols
     */
    runtimeSymbols: string[];
    /**
     * The file the import was found in
     */
    file: string;
    /**
     * The line number where the import was found.
     */
    line: number;

    /**
     * A boolean flag indicating whether `type` modifier was used.
     * 
     * **Note:** it would be rare for this to be `true` because importing a
     * runtime symbol with the `type` modifier presents a highly visible
     * error whereas the inverse is much quieter.
     */
    hasTypeModifier: boolean;
    
    /** the import statement */
    content: string;

    /**
     * a console friendly way of presenting
     * the import.
     */
    toString(): string;
}
