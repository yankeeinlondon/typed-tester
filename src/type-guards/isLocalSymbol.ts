import { isString } from "inferred-types"
import { LocalSymbol } from "src/cache/cache-types"


export const isLocalSymbol = (val: unknown): val is LocalSymbol => {
  return isString(val) && val.startsWith("local::")
}
