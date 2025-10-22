import type { BaseDocument, DocumentWithId, ObjectId } from "@/lib/types";

/**
 * Admin Module Types - Clean Architecture
 * Extends base types with admin-specific properties
 */

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
