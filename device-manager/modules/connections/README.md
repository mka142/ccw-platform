# Connections Module

This module handles MQTT broker and publisher functionality for broadcasting events to connected clients.

## Structure

```
modules/connections/
├── broker.ts           # MQTT broker (Aedes) with WebSocket support
├── publisher.ts        # MQTT publisher for broadcasting events
├── types.ts           # EventSchema and MQTT topics
└── examples/
    └── device-client.ts   # Example client implementation
```

## Usage

### 1. Initialize the MQTT Broker

In your server initialization (e.g., `index.ts` or wherever you want to start MQTT):

```typescript
import { createMqttBroker } from './modules/connections/broker';
import { mqttPublisher } from './modules/connections/publisher';

// After creating your HTTP server
const httpServer = http.createServer(app);

// Initialize MQTT broker
const mqttPort = parseInt(process.env.MQTT_PORT ?? '1883');
createMqttBroker(httpServer, mqttPort);

// Connect publisher
setTimeout(() => {
  mqttPublisher.connect(`mqtt://localhost:${mqttPort}`);
}, 1000);

// Start HTTP server
httpServer.listen(3001);
```

### 2. Broadcast Events

From anywhere in your application:

```typescript
import { mqttPublisher } from './modules/connections/publisher';
import { ObjectId } from 'mongodb';

// Broadcast an event to all connected clients
await mqttPublisher.broadcastEvent({
  concertId: new ObjectId('...'),
  eventType: 'SONG_CHANGED',
  label: 'New song playing',
  payload: {
    songName: 'Example Song',
    artist: 'Example Artist',
  },
  position: 1,
});
```

### 3. Client Connection

Clients can connect via:
- **MQTT (TCP)**: `mqtt://localhost:1883`
- **WebSocket**: `ws://localhost:3001/mqtt`

See `examples/device-client.ts` for a complete example.

## Event Schema

```typescript
interface EventSchema {
  concertId: ObjectId;
  eventType: string;
  label: string;
  payload: Record<string, unknown>;
  position: number;
}
```

## MQTT Topics

- `events/broadcast` - Broadcast events to all clients

## Testing

Run the example client:

```bash
bun run modules/connections/examples/device-client.ts my-client-id
```

## Future Enhancements (Commented Out)

Device-specific topics are available but commented out in the code:
- `events/{deviceId}` - Send events to specific devices

Uncomment in `types.ts` and `publisher.ts` when needed.
