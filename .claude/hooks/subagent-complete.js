#!/usr/bin/env bun run


// hooks/sessionStart.js
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

// Read and parse package.json
const packageJsonPath = path.resolve(process.cwd(), "package.json");
const { name: rawProjectName } = JSON.parse(readFileSync(packageJsonPath, "utf8"));

// Remove npm-style namespace if present (e.g., "@org/repo" -> "repo")
const projectName = rawProjectName.includes("/")
  ? rawProjectName.split("/").pop()
  : rawProjectName;

export default function registerSessionStartHook(hooks) {
  hooks.on("SubagentStop", async (event) => {
    const source = event?.payload?.source ?? "unknown source";

    const message = `Project ${projectName} completed work from a sub-agent`;

    // Use macOS's `say` command
    spawn("say", [message], { stdio: "ignore", detached: true }).unref();
  });
}
