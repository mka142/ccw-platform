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
bun run test
```

## Add Users

You can add multiple users to a concert using the `addUsers.ts` script. Run the following command:

```bash
bun run addUsers.ts <count> <deviceType>
```

- `<count>`: The number of users to add.
- `<deviceType>`: The type of device (`Web` or `M5Stack`).

Example:

```bash
bun run addUsers.ts 10 Web
```

This will add 10 users of the `Web` device type.
