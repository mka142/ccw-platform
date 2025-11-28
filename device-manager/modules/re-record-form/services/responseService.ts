import { parseId } from "@/lib/db/utils";

import { ResponseOperations } from "../db";

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
    
    const response: Response = {
      reRecordFormId: parseId(input.reRecordFormId),
      name: input.name,
      accessToken,
      isActive: false,  // Start as inactive until measurement app connects
      recordingTimestampStart: null,
      recordingDelay: 0,
      recordingFinished: false,
      data: [],
      lastHeartbeat: null,
      connectionLogs: [],
    };

    return ResponseOperations.create(response);
  }

  static async updateResponseName(
    id: string | ObjectId,
    name: string
  ): Promise<OperationResult<ResponseWithId | null>> {
    return ResponseOperations.updateById(id, { name });
  }

  static async startRecording(
    accessToken: string,
    recordingDelay: number
  ): Promise<OperationResult<ResponseWithId | null>> {
    const recordingTimestampStart = Date.now();
    
    return ResponseOperations.updateByToken(accessToken, {
      recordingTimestampStart,
      recordingDelay,
      isActive: true,
      recordingFinished: false,
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
      recordingDelay: response.recordingDelay,
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
   */
  static async getResponseStatus(accessToken: string): Promise<{
    isActive: boolean;
    recordingTimestampStart: number | null;
    recordingFinished: boolean;
    lastHeartbeat: number | null;
    connectionLogs: { status: string; timestamp: number }[];
  } | null> {
    const response = await ResponseOperations.findByToken(accessToken);
    if (!response) return null;
    
    return {
      isActive: response.isActive,
      recordingTimestampStart: response.recordingTimestampStart,
      recordingFinished: response.recordingFinished,
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
   * Heartbeat timeout in milliseconds (15 seconds)
   */
  static readonly HEARTBEAT_TIMEOUT_MS = 15000;
}

