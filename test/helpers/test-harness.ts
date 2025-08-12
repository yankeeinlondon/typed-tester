import { Project } from 'ts-morph';
import { projectUsing } from '~/ast/project';
import { test_command } from '~/commands/test';
import { symbols_command } from '~/commands/symbols';
import { source_command } from '~/commands/source';
import { deps_command } from '~/commands/deps';
import { files_command } from '~/commands/files';
import type { AsOption } from '~/cli';

/**
 * Test harness that reuses TypeScript compiler instance between tests
 * to improve performance by avoiding repeated project initialization
 */
export class TestHarness {
  private static instance: TestHarness | null = null;
  private project: Project | null = null;
  private projectRoot: string | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): TestHarness {
    if (!TestHarness.instance) {
      TestHarness.instance = new TestHarness();
    }
    return TestHarness.instance;
  }

  /**
   * Initialize the TypeScript project once for all tests
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize the project using the same logic as the CLI
      const [project, , root] = projectUsing([
        'tsconfig.json',
        'jsconfig.json'
      ]);
      
      this.project = project;
      this.projectRoot = root;
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize test harness project:', error);
      // Fall back to CLI spawning if project initialization fails
      this.initialized = false;
    }
  }

  /**
   * Run test command using the shared project instance
   */
  async runTestCommand(options: AsOption<"test">): Promise<string> {
    if (!this.initialized || !this.project) {
      throw new Error('Test harness not initialized');
    }

    // Capture output by mocking console methods
    let output = '';
    const originalLog = console.log;
    const originalError = console.error;
    const originalExit = process.exit;
    
    console.log = (...args) => {
      output += args.join(' ') + '\n';
    };
    console.error = (...args) => {
      output += args.join(' ') + '\n';
    };
    
    // Mock process.exit to prevent test termination
    process.exit = ((code?: number) => {
      output += `\n[Process would exit with code: ${code || 0}]\n`;
      // Don't actually exit
    }) as any;

    try {
      await test_command(options, []);
      return output;
    } finally {
      // Restore original methods
      console.log = originalLog;
      console.error = originalError;
      process.exit = originalExit;
    }
  }

  /**
   * Run symbols command using the shared project instance
   */
  async runSymbolsCommand(options: AsOption<"symbols">): Promise<string> {
    if (!this.initialized || !this.project) {
      throw new Error('Test harness not initialized');
    }

    let output = '';
    const originalLog = console.log;
    
    console.log = (...args) => {
      output += args.join(' ') + '\n';
    };

    try {
      await symbols_command(options);
      return output;
    } finally {
      console.log = originalLog;
    }
  }

  /**
   * Run source command using the shared project instance
   */
  async runSourceCommand(options: AsOption<"source">): Promise<string> {
    if (!this.initialized || !this.project) {
      throw new Error('Test harness not initialized');
    }

    let output = '';
    const originalLog = console.log;
    const originalError = console.error;
    const originalExit = process.exit;
    
    console.log = (...args) => {
      output += args.join(' ') + '\n';
    };
    console.error = (...args) => {
      output += args.join(' ') + '\n';
    };
    
    // Mock process.exit to prevent test termination
    process.exit = ((code?: number) => {
      output += `\n[Process would exit with code: ${code || 0}]\n`;
    }) as any;

    try {
      await source_command(options, []);
      return output;
    } finally {
      console.log = originalLog;
      console.error = originalError;
      process.exit = originalExit;
    }
  }

  /**
   * Run deps command using the shared project instance
   */
  async runDepsCommand(options: AsOption<"deps">): Promise<string> {
    if (!this.initialized || !this.project) {
      throw new Error('Test harness not initialized');
    }

    let output = '';
    const originalLog = console.log;
    
    console.log = (...args) => {
      output += args.join(' ') + '\n';
    };

    try {
      await deps_command(options);
      return output;
    } finally {
      console.log = originalLog;
    }
  }

  /**
   * Run files command using the shared project instance
   */
  async runFilesCommand(options: AsOption<"files">): Promise<string> {
    if (!this.initialized || !this.project) {
      throw new Error('Test harness not initialized');
    }

    let output = '';
    const originalLog = console.log;
    
    console.log = (...args) => {
      output += args.join(' ') + '\n';
    };

    try {
      await files_command(options);
      return output;
    } finally {
      console.log = originalLog;
    }
  }

  /**
   * Check if harness is available (project initialized successfully)
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
   * Clean up resources (for testing teardown)
   */
  cleanup(): void {
    this.project = null;
    this.projectRoot = null;
    this.initialized = false;
    TestHarness.instance = null;
  }
}

/**
 * Helper function to get default options for a command
 */
export function getDefaultOptions<T extends string>(command: T): any {
  const baseOptions = {
    verbose: false,
    quiet: true, // Use quiet mode for tests
    filter: [],
    config: undefined,
    json: false
  };

  switch (command) {
    case 'test':
      return {
        ...baseOptions,
        warn: [],
        'show-passing': false,
        'ignore-outside': false,
        clear: false,
        files: false,
        slow: false,
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