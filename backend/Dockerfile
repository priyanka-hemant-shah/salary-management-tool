FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency specifications
COPY pyproject.toml ./

# Install python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir hatchling && \
    pip install --no-cache-dir .

# Copy application source code
COPY app/ ./app/
COPY alembic.ini ./
COPY alembic/ ./alembic/

EXPOSE 8000

ENV APP_ENV=production
ENV DEMO_MODE=true
ENV DATABASE_URL=sqlite+aiosqlite:///./acme_salary.db

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

