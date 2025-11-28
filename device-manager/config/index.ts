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

function envStringOrList(key: string, defaultValue: string | string[]): string | string[] {
  const value = process.env[key];
  if (!value) return defaultValue;
  // Check for comma-separated values
  if (value.includes(",")) {
    return value.split(",").map((v) => v.trim());
  }
  return value;
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
   * CORS Configuration
   */
  cors: {
    // Allow all origins in development, specific origin in production
    origin: envStringOrList("CORS_ORIGIN", env("NODE_ENV", "development") === "development" ? "*" : ["http://localhost:3000", "http://127.0.0.1:3000"]),
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
    url: env("DATABASE_URL", "mongodb://root:example@localhost:27017"),
    name: env("DATABASE_NAME", "device_manager"),
    user: env("DATABASE_USER", "root"),
    password: env("DATABASE_PASSWORD", "example"),
    collections: {
      users: env("DATABASE_COLLECTION_USERS", "users"),
      concerts: env("DATABASE_COLLECTION_CONCERTS", "concerts"),
      events: env("DATABASE_COLLECTION_EVENTS", "events"),
      forms: env("DATABASE_COLLECTION_FORMS", "forms"),
      examinationForms: env("DATABASE_COLLECTION_EXAMINATION_FORMS", "examination_forms"),
      reRecordForms: env("DATABASE_COLLECTION_RERECORD_FORMS", "re_record_forms"),
      responses: env("DATABASE_COLLECTION_RESPONSES", "responses"),
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
    views: {
      admin: path.join(currentDirname, "../modules/admin/views"),
      examinationForm: path.join(currentDirname, "../modules/examination-form/views"),
      reRecordForm: path.join(currentDirname, "../modules/re-record-form/views"),
    },
    public: path.join(currentDirname, "../public"),
    uploads: path.join(currentDirname, "../uploads"),
    logs: path.join(currentDirname, "../logs"),
  },
  url: {
    admin: "/admin",
    apiConcert: "/api/concert",
    apiUser: "/api/user",
    apiForm: "/api/forms",
    examinationForm: '/examination-forms',
    apiExaminationForm: "/api/examination-forms",
    reRecordForm: "/re-record-forms",
    apiReRecordForm: "/api/re-record-forms",
  },
  api: {
    userIdHeader: env("API_USER_ID_HEADER", "x-user-id"),
  },
  admin: {
    username: env("ADMIN_USERNAME", "admin"),
    password: env("ADMIN_PASSWORD", "admin123"), // Change in production
  },

  monitoringIntervalMs: 60000, // 1 minute
} as const;
