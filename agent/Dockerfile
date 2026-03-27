# Stage 1: Build dependencies
FROM python:3.13-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip wheel

# CPU-only PyTorch (no CUDA libs ~1.5GB saved)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# Stage 2: Final slim image
FROM python:3.13-slim

WORKDIR /app

# Copy only installed packages and cached model from builder
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser && \
    mkdir -p /home/appuser/.cache  && \
    chown -R appuser:appuser /home/appuser/.cache

ENV HF_HOME=/home/appuser/.cache/huggingface

COPY . .
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8002

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
