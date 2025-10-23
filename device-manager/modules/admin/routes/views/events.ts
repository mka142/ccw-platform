import { Router } from "express";

import { config } from "@/config";
import { isValidJSON, safeJSONParse } from "@/lib/utils";

import { ConcertService, EventService } from "../../services";

import type { Request, Response } from "express";

const router = Router();

/**
 * GET /events/new/:concertId - Show create event form for specific concert
 */
router.get("/new/:concertId", async (req: Request, res: Response) => {
  try {
    const { concertId } = req.params;

    if (!concertId) {
      return res.status(400).render("error", {
        message: "Nieprawidłowy identyfikator koncertu",
        title: "Błąd",
      });
    }

    const concert = await ConcertService.getConcertById(concertId);

    if (!concert) {
      return res.status(404).render("error", {
        message: "Koncert nie został znaleziony",
        title: "Błąd",
      });
    }

    res.render("event_new", {
      concert,
    });
  } catch (error) {
    console.error("Failed to load event form:", error);
    res.status(500).render("error", {
      message: "Nie udało się załadować formularza wydarzenia",
      title: "Błąd",
    });
  }
});

/**
 * GET /events/edit/:eventId - Show edit event form
 */
router.get("/edit/:eventId", async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).render("error", {
        message: "Nieprawidłowy identyfikator wydarzenia",
        title: "Błąd",
      });
    }

    const event = await EventService.getEventById(eventId);

    if (!event) {
      return res.status(404).render("error", {
        message: "Wydarzenie nie zostało znalezione",
        title: "Błąd",
      });
    }

    res.render("event_edit", {
      event,
    });
  } catch (error) {
    console.error("Failed to load event for editing:", error);
    res.status(500).render("error", {
      message: "Nie udało się załadować wydarzenia do edycji",
      title: "Błąd",
    });
  }
});

router.post("/edit/:eventId", async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { eventType, label, payload } = req.body;

    if (!eventId) {
      return res.status(400).render("error", {
        message: "Nieprawidłowy identyfikator wydarzenia",
        title: "Błąd",
      });
    }

    // Validate payload is valid JSON if provided
    if (payload && !isValidJSON(payload)) {
      return res.status(400).render("error", {
        message: "Dane muszą być w poprawnym formacie JSON",
        title: "Błąd",
      });
    }

    const updateData: any = {
      eventType,
      label,
    };

    if (payload) {
      updateData.payload = safeJSONParse(payload, {});
    }

    console.log("Update Data:", updateData, payload);

    const result = await EventService.updateEvent(eventId, updateData);

    if (result.success) {
      if (result.data) {
        res.redirect(`${config.url.admin}/concerts/${result.data.concertId}`);
      }
    } else {
      res.status(400).render("error", {
        message: result?.error || "Nie udało się zaktualizować wydarzenia",
        title: "Błąd",
      });
    }
  } catch (error) {
    console.error("Failed to update event:", error);
    res.status(500).render("error", {
      message: "Nie udało się zaktualizować wydarzenia",
      title: "Błąd",
    });
  }
});

/**
 * POST /events - Create new event (form submission)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { concertId, eventType, label, payload, position } = req.body;

    // Validate required fields
    if (!concertId || !eventType || !label) {
      return res.status(400).render("error", {
        message: "Brakuje wymaganych pól: koncert, typ wydarzenia, etykieta",
        title: "Błąd",
      });
    }

    // Validate payload is valid JSON if provided
    if (payload && typeof payload === "string" && !isValidJSON(payload)) {
      return res.status(400).render("error", {
        message: "Dane muszą być w poprawnym formacie JSON",
        title: "Błąd",
      });
    }

    // Calculate position if not provided
    const existingEvents = await EventService.getEventsByConcert(concertId);
    const eventPosition = position ?? existingEvents.length;

    const eventData = {
      concertId,
      eventType,
      label,
      payload: safeJSONParse(payload, {}),
      position: eventPosition,
    };

    const result = await EventService.createEvent(eventData);

    if (result.success) {
      res.redirect(`${config.url.admin}/concerts/${concertId}`);
    } else {
      res.status(400).render("error", {
        message: result.error || "Nie udało się utworzyć wydarzenia",
        title: "Błąd",
      });
    }
  } catch (error) {
    console.error("Failed to create event:", error);
    res.status(500).render("error", {
      message: "Nie udało się utworzyć wydarzenia",
      title: "Błąd",
    });
  }
});

router.post("/move/:eventId", async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { direction } = req.body; // 'up' or 'down'

    if (!eventId || (direction !== "up" && direction !== "down")) {
      return res.status(400).render("error", {
        message: "Nieprawidłowe dane żądania",
        title: "Błąd",
      });
    }

    const operation = await EventService.moveEventPosition(eventId, direction);

    if (!operation.success) {
      return res.status(400).render("error", {
        message: operation.error || "Nie udało się przenieść wydarzenia",
        title: "Błąd",
      });
    }

    const event = await EventService.getEventById(eventId);

    if (!event) {
      return res.status(404).render("error", {
        message: "Wydarzenie nie zostało znalezione",
        title: "Błąd",
      });
    }

    res.redirect(`${config.url.admin}/concerts/${event.concertId}`);
  } catch (error) {
    console.error("Failed to move event:", error);
  }
});

router.post("/delete/:eventId", async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).render("error", {
        message: "Nieprawidłowy identyfikator wydarzenia",
        title: "Błąd",
      });
    }

    const event = await EventService.getEventById(eventId);

    if (!event) {
      return res.status(404).render("error", {
        message: "Wydarzenie nie zostało znalezione",
        title: "Błąd",
      });
    }

    const result = await EventService.deleteEvent(eventId);

    if (!result.success) {
      res.status(400).render("error", {
        message: result.error || "Nie udało się usunąć wydarzenia",
        title: "Błąd",
      });
    }
    res.redirect(`${config.url.admin}/concerts/${event.concertId}`);
  } catch (error) {
    console.error("Failed to delete event:", error);
    res.status(500).render("error", {
      message: "Nie udało się usunąć wydarzenia",
      title: "Błąd",
    });
  }
});

router.post("/activate/:eventId", async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).render("error", {
        message: "Nieprawidłowy identyfikator wydarzenia",
        title: "Błąd",
      });
    }

    const event = await EventService.getEventById(eventId);

    if (!event) {
      return res.status(404).render("error", {
        message: "Wydarzenie nie zostało znalezione",
        title: "Błąd",
      });
    }

    const result = await ConcertService.setActiveEvent(event.concertId.toString(), eventId);

    if (result.success) {
      res.redirect(`${config.url.admin}/concerts/${event.concertId}`);
    } else {
      res.status(400).render("error", {
        message: result.error ?? "Nie udało się aktywować wydarzenia",
        title: "Błąd",
      });
    }
  } catch (error) {
    console.error("Failed to activate event:", error);
    res.status(500).render("error", {
      message: "Nie udało się aktywować wydarzenia",
      title: "Błąd",
    });
  }
});

export default router;
