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

  setupGracefulShutdown(server);

  return server;
}

function setupGracefulShutdown(server: http.Server): void {
  const shutdown = () => {
    console.log('Shutdown signal received, closing gracefully');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
