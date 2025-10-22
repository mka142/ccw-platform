import { config } from "@/config";
import { documentMapper } from "@/lib/db/mapper";
import { parseId, setTimestamps } from "@/lib/db/utils";
import { db } from "@/modules/db";

import type { Concert, Event, ConcertWithId, EventWithId } from "../types";
import type { OperationResult } from "@/lib/types";
import type { ObjectId } from "mongodb";

const byId = (id: string | ObjectId) => ({ _id: parseId(id) });

/**
 * Concert database operations
 */
export class ConcertOperations {
  private static async getCollection() {
    return await db().collection<Concert>(config.database.collections.concerts);
  }

  static async findAll(): Promise<ConcertWithId[]> {
    try {
      const collection = await this.getCollection();
      const docs = await collection.find({}).toArray();
      return docs.map(this.mapFromDocument);
    } catch (error) {
      console.error("Failed to find concerts:", error);
      return [];
    }
  }

  static async findActive(): Promise<ConcertWithId | null> {
    try {
      const collection = await this.getCollection();
      const doc = await collection.findOne({ isActive: true });
      return doc ? this.mapFromDocument(doc) : null;
    } catch (error) {
      console.error("Failed to find active concert:", error);
      return null;
    }
  }

  static async findById(id: string | ObjectId): Promise<ConcertWithId | null> {
    try {
      const collection = await this.getCollection();
      const _id = parseId(id);
      const doc = await collection.findOne({ _id });
      return doc ? this.mapFromDocument(doc) : null;
    } catch (error) {
      console.error("Failed to find concert by ID:", error);
      return null;
    }
  }

  static async create(concert: Concert): Promise<OperationResult<ConcertWithId>> {
    try {
      const collection = await this.getCollection();
      const { insertedId } = await collection.insertOne(this.mapToDocument(concert));
      return { success: true, data: { ...concert, ...byId(insertedId) } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async updateById(id: string | ObjectId, updates: Partial<Concert>): Promise<OperationResult<ConcertWithId | null>> {
    try {
      const collection = await this.getCollection();

      const updateDoc = setTimestamps(updates);

      const doc = await collection.findOneAndUpdate({ _id: parseId(id) }, { $set: updateDoc }, { returnDocument: "after" });

      const concert = doc ? this.mapFromDocument(doc) : null;

      return { success: true, data: concert };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private static mapFromDocument(doc: ConcertWithId) {
    return documentMapper.fromDocument<ConcertWithId>(doc);
  }

  private static mapToDocument(concert: Concert) {
    return documentMapper.toDocument<Concert>(concert);
  }
}

/**
 * Event database operations
 */
export class EventOperations {
  private static async getCollection() {
    return await db().collection<Event>(config.database.collections.events);
  }

  static async findByConcert(concertId: string | ObjectId): Promise<EventWithId[]> {
    try {
      const collection = await this.getCollection();
      const docs = await collection
        .find({ concertId: parseId(concertId) })
        .sort({ position: 1 })
        .toArray();
      return docs.map(this.mapFromDocument);
    } catch (error) {
      console.error("Failed to find events by concert:", error);
      return [];
    }
  }

  static async findByConcertAndPosition(concertId: string | ObjectId, position: number): Promise<EventWithId | null> {
    // use finchByConcert and filter
    const concerEvents = await this.findByConcert(concertId);
    return concerEvents.find((event) => event.position === position) ?? null;
  }

  static async findById(id: string | ObjectId): Promise<EventWithId | null> {
    try {
      const collection = await this.getCollection();
      const doc = await collection.findOne({ _id: parseId(id) });
      return doc ? this.mapFromDocument(doc) : null;
    } catch (error) {
      console.error("Failed to find event by ID:", error);
      return null;
    }
  }

  static async create(event: Event): Promise<OperationResult<EventWithId>> {
    try {
      const collection = await this.getCollection();
      const { insertedId } = await collection.insertOne(this.mapToDocument(event));
      return { success: true, data: { ...event, ...byId(insertedId) } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async updateById(id: string | ObjectId, updates: Partial<Event>): Promise<OperationResult<EventWithId | null>> {
    try {
      const collection = await this.getCollection();
      const updateDoc = { ...updates, updated_at: Date.now() };
      const result = await collection.findOneAndUpdate({ _id: parseId(id) }, { $set: updateDoc }, { returnDocument: "after" });

      if (result) {
        return { success: true, data: this.mapFromDocument(result) };
      }

      return { success: false, error: "Event not found" };
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
      const result = await collection.deleteOne({ _id: parseId(id) });
      return { success: true, data: result.deletedCount > 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private static mapFromDocument(doc: EventWithId) {
    return documentMapper.fromDocument<EventWithId>(doc);
  }

  private static mapToDocument(event: Event) {
    return documentMapper.toDocument<Event>({
      ...event,
      concertId: parseId(event.concertId),
    });
  }
}
