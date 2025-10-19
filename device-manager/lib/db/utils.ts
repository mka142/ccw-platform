import { ObjectId } from "mongodb";

import type { BaseEntity } from "../types";

function setTimestamps<T extends { createdAt?: BaseEntity["createdAt"]; updatedAt?: BaseEntity["updatedAt"] }>(obj: T): T {
  const timestamp = Date.now();
  obj.createdAt ??= timestamp;
  obj.updatedAt = timestamp;
  return obj;
}

function parseId(id: string | ObjectId): ObjectId {
  return typeof id === "string" ? new ObjectId(id) : id;
}

export { setTimestamps, parseId };
