import { SymbolInfo } from "src/ast/symbols";
import { XXHashAPI } from "xxhash-wasm";
import { readFileSync, statSync} from "node:fs"
import { join } from "pathe";
import { cwd } from "node:process";


export const createFileHashes = (hasher: XXHashAPI["h32"]) => (s: SymbolInfo) => {
  const filepath = join(cwd(), s.filepath);
  const fileMeta = statSync(filepath);
  const content = readFileSync(filepath, "utf-8");

  const baseHash = hasher(JSON.stringify([fileMeta.atimeMs, content]));
  const trimmedHash = hasher(content.trim());

  return [baseHash, trimmedHash]
}
