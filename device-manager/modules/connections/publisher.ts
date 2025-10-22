import mqtt from "mqtt";

import { getServerCredentials, SERVER_CLIENT_ID } from "./auth";
import { MQTT_TOPICS } from "./types";

import type { EventSchema } from "./types";

class MqttPublisher {
  private client: mqtt.MqttClient | null = null;

  private reconnectAttempts = 0;

  private readonly maxReconnectAttempts = 10;

  connect(brokerUrl: string = "mqtt://localhost:1883") {
    const { username, password } = getServerCredentials();

    this.client = mqtt.connect(brokerUrl, {
      clientId: SERVER_CLIENT_ID,
      username,
      password,
      clean: false, // Persistent session
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      keepalive: 60,
    });

    this.client.on("connect", () => {
      console.log("✅ MQTT Publisher connected to broker");
      this.reconnectAttempts = 0;
    });

    this.client.on("reconnect", () => {
      this.reconnectAttempts++;
      console.log(`🔄 Publisher reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    });

    this.client.on("error", (err) => {
      console.error("❌ MQTT Publisher error:", err.message);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("🔴 Max reconnection attempts reached.");
      }
    });

    this.client.on("offline", () => {
      console.warn("⚠️ MQTT Publisher offline");
    });

    return this.client;
  }

  /**
   * Broadcast an event to all connected clients
   */
  async broadcastEvent(event: EventSchema): Promise<void> {
    if (!this.client?.connected) {
      throw new Error("MQTT Publisher not connected");
    }

    const topic = MQTT_TOPICS.EVENTS_BROADCAST;
    const payload = JSON.stringify(event);

    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error("Client disconnected"));
        return;
      }

      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error("Failed to broadcast event:", err);
          reject(err);
        } else {
          console.log(`📢 Event broadcast: ${event.eventType} (${event.label})`);
          resolve();
        }
      });
    });
  }

  // Device-specific send (commented out for now)
  // async sendEventToDevice(deviceId: string, event: EventSchema): Promise<void> {
  //   if (!this.client?.connected) {
  //     throw new Error('MQTT Publisher not connected');
  //   }
  //
  //   const topic = MQTT_TOPICS.DEVICE_EVENTS(deviceId);
  //   const payload = JSON.stringify(event);
  //
  //   return new Promise((resolve, reject) => {
  //     this.client!.publish(topic, payload, { qos: 1 }, (err) => {
  //       if (err) {
  //         console.error(`Failed to send event to ${deviceId}:`, err);
  //         reject(err);
  //       } else {
  //         console.log(`✅ Event sent to ${deviceId}: ${event.eventType}`);
  //         resolve();
  //       }
  //     });
  //   });
  // }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      console.log("👋 MQTT Publisher disconnected");
    }
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

export const mqttPublisher = new MqttPublisher();
