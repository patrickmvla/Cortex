import { Hono } from 'hono';
import auth from './routes/auth';

const app = new Hono();

const routes = app
  .get('/', (c) => {
    return c.json({
      message: 'Hello Cortex!',
      routes: ['/auth/register', '/auth/login'],
    });
  })
  .route('/auth', auth);

export default routes;
export type ApiRoutes = typeof routes;
