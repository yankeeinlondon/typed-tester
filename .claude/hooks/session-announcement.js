#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";

// Read and parse package.json to get project name
const packageJsonPath = path.resolve(process.cwd(), "package.json");
const { name: rawProjectName } = JSON.parse(readFileSync(packageJsonPath, "utf8"));

// Remove npm-style namespace if present (e.g., "@org/repo" -> "repo")
const projectName = rawProjectName.includes("/")
  ? rawProjectName.split("/").pop()
  : rawProjectName;

console.log(`🚀 Claude session started for ${projectName} project`);
console.log("📦 Working directory:", process.cwd());
console.log("⏰ Session started at:", new Date().toISOString());
console.log("----------------------------------------");

// Exit successfully
process.exit(0);