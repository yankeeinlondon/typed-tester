import { readFileSync } from "fs";
import { SymbolInfo } from "src/ast/symbols";
import { XXHashAPI } from "xxhash-wasm";

function lines(fileContents: string, startLine: number, endLine: number): string {
  const linesArray = fileContents.split("\n");
  // Adjust startLine and endLine to zero-based index
  const startIndex = startLine - 1;
  const endIndex = endLine;

  const selectedLines = linesArray.slice(startIndex, endIndex);
  return selectedLines.join("\n");
}

export const hashSymbol = (hasher: XXHashAPI["h32"]) => (symbol: SymbolInfo) => {
  const file_contents = readFileSync(symbol.filepath, "utf-8");
  const symbol_defn = lines(file_contents, symbol.startLine, symbol.endLine);
  return hasher(symbol_defn);
}
