import React from "react";

import "../styles/globals.css";
import "./index.css";

import {
  StateNavigationPage,
  WithStateNavigation,
} from "./lib/StateNavigationContext";
import NoteLoader from "./pages/NoteLoader";
import Page1 from "./pages/Page1";
import TensionRecorderPage from "./pages/TensionRecorderPage";
import Loading from "./components/Loading";

import { useAppState } from "./hooks/useAppState";
import type { AppStateType } from "./hooks/useAppState";

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
      <StateNavigationPage<AppStateType>
        pageState="TENSION_RECORDER"
        component={TensionRecorderPage}
      />
    </WithStateNavigation>
  );
}

export default App;
