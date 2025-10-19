import { Router } from 'express';

import apiRoutes from './api';
import viewRoutes from './views';

/**
 * Main Admin Routes Aggregator
 * Combines API routes (/api/*) and view routes (/)
 */
const router = Router();

// Mount API routes under /api prefix
router.use('/api', apiRoutes);

// Mount view routes at root level
router.use('/', viewRoutes);

export default router;
