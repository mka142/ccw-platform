import express from "express";

import { config } from "./config";
import adminApiRoutes from "./modules/admin/routes/api";
import adminViews from "./modules/admin/routes/views";
import { createMqttBroker, shutdownMqttBroker } from "./modules/connections/broker";
import { mqttPublisher } from "./modules/connections/publisher";
import { initializeDb, disconnectDb } from "./modules/db";
import { examinationFormRoutes } from "./modules/examination-form";
import examinationFormViews from "./modules/examination-form/routes/views/examination-form";
import { formRoutes } from "./modules/form";
import { mqttHandlers } from "./modules/mqttHandlers";
import { createServer, shutdownServer } from "./modules/server";
import { userRoutes } from "./modules/user";
import { setupMiddleware, setupErrorHandlers, basicAuth, setupTemplateLocals } from "./shared/middleware";

const app = express();

// Configure Express
app.set("view engine", "ejs");
app.set("views", [config.paths.views.admin, config.paths.views.examinationForm]);

// Setup middleware
setupMiddleware(app);

// Setup template locals (must be before routes)
app.use(setupTemplateLocals);

// Register routes
// Admin routes: /api/* and view routes at /
app.use(config.url.admin, basicAuth, adminViews);
// Examination form view routes at /examination-forms/*
app.use(config.url.examinationForm, examinationFormViews);
// User routes: /api/users/*
app.use(config.url.apiConcert, adminApiRoutes);
app.use(config.url.apiUser, userRoutes);
// Form routes: /api/forms/*
app.use(config.url.apiForm, formRoutes);
// Examination form routes: /api/examination-forms/*
app.use(config.url.apiExaminationForm, examinationFormRoutes);

// Setup error handlers (must be last)
setupErrorHandlers(app);

// ============================================================================
// Initialize Services
// ============================================================================

async function initializeServices() {
  // 1. Initialize Database
  console.log("📦 Initializing database...");
  await initializeDb({
    uri: config.database.url,
    databaseName: config.database.name,
  });
  console.log("✅ Database connected");

  // 2. Start HTTP server
  const server = createServer(app, config.server.port);

  // 3. Initialize MQTT broker with custom handlers

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

  Promise.all([shutdownServer(server), disconnectDb()])
    .then(() => {
      console.log("✅ Graceful shutdown complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error during shutdown:", error);
      process.exit(1);
    });
}

// Register shutdown handlers (only once, in one place)
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
