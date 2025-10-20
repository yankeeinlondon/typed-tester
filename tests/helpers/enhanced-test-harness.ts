import { Project } from 'ts-morph';
import { projectUsing, resetProjectCache } from '~/ast/project';
import { test_command } from '~/commands/test';
import { symbols_command } from '~/commands/symbols';
import { source_command } from '~/commands/source';
import { deps_command } from '~/commands/deps';
import { files_command } from '~/commands/files';
import type { AsOption } from '~/cli';

/**
 * Realistic performance thresholds for integration tests
 * Based on actual test execution times with full TypeScript compilation and AST parsing
 */
export const PERFORMANCE_THRESHOLDS = {
  symbols: 6000,   // Symbol extraction with dependency analysis
  source: 9000,    // Source file analysis with diagnostics
  files: 7000,     // File discovery and categorization
  deps: 7000,      // Dependency graph building
  test: 7000,      // Test execution
  default: 5000,   // Fallback for other commands
} as const;

/**
 * Realistic memory thresholds for integration tests (in MB)
 * Based on actual memory usage patterns
 */
export const MEMORY_THRESHOLDS = {
  symbols: 400,        // Symbol extraction (realistic: ~360MB observed)
  source: 400,         // Source analysis (realistic: ~360MB observed)
  files: 400,          // File discovery (realistic: ~390MB observed)
  deps: 400,           // Dependency analysis
  test: 500,           // Test execution (realistic: ~490MB observed)
  consecutive: 1000,   // Consecutive runs accumulate memory (realistic: ~925MB observed)
  default: 400,        // Fallback
} as const;

/**
 * Performance metrics for command execution
 */
export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
  };
}

/**
 * Structured output for test command
 */
export interface TestCommandOutput {
  raw: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    errors: string[];
  };
  files: string[];
  symbols: Array<{
    name: string;
    type: string;
    status: 'pass' | 'fail' | 'error';
  }>;
  quiet?: boolean;
}

/**
 * Structured output for symbols command
 */
export interface SymbolsCommandOutput {
  raw: string;
  symbols: Array<{
    name: string;
    type: string;
    file: string;
    line: number;
  }>;
  count: number;
}

/**
 * Structured output for source command
 */
export interface SourceCommandOutput {
  raw: string;
  diagnostics: Array<{
    file: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    line: number;
  }>;
  performance: {
    parseTime: number;
    files: number;
  };
}

/**
 * Enhanced test harness with performance optimizations and structured output
 */
export class EnhancedTestHarness {
  private static instance: EnhancedTestHarness | null = null;
  private project: Project | null = null;
  private projectRoot: string | null = null;
  private initialized = false;
  private initializationTime: number = 0;
  private commandExecutions: number = 0;

  private constructor() {}

  static getInstance(): EnhancedTestHarness {
    if (!EnhancedTestHarness.instance) {
      EnhancedTestHarness.instance = new EnhancedTestHarness();
    }
    return EnhancedTestHarness.instance;
  }

  /**
   * Initialize the TypeScript project with performance tracking
   */
  async initialize(projectPath?: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();

    // Store original cwd to restore later
    const originalCwd = process.cwd();

    try {
      // Reset any cached project from previous test runs
      resetProjectCache();

      // Switch to fixture project directory if specified
      if (projectPath) {
        process.chdir(projectPath);
        this.projectRoot = projectPath;
      }

      // Initialize the project using the same logic as the CLI
      // The projectUsing function will look for config files in current directory
      const [project, , root] = projectUsing([
        'tsconfig.json',
        'jsconfig.json'
      ]);

      this.project = project;
      this.projectRoot = root || this.projectRoot || process.cwd();
      this.initialized = true;
      this.initializationTime = performance.now() - startTime;

      const memoryAfter = process.memoryUsage();
      console.log(`TestHarness initialized in ${this.initializationTime.toFixed(2)}ms`);
      console.log(`Memory usage: ${(memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024} MB`);
      console.log(`Project root: ${this.projectRoot}`);
    } catch (error) {
      console.warn('Failed to initialize enhanced test harness project:', error);
      this.initialized = false;
      throw error;
    } finally {
      // Always restore original working directory
      process.chdir(originalCwd);
    }
  }

