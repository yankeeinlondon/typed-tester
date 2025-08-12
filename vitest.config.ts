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
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.fast.test.ts'
    ],
    exclude: [
      'node_modules', 
      'dist', 
      'bin', 
      'tests/integration/cli-commands.test.ts', // Use faster harness version
      'tests/fixtures/**/*' // Exclude fixture test files from being run directly
    ],
    // Optimized timeouts for fast integration tests
    testTimeout: 10000, // 10 seconds max per test (our target is <2s per command)
    hookTimeout: 5000,  // 5 seconds for setup/teardown
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
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'bin/',
        'dist/',
        'ai/',
        'scripts/',
        '*.config.*',
        'tests/fixtures/**/*',
        'tests/helpers/**/*'
      ],
      // Performance thresholds for coverage
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
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
