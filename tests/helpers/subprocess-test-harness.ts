import { executeCliCommand } from "./subprocess-executor";
import type { SubprocessOptions } from "./subprocess-executor";

/**
 * Performance metrics for test command execution
 */
export interface PerformanceMetrics {
    /** Execution time in milliseconds */
    executionTime: number;
}

/**
 * Result from running test command via subprocess
 */
export interface TestCommandResult {
    /** Raw stdout output from test command */
    output: string;
    /** Exit code (0 = success, non-zero = failure) */
    exitCode: number;
    /** Execution time in milliseconds */
    executionTime: number;
    /** Performance metrics (for compatibility) */
    metrics?: PerformanceMetrics;
}

/**
 * Options for test command
 */
export interface TestCommandOptions {
    /** Filter patterns for test files */
    filter?: string[];
    /** Quiet mode (minimal output) */
    quiet?: boolean;
    /** Verbose mode (detailed output) */
    verbose?: boolean;
    /** Show passing tests */
    showPassing?: boolean;
}

/**
 * Runs the typed test command as a subprocess.
 *
 * This is the new subprocess-based approach that replaces console interception.
 * It executes the CLI as a real subprocess, exactly like a user would run it,
 * and captures the actual stdout/stderr output.
 *
 * @param options - Test command options
 * @param projectPath - Path to project directory (optional, defaults to cwd)
 * @returns Promise resolving to test command result with metrics
 *
 * @example
 * ```typescript
 * const result = await runTestCommand({
 *   filter: ["my-test.test.ts"],
 *   quiet: false
 * });
 * console.log(result.output); // Test results
 * console.log(result.exitCode); // 0 for pass, non-zero for fail
 * ```
 */
export async function runTestCommand(
    options: TestCommandOptions,
    projectPath?: string,
): Promise<TestCommandResult> {
    // Build command arguments
    const args: string[] = ["test"];

    // Add filter arguments
    if (options.filter && options.filter.length > 0) {
        args.push(...options.filter);
    }

    // Add flags
    if (options.quiet) {
        args.push("--quiet");
    }
    if (options.verbose) {
        args.push("--verbose");
    }
    if (options.showPassing) {
        args.push("--show-passing");
    }

    // Execute command via subprocess
    const subprocessOptions: SubprocessOptions = {
        timeout: 30000, // 30 second timeout for test execution
    };

    if (projectPath) {
        subprocessOptions.cwd = projectPath;
    }

    const result = await executeCliCommand(args, subprocessOptions);

    // Return structured result
    return {
        output: result.stdout,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
        metrics: {
            executionTime: result.executionTime,
        },
    };
}

/**
 * Generic command result (used by all commands)
 */
export interface CommandResult {
    /** Raw stdout output from command */
    output: string;
    /** Exit code (0 = success, non-zero = failure) */
    exitCode: number;
    /** Execution time in milliseconds */
    executionTime: number;
}

/**
 * Options for symbols command
 */
export interface SymbolsCommandOptions {
    /** Filter patterns */
    filter?: string[];
    /** Quiet mode */
    quiet?: boolean;
    /** Verbose mode */
    verbose?: boolean;
}

/**
 * Options for source command
 */
export interface SourceCommandOptions {
    /** Filter patterns */
    filter?: string[];
    /** Quiet mode */
    quiet?: boolean;
    /** Verbose mode */
    verbose?: boolean;
}

/**
 * Options for deps command
 */
export interface DepsCommandOptions {
    /** Filter patterns */
    filter?: string[];
    /** Graph mode */
    graph?: boolean;
    /** Quiet mode */
    quiet?: boolean;
}

/**
 * Options for files command
 */
export interface FilesCommandOptions {
    /** Filter patterns */
    filter?: string[];
    /** Quiet mode */
    quiet?: boolean;
}

/**
 * Runs the typed symbols command as a subprocess.
 */
export async function runSymbolsCommand(
    options: SymbolsCommandOptions,
    projectPath?: string,
): Promise<CommandResult> {
    const args: string[] = ["symbols"];

    if (options.filter && options.filter.length > 0) {
        args.push(...options.filter);
    }
    if (options.quiet) {
        args.push("--quiet");
    }
    if (options.verbose) {
        args.push("--verbose");
    }

    const subprocessOptions: SubprocessOptions = { timeout: 30000 };
    if (projectPath) {
        subprocessOptions.cwd = projectPath;
    }

    const result = await executeCliCommand(args, subprocessOptions);

    return {
        output: result.stdout,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
    };
}

/**
 * Runs the typed source command as a subprocess.
 */
export async function runSourceCommand(
    options: SourceCommandOptions,
    projectPath?: string,
): Promise<CommandResult> {
    const args: string[] = ["source"];

    if (options.filter && options.filter.length > 0) {
        args.push(...options.filter);
    }
    if (options.quiet) {
        args.push("--quiet");
    }
    if (options.verbose) {
        args.push("--verbose");
    }

    const subprocessOptions: SubprocessOptions = { timeout: 30000 };
    if (projectPath) {
        subprocessOptions.cwd = projectPath;
    }

    const result = await executeCliCommand(args, subprocessOptions);

    // Source command outputs to stderr, so combine stdout + stderr
    return {
        output: result.stdout + result.stderr,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
    };
}

/**
 * Runs the typed deps command as a subprocess.
 */
export async function runDepsCommand(
    options: DepsCommandOptions,
    projectPath?: string,
): Promise<CommandResult> {
    const args: string[] = ["deps"];

    if (options.filter && options.filter.length > 0) {
        args.push(...options.filter);
    }
    if (options.graph) {
        args.push("--graph");
    }
    if (options.quiet) {
        args.push("--quiet");
    }

    const subprocessOptions: SubprocessOptions = { timeout: 30000 };
    if (projectPath) {
        subprocessOptions.cwd = projectPath;
    }

    const result = await executeCliCommand(args, subprocessOptions);

    return {
        output: result.stdout,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
    };
}

/**
 * Runs the typed files command as a subprocess.
 */
export async function runFilesCommand(
    options: FilesCommandOptions,
    projectPath?: string,
): Promise<CommandResult> {
    const args: string[] = ["files"];

    if (options.filter && options.filter.length > 0) {
        args.push(...options.filter);
    }
    if (options.quiet) {
        args.push("--quiet");
    }

    const subprocessOptions: SubprocessOptions = { timeout: 30000 };
    if (projectPath) {
        subprocessOptions.cwd = projectPath;
    }

    const result = await executeCliCommand(args, subprocessOptions);

    return {
        output: result.stdout,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
    };
}

/**
 * Backward compatibility: Export types that match enhanced-test-harness API
 */
export type { SubprocessOptions as CommandOptions };
