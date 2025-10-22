import type { ObjectId } from 'mongodb';

/**
 * Event Schema for MQTT messages
 * Used for broadcasting events to all connected clients
 */
export interface EventSchema {
  concertId: ObjectId;
  eventType: string;
  label: string;
  payload: Record<string, unknown>;
  position: number;
}

/**
 * MQTT Topics
 */
export const MQTT_TOPICS = {
  // Broadcast events to all clients
  EVENTS_BROADCAST: 'events/broadcast',

  // Device-specific topics (commented out for now)
  // DEVICE_EVENTS: (deviceId: string) => `events/${deviceId}`,
} as const;
