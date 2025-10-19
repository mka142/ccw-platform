# Device Manager

Admin module for managing concerts, events, and connected devices.

## Setup

```bash
bun install
```

Set environment variables in `.env`:

```
MONGO_URI=mongodb://localhost:27017
MONGO_DATABASE=ccw_platform
```

## Run

```bash
bun run start
```

Admin UI available at `http://localhost:3000`

## Test

Start MongoDB and run integration tests: (this requires Docker)

```bash
bun run test:int
```
