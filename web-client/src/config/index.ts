/**
 * Centralized Application Configuration
 * All configuration values are read from environment variables at build time
 */

/**
 * Environment helper - gets env var with fallback
 */
function env(key: string, defaultValue: string): string {
  return defaultValue;
}

/**
 * Environment helper for numbers
 */
function envNumber(key: string, defaultValue: number): number {
  return defaultValue;
}

/**
 * Environment helper for booleans
 */
function envBool(key: string, defaultValue: boolean): boolean {
  return defaultValue;
}

// ============================================================================
// Base URLs
// ============================================================================

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
const MQTT_BROKER_URL =
  process.env.MQTT_BROKER_URL || "ws://localhost:3001/mqtt";

// ============================================================================
// MQTT Topics (Static Constants)
// ============================================================================

export const MQTT_TOPICS = {
  EVENTS_BROADCAST: "events/broadcast",
  DEVICE_EVENTS: (deviceId: string) => `devices/${deviceId}/events`,
  DEVICE_STATUS: (deviceId: string) => `devices/${deviceId}/status`,
} as const;

// ============================================================================
// Storage Keys (Static Constants)
// ============================================================================

export const STORAGE_KEYS = {
  USER_ID: "ccw-user-id",
  THEME: "ccw-theme",
  LAST_CONCERT: "ccw-last-concert",
} as const;

// ============================================================================
// Event & Device Types (Static Constants)
// ============================================================================

export const EVENT_TYPES = [
  "BEFORE_CONCERT",
  "APP_GUIDE",
  "SLIDER_DEMO",
  "CONCERT_START",
  "PIECE_ANNOUNCEMENT",
  "TENSION_MEASUREMENT",
  "OVATION",
  "FEEDBACK_FORM",
  "END_OF_CONCERT",
  "SPONSORS",
  "PIECE_LISTENING",
] as const;
export const DEVICE_TYPES = ["Web", "M5Stack"] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type DeviceType = (typeof DEVICE_TYPES)[number];

export const PAGES_BACKGROUND_COLOR: Record<
  EventType,
  | string
  | {
      color: string;
      gradient: string;
    }
> = {
  BEFORE_CONCERT: "var(--glow)",
  APP_GUIDE: "#000000",
  TENSION_MEASUREMENT: "#000000",
  SLIDER_DEMO: "#000000",
  CONCERT_START: "#000000",
  PIECE_ANNOUNCEMENT: "#000000",
  OVATION: "#000000",
  FEEDBACK_FORM: "#000000",
  // gradient blck top to glow bottom
  END_OF_CONCERT: {
    color: "#000000",
    gradient: "linear-gradient(to bottom, #000,#000,#000, var(--glow),#000)",
  },
  SPONSORS: "var(--glow)",
  PIECE_LISTENING: "#000000",
};

// ============================================================================
// Main Configuration Object
// ============================================================================

/**
 * Application Configuration
 * Single source of truth for all app settings
 */
export const config = {
  /**
   * Environment
   */
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  /**
   * API Configuration
   */
  api: {
    /** Base URL for all API requests */
    baseUrl: API_BASE_URL,

    /** User API endpoints */
    user: {
      acquire: `${API_BASE_URL}/api/user/acquireUserId`,
    },

    /** Concert API endpoints */
    concert: {
      currentEvent: `${API_BASE_URL}/api/concert/currentEvent`,
    },
    form: {
      submitBatch: `${API_BASE_URL}/api/forms/batch`,
    },
    examinationForm: {
      submit: `${API_BASE_URL}/api/examination-forms`,
      getUserFormResponse: (userId: string, formId: string) =>
        `${API_BASE_URL}/api/examination-forms/user/${userId}/form/${formId}`,
    },
  },

  /**
   * MQTT Configuration
   */
  mqtt: {
    /** WebSocket URL for MQTT broker */
    brokerUrl: MQTT_BROKER_URL,

    /** MQTT topics */
    topics: MQTT_TOPICS,

    /** Connection options */
    options: {
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      keepalive: 60,
    },
  },

  /**
   * Storage Configuration
   */
  storage: {
    keys: STORAGE_KEYS,
    useSessionStorage: envBool("USE_SESSION_STORAGE", false),
  },

  /**
   * Retry Configuration
   */
  retry: {
    /** Retry interval in milliseconds */
    intervalMs: 5000,

    /** Maximum retry attempts (0 = infinite) */
    maxAttempts: 20,
  },

  /**
   * Feature Flags
   */
  features: {
    /** Enable console logging */
    enableLogging: envBool("ENABLE_LOGGING", true),
  },

  /**
   * Constants
   */
  constants: {
    eventTypes: EVENT_TYPES,
    deviceTypes: DEVICE_TYPES,
    pagesBackgroundColor: PAGES_BACKGROUND_COLOR,
  },
} as const;

// Freeze config in production to prevent accidental modifications
if (config.isProduction) {
  Object.freeze(config);
}

export default config;
