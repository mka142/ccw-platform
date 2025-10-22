/**
 * Example Device Client
 * 
 * This example shows how to connect a device (ESP32, Raspberry Pi, browser, etc.)
 * to the MQTT broker and receive EventSchema messages.
 * 
 * Usage:
 * - For Node.js/Bun: bun run modules/connections/examples/device-client.ts
 * - For browser: See device-client-browser.html
 */

import mqtt from 'mqtt';

import { MQTT_TOPICS } from '../types';

import type { EventSchema } from '../types';

class DeviceClient {
  private client: mqtt.MqttClient | null = null;

  private readonly clientId: string;

  constructor(clientId?: string) {
    this.clientId = clientId ?? `client-${Math.random().toString(36).slice(2, 8)}`;
  }

  connect(brokerUrl: string = 'mqtt://localhost:1883') {
    console.log(`🔌 Connecting ${this.clientId} to ${brokerUrl}...`);

    // Connect via MQTT (for native clients)
    // For WebSocket from browser, use: ws://localhost:3001/mqtt
    this.client = mqtt.connect(brokerUrl, {
      clientId: this.clientId,
      clean: false, // Persistent session
      reconnectPeriod: 5000,
      keepalive: 60,
    });

    this.client.on('connect', () => {
      console.log(`✅ ${this.clientId} connected`);

      // Subscribe to broadcast events
      this.client?.subscribe(MQTT_TOPICS.EVENTS_BROADCAST, { qos: 1 });

      console.log(`📥 Subscribed to: ${MQTT_TOPICS.EVENTS_BROADCAST}`);
    });

    this.client.on('message', (topic, message) => {
      try {
        const event: EventSchema = JSON.parse(message.toString());
        console.log(`\n📨 Received event from ${topic}:`);
        console.log(`   Type: ${event.eventType}`);
        console.log(`   Label: ${event.label}`);
        console.log(`   Concert ID: ${event.concertId}`);
        console.log(`   Position: ${event.position}`);
        console.log(`   Payload:`, event.payload);

        this.handleEvent(event);
      } catch (error) {
        console.error('❌ Error parsing event:', error);
      }
    });

    this.client.on('error', (err) => {
      console.error('❌ Connection error:', err.message);
    });

    this.client.on('offline', () => {
      console.warn('⚠️ Client offline');
    });

    this.client.on('reconnect', () => {
      console.log('🔄 Reconnecting...');
    });
  }

  handleEvent(event: EventSchema) {
    // TODO: Implement your event handling logic here
    // Examples:
    // - Update LED colors based on event.payload
    // - Play sounds
    // - Update display
    // - etc.

    console.log(`🎯 Processing event: ${event.eventType}`);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('👋 Disconnected');
    }
  }
}

// Example usage
if (import.meta.main) {
  const clientId = process.argv[2];
  const client = new DeviceClient(clientId);

  // Connect to the broker
  // For WebSocket connection (browser), use: ws://localhost:3001/mqtt
  client.connect('mqtt://localhost:1883');

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n📴 Shutting down...');
    client.disconnect();
    process.exit(0);
  });
}

export default DeviceClient;
