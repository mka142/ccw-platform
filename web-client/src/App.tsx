import React, { useEffect, useState } from "react";

import "../styles/globals.css";
import "./index.css";

import {
  StateNavigationPage,
  WithStateNavigation,
} from "./providers/StateNavigationProvider";
import BeforeConcert from "./pages/BeforeConcertPage";
import AppGuidePage from "./pages/AppGuidePage";
import SliderDemoPage from "./pages/SliderDemoPage";
import ConcertStartPage from "./pages/ConcertStartPage";
import TensionMeasurementPage from "./pages/TensionMeasurementPage";
import PieceAnnouncementPage from "./pages/PieceAnnouncementPage";
import OvationPage from "./pages/OvationPage";
import FeedbackFormPage from "./pages/FeedbackFormPage";
import EndOfConcertPage from "./pages/EndOfConcertPage";
import { LoadingWithBackgroundTransition } from "./components/Loading";

import { useAppState } from "./hooks/useAppState";
import { EventType } from "./config";
import config from "./config";

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
        pageState="APP_GUIDE"
        component={AppGuidePage}
      />
      <StateNavigationPage<EventType>
        pageState="SLIDER_DEMO"
        component={SliderDemoPage}
      />
      <StateNavigationPage<EventType>
        pageState="CONCERT_START"
        component={ConcertStartPage}
      />
      <StateNavigationPage<EventType>
        pageState="PIECE_ANNOUNCEMENT"
        component={PieceAnnouncementPage}
      />
      <StateNavigationPage<EventType>
        pageState="TENSION_MEASUREMENT"
        component={TensionMeasurementPage}
      />
      <StateNavigationPage<EventType>
        pageState="OVATION"
        component={OvationPage}
      />
      <StateNavigationPage<EventType>
        pageState="FEEDBACK_FORM"
        component={FeedbackFormPage}
      />
      <StateNavigationPage<EventType>
        pageState="END_OF_CONCERT"
        component={EndOfConcertPage}
      />
    </WithStateNavigation>
  );
}

export default App;
