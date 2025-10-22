import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = path.dirname(currentFilename);

/**
 * Environment helper - gets env var with fallback
 */
function env(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

/**
 * Environment helper for numbers
 */
function envNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

/**
 * Environment helper for booleans
 */
function envBool(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Application Configuration
 * All configuration in one place, typed and validated
 */
export const config = {
  /**
   * Environment
   */
  env: env("NODE_ENV", "development"),
  isDevelopment: env("NODE_ENV", "development") === "development",
  isProduction: env("NODE_ENV", "production") === "production",

  /**
   * Server Configuration
   */
  server: {
    port: envNumber("PORT", 3001),
    host: env("HOST", "localhost"),
  },

  /**
   * MQTT Configuration
   */
  mqtt: {
    // Broker settings
    host: env("MQTT_HOST", "localhost"),
    port: envNumber("MQTT_PORT", 1883),

    // Server publisher credentials
    serverPassword: env("MQTT_SERVER_PASSWORD", "change-this-in-production-2024"),

    // WebSocket settings
    websocketPath: env("MQTT_WS_PATH", "/mqtt"),

    /**
     * Get the MQTT broker URL
     * For internal publisher connecting to the broker
     */
    get brokerUrl(): string {
      return `mqtt://${this.host}:${this.port}`;
    },
    serverUsername: env("MQTT_SERVER_USERNAME", "server-publisher"),
    serverClientId: `server-publisher-${Math.random().toString(16).substr(2, 8)}`,
  },

  /**
   * Database Configuration
   */
  database: {
    url: env("DATABASE_URL", "mongodb://localhost:27017"),
    name: env("DATABASE_NAME", "device_manager"),
    user: env("DATABASE_USER", ""),
    password: env("DATABASE_PASSWORD", ""),
    collections: {
      users: env("DATABASE_COLLECTION_USERS", "users"),
      concerts: env("DATABASE_COLLECTION_CONCERTS", "concerts"),
      events: env("DATABASE_COLLECTION_EVENTS", "events"),
    },
  },

  /**
   * Redis Configuration
   */
  redis: {
    host: env("REDIS_HOST", "localhost"),
    port: envNumber("REDIS_PORT", 6379),
    password: env("REDIS_PASSWORD", ""),
    enabled: envBool("REDIS_ENABLED", false),
  },

  /**
   * Paths Configuration
   */
  paths: {
    root: path.join(currentDirname, ".."),
    views: path.join(currentDirname, "../modules/admin/views"),
    public: path.join(currentDirname, "../public"),
    logs: path.join(currentDirname, "../logs"),
  },

  monitoringIntervalMs: 60000, // 1 minute
} as const;
