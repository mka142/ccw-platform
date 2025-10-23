import { Router } from "express";

import { config } from "@/config";

import { UserService } from "../../services";

import type { DeviceType } from "../../types";
import type { Request, Response, RequestHandler } from "express";

const router = Router();

const DEVICE_TYPES: DeviceType[] = ["Web", "M5Dial"];

/**
 * POST /api/users/acquireUserId
 *
 * Acquires a user ID for a device connecting to the system.
 *
 * **Flow:**
 * 1. Checks if there's an active concert
 * 2. If userId is provided in header and belongs to active concert, returns existing user
 * 3. Otherwise, creates a new user for the active concert
 *
 * **Request:**
 * - Header: `X-User-Id` (optional) - Existing user ID
 * - Body: `{ deviceType: "Web" | "M5Dial" }` - Type of device requesting ID
 *
 * **Response Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "userId": "507f1f77bcf86cd799439011"
 *   }
 * }
 * ```
 *
 * **Response Errors:**
 * - 400: Invalid device type or missing userId when no deviceType provided
 * - 500: No active concert found, or failed to create/retrieve user
 *
 * @example
 * // New device connecting
 * POST /api/users/acquireUserId
 * Body: { "deviceType": "M5Dial" }
 * → Returns new userId
 *
 * // Existing device reconnecting
 * POST /api/users/acquireUserId
 * Headers: { "X-User-Id": "507f1f77bcf86cd799439011" }
 * Body: { "deviceType": "M5Dial" }
 * → Returns same userId if concert matches, or new userId if concert changed
 */
router.post("/acquireUserId", async (req: Request, res: Response) => {
  // get userId from the header
  const userId = req.header(config.api.userIdHeader);

  try {
    const { deviceType } = req.body;

    if (!deviceType && !userId) {
      res.status(400).json({
        success: false,
        error: "Invalid device type or user ID",
      });
      return;
    }

    if (!DEVICE_TYPES.includes(deviceType)) {
      res.status(400).json({
        success: false,
        error: "Invalid device type",
      });
      return;
    }

    const user = await UserService.acquireUser(userId, deviceType);
    if (!user.success) {
      res.status(500).json({
        success: false,
        error: user.error || "Failed to acquire user",
      });
      return;
    }

    const userIdResponse = user.data?._id;
    if (!userIdResponse) {
      res.status(500).json({
        success: false,
        error: "Failed to acquire user ID",
      });
      return;
    }
    res.json({
      success: true,
      data: { userId: userIdResponse.toString() },
    });
  } catch (error) {
    console.error("Failed to acquire user ID:", error);
    res.status(500).json({
      success: false,
      error: "Failed to acquire user ID",
    });
  }
});

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
