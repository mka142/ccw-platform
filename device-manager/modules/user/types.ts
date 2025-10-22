import type { BaseDocument, DocumentWithId, ObjectId } from "@/lib/types";

/**
 * User Module Types
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
