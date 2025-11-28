import type { BaseDocument, DocumentWithId, ObjectId } from "@/lib/types";

/**
 * Re-Record Form Module Types
 */

/**
 * Data point for recording measurements
 */
export interface DataPoint {
  t: number; // timestamp
  v: number; // value
}

/**
 * Connection log entry for tracking measurement app connectivity
 */
export interface ConnectionLog {
  status: 'connected' | 'disconnected';
  timestamp: number;
}

/**
 * ReRecordForm schema - the main form configuration
 */
interface ReRecordFormSchema {
  name: string;
  pieceId: string;
  description: string;
  audioFilePath: string;       // Stored path after upload
  audioFileName: string;       // Original filename
  measurementAppUrl: string;   // Contains {RESPONSE_ID} placeholder
}

/**
 * Base ReRecordForm document (for creation)
 */
export interface ReRecordForm extends BaseDocument, ReRecordFormSchema {}

/**
 * ReRecordForm document with ID (from database)
 */
export interface ReRecordFormWithId extends DocumentWithId, ReRecordFormSchema {}

/**
 * Response schema - user recording responses
 */
interface ResponseSchema {
  reRecordFormId: ObjectId;              // Link to parent form
  name: string;                          // Admin-set name
  accessToken: string;                   // Unique token for recipient access
  isActive: boolean;
  recordingTimestampStart: number | null;
  recordingDelay: number;                // milliseconds
  recordingFinished: boolean;
  data: DataPoint[];                     // timestamp, value pairs
  lastHeartbeat: number | null;          // Last heartbeat from measurement app
  connectionLogs: ConnectionLog[];       // Connection history
}

/**
 * Base Response document (for creation)
 */
export interface Response extends BaseDocument, ResponseSchema {}

/**
 * Response document with ID (from database)
 */
export interface ResponseWithId extends DocumentWithId, ResponseSchema {}

/**
 * API input for creating a new ReRecordForm
 */
export interface ReRecordFormInput {
  name: string;
  pieceId: string;
  description: string;
  measurementAppUrl: string;
}

/**
 * API input for creating a new Response
 */
export interface ResponseInput {
  reRecordFormId: string;
  name: string;
}

/**
 * API input for starting a recording
 */
export interface StartRecordingInput {
  recordingDelay: number;
}

/**
 * API input for batch data submission
 */
export interface BatchDataInput {
  data: DataPoint[];
}

