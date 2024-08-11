import {  platform } from "node:process";
import chalk from "chalk";
import { execSync } from "node:child_process";
import { copyFileSync } from "fs"
import { join } from "pathe";

console.log(`Building Typed for ${platform}`);
console.log(`------------------------------`);

const node_modules_bin = platform === "win32"
? `node_modules\\.bin`
: `./node_modules/.bin`;

const rimraf = join(node_modules_bin, "rimraf");
const tsup = join(node_modules_bin, "tsup");

const clear_path = platform === "win32"
? `bin\\*`
: `./bin/*`;

execSync(`${rimraf} ${clear_path}`);
console.log(`- cleared ${chalk.bold("bin")} directory of stale artifacts`);

const build_target = platform === "win32"
  ? `src\\typed.ts`
  : `./src/typed.ts`;

if(execSync(`${tsup} ${build_target} --format=esm -d bin --sourcemap`)) {
  console.log(`- transpiled ${chalk.bold("JS")} files from ${chalk.bold("TS")} source using ${chalk.bold("tsup")} build utility`);
} else {
  console.error(`- failed to transpile TS source!`);
  process.exit(1);
}


const copy_src = platform === "win32"
  ? `src\\typed`
  : `./src/typed`;

const copy_dest = platform === "win32"
  ? `bin\\typed`
  : `./bin/typed`;

copyFileSync(copy_src, copy_dest);
console.log(`- copied ${chalk.bold(`${copy_src}`)} bash script to from ${chalk.bold(`${copy_dest}`)}`);

console.log();
console.log(`- 🚀 build successful`);
