import fs from "node:fs";
import path from "node:path";
import { Router } from "express";

import { ReRecordFormService } from "../../services/reRecordFormService";
import { ResponseService } from "../../services/responseService";

import type { StartRecordingInput, BatchDataInput } from "../../types";
import type { Request, Response } from "express";

const router = Router();

/**
 * GET /api/re-record-forms/audio/:formId - Serve audio file
 */
router.get("/audio/:formId", async (req: Request, res: Response) => {
  try {
    const formId = req.params.formId;
    if (!formId) {
      res.status(400).json({ success: false, error: "Form ID is required" });
      return;
    }

    const form = await ReRecordFormService.getFormById(formId);

    if (!form) {
      res.status(404).json({ success: false, error: "Form not found" });
      return;
    }

    if (!form.audioFilePath || !fs.existsSync(form.audioFilePath)) {
      res.status(404).json({ success: false, error: "Audio file not found" });
      return;
    }

    const stat = fs.statSync(form.audioFilePath);
    const ext = path.extname(form.audioFilePath).toLowerCase();
    
    // Determine content type based on extension
    const contentTypes: Record<string, string> = {
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".ogg": "audio/ogg",
      ".m4a": "audio/mp4",
    };
    
    const contentType = contentTypes[ext] || "audio/mpeg";

    // Support range requests for audio streaming
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0] ?? "0", 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;
      
      const file = fs.createReadStream(form.audioFilePath, { start, end });
      
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType,
      });
      
      file.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": stat.size,
        "Content-Type": contentType,
      });
      
      fs.createReadStream(form.audioFilePath).pipe(res);
    }
  } catch (error) {
    console.error("Failed to serve audio:", error);
    res.status(500).json({ success: false, error: "Failed to serve audio file" });
  }
});

/**
 * POST /api/re-record-forms/responses/:accessToken/heartbeat - Heartbeat from measurement app
 * Called every 10 seconds by the web-client to indicate the measurement app is connected
 */
