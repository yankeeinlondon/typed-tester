import { isString } from "inferred-types"
import { LocalSymbol } from "src/cache/cache-types"

/**
 * type guard which detects leading `local::` and corrects type to
 * be a `LocalSymbol` representation.
 */
export const isLocalSymbol = (val: unknown): val is LocalSymbol => {
  return isString(val) && val.startsWith("local::")
}
