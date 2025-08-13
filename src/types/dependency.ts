import { FQN, SymbolKind, SymbolMeta, } from "./symbol-ast-types";



/**
 * **Dependency**
 * 
 * Represents a dependency between one symbol and another. 
 * 
 * - all symbols are _referenced_ using a `FQN` (fully qualified name)
 */
export type Dependency = {
    /**
     * reference to the symbol being evaluated
     */
    symbol: FQN;

    /**
     * a hash of the symbols implementation so change can be detected
     */
    hash: number;

    /**
     * A reference to all the symbols this symbol is _dependent_ on
     */
    dependencies: FQN[];
}
