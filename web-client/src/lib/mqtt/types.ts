/**
 * Event schema matching the device-manager Event type
 */
export interface EventSchema<T> {
  concertId: string;
  eventType: T;
  label: string;
  payload: Record<string, any>;
  position: number;
}

/**
 * Connection status
 */
export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "offline";

/**
 * Device Manager client configuration
 */
export interface DeviceManagerConfig {
  /**
   * WebSocket URL of the MQTT broker
   * @example "ws://localhost:3001/mqtt"
   */
  brokerUrl: string;

  /**
   * Optional client ID (auto-generated if not provided)
   */
  clientId?: string;

  /**
   * Optional username for authentication
   */
  username?: string;

  /**
   * Optional password for authentication
   */
  password?: string;

  /**
   * Topics to subscribe to
   * @default []
   */
  topics?: string[];
}
