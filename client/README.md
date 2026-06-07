# FinTrack — Frontend

React + TypeScript + Vite app for the FinTrack personal finance dashboard.

## Setup

```bash
pnpm install
cp .env.example .env   # add your Clerk publishable key
pnpm dev
```

App runs at http://localhost:5173 and talks to the FastAPI backend (default `http://127.0.0.1:8000`).

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build` | Type-check and production build |
| `pnpm lint` | Run ESLint |
| `pnpm preview` | Preview production build locally |

## Structure

```
src/
├── api/           # Axios client and endpoint modules
├── app/           # Router and Redux store
├── components/    # Reusable UI and feature widgets
├── layouts/       # Public and authenticated shell layouts
├── pages/         # Route-level screens (public/ and app/)
└── types/         # Shared TypeScript types
```

See the [root README](../README.md) for full project setup, database, and Makefile commands.
