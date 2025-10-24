#!/bin/bash
# PostgreSQL Backup Verification Script
# Verifies backup integrity and reports on backup status
# Usage: ./verify-backup.sh

set -euo pipefail

# Configuration from environment or defaults
BACKUP_DIR="${BACKUP_DIR:-/var/lib/postgresql/backups}"
FULL_BACKUP_DIR="${BACKUP_DIR}/full"
INCREMENTAL_BACKUP_DIR="${BACKUP_DIR}/incremental"
WAL_ARCHIVE_DIR="${BACKUP_DIR}/wal_archive"
LOG_FILE="${BACKUP_DIR}/verify.log"
ALERT_EMAIL="${ALERT_EMAIL:-}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

# Alert function
send_alert() {
    local message="$1"
    log "ALERT: ${message}"
    
    if [ -n "${ALERT_EMAIL}" ] && command -v mail &> /dev/null; then
        echo "${message}" | mail -s "Backup Alert - Internet ID" "${ALERT_EMAIL}"
    fi
}

# Check backup age
check_backup_age() {
    log "Checking backup age..."
    
    local latest_backup=$(ls -t "${FULL_BACKUP_DIR}"/backup_*.dump.gz 2>/dev/null | head -1)
    
    if [ -z "${latest_backup}" ]; then
        send_alert "No backups found in ${FULL_BACKUP_DIR}"
        return 1
    fi
    
    local backup_age_seconds=$(( $(date +%s) - $(stat -c %Y "${latest_backup}" 2>/dev/null || stat -f %m "${latest_backup}") ))
    local backup_age_hours=$(( backup_age_seconds / 3600 ))
    
    log "Latest backup: ${latest_backup}"
    log "Backup age: ${backup_age_hours} hours"
    
    if [ ${backup_age_hours} -gt 26 ]; then
        send_alert "Latest backup is ${backup_age_hours} hours old (expected: < 26 hours)"
        return 1
    fi
    
    return 0
}

# Verify backup integrity
verify_backup_integrity() {
    log "Verifying backup integrity..."
    
    local backups_checked=0
    local backups_failed=0
    
    # Check last 3 backups
    for backup_file in $(ls -t "${FULL_BACKUP_DIR}"/backup_*.dump.gz 2>/dev/null | head -3); do
        backups_checked=$((backups_checked + 1))
        log "Checking: ${backup_file}"
        
        if gzip -t "${backup_file}" 2>/dev/null; then
            log "  ✓ Integrity check passed"
        else
            log "  ✗ Integrity check FAILED"
            backups_failed=$((backups_failed + 1))
            send_alert "Backup integrity check failed: ${backup_file}"
        fi
    done
    
    log "Checked ${backups_checked} backups, ${backups_failed} failed"
    
    if [ ${backups_failed} -gt 0 ]; then
        return 1
    fi
    
    return 0
}

