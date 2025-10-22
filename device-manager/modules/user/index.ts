/**
 * User Module
 * Handles user management, device status tracking, and user-concert relationships
 */

// Main routes export
export { default as userRoutes } from "./routes";

// Type exports
export type { User, UserWithId, DeviceType } from "./types";

// Service exports
export { UserService } from "./services";

// Database operations exports (for direct usage if needed)
export { UserOperations } from "./db";
