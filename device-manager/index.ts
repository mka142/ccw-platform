import express from "express";

import { config } from "./config";
import adminRoutes from "./modules/admin/routes";
import { createMqttBroker, shutdownMqttBroker } from "./modules/connections/broker";
import { mqttPublisher } from "./modules/connections/publisher";
import { initializeDb, disconnectDb } from "./modules/db";
import { createServer, shutdownServer } from "./modules/server";
import { userRoutes } from "./modules/user";
import { setupMiddleware, setupErrorHandlers } from "./shared/middleware";

import type { MqttBrokerHandlers } from "./modules/connections/broker";

const app = express();

// Configure Express
app.set("view engine", "ejs");
app.set("views", [config.paths.views]);

// Setup middleware
setupMiddleware(app);

// Register routes
// Admin routes: /api/* and view routes at /
app.use("/", adminRoutes);
// User routes: /api/users/*
app.use("/api/users", userRoutes);

// Setup error handlers (must be last)
setupErrorHandlers(app);

// ============================================================================
// Initialize Services
// ============================================================================

async function initializeServices() {
  // 1. Initialize Database
  console.log('📦 Initializing database...');
  await initializeDb({
    uri: config.database.url,
    databaseName: config.database.name,
  });
  console.log('✅ Database connected');

  // 2. Start HTTP server
  const server = createServer(app, config.server.port);

  // 3. Initialize MQTT broker with custom handlers
  const mqttHandlers: MqttBrokerHandlers = {
    onClientConnect: (client) => {
      // Custom logic when a new client connects (excluding server publisher)
      console.log(`🎯 Custom handler: New device connected - ${client.id}`);
      
      // Example: Store client info in database, send welcome message, etc.
      // await db().collection('connected_devices').insertOne({
      //   clientId: client.id,
      //   connectedAt: new Date(),
      // });
    },

    onClientDisconnect: (client) => {
      // Custom logic when a client disconnects
      console.log(`👋 Custom handler: Device disconnected - ${client.id}`);
      
      // Example: Update database, cleanup resources, etc.
      // await db().collection('connected_devices').deleteOne({ clientId: client.id });
    },

    onClientError: (client, error) => {
      // Custom logic when a client encounters an error
      console.log(`⚠️ Custom handler: Client ${client.id} error - ${error.message}`);
      
      // Example: Log to monitoring system, send alerts, etc.
      // await logErrorToMonitoring(client.id, error);
    },
  };

  const { cleanup: mqttCleanup } = createMqttBroker(server, config.mqtt.port, mqttHandlers);

  // 4. Connect MQTT publisher to broker (after a short delay to ensure broker is ready)
  setTimeout(() => {
    mqttPublisher.connect(config.mqtt.brokerUrl);
  }, 1000);

  return { server, mqttCleanup };
}

// Start the application
const { server, mqttCleanup } = await initializeServices();

// ============================================================================
// Graceful Shutdown Handler
// ============================================================================

function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  // Shutdown order:
  // 1. Disconnect MQTT publisher (stop publishing)
  // 2. Cleanup MQTT broker (close connections, clear intervals)
  // 3. Close HTTP server
  // 4. Disconnect database
  
  mqttPublisher.disconnect();
  mqttCleanup();
  shutdownMqttBroker();
  
  Promise.all([
    shutdownServer(server),
    disconnectDb(),
  ])
    .then(() => {
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    });
}

// Register shutdown handlers (only once, in one place)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
