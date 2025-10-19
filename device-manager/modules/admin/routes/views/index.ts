import { Router } from "express";

import { ConcertService } from "../../services";

import concertRoutes from "./concerts";
import eventRoutes from "./events";

import type { Request, Response } from "express";

/**
 * View Routes Aggregator
 * Combines all view route modules (EJS rendering)
 */
const router = Router();

// Main admin dashboard route
router.get("/", async (req: Request, res: Response) => {
  try {
    const concerts = await ConcertService.getAllConcerts();
    res.render("index", { concerts });
  } catch (error) {
    console.error("Failed to load admin dashboard:", error);
    res.status(500).render("error", {
      message: "Nie udało się załadować panelu administracyjnego",
      title: "Błąd",
    });
  }
});

// Mount view route modules
router.use("/concerts", concertRoutes);
router.use("/events", eventRoutes);

export default router;
