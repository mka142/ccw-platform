# Database Module Organization

## Structure

```
lib/db/                    # Self-contained database library (no config dependency)
├── connection.ts          # MongoDB connection logic
└── index.ts              # Exports for lib

modules/db/               # Application database instance (uses config)
└── index.ts             # Database instance with app config
```

## Usage

### 1. Initialize Database (in your app startup)

```typescript
import { config } from './config';
import { initializeDb } from './modules/db';

// In your index.ts or server.ts
await initializeDb({
  uri: config.database.url,
  databaseName: config.database.name,
  options: {
    maxPoolSize: 10,
    // ... other MongoDB options
  }
});
```

### 2. Use Database in Your Modules

```typescript
import { db } from './modules/db';

// In any service or module
export async function getUsers() {
  const database = db();
  return await database.collection('users').find().toArray();
}

// Or directly
const users = await db().collection('users').find().toArray();
```

### 3. Graceful Shutdown

```typescript
import { disconnectDb } from './modules/db';

process.on('SIGTERM', async () => {
  await disconnectDb();
  process.exit(0);
});
```

## Benefits

✅ **lib/db is self-contained** - No app config dependency  
✅ **modules/db has app instance** - Uses your config  
✅ **Type-safe** - Full TypeScript support  
✅ **Flexible** - Can pass different configs for testing  
✅ **Clean separation** - Library vs. application code  

## Example: Testing with Different Config

```typescript
import { connectToDb } from '../../lib/db';

// In tests, use different database
const testDb = await connectToDb({
  uri: 'mongodb://localhost:27017',
  databaseName: 'test_database',
});
```

## Example: Full App Initialization

```typescript
import { config } from './config';
import { initializeDb, db } from './modules/db';

async function startApp() {
  // Initialize database with config
  await initializeDb({
    uri: config.database.url,
    databaseName: config.database.name,
  });

  // Now use db() anywhere
  const concerts = await db().collection('concerts').find().toArray();
  console.log(`Found ${concerts.length} concerts`);
}

startApp();
```
