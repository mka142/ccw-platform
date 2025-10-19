import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import bodyParser from 'body-parser';
import express from 'express';

import adminRoutes from './routes';

import type { Application } from 'express';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = path.dirname(currentFilename);

const app: Application = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Configure Express
app.set('view engine', 'ejs');
app.set('views', path.join(currentDirname, './views')); // Point to existing views
app.use(express.static(path.join(currentDirname, '../../admin/public'))); // Point to existing static files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Register admin routes
// API routes will be available at /api/*
// View routes will be available at /*
app.use('/', adminRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  // If headers already sent, delegate to default handler
  if (res.headersSent) {
    return next(err);
  }
  const isApi = req.path?.startsWith('/api');
  if (isApi) {
    res.status(500).json({ success: false, error: 'Internal server error' });
    return;
  }
  res.status(500).render('error', {
    title: 'Błąd',
    message: 'Wystąpił błąd serwera',
  });
});

// 404 handler (leave as last middleware)
app.use((req: express.Request, res: express.Response) => {
  const isApi = req.path?.startsWith('/api');
  if (isApi) {
    res.status(404).json({ success: false, error: 'API endpoint not found' });
    return;
  }
  res.status(404).render('error', {
    title: 'Nie znaleziono',
    message: 'Strona nie została znaleziona',
  });
});

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Admin server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app;
