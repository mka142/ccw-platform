import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

import { PublisherService } from "@/modules/connections/services/publisherService";
import { db, initializeDb, disconnectDb } from "@/modules/db";

import { initializeMqtt, cleanupMqtt } from "../setup/mqtt-fixture";

async function clearCollections() {
  const collections = await db().collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

describe("MQTT Publisher Integration Tests", () => {
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

  describe("PublisherService", () => {
    it("should be connected after setup", () => {
      expect(PublisherService.isConnected()).toBe(true);
    });

    it("should return connection status", () => {
      const status = PublisherService.getConnectionStatus();
      expect(status.success).toBe(true);
      if (!status.success) expect.fail("Expected success to be true");
      expect(status.data).toBe(true);
    });
  });
});
