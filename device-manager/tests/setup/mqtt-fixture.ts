import http from "node:http";

import { config } from "@/config";
import { createMqttBroker } from "@/modules/connections/broker";
import { mqttPublisher } from "@/modules/connections/publisher";

let httpServer: http.Server | null = null;
let mqttCleanup: (() => void) | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
let cleanupCount = 0;

/**
 * Initialize MQTT broker and publisher for tests.
 * This should be called once in beforeAll() hooks.
 * Safe to call multiple times - will only initialize once.
 * Thread-safe using a singleton pattern with promise.
 */
export async function initializeMqtt(): Promise<void> {
  // If already initialized, return immediately
  if (isInitialized) {
    console.log("MQTT already initialized, skipping...");
    cleanupCount++;
    return;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    console.log("MQTT initialization in progress, waiting...");
    cleanupCount++;
    return initializationPromise;
  }

  // Start initialization
  console.log("Starting MQTT initialization...");
  cleanupCount = 1;
  
  initializationPromise = (async () => {
    // Create HTTP server for MQTT broker
    httpServer = http.createServer();

    // Start HTTP server
    await new Promise<void>((resolve) => {
      if (httpServer) {
        httpServer.listen(0, () => {
          console.log("Test HTTP server started");
          resolve();
        });
      }
    });

    // Initialize MQTT broker
    const { cleanup } = createMqttBroker(httpServer, config.mqtt.port);
    mqttCleanup = cleanup;

    // Wait for broker to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Connect MQTT publisher
    mqttPublisher.connect(config.mqtt.brokerUrl);

    // Wait for publisher to connect
    await new Promise((resolve) => setTimeout(resolve, 2000));

    isInitialized = true;
    console.log("MQTT initialization complete");
  })();

  await initializationPromise;
}

/**
 * Cleanup MQTT broker and publisher after tests.
 * This should be called once in afterAll() hooks.
 * Will only cleanup when all test files have completed.
 */
export async function cleanupMqtt(): Promise<void> {
  if (!isInitialized) {
    return;
  }

  cleanupCount--;
  console.log(`MQTT cleanup requested (${cleanupCount} test files remaining)`);

  // Only cleanup when no more test files are using MQTT
  if (cleanupCount > 0) {
    return;
  }

  console.log("Final test file completed, cleaning up MQTT...");

  // Disconnect MQTT publisher
  mqttPublisher.disconnect();

  // Wait for disconnect to complete
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Cleanup MQTT broker
  if (mqttCleanup) {
    mqttCleanup();
    mqttCleanup = null;
  }

  // Close HTTP server
  if (httpServer) {
    await new Promise<void>((resolve) => {
      if (httpServer) {
        httpServer.close(() => {
          console.log("Test HTTP server closed");
          resolve();
        });
      }
    });
    httpServer = null;
  }

  isInitialized = false;
  initializationPromise = null;
  cleanupCount = 0;
  console.log("MQTT cleanup complete");
}

/**
 * Check if MQTT is initialized
 */
export function isMqttInitialized(): boolean {
  return isInitialized;
}
