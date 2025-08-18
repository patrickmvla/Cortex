import { hc } from 'hono/client';
import type { appRoutes } from 'api-server';

export const apiClient = hc<typeof appRoutes>('/api');
export type ApiClient = typeof apiClient;