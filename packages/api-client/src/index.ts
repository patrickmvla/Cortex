import { hc } from 'hono/client';
import type { AppType } from 'api-server';

// Create the client with the explicit type
export const apiClient = (baseUrl: string) => {
  return hc<AppType>(baseUrl);
};

// Create a default instance
export const api = hc<AppType>('/api');

export type ApiClient = typeof api;