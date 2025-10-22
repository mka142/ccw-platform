/**
 * Simple MongoDB Connection Library
 *
 * This library provides a simple MongoDB connection using connection pooling.
 * No abstractions, just direct MongoDB access.
 * 
 * This library is self-contained and doesn't depend on app-level configuration.
 * Configuration is passed when calling connectToDb.
 */

// Export the connection functions and types
export { connectToDb, getDb, closeDb, isConnected } from "./connection";
export type { MongoDbConfig } from "./connection";

