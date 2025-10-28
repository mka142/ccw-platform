import { Router } from "express";

import { ConcertService, EventService } from "../../services";

import type { Request, Response } from "express";

const router = Router();

router.get("/currentEvent", async (req: Request, res: Response) => {
  const activeConcert = await ConcertService.findActiveConcert();
  if (!activeConcert) {
    res.status(404).json({
      success: false,
      error: "No active concert found",
    });
    return;
  }

  const activeEventId = activeConcert.activeEventId;
  if (!activeEventId) {
    res.status(404).json({
      success: false,
      error: "No active event found for the current concert",
    });
    return;
  }

  const event = await EventService.getEventById(activeEventId.toString());
  if (!event) {
    res.status(404).json({
      success: false,
      error: "Active event not found",
    });
    return;
  }

  res.json({
    success: true,
    data: event,
  });
});

export default router;
