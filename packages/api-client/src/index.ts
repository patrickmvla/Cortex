import { hc } from 'hono/client';
import {ApiRoutes} from 'api-server';

export const apiClient = hc<ApiRoutes>('');
export type ApiClient = typeof apiClient;
