import React, { useEffect, useState } from "react";

import "../styles/globals.css";
import "./index.css";

import {
  StateNavigationPage,
  WithStateNavigation,
} from "./lib/StateNavigationContext";
import NoteLoader from "./pages/NoteLoader";
import Page1 from "./pages/Page1";

export function App() {
  const [state, setState] = useState({
    type: "INITIALIZATION",
    payload: {},
  });

  useEffect(() => {
    setTimeout(() => {
      setState({
        type: "PAGE1",
        payload: {},
      });
    }, 15000); // 15 seconds delay before transitioning to PAGE1
  }, []);

  return (
    <WithStateNavigation state={state.type}>
      <StateNavigationPage pageState="INITIALIZATION" component={NoteLoader} />
      <StateNavigationPage pageState="PAGE1" component={Page1} />
    </WithStateNavigation>
  );
}

export default App;
