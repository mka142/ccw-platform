import { config } from "@/config";
import { documentMapper } from "@/lib/db/mapper";
import { parseId, setTimestamps } from "@/lib/db/utils";
import { db } from "@/modules/db";

import type { FormData, FormDataWithId } from "../types";
import type { OperationResult } from "@/lib/types";
import type { ObjectId } from "mongodb";

const byId = (id: string | ObjectId) => ({ _id: parseId(id) });

/**
 * Form database operations
 */
export class FormOperations {
  private static async getCollection() {
    return await db().collection<FormData>(config.database.collections.forms);
  }

  /**
   * Create a single form data entry
   */
  static async create(formData: FormData): Promise<OperationResult<FormDataWithId>> {
    try {
      const collection = await this.getCollection();
      const { insertedId } = await collection.insertOne(this.mapToDocument(formData));

      return {
        success: true,
        data: { ...this.mapToDocument(formData), ...byId(insertedId) },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create multiple form data entries in batch
   * More efficient than multiple individual inserts
   */
  static async createBatch(formDataArray: FormData[]): Promise<OperationResult<FormDataWithId[]>> {
    try {
      if (formDataArray.length === 0) {
        return { success: true, data: [] };
      }

      const collection = await this.getCollection();
      const docs = formDataArray.map((formData) => this.mapToDocument(formData));
      const result = await collection.insertMany(docs);

      // Map inserted IDs back to documents
      const insertedDocs = docs.map((doc, index) => ({
        ...doc,
        _id: result.insertedIds[index],
      })) as FormDataWithId[];

      return {
        success: true,
        data: insertedDocs.map(this.mapFromDocument),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Find all form data for a specific client
   */
  static async findByClient(clientId: ObjectId | string): Promise<FormDataWithId[]> {
    try {
      const collection = await this.getCollection();
      const docs = (await collection.find({ clientId: parseId(clientId) }).toArray()) as FormDataWithId[];
      return docs.map(this.mapFromDocument);
    } catch (error) {
      console.error("Failed to find form data by client:", error);
      return [];
    }
  }

  /**
   * Find all form data for a specific piece
   */
  static async findByPiece(pieceId: string): Promise<FormDataWithId[]> {
    try {
      const collection = await this.getCollection();
      const docs = (await collection.find({ pieceId }).toArray()) as FormDataWithId[];
      return docs.map(this.mapFromDocument);
    } catch (error) {
      console.error("Failed to find form data by piece:", error);
      return [];
    }
  }

  /**
   * Find form data by client and piece
   */
  static async findByClientAndPiece(clientId: ObjectId | string, pieceId: string): Promise<FormDataWithId[]> {
    try {
      const collection = await this.getCollection();
      const docs = (await collection
        .find({
          clientId: parseId(clientId),
          pieceId,
        })
        .toArray()) as FormDataWithId[];
      return docs.map(this.mapFromDocument);
    } catch (error) {
      console.error("Failed to find form data by client and piece:", error);
      return [];
    }
  }

  /**
   * Find a form data entry by ID
   */
  static async findById(id: ObjectId | string): Promise<FormDataWithId | null> {
    try {
      const collection = await this.getCollection();
      const doc = (await collection.findOne(byId(id))) as FormDataWithId | null;

      return doc ? this.mapFromDocument(doc) : null;
    } catch (error) {
      console.error("Failed to find form data by ID:", error);
      return null;
    }
  }

  /**
   * Delete a form data entry by ID
   */
  static async deleteById(id: ObjectId | string): Promise<OperationResult<boolean>> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: parseId(id) });
      return { success: true, data: result.deletedCount > 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete all form data for a specific client
   */
  static async deleteByClient(clientId: ObjectId | string): Promise<OperationResult<number>> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteMany({ clientId: parseId(clientId) });
      return { success: true, data: result.deletedCount };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private static mapFromDocument(doc: FormDataWithId) {
    return documentMapper.fromDocument<FormDataWithId>(doc);
  }

  private static mapToDocument(formData: FormData) {
    return documentMapper.toDocument<FormData>({
      ...formData,
      clientId: parseId(formData.clientId),
    });
  }
}
