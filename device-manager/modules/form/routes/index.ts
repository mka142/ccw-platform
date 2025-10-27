import { Router } from "express";

import apiRoutes from "./api";

/**
 * Form Routes
 * Handles all form-related API endpoints
 */
const router = Router();

// Mount API routes under /api/forms prefix
router.use("/", apiRoutes);

export default router;
