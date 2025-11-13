import { DataRecord, RecordMetadata } from "./types";

/**
 * Generate sample data: 5 users (user-1 to user-5), each with 20 records
 */
export function generateSampleData(): DataRecord[] {
  const records: DataRecord[] = [];
  const userIds = ["user-1", "user-2", "user-3", "user-4", "user-5"];
  const recordsPerUser = 20;
  const startTimestamp = Date.now() - 60000 * 20; // 20 minutes ago

  userIds.forEach((userId, userIndex) => {
    for (let i = 0; i < recordsPerUser; i++) {
      // Each user has a different base pattern
      const baseValue = 50 + userIndex * 10;
      const timestamp = startTimestamp + i * 60000; // 1 minute intervals

      // Add some variation with sine wave and random noise
      const sineWave = Math.sin((i / recordsPerUser) * Math.PI * 2) * 15;
      const noise = (Math.random() - 0.5) * 5;
      const value = baseValue + sineWave + noise;

      records.push({
        id: userId,
        timestamp,
        value: Math.max(0, value), // Ensure non-negative values
      });
    }
  });

  return records;
}

/**
 * Create an empty config with initialized metadata for all IDs
 */
export function createEmptyConfig(recordIds: string[]) {
  const recordMetadata: Record<string, RecordMetadata> = {};

  recordIds.forEach((id) => {
    recordMetadata[id] = {
      id,
      tags: [],
      xMove: 0,
      yMove: 0,
      operations: [],
    };
  });

  return {
    version: "1.0.0",
    title: undefined,
    resampling: {
      applied: false,
      windowMs: 1000,
      interpolationMethod: "linear" as const,
    },
    recordMetadata,
    globalOperations: [],
    filterByIds: [],
    filterByTags: [],
    sets: [],
    visible: {
      records: true,
      sets: true,
    },
  };
}
