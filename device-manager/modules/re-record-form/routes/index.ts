import { Router } from "express";

import apiRoutes from "./api";
import adminViewRoutes from "./views/admin";
import recipientViewRoutes from "./views/recipient";

/**
 * Re-Record Form Routes Aggregator
 * Combines API routes and view routes
 * 
 * Note: Admin routes require authentication, recipient routes are public
 */

// Admin routes (require authentication)
const adminRoutes = Router();
adminRoutes.use("/", adminViewRoutes);

// Public routes (no authentication required)
const publicRoutes = Router();
publicRoutes.use("/", recipientViewRoutes);

export { apiRoutes, adminRoutes, publicRoutes };
export default adminRoutes;

