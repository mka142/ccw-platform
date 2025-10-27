import { parseId } from "@/lib/db/utils";

import { FormOperations } from "../db";

import type { FormBatchInput, FormData, FormDataWithId } from "../types";
import type { ObjectId, OperationResult } from "@/lib/types";

/**
 * Form Service - Business Logic Layer
 * Handles form data operations
 */
export class FormService {
  /**
   * Save a batch of form data entries
   * Converts batch input format to individual form data records
   */
  static async saveBatch(batchInput: FormBatchInput): Promise<OperationResult<FormDataWithId[]>> {
    try {
      const clientId = parseId(batchInput.clientId);

      // Convert batch input to individual form data records
      const formDataArray: FormData[] = batchInput.data.map((dataPoint) => ({
        clientId,
        pieceId: batchInput.pieceId,
        timestamp: dataPoint.timestamp,
        value: dataPoint.value,
      }));

      // Use batch insert operation
      return await FormOperations.createBatch(formDataArray);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Save a single form data entry
   */
  static async saveFormData(formData: FormData): Promise<OperationResult<FormDataWithId>> {
    return FormOperations.create(formData);
  }

  /**
   * Get all form data for a specific client
   */
  static async getByClient(clientId: string | ObjectId): Promise<FormDataWithId[]> {
    return FormOperations.findByClient(clientId);
  }

  /**
   * Get all form data for a specific piece
   */
  static async getByPiece(pieceId: string): Promise<FormDataWithId[]> {
    return FormOperations.findByPiece(pieceId);
  }

  /**
   * Get form data for a specific client and piece combination
   */
  static async getByClientAndPiece(clientId: string | ObjectId, pieceId: string): Promise<FormDataWithId[]> {
    return FormOperations.findByClientAndPiece(clientId, pieceId);
  }

  /**
   * Get a single form data entry by ID
   */
  static async getById(id: string | ObjectId): Promise<FormDataWithId | null> {
    return FormOperations.findById(id);
  }

  /**
   * Delete a form data entry
   */
  static async deleteById(id: string | ObjectId): Promise<OperationResult<boolean>> {
    return FormOperations.deleteById(id);
  }

  /**
   * Delete all form data for a client
   */
  static async deleteByClient(clientId: string | ObjectId): Promise<OperationResult<number>> {
    return FormOperations.deleteByClient(clientId);
  }
}
