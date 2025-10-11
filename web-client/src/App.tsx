import React, { useEffect, useState } from "react";

import "../styles/globals.css";
import "./index.css";

import {
  StateNavigationPage,
  WithStateNavigation,
} from "./lib/StateNavigationContext";
import NoteLoader from "./pages/NoteLoader";
import Page1 from "./pages/Page1";

type AppStateType = "INITIALIZATION" | "PAGE1";

interface AppState {
  type: AppStateType;
  payload: Record<string, any>;
}

export function App() {
  const [state, setState] = useState<AppState>({
    type: "INITIALIZATION",
    payload: {},
  });

  useEffect(() => {
    setTimeout(() => {
      setState({
        type: "PAGE1",
        payload: {},
      });
    }, 15000); // 15 seconds delay before transitioning to PAGE1 just for demonstration
  }, []);

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

export default App;
