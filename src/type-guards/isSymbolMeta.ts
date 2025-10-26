import type { SymbolMeta } from "../types";
import { isArray, isObject, isUndefined } from "inferred-types";

/**
 * Type guard which checks whether the passed in value is `SymbolMeta`.
 *
 * Note: symbolHash was removed from SymbolMeta during cache system refactor,
 * now using fqn as the unique identifier instead.
 */
export function isSymbolMeta(val: unknown): val is SymbolMeta {
    return isObject(val) && "name" in val && "fqn" in val && isUndefined(val.dependsOn);
}

export function isSymbolMetaWithDependencies(val: unknown) {
    return isObject(val) && "name" in val && "fqn" in val && isArray(val.dependsOn);
}