router.post("/responses/:accessToken/heartbeat", async (req: Request, res: Response) => {
  try {
    const accessToken = req.params.accessToken;
    if (!accessToken) {
      res.status(400).json({ success: false, error: "Access token is required" });
      return;
    }

    const result = await ResponseService.updateHeartbeat(accessToken);

    if (result.success) {
      res.json({
        success: true,
        data: {
          isActive: result.data?.isActive,
          lastHeartbeat: result.data?.lastHeartbeat,
          isFinished: result.data?.recordingFinished || false,
        },
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error("Failed to update heartbeat:", error);
    res.status(500).json({ success: false, error: "Failed to update heartbeat" });
  }
});

/**
 * GET /api/re-record-forms/responses/:accessToken/status - Get response status for polling
 * Called by recipient page to check if measurement app is connected
 */
router.get("/responses/:accessToken/status", async (req: Request, res: Response) => {
  try {
    const accessToken = req.params.accessToken;
    if (!accessToken) {
      res.status(400).json({ success: false, error: "Access token is required" });
      return;
    }

    const status = await ResponseService.getResponseStatus(accessToken);

    if (!status) {
      res.status(404).json({ success: false, error: "Response not found" });
      return;
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Failed to get response status:", error);
    res.status(500).json({ success: false, error: "Failed to get response status" });
  }
});

/**
 * POST /api/re-record-forms/responses/:accessToken/start - Start recording
 * Client must provide the exact timestamp when audio playback starts
 */
router.post("/responses/:accessToken/start", async (req: Request, res: Response) => {
  try {
    const accessToken = req.params.accessToken;
    if (!accessToken) {
      res.status(400).json({ success: false, error: "Access token is required" });
      return;
    }

    const { recordingTimestampStart } = req.body as StartRecordingInput;

    if (!recordingTimestampStart || typeof recordingTimestampStart !== "number") {
      res.status(400).json({ success: false, error: "recordingTimestampStart is required and must be a number" });
      return;
    }

    const response = await ResponseService.getResponseByToken(accessToken);
    
    if (!response) {
      res.status(404).json({ success: false, error: "Response not found" });
      return;
    }

    if (response.recordingTimestampStart) {
      res.status(400).json({ success: false, error: "Recording already started" });
      return;
    }

    const result = await ResponseService.startRecording(accessToken, recordingTimestampStart);

    if (result.success) {
      res.json({
        success: true,
        data: {
          recordingTimestampStart: result.data?.recordingTimestampStart,
        },
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error("Failed to start recording:", error);
    res.status(500).json({ success: false, error: "Failed to start recording" });
  }
});

/**
 * POST /api/re-record-forms/responses/:accessToken/finish - Finish recording
 */
router.post("/responses/:accessToken/finish", async (req: Request, res: Response) => {
  try {
    const accessToken = req.params.accessToken;
    if (!accessToken) {
      res.status(400).json({ success: false, error: "Access token is required" });
      return;
    }

    const response = await ResponseService.getResponseByToken(accessToken);
    
    if (!response) {
      res.status(404).json({ success: false, error: "Response not found" });
      return;
    }

    const result = await ResponseService.finishRecording(accessToken);

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error("Failed to finish recording:", error);
    res.status(500).json({ success: false, error: "Failed to finish recording" });
  }
});

/**
 * POST /api/re-record-forms/responses/:accessToken/batch - Submit batch data
 * Similar to the form module's batch endpoint
 */
router.post("/responses/:accessToken/batch", async (req: Request, res: Response) => {
  try {
    const accessToken = req.params.accessToken;
    if (!accessToken) {
      res.status(400).json({ success: false, error: "Access token is required" });
      return;
    }

    const { data } = req.body as BatchDataInput;

    const response = await ResponseService.getResponseByToken(accessToken);
    
    if (!response) {
      res.status(404).json({ success: false, error: "Response not found" });
      return;
    }

    // Reject data if recording hasn't started yet (no recordingTimestampStart)
    if (!response.recordingTimestampStart) {
      res.status(400).json({ success: false, error: "Recording not started" });
      return;
    }

    if (!data || !Array.isArray(data)) {
      res.status(400).json({ success: false, error: "Invalid data format: data must be an array" });
      return;
    }

    // Validate data points
    const isValidDataPoints = data.every(
      (point) => typeof point.t === "number" && typeof point.v === "number"
    );

    if (!isValidDataPoints) {
      res.status(400).json({
        success: false,
        error: "Invalid data format: each data point must have t and v as numbers",
      });
      return;
    }

    const result = await ResponseService.appendData(accessToken, data);

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error("Failed to submit batch data:", error);
    res.status(500).json({ success: false, error: "Failed to submit batch data" });
  }
});

/**
 * GET /api/re-record-forms/responses/:responseId/data - Get response data
 */
router.get("/responses/:responseId/data", async (req: Request, res: Response) => {
  try {
    const responseId = req.params.responseId;
    if (!responseId) {
      res.status(400).json({ success: false, error: "Response ID is required" });
      return;
    }

    const response = await ResponseService.getResponseById(responseId);

    if (!response) {
      res.status(404).json({ success: false, error: "Response not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        responseId: response._id.toString(),
        name: response.name,
        recordingTimestampStart: response.recordingTimestampStart,
        recordingFinished: response.recordingFinished,
        dataPointsCount: response.data.length,
        data: response.data,
      },
    });
  } catch (error) {
    console.error("Failed to get response data:", error);
    res.status(500).json({ success: false, error: "Failed to get response data" });
  }
});

/**
 * GET /api/re-record-forms/responses/:responseId/download - Download response data
 */
router.get("/responses/:responseId/download", async (req: Request, res: Response) => {
  try {
    const responseId = req.params.responseId;
    if (!responseId) {
      res.status(400).json({ success: false, error: "Response ID is required" });
      return;
    }

    const format = (req.query.format as string) || "csv";
    
    const response = await ResponseService.getResponseById(responseId);

    if (!response) {
      res.status(404).json({ success: false, error: "Response not found" });
      return;
    }

    const filename = `response-${responseId}-${Date.now()}`;

    if (format === "json") {
      const data = ResponseService.exportDataAsJson(response);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}.json"`);
      res.send(data);
    } else {
      const data = ResponseService.exportDataAsCsv(response);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
      res.send(data);
    }
  } catch (error) {
    console.error("Failed to download response data:", error);
    res.status(500).json({ success: false, error: "Failed to download response data" });
  }
});

export default router;
