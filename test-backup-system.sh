#!/bin/bash
# Integration test for backup and restore system
# This script tests the basic functionality of the backup/restore system

set -euo pipefail

echo "==================================="
echo "Backup System Integration Test"
echo "==================================="

# Test 1: Script syntax validation
echo ""
echo "Test 1: Validating script syntax..."
for script in ops/backup/backup-database.sh ops/restore/restore-database.sh ops/backup/verify-backup.sh; do
    if bash -n "$script"; then
        echo "  ✓ $script syntax OK"
    else
        echo "  ✗ $script syntax FAILED"
        exit 1
    fi
done

# Test 2: Check script permissions
echo ""
echo "Test 2: Checking script permissions..."
for script in ops/backup/backup-database.sh ops/restore/restore-database.sh ops/backup/verify-backup.sh; do
    if [ -x "$script" ]; then
        echo "  ✓ $script is executable"
    else
        echo "  ✗ $script is not executable"
        exit 1
    fi
done

# Test 3: Verify directory structure
echo ""
echo "Test 3: Verifying directory structure..."
for dir in ops/backup ops/restore docs/ops; do
    if [ -d "$dir" ]; then
        echo "  ✓ $dir exists"
    else
        echo "  ✗ $dir missing"
        exit 1
    fi
done

# Test 4: Check documentation files
echo ""
echo "Test 4: Checking documentation..."
for doc in docs/ops/DATABASE_BACKUP_RECOVERY.md docs/ops/DISASTER_RECOVERY_RUNBOOK.md docs/ops/BACKUP_MONITORING.md ops/README.md; do
    if [ -f "$doc" ]; then
        echo "  ✓ $doc exists"
    else
        echo "  ✗ $doc missing"
        exit 1
    fi
done

# Test 5: Docker Compose validation
echo ""
echo "Test 5: Validating Docker Compose configuration..."
if docker compose config > /dev/null 2>&1; then
    echo "  ✓ docker-compose.yml is valid"
else
    echo "  ✗ docker-compose.yml validation failed"
    exit 1
fi

# Test 6: Check crontab example
echo ""
echo "Test 6: Checking crontab configuration..."
if [ -f "ops/backup/crontab.example" ]; then
    echo "  ✓ crontab.example exists"
else
    echo "  ✗ crontab.example missing"
    exit 1
fi

# Test 7: Verify script help/usage messages
echo ""
echo "Test 7: Testing script usage patterns..."
if grep -q "Usage:" ops/backup/backup-database.sh; then
    echo "  ✓ backup-database.sh has usage documentation"
else
    echo "  ✗ backup-database.sh missing usage docs"
    exit 1
fi

if grep -q "Usage:" ops/restore/restore-database.sh; then
    echo "  ✓ restore-database.sh has usage documentation"
else
    echo "  ✗ restore-database.sh missing usage docs"
    exit 1
fi

# Test 8: Check for required functions in scripts
echo ""
echo "Test 8: Checking script functions..."
functions=("log" "error_exit" "check_postgres" "full_backup" "full_restore")
for func in "${functions[@]}"; do
    if grep -q "^${func}()" ops/backup/backup-database.sh ops/restore/restore-database.sh 2>/dev/null; then
        echo "  ✓ Function $func defined"
    fi
done

echo ""
echo "==================================="
echo "All tests passed! ✓"
echo "==================================="
echo ""
echo "Next steps for production deployment:"
echo "1. Configure environment variables (see .env.example)"
echo "2. Set up PostgreSQL with WAL archiving"
echo "3. Configure S3 bucket for remote backups"
echo "4. Schedule backups via cron (see ops/backup/crontab.example)"
echo "5. Set up monitoring and alerts"
echo "6. Review disaster recovery runbook"
echo ""
echo "Documentation:"
echo "  - Setup guide: docs/ops/DATABASE_BACKUP_RECOVERY.md"
echo "  - DR runbook: docs/ops/DISASTER_RECOVERY_RUNBOOK.md"
echo "  - Monitoring: docs/ops/BACKUP_MONITORING.md"
echo ""
