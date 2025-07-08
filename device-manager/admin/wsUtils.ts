import http from "http";
import { WebSocket, WebSocketServer } from "ws";

import { getUsers } from "./dbUtils";
import type { Event } from "./types";

export const wsClients = new Map<string, WebSocket>();

export function wssServerSetup(server: http.Server) {
  const wss = new WebSocketServer({ server });
  return wss;
}

export function broadcastEvent(concert_id: string, event: Event) {
  const users = getUsers().filter((u) => u.concert_id === concert_id);
  for (const user of users) {
    const ws = wsClients.get(user.id);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "event", event }));
    }
  }
}
