import { Router } from "express";

import { ConcertService, EventService } from "../../services";

import type { Request, Response } from "express";

const router = Router();

router.get("/currentEvent", async (req: Request, res: Response) => {
  const activeConcert = await ConcertService.findActiveConcert();
  if (!activeConcert) {
    return res.status(404).json({
      success: false,
      error: "No active concert found",
    });
  }

  const activeEventId = activeConcert.activeEventId;
  if (!activeEventId) {
    return res.status(404).json({
      success: false,
      error: "No active event found for the current concert",
    });
  }

  const event = await EventService.getEventById(activeEventId.toString());
  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Active event not found",
    });
  }

  res.json({
    success: true,
    data: event,
  });
});

export default router;
