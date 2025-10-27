import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import { mqttClient } from "./mqtt/MqttClient";

import type { ReactNode } from "react";
import type { MqttMessage } from "./mqtt/MqttClient";
import type {
  ConnectionStatus,
  DeviceManagerConfig,
  EventSchema,
} from "./mqtt/types";

interface DeviceManagerContextValue<T = any> {
  /** Current connection status */
  connectionStatus: ConnectionStatus;

  /** Latest event received from the device manager */
  latestEvent: { event: T; changeId: string } | null;

  /** All events received in this session */
  eventHistory: { event: T; changeId: string }[];

  /** Connect to the device manager */
  connect: (config: DeviceManagerConfig) => void;

  /** Disconnect from the device manager */
  disconnect: () => void;

  /** Subscribe to additional topics */
  subscribe: (topic: string) => Promise<void>;

  /** Unsubscribe from topics */
  unsubscribe: (topic: string) => Promise<void>;

  /** Clear event history */
  clearHistory: () => void;

  /** Last error that occurred */
  error: Error | null;
}

const DeviceManagerContext =
  createContext<DeviceManagerContextValue<any> | null>(null);

interface DeviceManagerProviderProps<T = any> {
  children: ReactNode;
  /** Auto-connect on mount with this config */
  autoConnect?: DeviceManagerConfig;
  /** Maximum number of events to keep in history */
  maxHistorySize?: number;
  /** Custom event parser function */
  parseEvent?: (payload: string) => T;
  /** Custom event validator function */
  validateEvent?: (event: T) => boolean;
}

/**
 * Provider component for Device Manager client
 * Manages MQTT connection and event state
 *
 * @example
 * ```tsx
 * // With default EventSchema
 * <DeviceManagerProvider
 *   autoConnect={{
 *     brokerUrl: "ws://localhost:3001/mqtt",
 *     topics: ['topic-1', 'topic-2']
 *   }}
 * >
 *   <App />
 * </DeviceManagerProvider>
 *
 * // With custom event type
 * <DeviceManagerProvider<MyCustomEvent>
 *   parseEvent={(payload) => JSON.parse(payload) as MyCustomEvent}
 *   validateEvent={(event) => !!event.id}
 * >
 *   <App />
 * </DeviceManagerProvider>
 * ```
 */
