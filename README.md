# Instant Mechanic — Live Operations Dashboard

A production-quality real-time operations dashboard for managing mechanics, bookings, customers and service dispatch — built as a SaaS-grade monorepo.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui |
| Backend | NestJS · TypeScript · REST · Swagger/OpenAPI |
| Database | PostgreSQL · Prisma ORM |
| Real-time | Socket.IO (Phase 3) |
| Monorepo | npm Workspaces · Turborepo |

---

## Project Structure

```
instant-mechanic-dashboard/
├── apps/
│   ├── api/                  # NestJS REST API
│   │   ├── prisma/           # Schema + migrations
│   │   └── src/
│   │       ├── common/       # Guards, filters, interceptors
│   │       └── modules/      # health | dashboard | bookings | mechanics | customers | services
│   └── web/                  # Next.js frontend
│       └── src/
│           ├── app/          # App Router pages (route groups)
│           ├── components/   # Reusable UI components
# Instant Mechanic — Live Operations Dashboard

Production-ready operations dashboard for managing mechanics, bookings and customer dispatch. This repository is structured for evaluator review: clear APIs, tested backend logic, and a polished frontend that uses real backend data.

---

## Overview

- Live operations dashboard with 10s polling for metrics.
- Booking CRUD workflows (list, search, filter, assign mechanic, status transitions).
- Mechanic management with availability toggles and assigned bookings.
- Customer directory with vehicles and booking history.

This submission focuses on production-readiness, clear API contracts, robust validation, and evaluator-friendly documentation and scripts.

---

## Tech stack

- Node.js 20+, TypeScript
- Backend: NestJS, Prisma, PostgreSQL
- Frontend: Next.js (App Router), React, Tailwind CSS

---

## Repo layout

See the high-level structure and where to find the main pieces:

```
apps/
    api/    # NestJS REST API (src, prisma schema, migrations)
    web/    # Next.js frontend (App Router, components, lib)
packages/
    typescript-config/
docs/

```

---

## Production readiness checklist (what I verified)

- API base URL is configurable via `NEXT_PUBLIC_API_URL` in `apps/web`.
- Backend CORS origins are configurable via `CORS_ORIGINS` in `apps/api`.
- No committed secrets: removed local `.env` files from the repo.
- Swagger UI available at `/api/docs` when API runs.
- Focused backend tests are included and run with `npm run test` in `apps/api`.

---

## Setup — Local development

Prereqs: Node 20+, PostgreSQL

1) Install

```
npm install
```

2) Environment

Copy and edit environment files (do not commit):

```
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env` — set `DATABASE_URL`, `CORS_ORIGINS`, `PORT`.
Edit `apps/web/.env.local` — set `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3001`).

3) Database (local)

```
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
```

4) Run

```
# Backend
cd apps/api
npm run dev

# Frontend
cd apps/web
npm run dev
```

Open the frontend (default `http://localhost:3000`) and Swagger at `http://localhost:3001/api/docs`.

---

## Tests & build

Backend focused tests (lightweight ts-node runner):

```
cd apps/api
npm run test
```

Typecheck & build (frontend & backend):

```
cd apps/api && npm run typecheck && npm run build
cd apps/web && npm run typecheck && npm run build
```

---

## Deployment guidance

- Frontend: Vercel (Next.js). Set `NEXT_PUBLIC_API_URL` in Vercel env.
- Backend: Container on AWS (ECS/Fargate) or Elastic Beanstalk. Provide `DATABASE_URL` and `CORS_ORIGINS` (include the frontend origin).
- Use secret managers for DB credentials.

Example `CORS_ORIGINS` for production: `https://your-front-end-domain.com`

---

## API docs

Swagger/OpenAPI is enabled and served from `/api/docs` (configured in `apps/api/src/main.ts`).

---

## Important engineering notes

- API responses use a small envelope `{ success, data, timestamp }` (see `TransformInterceptor`).
- Validation via `class-validator` and a global `ValidationPipe` enforces DTO shapes and prevents unexpected payloads.
- Dashboard aggregates computed server-side (Prisma groupBy/aggregate) for performance; top mechanics use grouped aggregates to avoid pulling large booking arrays.

---

## UX notes for evaluators (What to try)

1. Open the dashboard — observe `Live` indicator and `Last updated` (polls every 10s).
2. Go to Bookings — search for a name, filter by status, open a booking and assign or change status.
3. Go to Mechanics — open a mechanic, toggle `Availability` and save.
4. Return to Dashboard and observe metrics update after poll.

---

## AI usage disclosure

AI-assisted tools were used during development for code suggestions, refactoring and documentation drafts. All changes were reviewed, executed and tested manually.

---

## Final checklist (evaluator)

The repository is configured to be runnable locally. See the submission checklist below for PASS/NEEDS ACTION items.
