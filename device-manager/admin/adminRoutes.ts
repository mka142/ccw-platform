import { Router } from "express";
import type { Request, Response } from "express";
import { loadDB, saveDB } from "./dbUtils";
import { broadcastEvent } from "./wsUtils";

const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const db = loadDB();
  res.render("index", { concerts: db.concerts });
});

router.get("/concerts/new", (req: Request, res: Response) => {
  res.render("concert_new");
});

router.post("/concerts", (req: Request, res: Response) => {
  const db = loadDB();
  const { name, metadata } = req.body;
  const id = Date.now().toString();
  db.concerts.push({
    id,
    name,
    metadata: metadata || "{}",
    is_active: false,
    active_event_id: null,
  });
  saveDB(db);
  res.redirect("/");
});

router.get("/concerts/:id", (req: Request, res: Response) => {
  const db = loadDB();
  const concert = db.concerts.find((c) => c.id === req.params.id);

  if (!concert) {
    return res.status(404).render("error", { message: "Koncert nie znaleziony", title: "Błąd" });
  }
  const events = db.events.filter((e) => e.concert_id === req.params.id).sort((a, b) => a.position - b.position);
  res.render("concert_view", {
    concert,
    events,
    title: `Koncert: ${concert.name}`,
  });
});

router.get("/concerts/:id/events/new", (req: Request, res: Response) => {
  res.render("event_new", { concert_id: req.params.id });
});

router.post("/concerts/:id/events", (req: Request, res: Response) => {
  const db = loadDB();
  const { event_type, label, payload } = req.body;
  const concert_id = req.params.id as string;
  if (!isValidJSON(payload)) {
    return res.status(400).render("event_new", {
      concert_id,
      error: "Payload musi być w formacie JSON!",
      event_type,
      label,
      payload,
    });
  }
  const position = db.events.filter((e) => e.concert_id === concert_id).length;
  const id = Date.now().toString();
  db.events.push({
    id,
    concert_id,
    event_type,
    label,
    payload: JSON.parse(payload) || {},
    position,
  });
  saveDB(db);
  res.redirect(`/concerts/${concert_id}`);
});

router.get("/events/:id/edit", (req: Request, res: Response) => {
  const db = loadDB();
  const event = db.events.find((e) => e.id === req.params.id);
  res.render("event_edit", { event });
});

router.post("/events/:id", (req: Request, res: Response) => {
  const db = loadDB();
  const event = db.events.find((e) => e.id === req.params.id);
  if (!isValidJSON(req.body.payload)) {
    return res.status(400).render("event_edit", {
      event: {
        ...event,
        event_type: req.body.event_type,
        label: req.body.label,
        payload: req.body.payload,
      },
      error: "Payload musi być w formacie JSON",
    });
  }
  if (event) {
    event.event_type = req.body.event_type;
    event.label = req.body.label;
    event.payload = JSON.parse(req.body.payload) || {};
  }
  saveDB(db);
  res.redirect(`/concerts/${event?.concert_id}`);
});

router.post("/events/:id/move", (req: Request, res: Response) => {
  const db = loadDB();
  const event = db.events.find((e) => e.id === req.params.id);
  if (!event) return res.redirect("/");
  const events = db.events.filter((e) => e.concert_id === event.concert_id).sort((a, b) => a.position - b.position);
  const idx = events.findIndex((e) => e.id === event.id);
  if (req.body.direction === "up" && idx > 0) {
    if (events[idx] && events[idx - 1]) {
      [events[idx].position, events[idx - 1].position] = [events[idx - 1].position, events[idx].position];
    }
  } else if (req.body.direction === "down" && idx < events.length - 1) {
    if (events[idx] && events[idx + 1]) {
      [events[idx].position, events[idx + 1].position] = [events[idx + 1].position, events[idx].position];
    }
  }
  saveDB(db);
  res.redirect(`/concerts/${event.concert_id}`);
});

router.post("/events/:id/delete", (req: Request, res: Response) => {
  const db = loadDB();
  const event = db.events.find((e) => e.id === req.params.id);
  db.events = db.events.filter((e) => e.id !== req.params.id);
  saveDB(db);
  res.redirect(`/concerts/${event?.concert_id}`);
});

router.post("/concerts/:id/activate", (req: Request, res: Response) => {
  const db = loadDB();
  db.concerts.forEach((c) => (c.is_active = false));
  const concert = db.concerts.find((c) => c.id === req.params.id);
  if (concert) {
    concert.is_active = true;
    const firstEvent = db.events.filter((e) => e.concert_id === concert.id).sort((a, b) => a.position - b.position)[0];
    concert.active_event_id = firstEvent ? firstEvent.id : null;
  }
  saveDB(db);
  res.redirect(`/concerts/${concert?.id}`);
});

router.post("/concerts/:id/deactivate", (req: Request, res: Response) => {
  const db = loadDB();
  const concert = db.concerts.find((c) => c.id === req.params.id);
  if (concert) {
    concert.is_active = false;
    concert.active_event_id = null;
  }
  saveDB(db);
  res.redirect(`/concerts/${concert?.id}`);
});

router.post("/concerts/:id/active_event", (req: Request, res: Response) => {
  const db = loadDB();
  const concert = db.concerts.find((c) => c.id === req.params.id);
  if (concert) {
    concert.active_event_id = req.body.event_id;
  }
  saveDB(db);
  // Broadcast to users if event changed
  if (concert && concert.active_event_id) {
    const event = db.events.find((e) => e.id === concert.active_event_id);
    if (event) {
      broadcastEvent(concert.id, event);
    }
  }
  res.redirect(`/concerts/${concert?.id}`);
});

export default router;
