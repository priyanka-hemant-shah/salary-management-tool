# ACME Salary Intelligence — Backend

FastAPI backend providing salary data APIs for 10,000 employees.

> **DEMO NOTICE**: Authentication is simulated (no real auth). Do not use real employee data.

## Quick Start

```bash
cd backend

# 1. Create a virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # macOS/Linux

# 2. Install dependencies
pip install -e ".[dev]"

# 3. Configure environment
copy .env.example .env
# Edit .env if needed (SQLite is the default — no DB install required)

# 4. Start the API server
uvicorn app.main:app --reload --port 8000
```

The API will be available at http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Running Tests

```bash
# All tests with coverage
pytest

# Specific test file
pytest tests/test_health.py -v

# Coverage report only
pytest --cov=app --cov-report=html
```

## Environment Variables

See `.env.example` for all available configuration options.

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | SQLite (local file) | Switch to PostgreSQL URL when available |
| `GEMINI_API_KEY` | (empty) | Optional — enables live AI. App works in demo mode without it |
| `APP_ENV` | `development` | Set to `production` in deployment |
| `CORS_ORIGINS` | localhost:5173 | Frontend URL(s) allowed to call the API |

## Database

- **Local dev**: SQLite (default, no install required)
- **Production**: PostgreSQL (set `DATABASE_URL` accordingly)

Migrations are managed with Alembic (added in PR 2).

