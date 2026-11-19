#!/bin/sh
set -e

BACKUP_FILE="$1"

if [ -z "${BACKUP_FILE}" ]; then
    echo "Usage: $0 /backups/aegis_db_backup_YYYYMMDD_HHMMSS.sql.gz"
    echo "Available backups in /backups:"
    ls -lh /backups/aegis_db_backup_*.sql.gz 2>/dev/null || echo "No backup archives found."
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file ${BACKUP_FILE} does not exist."
    exit 1
fi

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] CAUTION: Restoring database from ${BACKUP_FILE}..."
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Target Database: ${POSTGRES_DB:-aegis_db} on ${POSTGRES_HOST:-postgres}"

# Restore compressed dump using gunzip piped to psql
gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST:-postgres}" -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-aegis_db}"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Database restore finished successfully."