  /**
   * Execute command with performance tracking and structured output
   */
  private async executeWithMetrics<T>(
    commandName: string,
    executor: () => Promise<string>
  ): Promise<{ output: string; metrics: PerformanceMetrics }> {
    if (!this.initialized || !this.project) {
      throw new Error('Enhanced test harness not initialized');
    }

    const memoryBefore = process.memoryUsage();
    const startTime = performance.now();
    const originalCwd = process.cwd();

    this.commandExecutions++;

    try {
      // Ensure we're in the correct project directory for command execution
      if (this.projectRoot && this.projectRoot !== originalCwd) {
        process.chdir(this.projectRoot);
      }

      const output = await executor();
      const endTime = performance.now();
      const memoryAfter = process.memoryUsage();

      const metrics: PerformanceMetrics = {
        startTime,
        endTime,
        duration: endTime - startTime,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter
        }
      };

      console.log(`${commandName} executed in ${metrics.duration.toFixed(2)}ms`);

      return { output, metrics };
    } catch (error) {
      // Catch errors and return them as output for error handling tests
      const endTime = performance.now();
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`${commandName} failed after ${(endTime - startTime).toFixed(2)}ms:`, errorMessage);

      const memoryAfter = process.memoryUsage();
      const metrics: PerformanceMetrics = {
        startTime,
        endTime,
        duration: endTime - startTime,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter
        }
      };

      // Return error as output instead of throwing
      return { output: `Error: ${errorMessage}`, metrics };
    } finally {
      // Always restore original working directory
      process.chdir(originalCwd);
    }
  }

  /**
   * Run test command with structured output parsing
   */
  async runTestCommand(options: AsOption<"test">): Promise<{
    result: TestCommandOutput;
    metrics: PerformanceMetrics;
  }> {
    const { output, metrics } = await this.executeWithMetrics('test', async () => {
      return this.captureOutput(async () => {
        await test_command(options, []);
      }, true); // Always capture exit for test commands
    });

    const result = this.parseTestOutput(output);
    result.quiet = options.quiet;
    return { result, metrics };
  }

  /**
   * Run symbols command with structured output parsing
   */
  async runSymbolsCommand(options: AsOption<"symbols">): Promise<{
    result: SymbolsCommandOutput;
    metrics: PerformanceMetrics;
  }> {
    const { output, metrics } = await this.executeWithMetrics('symbols', async () => {
      return this.captureOutput(async () => {
        await symbols_command(options);
      });
    });

    const result = this.parseSymbolsOutput(output);
    return { result, metrics };
  }

  /**
   * Run source command with structured output parsing
   */
  async runSourceCommand(options: AsOption<"source">): Promise<{
    result: SourceCommandOutput;
    metrics: PerformanceMetrics;
  }> {
    const { output, metrics } = await this.executeWithMetrics('source', async () => {
      return this.captureOutput(async () => {
        await source_command(options, []);
      }, true);
    });

    const result = this.parseSourceOutput(output);
    return { result, metrics };
  }

  /**
   * Run deps command with structured output parsing
   */
  async runDepsCommand(options: AsOption<"deps">): Promise<{
    result: { raw: string; dependencies: any[] };
    metrics: PerformanceMetrics;
  }> {
    const { output, metrics } = await this.executeWithMetrics('deps', async () => {
      return this.captureOutput(async () => {
        await deps_command(options);
      });
    });

    const result = { raw: output, dependencies: this.parseDepsOutput(output) };
    return { result, metrics };
  }

  /**
   * Run files command with structured output parsing
   */
  async runFilesCommand(options: AsOption<"files">): Promise<{
    result: { raw: string; files: string[] };
    metrics: PerformanceMetrics;
  }> {
    const { output, metrics } = await this.executeWithMetrics('files', async () => {
      return this.captureOutput(async () => {
        await files_command(options);
      });
    });

    const result = { raw: output, files: this.parseFilesOutput(output) };
    return { result, metrics };
  }

  /**
   * Capture console output during command execution
   */
  private async captureOutput(
    executor: () => Promise<void>,
    captureExit: boolean = false
  ): Promise<string> {
    let output = '';
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalExit = process.exit;
    
    // Capture output without the [CAPTURED] pollution
    console.log = (...args) => {
      const message = args.join(' ');
      output += message + '\n';
      // Only log to original console in verbose mode
      // originalLog('[DEBUG]', message);
    };
    console.error = (...args) => {
      const message = args.join(' ');
      output += message + '\n';
      // originalError('[CAPTURED]', message);
    };
    console.warn = (...args) => {
      const message = 'WARN: ' + args.join(' ');
      output += message + '\n';
      // originalWarn('[CAPTURED]', message);
    };
    
    if (captureExit) {
      process.exit = ((code?: number) => {
        const exitMessage = `[Process would exit with code: ${code || 0}]`;
        output += '\n' + exitMessage + '\n';
        // Don't actually exit, just record the exit intent
        throw new Error(`Process exit captured with code: ${code || 0}`);
      }) as any;
    }

    try {
      await executor();
      return output;
    } catch (error) {
      // Capture errors in output as well, but don't include the full stack trace
      if (error instanceof Error && error.message.includes('Process exit captured')) {
        // This is expected for commands that exit - just include the exit info
        return output;
      } else {
        // For other errors, include a clean error message and return output
        const errorMessage = `EXECUTION ERROR: ${error instanceof Error ? error.message : String(error)}`;
        output += errorMessage + '\n';
        // Return output with error instead of throwing (let executeWithMetrics handle it)
        return output;
      }
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      if (captureExit) {
        process.exit = originalExit;
      }
    }
  }

  /**
   * Parse JSON test output (when --json flag is used)
   */
  private parseJsonTestOutput(jsonData: any, rawOutput: string): TestCommandOutput {
    const files: string[] = [];
    const symbols: Array<{ name: string; type: string; status: 'pass' | 'fail' | 'error' }> = [];
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    const errors: string[] = [];

    // JSON output is an array of test file results
    if (Array.isArray(jsonData)) {
      for (const fileResult of jsonData) {
        if (fileResult.filepath) {
          files.push(fileResult.filepath);
        }

        // Count tests from blocks
        if (fileResult.blocks && Array.isArray(fileResult.blocks)) {
          for (const block of fileResult.blocks) {
            if (block.tests && Array.isArray(block.tests)) {
              for (const test of block.tests) {
                totalTests++;

                // Collect symbols from test
                if (test.symbols && Array.isArray(test.symbols)) {
                  for (const sym of test.symbols) {
                    if (!symbols.find(s => s.name === sym.name)) {
                      const hasErrors = test.diagnostics && test.diagnostics.length > 0;
                      symbols.push({
                        name: sym.name,
                        type: sym.kind || 'unknown',
                        status: hasErrors ? 'fail' : 'pass'
                      });
                    }
                  }
                }

                // Check for errors
                if (test.diagnostics && test.diagnostics.length > 0) {
                  failed++;
                  for (const diag of test.diagnostics) {
                    errors.push(`${diag.msg} (${diag.code})`);
                  }
                } else {
                  passed++;
                }
              }
            }
          }
        }
      }
    }

    return {
      raw: rawOutput,
      summary: {
        totalTests,
        passed,
        failed,
        errors
      },
      files,
      symbols
    };
  }

  /**
   * Parse test command output into structured format
   */
  private parseTestOutput(output: string): TestCommandOutput {
    // Try to parse as JSON first (when --json flag is used)
    try {
      const trimmed = output.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const jsonData = JSON.parse(trimmed);
        return this.parseJsonTestOutput(jsonData, output);
      }
    } catch {
      // Not JSON, continue with text parsing
    }

    // Use output directly since we no longer prefix console.error with "ERROR:"
    const cleanedOutput = output;

    // Debug: temporarily show file parsing progress
    console.log(`[DEBUG] Starting parsing with ${cleanedOutput.split('\n').length} lines`);

    const lines = cleanedOutput.split('\n');
    const summary = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      errors: [] as string[]
    };
    const files: string[] = [];
    const symbols: Array<{ name: string; type: string; status: 'pass' | 'fail' | 'error' }> = [];

    // Check for various "no tests found" or error scenarios first
    const noTestsPatterns = [
      /no tests found/i,
      /no test files/i,
      /package\.json not found/i,
      /Process would exit with code: [12]/i // Exit codes 1 or 2 are common for errors
    ];
    
    const hasNoTests = noTestsPatterns.some(pattern => pattern.test(output));
    
    if (hasNoTests) {
      // Return valid empty structure for no-tests scenario
      return {
        raw: output,
        summary: {
          totalTests: 0,
          passed: 0,
          failed: 0,
          errors: output.includes('exit with code:') ? ['Command exited with non-zero code'] : []
        },
        files: [],
        symbols: []
      };
    }

    for (const line of lines) {
      // Parse test summary with flexible patterns for CLI output
      // Handle "3 of 7 tests had errors" and similar patterns
      const errorTestMatch = line.match(/(\d+)\s+of\s+(\d+)\s+tests?\s+had\s+errors/i);
      if (errorTestMatch) {
        summary.failed = parseInt(errorTestMatch[1]);
        summary.totalTests = parseInt(errorTestMatch[2]);
        summary.passed = summary.totalTests - summary.failed;
        continue;
      }
      
      // Handle direct test counts in summary
      const testFileMatch = line.match(/(\d+)\s+of\s+(\d+)\s+test\s+files?\s+had\s+errors/i);
      if (testFileMatch) {
        // This is file-level info, not individual test count
        continue;
      }
      
      // Parse test status indicators
      if (line.includes('tests') && (line.includes('passed') || line.includes('failed'))) {
        const match = line.match(/(\d+)\s+tests?\s+(passed|failed)/);
        if (match) {
          const count = parseInt(match[1]);
          if (match[2] === 'passed') summary.passed += count;
          if (match[2] === 'failed') summary.failed += count;
        }
      }
      
      // Parse file references from CLI output 
      // Handle complex patterns with ANSI escape sequences and hyperlinks
      // Pattern: " ⤬  ]8;;file://...tests/simple-failing.test.ts\tests/simple-failing.test.ts]8;;\ (3 tests, 100ms, 5557μs/line)"
      if (line.includes('.test.ts') || line.includes('.spec.ts')) {
        console.log(`[DEBUG] Processing line: ${line.substring(0, 80)}...`);
        
        // Try to match the hyperlink format first
        const hyperlinkMatch = line.match(/]8;;[^\\]*\\([^\\]+\.(?:test|spec)\.ts)/);
        if (hyperlinkMatch && !files.includes(hyperlinkMatch[1])) {
          files.push(hyperlinkMatch[1]);
          console.log(`[DEBUG] Matched hyperlink: ${hyperlinkMatch[1]}`);
        }
        // Try to match simple patterns as fallback
        else {
          const simpleMatch = line.match(/([^\s\]]+\.(?:test|spec)\.ts)/);
          if (simpleMatch && !files.includes(simpleMatch[1])) {
            files.push(simpleMatch[1]);
            console.log(`[DEBUG] Matched simple: ${simpleMatch[1]}`);
          } else {
            console.log(`[DEBUG] No match found for test line`);
          }
        }
      }
      
      // Parse errors (but exclude expected ones)
      if (line.startsWith('ERROR:') || line.includes('✗')) {
        if (!line.includes('package.json not found') && !line.includes('No test files')) {
          summary.errors.push(line);
        }
      }
      
      // Parse symbol information
      const symbolMatch = line.match(/([A-Za-z_][A-Za-z0-9_]*)\s+\((function|type|interface|class)\)\s+(✓|✗|error)/);
      if (symbolMatch) {
        symbols.push({
          name: symbolMatch[1],
          type: symbolMatch[2],
          status: symbolMatch[3] === '✓' ? 'pass' : symbolMatch[3] === '✗' ? 'fail' : 'error'
        });
      }
    }

    // If no explicit total found, calculate from passed + failed
    if (summary.totalTests === 0) {
      summary.totalTests = summary.passed + summary.failed;
    }

    return {
      raw: cleanedOutput, // Use cleaned output for parsing
      summary,
      files,
      symbols
    };
  }

  /**
   * Extract symbol type from JSON symbol data
   */
  private extractSymbolType(symbolData: any): string {
    // Check flags array for type information
    if (Array.isArray(symbolData.flags)) {
      if (symbolData.flags.includes('Interface')) return 'interface';
      if (symbolData.flags.includes('TypeAlias')) return 'type';
      if (symbolData.flags.includes('Class')) return 'class';
      if (symbolData.flags.includes('Function')) return 'function';
      if (symbolData.flags.includes('Enum')) return 'enum';
    }

    // Fall back to kind field
    if (symbolData.kind) {
      if (symbolData.kind === 'type-defn') return 'type';
      if (symbolData.kind === 'class') return 'class';
      if (symbolData.kind === 'function') return 'function';
      return symbolData.kind;
    }

    return 'unknown';
  }

  /**
   * Parse symbols command output into structured format
   */
  private parseSymbolsOutput(output: string): SymbolsCommandOutput {
    // Try to parse as JSON first (if json option was used)
    try {
      // Extract JSON array portion (look for array of objects pattern)
      // The JSON will be on its own line(s) after dependency graph messages
      const jsonMatch = output.match(/(\[\s*\{[\s\S]*\]\s*)$/m);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[1]);
        const symbols = Array.isArray(jsonData) ? jsonData : [jsonData];
        return {
          raw: output,
          symbols: symbols.map(s => ({
            name: s.name,
            // Extract type from flags array if available
            type: this.extractSymbolType(s),
            file: s.filepath || s.file || '',
            line: s.startLine || s.line || 0
          })),
          count: symbols.length
        };
      }

      // Fall back to direct JSON parsing if output starts with JSON
      const trimmed = output.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const jsonData = JSON.parse(trimmed);
        const symbols = Array.isArray(jsonData) ? jsonData : [jsonData];
        return {
          raw: output,
          symbols: symbols.map(s => ({
            name: s.name,
            type: this.extractSymbolType(s),
            file: s.filepath || s.file || '',
            line: s.startLine || s.line || 0
          })),
          count: symbols.length
        };
      }
    } catch (e) {
      // Fall through to table parsing
      console.warn('Failed to parse JSON output:', e);
    }

    // Parse table output - look for symbols in table rows
    const lines = output.split('\n');
    const symbols: Array<{ name: string; type: string; file: string; line: number }> = [];
    
    // Look for table content and extract symbol information
    for (const line of lines) {
      // Skip header and separator lines
      if (line.includes('Symbol') || line.includes('───') || line.includes('├') || line.includes('┌') || line.includes('└')) {
        continue;
      }
      
      // Extract symbol name from table rows (first column)
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('⏺') && trimmed.includes('│')) {
        const columns = trimmed.split('│').map(col => col.trim());
        if (columns.length >= 2 && columns[1]) {
          // Clean up the symbol name (remove ANSI codes and formatting)
          const symbolName = columns[1].replace(/\x1b\[[0-9;]*m/g, '').trim();
          if (symbolName && /^[A-Za-z_][A-Za-z0-9_]*/.test(symbolName)) {
            symbols.push({
              name: symbolName.split('<')[0], // Remove generics for matching
              type: 'unknown', // Type info not easily extractable from table
              file: columns[2] ? columns[2].replace(/\x1b\[[0-9;]*m/g, '').trim() : '',
              line: 0
            });
          }
        }
      }
    }
    
    return {
      raw: output,
      symbols,
      count: symbols.length
    };
  }

  /**
   * Parse source command output into structured format
   */
  private parseSourceOutput(output: string): SourceCommandOutput {
    const lines = output.split('\n');
    const diagnostics: Array<{ file: string; severity: 'error' | 'warning' | 'info'; message: string; line: number }> = [];
    const performance = { parseTime: 0, files: 0 };

    for (const line of lines) {
      // Parse diagnostics
      const diagMatch = line.match(/([^:]+):(\d+):(\d+)\s+-(\s+)(error|warning|info)\s+(.+)/);
      if (diagMatch) {
        diagnostics.push({
          file: diagMatch[1],
          line: parseInt(diagMatch[2]),
          severity: diagMatch[5] as 'error' | 'warning' | 'info',
          message: diagMatch[6]
        });
      }
      
      // Parse performance metrics
      const timeMatch = line.match(/Parsed in ([\d.]+)ms/);
      if (timeMatch) {
        performance.parseTime = parseFloat(timeMatch[1]);
      }
      
      const filesMatch = line.match(/(\d+) files processed/);
      if (filesMatch) {
        performance.files = parseInt(filesMatch[1]);
      }
    }

    return {
      raw: output,
      diagnostics,
      performance
    };
  }

  /**
   * Parse deps command output
   */
  private parseDepsOutput(output: string): any[] {
    // Implementation depends on deps command output format
    // For now, return raw parsing
    return output.split('\n').filter(line => line.trim().length > 0);
  }

  /**
   * Parse files command output
   */
  private parseFilesOutput(output: string): string[] {
    const lines = output.split('\n');
    const files: string[] = [];
    
    for (const line of lines) {
      // Look for file paths (typically end with .ts, .js, etc.)
      const fileMatch = line.match(/([^\s]+\.(ts|js|tsx|jsx|json))/);
      if (fileMatch && !files.includes(fileMatch[1])) {
        files.push(fileMatch[1]);
      }
    }
    
    return files;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    initializationTime: number;
    commandExecutions: number;
    isInitialized: boolean;
    projectRoot: string | null;
  } {
    return {
      initializationTime: this.initializationTime,
      commandExecutions: this.commandExecutions,
      isInitialized: this.initialized,
      projectRoot: this.projectRoot
    };
  }

  /**
   * Check if harness is available
   */
  isAvailable(): boolean {
    return this.initialized && this.project !== null;
  }

  /**
   * Get project root directory
   */
  getProjectRoot(): string | null {
    return this.projectRoot;
  }

  /**
   * Validate test environment before execution
   */
  async validateEnvironment(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }
    
    try {
      // Quick validation - check if we can access basic project info
      const sourceFiles = this.project!.getSourceFiles();
      return sourceFiles.length > 0;
    } catch (error) {
      console.warn('Environment validation failed:', error);
      return false;
    }
  }

  /**
   * Clean up resources with validation
   */
  async cleanup(): Promise<void> {
    console.log(`Cleaning up TestHarness (executed ${this.commandExecutions} commands)`);

    // Reset the global project cache
    resetProjectCache();

    if (this.project) {
      // Clean up any project-specific resources
      this.project = null;
    }

    this.projectRoot = null;
    this.initialized = false;
    this.commandExecutions = 0;
    this.initializationTime = 0;
    EnhancedTestHarness.instance = null;

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}

