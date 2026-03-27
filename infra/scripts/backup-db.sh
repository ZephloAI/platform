#!/usr/bin/env bash
# Backup PostgreSQL database from a Kubernetes pod and upload to S3.
# Retains the last 30 backups by removing older ones.
#
# Prerequisites:
#   - kubectl configured with cluster access
#   - aws CLI configured with S3 write permissions
#
# Usage:
#   ./backup-db.sh [namespace]
#
# Arguments:
#   namespace - Kubernetes namespace (default: agent-saas)
#
# Environment variables:
#   S3_BUCKET       - S3 bucket name (default: agent-saas-db-backups)
#   POSTGRES_POD    - Pod name or label selector (default: app=postgres)
#   POSTGRES_DB     - Database name (default: chatbot)
#   POSTGRES_USER   - Database user (default: postgres)
#   MAX_BACKUPS     - Number of backups to retain (default: 30)
#
# Examples:
#   ./backup-db.sh
#   ./backup-db.sh agent-saas
#   S3_BUCKET=my-backups POSTGRES_DB=mydb ./backup-db.sh

set -euo pipefail

NAMESPACE="${1:-agent-saas}"
S3_BUCKET="${S3_BUCKET:-agent-saas-db-backups}"
POSTGRES_POD_LABEL="${POSTGRES_POD:-app=postgres}"
POSTGRES_DB="${POSTGRES_DB:-chatbot}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
MAX_BACKUPS="${MAX_BACKUPS:-30}"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILENAME="backup-${POSTGRES_DB}-${TIMESTAMP}.sql.gz"
LOCAL_TEMP="/tmp/$BACKUP_FILENAME"

# Check for required tools
for cmd in kubectl aws; do
    if ! command -v "$cmd" &>/dev/null; then
        echo "Error: $cmd is not installed."
        exit 1
    fi
done

# Find the postgres pod
POD_NAME=$(kubectl get pods -n "$NAMESPACE" -l "$POSTGRES_POD_LABEL" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [[ -z "$POD_NAME" ]]; then
    echo "Error: No pod found with label '$POSTGRES_POD_LABEL' in namespace '$NAMESPACE'"
    exit 1
fi

echo "Starting database backup..."
echo "  Namespace: $NAMESPACE"
echo "  Pod:       $POD_NAME"
echo "  Database:  $POSTGRES_DB"
echo "  Bucket:    s3://$S3_BUCKET"

# Run pg_dump inside the pod and stream the compressed output locally
kubectl exec -n "$NAMESPACE" "$POD_NAME" -- \
    pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
    | gzip > "$LOCAL_TEMP"

BACKUP_SIZE=$(du -h "$LOCAL_TEMP" | cut -f1)
echo "Backup created: $BACKUP_FILENAME ($BACKUP_SIZE)"

# Upload to S3
echo "Uploading to s3://$S3_BUCKET/$BACKUP_FILENAME..."
aws s3 cp "$LOCAL_TEMP" "s3://$S3_BUCKET/$BACKUP_FILENAME"

# Clean up local temp file
rm -f "$LOCAL_TEMP"

# Remove old backups beyond the retention limit
echo "Enforcing retention policy (keeping last $MAX_BACKUPS backups)..."
EXISTING_BACKUPS=$(aws s3 ls "s3://$S3_BUCKET/backup-${POSTGRES_DB}-" | sort -r | awk '{print $4}')
BACKUP_COUNT=0

for BACKUP in $EXISTING_BACKUPS; do
    BACKUP_COUNT=$((BACKUP_COUNT + 1))
    if [[ $BACKUP_COUNT -gt $MAX_BACKUPS ]]; then
        echo "  Removing old backup: $BACKUP"
        aws s3 rm "s3://$S3_BUCKET/$BACKUP"
    fi
done

echo "Done. Backup uploaded to s3://$S3_BUCKET/$BACKUP_FILENAME"
