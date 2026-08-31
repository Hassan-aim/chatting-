# Nexus Backend

The backend is built with FastAPI and PostgreSQL, focusing on performance, clean architecture, and secure real-time communication.

## Architecture

The application is structured into the following layers:

- **`app/api/`**: FastAPI route definitions, request validation, and response formatting.
- **`app/services/`**: Core business logic. Handles orchestrating data access and enforcing rules.
- **`app/repositories/`**: Data access layer abstraction using SQLAlchemy.
- **`app/models/`**: SQLAlchemy declarative models representing the database schema.
- **`app/schemas/`**: Pydantic models for serialization and validation.
- **`app/websocket/`**: WebSocket connection management, fan-out logic, and event handlers.
- **`app/core/`**: Configuration, security (JWT, Argon2), and custom error handling.
- **`app/middleware/`**: Rate limiting, security headers, and structured request logging.

## Database Management

Migrations are handled by Alembic.

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

## Running Tests

Tests are written using `pytest` and use an asynchronous test client.

```bash
# Set flag to run database tests
export RUN_DB_TESTS=1

# Run the test suite
pytest tests/ -v
```

## Key Components

### ConnectionManager (`app/websocket/manager.py`)
Manages active WebSocket connections. It tracks which users are online and which conversation each socket is subscribed to. It uses an `asyncio.Lock` to handle concurrent connections safely.

### File Storage (`app/services/upload_service.py`)
Abstracts file storage operations. Currently implements local file storage in the `storage/` directory, but is designed to easily swap to S3 or Google Cloud Storage in the future. Files are streamed to disk for memory efficiency.
