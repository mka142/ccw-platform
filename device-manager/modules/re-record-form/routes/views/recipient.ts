import { Router } from "express";

import { config } from "@/config";

import { ReRecordFormService } from "../../services/reRecordFormService";
import { ResponseService } from "../../services/responseService";

import type { Request, Response } from "express";

const router = Router();

const baseUrl = config.url.reRecordForm;
const apiBaseUrl = config.url.apiReRecordForm;

/**
 * GET /re-record-forms/recipient/:accessToken - Recipient recording page
 * Accessible via unique access token
 */
router.get("/recipient/:accessToken", async (req: Request, res: Response) => {
  try {
    const accessToken = req.params.accessToken;
    if (!accessToken) {
      return res.status(400).render("error", {
        title: "Błąd",
        message: "Nieprawidłowy token dostępu",
        baseUrl,
      });
    }
    
    const response = await ResponseService.getResponseByToken(accessToken);
    
    if (!response) {
      return res.status(404).render("error", {
        title: "Nie znaleziono",
        message: "Nieprawidłowy lub wygasły link do nagrywania",
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

    const measurementUrl = ReRecordFormService.getMeasurementUrl(form, response.accessToken);

    res.render("recipient_page", {
      title: `Nagrywanie - ${form.name}`,
      form,
      response,
      measurementUrl,
      baseUrl,
      apiBaseUrl,
    });
  } catch (error) {
    console.error("Failed to load recipient page:", error);
    res.status(500).render("error", {
      title: "Błąd",
      message: "Nie udało się załadować strony nagrywania",
      baseUrl,
    });
  }
});

export default router;
