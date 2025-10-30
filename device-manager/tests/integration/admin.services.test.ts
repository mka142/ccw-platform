import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

import { parseId } from "@/lib/db/utils";
import { db, initializeDb, disconnectDb } from "@/modules/db";

import { ConcertService } from "../../modules/admin/services/concertService";
import { EventService } from "../../modules/admin/services/eventService";
import { UserService } from "../../modules/user/services";

import type { ObjectId } from "@/lib/types";
import type { User } from "@/modules/user";

async function clearCollections() {
  const collections = await db().collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

describe("Admin Services Integration Tests", () => {
  beforeAll(async () => {
    // Initialize database connection using the new refactored approach
    await initializeDb({
      uri: process.env.MONGO_URI ?? "mongodb://localhost:27017",
      databaseName: "device_manager_test",
    });

    await clearCollections();
  }, 30000);

  afterAll(async () => {
    await clearCollections();
    await disconnectDb();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  describe("ConcertService", () => {
    it("creates and retrieves a concert", async () => {
      const concertData = {
        name: "Spring Concert 2025",
        metadata: { description: "Classical music event", venue: "Main Hall" },
        isActive: false,
        activeEventId: null,
      };

      const createResult = await ConcertService.createConcert(concertData);
      expect(createResult.success).toBe(true);

      if (!createResult.success) return;
      expect(createResult.data._id).toBeDefined();

      const concerts = await ConcertService.getAllConcerts();
      expect(concerts.length).toBe(1);
      expect(concerts[0]?.name).toBe("Spring Concert 2025");
    });

    it("activates a concert and deactivates others", async () => {
      // Create two concerts
      const concert1 = await ConcertService.createConcert({
        name: "Concert 1",
        metadata: { type: "first" },
        isActive: true,
        activeEventId: null,
      });

      const concert2 = await ConcertService.createConcert({
        name: "Concert 2",
        metadata: { type: "second" },
        isActive: false,
        activeEventId: null,
      });

      expect(concert1.success).toBe(true);
      expect(concert2.success).toBe(true);

      if (!concert1.success || !concert2.success) return;

      // Activate concert2
      const activateResult = await ConcertService.activateConcert(concert2.data._id?.toString() ?? "");
      expect(activateResult.success).toBe(true);

      // Verify only concert2 is active
      const updatedConcert1 = await ConcertService.getConcertById(concert1.data._id?.toString() ?? "");
      const updatedConcert2 = await ConcertService.getConcertById(concert2.data._id?.toString() ?? "");

      expect(updatedConcert1?.isActive).toBe(false);
      expect(updatedConcert2?.isActive).toBe(true);
    });

    it("deactivates a concert", async () => {
      const concert = await ConcertService.createConcert({
        name: "Active Concert",
        metadata: { status: "will be deactivated" },
        isActive: true,
        activeEventId: null,
      });

      expect(concert.success).toBe(true);
      if (!concert.success) return;

      const deactivateResult = await ConcertService.deactivateConcert(concert.data._id?.toString() ?? "");
      expect(deactivateResult.success).toBe(true);

      const updated = await ConcertService.getConcertById(concert.data._id?.toString() ?? "");
      expect(updated?.isActive).toBe(false);
    });

    it("sets active event for a concert", async () => {
      const concert = await ConcertService.createConcert({
        name: "Concert with Event",
        metadata: { test: "active event" },
        isActive: true,
        activeEventId: null,
      });

      expect(concert.success).toBe(true);
      if (!concert.success || !concert.data._id) return;

      const event = await EventService.createEvent({
        concertId: concert.data._id,
        eventType: "intro",
        label: "Opening",
        payload: { message: "Welcome" },
        position: 1,
      });

      expect(event.success).toBe(true);
      if (!event.success || !event.data._id) return;

      const setActiveResult = await ConcertService.setActiveEvent(concert.data._id.toString(), event.data._id.toString(), false);
      expect(setActiveResult.success).toBe(true);

      const updated = await ConcertService.getConcertById(concert.data._id.toString());
      expect(updated?.activeEventId?.toString()).toBe(event.data._id.toString());
    });

    it("clears active event when set to null", async () => {
      const concert = await ConcertService.createConcert({
        name: "Concert Clear Event",
        metadata: { test: "clear" },
        isActive: true,
        activeEventId: null,
      });

      expect(concert.success).toBe(true);
      if (!concert.success || !concert.data._id) return;

      const clearResult = await ConcertService.setActiveEvent(concert.data._id.toString(), null, false);
      expect(clearResult.success).toBe(true);

      const updated = await ConcertService.getConcertById(concert.data._id.toString());
      expect(updated?.activeEventId).toBeNull();
    });
  });

  describe("EventService", () => {
    let concertId: ObjectId;

    beforeEach(async () => {
      const concert = await ConcertService.createConcert({
        name: "Test Concert",
        metadata: { description: "For events" },
        isActive: true,
        activeEventId: null,
      });

      expect(concert.success).toBe(true);
      if (!concert.success) throw new Error("Failed to create concert");

      concertId = concert.data._id;
    });

    it("creates and retrieves an event", async () => {
      const eventData = {
        concertId: parseId(concertId),
        eventType: "note",
        label: "Test Note",
        payload: { text: "Hello World" },
        position: 1,
      };

      const createResult = await EventService.createEvent(eventData);
      expect(createResult.success).toBe(true);

      if (!createResult.success) return;

      const retrieved = await EventService.getEventById(createResult.data._id.toString());
      expect(retrieved).toBeDefined();
      expect(retrieved?.label).toBe("Test Note");
      expect(retrieved?.payload.text).toBe("Hello World");
    });

    it("gets events by concert", async () => {
      await EventService.createEvent({
        concertId,
        eventType: "intro",
        label: "Event 1",
        payload: {},
        position: 1,
      });

      await EventService.createEvent({
        concertId,
        eventType: "main",
        label: "Event 2",
        payload: {},
        position: 2,
      });

      const events = await EventService.getEventsByConcert(concertId);
      expect(events.length).toBe(2);
      expect(events[0]?.position).toBe(1);
      expect(events[1]?.position).toBe(2);
    });

    it("updates an event", async () => {
      const event = await EventService.createEvent({
        concertId,
        eventType: "note",
        label: "Original Label",
        payload: { value: 1 },
        position: 1,
      });

      expect(event.success).toBe(true);
      if (!event.success) return;

      const updateResult = await EventService.updateEvent(event.data._id.toString(), {
        label: "Updated Label",
        payload: { value: 2 },
      });

      expect(updateResult.success).toBe(true);

      const updated = await EventService.getEventById(event.data._id.toString());
      expect(updated?.label).toBe("Updated Label");
      expect(updated?.payload.value).toBe(2);
    });

    it("deletes an event", async () => {
      const event = await EventService.createEvent({
        concertId,
        eventType: "note",
        label: "To Delete",
        payload: {},
        position: 1,
      });

      expect(event.success).toBe(true);
      if (!event.success) return;

      const deleteResult = await EventService.deleteEvent(event.data._id.toString());
      expect(deleteResult.success).toBe(true);

      const retrieved = await EventService.getEventById(event.data._id.toString());
      expect(retrieved).toBeNull();
    });

    it("moves event position up", async () => {
      const event1 = await EventService.createEvent({
        concertId,
        eventType: "note",
        label: "Event 1",
        payload: {},
        position: 1,
      });

      const event2 = await EventService.createEvent({
        concertId,
        eventType: "note",
        label: "Event 2",
        payload: {},
        position: 2,
      });

      expect(event1.success && event2.success).toBe(true);
      if (!event1.success || !event2.success) return;

      // Move event2 up (should swap with event1)
      const moveResult = await EventService.moveEventPosition(event2.data._id.toString(), "up");
      expect(moveResult.success).toBe(true);

      const updated1 = await EventService.getEventById(event1.data._id.toString());
      const updated2 = await EventService.getEventById(event2.data._id.toString());

      expect(updated2?.position).toBe(1);
      expect(updated1?.position).toBe(2);
    });

    it("moves event position down", async () => {
      const event1 = await EventService.createEvent({
        concertId,
        eventType: "note",
        label: "Event 1",
        payload: {},
        position: 1,
      });

      const event2 = await EventService.createEvent({
        concertId,
        eventType: "note",
        label: "Event 2",
        payload: {},
        position: 2,
      });

      expect(event1.success && event2.success).toBe(true);
      if (!event1.success || !event2.success) return;

      // Move event1 down (should swap with event2)
      const moveResult = await EventService.moveEventPosition(event1.data._id.toString(), "down");
      expect(moveResult.success).toBe(true);

      const updated1 = await EventService.getEventById(event1.data._id.toString());
      const updated2 = await EventService.getEventById(event2.data._id.toString());

      expect(updated1?.position).toBe(2);
      expect(updated2?.position).toBe(1);
    });

    it("fails to move event when no adjacent event exists", async () => {
      const event = await EventService.createEvent({
        concertId,
        eventType: "note",
        label: "Only Event",
        payload: {},
        position: 1,
      });

      expect(event.success).toBe(true);
      if (!event.success) return;

      const moveUpResult = await EventService.moveEventPosition(event.data._id.toString(), "up");
      expect(moveUpResult.success).toBe(false);

      const moveDownResult = await EventService.moveEventPosition(event.data._id.toString(), "down");
      expect(moveDownResult.success).toBe(false);
    });
  });

  describe("UserService", () => {
    let concertId: ObjectId;

    beforeEach(async () => {
      const concert = await ConcertService.createConcert({
        name: "User Test Concert",
        metadata: { description: "For user tests" },
        isActive: true,
        activeEventId: null,
      });

      expect(concert.success).toBe(true);
      if (!concert.success) throw new Error("Failed to create concert");

      concertId = concert.data._id;
    });

    it("creates and retrieves users", async () => {
      const userData: User = {
        concertId,
        deviceType: "Web",
        isActive: true,
      };

      const createResult = await UserService.createUser(userData);
      expect(createResult.success).toBe(true);

      if (!createResult.success) return;

      const users = await UserService.getUsersByConcert(concertId);
      expect(users.length).toBe(1);
      expect(users[0]?.deviceType).toBe("Web");
    });

    it("updates user status", async () => {
      const user = await UserService.createUser({
        concertId,
        deviceType: "M5Stack",
        isActive: false,
      });

      expect(user.success).toBe(true);
      if (!user.success) return;

      const updateResult = await UserService.updateUserStatus(user.data._id.toString(), true);
      expect(updateResult.success).toBe(true);

      if (!updateResult.success || !updateResult.data) return;

      expect(updateResult.data.isActive).toBe(true);
      expect(updateResult.data.lastPing).toBeDefined();
    });

    it("updates device status with ping", async () => {
      const user = await UserService.createUser({
        concertId,
        deviceType: "Web",
        isActive: false,
      });

      expect(user.success).toBe(true);
      if (!user.success) return;

      const beforePing = Date.now();
      const updateResult = await UserService.updateDeviceStatus(user.data._id.toString(), true);
      expect(updateResult.success).toBe(true);

      if (!updateResult.success || !updateResult.data) return;

      expect(updateResult.data.isActive).toBe(true);
      expect(updateResult.data.lastPing).toBeGreaterThanOrEqual(beforePing);
    });

    it("gets only active users", async () => {
      await UserService.createUser({
        concertId,
        deviceType: "Web",
        isActive: true,
      });

      await UserService.createUser({
        concertId,
        deviceType: "M5Stack",
        isActive: false,
      });

      await UserService.createUser({
        concertId,
        deviceType: "Web",
        isActive: true,
      });

      const activeUsers = await UserService.getActiveUsers(concertId);
      expect(activeUsers.length).toBe(2);
      expect(activeUsers.every((u) => u.isActive)).toBe(true);
    });

    it("updates user properties", async () => {
      const user = await UserService.createUser({
        concertId,
        deviceType: "Web",
        isActive: false,
      });

      expect(user.success).toBe(true);
      if (!user.success) return;

      const updateResult = await UserService.updateUser(user.data._id.toString(), {
        deviceType: "M5Stack",
        isActive: true,
      });

      expect(updateResult.success).toBe(true);

      if (!updateResult.success || !updateResult.data) return;

      expect(updateResult.data.deviceType).toBe("M5Stack");
      expect(updateResult.data.isActive).toBe(true);
    });

    it("deletes a user", async () => {
      const user = await UserService.createUser({
        concertId,
        deviceType: "Web",
        isActive: false,
      });

      expect(user.success).toBe(true);
      if (!user.success) return;

      const deleteResult = await UserService.deleteUser(user.data._id.toString());
      expect(deleteResult.success).toBe(true);

      const users = await UserService.getUsersByConcert(concertId);
      expect(users.length).toBe(0);
    });
  });
});
