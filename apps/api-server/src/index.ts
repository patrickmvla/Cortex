import { Hono } from 'hono';
import auth from './routes/auth';
import query from './routes/query';
import documents from './routes/documents';

const app = new Hono();

const routes = app
  .get('/', (c) => {
    return c.json({
      message: 'Hello Cortex!',
      routes: ['/auth/register', '/auth/login', '/query', '/documents/upload'],
    });
  })
  .route('/auth', auth)
  .route('/query', query)
  .route('/documents', documents);

export default routes;
export type ApiRoutes = typeof routes;
