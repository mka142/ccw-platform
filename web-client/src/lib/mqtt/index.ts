/**
 * MQTT Client Module
 * Provides low-level MQTT over WebSocket functionality
 */

export { MqttClient, mqttClient } from "./MqttClient";

export type {
  MqttClientConfig,
  MqttMessage,
  MessageHandler,
  ConnectionStatusHandler,
  ErrorHandler,
} from "./MqttClient";

export type {
  EventSchema,
  ConnectionStatus,
  DeviceManagerConfig,
} from "./types";
