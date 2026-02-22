import { Router } from "express";

import { UserService } from "@/modules/user";

import { FormService } from "../../services";

import type { FormBatchInput } from "../../types";
import type { Request, Response } from "express";

const router = Router();

/**
 * POST /api/forms/batch
 *
 * Save form data in batch format.
 *
 * **Request Body:**
 * ```json
 * {
 *   "clientId": "507f1f77bcf86cd799439011",
 *   "pieceId": "piece_123",
 *   "data": [
 *     { "t": 1698345600000, "v": 42 },
 *     { "t": 1698345660000, "v": 43 }
 *   ]
 * }
 * ```
 *
 * **Response Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "_id": "507f1f77bcf86cd799439012",
 *       "clientId": "507f1f77bcf86cd799439011",
 *       "pieceId": "piece_123",
 *       "timestamp": 1698345600000,
 *       "value": 42,
 *       "createdAt": 1698345600000,
 *       "updatedAt": 1698345600000
 *     },
 *     ...
 *   ]
 * }
 * ```
 *
 * **Response Errors:**
 * - 400: Missing required fields (clientId, pieceId, or data)
 * - 400: Invalid data format (data must be an array)
 * - 500: Database operation failed
 *
 * @example
 * POST /api/forms/batch
 * Body: {
 *   "clientId": "507f1f77bcf86cd799439011",
 *   "pieceId": "piece_123",
 *   "data": [{ "t": 1698345600000, "v": 42 }]
 * }
 */
router.post("/batch", async (req: Request, res: Response) => {
  try {
    const { clientId, pieceId, data } = req.body as FormBatchInput;

    const user = UserService.findById(clientId);
    if (!user) {
      res.status(400).json({
        success: false,
        error: "Invalid clientId: user does not exist",
      });
      return;
    }

    // Validate required fields
    if (!clientId || !pieceId || !data) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: clientId, pieceId, and data are required",
      });
      return;
    }

    // Validate data is an array
    if (!Array.isArray(data)) {
      res.status(400).json({
        success: false,
        error: "Invalid data format: data must be an array",
      });
      return;
    }

    // Validate each data point has t (timestamp) and v (value)
    const isValidDataPoints = data.every((point) => typeof point.t === "number" && typeof point.v === "number");

    if (!isValidDataPoints) {
      res.status(400).json({
        success: false,
        error: "Invalid data format: each data point must have t and v as numbers",
      });
      return;
    }

    const result = await FormService.saveBatch({ clientId, pieceId, data });

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error || "Failed to save form data",
      });
      return;
    }

    res.json({
      success: true,
      //data: result.data, // We don't want to send back all data points
    });
  } catch (error) {
    console.error("Failed to save form data batch:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save form data batch",
    });
  }
});

/**
 * GET /api/forms/client/:clientId
 *
 * Get all form data for a specific client.
 *
 * **Response Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "data": [...]
 * }
 * ```
 */
router.get("/client/:clientId", async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      res.status(400).json({
        success: false,
        error: "Client ID is required",
      });
      return;
    }

    const data = await FormService.getByClient(clientId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Failed to get form data by client:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get form data",
    });
  }
});

/**
 * GET /api/forms/piece/:pieceId
 *
 * Get all form data for a specific piece.
 *
 * **Response Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "data": [...]
 * }
 * ```
 */
router.get("/piece/:pieceId", async (req: Request, res: Response) => {
  try {
    const { pieceId } = req.params;

    if (!pieceId) {
      res.status(400).json({
        success: false,
        error: "Piece ID is required",
      });
      return;
    }

    const data = await FormService.getByPiece(pieceId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Failed to get form data by piece:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get form data",
    });
  }
});

/**
 * GET /api/forms/client/:clientId/piece/:pieceId
 *
 * Get all form data for a specific client and piece combination.
 *
 * **Response Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "data": [...]
 * }
 * ```
 */
router.get("/client/:clientId/piece/:pieceId", async (req: Request, res: Response) => {
  try {
    const { clientId, pieceId } = req.params;

    if (!clientId || !pieceId) {
      res.status(400).json({
        success: false,
        error: "Client ID and Piece ID are required",
      });
      return;
    }

    const data = await FormService.getByClientAndPiece(clientId, pieceId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Failed to get form data by client and piece:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get form data",
    });
  }
});

/**
 * GET /api/forms/concert/:concertId/realtime
 *
 * Get all form data for a specific concert for real-time dashboard.
 *
 * **Response Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "data": [...],
 *   "meta": {
 *     "userCount": 5,
 *     "dataPointCount": 1234
 *   }
 * }
 * ```
 */
router.get("/concert/:concertId/realtime", async (req: Request, res: Response) => {
  try {
    const { concertId } = req.params;

    if (!concertId) {
      res.status(400).json({
        success: false,
        error: "Concert ID is required",
      });
      return;
    }

    const data = await FormService.getByConcert(concertId);
    
    // Group data by clientId to get user count
    const userIds = new Set(data.map(point => point.clientId.toString()));
    
    res.json({
      success: true,
      data,
      meta: {
        userCount: userIds.size,
        dataPointCount: data.length,
      }
    });
  } catch (error) {
    console.error("Failed to get realtime form data by concert:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get realtime form data",
    });
  }
});

/**
 * GET /api/forms/concert/:concertId/recent/:timeRangeMs
 *
 * Get recent form data for a specific concert within time range for real-time dashboard.
 *
 * **Parameters:**
 * - concertId: Concert ID to get data for
 * - timeRangeMs: Time range in milliseconds (e.g., 30000 for last 30 seconds)
 *
 * **Response Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "data": [...],
 *   "meta": {
 *     "timeRangeMs": 30000,
 *     "userCount": 3,
 *     "dataPointCount": 45
 *   }
 * }
 * ```
 */
router.get("/concert/:concertId/recent/:timeRangeMs", async (req: Request, res: Response) => {
  try {
    const { concertId, timeRangeMs } = req.params;

    if (!concertId || !timeRangeMs) {
      res.status(400).json({
        success: false,
        error: "Concert ID and time range are required",
      });
      return;
    }

    const timeRange = parseInt(timeRangeMs);
    if (isNaN(timeRange) || timeRange <= 0) {
      res.status(400).json({
        success: false,
        error: "Invalid time range. Must be a positive number in milliseconds.",
      });
      return;
    }

    const data = await FormService.getRecentByConcert(concertId, timeRange);
    
    // Group data by clientId to get user count
    const userIds = new Set(data.map(point => point.clientId.toString()));
    
    res.json({
      success: true,
      data,
      meta: {
        timeRangeMs: timeRange,
        userCount: userIds.size,
        dataPointCount: data.length,
      }
    });
  } catch (error) {
    console.error("Failed to get recent form data by concert:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get recent form data",
    });
  }
});

export default router;
