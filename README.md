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

---

**Verified architecture facts (from the repository)**
- Monorepo with `apps/web` (Next.js) and `apps/api` (NestJS) and shared tsconfig in `packages/typescript-config`.
- Frontend uses a typed fetch API client at `apps/web/src/lib/api-client.ts` that reads `NEXT_PUBLIC_API_URL` and calls `/api/v1`.
- Backend entry is `apps/api/src/main.ts` — sets API prefix, URI versioning, CORS (`CORS_ORIGINS`), global `ValidationPipe`, `HttpExceptionFilter`, `TransformInterceptor`, and Swagger at `${API_PREFIX}/docs`.
- API response envelope enforced by `TransformInterceptor` (`{ success, data, timestamp }`).
- Prisma + PostgreSQL schema in `apps/api/prisma/schema.prisma` (models: Customer, Vehicle, Mechanic, ServiceCategory, Service, Booking; enums: BookingStatus, MechanicSpecialization).
- Dashboard aggregation logic implemented in `apps/api/src/modules/dashboard/dashboard.service.ts` (uses `groupBy`, `aggregate`, parallel queries, and builds 30-day timeseries).
- Booking lifecycle enforcement exists in `apps/api/src/modules/bookings/bookings.service.ts` using `BookingStatus` and `VALID_TRANSITIONS`.
- `apps/api/package.json` includes a `prebuild` script that runs `prisma generate --schema=prisma/schema.prisma` to ensure the generated Prisma Client before build.
- `.env.example` documents the `DATABASE_URL` format for PostgreSQL and other API envs.

---

**Architecture**

High-level architecture

The project is a focused full-stack monorepo implementing a REST-backed operations dashboard. The UI lives in `apps/web` (Next.js + React) and the API in `apps/api` (NestJS). The frontend communicates with the backend via a small typed fetch client; the backend performs domain logic and persistent storage via Prisma and PostgreSQL.

Frontend architecture

- Next.js App Router for the UI surface. Components use a typed client at `apps/web/src/lib/api-client.ts` for all API calls.
- UI reads a consistent API envelope and handles loading, mutation, and error states using lightweight primitives (skeletons, toasts).

Backend architecture

- NestJS organizes functionality into domain modules (Dashboard, Bookings, Mechanics, Customers, Services, Health).
- Global validation, error formatting, logging and response transformation are applied (`ValidationPipe`, `HttpExceptionFilter`, `LoggingInterceptor`, `TransformInterceptor`).
- Swagger/OpenAPI is configured and served at `/api/docs` for exploration.

Database architecture

- PostgreSQL is modeled with Prisma (`apps/api/prisma/schema.prisma`). Core models include `Booking`, `Mechanic`, `Customer`, `Vehicle`, `Service`, and `ServiceCategory` with indexes to support list and aggregate queries.
- Booking lifecycle is an enum (`BookingStatus`) and transitions are enforced in service logic.

API / request flow

1. Frontend `ApiClient` issues an HTTP request to `/api/v1/<resource>`.
2. NestJS controller validates the request and delegates to services.
3. Services execute Prisma queries (findMany, aggregate, groupBy, update/create).
4. `TransformInterceptor` wraps successful responses in `{ success, data, timestamp }` and the client unwraps `data`.

Dashboard metrics architecture

- `DashboardService` composes parallel Prisma aggregates: counts, sums, `groupBy` for status and per-mechanic counts, and a 30-day booking window for time-series.
- Top mechanics are computed by grouping completed bookings then fetching mechanic rows for metadata, avoiding N+1 queries.

API documentation / Swagger

- Swagger is configured in `apps/api/src/main.ts` and available at `/api/docs` when the API is running. Tags cover health, dashboard, bookings, mechanics, customers and services.

Deployment architecture

- The repo is ready for containerized deployment: `apps/api` is a standard Node/NestJS app, `apps/web` is a Next.js app. Both are environment-driven (`DATABASE_URL`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`).
- The API build now guarantees Prisma Client generation (`prebuild` script), ensuring CI builds are deterministic.

Key design decisions and rationale

- Typed fetch client: minimal runtime dependencies and consistent typing between UI and API.
- Server-side aggregation with Prisma: keeps heavy compute close to data and reduces client complexity.
- Response envelope & global interceptors: consistent API shape and centralized cross-cutting concerns.
- `prebuild` Prisma generation: prevents flaky builds due to a stale generated client and matches CI expectations.

Scalability & extensibility

- Parallel aggregates and DB indexes keep dashboard queries efficient; scaling the DB (read replicas, optimized queries) is the next step for high traffic.
- Modular NestJS services make it straightforward to add new endpoints or replace Prisma queries with tuned SQL or materialized views.

---

**AI Tools Used**

AI tools were used as development assistants during the project.

- **ChatGPT** — Used for debugging, implementation guidance, code review, API design discussions, and troubleshooting deployment issues.
- **Google Gemini** — Used for exploring implementation approaches, debugging, and validating technical decisions.

All final implementation decisions, code integration, testing, and deployment were reviewed and handled as part of the project development process.

