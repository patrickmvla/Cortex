// in /lib/api.ts

// 1. Import the shared client instance from your 'api-client' package
import { api } from 'api-client';

// 2. Re-export it for use within your web-dashboard app
export { api };

// 3. You can also re-export the type if you need it elsewhere
export type { ApiClient } from 'api-client';