# Check backup size
check_backup_size() {
    log "Checking backup sizes..."
    
    local latest_backup=$(ls -t "${FULL_BACKUP_DIR}"/backup_*.dump.gz 2>/dev/null | head -1)
    
    if [ -z "${latest_backup}" ]; then
        return 1
    fi
    
    local backup_size=$(du -b "${latest_backup}" | cut -f1)
    local backup_size_mb=$((backup_size / 1024 / 1024))
    
    log "Latest backup size: ${backup_size_mb} MB"
    
    # Alert if backup is suspiciously small (< 1MB)
    if [ ${backup_size_mb} -lt 1 ]; then
        send_alert "Backup size suspiciously small: ${backup_size_mb} MB"
        return 1
    fi
    
    # Check for significant size changes (compare to previous backup)
    local previous_backup=$(ls -t "${FULL_BACKUP_DIR}"/backup_*.dump.gz 2>/dev/null | head -2 | tail -1)
    
    if [ -n "${previous_backup}" ] && [ "${previous_backup}" != "${latest_backup}" ]; then
        local prev_size=$(du -b "${previous_backup}" | cut -f1)
        local prev_size_mb=$((prev_size / 1024 / 1024))
        local size_diff=$(( (backup_size - prev_size) * 100 / prev_size ))
        
        log "Previous backup size: ${prev_size_mb} MB"
        log "Size change: ${size_diff}%"
        
        # Alert if backup size changed by more than 50%
        if [ ${size_diff#-} -gt 50 ]; then
            send_alert "Significant backup size change detected: ${size_diff}%"
        fi
    fi
    
    return 0
}

# Check WAL archiving
check_wal_archiving() {
    log "Checking WAL archiving..."
    
    if [ ! -d "${WAL_ARCHIVE_DIR}" ]; then
        log "WAL archive directory not found"
        return 1
    fi
    
    local recent_wal_count=$(find "${WAL_ARCHIVE_DIR}" -type f -mmin -60 | wc -l)
    local total_wal_count=$(find "${WAL_ARCHIVE_DIR}" -type f | wc -l)
    
    log "Total WAL files: ${total_wal_count}"
    log "WAL files in last hour: ${recent_wal_count}"
    
    # Check WAL disk usage
    local wal_size_mb=$(du -sm "${WAL_ARCHIVE_DIR}" 2>/dev/null | cut -f1)
    log "WAL archive size: ${wal_size_mb} MB"
    
    return 0
}

# Check storage usage
check_storage_usage() {
    log "Checking storage usage..."
    
    local backup_size=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
    log "Total backup storage: ${backup_size}"
    
    # Check available disk space
    local available_space=$(df -h "${BACKUP_DIR}" | tail -1 | awk '{print $4}')
    local usage_percent=$(df -h "${BACKUP_DIR}" | tail -1 | awk '{print $5}' | tr -d '%')
    
    log "Available space: ${available_space}"
    log "Disk usage: ${usage_percent}%"
    
    if [ ${usage_percent} -gt 85 ]; then
        send_alert "Backup storage usage high: ${usage_percent}%"
        return 1
    fi
    
    return 0
}

# Generate backup report
generate_report() {
    log "Generating backup report..."
    
    cat <<EOF

========================================
Database Backup Status Report
========================================
Generated: $(date)

Full Backups:
$(ls -lh "${FULL_BACKUP_DIR}"/backup_*.dump.gz 2>/dev/null | tail -5)

Recent Backups Count:
  Last 24 hours: $(find "${FULL_BACKUP_DIR}" -type f -mtime 0 | wc -l)
  Last 7 days:   $(find "${FULL_BACKUP_DIR}" -type f -mtime -7 | wc -l)
  Last 30 days:  $(find "${FULL_BACKUP_DIR}" -type f -mtime -30 | wc -l)

Storage Usage:
  Backup directory: $(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
  Full backups:     $(du -sh "${FULL_BACKUP_DIR}" 2>/dev/null | cut -f1)
  WAL archives:     $(du -sh "${WAL_ARCHIVE_DIR}" 2>/dev/null | cut -f1)

Retention Policy:
  Configured retention: ${RETENTION_DAYS} days
  Oldest backup: $(ls -t "${FULL_BACKUP_DIR}"/backup_*.dump.gz 2>/dev/null | tail -1 | xargs -r stat -c %y 2>/dev/null | cut -d' ' -f1)

========================================
EOF
}

# Main execution
main() {
    log "========================================="
    log "Starting backup verification"
    log "========================================="
    
    local checks_passed=0
    local checks_failed=0
    
    # Run all checks
    if check_backup_age; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
    fi
    
    if verify_backup_integrity; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
    fi
    
    if check_backup_size; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
    fi
    
    if check_wal_archiving; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
    fi
    
    if check_storage_usage; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
    fi
    
    # Generate report
    generate_report
    
    log "========================================="
    log "Verification completed: ${checks_passed} passed, ${checks_failed} failed"
    log "========================================="
    
    if [ ${checks_failed} -gt 0 ]; then
        exit 1
    fi
    
    exit 0
}

# Run main function
main
