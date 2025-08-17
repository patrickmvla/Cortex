import { Hono } from 'hono';
import auth from './routes/auth';
import query from './routes/query';
import documents from './routes/documents';
import validate from './routes/validate';

const app = new Hono();

export const routes = app
  .get('/', (c) => {
    return c.json({
      message: 'Hello Cortex!',
      routes: [
        '/auth/register',
        '/auth/login',
        '/query',
        '/documents/upload',
        '/validate',
      ],
    });
  })
  .route('/auth', auth)
  .route('/query', query)
  .route('/documents', documents)
  .route('/validate', validate);

export type ApiRoutes = typeof routes;
