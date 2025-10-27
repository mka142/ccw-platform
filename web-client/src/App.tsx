import React, { useEffect, useState } from "react";

import "../styles/globals.css";
import "./index.css";

import {
  StateNavigationPage,
  WithStateNavigation,
} from "./providers/StateNavigationProvider";
import NoteLoader from "./pages/NoteLoader";
import TensionRecorderPage from "./pages/TensionRecorderPage";
import { LoadingWithBackgroundTransition } from "./components/Loading";

import { useAppState } from "./hooks/useAppState";
import { EventType } from "./config";
import PieceAnnouncementPage from "./pages/PieceAnnouncementPage";
import config from "./config";

export function App() {
  const { state, connectionStatus, userId } = useAppState();
  const [loadingState, setLoadingState] = useState({
    shouldBeginTransition: false,
    transitionFinished: false,
  });

  useEffect(() => {
    if (connectionStatus === "connected" && userId) {
      setLoadingState((prev) => ({ ...prev, shouldBeginTransition: true }));
    }
  }, [connectionStatus, userId]);

  if (
    connectionStatus !== "connected" ||
    !userId ||
    !loadingState.transitionFinished
  ) {
    return (
      <LoadingWithBackgroundTransition
        finishBackgroundColor={
          config.constants.pagesBackgroundColor[state.type]
        }
        shouldTransitionBegin={loadingState.shouldBeginTransition}
        setTransitionFinished={(finished) =>
          setLoadingState((prev) => ({ ...prev, transitionFinished: finished }))
        }
      />
    );
  }

  return (
    <WithStateNavigation
      state={state}
      stateHash={state.changeId}
    >
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
