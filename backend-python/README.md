# Foodar Backend API

FastAPI backend for restaurant AR menu platform.

## Quick Start

```bash
# Install dependencies
uv sync

# Setup database
uv run alembic upgrade head

# Run server
uv run uvicorn main:app --reload
```

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

See full documentation in specs/001-foodar-backend-api/quickstart.md
