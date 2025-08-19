import { hc } from 'hono/client';

// Create client without explicit typing (fallback approach)
export const api: any = hc(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

// But we can still provide some basic typing
export type ApiClient = typeof api;

// For better typing, you can also create a helper:
export const createApi = (baseUrl: string) => {
  return hc<any>(baseUrl);
};