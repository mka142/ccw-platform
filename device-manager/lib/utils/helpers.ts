/**
 * Generic utility helper functions
 */

/**
 * Validates if a string is valid JSON
 * @param str - The string to validate
 * @returns True if the string is valid JSON, false otherwise
 */
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safely parses JSON with a fallback value
 * @param str - The string to parse
 * @param fallback - The fallback value if parsing fails
 * @returns Parsed JSON or fallback value
 */
export const safeJSONParse = <T>(str: string, fallback: T): T => {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
};

/**
 * Generates a timestamp-based ID
 * @returns A string ID based on current timestamp
 */
export const generateTimestampId = (): string => {
  return Date.now().toString();
};

/**
 * Generates a UUID v4
 * @returns A UUID v4 string
 */
export const generateUUID = (): string => {
  return globalThis.crypto.randomUUID();
};
