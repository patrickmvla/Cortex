import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth';
import documents from './routes/documents';
import query from './routes/query';
import validate from './routes/validate';

const app = new Hono();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

const routes = app
  .route('/auth', auth)
  .route('/query', query)
  .route('/documents', documents)
  .route('/validate', validate);

export default {
  fetch: routes.fetch,
  port: process.env.PORT || 8787,
};

export const appRoutes = routes;
export type AppType = typeof appRoutes; 