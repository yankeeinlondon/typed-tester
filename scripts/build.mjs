import {  platform, cwd } from "node:process";
import chalk from "chalk";
import { execSync } from "node:child_process";
import { copyFileSync } from "fs"
import { join } from "pathe";

console.log(`Building Typed for ${platform}`);
console.log(`------------------------------`);

const node_modules_bin = platform === "win32"
? join(cwd(), "node_modules",".bin")
: `./node_modules/.bin`;

const rimraf = join(node_modules_bin, "rimraf");
const tsup = join(node_modules_bin, "tsup");

const clear_path = platform === "win32"
? join(cwd(),"/bin/")
: `./bin/*`;

try {
  execSync(`${rimraf} "${clear_path}"`);
  console.log(`- cleared ${chalk.bold("./bin")} directory of stale artifacts`);
} catch (e) {
  console.log(`- 💩 failed to clear bin directory of stale artifacts`);
  console.log(`   ${String(e)}`);
  process.exit(1);
}

const build_target = platform === "win32"
  ? join(cwd(), "/src", "typed.ts")
  : `./src/typed.ts`;

try {
  execSync(`${tsup} ${build_target} --format="esm" -d bin --sourcemap`);
  console.log(`- transpiled ${chalk.bold("TS")} source files to ${chalk.bold("JS")} using ${chalk.bold.italic("tsup")} build utility`);
} catch(e) {
  console.error(`- failed to transpile TS source!`);
  console.error(`  ${String(e)}`);
  
  process.exit(1);
}


const copy_src = platform === "win32"
  ? join(cwd(),"src/", "typed")
  : `./src/typed`;

const copy_dest = platform === "win32"
  ? join(cwd(),"bin/", "typed")
  : `./bin/typed`;

copyFileSync(copy_src, copy_dest);
try {
  console.log(`- copied ${chalk.blue(`${copy_src}`)} runner ${chalk.italic("bash script")} to ${chalk.blue(copy_dest)}`);
  
  console.log();
  console.log(`- 🚀 build successful`);
} catch (e) {
  console.log(`- 💩 failed to copy bash script from ${chalk.blue(copy_src)}} to ${chalk.blue(copy_dest)}!`);
  console.log(`   ${String(e)}`);
  
  console.log();
  process.exit(1);
}
