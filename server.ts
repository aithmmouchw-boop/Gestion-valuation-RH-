import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeEvaluationStore, initializeUserStore, setupApiRoutes } from './src/backend/api';
import { evaluationRepository } from './src/backend/evaluationRepository';
import { initializeProjectSchema } from './src/backend/projectSchema';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  await initializeEvaluationStore();
  await initializeProjectSchema(evaluationRepository.databaseName);
  await initializeUserStore();

  // Mount REST API routes first
  setupApiRoutes(app);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      application: 'Gestion Évaluation RH',
      database: evaluationRepository.databaseName,
      table: process.env.DB_TABLE || 'revue_annuel',
      timestamp: new Date(),
    });
  });

  // Vite development middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Gestion Évaluation RH] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
