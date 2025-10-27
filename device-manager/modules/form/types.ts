import type { BaseDocument, DocumentWithId, ObjectId } from "@/lib/types";

/**
 * Form Module Types
 */

/**
 * Individual form data entry schema
 */
interface FormDataSchema {
  clientId: ObjectId;
  pieceId: string;
  timestamp: number; // Can be accessed as 't' alias
  value: number; // Can be accessed as 'v' alias
}

/**
 * Base form data document (for creation)
 */
export interface FormData extends BaseDocument, FormDataSchema {}

/**
 * Form data document with ID (from database)
 */
export interface FormDataWithId extends DocumentWithId, FormDataSchema {
  clientId: ObjectId;
}

/**
 * Batch input format for API
 * Allows submitting multiple data points for the same client and piece
 */
export interface FormBatchInput {
  clientId: string; // Will be converted to ObjectId
  pieceId: string;
  data: Array<{
    timestamp: number;
    value: number;
  }>;
}

/**
 * Individual data point in a batch
 */
export interface FormDataPoint {
  timestamp: number;
  value: number;
}
