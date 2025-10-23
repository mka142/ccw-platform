import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

import { config } from "@/config";
import { mqttPublisher } from "@/modules/connections/publisher";
import { db, initializeDb, disconnectDb } from "@/modules/db";


import { ConcertService } from "../../modules/admin/services/concertService";
import { EventService } from "../../modules/admin/services/eventService";

import { initializeMqtt, cleanupMqtt } from "../setup/mqtt-fixture";

import type { ObjectId } from "@/lib/types";
import type { Event } from "@/modules/admin";

async function clearCollections() {
  const collections = await db().collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

describe("Admin Publisher Integration Tests", () => {
  beforeAll(async () => {
    // Initialize database
    await initializeDb({
      uri: process.env.MONGO_URI ?? "mongodb://localhost:27017",
      databaseName: "device_manager_test",
    });

    // Initialize MQTT (shared fixture - will only init once)
    await initializeMqtt();

    await clearCollections();
  }, 30000);

  afterAll(async () => {
    // Cleanup database
    await clearCollections();
    await disconnectDb();

    // Cleanup MQTT (shared fixture - will only cleanup when last test completes)
    await cleanupMqtt();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  describe("ConcertService.setActiveEvent with publish=true", () => {
    let concertId: ObjectId;
    let eventId: ObjectId;

    beforeEach(async () => {
      // Create a concert
      const concertResult = await ConcertService.createConcert({
        name: "Active Concert",
        metadata: { type: "test" },
        isActive: true,
        activeEventId: null,
      });

      expect(concertResult.success).toBe(true);
      if (!concertResult.success) throw new Error("Failed to create concert");

      concertId = concertResult.data._id;

      // Create an event
      const eventResult = await EventService.createEvent({
        concertId,
        eventType: "intro",
        label: "Opening Event",
        payload: { message: "Welcome to the concert!" },
        position: 1,
      });

      expect(eventResult.success).toBe(true);
      if (!eventResult.success) throw new Error("Failed to create event");

      eventId = eventResult.data._id;
    });

    it("should set active event and publish it via MQTT when publish=true", async () => {
      // Set active event with publish=true (default)
      const result = await ConcertService.setActiveEvent(concertId.toString(), eventId.toString(), true);

      if (result.success) {
        expect(result.data).toBe(true);
      } else {
        expect.fail("Expected success to be true");
      }

      // Verify the event was set as active
      const concert = await ConcertService.getConcertById(concertId.toString());
      expect(concert).toBeDefined();
      expect(concert?.activeEventId?.toString()).toBe(eventId.toString());
    });

    it("should set active event without publishing when publish=false", async () => {
      // Set active event with publish=false
      const result = await ConcertService.setActiveEvent(concertId.toString(), eventId.toString(), false);

      expect(result.success).toBe(true);

      expect(result.data).toBe(true);

      // Verify the event was set as active
      const concert = await ConcertService.getConcertById(concertId.toString());
      expect(concert).toBeDefined();
      expect(concert?.activeEventId?.toString()).toBe(eventId.toString());
    });

    it("should fail to set active event when event does not exist", async () => {
      const fakeEventId = "507f1f77bcf86cd799439011";

      const result = await ConcertService.setActiveEvent(concertId.toString(), fakeEventId, true);

      if (!result.success) {
        expect(result.error).toBe("Event not found");
      } else {
        expect.fail("Expected success to be false");
      }
    });

    it("should fail to publish when MQTT publisher is disconnected", async () => {
      // Disconnect publisher
      mqttPublisher.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Try to set active event with publish=true
      const result = await ConcertService.setActiveEvent(concertId.toString(), eventId.toString(), true);

      if (!result.success) {
        expect(result.error).toBe("Failed to publish event");
      } else {
        expect.fail("Expected success to be false");
      }

      // Reconnect for other tests
      mqttPublisher.connect(config.mqtt.brokerUrl);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    it("should clear active event when eventId is null", async () => {
      // First set an active event
      await ConcertService.setActiveEvent(concertId.toString(), eventId.toString(), false);

      // Verify it's set
      let concert = await ConcertService.getConcertById(concertId.toString());
      expect(concert?.activeEventId?.toString()).toBe(eventId.toString());

      // Clear active event
      const result = await ConcertService.setActiveEvent(concertId.toString(), null, false);

      expect(result.success).toBe(true);

      // Verify it's cleared
      concert = await ConcertService.getConcertById(concertId.toString());
      expect(concert?.activeEventId).toBeNull();
    });

    it("should handle multiple events and set the correct one as active", async () => {
      // Create multiple events
      const event2Result = await EventService.createEvent({
        concertId,
        eventType: "main",
        label: "Main Event",
        payload: { phase: 2 },
        position: 2,
      });

      const event3Result = await EventService.createEvent({
        concertId,
        eventType: "outro",
        label: "Closing Event",
        payload: { phase: 3 },
        position: 3,
      });

      expect(event2Result.success && event3Result.success).toBe(true);
      if (!event2Result.success || !event3Result.success) return;

      // Set event 2 as active
      let result = await ConcertService.setActiveEvent(concertId.toString(), event2Result.data._id.toString(), true);

      expect(result.success).toBe(true);

      let concert = await ConcertService.getConcertById(concertId.toString());
      expect(concert?.activeEventId?.toString()).toBe(event2Result.data._id.toString());

      // Change to event 3
      result = await ConcertService.setActiveEvent(concertId.toString(), event3Result.data._id.toString(), true);

      expect(result.success).toBe(true);

      concert = await ConcertService.getConcertById(concertId.toString());
      expect(concert?.activeEventId?.toString()).toBe(event3Result.data._id.toString());
    });
  });

  describe("Event Broadcasting Flow", () => {
    it("should complete full flow: create concert → create event → set active → publish", async () => {
      // Step 1: Create concert
      const concertResult = await ConcertService.createConcert({
        name: "Integration Test Concert",
        metadata: { venue: "Test Hall", date: "2025-10-23" },
        isActive: true,
        activeEventId: null,
      });

      expect(concertResult.success).toBe(true);
      if (!concertResult.success) return;

      const concertId = concertResult.data._id;

      // Step 2: Create multiple events
      const events: Event[] = [
        {
          concertId,
          eventType: "intro",
          label: "Welcome",
          payload: { text: "Welcome everyone!" },
          position: 1,
        },
        {
          concertId,
          eventType: "note",
          label: "First Note",
          payload: { pitch: "A4", duration: 1000 },
          position: 2,
        },
        {
          concertId,
          eventType: "note",
          label: "Second Note",
          payload: { pitch: "C5", duration: 1500 },
          position: 3,
        },
      ];

      const createdEvents = [];
      for (const event of events) {
        const result = await EventService.createEvent(event);
        expect(result.success).toBe(true);
        if (result.success) {
          createdEvents.push(result.data);
        }
      }

      expect(createdEvents.length).toBe(3);

      // Step 3: Activate events one by one
      for (const event of createdEvents) {
        const result = await ConcertService.setActiveEvent(concertId.toString(), event._id.toString(), true);

        expect(result.success).toBe(true);

        // Verify it's set as active
        const concert = await ConcertService.getConcertById(concertId.toString());
        expect(concert?.activeEventId?.toString()).toBe(event._id.toString());
      }

      // Step 4: Clear active event
      const clearResult = await ConcertService.setActiveEvent(concertId.toString(), null, false);

      expect(clearResult.success).toBe(true);

      const finalConcert = await ConcertService.getConcertById(concertId.toString());
      expect(finalConcert?.activeEventId).toBeNull();
    });
  });
});
