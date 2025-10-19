import { Router } from 'express';

import concertRoutes from './concerts';

/**
 * API Routes Aggregator
 * Combines all API route modules (JSON responses)
 */
const router = Router();

// Mount API route modules
router.use('/concerts', concertRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Admin API is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
