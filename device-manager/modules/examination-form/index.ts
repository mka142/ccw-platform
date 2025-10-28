/**
 * Examination Form Module
 * Handles examination form response storage and retrieval for user submissions
 */

// Main routes export
export { default as examinationFormRoutes } from "./routes";

// Type exports
export type { 
  ExaminationFormResponse, 
  ExaminationFormResponseWithId, 
  ExaminationFormInput,
  ExaminationFormAnswer 
} from "./types";

// Service exports
export { ExaminationFormService } from "./services";

// Database operations exports (for direct usage if needed)
export { ExaminationFormOperations } from "./db";