/**
 * Enhanced helper function to get optimized default options for commands
 */
export function getOptimizedDefaultOptions<T extends string>(command: T): any {
  const baseOptions = {
    verbose: false,
    quiet: false, // Must be false to capture output in tests
    filter: [],
    config: undefined,
    json: true // Use JSON for easier parsing and type extraction
  };

  switch (command) {
    case 'test':
      return {
        ...baseOptions,
        warn: [],
        'show-passing': false, // Reduce output noise
        'ignore-outside': true, // Focus on test files only
        clear: false,
        files: false,
        slow: false, // Optimize for speed
        'only-errors': false,
        'show-symbols': false
      } as any;
    
    case 'symbols':
      return {
        ...baseOptions,
        'sort-by': 'name',
        'show-symbols': false
      } as any;
    
    case 'source':
      return {
        ...baseOptions,
        warn: []
      } as any;
    
    case 'deps':
      return {
        ...baseOptions,
        warn: []
      } as any;
    
    case 'files':
      return {
        ...baseOptions,
        warn: []
      } as any;
    
    default:
      return baseOptions as any;
  }
}

/**
 * Performance assertion helpers
 */
export class PerformanceAssertions {
  static expectExecutionTime(metrics: PerformanceMetrics, maxMs: number, commandName: string): void {
    if (metrics.duration > maxMs) {
      throw new Error(
        `${commandName} took ${metrics.duration.toFixed(2)}ms, expected under ${maxMs}ms`
      );
    }
  }
  
  static expectMemoryUsage(metrics: PerformanceMetrics, maxMB: number, commandName: string): void {
    const usedMB = (metrics.memoryUsage.after.heapUsed - metrics.memoryUsage.before.heapUsed) / 1024 / 1024;
    if (usedMB > maxMB) {
      throw new Error(
        `${commandName} used ${usedMB.toFixed(2)}MB memory, expected under ${maxMB}MB`
      );
    }
  }
}

/**
 * Output validation helpers
 */
export class OutputValidators {
  static validateTestOutput(output: TestCommandOutput): void {
    if (!output.raw || output.raw.trim().length === 0) {
      throw new Error('Test command produced no output');
    }
    
    if (output.summary.totalTests === 0) {
      throw new Error('No tests were found or executed');
    }
  }
  
  static validateSymbolsOutput(output: SymbolsCommandOutput): void {
    if (!output.raw || output.raw.trim().length === 0) {
      throw new Error('Symbols command produced no output');
    }
    
    if (output.count === 0) {
      throw new Error('No symbols were found');
    }
  }
  
  static validateSourceOutput(output: SourceCommandOutput): void {
    if (!output.raw || output.raw.trim().length === 0) {
      throw new Error('Source command produced no output');
    }
  }
}