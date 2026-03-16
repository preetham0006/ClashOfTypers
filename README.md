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

Optional for later multiplayer infra tests:

- Docker Desktop (Postgres/Redis containers)

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

2. Create env files from examples:

```bash
copy .env.example .env
copy apps\server\.env.example apps\server\.env
copy apps\web\.env.local.example apps\web\.env.local
```

3. Generate Prisma client and run first migration:

```bash
npm run db:generate
npm run db:migrate
```

4. Optional seed data:

```bash
npm run db:seed
```

5. Start web + server together:

```bash
npm run dev
```

## Day 1 Verification Checklist

- Web runs at `http://localhost:3000`
- Server health check works at `http://localhost:4000/health`
- Prisma migration succeeds with local SQLite database

## Optional Docker Services

If you want containerized Postgres/Redis later:

```bash
docker compose up -d
```
- Prisma migration succeeds

## What Comes Next (Day 2)

- Signup/login API
- JWT-based auth
- Protected routes in frontend
