import mqtt from "mqtt";

import type { MqttClient as IMqttClient, IClientOptions } from "mqtt";

export interface MqttClientConfig {
  brokerUrl: string;
  clientId?: string;
  username?: string;
  password?: string;
  reconnectPeriod?: number;
  connectTimeout?: number;
  keepalive?: number;
}

export interface MqttMessage {
  topic: string;
  payload: string;
  timestamp: number;
}

export type MessageHandler = (message: MqttMessage) => void;
export type ConnectionStatusHandler = (connected: boolean) => void;
export type ErrorHandler = (error: Error) => void;

/**
 * MQTT over WebSocket client for browser
 * Handles connection, subscription, and message handling
 */
export class MqttClient {
  private client: IMqttClient | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionStatusHandlers: Set<ConnectionStatusHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private subscribedTopics: Set<string> = new Set();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;

  /**
   * Connect to MQTT broker over WebSocket
   */
  connect(config: MqttClientConfig): void {
    const {
      brokerUrl,
      clientId = `web-client-${Math.random().toString(16).slice(2, 10)}`,
      username,
      password,
      reconnectPeriod = 5000,
      connectTimeout = 30000,
      keepalive = 60,
    } = config;

    const options: IClientOptions = {
      clientId,
      username,
      password,
      clean: true, // Clean session for web clients
      reconnectPeriod,
      connectTimeout,
      keepalive,
      protocol: "ws", // WebSocket protocol
    };

    console.log(`🔌 Connecting to MQTT broker: ${brokerUrl}`);
    this.client = mqtt.connect(brokerUrl, options);

    this.setupEventHandlers();
  }

  /**
   * Setup MQTT client event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on("connect", () => {
      console.log("✅ MQTT Client connected");
      this.reconnectAttempts = 0;
      this.notifyConnectionStatus(true);

      // Resubscribe to topics after reconnection
      this.resubscribeToTopics();
    });

    this.client.on("reconnect", () => {
      this.reconnectAttempts++;
      console.log(
        `🔄 MQTT Client reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
    });

    this.client.on("error", (err) => {
      console.error("❌ MQTT Client error:", err.message);
      this.notifyError(err);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("🔴 Max reconnection attempts reached");
        this.notifyConnectionStatus(false);
      }
    });

    this.client.on("offline", () => {
      console.warn("⚠️ MQTT Client offline");
      this.notifyConnectionStatus(false);
    });

    this.client.on("close", () => {
      console.log("🔌 MQTT Client connection closed");
      this.notifyConnectionStatus(false);
    });

    this.client.on("message", (topic, payload) => {
      const message: MqttMessage = {
        topic,
        payload: payload.toString(),
        timestamp: Date.now(),
      };

      console.log(`📨 Message received on topic "${topic}":`, message.payload);
      this.notifyMessageHandlers(topic, message);
    });
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string, qos: 0 | 1 | 2 = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client?.connected) {
        reject(new Error("MQTT Client not connected"));
        return;
      }

      this.client.subscribe(topic, { qos }, (err) => {
        if (err) {
          console.error(`❌ Failed to subscribe to topic "${topic}":`, err);
          reject(err);
        } else {
          console.log(`✅ Subscribed to topic: ${topic}`);
          this.subscribedTopics.add(topic);
          resolve();
        }
      });
    });
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error("MQTT Client not available"));
        return;
      }

      this.client.unsubscribe(topic, (err) => {
        if (err) {
          console.error(`❌ Failed to unsubscribe from topic "${topic}":`, err);
          reject(err);
        } else {
          console.log(`✅ Unsubscribed from topic: ${topic}`);
          this.subscribedTopics.delete(topic);
          resolve();
        }
      });
    });
  }

  /**
   * Resubscribe to all topics (used after reconnection)
   */
  private resubscribeToTopics(): void {
    const topics = Array.from(this.subscribedTopics);
    if (topics.length === 0) return;

    console.log(`🔄 Resubscribing to ${topics.length} topics...`);
    topics.forEach((topic) => {
      this.subscribe(topic).catch((err) => {
        console.error(`Failed to resubscribe to ${topic}:`, err);
      });
    });
  }

  /**
   * Publish a message to a topic
   */
  publish(topic: string, payload: string, qos: 0 | 1 | 2 = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client?.connected) {
        reject(new Error("MQTT Client not connected"));
        return;
      }

      this.client.publish(topic, payload, { qos }, (err) => {
        if (err) {
          console.error(`❌ Failed to publish to topic "${topic}":`, err);
          reject(err);
        } else {
          console.log(`📤 Published to topic "${topic}"`);
          resolve();
        }
      });
    });
  }

  /**
   * Add a message handler for a specific topic pattern
   */
  onMessage(topicPattern: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(topicPattern)) {
      this.messageHandlers.set(topicPattern, new Set());
    }

    this.messageHandlers.get(topicPattern)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(topicPattern);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(topicPattern);
        }
      }
    };
  }

  /**
   * Add a connection status handler
   */
  onConnectionStatus(handler: ConnectionStatusHandler): () => void {
    this.connectionStatusHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.connectionStatusHandlers.delete(handler);
    };
  }

  /**
   * Add an error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  /**
   * Notify message handlers for a topic
   */
  private notifyMessageHandlers(topic: string, message: MqttMessage): void {
    this.messageHandlers.forEach((handlers, pattern) => {
      if (this.topicMatches(topic, pattern)) {
        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (err) {
            console.error("Error in message handler:", err);
          }
        });
      }
    });
  }

  /**
   * Notify connection status handlers
   */
  private notifyConnectionStatus(connected: boolean): void {
    this.connectionStatusHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (err) {
        console.error("Error in connection status handler:", err);
      }
    });
  }

  /**
   * Notify error handlers
   */
  private notifyError(error: Error): void {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch (err) {
        console.error("Error in error handler:", err);
      }
    });
  }

  /**
   * Check if a topic matches a pattern (supports MQTT wildcards)
   */
  private topicMatches(topic: string, pattern: string): boolean {
    // Exact match
    if (topic === pattern) return true;

    // Convert MQTT wildcard pattern to regex
    // + matches a single level
    // # matches multiple levels
    const regexPattern = pattern
      .replace(/\+/g, "[^/]+")
      .replace(/#/g, ".*")
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(topic);
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      console.log("👋 MQTT Client disconnected");
    }

    this.subscribedTopics.clear();
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * Get connection state
   */
  getConnectionState():
    | "connected"
    | "disconnected"
    | "reconnecting"
    | "offline" {
    if (!this.client) return "disconnected";
    if (this.client.connected) return "connected";
    if (this.client.reconnecting) return "reconnecting";
    return "offline";
  }
}

// Export singleton instance
export const mqttClient = new MqttClient();
