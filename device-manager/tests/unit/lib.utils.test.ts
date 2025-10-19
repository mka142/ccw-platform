import { ObjectId } from "mongodb";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { parseId, setTimestamps } from "../../lib/db/utils";
import { isValidJSON, safeJSONParse, generateTimestampId, generateUUID } from "../../lib/utils/helpers";

describe("lib/db/utils", () => {
  describe("parseId", () => {
    it("converts string to ObjectId", () => {
      const idString = "507f1f77bcf86cd799439011";
      const result = parseId(idString);

      expect(result).toBeInstanceOf(ObjectId);
      expect(result.toString()).toBe(idString);
    });

    it("returns ObjectId when already ObjectId", () => {
      const objectId = new ObjectId();
      const result = parseId(objectId);

      expect(result).toBe(objectId);
      expect(result).toBeInstanceOf(ObjectId);
      expect(result.equals(objectId)).toBe(true);
    });

    it("throws error for invalid string format", () => {
      const invalidId = "not-a-valid-objectid";

      expect(() => parseId(invalidId)).toThrow();
    });
  });

  describe("setTimestamps", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-10-19T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("sets both createdAt and updatedAt on new object", () => {
      const obj: { createdAt?: number; updatedAt?: number } = {};
      const result = setTimestamps(obj);

      const expectedTimestamp = Date.now();
      expect(result.createdAt).toBe(expectedTimestamp);
      expect(result.updatedAt).toBe(expectedTimestamp);
    });

    it("preserves existing createdAt and updates updatedAt", () => {
      const oldTimestamp = 1000000;
      const obj: { createdAt?: number; updatedAt?: number } = { createdAt: oldTimestamp };

      const result = setTimestamps(obj);

      expect(result.createdAt).toBe(oldTimestamp);
      expect(result.updatedAt).toBe(Date.now());
      expect(result.updatedAt).not.toBe(oldTimestamp);
    });

    it("overwrites existing updatedAt", () => {
      const oldCreated = 1000000;
      const oldUpdated = 2000000;
      const obj = { createdAt: oldCreated, updatedAt: oldUpdated };

      const result = setTimestamps(obj);

      expect(result.createdAt).toBe(oldCreated);
      expect(result.updatedAt).toBe(Date.now());
      expect(result.updatedAt).not.toBe(oldUpdated);
    });

    it("preserves other properties", () => {
      const obj: { name: string; value: number; active: boolean; createdAt?: number; updatedAt?: number } = { name: "Test", value: 42, active: true };
      const result = setTimestamps(obj);

      expect(result.name).toBe("Test");
      expect(result.value).toBe(42);
      expect(result.active).toBe(true);
    });

    it("returns same object reference (mutates in place)", () => {
      const obj: { createdAt?: number; updatedAt?: number } = {};
      const result = setTimestamps(obj);

      expect(result).toBe(obj);
    });

    it("works with undefined createdAt", () => {
      const obj: { createdAt?: number; updatedAt?: number } = { createdAt: undefined };
      const result = setTimestamps(obj);

      expect(result.createdAt).toBe(Date.now());
      expect(result.updatedAt).toBe(Date.now());
    });
  });
});

describe("lib/utils/helpers", () => {
  describe("isValidJSON", () => {
    it("returns true for valid JSON object", () => {
      expect(isValidJSON('{"name":"test"}')).toBe(true);
    });

    it("returns true for valid JSON array", () => {
      expect(isValidJSON("[1,2,3]")).toBe(true);
    });

    it("returns true for JSON primitives", () => {
      expect(isValidJSON('"string"')).toBe(true);
      expect(isValidJSON("123")).toBe(true);
      expect(isValidJSON("true")).toBe(true);
      expect(isValidJSON("false")).toBe(true);
      expect(isValidJSON("null")).toBe(true);
    });

    it("returns false for invalid JSON", () => {
      expect(isValidJSON("{invalid}")).toBe(false);
      expect(isValidJSON("undefined")).toBe(false);
      expect(isValidJSON("")).toBe(false);
      expect(isValidJSON("{")).toBe(false);
    });

    it("returns false for non-quoted strings", () => {
      expect(isValidJSON("hello")).toBe(false);
    });

    it("handles nested JSON", () => {
      const nested = '{"user":{"name":"John","age":30,"tags":["admin","user"]}}';
      expect(isValidJSON(nested)).toBe(true);
    });

    it("returns false for trailing commas", () => {
      expect(isValidJSON('{"a":1,}')).toBe(false);
    });
  });

  describe("safeJSONParse", () => {
    it("parses valid JSON and returns result", () => {
      const result = safeJSONParse('{"name":"test"}', {});
      expect(result).toEqual({ name: "test" });
    });

    it("returns fallback for invalid JSON", () => {
      const fallback = { default: true };
      const result = safeJSONParse("{invalid}", fallback);
      expect(result).toBe(fallback);
    });

    it("parses arrays", () => {
      const result = safeJSONParse("[1,2,3]", []);
      expect(result).toEqual([1, 2, 3]);
    });

    it("handles primitives", () => {
      expect(safeJSONParse("123", 0)).toBe(123);
      expect(safeJSONParse("true", false)).toBe(true);
      expect(safeJSONParse('"hello"', "")).toBe("hello");
    });

    it("returns fallback for empty string", () => {
      const fallback = { error: "empty" };
      const result = safeJSONParse("", fallback);
      expect(result).toBe(fallback);
    });

    it("preserves complex fallback types", () => {
      type ComplexType = { id: number; tags: string[] };
      const fallback: ComplexType = { id: 1, tags: ["a", "b"] };
      const result = safeJSONParse<ComplexType>("invalid", fallback);

      expect(result).toBe(fallback);
      expect(result.tags).toEqual(["a", "b"]);
    });

    it("handles null JSON value", () => {
      const result = safeJSONParse("null", { default: true });
      expect(result).toBeNull();
    });
  });

  describe("generateTimestampId", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("generates string ID from timestamp", () => {
      vi.setSystemTime(new Date("2025-10-19T12:00:00Z"));
      const result = generateTimestampId();

      expect(typeof result).toBe("string");
      expect(result).toBe(Date.now().toString());
    });

    it("generates different IDs at different times", () => {
      vi.setSystemTime(new Date("2025-10-19T12:00:00Z"));
      const id1 = generateTimestampId();

      vi.setSystemTime(new Date("2025-10-19T12:00:01Z"));
      const id2 = generateTimestampId();

      expect(id1).not.toBe(id2);
      expect(Number(id2)).toBeGreaterThan(Number(id1));
    });

    it("generates numeric string", () => {
      const result = generateTimestampId();
      expect(/^\d+$/.test(result)).toBe(true);
    });
  });

  describe("generateUUID", () => {
    it("generates valid UUID v4 format", () => {
      const uuid = generateUUID();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it("generates unique UUIDs", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
    });

    it("returns string", () => {
      const uuid = generateUUID();
      expect(typeof uuid).toBe("string");
    });

    it("has correct length (36 chars with dashes)", () => {
      const uuid = generateUUID();
      expect(uuid.length).toBe(36);
    });

    it("contains correct number of dashes", () => {
      const uuid = generateUUID();
      const dashes = uuid.split("-").length - 1;
      expect(dashes).toBe(4);
    });
  });
});
