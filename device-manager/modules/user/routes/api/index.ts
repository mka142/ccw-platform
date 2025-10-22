import { Router } from "express";

import { UserService } from "../../services";

import type { Request, Response, RequestHandler } from "express";

const router = Router();

/**
 * GET /api/users/concert/:concertId - Get users for a specific concert
 */
const getUsersByConcert: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { concertId } = req.params;

    if (!concertId) {
      res.status(400).json({
        success: false,
        error: "Invalid concert ID",
      });
      return;
    }

    const users = await UserService.getUsersByConcert(concertId);
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

router.get("/concert/:concertId", getUsersByConcert);

export default router;
