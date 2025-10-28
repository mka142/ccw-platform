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
 * Uses short property names to save bandwidth: t=timestamp, v=value
 */
export interface FormBatchInput {
  clientId: string; // Will be converted to ObjectId
  pieceId: string;
  data: Array<{
    t: number; // timestamp
    v: number; // value
  }>;
}

/**
 * Individual data point in a batch
 * Uses short property names to save bandwidth: t=timestamp, v=value
 */
export interface FormDataPoint {
  t: number; // timestamp
  v: number; // value
}
