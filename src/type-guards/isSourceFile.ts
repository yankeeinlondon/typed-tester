import type { SourceFile } from "ts-morph";
import { isObject } from "inferred-types";

export function isSourceFile(val: unknown): val is SourceFile {
    return isObject(val)
        && (typeof val?.addModule === "function")
        && (typeof val?.copy === "function")
        && (typeof val?.delete === "function")
        && (typeof val?.addEnum === "function");
}
