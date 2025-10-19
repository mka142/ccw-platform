/* Test environment bootstrap: sets Mongo env vars, ensures connection can be established lazily by code under test. */

// Provide defaults if not already set (CI can override these)
process.env.MONGO_URI = process.env.MONGO_URI ?? 'mongodb://root:example@localhost:27017';
// Use fixed DB name so docker init scripts apply; optionally suffix with uuid for isolation if parallelization later
process.env.MONGO_DATABASE = process.env.MONGO_DATABASE ?? 'ccw_platform';
process.env.NODE_ENV = 'test';

// Simple helper globally available (TypeScript global augmentation could be added later)
export async function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }

// Optionally verify connectivity early (disabled by default to keep startup fast)
if (process.env.VERIFY_DB === 'true') {
  (async () => {
    try {
      const { connectToDb } = await import('../../lib/db/connection');
      const db = await connectToDb();
      await db.command({ ping: 1 });
      console.log('[test-setup] Mongo ping ok');
    } catch (err) {
      console.error('[test-setup] Mongo ping failed', err);
      throw err;
    }
  })();
}
