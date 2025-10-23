import { config } from "@/config";

import type { Request, Response, NextFunction } from "express";

/**
 * Basic Authentication Middleware
 * Protects routes with HTTP Basic Auth
 */
export function basicAuth(req: Request, res: Response, next: NextFunction): void {
  // Get the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Basic ")) {
    // No auth provided, request credentials
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"');
    res.status(401).json({
      success: false,
      error: "Authentication required",
    });
    return;
  }

  // Decode base64 credentials
  const base64Credentials = authHeader.split(" ")[1];
  if (!base64Credentials) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"');
    res.status(401).json({
      success: false,
      error: "Invalid authentication header",
    });
    return;
  }
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [username, password] = credentials.split(":");

  // Validate credentials
  if (username === config.admin.username && password === config.admin.password) {
    // Authentication successful
    next();
  } else {
    // Invalid credentials
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"');
    res.status(401).json({
      success: false,
      error: "Invalid credentials",
    });
  }
}