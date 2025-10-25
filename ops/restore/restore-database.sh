#!/bin/bash
# PostgreSQL Database Restore Script
# Supports full restore, point-in-time recovery (PITR), and partial table restore
# Usage: ./restore-database.sh [full|pitr|partial] [options]

set -euo pipefail

# Configuration from environment or defaults
RESTORE_TYPE="${1:-full}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-internetid}"
POSTGRES_USER="${POSTGRES_USER:-internetid}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-internetid}"
BACKUP_DIR="${BACKUP_DIR:-/var/lib/postgresql/backups}"
RESTORE_TARGET_TIME="${RESTORE_TARGET_TIME:-}"
RESTORE_TABLES="${RESTORE_TABLES:-}"
BACKUP_FILE="${BACKUP_FILE:-}"
LOG_FILE="${BACKUP_DIR}/restore.log"

# Ensure directories exist
mkdir -p "${BACKUP_DIR}"

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
    if ! psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
        error_exit "Cannot connect to PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}"
    fi
    log "PostgreSQL connection successful"
}

# Find latest backup file
find_latest_backup() {
    local backup_pattern="${BACKUP_DIR}/full/backup_*.dump.gz"
    local latest_backup=$(ls -t ${backup_pattern} 2>/dev/null | head -1)
    
    if [ -z "${latest_backup}" ]; then
        error_exit "No backup files found in ${BACKUP_DIR}/full/"
    fi
    
    echo "${latest_backup}"
}

# Download backup from S3 if needed
download_from_s3() {
    local s3_path="$1"
    local local_file="$2"
    
    if [ -n "${S3_BUCKET:-}" ] && command -v aws &> /dev/null; then
        log "Downloading from s3://${S3_BUCKET}/${s3_path}"
        if aws s3 cp "s3://${S3_BUCKET}/${s3_path}" "${local_file}" \
            --region "${S3_REGION:-us-east-1}" 2>> "${LOG_FILE}"; then
            log "Download successful"
            return 0
        else
            error_exit "Failed to download from S3"
        fi
    else
        error_exit "S3 bucket not configured or AWS CLI not available"
    fi
}

# Perform full database restore
full_restore() {
    log "Starting full database restore..."
    
    # Determine backup file to restore
    local restore_file="${BACKUP_FILE}"
    if [ -z "${restore_file}" ]; then
        restore_file=$(find_latest_backup)
    fi
    
    log "Using backup file: ${restore_file}"
    
    # Verify backup file exists
    if [ ! -f "${restore_file}" ]; then
        error_exit "Backup file not found: ${restore_file}"
    fi
    
    # Verify backup integrity
    log "Verifying backup integrity..."
    if ! gzip -t "${restore_file}" 2>> "${LOG_FILE}"; then
        error_exit "Backup file integrity check failed"
    fi
    
    export PGPASSWORD="${POSTGRES_PASSWORD}"
    
    # Confirm restore action
    log "WARNING: This will replace the current database!"
    log "Database: ${POSTGRES_DB}"
    log "Backup: ${restore_file}"
    
    # Drop existing connections
    log "Terminating existing connections..."
    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres <<EOF 2>> "${LOG_FILE}" || true
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '${POSTGRES_DB}'
  AND pid <> pg_backend_pid();
EOF
    
    # Drop and recreate database
    log "Dropping existing database..."
    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres \
        -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};" 2>> "${LOG_FILE}" || error_exit "Failed to drop database"
    
    log "Creating new database..."
    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres \
        -c "CREATE DATABASE ${POSTGRES_DB};" 2>> "${LOG_FILE}" || error_exit "Failed to create database"
    
    # Restore from backup
    log "Restoring database from backup..."
    if zcat "${restore_file}" | pg_restore -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v 2>> "${LOG_FILE}"; then
        log "Database restore completed successfully"
    else
        log "WARNING: Restore completed with some errors (this may be normal for some object types)"
    fi
    
    # Verify restore
    log "Verifying restored database..."
    local table_count=$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    log "Restored database contains ${table_count} tables"
    
    return 0
}

