import { spawn } from "node:child_process";
import { join } from "node:path";

/**
 * Result returned from subprocess execution
 */
export interface SubprocessResult {
    /** Exit code from subprocess (0 = success, non-zero = failure) */
    exitCode: number;
    /** Content captured from stdout */
    stdout: string;
    /** Content captured from stderr */
    stderr: string;
    /** Execution time in milliseconds */
    executionTime: number;
}

/**
 * Options for subprocess execution
 */
export interface SubprocessOptions {
    /** Timeout in milliseconds (default: 30000ms) */
    timeout?: number;
    /** Working directory for subprocess */
    cwd?: string;
}

/**
 * Executes the typed CLI command in a subprocess and captures output.
 *
 * This is the foundation of the new test harness approach - executing the CLI
 * as a real subprocess instead of intercepting console output in-process.
 *
 * @param args - Command-line arguments to pass to bin/typed.js
 * @param options - Execution options (timeout, cwd)
 * @returns Promise resolving to subprocess execution result
 *
 * @example
 * ```typescript
 * const result = await executeCliCommand(["--help"]);
 * console.log(result.stdout); // CLI help output
 * console.log(result.exitCode); // 0 for success
 * ```
 */
export async function executeCliCommand(
    args: string[],
    options: SubprocessOptions = {},
): Promise<SubprocessResult> {
    const { timeout = 30000, cwd = process.cwd() } = options;

    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        // Path to the CLI entry point
        const cliPath = join(process.cwd(), "bin", "typed.js");

        // Spawn the subprocess
        const subprocess = spawn("node", [cliPath, ...args], {
            cwd,
            stdio: ["ignore", "pipe", "pipe"], // stdin ignored, stdout/stderr piped
        });

        // Buffers for output capture
        let stdoutData = "";
        let stderrData = "";

        // Capture stdout
        subprocess.stdout.on("data", (chunk: Buffer) => {
            stdoutData += chunk.toString("utf8");
        });

        // Capture stderr
        subprocess.stderr.on("data", (chunk: Buffer) => {
            stderrData += chunk.toString("utf8");
        });

        // Timeout handling
        const timeoutId = setTimeout(() => {
            subprocess.kill("SIGTERM");
            reject(new Error(`Subprocess timeout after ${timeout}ms`));
        }, timeout);

        // Handle subprocess exit
        subprocess.on("exit", (code) => {
            clearTimeout(timeoutId);

            const executionTime = Date.now() - startTime;
            const exitCode = code ?? -1; // -1 if code is null

            resolve({
                exitCode,
                stdout: stdoutData,
                stderr: stderrData,
                executionTime,
            });
        });

        // Handle subprocess errors
        subprocess.on("error", (err) => {
            clearTimeout(timeoutId);
            reject(new Error(`Subprocess error: ${err.message}`));
        });
    });
}
