import { Router } from "express";

import { FormService } from "../../services";

import type { FormBatchInput } from "../../types";
import type { Request, Response } from "express";
import { UserService } from "@/modules/user";

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
 *     { "timestamp": 1698345600000, "value": 42 },
 *     { "timestamp": 1698345660000, "value": 43 }
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
 *   "data": [{ "timestamp": 1698345600000, "value": 42 }]
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

    // Validate each data point has timestamp and value
    const isValidDataPoints = data.every((point) => typeof point.timestamp === "number" && typeof point.value === "number");

    if (!isValidDataPoints) {
      res.status(400).json({
        success: false,
        error: "Invalid data format: each data point must have timestamp and value as numbers",
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

export default router;
