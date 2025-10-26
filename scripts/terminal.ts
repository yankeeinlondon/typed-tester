#!/usr/bin/env bun run

import { rightJustifyText } from "~/utils/rightJustifyText";
import { availableWidth, consumedWidth, detectTerminalTheme } from "../src/utils"
import { buildDependencyGraph, getGraphStatistics, getProject, projectUsing } from "~/ast";
import { cwd } from "process";
import findRoot from "find-root";
import { join } from "pathe";

console.log(`Terminal Info`);
console.log();
const theme = await detectTerminalTheme()
console.log(`Character width: ${availableWidth()}`)
console.log(`Theme: ${theme}`)
console.log();

const root = findRoot(cwd());
console.log(root)

const [prj] = projectUsing([join(root,"tsconfig.json")]);
const deps = buildDependencyGraph(prj);
const stats = getGraphStatistics(deps);

console.log(stats)
