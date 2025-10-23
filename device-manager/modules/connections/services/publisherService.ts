import { mqttPublisher } from "../publisher";

import type { EventSchema } from "../types";
import type { OperationResult } from "@/lib/types";
import type { Event } from "@/modules/admin";

/**
 * Publisher Service - Business Logic Layer
 * Handles MQTT event publishing operations
 */
export class PublisherService {
  /**
   * Broadcast an event from the database to all connected MQTT clients
   * 
   * Converts a database Event to EventSchema format and publishes it via MQTT.
   * 
   * @param event - Event object from the database (Concert Event)
   * @returns OperationResult indicating success or failure
   * 
   * @example
   * ```typescript
   * const event = await EventService.getEventById("507f1f77bcf86cd799439011");
   * if (event) {
   *   const result = await PublisherService.publishEvent(event);
   *   if (result.success) {
   *     console.log("Event published successfully!");
   *   }
   * }
   * ```
   */
  static async publishEvent(event: Event): Promise<OperationResult<boolean>> {
    try {
      if (!mqttPublisher.isConnected()) {
        return {
          success: false,
          error: "MQTT Publisher not connected",
        };
      }

      // Convert Event to EventSchema format for MQTT
      const eventSchema: EventSchema = {
        concertId: event.concertId,
        eventType: event.eventType,
        label: event.label,
        payload: event.payload,
        position: event.position,
      };

      await mqttPublisher.broadcastEvent(eventSchema);

      return { success: true, data: true };
    } catch (error) {
      console.error("Failed to publish event:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to publish event",
      };
    }
  }

  /**
   * Broadcast an EventSchema directly to all connected MQTT clients
   * 
   * Use this when you already have an EventSchema object (not from database).
   * 
   * @param eventSchema - EventSchema object ready for MQTT publishing
   * @returns OperationResult indicating success or failure
   * 
   * @example
   * ```typescript
   * const eventSchema: EventSchema = {
   *   concertId: "507f191e810c19729de860ea",
   *   eventType: "note",
   *   label: "Test Event",
   *   payload: { message: "Hello" },
   *   position: 1
   * };
   * 
   * const result = await PublisherService.broadcastEventSchema(eventSchema);
   * ```
   */
  static async broadcastEventSchema(eventSchema: EventSchema): Promise<OperationResult<boolean>> {
    try {
      if (!mqttPublisher.isConnected()) {
        return {
          success: false,
          error: "MQTT Publisher not connected",
        };
      }

      await mqttPublisher.broadcastEvent(eventSchema);

      return { success: true, data: true };
    } catch (error) {
      console.error("Failed to broadcast event schema:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to broadcast event",
      };
    }
  }

  /**
   * Check if the MQTT publisher is currently connected to the broker
   * 
   * @returns true if connected, false otherwise
   * 
   * @example
   * ```typescript
   * if (PublisherService.isConnected()) {
   *   // Safe to publish events
   * }
   * ```
   */
  static isConnected(): boolean {
    return mqttPublisher.isConnected();
  }

  /**
   * Get the connection status of the MQTT publisher
   * 
   * @returns OperationResult with connection status
   * 
   * @example
   * ```typescript
   * const status = PublisherService.getConnectionStatus();
   * console.log(`Publisher connected: ${status.data}`);
   * ```
   */
  static getConnectionStatus(): OperationResult<boolean> {
    const connected = mqttPublisher.isConnected();
    return {
      success: true,
      data: connected,
    };
  }
}
