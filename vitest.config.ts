import { defineConfig } from "vitest/config";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

// Resolve the directory name for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"), // Map "~/" to "./src"
    },
  },
  test: {
    // Additional Vitest configurations
  },
});