export function DeviceManagerProvider<T = any>({
  children,
  autoConnect,
  maxHistorySize = 100,
  parseEvent,
  validateEvent,
}: DeviceManagerProviderProps<T>) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [latestEvent, setLatestEvent] = useState<{
    event: T;
    changeId: string;
  } | null>(null);
  const [eventHistory, setEventHistory] = useState<
    { event: T; changeId: string }[]
  >([]);
  const [error, setError] = useState<Error | null>(null);

  const isConnectedRef = useRef(false);

  /**
   * Handle incoming MQTT messages
   */
  const handleMessage = useCallback(
    (message: MqttMessage) => {
      try {
        // Use custom parser or default JSON.parse
        const event: T = parseEvent
          ? parseEvent(message.payload)
          : JSON.parse(message.payload);

        // Use custom validator or skip validation
        if (validateEvent && !validateEvent(event)) {
          console.warn("Invalid event schema:", event);
          return;
        }

        console.log("📨 Event received:", event);
        const eventRandomID = Math.random().toString(36).substring(2, 8);

        // Update latest event
        setLatestEvent({ event, changeId: eventRandomID });

        // Add to history (with size limit)
        setEventHistory((prev) => {
          const newHistory = [{ event, changeId: eventRandomID }, ...prev];
          return newHistory.slice(0, maxHistorySize);
        });
      } catch (err) {
        console.error("Failed to parse event:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to parse event")
        );
      }
    },
    [maxHistorySize, parseEvent, validateEvent]
  );

  /**
   * Handle connection status changes
   */
  const handleConnectionStatus = useCallback((connected: boolean) => {
    const status: ConnectionStatus = connected ? "connected" : "disconnected";
    setConnectionStatus(status);
    isConnectedRef.current = connected;

    if (connected) {
      setError(null);
      console.log("✅ Device Manager connected");
    } else {
      console.log("🔌 Device Manager disconnected");
    }
  }, []);

  /**
   * Handle errors
   */
  const handleError = useCallback((err: Error) => {
    console.error("Device Manager error:", err);
    setError(err);
  }, []);

  /**
   * Connect to device manager
   */
  const connect = useCallback(
    (config: DeviceManagerConfig) => {
      if (isConnectedRef.current) {
        console.warn("Already connected");
        return;
      }

      console.log("🔌 Connecting to Device Manager...");
      setConnectionStatus("reconnecting");

      // Setup handlers
      const unsubscribeMessage = mqttClient.onMessage("#", handleMessage);
      const unsubscribeStatus = mqttClient.onConnectionStatus(
        handleConnectionStatus
      );
      const unsubscribeError = mqttClient.onError(handleError);

      // Connect
      mqttClient.connect({
        brokerUrl: config.brokerUrl,
        clientId: config.clientId,
        username: config.username,
        password: config.password,
      });

      // Subscribe to topics after connection
      const subscribeToTopics = () => {
        const topics = config.topics ?? [];
        topics.forEach((topic) => {
          mqttClient.subscribe(topic).catch((err) => {
            console.error(`Failed to subscribe to ${topic}:`, err);
            setError(err);
          });
        });
      };

      // Wait for connection before subscribing
      const checkConnection = setInterval(() => {
        if (mqttClient.isConnected()) {
          subscribeToTopics();
          clearInterval(checkConnection);
        }
      }, 100);

      // Cleanup after 30 seconds if not connected
      setTimeout(() => {
        clearInterval(checkConnection);
      }, 30000);

      // Store cleanup functions
      return () => {
        unsubscribeMessage();
        unsubscribeStatus();
        unsubscribeError();
      };
    },
    [handleMessage, handleConnectionStatus, handleError]
  );

  /**
   * Disconnect from device manager
   */
  const disconnect = useCallback(() => {
    console.log("👋 Disconnecting from Device Manager...");
    mqttClient.disconnect();
    setConnectionStatus("disconnected");
    isConnectedRef.current = false;
  }, []);

  /**
   * Subscribe to additional topics
   */
  const subscribe = useCallback(async (topic: string) => {
    try {
      await mqttClient.subscribe(topic);
      console.log(`✅ Subscribed to ${topic}`);
    } catch (err) {
      console.error(`Failed to subscribe to ${topic}:`, err);
      throw err;
    }
  }, []);

  /**
   * Unsubscribe from topics
   */
  const unsubscribe = useCallback(async (topic: string) => {
    try {
      await mqttClient.unsubscribe(topic);
      console.log(`✅ Unsubscribed from ${topic}`);
    } catch (err) {
      console.error(`Failed to unsubscribe from ${topic}:`, err);
      throw err;
    }
  }, []);

  /**
   * Clear event history
   */
  const clearHistory = useCallback(() => {
    setEventHistory([]);
    setLatestEvent(null);
  }, []);

  /**
   * Auto-connect on mount if config provided
   */
  useEffect(() => {
    if (autoConnect) {
      connect(autoConnect);
    }

    // Cleanup on unmount
    return () => {
      if (isConnectedRef.current) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect]);

  const value: DeviceManagerContextValue<T> = {
    connectionStatus,
    latestEvent,
    eventHistory,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    clearHistory,
    error,
  };

  return (
    <DeviceManagerContext.Provider value={value}>
      {children}
    </DeviceManagerContext.Provider>
  );
}

/**
 * Hook to access Device Manager client
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { latestEvent, connectionStatus } = useDeviceManager<EventSchema>();
 *
 *   return (
 *     <div>
 *       <p>Status: {connectionStatus}</p>
 *       {latestEvent && (
 *         <p>Latest: {latestEvent.eventType} - {latestEvent.label}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDeviceManager<T = any>(): DeviceManagerContextValue<T> {
  const context = useContext(DeviceManagerContext);

  if (!context) {
    throw new Error(
      "useDeviceManager must be used within a DeviceManagerProvider"
    );
  }

  return context as DeviceManagerContextValue<T>;
}

/**
 * Hook to get connection status
 *
 * @example
 * ```tsx
 * function StatusIndicator() {
 *   const isConnected = useConnectionStatus();
 *   return <div>{isConnected ? "🟢 Connected" : "🔴 Disconnected"}</div>;
 * }
 * ```
 */
export function useConnectionStatus(): boolean {
  const { connectionStatus } = useDeviceManager();
  return connectionStatus === "connected";
}
