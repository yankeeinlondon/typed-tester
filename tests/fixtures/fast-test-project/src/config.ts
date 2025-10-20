/**
 * Configuration types and utilities for fixture testing
 */

// Configuration interfaces
export interface AppConfig {
  appName: string;
  version: string;
  environment: Environment;
  database: DatabaseConfig;
  api: ApiConfig;
  features: FeatureFlags;
}

export type Environment = "development" | "staging" | "production";

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  poolSize: number;
  timeout: number;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
}

export interface FeatureFlags {
  enableBetaFeatures: boolean;
  enableDebugMode: boolean;
  enableAnalytics: boolean;
  maxUploadSize: number;
}

// Default configuration
export const defaultConfig: AppConfig = {
  appName: "Test Application",
  version: "1.0.0",
  environment: "development",
  database: {
    host: "localhost",
    port: 5432,
    database: "testdb",
    username: "test",
    password: "test",
    poolSize: 10,
    timeout: 5000
  },
  api: {
    baseUrl: "http://localhost:3000",
    timeout: 30000,
    retries: 3,
    headers: {
      "Content-Type": "application/json"
    }
  },
  features: {
    enableBetaFeatures: false,
    enableDebugMode: true,
    enableAnalytics: false,
    maxUploadSize: 10485760 // 10MB
  }
};

// Configuration validation
export function validateConfig(config: Partial<AppConfig>): string[] {
  const errors: string[] = [];

  if (config.database) {
    if (config.database.port < 1 || config.database.port > 65535) {
      errors.push("Invalid database port");
    }
    if (config.database.poolSize < 1) {
      errors.push("Pool size must be at least 1");
    }
  }

  if (config.api) {
    if (config.api.timeout < 0) {
      errors.push("API timeout must be non-negative");
    }
    if (config.api.retries < 0) {
      errors.push("API retries must be non-negative");
    }
  }

  return errors;
}

// Configuration merging
export function mergeConfig(base: AppConfig, override: Partial<AppConfig>): AppConfig {
  return {
    ...base,
    ...override,
    database: {
      ...base.database,
      ...(override.database || {})
    },
    api: {
      ...base.api,
      ...(override.api || {})
    },
    features: {
      ...base.features,
      ...(override.features || {})
    }
  };
}

// Environment detection
export function isProduction(env: Environment): boolean {
  return env === "production";
}

export function isDevelopment(env: Environment): boolean {
  return env === "development";
}

export function getEnvironmentFromString(env: string): Environment {
  const normalized = env.toLowerCase();
  if (normalized === "production" || normalized === "prod") {
    return "production";
  }
  if (normalized === "staging" || normalized === "stage") {
    return "staging";
  }
  return "development";
}
