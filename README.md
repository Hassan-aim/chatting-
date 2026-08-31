# Nexus - Private Real-Time Chat

A production-grade, full-stack real-time chat application designed for secure, private communication between two users.

## Features

- **Real-Time Messaging**: Instant delivery via WebSockets with fallback to REST.
- **Media Support**: Share images, videos, and files with previews.
- **Message Status**: Delivery and read receipts (sent, delivered, read).
- **Typing & Presence**: Live typing indicators and online/offline status.
- **Message Actions**: Reply to messages, edit sent messages, and delete messages.
- **Performance**: Virtualized infinite scrolling for chat history.
- **Security**: JWT authentication, Argon2 password hashing, and rate limiting.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query.
- **Backend**: Python, FastAPI, SQLAlchemy, asyncpg, Uvicorn, WebSockets.
- **Database**: PostgreSQL.
- **Storage**: Local file system (abstracted, ready for S3).
- **Infrastructure**: Docker & Docker Compose.

## Local Setup

### Prerequisites

- Docker and Docker Compose installed.
- Node.js (v18+) for local frontend development (optional).

### Quick Start with Docker

1. **Start the services**:
   ```bash
   docker compose up -d
   ```
   This will start the PostgreSQL database, run backend migrations, start the FastAPI backend, and serve the frontend.

2. **Access the application**:
   - Frontend: http://localhost:5173 (if using Vite proxy) or http://localhost:80
   - Backend API Docs: http://localhost:8000/docs

### Local Development (Without Docker for Backend/Frontend)

If you prefer to run the services locally for development:

1. **Start the database**:
   ```bash
   docker compose up -d postgres
   ```

2. **Setup the backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Run migrations
   alembic upgrade head
   
   # Start the server
   uvicorn app.main:app --reload --port 8000
   ```

3. **Setup the frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Architecture Notes

- **Clean Architecture**: The backend separates models, schemas, repositories, and services.
- **WebSocket Fan-out**: The backend uses an efficient in-memory connection manager to route messages only to active participants of a conversation.
- **Optimistic UI**: The frontend immediately renders sent messages while they are confirmed by the backend, providing a snappy experience.
