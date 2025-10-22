import http from 'node:http';

import type { Application } from 'express';

export function createServer(app: Application, port: number): http.Server {
  const server = http.createServer(app);

  server.listen(port, () => {
    console.log(`🚀 Admin server running on http://localhost:${port}`);
    console.log(`📊 Dashboard: http://localhost:${port}/`);
    console.log(`🔌 API: http://localhost:${port}/api/`);
    console.log(`💊 Health check: http://localhost:${port}/api/health`);
  });

  return server;
}

/**
 * Graceful shutdown function
 * Call this from your main shutdown handler
 */
export function shutdownServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    console.log('Shutting down HTTP server...');
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      resolve();
    });
  });
}
