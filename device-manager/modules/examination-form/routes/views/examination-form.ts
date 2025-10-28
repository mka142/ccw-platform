import express, { type Request, type Response } from "express";

const router = express.Router();

/**
 * GET /examination-forms/dashboard/:concertId
 * Display examination forms dashboard for a specific concert
 */
router.get("/dashboard/:concertId", async (req: Request, res: Response) => {
  try {
    const { concertId } = req.params;
    
    // Validate concertId parameter
    if (!concertId) {
      res.status(400).json({ error: "Concert ID is required" });
      return;
    }
    
    // Render the dashboard EJS template
    res.render("dashboard", {
      title: "Dashboard Formularzy",
      concertId
    });
  } catch (error: unknown) {
    const message = typeof error === "object" && error && "message" in error 
      ? (error as { message?: string }).message 
      : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /examination-forms/dashboard
 * Display examination forms dashboard (requires concertId as query parameter)
 */
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const { concertId } = req.query;
    
    if (!concertId || typeof concertId !== "string") {
      res.status(400).json({ 
        error: "Concert ID is required as query parameter (?concertId=...)" 
      });
      return;
    }
    
    // Redirect to the parameterized route
    res.redirect(`/examination-forms/dashboard/${concertId}`);
  } catch (error: unknown) {
    const message = typeof error === "object" && error && "message" in error 
      ? (error as { message?: string }).message 
      : String(error);
    res.status(500).json({ error: message });
  }
});

export default router;
