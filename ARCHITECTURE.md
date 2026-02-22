# Architecture

This document describes CoreFlow's structure, data flow, and key conventions.

## Commands

```bash
npm run dev       # Start dev server with HMR (runs tsx server/index.ts + Vite middleware)
npm run build     # Build client (Vite) + server (esbuild) → dist/
npm start         # Run production build (node ./dist/index.cjs)
npm run db:push   # Sync Drizzle schema to PostgreSQL (no migration files)
npm run check     # TypeScript type check (no emit)
```

No test framework is configured.

## Architecture

**CoreFlow** is a monorepo with three layers:

```
client/   → React 18 SPA (Vite + TypeScript)
server/   → Express 5 API + Vite dev middleware
shared/   → Zod schemas + route contracts (consumed by both sides)
```

### Data Flow

1. User submits a workflow description on the Generate page
2. `POST /api/workflows` hits `server/routes.ts`
3. Server calls OpenAI (`gpt-5.1`) with a structured prompt, receives JSON back
4. Backend enriches with tool costs from a hardcoded `TOOL_COSTS` map
5. Stored in PostgreSQL via Drizzle ORM (`server/storage.ts` → `DatabaseStorage`)
6. Client navigates to `/workflow/:id` where ROI is calculated client-side

### Shared Contract Pattern

`shared/routes.ts` defines every API endpoint's path, method, and Zod input/output schemas. Both the client hooks (`client/src/hooks/use-workflows.ts`) and server routes (`server/routes.ts`) import from this file — changes to the API shape must be reflected here.

`shared/schema.ts` defines the `workflows` Drizzle table and Zod schemas for workflow steps. `drizzle-zod` auto-generates insert schemas from the table definition.

### Path Aliases

- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

### State Management

All state is server state managed by TanStack React Query. Query keys are the API paths (e.g. `/api/workflows`). No Redux/Zustand. ROI metrics are computed from local React state (user inputs: hourly rate, runs/week).

### UI Stack

Shadcn UI (new-york style) components in `client/src/components/ui/`. Dark mode is the only theme — CSS variables defined in `client/src/index.css`. Framer Motion used for page transitions and flowchart step staggering. Fonts: Inter (body), Outfit (headings).

### Key Pages

| Route | Component | Purpose |
|---|---|---|
| `/` | `Generate.tsx` | Textarea input → triggers AI analysis |
| `/workflow/:id` | `WorkflowDetails.tsx` | Flowchart + ROI calculator + PDF export + share |
| `/library` | `Library.tsx` | Grid of all saved workflows |
| `/shared/:shareId` | `SharedReport.tsx` | Public read-only report |

### Backend Notes

- Dev server: Vite runs as Express middleware (`server/vite.ts`) for HMR
- Production: static files served from `dist/public` (`server/static.ts`)
- On startup, if no workflows exist, 3 demo workflows are auto-seeded

### Environment Variables

```
DATABASE_URL                      # PostgreSQL connection string (required)
OPENAI_API_KEY                    # OpenAI API key
OPENAI_BASE_URL                   # OpenAI base URL
PORT                              # Default 5000
```
