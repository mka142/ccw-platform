import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";

import { config } from "@/config";

import { ReRecordFormService } from "../../services/reRecordFormService";
import { ResponseService } from "../../services/responseService";

import type { Request, Response } from "express";

const router = Router();

// Ensure uploads directory exists
const uploadsDir = config.paths.uploads;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `audio-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Extended list of audio MIME types (different browsers/systems report different types)
  const allowedMimeTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/x-mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/ogg",
    "audio/vorbis",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/aac",
    "audio/x-aac",
    "audio/webm",
    "audio/flac",
    "audio/x-flac",
    "application/octet-stream", // Some browsers send this for audio files
  ];
  
  // Also check by file extension as fallback
  const allowedExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm", ".flac"];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    console.error(`Rejected file upload: mimetype=${file.mimetype}, extension=${ext}, filename=${file.originalname}`);
    cb(new Error(`Nieprawidłowy format pliku (${file.mimetype}). Dozwolone formaty: MP3, WAV, OGG, M4A, AAC, WebM, FLAC`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for high quality audio
  },
});

const baseUrl = config.url.reRecordForm;
const apiBaseUrl = config.url.apiReRecordForm;
const adminUrl = config.url.admin;

/**
 * GET /re-record-forms - List all forms
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const forms = await ReRecordFormService.getAllForms();
    res.render("rerecord_list", {
      title: "Re-Record Forms",
      forms,
      baseUrl,
      adminUrl,
    });
  } catch (error) {
    console.error("Failed to get re-record forms:", error);
    res.status(500).render("error", {
      title: "Błąd",
      message: "Nie udało się załadować formularzy",
      baseUrl,
    });
  }
});

/**
 * GET /re-record-forms/new - Show create form
 */
router.get("/new", (req: Request, res: Response) => {
  res.render("rerecord_new", {
    title: "Nowy formularz Re-Record",
    baseUrl,
  });
});

/**
 * POST /re-record-forms - Create new form
 */
router.post("/", upload.single("audioFile"), async (req: Request, res: Response) => {
  try {
    const { name, pieceId, description, measurementAppUrl } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).render("error", {
        title: "Błąd",
        message: "Plik audio jest wymagany",
        baseUrl,
      });
    }

    const result = await ReRecordFormService.createForm(
      { name, pieceId, description, measurementAppUrl },
      file.path,
      file.originalname
    );

    if (result.success) {
      res.redirect(`${baseUrl}/${result.data._id}`);
    } else {
      // Clean up uploaded file on error
      fs.unlinkSync(file.path);
      res.status(400).render("error", {
        title: "Błąd",
        message: result.error || "Nie udało się utworzyć formularza",
        baseUrl,
      });
    }
  } catch (error) {
    console.error("Failed to create re-record form:", error);
    res.status(500).render("error", {
      title: "Błąd",
      message: "Nie udało się utworzyć formularza",
      baseUrl,
    });
  }
});

/**
 * GET /re-record-forms/:id - Show form detail
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).render("error", {
        title: "Błąd",
        message: "Nieprawidłowy identyfikator formularza",
        baseUrl,
      });
    }

    const form = await ReRecordFormService.getFormById(id);

    if (!form) {
      return res.status(404).render("error", {
        title: "Nie znaleziono",
        message: "Formularz nie został znaleziony",
        baseUrl,
      });
    }

    const responses = await ResponseService.getResponsesByForm(id);

    res.render("rerecord_detail", {
      title: form.name,
      form,
      responses,
      baseUrl,
      apiBaseUrl,
    });
  } catch (error) {
    console.error("Failed to get re-record form:", error);
    res.status(500).render("error", {
      title: "Błąd",
      message: "Nie udało się załadować formularza",
      baseUrl,
    });
  }
});

/**
 * GET /re-record-forms/:id/edit - Show edit form
 */
router.get("/:id/edit", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).render("error", {
        title: "Błąd",
        message: "Nieprawidłowy identyfikator formularza",
        baseUrl,
      });
    }

    const form = await ReRecordFormService.getFormById(id);

    if (!form) {
      return res.status(404).render("error", {
        title: "Nie znaleziono",
        message: "Formularz nie został znaleziony",
        baseUrl,
      });
    }

    res.render("rerecord_edit", {
      title: `Edytuj: ${form.name}`,
      form,
      baseUrl,
    });
  } catch (error) {
    console.error("Failed to get re-record form for edit:", error);
    res.status(500).render("error", {
      title: "Błąd",
      message: "Nie udało się załadować formularza",
      baseUrl,
    });
  }
});

/**
 * POST /re-record-forms/:id/edit - Update form
 */
router.post("/:id/edit", upload.single("audioFile"), async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).render("error", {
        title: "Błąd",
        message: "Nieprawidłowy identyfikator formularza",
        baseUrl,
      });
    }

    const { name, pieceId, description, measurementAppUrl } = req.body;
    const file = req.file;

    const existingForm = await ReRecordFormService.getFormById(id);
    if (!existingForm) {
      if (file) fs.unlinkSync(file.path);
      return res.status(404).render("error", {
        title: "Nie znaleziono",
        message: "Formularz nie został znaleziony",
        baseUrl,
      });
    }

    let audioFilePath = existingForm.audioFilePath;
    let audioFileName = existingForm.audioFileName;
    let oldFilePath: string | null = null;

    if (file) {
      oldFilePath = existingForm.audioFilePath;
      audioFilePath = file.path;
      audioFileName = file.originalname;
    }

    const result = await ReRecordFormService.updateForm(
      id,
      { name, pieceId, description, measurementAppUrl },
      audioFilePath,
      audioFileName
    );

    if (result.success) {
      // Delete old file if new one was uploaded
      if (oldFilePath && fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      res.redirect(`${baseUrl}/${id}`);
    } else {
      // Clean up newly uploaded file on error
      if (file) fs.unlinkSync(file.path);
      res.status(400).render("error", {
        title: "Błąd",
        message: result.error || "Nie udało się zaktualizować formularza",
        baseUrl,
      });
    }
  } catch (error) {
    console.error("Failed to update re-record form:", error);
    res.status(500).render("error", {
      title: "Błąd",
      message: "Nie udało się zaktualizować formularza",
      baseUrl,
    });
  }
});

/**
 * POST /re-record-forms/:id/delete - Delete form
 */
router.post("/:id/delete", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).render("error", {
        title: "Błąd",
        message: "Nieprawidłowy identyfikator formularza",
        baseUrl,
      });
    }

    const form = await ReRecordFormService.getFormById(id);

    if (!form) {
      return res.status(404).render("error", {
        title: "Nie znaleziono",
        message: "Formularz nie został znaleziony",
        baseUrl,
      });
    }

    const result = await ReRecordFormService.deleteForm(id);

    if (result.success) {
      // Delete audio file
      if (form.audioFilePath && fs.existsSync(form.audioFilePath)) {
        fs.unlinkSync(form.audioFilePath);
      }
      res.redirect(baseUrl);
    } else {
      res.status(400).render("error", {
        title: "Błąd",
        message: result.error || "Nie udało się usunąć formularza",
        baseUrl,
      });
    }
  } catch (error) {
    console.error("Failed to delete re-record form:", error);
    res.status(500).render("error", {
      title: "Błąd",
      message: "Nie udało się usunąć formularza",
      baseUrl,
    });
  }
});

/**
 * POST /re-record-forms/:id/responses - Create new response
 */
router.post("/:id/responses", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).render("error", {
        title: "Błąd",
        message: "Nieprawidłowy identyfikator formularza",
        baseUrl,
      });
    }

    const { name } = req.body;

    const form = await ReRecordFormService.getFormById(id);
    if (!form) {
      return res.status(404).render("error", {
        title: "Nie znaleziono",
        message: "Formularz nie został znaleziony",
        baseUrl,
      });
    }

    const result = await ResponseService.createResponse({
      reRecordFormId: id,
      name: name || "Nowa odpowiedź",
    });

    if (result.success) {
      res.redirect(`${baseUrl}/${id}`);
    } else {
      res.status(400).render("error", {
        title: "Błąd",
        message: result.error || "Nie udało się utworzyć odpowiedzi",
        baseUrl,
      });
    }
  } catch (error) {
    console.error("Failed to create response:", error);
    res.status(500).render("error", {
      title: "Błąd",
      message: "Nie udało się utworzyć odpowiedzi",
      baseUrl,
    });
  }
});

/**
 * GET /re-record-forms/responses/:responseId - Show response detail
 */
router.get("/responses/:responseId", async (req: Request, res: Response) => {
  try {
    const responseId = req.params.responseId;
    if (!responseId) {
      return res.status(400).render("error", {
        title: "Błąd",
        message: "Nieprawidłowy identyfikator odpowiedzi",
        baseUrl,
      });
    }

    const response = await ResponseService.getResponseById(responseId);

    if (!response) {
      return res.status(404).render("error", {
        title: "Nie znaleziono",
        message: "Odpowiedź nie została znaleziona",
        baseUrl,
      });
    }

    const form = await ReRecordFormService.getFormById(response.reRecordFormId);
    if (!form) {
      return res.status(404).render("error", {
        title: "Nie znaleziono",
        message: "Formularz nie został znaleziony",
        baseUrl,
      });
    }

    const measurementUrl = ReRecordFormService.getMeasurementUrl(form, responseId);

    res.render("response_detail", {
      title: response.name,
      response,
      form,
      measurementUrl,
      baseUrl,
      apiBaseUrl,
    });
  } catch (error) {
    console.error("Failed to get response:", error);
    res.status(500).render("error", {
      title: "Błąd",
      message: "Nie udało się załadować odpowiedzi",
      baseUrl,
    });
  }
});

/**
 * POST /re-record-forms/responses/:responseId/name - Update response name
 */
router.post("/responses/:responseId/name", async (req: Request, res: Response) => {
  try {
    const responseId = req.params.responseId;
    if (!responseId) {
      return res.status(400).render("error", {
        title: "Błąd",
        message: "Nieprawidłowy identyfikator odpowiedzi",
        baseUrl,
      });
    }

    const { name } = req.body;

    const result = await ResponseService.updateResponseName(responseId, name);

    if (result.success) {
      res.redirect(`${baseUrl}/responses/${responseId}`);
    } else {
      res.status(400).render("error", {
        title: "Błąd",
        message: result.error || "Nie udało się zaktualizować nazwy",
        baseUrl,
      });
    }
  } catch (error) {
    console.error("Failed to update response name:", error);
    res.status(500).render("error", {
      title: "Błąd",
      message: "Nie udało się zaktualizować nazwy",
      baseUrl,
    });
  }
});

/**
 * POST /re-record-forms/responses/:responseId/delete - Delete response
 */
router.post("/responses/:responseId/delete", async (req: Request, res: Response) => {
  try {
    const responseId = req.params.responseId;
    if (!responseId) {
      return res.status(400).render("error", {
        title: "Błąd",
        message: "Nieprawidłowy identyfikator odpowiedzi",
        baseUrl,
      });
    }

    const response = await ResponseService.getResponseById(responseId);

    if (!response) {
      return res.status(404).render("error", {
        title: "Nie znaleziono",
        message: "Odpowiedź nie została znaleziona",
        baseUrl,
      });
    }

    const formId = response.reRecordFormId.toString();
    const result = await ResponseService.deleteResponse(responseId);

    if (result.success) {
      res.redirect(`${baseUrl}/${formId}`);
    } else {
      res.status(400).render("error", {
        title: "Błąd",
        message: result.error || "Nie udało się usunąć odpowiedzi",
        baseUrl,
      });
    }
  } catch (error) {
    console.error("Failed to delete response:", error);
    res.status(500).render("error", {
      title: "Błąd",
      message: "Nie udało się usunąć odpowiedzi",
      baseUrl,
    });
  }
});

export default router;
