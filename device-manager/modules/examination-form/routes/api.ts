import express, { type Request, type Response } from "express";

import { ExaminationFormService } from "../services";

import type { ExaminationFormInput } from "../types";

const router = express.Router();

/**
 * POST /api/examination-forms
 * Create a new examination form response
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { userId, formId, answers } = req.body;

    if (!userId || !formId || !answers) {
      res.status(400).json({
        error: "Missing required fields: userId, formId, and answers are required",
      });
      return;
    }

    const input: ExaminationFormInput = { userId, formId, answers };
    const result = await ExaminationFormService.createResponse(input);

    if (result.success) {
      res.status(201).json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: unknown) {
    const message = typeof error === "object" && error && "message" in error ? (error as { message?: string }).message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/examination-forms/user/:userId
 * Get all examination form responses for a specific user
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const responses = await ExaminationFormService.getResponsesByUserId(userId);
    res.json(responses);
  } catch (error: unknown) {
    const message = typeof error === "object" && error && "message" in error ? (error as { message?: string }).message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/examination-forms/form/:formId
 * Get all responses for a specific form
 */
router.get("/form/:formId", async (req, res) => {
  try {
    const { formId } = req.params;
    const responses = await ExaminationFormService.getResponsesByFormId(formId);
    res.json(responses);
  } catch (error: unknown) {
    const message = typeof error === "object" && error && "message" in error ? (error as { message?: string }).message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/examination-forms/form/:formId/count
 * Get count of responses for a specific form
 */
router.get("/form/:formId/count", async (req, res) => {
  try {
    const { formId } = req.params;
    const count = await ExaminationFormService.getFormResponseCount(formId);
    res.json(count);
  } catch (error: unknown) {
    const message = typeof error === "object" && error && "message" in error ? (error as { message?: string }).message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/examination-forms/form/:formId/users
 * Get userIds of all users who responded to a specific form
 */
router.get("/form/:formId/users", async (req, res) => {
  try {
    const { formId } = req.params;
    const responses = await ExaminationFormService.getResponsesByFormId(formId);
    const userIds = responses.map(response => response.userId);
    res.json(userIds);
  } catch (error: unknown) {
    const message = typeof error === "object" && error && "message" in error ? (error as { message?: string }).message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/examination-forms/user/:userId/form/:formId
 * Get a specific user's response to a specific form
 */
router.get("/user/:userId/form/:formId", async (req, res) => {
  try {
    const { userId, formId } = req.params;
    const response = await ExaminationFormService.getUserFormResponse(userId, formId);

    if (response) {
      res.json(response);
    } else {
      res.status(404).json({ error: "Response not found" });
    }
  } catch (error: unknown) {
    const message = typeof error === "object" && error && "message" in error ? (error as { message?: string }).message : String(error);
    res.status(500).json({ error: message });
  }
});

export default router;
