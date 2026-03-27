#!/usr/bin/env bash
# Create a SealedSecret from a .env file using kubeseal.
#
# Prerequisites:
#   - kubectl configured with cluster access
#   - kubeseal CLI installed (https://github.com/bitnami-labs/sealed-secrets)
#
# Usage:
#   ./seal-secret.sh <env-file> <secret-name> <namespace>
#
# Arguments:
#   env-file     - Path to the .env file with key=value pairs
#   secret-name  - Name for the Kubernetes Secret
#   namespace    - Target namespace for the Secret
#
# Examples:
#   ./seal-secret.sh .env app-secrets agent-saas
#   ./seal-secret.sh api/.env api-secrets agent-saas

set -euo pipefail

ENV_FILE="${1:-}"
SECRET_NAME="${2:-}"
NAMESPACE="${3:-}"

# Validate arguments
if [[ -z "$ENV_FILE" || -z "$SECRET_NAME" || -z "$NAMESPACE" ]]; then
    echo "Error: All arguments are required."
    echo "Usage: $0 <env-file> <secret-name> <namespace>"
    echo "Example: $0 .env app-secrets agent-saas"
    exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: File not found: $ENV_FILE"
    exit 1
fi

# Check for required tools
for cmd in kubectl kubeseal; do
    if ! command -v "$cmd" &>/dev/null; then
        echo "Error: $cmd is not installed."
        exit 1
    fi
done

# Resolve output directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../k8s/base/secrets"
mkdir -p "$OUTPUT_DIR"

OUTPUT_FILE="$OUTPUT_DIR/${SECRET_NAME}-sealed.yaml"

echo "Creating SealedSecret..."
echo "  Source:    $ENV_FILE"
echo "  Name:      $SECRET_NAME"
echo "  Namespace: $NAMESPACE"
echo "  Output:    $OUTPUT_FILE"

# Build --from-env-file creates a Secret from key=value pairs in the .env file
kubectl create secret generic "$SECRET_NAME" \
    --namespace="$NAMESPACE" \
    --from-env-file="$ENV_FILE" \
    --dry-run=client \
    -o yaml \
    | kubeseal \
        --format yaml \
        --namespace "$NAMESPACE" \
    > "$OUTPUT_FILE"

echo "Done. SealedSecret written to $OUTPUT_FILE"
echo "Commit this file to Git -- the sealed values are safe to store in version control."
