import bodyParser from 'body-parser';
import express from 'express';

import type { Application } from 'express';

export function setupMiddleware(app: Application): void {
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
}

export function setupErrorHandlers(app: Application): void {
  // Error handling middleware
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
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

  // 404 handler
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
}
