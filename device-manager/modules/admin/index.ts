/**
 * Admin Module - Clean Architecture
 *
 * This module provides a clean, well-structured admin interface following
 * proper separation of concerns and dependency boundaries.
 *
 * Architecture Layers:
 * - db/         Database operations (CRUD)
 * - services/   Business logic layer
 * - routes/     HTTP API endpoints
 * - types.ts    Type definitions
 *
 * Features:
 * - Concert management (create, activate/deactivate)
 * - Event management (create, position handling)
 * - Clean separation between data access and business logic
 * - Type-safe operations throughout
 * - Proper error handling and validation
 */

// Main exports
export { default as adminRoutes } from "./routes";

// Type exports
export type { Concert, Event, ConcertWithId, EventWithId } from "./types";

// Service exports (for direct usage if needed)
export { ConcertService } from "./services/concertService";
export { EventService } from "./services/eventService";

// Database operations exports (for direct usage if needed)
export { ConcertOperations, EventOperations } from "./db";
