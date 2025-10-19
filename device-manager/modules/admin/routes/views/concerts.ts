import { Router } from "express";

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
      res.redirect("/concerts");
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
      res.redirect(`/concerts/${id}`);
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
      res.redirect(`/concerts/${id}`);
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

export default router;
