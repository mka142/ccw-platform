/**
 * Form Module
 * Handles form data storage and retrieval for client submissions
 */

// Main routes export
export { default as formRoutes } from "./routes";

// Type exports
export type { FormData, FormDataWithId, FormBatchInput, FormDataPoint } from "./types";

// Service exports
export { FormService } from "./services";

// Database operations exports (for direct usage if needed)
export { FormOperations } from "./db";
