import { Router } from "express";

import apiRoutes from "./api";

/**
 * User Routes
 * Handles all user-related API endpoints
 */
const router = Router();

// Mount API routes under /api/users prefix
router.use("", apiRoutes);

export default router;
