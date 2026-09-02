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
│           ├── lib/          # API client, utilities
│           └── types/        # Shared TypeScript types
├── packages/
│   └── typescript-config/   # Shared strict tsconfig base
└── docs/
    └── architecture.md
```

---

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- PostgreSQL ≥ 15 (local or Docker)

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd instant-mechanic-dashboard
npm install
```

### 2. Configure environment variables

```bash
# API
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — set DATABASE_URL

# Web
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local — set NEXT_PUBLIC_API_URL
```

### 3. Database setup

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run development servers

```bash
# From root — runs all apps concurrently via Turborepo
npm run dev

# Or individually
cd apps/api && npm run start:dev
cd apps/web && npm run dev
```

### 5. API documentation

Once the API is running, visit: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## Available Scripts (root)

| Command | Description |
|---|---|
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Build all apps |
| `npm run lint` | Lint all packages |
| `npm run typecheck` | Run TypeScript checks across the monorepo |
| `npm run format` | Format all files with Prettier |

---

## Phases

| Phase | Status | Description |
|---|---|---|
| Phase 1 | ✅ Complete | Architecture, foundation, Prisma schema |
| Phase 2 | 🔜 Next | Seed data (500+ bookings, 50+ customers, 20+ mechanics) |
| Phase 3 | ⏳ Planned | Real-time dashboard, Socket.IO, live metrics |
| Phase 4 | ⏳ Planned | Full CRUD UI, maps, notifications |

---

## Architecture Decisions

See [docs/architecture.md](./docs/architecture.md) for full rationale.

---

## License

Private — All rights reserved.
