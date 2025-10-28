import { config } from "@/config";
import { documentMapper } from "@/lib/db/mapper";
import { parseId } from "@/lib/db/utils";
import { db } from "@/modules/db";

import type { ExaminationFormResponse, ExaminationFormResponseWithId } from "../types";
import type { OperationResult } from "@/lib/types";
import type { ObjectId } from "mongodb";

const byId = (id: string | ObjectId) => ({ _id: parseId(id) });

/**
 * Examination Form database operations
 */
export class ExaminationFormOperations {
  private static async getCollection() {
    return await db().collection<ExaminationFormResponse>(config.database.collections.examinationForms);
  }

  /**
   * Create a single examination form response
   */
  static async create(responseData: ExaminationFormResponse): Promise<OperationResult<ExaminationFormResponseWithId>> {
    try {
      const collection = await this.getCollection();
      const { insertedId } = await collection.insertOne(this.mapToDocument(responseData));

      return {
        success: true,
        data: { ...this.mapToDocument(responseData), ...byId(insertedId) },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Find examination form responses by user ID
   */
  static async findByUserId(userId: string | ObjectId): Promise<ExaminationFormResponseWithId[]> {
    try {
      const collection = await this.getCollection();
      const results = (await collection.find({ userId: parseId(userId) }).toArray()) as ExaminationFormResponseWithId[];
      return results.map(this.mapFromDocument);
    } catch (error) {
      console.error("Error finding examination forms by user ID:", error);
      return [];
    }
  }

  /**
   * Find examination form responses by form ID
   */
  static async findByFormId(formId: string): Promise<ExaminationFormResponseWithId[]> {
    try {
      const collection = await this.getCollection();
      const results = (await collection.find({ formId }).toArray()) as ExaminationFormResponseWithId[];
      return results.map(this.mapFromDocument);
    } catch (error) {
      console.error("Error finding examination forms by form ID:", error);
      return [];
    }
  }

  /**
   * Find examination form response by user ID and form ID
   */
  static async findByUserAndForm(userId: string | ObjectId, formId: string): Promise<ExaminationFormResponseWithId | null> {
    try {
      const collection = await this.getCollection();
      const result = await collection.findOne({ userId: parseId(userId), formId });
      return result ? this.mapFromDocument(result as ExaminationFormResponseWithId) : null;
    } catch (error) {
      console.error("Error finding examination form by user and form ID:", error);
      return null;
    }
  }

  /**
   * Count examination form responses by form ID
   */
  static async countByFormId(formId: string): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments({ formId });
    } catch (error) {
      console.error("Error counting examination forms by form ID:", error);
      return 0;
    }
  }

  /**
   * Map document from database
   */
  private static mapFromDocument(doc: ExaminationFormResponseWithId) {
    return documentMapper.fromDocument<ExaminationFormResponseWithId>(doc);
  }

  /**
   * Map form response data to document with timestamps
   */
  private static mapToDocument(responseData: ExaminationFormResponse): ExaminationFormResponse {
    return documentMapper.toDocument<ExaminationFormResponse>({
      ...responseData,
      userId: parseId(responseData.userId),
    });
  }
}