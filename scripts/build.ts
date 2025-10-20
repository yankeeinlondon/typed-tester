#!/usr/bin/env bun run
import {  platform, cwd } from "node:process";
import { execSync } from "node:child_process";
import chalk from "chalk";
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, chmodSync } from "fs"
import { join } from "pathe";


function clear_build() {
    // clear files from `./bin` directory
    const binDir = join(cwd(), "bin");

    // Remove existing bin directory if it exists
    if (existsSync(binDir)) {
        console.log(chalk.dim(`  Removing existing ${chalk.blue("bin/")} directory...`));
        rmSync(binDir, { recursive: true, force: true });
    }

    // Create fresh bin directory
    console.log(chalk.dim(`  Creating ${chalk.blue("bin/")} directory...`));
    mkdirSync(binDir, { recursive: true });
}

function build() {
    // using TSDown (and the configuration file in this repo) to build JS
    // and place it into "bin" directory.
    console.log(chalk.dim(`  Transpiling TypeScript with ${chalk.cyan("tsdown")}...`));

    try {
        execSync("npx tsdown", {
            stdio: "inherit",
            cwd: cwd(),
            // @ts-expect-error - shell:true is valid per Node.js docs but @types/node has strict overload typing
            shell: true // Required for Windows - ensures npx.cmd is found
        });
    } catch (error) {
        console.error(chalk.red("Build failed!"));
        process.exit(1);
    }
}

function add_shebang() {
    // adds a shebang to the first line of the transpiled JS
    const jsFile = join(cwd(), "bin", "typed.js");
    // Use 'node' instead of 'bun run' for better cross-runtime compatibility
    // npm/pnpm/bun will create appropriate wrappers when the package is installed
    const shebang = "#!/usr/bin/env node\n";

    if (!existsSync(jsFile)) {
        console.error(chalk.red(`Error: ${jsFile} not found!`));
        process.exit(1);
    }

    const content = readFileSync(jsFile, "utf-8");

    // Check if shebang already exists
    if (!content.startsWith("#!")) {
        console.log(chalk.dim(`  Adding shebang to ${chalk.blue("bin/typed.js")}...`));
        writeFileSync(jsFile, shebang + content, "utf-8");
    } else {
        console.log(chalk.dim(`  Shebang already exists in ${chalk.blue("bin/typed.js")}`));
    }

    // Make the JS file executable on Unix-like systems (no-op on Windows)
    if (platform !== "win32") {
        chmodSync(jsFile, 0o755);
    }
}

console.log(`Building Typed CLI`);
console.log(`------------------`);

clear_build();
build();
add_shebang();