# Perform point-in-time recovery (PITR)
pitr_restore() {
    log "Starting point-in-time recovery (PITR)..."
    
    if [ -z "${RESTORE_TARGET_TIME}" ]; then
        error_exit "RESTORE_TARGET_TIME must be set for PITR (format: YYYY-MM-DD HH:MM:SS)"
    fi
    
    log "Target recovery time: ${RESTORE_TARGET_TIME}"
    
    # Find base backup
    local base_backup=$(find_latest_backup)
    log "Using base backup: ${base_backup}"
    
    # Create recovery configuration
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local recovery_conf="/tmp/recovery_${timestamp}.conf"
    cat > "${recovery_conf}" <<EOF
restore_command = 'cp ${BACKUP_DIR}/wal_archive/%f %p'
recovery_target_time = '${RESTORE_TARGET_TIME}'
recovery_target_action = 'promote'
EOF
    
    log "PITR requires PostgreSQL to be stopped and recovery.conf configured"
    log "Steps for manual PITR:"
    log "1. Stop PostgreSQL"
    log "2. Clear data directory"
    log "3. Extract base backup to data directory"
    log "4. Copy recovery.conf to data directory: ${recovery_conf}"
    log "5. Copy WAL files from ${BACKUP_DIR}/wal_archive to pg_wal/"
    log "6. Start PostgreSQL - it will replay WAL logs to target time"
    
    # For Docker environments, provide docker-compose command
    log ""
    log "For Docker Compose environments:"
    log "  docker compose down"
    log "  docker volume rm internet-id_db_data"
    log "  # Restore and configure as above"
    log "  docker compose up -d"
    
    return 0
}

# Perform partial restore (specific tables)
partial_restore() {
    log "Starting partial restore..."
    
    if [ -z "${RESTORE_TABLES}" ]; then
        error_exit "RESTORE_TABLES must be set for partial restore (comma-separated list)"
    fi
    
    log "Tables to restore: ${RESTORE_TABLES}"
    
    # Determine backup file
    local restore_file="${BACKUP_FILE}"
    if [ -z "${restore_file}" ]; then
        restore_file=$(find_latest_backup)
    fi
    
    log "Using backup file: ${restore_file}"
    
    if [ ! -f "${restore_file}" ]; then
        error_exit "Backup file not found: ${restore_file}"
    fi
    
    export PGPASSWORD="${POSTGRES_PASSWORD}"
    
    # Extract and restore each table
    IFS=',' read -ra TABLES <<< "${RESTORE_TABLES}"
    for table in "${TABLES[@]}"; do
        table=$(echo "${table}" | xargs) # trim whitespace
        log "Restoring table: ${table}"
        
        # Create temporary restore directory
        local temp_dir="/tmp/restore_${table}_$$"
        mkdir -p "${temp_dir}"
        
        # Extract backup
        log "Extracting backup..."
        gunzip -c "${restore_file}" > "${temp_dir}/backup.dump"
        
        # Restore specific table
        log "Restoring table ${table}..."
        if pg_restore -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" \
            -d "${POSTGRES_DB}" -t "${table}" -v "${temp_dir}/backup.dump" 2>> "${LOG_FILE}"; then
            log "Table ${table} restored successfully"
        else
            log "WARNING: Errors during restore of table ${table}"
        fi
        
        # Cleanup
        rm -rf "${temp_dir}"
    done
    
    log "Partial restore completed"
    return 0
}

# Verify database consistency after restore
verify_database() {
    log "Verifying database consistency..."
    
    export PGPASSWORD="${POSTGRES_PASSWORD}"
    
    # Check for corrupted indexes
    log "Checking for corrupted indexes..."
    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
        -c "REINDEX DATABASE ${POSTGRES_DB};" >> "${LOG_FILE}" 2>&1 || true
    
    # Analyze tables
    log "Analyzing tables..."
    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
        -c "ANALYZE;" >> "${LOG_FILE}" 2>&1 || true
    
    # Check table counts
    log "Database statistics:"
    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
        -c "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;" 2>&1 | tee -a "${LOG_FILE}"
    
    log "Database verification completed"
}

# Main execution
main() {
    log "========================================="
    log "Starting database restore: ${RESTORE_TYPE}"
    log "========================================="
    
    check_postgres
    
    case "${RESTORE_TYPE}" in
        full)
            full_restore
            verify_database
            ;;
        pitr)
            pitr_restore
            ;;
        partial)
            partial_restore
            verify_database
            ;;
        *)
            error_exit "Invalid restore type: ${RESTORE_TYPE}. Use 'full', 'pitr', or 'partial'"
            ;;
    esac
    
    log "========================================="
    log "Restore process completed"
    log "========================================="
}

# Run main function
main
