// --- USERS & WEBSOCKET ---
export type deviceType = "Web" | "M5Dial";
export interface User {
  id: string;
  concert_id: string;
  device_type: deviceType;
  created_at: number;
  is_active?: boolean;
  last_ping?: number;
}
export interface Concert {
  id: string;
  name: string;
  metadata: string;
  is_active: boolean;
  active_event_id: string | null;
}

export interface Event {
  id: string;
  concert_id: string;
  event_type: string;
  label: string;
  payload: string;
  position: number;
}
export interface DB {
  concerts: Concert[];
  events: Event[];
  users?: User[];
}
