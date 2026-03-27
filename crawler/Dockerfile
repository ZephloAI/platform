# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip wheel

# Install system deps needed for building some packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget gnupg2 build-essential && \
    rm -rf /var/lib/apt/lists/*

# CPU-only PyTorch (no CUDA libs ~1.5GB saved)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright/Chromium
RUN crawl4ai-setup

# Stage 2: Final slim image
FROM python:3.11-slim

WORKDIR /app

# Install only runtime system deps (Chromium needs these)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget gnupg2 \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libpango-1.0-0 libcairo2 libasound2 libatspi2.0-0 \
    fonts-liberation && \
    rm -rf /var/lib/apt/lists/*

# Copy installed packages, Playwright browsers, and cached model from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /root/.cache/ms-playwright /root/.cache/ms-playwright

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser && \
    mkdir -p /home/appuser/.cache && \
    mv /root/.cache/ms-playwright /home/appuser/.cache/ms-playwright && \
    chown -R appuser:appuser /home/appuser/.cache

COPY . .
RUN chown -R appuser:appuser /app

USER appuser

ENV HF_HOME=/home/appuser/.cache/huggingface
ENV PLAYWRIGHT_BROWSERS_PATH=/home/appuser/.cache/ms-playwright

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
