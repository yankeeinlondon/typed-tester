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

// Get environment variables that might contain subagent info
// Claude passes information through environment variables
const subagentType = process.env.CLAUDE_SUBAGENT_TYPE || process.env.SUBAGENT_TYPE || "unknown";
const subagentTask = process.env.CLAUDE_SUBAGENT_TASK || process.env.SUBAGENT_TASK || "";
const subagentDescription = process.env.CLAUDE_SUBAGENT_DESCRIPTION || process.env.SUBAGENT_DESCRIPTION || "";

// Also check command line arguments which might contain event data
const args = process.argv.slice(2);
const eventData = args.length > 0 ? args[0] : null;

console.log("✅ Subagent task completed");
console.log(`📦 Project: ${projectName}`);
if (subagentType !== "unknown") {
  console.log(`🤖 Subagent type: ${subagentType}`);
}
if (subagentTask) {
  console.log(`📋 Task: ${subagentTask}`);
}
if (subagentDescription) {
  console.log(`📝 Description: ${subagentDescription}`);
}
if (eventData) {
  try {
    const parsed = JSON.parse(eventData);
    if (parsed.subagent_type) {
      console.log(`🤖 Subagent: ${parsed.subagent_type}`);
    }
    if (parsed.description) {
      console.log(`📝 Task: ${parsed.description}`);
    }
  } catch (e) {
    // Not JSON, might be plain text
    if (eventData !== "{}") {
      console.log(`ℹ️ Event data: ${eventData}`);
    }
  }
}
console.log("⏰ Completed at:", new Date().toISOString());

// Debug: Show all environment variables that might contain Claude info
const claudeEnvVars = Object.entries(process.env)
  .filter(([key]) => key.includes("CLAUDE") || key.includes("SUBAGENT"))
  .map(([key, value]) => `  ${key}: ${value}`);

if (claudeEnvVars.length > 0) {
  console.log("🔍 Debug - Claude environment variables:");
  claudeEnvVars.forEach(line => console.log(line));
}

console.log("----------------------------------------");

// Build message for audio announcement
const agentName = subagentType !== "unknown" ? subagentType : "a sub-agent";
const message = `${agentName} agent finished ${subagentTask} work in the project ${projectName}`;

// Use macOS's `say` command for audio announcement
if (process.platform === "darwin") {
  spawn("say", [message], { stdio: "ignore", detached: true }).unref();
}

// Exit successfully
process.exit(0);
