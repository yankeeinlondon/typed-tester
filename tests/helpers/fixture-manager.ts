import { Project, type CompilerOptions } from 'ts-morph';
import { join, dirname } from 'path';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';

/**
 * **FixtureManager**
 *
 * Manages temporary TypeScript project fixtures for testing.
 * Creates isolated test environments with controlled file structures
 * and TypeScript configurations.
 *
 * @example
 * ```typescript
 * const manager = new FixtureManager();
 * const project = manager.createProject({
 *   'src/index.ts': 'export const foo = 42;',
 *   'src/types.ts': 'export type Bar = string;'
 * });
 *
 * // Run tests with project...
 *
 * manager.cleanup(); // Clean up temp files
 * ```
 */
export class FixtureManager {
  private tempDirs: string[] = [];
  private currentProject: Project | null = null;
  private currentRoot: string | null = null;

  /**
   * Create a temporary TypeScript project with specified files
   *
   * @param files - Map of file paths to content
   * @param compilerOptions - Optional TypeScript compiler options
   * @returns Initialized ts-morph Project
   */
  createProject(
    files: Record<string, string>,
    compilerOptions?: Partial<CompilerOptions>
  ): Project {
    // Create unique temporary directory
    const tempDir = join(
      tmpdir(),
      `typed-tester-fixture-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    );

    mkdirSync(tempDir, { recursive: true });
    this.tempDirs.push(tempDir);
    this.currentRoot = tempDir;

    // Create tsconfig.json
    const tsConfigPath = join(tempDir, 'tsconfig.json');
    const tsConfig = this.createTsConfig(compilerOptions || {});
    writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));

    // Create all specified files
    for (const [filepath, content] of Object.entries(files)) {
      const fullPath = join(tempDir, filepath);
      const dir = dirname(fullPath);

      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(fullPath, content, 'utf-8');
    }

    // Initialize ts-morph project
    const project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: true // We'll add files manually
    });

    // Manually add all created source files
    for (const filepath of Object.keys(files)) {
      const fullPath = join(tempDir, filepath);
      project.addSourceFileAtPath(fullPath);
    }

    this.currentProject = project;
    return project;
  }

  /**
   * Create a TypeScript configuration object
   *
   * @param options - Compiler options to merge with defaults
   * @returns Complete tsconfig.json structure
   */
  createTsConfig(options: Partial<CompilerOptions>): Record<string, any> {
    return {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        lib: ['ES2022'],
        moduleResolution: 'bundler',
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        declaration: true,
        declarationMap: true,
        ...options
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules', '**/*.test.ts', '**/*.spec.ts']
    };
  }

  /**
   * Add a file to the current project
   *
   * @param filepath - Relative path from project root
   * @param content - File content
   * @throws Error if no project is active
   */
  addFile(filepath: string, content: string): void {
    if (!this.currentRoot) {
      throw new Error('No active project. Call createProject() first.');
    }

    const fullPath = join(this.currentRoot, filepath);
    const dir = dirname(fullPath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(fullPath, content, 'utf-8');

    // Add to ts-morph project if available
    if (this.currentProject) {
      this.currentProject.addSourceFileAtPath(fullPath);
    }
  }

  /**
   * Update an existing file in the project
   *
   * @param filepath - Relative path from project root
   * @param content - New file content
   * @throws Error if no project is active or file doesn't exist
   */
  updateFile(filepath: string, content: string): void {
    if (!this.currentRoot) {
      throw new Error('No active project. Call createProject() first.');
    }

    const fullPath = join(this.currentRoot, filepath);

    if (!existsSync(fullPath)) {
      throw new Error(`File does not exist: ${filepath}`);
    }

    writeFileSync(fullPath, content, 'utf-8');

    // Update in ts-morph project
    if (this.currentProject) {
      const sourceFile = this.currentProject.getSourceFile(fullPath);
      if (sourceFile) {
        sourceFile.refreshFromFileSystemSync();
      }
    }
  }

  /**
   * Get the current project root directory
   *
   * @returns Absolute path to temp directory or null
   */
  getProjectRoot(): string | null {
    return this.currentRoot;
  }

  /**
   * Get the current ts-morph Project instance
   *
   * @returns Project instance or null
   */
  getProject(): Project | null {
    return this.currentProject;
  }

  /**
   * Get a source file by its relative path
   *
   * @param relativePath - Relative path from project root (e.g., 'src/types.ts')
   * @returns Source file or undefined
   */
  getSourceFile(relativePath: string) {
    if (!this.currentProject) {
      return undefined;
    }

    return this.currentProject
      .getSourceFiles()
      .find(f => f.getFilePath().endsWith(relativePath));
  }

  /**
   * Create a test fixture with common patterns
   *
   * @param name - Fixture preset name
   * @returns Initialized Project
   */
  createPreset(name: 'basic' | 'with-types' | 'with-errors' | 'with-dependencies'): Project {
    switch (name) {
      case 'basic':
        return this.createProject({
          'src/index.ts': `export const hello = 'world';`,
          'src/utils.ts': `export function add(a: number, b: number): number { return a + b; }`
        });

      case 'with-types':
        return this.createProject({
          'src/types.ts': `
export type User = {
  id: number;
  name: string;
  email: string;
};

export interface Config {
  apiUrl: string;
  timeout: number;
}

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };
          `,
          'src/index.ts': `
import type { User, Config, Result } from './types';

export const config: Config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

export function getUser(id: number): Result<User> {
  return {
    success: true,
    data: { id, name: 'Test', email: 'test@example.com' }
  };
}
          `
        });

      case 'with-errors':
        return this.createProject({
          'src/broken.ts': `
export const broken: string = 42; // Type error
export function test(x) { return x; } // Missing type annotation
const unused = 'never used'; // Unused variable
          `
        });

      case 'with-dependencies':
        return this.createProject({
          'src/types.ts': `export type ID = string | number;`,
          'src/user.ts': `
import type { ID } from './types';
export interface User {
  id: ID;
  name: string;
}
          `,
          'src/service.ts': `
import type { User } from './user';
export class UserService {
  getUser(id: string): User | null {
    return null;
  }
}
          `,
          'src/index.ts': `
import { UserService } from './service';
export const service = new UserService();
          `
        });

      default:
        throw new Error(`Unknown preset: ${name}`);
    }
  }

  /**
   * Clean up all temporary directories created by this manager
   */
  cleanup(): void {
    for (const dir of this.tempDirs) {
      try {
        if (existsSync(dir)) {
          rmSync(dir, { recursive: true, force: true });
        }
      } catch (error) {
        console.warn(`Failed to clean up temp directory ${dir}:`, error);
      }
    }

    this.tempDirs = [];
    this.currentProject = null;
    this.currentRoot = null;
  }

  /**
   * Clean up and reset for a new test
   */
  reset(): void {
    this.cleanup();
  }
}

/**
 * Create a fixture manager instance for a single test
 * Automatically cleans up after test completes
 *
 * @example
 * ```typescript
 * import { afterEach } from 'vitest';
 *
 * const manager = createFixtureManager();
 * afterEach(() => manager.cleanup());
 * ```
 */
export function createFixtureManager(): FixtureManager {
  return new FixtureManager();
}
