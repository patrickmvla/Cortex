import { Hono } from 'hono';
import auth from './routes/auth';
import query from './routes/query';

const app = new Hono();

const routes = app
  .get('/', (c) => {
    return c.json({
      message: 'Hello Cortex!',
      routes: ['/auth/register', '/auth/login', '/query'],
    });
  })
  .route('/auth', auth)
  .route('/query', query);

export default routes;
export type ApiRoutes = typeof routes;
