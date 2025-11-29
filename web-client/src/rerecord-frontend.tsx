/**
 * This file is the entry point for the Re-Record measurement app.
 * It renders the TensionRecorder component with heartbeat functionality.
 *
 * It is included in `src/rerecord.html`.
 * 
 * Route: /rerecord/:token
 */

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import NoZoomWrapper from "./components/NoZoomWrapper";
import IosOnlySafari from "./lib/IosOnlySafari";
import ReRecordPage from "./pages/ReRecordPage";

import "./styles/globals.css";

/**
 * Extract token from URL path
 * Pattern: /rerecord/:token
 */
function getTokenFromPath(): string | null {
  const path = window.location.pathname;
  const match = path.match(/^\/rerecord\/([a-zA-Z0-9-]+)$/);
  return match ? match[1] : null;
}

const elem = document.getElementById("root")!;
const token = getTokenFromPath();

if (!token) {
  // Show error if no token provided
  elem.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #000;
      color: #fff;
      font-family: system-ui, sans-serif;
      text-align: center;
      padding: 20px;
    ">
      <h1 style="color: #f44336; margin-bottom: 16px;">Błąd</h1>
      <p>Nieprawidłowy link do pomiaru.</p>
      <p style="color: #888; font-size: 14px; margin-top: 8px;">
        Zeskanuj kod QR ze strony nagrywania, aby uzyskać poprawny link.
      </p>
    </div>
  `;
} else {
  const app = (
    <StrictMode>
      <IosOnlySafari>
        <NoZoomWrapper includeDoubleTap={true} includePinch={true}>
          <ReRecordPage token={token} />
        </NoZoomWrapper>
      </IosOnlySafari>
    </StrictMode>
  );

  if (import.meta.hot) {
    const root = (import.meta.hot.data.root ??= createRoot(elem));
    root.render(app);
  } else {
    createRoot(elem).render(app);
  }
}

