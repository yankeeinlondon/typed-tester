import type { SymbolMeta } from "~/types";
import { isArray, isObject, isUndefined } from "inferred-types";

/**
 * Type guard which checks whether the passed in value `SymbolInfo`
 * dictionary.
 */
export function isSymbolMeta(val: unknown): val is SymbolMeta {
    return isObject(val) && "name" in val && "symbolHash" in val && isUndefined(val.dependsOn);
}

export function isSymbolMetaWithDependencies(val: unknown) {
    return isObject(val) && "name" in val && "symbolHash" in val && isArray(val.dependsOn);
}
