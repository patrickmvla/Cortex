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
// CORRECT HONO V4 TYPE EXPORT (NO $api NEEDED)
export type ApiRoutes = typeof routes;

// TYPE VALIDATION GUARD (PREVENTS FUTURE BREAKAGE)
// import { type Hono } from 'hono';
// const _typeCheck: Hono = routes;