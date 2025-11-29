import { config } from "@/config";
import { documentMapper } from "@/lib/db/mapper";
import { parseId, setTimestamps } from "@/lib/db/utils";
import { db } from "@/modules/db";

import type { ReRecordForm, ReRecordFormWithId, Response, ResponseWithId, DataPoint, ConnectionLog } from "../types";
import type { OperationResult } from "@/lib/types";
import type { ObjectId } from "mongodb";

const byId = (id: string | ObjectId) => ({ _id: parseId(id) });

/**
 * ReRecordForm database operations
 */
export class ReRecordFormOperations {
  private static async getCollection() {
    return await db().collection<ReRecordForm>(config.database.collections.reRecordForms);
  }

  static async findAll(): Promise<ReRecordFormWithId[]> {
    try {
      const collection = await this.getCollection();
      const docs = await collection.find({}).toArray();
      return docs.map(this.mapFromDocument);
    } catch (error) {
      console.error("Failed to find re-record forms:", error);
      return [];
    }
  }

  static async findById(id: string | ObjectId): Promise<ReRecordFormWithId | null> {
    try {
      const collection = await this.getCollection();
      const doc = await collection.findOne(byId(id));
      return doc ? this.mapFromDocument(doc) : null;
    } catch (error) {
      console.error("Failed to find re-record form by ID:", error);
      return null;
    }
  }

