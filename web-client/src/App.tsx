import React, { useEffect, useState } from "react";

import "../styles/globals.css";
import "./index.css";

import {
  StateNavigationPage,
  WithStateNavigation,
} from "./lib/StateNavigationContext";
import NoteLoader from "./pages/NoteLoader";
import Page1 from "./pages/Page1";
import TensionRecorderPage from "./pages/TensionRecorderPage";
import { LoadingWithBackgroundTransition } from "./components/Loading";

import { useAppState } from "./hooks/useAppState";
import type { AppStateType } from "./hooks/useAppState";
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
    <WithStateNavigation<AppStateType>
      state={state.type}
      stateHash={state.changeId}
    >
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
