import { useEffect } from "react";
import { useUserId } from "@/providers/UserProvider";
import { useDeviceManager } from "@/lib/DeviceManagerClient";

interface AutoConnectConfig {
  brokerUrl?: string;
  topics?: string[];
}

/**
 * Hook to auto-connect to Device Manager when userId is ready
 *
 * @example
 * ```tsx
 * function App() {
 *   useAutoConnect();  // Uses config defaults
 *
 *   // Or with custom config
 *   useAutoConnect({
 *     brokerUrl: "ws://localhost:3001/mqtt",
 *     topics: [config.mqtt.topics.EVENTS_BROADCAST]
 *   });
 *
 *   return <div>Your app</div>;
 * }
 * ```
 */
export function useAutoConnect(autoConnectConfig: AutoConnectConfig) {
  const userId = useUserId();
  const { connect } = useDeviceManager();

  // Merge with defaults from config
  const brokerUrl = autoConnectConfig.brokerUrl;
  const topics = autoConnectConfig.topics;

  if (!brokerUrl || !topics) {
    throw new Error(
      "useAutoConnect requires brokerUrl and topics in config or parameters"
    );
  }

  useEffect(() => {
    // Wait for userId before connecting
    if (userId) {
      console.log("🔌 Auto-connecting with userId:", userId);
      connect({
        brokerUrl,
        clientId: userId,
        topics,
      });
    }
  }, [userId, brokerUrl, connect, JSON.stringify(topics)]);
}
