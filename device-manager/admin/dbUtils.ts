import fs from "fs";
import path from "path";
import type { User, Concert, Event, DB, deviceType } from "./types";

const DB_PATH = path.join(__dirname, "db.json");

export function loadDB(): DB {
  if (!fs.existsSync(DB_PATH)) return { concerts: [], events: [], users: [] };
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

export function saveDB(db: DB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getUsers(): User[] {
  const db = loadDB();
  return db.users || [];
}

// Helper: update device status in DB
export function updateDeviceStatus(userId: string, isActive: boolean) {
  const db = loadDB();
  const user = (db.users || []).find((u) => u.id === userId);
  if (user) {
    user.is_active = isActive;
    user.last_ping = Date.now();
    saveDB(db);
  }
}

export function generateNewUser(activeConcert: Concert, device_type: deviceType): User {
  const id = "user-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
  const user: User = {
    id,
    concert_id: activeConcert.id,
    device_type,
    created_at: Date.now(),
    is_active: true,
    last_ping: Date.now(),
  };
  return user;
}
export function getActiveConcertOrNull(): Concert | null {
  const db = loadDB();
  const activeConcert = db.concerts.find((c) => c.is_active);
  return activeConcert || null;
}

export function getUserForIdOrNull(userId: string): User | null {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  return user || null;
}