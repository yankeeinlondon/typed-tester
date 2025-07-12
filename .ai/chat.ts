#!/usr/bin/env bun

import * as fs from 'fs';
import { spawnSync, execSync } from 'child_process';
import process from 'process';
import chalk from 'chalk';
import {globSync} from 'fast-glob';
import "dotenv/config";

/**
 * Reads and returns the content of a file.
 * Throws an error if the file does not exist.
 * @param filepath - path to the file
 * @returns file content as string
 */
export function getFile(filepath: string): string {
    if(filepath.length < 50 && filepath.endsWith(".md") && !filepath.includes("/")) {
        filepath = `ai/prompts/${filepath}`
    }
  if (!fs.existsSync(filepath)) {
    throw new Error(`getFile() called but no file found at: ${filepath}`);
  }
  return fs.readFileSync(filepath, { encoding: 'utf8' });
}

/**
 * Checks whether a command is available in the current environment.
 * @param cmd - command name to check
 * @returns true if command exists, false otherwise
 */
export function hasCommand(cmd: string): boolean {
  try {
    // Using shell built-in to check if command exists
    execSync(`command -v ${cmd}`, { stdio: 'ignore', env: process.env });
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs the chat command by reading context from a file,
 * verifying that the required command is installed, and
 * then invoking the external command with the provided prompt.
 * @param prompt - message prompt to send
 */
export function chat(prompt: string, files: string[]): void {
  let context: string;
  try {
    context = getFile('./ai/prompts/context.md');
  } catch (error) {
    console.log(chalk.redBright("warning: ")  + `no context [${chalk.dim("ai/promps/context.md")}] provided. Question in raw form will be used.`);
    console.log();
    context = ""
  }

  if (prompt.length < 50 && prompt.endsWith(".md")) {
    prompt = getFile(prompt);
  }

  // Use environment variables with defaults
  const MODEL = process.env.MODEL || 'o3-mini';
  const EDITOR_MODEL = process.env.EDITOR_MODEL || 'sonnet';
  const REASONING = process.env.REASONING || 'high';

  if (hasCommand('aider')) {
    console.log(`Starting [ ${MODEL}, ${EDITOR_MODEL}, ${REASONING} ]...`);

    const args: string[] = [
        '--model', MODEL,
        '--architect',
        '--reasoning-effort', REASONING,
        '--editor-model', EDITOR_MODEL,
        '--no-detect-urls',
        '--no-auto-commit',
        '--yes-always',

        ...files.reduce(
            (acc, i) => i.includes("*")
                ? [...acc, ...(globSync(i).reduce(
                    (group, file) => [ ...group, "--file", file], [] as string[]
                ))]
                : [ ...acc, "--file", i], [] as string[]
        ),
        '--message', context + prompt
    ];

    // Spawn the aider command with the specified arguments
    const result = spawnSync('aider', args, { stdio: 'inherit', env: process.env });
    if (result.error) {
      console.error('Error running aider:', result.error);
      process.exit(1);
    }
  } else {
    console.error("- you don't have the aider assistant installed");
    console.error("- this is a requirement for running this chat prompt");
    console.error('');
    console.error("- install aider and then rerun");
    process.exit(1);
  }
}

