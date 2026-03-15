# ClashOfTypers

Real-time multiplayer typing battles with private rooms, timed rounds, and best-of match formats.

## Day 1 Setup Complete

This repository is scaffolded as a monorepo with:

- `apps/web`: Next.js frontend (TypeScript + Tailwind)
- `apps/server`: Express + Socket.IO backend (TypeScript + Prisma)
- `packages/shared`: shared types/constants
- `docker-compose.yml`: local Postgres and Redis

## Prerequisites

- Node.js 20+
- Docker Desktop

## Project Structure

```text
apps/
	web/
	server/
packages/
	shared/
```

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start Postgres and Redis:

```bash
docker compose up -d
```

3. Create env files from examples:

```bash
copy .env.example .env
copy apps\server\.env.example apps\server\.env
copy apps\web\.env.local.example apps\web\.env.local
```

4. Generate Prisma client and run first migration:

```bash
npm run db:generate
npm run db:migrate
```

5. Optional seed data:

```bash
npm run db:seed
```

6. Start web + server together:

```bash
npm run dev
```

## Day 1 Verification Checklist

- Web runs at `http://localhost:3000`
- Server health check works at `http://localhost:4000/health`
- Postgres and Redis containers are up
- Prisma migration succeeds

## What Comes Next (Day 2)

- Signup/login API
- JWT-based auth
- Protected routes in frontend
