FROM python:3.11-slim

WORKDIR /app

# Upgrade pip and wheel to fix CVE-2026-24049
RUN pip install --no-cache-dir --upgrade pip wheel

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

COPY . .

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Workers, event loop, and HTTP parser tuned for k8s:
# - 2 workers per pod fits the 1000m CPU limit (k8s scales replicas via HPA)
# - uvloop and httptools come with uvicorn[standard] and are faster than the defaults
# Bumping --workers further requires raising Postgres max_connections (pool_size=20 per worker).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--loop", "uvloop", "--http", "httptools"]
