FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN printf '#!/bin/sh\nset -e\necho "==> Checking env vars..."\necho "DATABASE_URL set: $([ -n \"$DATABASE_URL\" ] && echo YES || echo NO)"\necho "DATABASE_URL_SYNC set: $([ -n \"$DATABASE_URL_SYNC\" ] && echo YES || echo NO)"\necho "ENVIRONMENT: $ENVIRONMENT"\necho "Running alembic migrations..."\nalembic upgrade head\necho "Starting uvicorn..."\nexec uvicorn app.main:app --host 0.0.0.0 --port 8000\n' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 8000

CMD ["/app/start.sh"]
