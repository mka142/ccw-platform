import { Router } from "express";

import { ConcertService, UserService } from "../../services";

import type { Request, Response, RequestHandler } from "express";

const router = Router();

/**
 * GET /api/concerts/:id/users - Get users for a specific concert
 */
const getConcertUsers: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: "Invalid concert ID",
      });
      return;
    }

    const concert = await ConcertService.getConcertById(id);
    if (!concert) {
      res.status(404).json({
        success: false,
        error: "Concert not found",
      });
      return;
    }

    const users = await UserService.getUsersByConcert(id);
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Failed to get users for concert:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get users for concert",
    });
  }
};

router.get("/:id/users", getConcertUsers);

export default router;
