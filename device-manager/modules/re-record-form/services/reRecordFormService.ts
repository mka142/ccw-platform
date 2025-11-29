import { ReRecordFormOperations, ResponseOperations } from "../db";
import { calculatePieceDuration } from "../lib/audioUtils";

import type { ReRecordForm, ReRecordFormWithId, ReRecordFormInput } from "../types";
import type { OperationResult } from "@/lib/types";
import type { ObjectId } from "mongodb";

/**
 * ReRecordForm Service - Business Logic Layer
 * Handles re-record form operations
 */
export class ReRecordFormService {
  static async getAllForms(): Promise<ReRecordFormWithId[]> {
    return ReRecordFormOperations.findAll();
  }

  static async getFormById(id: string | ObjectId): Promise<ReRecordFormWithId | null> {
    return ReRecordFormOperations.findById(id);
  }

  static async createForm(
    input: ReRecordFormInput,
    audioFilePath: string,
    audioFileName: string
  ): Promise<OperationResult<ReRecordFormWithId>> {
    // Calculate piece duration from audio file
    const pieceDuration = await calculatePieceDuration(audioFilePath);

    const form: ReRecordForm = {
      name: input.name,
      pieceId: input.pieceId,
      description: input.description,
      audioFilePath,
      audioFileName,
      measurementAppUrl: input.measurementAppUrl,
      pieceDuration,
    };

    return ReRecordFormOperations.create(form);
  }

  static async updateForm(
    id: string | ObjectId,
    updates: Partial<ReRecordFormInput>,
    audioFilePath?: string,
    audioFileName?: string
  ): Promise<OperationResult<ReRecordFormWithId | null>> {
    const updateData: Partial<ReRecordForm> = { ...updates };
    
    if (audioFilePath && audioFileName) {
      updateData.audioFilePath = audioFilePath;
      updateData.audioFileName = audioFileName;
      // Recalculate piece duration when audio file is updated
      updateData.pieceDuration = await calculatePieceDuration(audioFilePath);
    }

    return ReRecordFormOperations.updateById(id, updateData);
  }

  static async deleteForm(id: string | ObjectId): Promise<OperationResult<boolean>> {
    // First delete all associated responses
    await ResponseOperations.deleteByReRecordForm(id);
    
    // Then delete the form
    return ReRecordFormOperations.deleteById(id);
  }

  /**
   * Get the measurement URL with access token placeholder replaced
   * The placeholder {RESPONSE_ID} is replaced with the access token for API authentication
   */
  static getMeasurementUrl(form: ReRecordFormWithId, accessToken: string): string {
    return form.measurementAppUrl.replace("{RESPONSE_ID}", accessToken);
  }
}

