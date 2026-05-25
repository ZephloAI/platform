# Crawler RUNTIME image.
#
# All the heavy, slow-changing dependencies (Python packages, CPU PyTorch,
# scrapy-playwright + Chromium, the embedding model, and the system libraries
# Chromium needs) live in the base image — built from Dockerfile.base and
# published to Docker Hub as flunkie/crawler-base. Here we only copy the
# application code on top, so this build takes seconds.
#
# When you change requirements.txt or the system deps, rebuild & push the base
# image (see the header of Dockerfile.base), then rebuild this one.

ARG CRAWLER_BASE=flunkie/crawler-base:latest
FROM ${CRAWLER_BASE}

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code, owned by the non-root user created in the base image
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
