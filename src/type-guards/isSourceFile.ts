import { isObject } from "inferred-types";
import { SourceFile } from "ts-morph";

export const isSourceFile = (val: unknown): val is SourceFile => {
  return isObject(val) && 
  (typeof val?.addModule === "function") &&
  (typeof val?.copy === "function") &&
  (typeof val?.delete === "function") &&
  (typeof val?.addEnum === "function")
}
