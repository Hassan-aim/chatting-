FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render provides postgresql:// URLs; the app needs driver-specific prefixes.
# This script patches them at startup so DATABASE_URL stays untouched.
RUN printf '#!/bin/sh\nset -e\nif [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -qE "^postgresql://"; then\n  export DATABASE_URL=$(echo "$DATABASE_URL" | sed "s|^postgresql://|postgresql+asyncpg://|")\n  export DATABASE_URL_SYNC=$(echo "$DATABASE_URL_SYNC" | sed "s|^postgresql://|postgresql+psycopg://|")\nfi\nalembic upgrade head\nexec uvicorn app.main:app --host 0.0.0.0 --port 8000\n' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 8000

CMD ["/app/start.sh"]
