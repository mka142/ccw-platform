import { setTimestamps } from "./utils";

function toDocument<T extends { createdAt?: number; updatedAt?: number }>(obj: T): T {
  return setTimestamps(obj);
}

function fromDocument<T extends { createdAt?: number; updatedAt?: number }>(obj: T): T {
  return obj;
}

export const documentMapper = {
  toDocument,
  fromDocument,
};
