import { parseId } from "@/lib/db/utils";

import { ResponseOperations } from "../db";
import { ReRecordFormService } from "./reRecordFormService";
import { checkRecordingTimeout } from "../lib/timeoutUtils";

import type { Response, ResponseWithId, ResponseInput, DataPoint } from "../types";
import type { OperationResult, ObjectId } from "@/lib/types";

/**
 * Response Service - Business Logic Layer
 * Handles response operations including recording management
 */
export class ResponseService {
  static async getResponsesByForm(reRecordFormId: string | ObjectId): Promise<ResponseWithId[]> {
    return ResponseOperations.findByReRecordForm(reRecordFormId);
  }

  static async getResponseById(id: string | ObjectId): Promise<ResponseWithId | null> {
    return ResponseOperations.findById(id);
  }

  static async getResponseByToken(accessToken: string): Promise<ResponseWithId | null> {
    return ResponseOperations.findByToken(accessToken);
  }

  static async createResponse(input: ResponseInput): Promise<OperationResult<ResponseWithId>> {
    const accessToken = crypto.randomUUID();
    
    // Get pieceDuration from the form
    const form = await ReRecordFormService.getFormById(input.reRecordFormId);
    const pieceDuration = form?.pieceDuration || null;
    
    const response: Response = {
      reRecordFormId: parseId(input.reRecordFormId),
      name: input.name,
      accessToken,
      isActive: false,  // Start as inactive until measurement app connects
      recordingTimestampStart: null,
      recordingFinished: false,
      data: [],
      lastHeartbeat: null,
      connectionLogs: [],
      pieceDuration,
      error: null,
    };

    return ResponseOperations.create(response);
  }

  static async updateResponseName(
    id: string | ObjectId,
    name: string
  ): Promise<OperationResult<ResponseWithId | null>> {
    return ResponseOperations.updateById(id, { name });
  }

  /**
   * Start recording with client-provided timestamp
   * The timestamp should be the exact moment when audio playback starts (Date.now() + delay on client)
   * pieceDuration should already be set from the form when the response was created
   */
  static async startRecording(
    accessToken: string,
    recordingTimestampStart: number
  ): Promise<OperationResult<ResponseWithId | null>> {
    return ResponseOperations.updateByToken(accessToken, {
      recordingTimestampStart,
      isActive: true,
      recordingFinished: false,
      error: null, // Clear any previous error
    });
  }

  static async finishRecording(accessToken: string): Promise<OperationResult<ResponseWithId | null>> {
    return ResponseOperations.updateByToken(accessToken, {
      recordingFinished: true,
      isActive: false,
    });
  }

  static async appendData(
    accessToken: string,
    dataPoints: DataPoint[]
  ): Promise<OperationResult<boolean>> {
    return ResponseOperations.appendDataByToken(accessToken, dataPoints);
  }

  static async setActive(
    id: string | ObjectId,
    isActive: boolean
  ): Promise<OperationResult<ResponseWithId | null>> {
    return ResponseOperations.updateById(id, { isActive });
  }

  static async deleteResponse(id: string | ObjectId): Promise<OperationResult<boolean>> {
    return ResponseOperations.deleteById(id);
  }

  /**
   * Export response data as CSV format
   */
  static exportDataAsCsv(response: ResponseWithId): string {
    const header = "timestamp,value\n";
    const rows = response.data.map(point => `${point.t},${point.v}`).join("\n");
    return header + rows;
  }

  /**
   * Export response data as JSON format
   */
  static exportDataAsJson(response: ResponseWithId): string {
    return JSON.stringify({
      responseId: response._id.toString(),
      name: response.name,
      recordingTimestampStart: response.recordingTimestampStart,
      dataPointsCount: response.data.length,
      data: response.data,
    }, null, 2);
  }

  /**
   * Update heartbeat from measurement app
   * Called when measurement app sends a heartbeat ping
   */
  static async updateHeartbeat(accessToken: string): Promise<OperationResult<ResponseWithId | null>> {
    const response = await ResponseOperations.findByToken(accessToken);
    
    // If this is the first heartbeat, log connection
    if (response && !response.isActive) {
      await ResponseOperations.addConnectionLogByToken(accessToken, {
        status: 'connected',
        timestamp: Date.now()
      });
    }
    
    return ResponseOperations.updateHeartbeatByToken(accessToken);
  }

  /**
   * Get response status for polling
   * Returns isActive as false if timeout condition is met (current time - start time > pieceDuration * 1.5 + 2 minutes)
   */
  static async getResponseStatus(accessToken: string): Promise<{
    isActive: boolean;
    recordingTimestampStart: number | null;
    recordingFinished: boolean;
    isFinished: boolean;
    lastHeartbeat: number | null;
    connectionLogs: { status: string; timestamp: number }[];
  } | null> {
    const response = await ResponseOperations.findByToken(accessToken);
    if (!response) return null;
    
    let isActive = response.isActive;
    
    // Check if timeout condition is met using the utility function
    if (checkRecordingTimeout(response)) {
      isActive = false;
    }
    
    return {
      isActive,
      recordingTimestampStart: response.recordingTimestampStart,
      recordingFinished: response.recordingFinished,
      isFinished: response.recordingFinished,
      lastHeartbeat: response.lastHeartbeat,
      connectionLogs: response.connectionLogs || [],
    };
  }

  /**
   * Get all active recording responses (for background job)
   */
  static async getActiveRecordings(): Promise<ResponseWithId[]> {
    return ResponseOperations.findActiveRecordings();
  }

  /**
   * Mark response as disconnected (for background job)
   */
  static async markDisconnected(accessToken: string): Promise<OperationResult<boolean>> {
    return ResponseOperations.markDisconnectedByToken(accessToken);
  }

  /**
   * Mark response as timed out with error (for background job)
   * Sets isActive to false and adds error message
   */
  static async markTimedOut(accessToken: string, errorMessage: string): Promise<OperationResult<ResponseWithId | null>> {
    return ResponseOperations.updateByToken(accessToken, {
      isActive: false,
      error: errorMessage,
    });
  }

  /**
   * Reset recording status to allow fresh start
   * Clears recording start time, active status, error, and data
   */
  static async resetRecordingStatus(accessToken: string): Promise<OperationResult<ResponseWithId | null>> {
    return ResponseOperations.updateByToken(accessToken, {
      recordingTimestampStart: null,
      isActive: false,
      recordingFinished: false,
      error: null,
      data: [],
      lastHeartbeat: null,
    });
  }

  /**
   * Heartbeat timeout in milliseconds (15 seconds)
   */
  static readonly HEARTBEAT_TIMEOUT_MS = 15000;
}

