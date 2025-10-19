/**
 * Generic Library
 *
 * Self-contained, reusable utilities that can be used by any module.
 * This library has no dependencies on application-specific code.
 */

// Export base types
export type { BaseEntity, BaseDocument, OperationResult } from "./types";

// Export database utilities
export * from "./db";

// Export generic utilities (to be added in future phases)
// export * from "./validation";
// export * from "./middleware";
// export * from "./utils";
