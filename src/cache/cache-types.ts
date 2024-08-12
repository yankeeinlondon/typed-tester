import { Dictionary, ExpandDictionary } from "inferred-types";
import { SymbolInfo } from "src/ast/symbols";

export type WithHash<T extends Dictionary> = ExpandDictionary<
  T & Record<"hash", number>
>


/**
 * a `LocalSymbol` is a proxy name for a symbol which is _not_ exported
 * and local in scope. The `LocalSymbol` name is a means to make the 
 * symbol guaranteed to unique across the project and a better citizen
 * for caching.
 * 
 * The structure is:
 * 
 * `local::{filepath hash value}::{symbol name}`
 * 
 * **Related:** `isLocalSymbol()`, `createLocalSymbol()`
 */
export type LocalSymbol = `local::${number}::${string}`;

/**
 * A lookup table which is _keyed_ on the unique **name** of a symbol.
 * 
 * Note: _since private types might not be uniquely identified by their name alone
 * they will be named as `local::${filepath-hash}::${symbol-name}` where the 
 * _filepath-hash_ is the fully qualified path passed through a XXHash hasher._
 * 
 * **Related:** `isLocalSymbol()`, `createLocalSymbol()`
 */
export type SymbolLookup = Map<string, WithHash<SymbolInfo>>
