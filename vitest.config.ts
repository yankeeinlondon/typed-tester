import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Resolve the directory name for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"), // Map "~/" to "./src"
    },
  },
  test: {
    globals: true,
    environment: 'node',
    disableConsoleIntercept: true, // Allow test harness to capture console output
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.fast.test.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      'bin',
      'tests/integration/cli-commands.test.ts', // Use faster harness version
      'tests/fixtures/**/*', // Exclude fixture test files from being run directly
      // Exclude integration tests when running coverage (they're 3-5x slower with instrumentation)
      ...(process.env.COVERAGE ? ['tests/integration/**/*'] : [])
    ],
    // Realistic timeouts for integration tests (increased from 10s to handle full AST compilation)
    testTimeout: 30000, // 30 seconds max per test (allows for realistic TypeScript compilation times)
    hookTimeout: 10000,  // 10 seconds for setup/teardown (harness initialization can take time)
    teardownTimeout: 5000,
    // Optimized pool configuration for fast tests
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 4, // Reduced forks for faster startup
        minForks: 1
      }
    },
    // Performance optimizations
    isolate: true, // Ensure clean test isolation
    sequence: {
      concurrent: true, // Run tests concurrently where possible
      shuffle: false   // Don't shuffle for consistent performance
    },
    // Fast integration test specific configuration
    setupFiles: [],
    globalSetup: [],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/**/*.ts'
      ],
      exclude: [
        'node_modules/',
        'tests/',
        'bin/',
        'dist/',
        'ai/',
        'scripts/',
        '*.config.*',
        'tests/fixtures/**/*',
        'tests/helpers/**/*',
        'src/typed.ts', // CLI entry point (covered by integration tests)
        'src/**/*.d.ts', // Type definition files
        'src/**/index.ts', // Re-export files (no logic to test)
        'src/help.ts', // Help text
        'src/errors.ts' // Error definitions
      ],
      // Realistic thresholds based on current coverage (~11%)
      // Gradually increase these as coverage improves
      thresholds: {
        global: {
          branches: 30,
          functions: 40,
          lines: 40,
          statements: 40
        },
        // Critical path coverage requirements (gradually increase these)
        './src/ast/symbols.ts': {
          branches: 30,
          functions: 50,
          lines: 40,
          statements: 40
        },
        './src/ast/dependency-graph.ts': {
          branches: 0,
          functions: 0,
          lines: 3,
          statements: 3
        },
        './src/cache/dependency-cache.ts': {
          branches: 0,
          functions: 0,
          lines: 1,
          statements: 1
        }
      },
      // Report uncovered lines for easy identification
      all: true,
      skipFull: false,
      clean: true,
      reportsDirectory: './coverage'
    },
    // Reporter configuration for fast feedback
    reporter: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results.xml'
    }
  },
  // ESBuild optimizations for faster TypeScript compilation
  esbuild: {
    target: 'es2022'
  }
});
