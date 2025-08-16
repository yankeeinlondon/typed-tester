import type { FQN } from "~/types";

export function isFQN(val: string): val is FQN {
    return val.startsWith("local::") || val.startsWith("module::") || val.startsWith("external::");
}
