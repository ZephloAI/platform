#!/bin/bash
# Create Kubernetes secrets for the agent-saas namespace.
# IMPORTANT: Never commit real secret values to this file.
# Copy this to a local (gitignored) version and fill in real values before running.

set -euo pipefail

NAMESPACE="agent-saas"

# Validate required env vars
: "${DB_USER:?Set DB_USER}"
: "${DB_PASSWORD:?Set DB_PASSWORD}"
: "${DB_NAME:?Set DB_NAME}"
: "${JWT_SECRET:?Set JWT_SECRET}"
: "${OPENROUTER_API_KEY:?Set OPENROUTER_API_KEY}"
: "${AWS_ACCESS_KEY_ID:?Set AWS_ACCESS_KEY_ID}"
: "${AWS_SECRET_ACCESS_KEY:?Set AWS_SECRET_ACCESS_KEY}"
: "${S3_BUCKET_NAME:?Set S3_BUCKET_NAME}"
: "${AWS_REGION:?Set AWS_REGION}"
: "${DOCKERHUB_USERNAME:?Set DOCKERHUB_USERNAME}"
: "${DOCKERHUB_TOKEN:?Set DOCKERHUB_TOKEN}"
: "${DOCKERHUB_EMAIL:?Set DOCKERHUB_EMAIL}"

# Database credentials
sudo kubectl create secret generic db-credentials \
    -n "$NAMESPACE" \
    --from-literal=POSTGRES_USER="$DB_USER" \
    --from-literal=POSTGRES_PASSWORD="$DB_PASSWORD" \
    --from-literal=POSTGRES_DB="$DB_NAME" \
    --from-literal=DATABASE_URL="postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}" \
    --from-literal=DATABASE_URL_SYNC="postgresql+psycopg://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}" \
    --from-literal=DATABASE_URL_ASYNCPG="postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}"

# Application secrets
sudo kubectl create secret generic app-secrets \
    -n "$NAMESPACE" \
    --from-literal=JWT_SECRET="$JWT_SECRET" \
    --from-literal=JWT_ALGORITHM=HS256 \
    --from-literal=JWT_EXPIRE_MINUTES=1440 \
    --from-literal=OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
    --from-literal=LLM_MODEL="${LLM_MODEL:-google/gemini-3-flash-preview}" \
    --from-literal=OPENROUTER_MODEL="${OPENROUTER_MODEL:-google/gemini-3-flash-preview}" \
    --from-literal=ELEVEN_LABS_API_KEY="${ELEVEN_LABS_API_KEY:-}" \
    --from-literal=ELEVEN_LABS_VOICE_ID="${ELEVEN_LABS_VOICE_ID:-}" \
    --from-literal=ELEVEN_LABS_MODEL_ID="${ELEVEN_LABS_MODEL_ID:-eleven_multilingual_v2}"\
    --from-literal=RESEND_API_KEY="${RESEND_API_KEY:-}"\
    --from-literal=RESEND_FROM_EMAIL='Zephlo <invites@zephlo.ai>' \
    --from-literal=RESEND_INVITE_TEMPLATE_ID='invite'


# AWS credentials
sudo kubectl create secret generic aws-credentials \
    -n "$NAMESPACE" \
    --from-literal=AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
    --from-literal=AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
    --from-literal=S3_BUCKET_NAME="$S3_BUCKET_NAME" \
    --from-literal=AWS_REGION="$AWS_REGION"

# Docker Hub pull secret
sudo kubectl create secret docker-registry dockerhub-pull-secret \
    -n "$NAMESPACE" \
    --docker-server=https://index.docker.io/v1/ \
    --docker-username="$DOCKERHUB_USERNAME" \
    --docker-password="$DOCKERHUB_TOKEN" \
    --docker-email="$DOCKERHUB_EMAIL"

echo "All secrets created in namespace $NAMESPACE"
