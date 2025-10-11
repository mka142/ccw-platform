import express from "express";
import type { Request, Response } from "express";
import { loadDB, saveDB, updateDeviceStatus, generateNewUser, getActiveConcertOrNull, getUserForIdOrNull } from "./dbUtils";
import path from "path";
import bodyParser from "body-parser";
import http from "http";
import { wssServerSetup, wsClients } from "./wsUtils";
import adminRoutes from "./adminRoutes";

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Register admin panel routes
app.use("/", adminRoutes);

const server = http.createServer(app);
const wss = wssServerSetup(server);

// Serve test IoT client page
app.get("/test-iot", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "test-iot.html"));
});

// AJAX endpoint for admin panel polling
app.get("/api/concert-devices/:concertId", (req: Request, res: Response) => {
  const concertId = req.params.concertId;
  const db = loadDB();
  const devices = (db.users || [])
    .filter((u) => u.concert_id === concertId)
    .map((u) => ({
      id: u.id,
      device_type: u.device_type,
      concert_id: u.concert_id,
      is_active: !!u.is_active,
      last_ping: u.last_ping || null,
      created_at: u.created_at,
    }));
  res.json({ devices });
});

// API: IoT user initialization
app.post("/api/iot-init", (req: Request, res: Response) => {
  const { device_type } = req.body;
  const db = loadDB();
  const activeConcert = getActiveConcertOrNull();
  if (!activeConcert) {
    res.json({ ok: false, message: "Brak aktywnego koncertu" });
    return;
  }
  // Generate new user
  let users = db.users || [];
  const user = generateNewUser(activeConcert, device_type);
  users.push(user);
  db.users = users;
  saveDB(db);
  res.json({ ok: true, user });
});

// --- WebSocket connection logic for IoT/devices with ping/pong heartbeat ---
type AliveWebSocket = import("ws").WebSocket & {
  isAlive?: boolean;
  userId?: string;
};

wss.on("connection", (ws: AliveWebSocket, req) => {
  ws.isAlive = true;
  ws.userId = "";

  ws.on("pong", () => {
    ws.isAlive = true;
    if (ws.userId) updateDeviceStatus(ws.userId, true);
  });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      const isUserIdValid = typeof data.userId === "string";
      if (data.type === "init" && isUserIdValid) {
        ws.userId = data.userId as string;
        // Check user
        const user = getUserForIdOrNull(ws.userId);
        if (!user) {
          ws.send(JSON.stringify({ type: "error", message: "Unknown user" }));
          ws.close();
          return;
        }
        if (ws.userId) wsClients.set(ws.userId, ws);
        // Send current event if active
        const db = loadDB();
        const concert = db.concerts.find(
          (c) => c.id === user.concert_id && c.is_active
        );
        if (concert && concert.active_event_id) {
          const event = db.events.find((e) => e.id === concert.active_event_id);
          if (event) {
            ws.send(JSON.stringify({ type: "event", event }));
          }
        }
        // Mark device as active
        if (ws.userId) updateDeviceStatus(ws.userId, true);
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
    }
  });

  ws.on("close", () => {
    if (ws.userId) {
      if (ws.userId) {
        wsClients.delete(ws.userId);
        updateDeviceStatus(ws.userId, false);
      }
    }
  });
});

setInterval(() => {
  console.log("Checking WebSocket clients...");
  // get users for active concert
  const activeConcert = getActiveConcertOrNull();
  const db = loadDB();
  const users = (db.users || []).filter(
    (u) => u.concert_id === activeConcert?.id
  );
  users.forEach((user) => {
    const ws = wsClients.get(user.id) as AliveWebSocket | undefined;
    if (!ws) {
      updateDeviceStatus(user.id, false);
      console.log(`Client ${user.id} not found, marking as inactive`);
      return;
    }
    if (ws.readyState !== ws.OPEN) {
      console.log(`Client ${user.id} not open, marking as inactive`);
      updateDeviceStatus(user.id, false);
      wsClients.delete(user.id);
      return;
    }

    if (ws.isAlive === false) {
      if (ws.userId) updateDeviceStatus(ws.userId, false);
      try {
        ws.terminate();
      } catch (e) {
        console.error(`Error terminating WebSocket for user ${user.id})`);
      }
      wsClients.delete(user.id);
      return;
    }

    // Mark as inactive if ping fails
    ws.isAlive = false;
    try {
      ws.ping();
    } catch (e) {
      // Ignore ping errors (client may disconnect)
    }
  });
}, 5000);

// Start HTTP + WebSocket server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Admin panel + WebSocket running at http://localhost:${PORT}`);
});
