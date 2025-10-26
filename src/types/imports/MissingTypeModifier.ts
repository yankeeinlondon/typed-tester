/**
 * MissingTypeModifier
 *
 * A diagnostic type that is used to highlight an import
 * which is importing type symbols but does not use the
 * `type` modifier which provides useful metadata to the
 * type system but is not strictly required.
 */
export interface MissingTypeModifier {
    kind: "missing-type-modifier";
    /**
     * the source/path that was used as the source for the import
     */
    source: string;
    /**
     * The file the import was found in
     */
    file: string;
    /**
     * The line number where the import was found.
     */
    line: number;
    /** the import statement */
    content: string;

    /**
     * a console friendly way of presenting
     * the import.
     */
    toString: () => string;
}
