#!/usr/bin/env node

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

// Get environment variables that might contain prompt info
const promptType = process.env.CLAUDE_PROMPT_TYPE || process.env.PROMPT_TYPE || "input";
const promptContext = process.env.CLAUDE_PROMPT_CONTEXT || process.env.PROMPT_CONTEXT || "";
const promptMessage = process.env.CLAUDE_PROMPT_MESSAGE || process.env.PROMPT_MESSAGE || "";

// Also check command line arguments which might contain event data
const args = process.argv.slice(2);
const eventData = args.length > 0 ? args[0] : null;

console.log("⏸️  Waiting for user input");
console.log(`📦 Project: ${projectName}`);
if (promptType !== "input") {
  console.log(`❓ Prompt type: ${promptType}`);
}
if (promptContext) {
  console.log(`📋 Context: ${promptContext}`);
}
if (promptMessage) {
  console.log(`💬 Message: ${promptMessage}`);
}
if (eventData) {
  try {
    const parsed = JSON.parse(eventData);
    if (parsed.type) {
      console.log(`❓ Type: ${parsed.type}`);
    }
    if (parsed.message) {
      console.log(`💬 Message: ${parsed.message}`);
    }
    if (parsed.context) {
      console.log(`📋 Context: ${parsed.context}`);
    }
  } catch (e) {
    // Not JSON, might be plain text
    if (eventData !== "{}") {
      console.log(`ℹ️ Event data: ${eventData}`);
    }
  }
}
console.log("⏰ Waiting since:", new Date().toISOString());

// Debug: Show all environment variables that might contain Claude info
const claudeEnvVars = Object.entries(process.env)
  .filter(([key]) => key.includes("CLAUDE") || key.includes("PROMPT"))
  .map(([key, value]) => `  ${key}: ${value}`);

if (claudeEnvVars.length > 0) {
  console.log("🔍 Debug - Claude environment variables:");
  claudeEnvVars.forEach(line => console.log(line));
}

console.log("----------------------------------------");

// Build message for audio announcement
const message = `Claude is waiting for your input in the ${projectName} project`;

// Use macOS's `say` command for audio announcement
if (process.platform === "darwin") {
  spawn("say", [message], { stdio: "ignore", detached: true }).unref();
}

// Exit successfully
process.exit(0);