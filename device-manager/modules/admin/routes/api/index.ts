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
  const health = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };

  // Check if critical thresholds are exceeded
  if (health.memory.used > 400) {
    // 400MB threshold
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
