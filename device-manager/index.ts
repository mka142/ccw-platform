import express from "express";

import adminRoutes from "./modules/admin/routes";
import { appConfig } from "./shared/config";
import { setupMiddleware, setupErrorHandlers } from "./shared/middleware";
import { createServer } from "./shared/server";

const app = express();

// Configure Express
app.set("view engine", "ejs");
app.set("views", [appConfig.viewsPath]);

// Setup middleware
setupMiddleware(app);

// Register admin routes
// API routes will be available at /api/*
// View routes will be available at /*
app.use("/", adminRoutes);

// Setup error handlers (must be last)
setupErrorHandlers(app);

// Start server
createServer(app, appConfig.port);

export default app;
