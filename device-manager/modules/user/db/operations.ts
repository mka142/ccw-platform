import { config } from "@/config";
import { documentMapper } from "@/lib/db/mapper";
import { parseId, setTimestamps } from "@/lib/db/utils";
import { db } from "@/modules/db";

import type { User, UserWithId } from "../types";
import type { OperationResult } from "@/lib/types";
import type { ObjectId } from "mongodb";

const byId = (id: string | ObjectId) => ({ _id: parseId(id) });

/**
 * User database operations
 */
export class UserOperations {
  private static async getCollection() {
    return await db().collection<User>(config.database.collections.users);
  }

  static async findByConcert(concertId: ObjectId | string): Promise<UserWithId[]> {
    try {
      const users = await this.getCollection();
      const docs = (await users.find({ concertId: parseId(concertId) }).toArray()) as UserWithId[];
      return docs.map(this.mapFromDocument);
    } catch (error) {
      console.error("Failed to find users by concert:", error);
      return [];
    }
  }

  static async create(user: User): Promise<OperationResult<UserWithId>> {
    try {
      const collection = await this.getCollection();
      const { insertedId } = await collection.insertOne(this.mapToDocument(user));

      return { success: true, data: { ...this.mapToDocument(user), ...byId(insertedId) } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async findById(id: ObjectId | string): Promise<UserWithId | null> {
    try {
      const collection = await this.getCollection();
      const doc = (await collection.findOne(byId(id))) as UserWithId | null;

      return doc ? this.mapFromDocument(doc) : null;
    } catch (error) {
      console.error("Failed to find user by ID:", error);
      return null;
    }
  }

  static async updateById(id: ObjectId | string, updates: Partial<User>): Promise<OperationResult<UserWithId | null>> {
    try {
      const collection = await this.getCollection();
      const updateDoc = setTimestamps(updates);

      const result = await collection.findOneAndUpdate({ _id: parseId(id) }, { $set: updateDoc }, { returnDocument: "after" });

      if (result) {
        return { success: true, data: this.mapFromDocument(result) };
      }

      return { success: false, error: "User not found" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

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

  private static mapFromDocument(doc: UserWithId) {
    return documentMapper.fromDocument<UserWithId>(doc);
  }

  private static mapToDocument(user: User) {
    return documentMapper.toDocument<User>({
      ...user,
      concertId: parseId(user.concertId),
    });
  }
}
