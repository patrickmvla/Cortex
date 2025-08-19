import type { Hono } from 'hono';
import { z } from 'zod';
import { uploadSchema } from '../routes/documents';
import { registerSchema, loginSchema } from '../routes/auth';
import { querySchema } from '../routes/query';
import { validationSchema } from '../routes/validate';

// Schema types for each route
export type DocumentsSchema = {
  '/': {
    $get: {
      input: {};
      output: Array<{
        id: string;
        userId: string;
        title: string;
        sourceType: string;
        sourceUrl: string;
        content: string;
        createdAt: string;
        updatedAt: string;
      }>;
    };
  };
  '/upload': {
    $post: {
      input: {
        form: z.infer<typeof uploadSchema>;
      };
      output: {
        message: string;
        fileUrl: string;
      } | {
        error: string;
      };
    };
  };
};

export type AuthSchema = {
  '/register': {
    $post: {
      input: {
        json: z.infer<typeof registerSchema>;
      };
      output: {
        message: string;
      } | {
        error: string;
      };
    };
  };
  '/login': {
    $post: {
      input: {
        json: z.infer<typeof loginSchema>;
      };
      output: {
        token: string;
      } | {
        error: string;
      };
    };
  };
};

export type QuerySchema = {
  '/': {
    $post: {
      input: {
        json: z.infer<typeof querySchema>;
      };
      output: ReadableStream; // Streaming response
    };
  };
};

export type ValidateSchema = {
  '/': {
    $post: {
      input: {
        json: z.infer<typeof validationSchema>;
      };
      output: ReadableStream; // Streaming response
    };
  };
};

// Full schema type
export type AppSchema = {
  '/documents': DocumentsSchema;
  '/auth': AuthSchema;
  '/query': QuerySchema;
  '/validate': ValidateSchema;
};

// Extended Hono type
export type AppTypeExtended = Hono<any, AppSchema, any>;