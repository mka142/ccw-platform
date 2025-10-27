import React from "react";

import "../styles/globals.css";
import "./index.css";

import {
  StateNavigationPage,
  WithStateNavigation,
} from "./lib/StateNavigationContext";
import NoteLoader from "./pages/NoteLoader";
import TensionRecorderPage from "./pages/TensionRecorderPage";
import Loading from "./components/Loading";

import { AppState, useAppState } from "./hooks/useAppState";
import { EventType } from "./config";
import PieceAnnouncementPage from "./pages/PieceAnnouncementPage";

export function App() {
  const { state, connectionStatus } = useAppState();

  if (connectionStatus !== "connected") {
    return <Loading />;
  }

  return (
    <WithStateNavigation state={state}>
      <StateNavigationPage<EventType>
        pageState="BEFORE_CONCERT"
        component={NoteLoader}
      />
      <StateNavigationPage<EventType>
        pageState="TENSION_MEASUREMENT"
        component={TensionRecorderPage}
      />
      <StateNavigationPage<EventType>
        pageState="PIECE_ANNOUNCEMENT"
        component={PieceAnnouncementPage}
      />
    </WithStateNavigation>
  );
}

export default App;
