import { useEffect, useState } from "react";

import { useDeviceManager } from "@/lib/DeviceManagerClient";
import { useAutoConnect } from "@/hooks/useAutoConnect";
import { AppState } from "@/providers/StateNavigationProvider";

import { EventSchema } from "@/lib/mqtt";
import config, { EVENT_TYPES, EventType } from "@/config";
import { randomId } from "@/lib/utils";

const EVENT_INVALIDATION_INTERVAL_MS = 30000; // 30 seconds

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

const isEventDifferent = (
  eventA: EventSchema<EventType> | null,
  eventB: EventSchema<EventType> | null
): boolean => {
  if (eventA === null || eventB === null) return true;
  // validate payloads and type
  return (
    eventA.eventType !== eventB.eventType ||
    JSON.stringify(eventA.payload) !== JSON.stringify(eventB.payload)
  );
};

const useWindowActivation = (onActivate: () => void) => {
  useEffect(() => {
    // Define the handler for window activation events
    const handleActivation = () => {
      if (typeof onActivate === "function") {
        onActivate();
      }
    };

    // Attach event listeners
    window.addEventListener("focus", handleActivation);
    window.addEventListener("load", handleActivation);
    window.addEventListener("pageshow", handleActivation); // Triggered on back/forward navigation

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener("focus", handleActivation);
      window.removeEventListener("load", handleActivation);
      window.removeEventListener("pageshow", handleActivation);
    };
  }, [onActivate]); // Re-run effect if onActivate changes
};

export const useAppState = () => {
  const { fetcher: fetchCurrentEvent } = useFetchCurrentEvent();
  const { latestEvent, connectionStatus, disconnect } =
    useDeviceManager<EventSchema<EventType>>();

  const [state, setState] = useState<AppState | null>(null);
  const [rawState, setRawState] = useState<{
    event: EventSchema<EventType>;
    changeId: string;
    timestamp: number;
  } | null>(null);

  const userId = useAutoConnect({
    brokerUrl: config.mqtt.brokerUrl,
    topics: [config.mqtt.topics.EVENTS_BROADCAST],
  });

  const onSetState = ({
    latestEvent,
    stateHash,
    timestamp,
  }: {
    latestEvent: EventSchema<EventType>;
    stateHash: string;
    timestamp: number;
  }) => {
    if (rawState && !isEventDifferent(rawState.event, latestEvent)) {
      return;
    }
    setRawState({
      event: latestEvent,
      changeId: stateHash,
      timestamp: timestamp,
    });
    setState({
      type: latestEvent.eventType,
      payload: latestEvent.payload,
      stateHash: stateHash,
    });
  };

  const setupStateManually = () => {
    // Manually trigger state setup when window is activated
    fetchCurrentEvent()
      .then((event) => {
        onSetState({
          latestEvent: event,
          stateHash: randomId(),
          timestamp: Date.now(),
        });
      })
      .catch((err) => {
        console.error("Failed to fetch current event:", err);
      });
  };

  useWindowActivation(() => {
    setupStateManually();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setupStateManually();
    }, EVENT_INVALIDATION_INTERVAL_MS);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  useEffect(() => {
    if (connectionStatus === "connected" && latestEvent) {
      const isNotLatest =
        rawState && latestEvent.timestamp <= rawState.timestamp;
      if (isNotLatest) {
        return;
      }
      onSetState({
        latestEvent: latestEvent.event,
        stateHash: latestEvent.changeId,
        timestamp: latestEvent.timestamp,
      });
    } else {
      // fetch from server
      setupStateManually();
    }
  }, [latestEvent?.changeId, connectionStatus]);

  return { state, connectionStatus, userId };
};
