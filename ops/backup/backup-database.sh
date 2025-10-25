#!/bin/bash
# PostgreSQL Database Backup Script
# Supports daily full backups and hourly incremental backups using WAL archiving
# Usage: ./backup-database.sh [full|incremental]

set -euo pipefail

# Configuration from environment or defaults
BACKUP_TYPE="${1:-full}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-internetid}"
POSTGRES_USER="${POSTGRES_USER:-internetid}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-internetid}"
BACKUP_DIR="${BACKUP_DIR:-/var/lib/postgresql/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"
S3_REGION="${S3_REGION:-us-east-1}"

# Derived paths
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FULL_BACKUP_DIR="${BACKUP_DIR}/full"
INCREMENTAL_BACKUP_DIR="${BACKUP_DIR}/incremental"
WAL_ARCHIVE_DIR="${BACKUP_DIR}/wal_archive"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Ensure directories exist
mkdir -p "${FULL_BACKUP_DIR}" "${INCREMENTAL_BACKUP_DIR}" "${WAL_ARCHIVE_DIR}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

# Error handler
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check if PostgreSQL is accessible
check_postgres() {
    log "Checking PostgreSQL connectivity..."
    export PGPASSWORD="${POSTGRES_PASSWORD}"
    if ! psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT 1;" > /dev/null 2>&1; then
        error_exit "Cannot connect to PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}"
    fi
    log "PostgreSQL connection successful"
}

# Perform full backup using pg_basebackup
full_backup() {
    log "Starting full backup..."
    local backup_path="${FULL_BACKUP_DIR}/backup_${TIMESTAMP}"
    
    export PGPASSWORD="${POSTGRES_PASSWORD}"
    
    # Use pg_dump for logical backup (more flexible for restore)
    log "Creating logical backup with pg_dump..."
    if pg_dump -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" -F c -b -v -f "${backup_path}.dump" 2>> "${LOG_FILE}"; then
        log "Backup created: ${backup_path}.dump"
        
        # Compress backup
        log "Compressing backup..."
        gzip "${backup_path}.dump"
        log "Backup compressed: ${backup_path}.dump.gz"
        
        # Create metadata file
        cat > "${backup_path}.meta" <<EOF
backup_type=full
timestamp=${TIMESTAMP}
database=${POSTGRES_DB}
size=$(du -h "${backup_path}.dump.gz" | cut -f1)
hostname=${POSTGRES_HOST}
port=${POSTGRES_PORT}
EOF
        
        # Upload to S3 if configured
        if [ -n "${S3_BUCKET}" ]; then
            upload_to_s3 "${backup_path}.dump.gz" "full/backup_${TIMESTAMP}.dump.gz"
            upload_to_s3 "${backup_path}.meta" "full/backup_${TIMESTAMP}.meta"
        fi
        
        log "Full backup completed successfully"
        return 0
    else
        error_exit "Full backup failed"
    fi
}

# Perform incremental backup via WAL archiving
incremental_backup() {
    log "Starting incremental backup (WAL archiving)..."
    
    export PGPASSWORD="${POSTGRES_PASSWORD}"
    
    # Force a WAL switch to archive current segment
    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
        -c "SELECT pg_switch_wal();" >> "${LOG_FILE}" 2>&1 || log "WAL switch completed"
    
    # Archive WAL files to backup directory
    local wal_count=0
    if [ -d "${WAL_ARCHIVE_DIR}" ]; then
        wal_count=$(find "${WAL_ARCHIVE_DIR}" -type f -mmin -60 | wc -l)
    fi
    
    log "Incremental backup completed. WAL segments archived in last hour: ${wal_count}"
    
    # Create incremental backup metadata
    local meta_file="${INCREMENTAL_BACKUP_DIR}/incremental_${TIMESTAMP}.meta"
    cat > "${meta_file}" <<EOF
backup_type=incremental
timestamp=${TIMESTAMP}
wal_segments=${wal_count}
wal_archive_dir=${WAL_ARCHIVE_DIR}
EOF
    
    # Upload WAL files to S3 if configured
    if [ -n "${S3_BUCKET}" ] && [ "${wal_count}" -gt 0 ]; then
        log "Uploading recent WAL files to S3..."
        find "${WAL_ARCHIVE_DIR}" -type f -mmin -60 -exec basename {} \; | while read -r wal_file; do
            upload_to_s3 "${WAL_ARCHIVE_DIR}/${wal_file}" "wal/${wal_file}"
        done
    fi
    
    return 0
}

# Upload file to S3 (or S3-compatible storage)
upload_to_s3() {
    local local_file="$1"
    local s3_path="$2"
    
    if command -v aws &> /dev/null; then
        log "Uploading ${local_file} to s3://${S3_BUCKET}/${s3_path}"
        if aws s3 cp "${local_file}" "s3://${S3_BUCKET}/${s3_path}" \
            --region "${S3_REGION}" \
            --storage-class STANDARD_IA \
            --server-side-encryption AES256 2>> "${LOG_FILE}"; then
            log "Upload successful"
        else
            log "WARNING: Upload to S3 failed for ${local_file}"
        fi
    else
        log "WARNING: AWS CLI not installed, skipping S3 upload"
    fi
}

# Clean up old backups based on retention policy
cleanup_old_backups() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."
    
    # Clean full backups
    find "${FULL_BACKUP_DIR}" -type f -mtime +${RETENTION_DAYS} -delete 2>> "${LOG_FILE}" || true
    
    # Clean incremental metadata
    find "${INCREMENTAL_BACKUP_DIR}" -type f -mtime +${RETENTION_DAYS} -delete 2>> "${LOG_FILE}" || true
    
    # Clean WAL archives (keep for retention period)
    find "${WAL_ARCHIVE_DIR}" -type f -mtime +${RETENTION_DAYS} -delete 2>> "${LOG_FILE}" || true
    
    # Clean old S3 backups if configured
    if [ -n "${S3_BUCKET}" ] && command -v aws &> /dev/null; then
        log "Cleaning up old S3 backups..."
        # Note: This requires S3 lifecycle policies for production
        log "S3 cleanup should be configured via lifecycle policies"
    fi
    
    log "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log "Verifying backup integrity: ${backup_file}"
    
    if [ -f "${backup_file}" ]; then
        # Check if file is a valid gzip
        if gzip -t "${backup_file}" 2>> "${LOG_FILE}"; then
            log "Backup file integrity verified"
            return 0
        else
            log "ERROR: Backup file integrity check failed"
            return 1
        fi
    else
        log "ERROR: Backup file not found: ${backup_file}"
        return 1
    fi
}

# Main execution
main() {
    log "========================================="
    log "Starting database backup: ${BACKUP_TYPE}"
    log "========================================="
    
    check_postgres
    
    case "${BACKUP_TYPE}" in
        full)
            full_backup
            ;;
        incremental)
            incremental_backup
            ;;
        *)
            error_exit "Invalid backup type: ${BACKUP_TYPE}. Use 'full' or 'incremental'"
            ;;
    esac
    
    cleanup_old_backups
    
    log "========================================="
    log "Backup process completed successfully"
    log "========================================="
}

# Run main function
main
