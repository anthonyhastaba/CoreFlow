import { z } from 'zod';
import { workflows } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  workflows: {
    list: {
      method: 'GET' as const,
      path: '/api/workflows' as const,
      responses: {
        200: z.array(z.custom<typeof workflows.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/workflows/:id' as const,
      responses: {
        200: z.custom<typeof workflows.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/workflows' as const,
      input: z.object({ description: z.string() }),
      responses: {
        201: z.custom<typeof workflows.$inferSelect>(),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/workflows/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    share: {
      method: 'POST' as const,
      path: '/api/workflows/:id/share' as const,
      responses: {
        200: z.object({ shareId: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    getShared: {
      method: 'GET' as const,
      path: '/api/shared/:shareId' as const,
      responses: {
        200: z.custom<typeof workflows.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    seedDemos: {
      method: 'POST' as const,
      path: '/api/workflows/seed-demos' as const,
      responses: {
        200: z.array(z.custom<typeof workflows.$inferSelect>()),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
