#!/usr/bin/env bash
# Build and push a Docker image for a service to Docker Hub.
#
# Usage:
#   ./build-and-push.sh <service> [tag]
#
# Arguments:
#   service  - Service to build (api, crawler, agent, frontend, widget)
#   tag      - Optional image tag (defaults to current git SHA)
#
# Examples:
#   ./build-and-push.sh api v1.0.0
#   ./build-and-push.sh frontend
#   ./build-and-push.sh crawler latest

set -euo pipefail

VALID_SERVICES="api crawler agent frontend landing widget"
REGISTRY="${DOCKER_REGISTRY:-docker.io}"
PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"
ORG="${DOCKERHUB_USERNAME:-zephlo}"  # Set via env or override here

SERVICE="${1:-}"
TAG="${2:-$(git rev-parse --short HEAD)}"

# Validate arguments
if [[ -z "$SERVICE" ]]; then
    echo "Error: Service name is required."
    echo "Usage: $0 <service> [tag]"
    echo "Valid services: $VALID_SERVICES"
    exit 1
fi

if ! echo "$VALID_SERVICES" | grep -qw "$SERVICE"; then
    echo "Error: Invalid service '$SERVICE'."
    echo "Valid services: $VALID_SERVICES"
    exit 1
fi

# Resolve the project root (one level up from infra/scripts/)
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SERVICE_DIR="$PROJECT_ROOT/$SERVICE"

if [[ ! -d "$SERVICE_DIR" ]]; then
    echo "Error: Service directory not found at $SERVICE_DIR"
    exit 1
fi

IMAGE="$REGISTRY/$ORG/$SERVICE:$TAG"
IMAGE_LATEST="$REGISTRY/$ORG/$SERVICE:latest"

echo "Building $SERVICE..."
echo "  Image: $IMAGE"

# Frontend builds from project root with special context and build args
if [[ "$SERVICE" == "frontend" ]]; then
    echo "  Context: $PROJECT_ROOT (frontend uses project root)"
    docker build \
        --platform "$PLATFORM" \
        -t "$IMAGE" -t "$IMAGE_LATEST" \
        -f "$PROJECT_ROOT/frontend/Dockerfile" \
        --build-arg ENV=dev \
        --build-arg NGINX_CONF=nginx-k8s.conf \
        "$PROJECT_ROOT"
else
    echo "  Context: $SERVICE_DIR"
    docker build --platform "$PLATFORM" -t "$IMAGE" -t "$IMAGE_LATEST" "$SERVICE_DIR"
fi

echo "Pushing $IMAGE..."
docker push "$IMAGE"

echo "Pushing $IMAGE_LATEST..."
docker push "$IMAGE_LATEST"

echo "Done. Image available at:"
echo "  $IMAGE"
echo "  $IMAGE_LATEST"
