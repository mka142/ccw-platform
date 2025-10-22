/**
 * Application Database Module
 * 
 * This module creates the database instance using app-level configuration.
 * Import and use this throughout your application modules.
 */

import { connectToDb, getDb, closeDb, isConnected } from '@/lib/db';

import type { MongoDbConfig } from '@/lib/db';
import type { Db } from 'mongodb';

/**
 * Initialize database connection with app configuration
 * Call this once during application startup
 * 
 * @param config - MongoDB configuration from app config
 * @returns Database instance
 * 
 * @example
 * ```typescript
 * import { initializeDb } from './modules/db';
 * import { config } from './config';
 * 
 * await initializeDb({
 *   uri: config.database.url,
 *   databaseName: config.database.name,
 * });
 * ```
 */
export async function initializeDb(config: MongoDbConfig): Promise<Db> {
  return await connectToDb(config);
}

/**
 * Get the database instance
 * Use this in your modules/services to access the database
 * 
 * @example
 * ```typescript
 * import { db } from './modules/db';
 * 
 * const users = await db().collection('users').find().toArray();
 * ```
 */
export function db(): Db {
  return getDb();
}

/**
 * Close database connection
 * Call this during graceful shutdown
 */
export async function disconnectDb(): Promise<void> {
  return await closeDb();
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return isConnected();
}

// Re-export types for convenience
export type { MongoDbConfig } from '@/lib/db';
