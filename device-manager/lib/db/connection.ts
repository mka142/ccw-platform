import { MongoClient, Db } from "mongodb";

import type { MongoClientOptions } from "mongodb";

/**
 * MongoDB Connection Configuration
 */
export interface MongoDbConfig {
  /** MongoDB connection URI */
  uri: string;
  /** Database name */
  databaseName: string;
  /** Optional connection options */
  options?: MongoClientOptions;
}

/**
 * Default connection options
 */
const defaultConnectionOptions: MongoClientOptions = {
  maxPoolSize: 10,
};

let mongoClientInstance: MongoClient | null = null;
let currentDatabaseName: string | null = null;

/**
 * Connect to MongoDB with provided configuration
 * 
 * @param config - MongoDB configuration object
 * @returns Database instance
 * 
 * @example
 * ```typescript
 * const db = await connectToDb({
 *   uri: 'mongodb://localhost:27017',
 *   databaseName: 'my_database',
 *   options: { maxPoolSize: 20 }
 * });
 * ```
 */
async function connectToDb(config: MongoDbConfig): Promise<Db> {
  const { uri, databaseName, options } = config;

  if (!mongoClientInstance) {
    const connectionOptions = {
      ...defaultConnectionOptions,
      ...options,
    };

    mongoClientInstance = await MongoClient.connect(uri, connectionOptions);
    currentDatabaseName = databaseName;
    console.log(`MongoDB Connected Successfully to ${databaseName}`);
  }

  // Return reference to the database
  return mongoClientInstance.db(databaseName);
}

/**
 * Get the current database instance (if connected)
 * Throws error if not connected
 */
function getDb(): Db {
  if (!mongoClientInstance || !currentDatabaseName) {
    throw new Error('Database not connected. Call connectToDb first.');
  }
  return mongoClientInstance.db(currentDatabaseName);
}

/**
 * Close the MongoDB connection
 */
async function closeDb(): Promise<void> {
  if (mongoClientInstance) {
    await mongoClientInstance.close();
    mongoClientInstance = null;
    currentDatabaseName = null;
    console.log('MongoDB Connection Closed');
  }
}

/**
 * Check if database is connected
 */
function isConnected(): boolean {
  return mongoClientInstance !== null;
}

export { connectToDb, getDb, closeDb, isConnected };
