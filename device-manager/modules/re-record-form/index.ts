/**
 * Re-Record Form Module
 * Handles re-record form management, responses, and recording sessions
 * 
 * Architecture Layers:
 * - db/         Database operations (CRUD)
 * - services/   Business logic layer
 * - routes/     HTTP API endpoints and views
 * - types.ts    Type definitions
 * 
 * Features:
 * - ReRecordForm management (create, edit, delete, list)
 * - Response management with unique access tokens
 * - Recording session handling
 * - Batch data submission
 * - Audio file serving
 */

// Main routes export
export { default as reRecordFormRoutes } from "./routes";

// Type exports
export type {
  ReRecordForm,
  ReRecordFormWithId,
  Response,
  ResponseWithId,
  DataPoint,
  ConnectionLog,
  ReRecordFormInput,
  ResponseInput,
  StartRecordingInput,
  BatchDataInput,
} from "./types";

// Service exports
export { ReRecordFormService } from "./services/reRecordFormService";
export { ResponseService } from "./services/responseService";

// Database operations exports (for direct usage if needed)
export { ReRecordFormOperations, ResponseOperations } from "./db";

