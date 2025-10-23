import { Router } from "express";

import concertRoutes from "./concerts";

/**
 * API Routes Aggregator
 * Combines all API route modules (JSON responses)
 */
const router = Router();

// Mount API route modules
router.use("", concertRoutes);

export default router;
