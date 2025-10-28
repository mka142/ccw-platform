/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { App } from "./App";
import { UserProvider } from "./providers/UserProvider";
import { DeviceManagerProvider } from "./lib/DeviceManagerClient";
import { EventSchema } from "./lib/mqtt";
import { EventType } from "./config";
import NoZoomWrapper from "./components/NoZoomWrapper";
import IosOnlySafari from "./lib/IosOnlySafari";

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <IosOnlySafari>
      <UserProvider>
        <DeviceManagerProvider<EventSchema<EventType>> maxHistorySize={100}>
          {/* <MobileContainer> */}
          <NoZoomWrapper includeDoubleTap={true} includePinch={true}>
            {/* <div className="fixed w-full h-full touch-none select-none overflow-hidden"> */}
              <App />
            {/* </div> */}
          </NoZoomWrapper>
          {/* </MobileContainer> */}
        </DeviceManagerProvider>
      </UserProvider>
    </IosOnlySafari>
  </StrictMode>
);

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}
