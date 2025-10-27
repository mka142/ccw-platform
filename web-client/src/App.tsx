import React, { useEffect, useState } from "react";

import "../styles/globals.css";
import "./index.css";

import {
  StateNavigationPage,
  WithStateNavigation,
} from "./providers/StateNavigationProvider";
import BeforeConcert from "./pages/BeforeConcertPage";
import TensionMeasurementPage from "./pages/TensionMeasurementPage";
import { LoadingWithBackgroundTransition } from "./components/Loading";

import { useAppState } from "./hooks/useAppState";
import { EventType } from "./config";
import PieceAnnouncementPage from "./pages/PieceAnnouncementPage";
import config from "./config";
import SliderDemoPage from "./pages/SliderDemoPage";

export function App() {
  const { state, connectionStatus, userId } = useAppState();
  const [loadingState, setLoadingState] = useState({
    shouldBeginTransition: false,
    transitionFinished: false,
  });

  const isLoading =
    connectionStatus !== "connected" ||
    !userId ||
    !loadingState.transitionFinished;

  useEffect(() => {
    if (connectionStatus === "connected" && userId) {
      setLoadingState((prev) => ({ ...prev, shouldBeginTransition: true }));
    }
  }, [connectionStatus, userId]);

  if (isLoading) {
    return (
      <LoadingWithBackgroundTransition
        finishBackgroundColor={
          state ? config.constants.pagesBackgroundColor[state.type] : "#000000"
        }
        shouldTransitionBegin={loadingState.shouldBeginTransition}
        setTransitionFinished={(finished) =>
          setLoadingState((prev) => ({ ...prev, transitionFinished: finished }))
        }
      />
    );
  }

  return (
    <WithStateNavigation state={state}>
      <StateNavigationPage<EventType>
        pageState="BEFORE_CONCERT"
        component={BeforeConcert}
      />
      <StateNavigationPage<EventType>
        pageState="SLIDER_DEMO"
        component={SliderDemoPage}
      />
      <StateNavigationPage<EventType>
        pageState="PIECE_ANNOUNCEMENT"
        component={PieceAnnouncementPage}
      />
      <StateNavigationPage<EventType>
        pageState="TENSION_MEASUREMENT"
        component={TensionMeasurementPage}
      />
    </WithStateNavigation>
  );
}

export default App;
