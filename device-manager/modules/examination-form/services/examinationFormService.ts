import { parseId } from "@/lib/db/utils";
import { UserService } from "@/modules/user";

import { ExaminationFormOperations } from "../db";

import type { ExaminationFormInput, ExaminationFormResponse, ExaminationFormResponseWithId } from "../types";
import type { ObjectId, OperationResult } from "@/lib/types";

/**
 * Examination Form Service - Business Logic Layer
 * Handles examination form response operations with user validation
 */
export class ExaminationFormService {
  /**
   * Create a new examination form response
   * Validates user exists before creating response
   */
  static async createResponse(input: ExaminationFormInput): Promise<OperationResult<ExaminationFormResponseWithId>> {
    try {
      // Validate user exists
      const user = await UserService.findById(input.userId);
      if (!user) {
        return {
          success: false,
          error: "User not found",
        };
      }

      // Check if user already submitted this form
      const existingResponse = await ExaminationFormOperations.findByUserAndForm(input.userId, input.formId);
      if (existingResponse) {
        return {
          success: false,
          error: "User has already submitted this form",
        };
      }

      // Create the response
      const responseData: ExaminationFormResponse = {
        userId: parseId(input.userId),
        formId: input.formId,
        answers: input.answers,
      };

      return await ExaminationFormOperations.create(responseData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all examination form responses for a user
   */
  static async getResponsesByUserId(userId: string | ObjectId): Promise<ExaminationFormResponseWithId[]> {
    // Validate user exists
    const user = await UserService.findById(userId);
    if (!user) {
      return [];
    }

    return ExaminationFormOperations.findByUserId(userId);
  }

  /**
   * Get all responses for a specific form
   */
  static async getResponsesByFormId(formId: string): Promise<ExaminationFormResponseWithId[]> {
    return ExaminationFormOperations.findByFormId(formId);
  }

  /**
   * Get a specific user's response to a specific form
   */
  static async getUserFormResponse(userId: string | ObjectId, formId: string): Promise<ExaminationFormResponseWithId | null> {
    // Validate user exists
    const user = await UserService.findById(userId);
    if (!user) {
      return null;
    }

    return ExaminationFormOperations.findByUserAndForm(userId, formId);
  }

  /**
   * Get count of responses for a specific form
   */
  static async getFormResponseCount(formId: string): Promise<number> {
    return ExaminationFormOperations.countByFormId(formId);
  }
}