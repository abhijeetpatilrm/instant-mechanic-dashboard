# Architecture Decision Records

## Overview

Instant Mechanic is a live operations dashboard for dispatching mechanics to customer bookings.
This document captures the key architectural decisions made in Phase 1.

---

## ADR-001: Monorepo with Turborepo

**Decision**: npm workspaces + Turborepo for task orchestration.

**Rationale**:
- Turborepo provides remote caching and parallel task execution with minimal config.
- npm workspaces avoids introducing another package manager (yarn/pnpm).
- Avoids Nx complexity for a two-app monorepo.

---

## ADR-002: NestJS Modular Monolith

**Decision**: Single NestJS application with feature modules (not microservices).

**Rationale**:
- Microservices add operational overhead (service discovery, inter-service auth, distributed tracing) before product-market fit.
- NestJS modules enforce clear boundaries; migrating to microservices later is feasible by splitting modules.
- Modules: `health`, `dashboard`, `bookings`, `mechanics`, `customers`, `services`.

---

## ADR-003: Prisma as ORM

**Decision**: Prisma ORM co-located in `apps/api`.

**Rationale**:
- Prisma Client is not a shared library — it's generated specifically for the API's database schema.
- Type-safe query builder eliminates a class of runtime SQL errors.
- `prisma generate` is run as part of `postinstall` to keep the client in sync.
- Schema lives at `apps/api/prisma/schema.prisma`.

---

## ADR-004: Booking Status Lifecycle

**Decision**: Explicit state machine with validated transitions.

States:
```
PENDING → ASSIGNED → MECHANIC_ON_THE_WAY → IN_PROGRESS → COMPLETED
                  ↓                    ↓               ↓
               CANCELLED           CANCELLED       CANCELLED
```

**Rationale**:
- Invalid transitions (e.g. COMPLETED → PENDING) are rejected at the service layer.
- Timestamps (`startedAt`, `completedAt`, `cancelledAt`) are auto-set on transition.

---

## ADR-005: Next.js App Router with Route Groups

**Decision**: `(dashboard)` route group with a shared shell layout.

**Rationale**:
- Route groups allow the sidebar layout to be shared across `/dashboard`, `/bookings`, `/mechanics`, `/customers` without polluting the URL.
- Server Components by default — pages are server-rendered and data is fetched on the server.
- Client components only where interactivity is needed (sidebar active state, forms).

---

## ADR-006: Typed API Client (No Axios)

**Decision**: Native `fetch` with typed wrappers in `src/lib/api-client.ts`.

**Rationale**:
- Avoids a runtime dependency for a thin wrapper.
- Next.js 14 extends fetch with built-in caching and revalidation.
- `ApiClientError` class provides structured error handling.

---

## ADR-007: CSS Variable Design Tokens

**Decision**: Tailwind CSS variables (HSL) for the entire design system.

**Rationale**:
- Single source of truth for light/dark mode.
- Easily overridable per-theme without Tailwind config changes.
- Follows the shadcn/ui convention, making component addition seamless.

---

## Database Schema Design

| Model | Key indexes |
|---|---|
| `Customer` | `email`, `phone`, `createdAt` |
| `Vehicle` | `customerId`, `licensePlate` |
| `Mechanic` | `isAvailable`, `isActive`, `rating` |
| `Booking` | `status`, `scheduledAt`, `customerId`, `mechanicId`, composite `(status, scheduledAt)` |
| `Service` | `categoryId`, `isActive` |

Composite index `(status, scheduledAt)` covers the most common dashboard query: "show me all PENDING bookings scheduled today, sorted by time."

---

## Directory Structure

```
instant-mechanic-dashboard/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── app.module.ts
│   │       ├── main.ts
│   │       ├── common/
│   │       │   ├── dto/pagination.dto.ts
│   │       │   ├── filters/http-exception.filter.ts
│   │       │   ├── interceptors/
│   │       │   │   ├── logging.interceptor.ts
│   │       │   │   └── transform.interceptor.ts
│   │       │   └── prisma/
│   │       │       ├── prisma.module.ts
│   │       │       └── prisma.service.ts
│   │       └── modules/
│   │           ├── health/
│   │           ├── dashboard/
│   │           ├── bookings/
│   │           ├── mechanics/
│   │           ├── customers/
│   │           └── services/
│   └── web/
│       └── src/
│           ├── app/
│           │   ├── globals.css
│           │   ├── layout.tsx
│           │   ├── page.tsx          (redirect → /dashboard)
│           │   └── (dashboard)/
│           │       ├── layout.tsx
│           │       ├── dashboard/page.tsx
│           │       ├── bookings/page.tsx
│           │       ├── mechanics/page.tsx
│           │       └── customers/page.tsx
│           ├── components/
│           │   ├── layout/sidebar.tsx
│           │   └── ui/               (button, card, badge, skeleton)
│           ├── lib/
│           │   ├── api-client.ts
│           │   └── utils.ts
│           └── types/
│               └── api.ts
└── packages/
    └── typescript-config/
        ├── package.json
        └── tsconfig.base.json
```
