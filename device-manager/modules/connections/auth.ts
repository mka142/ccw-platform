import { config } from '@/config';

import type { AuthenticateError, Client, PublishPacket, Subscription } from 'aedes';

// Simple fixed credentials for server publisher
export const SERVER_USERNAME = config.mqtt.serverUsername;
export const SERVER_PASSWORD = config.mqtt.serverPassword;
export const SERVER_CLIENT_ID = config.mqtt.serverClientId;

/**
 * Simple authentication for MQTT broker
 * Only validates server publisher credentials
 */
export function authenticateMqttClient(
  client: Client,
  username: string | undefined,
  password: Buffer | undefined,
  callback: (error: AuthenticateError | null, success: boolean) => void
): void {
  // Allow server publisher with correct credentials
  if (username === SERVER_USERNAME) {
    const passwordStr = password?.toString();
    
    if (passwordStr === SERVER_PASSWORD) {
      console.log(`✅ Server publisher authenticated: ${client.id}`);
      return callback(null, true);
    } else {
      console.log(`❌ Invalid server password for ${client.id}`);
      const error = new Error('Invalid server credentials') as AuthenticateError;
      error.returnCode = 4; // Bad username or password
      return callback(error, false);
    }
  }

  // For now, allow all other clients to connect (viewer-only)
  // They can subscribe but cannot publish to events/broadcast
  console.log(`✅ Client connected (viewer): ${client.id}`);
  callback(null, true);
}

/**
 * Authorization for publishing messages
 * Only server publisher can publish to events/broadcast
 */
export function authorizePublish(
  client: Client | null,
  packet: PublishPacket,
  callback: (error?: Error | null) => void
): void {
  if (!client) {
    return callback(new Error('Client not found'));
  }

  const topic = packet.topic;

  // Only allow server to publish to events/broadcast
  if (topic === 'events/broadcast') {
    // Check if this is the authenticated server publisher
    if (client.id.startsWith('server-publisher-')) {
      console.log(`✅ Server publish to ${topic}`);
      return callback(null);
    } else {
      console.log(`❌ Unauthorized publish attempt to ${topic} by ${client.id}`);
      return callback(new Error('Only server can publish to events/broadcast'));
    }
  }

  // Allow other topics (for future device status updates)
  callback(null);
}

/**
 * Authorization for subscribing to topics
 * Everyone can subscribe to events/broadcast
 */
export function authorizeSubscribe(
  client: Client | null,
  subscription: Subscription,
  callback: (error: Error | null, subscription?: Subscription) => void
): void {
  if (!client) {
    return callback(new Error('Client not found'));
  }

  const topic = subscription.topic;

  // Allow everyone to subscribe to broadcast events
  if (topic === 'events/broadcast') {
    console.log(`✅ Client ${client.id} subscribed to broadcast`);
    return callback(null, subscription);
  }

  // Allow other subscriptions (for future features)
  console.log(`✅ Client ${client.id} subscribed to ${topic}`);
  callback(null, subscription);
}

/**
 * Get server credentials for publisher connection
 */
export function getServerCredentials() {
  return {
    username: SERVER_USERNAME,
    password: SERVER_PASSWORD,
  };
}
