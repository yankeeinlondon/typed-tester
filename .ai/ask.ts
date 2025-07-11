#!/usr/bin/env bun 

import {chat} from "./chat";

// Get the CLI arguments (ignoring the first two: node and script path)
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('no prompt passed into chat!');
  process.exit(1);
}

const files = [
    "package.json",
    "docs/overview.md",
    "docs/symbols.md",
    "src/**/*.ts",
    ...args.slice(1).filter(i => !i.startsWith("-"))
]

chat(args[0], files);
