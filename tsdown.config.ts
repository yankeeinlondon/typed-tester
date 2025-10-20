import { defineConfig } from "tsdown";


export default defineConfig([
    {
        entry: ["src/typed.ts"],
        format: ["esm"],
        dts: false,
        sourcemap: true,
        tsconfig: "./tsconfig.json",
        outDir: "bin"
    }

]);

