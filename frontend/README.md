# ACME Salary Intelligence — Frontend

React + Vite + TypeScript frontend for ACME Salary Intelligence.

## Quick Start

```bash
cd frontend

# 1. Install dependencies (requires Node.js 18+)
npm install

# 2. Start the dev server
npm run dev
```

The app will be available at http://localhost:5173

> The dev server proxies `/api/*` calls to the backend at `http://localhost:8000`.
> Start the backend first for a fully functional experience.

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | ESLint check |
| `npm run type-check` | TypeScript type check |

## Project Structure

```
src/
├── app/          # Root providers and router setup
├── components/   # Shared UI components (AppShell, KpiCard, etc.) — added in PR 8
├── features/     # Page-level feature modules — added in PR 9–12
│   ├── dashboard/
│   ├── employees/
│   ├── analytics/
│   └── ask-salary/
├── lib/          # API client, theme, utilities
├── routes/       # Route definitions
└── test/         # Test setup and shared MSW handlers
```
