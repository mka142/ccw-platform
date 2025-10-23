import cors from "cors";
import express from "express";

import { config } from "@/config";

import type { Application, Request, Response, NextFunction } from "express";

export { basicAuth } from "./basicAuth";
export { setupTemplateLocals } from "./locals";

export function setupMiddleware(app: Application): void {
  // Enable CORS for all routes
  app.use(
    cors({
      origin: config.cors.origin, // Allow requests from your web-client
      credentials: true, // Allow cookies and auth headers
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", config.api.userIdHeader],
    })
  );
  // Parse JSON bodies
  app.use(express.json());

  // Parse URL-encoded bodies (for views form submissions)
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from public directory
  app.use(express.static(config.paths.public));

  // Add logging middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

export function setupErrorHandlers(app: Application): void {
  // Error handling middleware
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    const isApi = req.path?.startsWith("/api");
    if (isApi) {
      res.status(500).json({ success: false, error: "Internal server error" });
      return;
    }
    res.status(500).render("error", {
      title: "Błąd",
      message: "Wystąpił błąd serwera",
    });
  });

  // 404 handler
  app.use((req: express.Request, res: express.Response) => {
    const isApi = req.path?.startsWith("/api");
    if (isApi) {
      res.status(404).json({ success: false, error: "API endpoint not found" });
      return;
    }
    res.status(404).render("error", {
      title: "Nie znaleziono",
      message: "Strona nie została znaleziona",
    });
  });
}
