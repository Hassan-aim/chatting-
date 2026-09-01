# Render Free-Tier Deployment Guide

## Prerequisites

- GitHub account
- Render account (free tier)

## Step-by-Step Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Create Render Blueprint

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create 3 services:
   - `private-chat-db` (PostgreSQL)
   - `private-chat-api` (Backend Web Service)
   - `private-chat-frontend` (Static Site)

### 3. Wait for Database

Wait for `private-chat-db` to show status **"Available"** (~2 minutes).

### 4. Get Database Connection String

1. Click on **`private-chat-db`**
2. Go to **"Connections"** tab
3. Copy the **"Internal Database URL"** — it looks like:
   ```
   postgresql://chat:abc123@dpg-xxxxx-a.oregon-postgres.render.com:5432/private_chat
   ```

### 5. Configure Backend Environment

1. Go to **`private-chat-api`** → **"Environment"** tab
2. Set these variables:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | `postgresql+asyncpg://` + paste the URL after `postgresql://` |
   | `DATABASE_URL_SYNC` | `postgresql+psycopg://` + paste the URL after `postgresql://` |
   | `CORS_ORIGINS` | `https://your-frontend-url.onrender.com` |

   **Example:**
   If your internal URL is:
   ```
   postgresql://chat:abc123@dpg-xxxxx-a.oregon-postgres.render.com:5432/private_chat
   ```
   Then set:
   ```
   DATABASE_URL = postgresql+asyncpg://chat:abc123@dpg-xxxxx-a.oregon-postgres.render.com:5432/private_chat
   DATABASE_URL_SYNC = postgresql+psycopg://chat:abc123@dpg-xxxxx-a.oregon-postgres.render.com:5432/private_chat
   ```

3. Click **"Save Changes"**

### 6. Configure Frontend Environment

1. Go to **`private-chat-frontend`** → **"Environment"** tab
2. Set these variables:

   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | `https://your-backend-url.onrender.com` |
   | `VITE_WS_BASE_URL` | `wss://your-backend-url.onrender.com` |

   **Note:** The backend URL is displayed at the top of the service page (e.g., `https://private-chat-api.onrender.com`)

3. Click **"Save Changes"**

### 7. Deploy

1. Go to **`private-chat-api`** → **"Manual Deploy"** → **"Deploy latest commit"**
2. Go to **`private-chat-frontend`** → **"Manual Deploy"** → **"Deploy latest commit"**

### 8. Verify

1. Visit `https://your-backend-url.onrender.com/health` — should return `{"status":"ok"}`
2. Visit `https://your-frontend-url.onrender.com` — should show the chat app
3. Register a new account and log in

## Free Tier Limitations

| Limitation | Details |
|------------|---------|
| **Cold starts** | Services spin down after 15 min of inactivity. First request takes ~30s to wake up. |
| **File storage** | Files uploaded via chat are stored locally and **lost on redeploy**. |
| **WebSockets** | Work but disconnect on spin-down. Users need to reconnect. |
| **PostgreSQL** | Free for 90 days, then requires paid plan ($7/month). |
| **Build minutes** | 500 min/month free |

## Troubleshooting

### Backend won't start
- Check **"Logs"** tab in Render dashboard
- Common issues:
  - `DATABASE_URL` missing or wrong format (must use `+asyncpg` and `+psycopg`)
  - `JWT_SECRET_KEY` too short (must be 16+ characters)

### Frontend can't reach API
- Verify `VITE_API_BASE_URL` is set correctly
- Check `CORS_ORIGINS` includes the frontend URL
- **Note:** After changing frontend env vars, you must trigger a **rebuild** (not redeploy)

### Registration/Login fails
- Check backend logs for database connection errors
- Verify `DATABASE_URL` and `DATABASE_URL_SYNC` are both set
- Run a manual deploy to trigger Alembic migrations

## API Endpoints

Once deployed, these endpoints are available:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/refresh` | No | Refresh tokens |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/users/me` | Yes | Get current user |
| GET | `/api/users/search?q=` | Yes | Search users |
| GET | `/api/conversations` | Yes | List conversations |
| POST | `/api/conversations` | Yes | Create conversation |
| GET | `/api/conversations/{id}` | Yes | Get conversation |
| GET | `/api/conversations/{id}/messages` | Yes | List messages |
| POST | `/api/conversations/{id}/messages` | Yes | Send message |
| PATCH | `/api/messages/{id}` | Yes | Edit message |
| DELETE | `/api/messages/{id}` | Yes | Delete message |
| POST | `/api/messages/{id}/read` | Yes | Mark as read |
| POST | `/api/uploads` | Yes | Upload file |
| GET | `/api/attachments/{id}` | Yes | Download attachment |
| WS | `/ws/conversations/{id}` | Yes | WebSocket |
