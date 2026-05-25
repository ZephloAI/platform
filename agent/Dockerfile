# Agent RUNTIME image.
#
# The heavy setup (CPU PyTorch, the pre-downloaded embedding model) lives in the
# base image — built from Dockerfile.base and published to Docker Hub as
# flunkie/agent-base. Here we install the app's Python deps and copy the code,
# so this build is fast.
#
# When you change requirements.txt, this rebuilds quickly; rebuild & push the
# base image only when torch / the model / sentence-transformers change.

ARG AGENT_BASE=flunkie/agent-base:latest
FROM ${AGENT_BASE}

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code, owned by the non-root user created in the base image
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8002

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