  static async create(form: ReRecordForm): Promise<OperationResult<ReRecordFormWithId>> {
    try {
      const collection = await this.getCollection();
      const { insertedId } = await collection.insertOne(this.mapToDocument(form));
      return { success: true, data: { ...form, ...byId(insertedId) } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async updateById(id: string | ObjectId, updates: Partial<ReRecordForm>): Promise<OperationResult<ReRecordFormWithId | null>> {
    try {
      const collection = await this.getCollection();
      const updateDoc = setTimestamps(updates);
      const doc = await collection.findOneAndUpdate(
        byId(id),
        { $set: updateDoc },
        { returnDocument: "after" }
      );
      const form = doc ? this.mapFromDocument(doc) : null;
      return { success: true, data: form };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async deleteById(id: string | ObjectId): Promise<OperationResult<boolean>> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne(byId(id));
      return { success: true, data: result.deletedCount > 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private static mapFromDocument(doc: ReRecordFormWithId) {
    return documentMapper.fromDocument<ReRecordFormWithId>(doc);
  }

  private static mapToDocument(form: ReRecordForm) {
    return documentMapper.toDocument<ReRecordForm>(form);
  }
}

/**
 * Response database operations
 */
export class ResponseOperations {
  private static async getCollection() {
    return await db().collection<Response>(config.database.collections.responses);
  }

  static async findByReRecordForm(reRecordFormId: string | ObjectId): Promise<ResponseWithId[]> {
    try {
      const collection = await this.getCollection();
      const docs = await collection.find({ reRecordFormId: parseId(reRecordFormId) }).toArray();
      return docs.map(this.mapFromDocument);
    } catch (error) {
      console.error("Failed to find responses by re-record form:", error);
      return [];
    }
  }

  static async findById(id: string | ObjectId): Promise<ResponseWithId | null> {
    try {
      const collection = await this.getCollection();
      const doc = await collection.findOne(byId(id));
      return doc ? this.mapFromDocument(doc) : null;
    } catch (error) {
      console.error("Failed to find response by ID:", error);
      return null;
    }
  }

  static async findByToken(accessToken: string): Promise<ResponseWithId | null> {
    try {
      const collection = await this.getCollection();
      const doc = await collection.findOne({ accessToken });
      return doc ? this.mapFromDocument(doc) : null;
    } catch (error) {
      console.error("Failed to find response by token:", error);
      return null;
    }
  }

  static async create(response: Response): Promise<OperationResult<ResponseWithId>> {
    try {
      const collection = await this.getCollection();
      const { insertedId } = await collection.insertOne(this.mapToDocument(response));
      return { success: true, data: { ...this.mapToDocument(response), ...byId(insertedId) } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async updateById(id: string | ObjectId, updates: Partial<Response>): Promise<OperationResult<ResponseWithId | null>> {
    try {
      const collection = await this.getCollection();
      const updateDoc = setTimestamps(updates);
      const doc = await collection.findOneAndUpdate(
        byId(id),
        { $set: updateDoc },
        { returnDocument: "after" }
      );
      const response = doc ? this.mapFromDocument(doc) : null;
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async updateByToken(accessToken: string, updates: Partial<Response>): Promise<OperationResult<ResponseWithId | null>> {
    try {
      const collection = await this.getCollection();
      const updateDoc = setTimestamps(updates);
      const doc = await collection.findOneAndUpdate(
        { accessToken },
        { $set: updateDoc },
        { returnDocument: "after" }
      );
      const response = doc ? this.mapFromDocument(doc) : null;
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async appendData(id: string | ObjectId, dataPoints: DataPoint[]): Promise<OperationResult<boolean>> {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        byId(id),
        { 
          $push: { data: { $each: dataPoints } },
          $set: { updatedAt: Date.now() }
        }
      );
      return { success: true, data: result.modifiedCount > 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async appendDataByToken(accessToken: string, dataPoints: DataPoint[]): Promise<OperationResult<boolean>> {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { accessToken },
        { 
          $push: { data: { $each: dataPoints } },
          $set: { updatedAt: Date.now() }
        }
      );
      return { success: true, data: result.modifiedCount > 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async deleteById(id: string | ObjectId): Promise<OperationResult<boolean>> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne(byId(id));
      return { success: true, data: result.deletedCount > 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async deleteByReRecordForm(reRecordFormId: string | ObjectId): Promise<OperationResult<number>> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteMany({ reRecordFormId: parseId(reRecordFormId) });
      return { success: true, data: result.deletedCount };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update heartbeat timestamp by token
   */
  static async updateHeartbeatByToken(accessToken: string): Promise<OperationResult<ResponseWithId | null>> {
    try {
      const collection = await this.getCollection();
      const now = Date.now();
      const doc = await collection.findOneAndUpdate(
        { accessToken },
        { 
          $set: { 
            lastHeartbeat: now,
            isActive: true,
            updatedAt: now
          }
        },
        { returnDocument: "after" }
      );
      const response = doc ? this.mapFromDocument(doc) : null;
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Add connection log entry by token
   */
  static async addConnectionLogByToken(accessToken: string, log: ConnectionLog): Promise<OperationResult<boolean>> {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { accessToken },
        { 
          $push: { connectionLogs: log },
          $set: { updatedAt: Date.now() }
        }
      );
      return { success: true, data: result.modifiedCount > 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Find all active recording responses (started but not finished)
   */
  static async findActiveRecordings(): Promise<ResponseWithId[]> {
    try {
      const collection = await this.getCollection();
      const docs = await collection.find({
        isActive: true,
      }).toArray();
      return docs.map(this.mapFromDocument);
    } catch (error) {
      console.error("Failed to find active recordings:", error);
      return [];
    }
  }

  /**
   * Mark response as disconnected
   */
  static async markDisconnectedByToken(accessToken: string): Promise<OperationResult<boolean>> {
    try {
      const collection = await this.getCollection();
      const now = Date.now();
      const result = await collection.updateOne(
        { accessToken },
        { 
          $set: { isActive: false, updatedAt: now },
          $push: { connectionLogs: { status: 'disconnected', timestamp: now } }
        }
      );
      return { success: true, data: result.modifiedCount > 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private static mapFromDocument(doc: ResponseWithId) {
    return documentMapper.fromDocument<ResponseWithId>(doc);
  }

  private static mapToDocument(response: Response) {
    return documentMapper.toDocument<Response>({
      ...response,
      reRecordFormId: parseId(response.reRecordFormId),
    });
  }
}

