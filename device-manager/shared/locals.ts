import { config } from "@/config";

import type { Request, Response, NextFunction } from "express";

/**
 * Get the full URL from Express request
 */
function getFullUrl(req: Request): string {
  const protocol = req.protocol; // 'http' or 'https'
  const host = req.get("host"); // 'localhost:3001' or 'example.com'
  const originalUrl = req.originalUrl; // '/admin/concerts?page=2'

  return `${protocol}://${host}${originalUrl}`;
}

/**
 * Middleware to inject global template variables
 * Makes route prefixes and URLs available in all EJS templates
 */
export function setupTemplateLocals(req: Request, res: Response, next: NextFunction): void {
  // Base URL (without path)
  res.locals.baseUrl = `${req.protocol}://${req.get("host")}`;

  // Full current URL
  res.locals.currentUrl = getFullUrl(req);

  // Path only (without domain)
  res.locals.currentPath = req.path; // '/admin/concerts'

  // Original URL (path + query string)
  res.locals.currentFullPath = req.originalUrl; // '/admin/concerts?page=2'

  // Route prefixes
  res.locals.url = config.url;

  next();
}
