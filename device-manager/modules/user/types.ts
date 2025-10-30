import type { BaseDocument, DocumentWithId, ObjectId } from "@/lib/types";

/**
 * User Module Types
 */

export type DeviceType = "Web" | "M5Stack";

interface UserSchema {
  concertId: ObjectId;
  deviceType: DeviceType;
  isActive?: boolean;
  lastPing?: number;
}

export interface UserCreateSchema {
  deviceType: DeviceType;
}

export interface User extends BaseDocument, UserSchema {}
export interface UserWithId extends DocumentWithId, UserSchema {
  concertId: ObjectId;
}
