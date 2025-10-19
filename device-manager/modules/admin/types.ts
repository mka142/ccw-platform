import type { BaseDocument, DocumentWithId, ObjectId } from "@/lib/types";

/**
 * Admin Module Types - Clean Architecture
 * Extends base types with admin-specific properties
 */

export type DeviceType = "Web" | "M5Dial";

interface UserSchema {
  concertId: ObjectId;
  deviceType: DeviceType;
  isActive?: boolean;
  lastPing?: number;
}

export interface User extends BaseDocument, UserSchema {}
export interface UserWithId extends DocumentWithId, UserSchema {
  concertId: ObjectId;
}

interface ConcertSchema {
  name: string;
  metadata: Record<string, unknown>;
  isActive: boolean;
  activeEventId: ObjectId | null;
}
export interface Concert extends BaseDocument, ConcertSchema {}
export interface ConcertWithId extends DocumentWithId, ConcertSchema {}

interface EventSchema {
  concertId: ObjectId;
  eventType: string;
  label: string;
  payload: Record<string, unknown>;
  position: number;
}
export interface Event extends BaseDocument, EventSchema {}
export interface EventWithId extends DocumentWithId, EventSchema {
  concertId: ObjectId;
}
