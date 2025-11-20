import { Router } from "express";

import { config } from "@/config";

import { ConcertService, EventService } from "../../services";

import type { Request, Response } from "express";

const router = Router();

/**
 * GET /concerts - List all concerts (main dashboard)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const concerts = await ConcertService.getAllConcerts();
    res.render("index", { concerts });
  } catch (error) {
    console.error("Failed to get concerts:", error);
    res.status(500).render("error", {
      message: "Nie udało się załadować koncertów",
      title: "Błąd",
    });
  }
});

/**
 * GET /concerts/new - Show create concert form
 */
router.get("/new", (req: Request, res: Response) => {
  res.render("concert_new");
});

/**
 * GET /concerts/:id - Show concert details
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).render("error", {
        message: "Nieprawidłowy identyfikator koncertu",
        title: "Błąd",
      });
    }

    const concert = await ConcertService.getConcertById(id);

    if (!concert) {
      return res.status(404).render("error", {
        message: "Koncert nie został znaleziony",
        title: "Błąd",
      });
    }

    const events = await EventService.getEventsByConcert(id);

    res.render("concert_view", {
      title: `Koncert: ${concert.name}`,
      concert,
      events: events.sort((a, b) => a.position - b.position),
    });
  } catch (error) {
    console.error("Failed to get concert:", error);
    res.status(500).render("error", {
      message: "Nie udało się załadować koncertu",
      title: "Błąd",
    });
  }
});

/**
 * POST /concerts - Create new concert (form submission)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const concertData = req.body;
    const result = await ConcertService.createConcert(concertData);

    if (result.success) {
      res.redirect(`${config.url.admin}/concerts`);
    } else {
      res.status(400).render("error", {
        message: result.error || "Nie udało się utworzyć koncertu",
        title: "Błąd",
      });
    }
  } catch (error) {
    console.error("Failed to create concert:", error);
    res.status(500).render("error", {
      message: "Nie udało się utworzyć koncertu",
      title: "Błąd",
    });
  }
});

router.post("/:id/activate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).render("error", {
        message: "Nieprawidłowy identyfikator koncertu",
        title: "Błąd",
      });
    }

    const result = await ConcertService.activateConcert(id);

    if (result.success) {
      res.redirect(`${config.url.admin}/concerts/${id}`);
    } else {
      res.status(400).render("error", {
        message: result.error || "Nie udało się aktywować koncertu",
        title: "Błąd",
      });
    }
  } catch (error) {
    console.error("Failed to activate concert:", error);
    res.status(500).render("error", {
      message: "Nie udało się aktywować koncertu",
      title: "Błąd",
    });
  }
});

router.post("/:id/deactivate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).render("error", {
        message: "Nieprawidłowy identyfikator koncertu",
        title: "Błąd",
      });
    }

    const result = await ConcertService.deactivateConcert(id);

    if (result.success) {
      res.redirect(`${config.url.admin}/concerts/${id}`);
    } else {
      res.status(400).render("error", {
        message: result.error || "Nie udało się dezaktywować koncertu",
        title: "Błąd",
      });
    }
  } catch (error) {
    console.error("Failed to deactivate concert:", error);
    res.status(500).render("error", {
      message: "Nie udało się dezaktywować koncertu",
      title: "Błąd",
    });
  }
});

/**
 * GET /concerts/:id/export-events - Export events as JSON
 */
router.get("/:id/export-events", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Invalid concert ID" });
      return;
    }

    const result = await EventService.exportEvents(id);

    if (result.success) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="concert-${id}-events.json"`);
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error || "Failed to export events" });
    }
  } catch (error) {
    console.error("Failed to export events:", error);
    res.status(500).json({ error: "Failed to export events" });
  }
});

/**
 * POST /concerts/:id/import-events - Import events from JSON
 */
router.post("/:id/import-events", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { events } = req.body;

    if (!id) {
      res.status(400).render("error", {
        message: "Nieprawidłowy identyfikator koncertu",
        title: "Błąd",
      });
      return;
    }

    const parsedEvents = typeof events === "string" ? JSON.parse(events) : events;
    
    if (!events || !Array.isArray(parsedEvents)) {
      res.status(400).render("error", {
        message: "Nieprawidłowe dane wydarzeń",
        title: "Błąd",
      });
      return;
    }

    const result = await EventService.importEvents(id, parsedEvents);

    if (result.success) {
      res.redirect(`${config.url.admin}/concerts/${id}`);
    } else {
      res.status(400).render("error", {
        message: result.error || "Nie udało się zaimportować wydarzeń",
        title: "Błąd",
      });
    }
  } catch (error) {
    console.error("Failed to import events:", error);
    res.status(500).render("error", {
      message: "Nie udało się zaimportować wydarzeń",
      title: "Błąd",
    });
  }
});

export default router;
