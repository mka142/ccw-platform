import { useEffect, useState } from "react";

import { useDeviceManager } from "@/lib/DeviceManagerClient";
import { useAutoConnect } from "@/hooks/useAutoConnect";
import { AppState } from "@/providers/StateNavigationProvider";

import { EventSchema } from "@/lib/mqtt";
import config, { EVENT_TYPES, EventType } from "@/config";

export function isAppState(state: any): state is AppState {
  return (
    typeof state === "object" &&
    state !== null &&
    typeof state.type === "string" &&
    typeof state.payload === "object" &&
    state.payload !== null &&
    EVENT_TYPES.includes(state.type as EventType)
  );
}

const useFetchCurrentEvent = () => {
  // Fetch the current event from the server
  const fetcher = async () => {
    const response = await fetch(config.api.concert.currentEvent);
    if (!response.ok) {
      throw new Error("Failed to fetch current event");
    }
    const res = await response.json();
    return res.data as EventSchema<EventType>;
  };
  return { fetcher };
};

export const useAppState = () => {
  const { fetcher: fetchCurrentEvent } = useFetchCurrentEvent();
  const { latestEvent, connectionStatus, disconnect } =
    useDeviceManager<EventSchema<EventType>>();

  const [state, setState] = useState<AppState | null>(null);

  const userId = useAutoConnect({
    brokerUrl: config.mqtt.brokerUrl,
    topics: [config.mqtt.topics.EVENTS_BROADCAST],
  });

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  useEffect(() => {
    if (connectionStatus === "connected" && latestEvent) {
      setState({
        type: latestEvent.event.eventType,
        payload: latestEvent.event.payload,
        changeId: latestEvent.changeId,
      });
    } else if (connectionStatus === "connected") {
      //No latest event, fetch from server
      fetchCurrentEvent()
        .then((event) => {
          setState({
            type: event.eventType,
            payload: event.payload,
          });
        })
        .catch((err) => {
          console.error("Failed to fetch current event:", err);
        });
    }
  }, [latestEvent?.changeId, connectionStatus]);

  return { state, connectionStatus, userId };
};
