import React, { useEffect, useState } from "react";

import "../styles/globals.css";
import "./index.css";

import {
  StateNavigationPage,
  WithStateNavigation,
} from "./lib/StateNavigationContext";
import NoteLoader from "./pages/NoteLoader";
import Page1 from "./pages/Page1";
import { useDeviceManager } from "./lib/DeviceManagerClient";
import { useAutoConnect } from "./hooks/useAutoConnect";
import Loading from "./components/Loading";
import { EventSchema } from "./lib/mqtt";
import config, { EventType } from "./config";

type AppStateType = "INITIALIZATION" | "PAGE1";

interface AppState {
  type: AppStateType;
  payload: Record<string, any>;
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

const useAppState = () => {
  const { fetcher: fetchCurrentEvent } = useFetchCurrentEvent();
  const { latestEvent, connectionStatus, disconnect } =
    useDeviceManager<EventSchema<EventType>>();

  const [state, setState] = useState<AppState>({
    type: "INITIALIZATION",
    payload: {},
  });

  useAutoConnect({
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
        type: latestEvent.eventType,
        payload: latestEvent.payload,
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
  }, [latestEvent?.eventType, connectionStatus]);

  return { state, connectionStatus };
};

export function App() {
  const { state, connectionStatus } = useAppState();
  if (connectionStatus !== "connected") {
    return <Loading />;
  }

  return (
    <WithStateNavigation<AppStateType> state={state.type}>
      <StateNavigationPage<AppStateType>
        pageState="INITIALIZATION"
        component={NoteLoader}
      />
      <StateNavigationPage<AppStateType> pageState="PAGE1" component={Page1} />
    </WithStateNavigation>
  );
}

// export function App() {
//   return <DeviceManagerExampleWithAutoConnect />;
// }

export default App;
