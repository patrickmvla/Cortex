import { hc } from 'hono/client';
import type routes from 'api-server';

export const apiClient = hc<typeof routes>('/');
export type ApiClient = typeof apiClient;
