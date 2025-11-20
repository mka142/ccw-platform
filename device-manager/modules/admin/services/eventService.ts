import { parseId } from "@/lib/db/utils";

import { EventOperations } from "../db";

import type { Event } from "../types";
import type { OperationResult } from "@/lib";
import type { ObjectId } from "@/lib/types";

/**
 * Event Service - Business Logic Layer
 * Handles event-related business operations
 */
export class EventService {
  static async getEventsByConcert(concertId: string | ObjectId) {
    return EventOperations.findByConcert(concertId);
  }

  static async createEvent(eventData: Event) {
    return EventOperations.create(eventData);
  }

  static async updateEvent(eventId: string, updates: Partial<Omit<Event, "created_at">>) {
    return EventOperations.updateById(eventId, updates);
  }

  static async getEventById(eventId: string) {
    return EventOperations.findById(eventId);
  }

  static async deleteEvent(eventId: string) {
    return EventOperations.deleteById(eventId);
  }
  static async moveEventPosition(eventId: string, direction: "up" | "down"): Promise<OperationResult<boolean>> {
    const event = await this.getEventById(eventId);
    if (!event) {
      return { success: false, error: "Event not found" };
    }
    const positionChange = direction === "up" ? -1 : 1;
    const toSwitchEvent = await EventOperations.findByConcertAndPosition(event.concertId, event.position + positionChange);
    if (!toSwitchEvent) {
      return { success: false, error: "No event to switch with" };
    }

    // Swap positions
    const update1 = EventOperations.updateById(eventId, { position: toSwitchEvent.position });
    const update2 = EventOperations.updateById(toSwitchEvent._id, { position: event.position });

    await Promise.all([update1, update2]);

    return { success: true, data: true };
  }

  static async exportEvents(concertId: string | ObjectId): Promise<OperationResult<Omit<Event, '_id' | 'createdAt' | 'updatedAt'>[]>> {
    try {
      const events = await EventOperations.findByConcert(concertId);
      const exportData = events.map(event => ({
        concertId: event.concertId,
        eventType: event.eventType,
        label: event.label,
        payload: event.payload,
        position: event.position
      }));
      return { success: true, data: exportData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to export events"
      };
    }
  }

  static async importEvents(concertId: string | ObjectId, events: Omit<Event, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<OperationResult<number>> {
    try {
      const existingEvents = await EventOperations.findByConcert(concertId);
      const maxPosition = existingEvents.length > 0 ? Math.max(...existingEvents.map(e => e.position)) : -1;

      let importedCount = 0;
      for (const eventData of events) {
        const newEvent: Event = {
          ...eventData,
          concertId: parseId(concertId),
          position: maxPosition + 1 + importedCount
        };
        const result = await EventOperations.create(newEvent);
        if (result.success) {
          importedCount++;
        }
      }

      return { success: true, data: importedCount };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to import events"
      };
    }
  }
}
