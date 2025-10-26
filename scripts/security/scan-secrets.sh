#!/bin/bash

# Secret Scanner for Internet-ID Project
# Scans codebase for hardcoded credentials, API keys, and sensitive data

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "========================================="
echo "Internet-ID Secret Scanner"
echo "========================================="
echo ""

# Create output directory
SCAN_DIR="$(pwd)/security-scans"
mkdir -p "$SCAN_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$SCAN_DIR/secret-scan-$TIMESTAMP.txt"

echo "Scan started at: $(date)" | tee "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Counter for issues found
TOTAL_ISSUES=0

# Function to scan for patterns
scan_pattern() {
    local pattern="$1"
    local description="$2"
    local severity="$3"
    
    echo "Scanning for: $description" | tee -a "$REPORT_FILE"
    
    # Exclude common false positive directories
    local results=$(grep -r -n -I \
        --exclude-dir={node_modules,.git,dist,build,coverage,.next,typechain-types} \
        --exclude="*.{log,md,lock,json,svg,png,jpg,gif,zip,tar,gz}" \
        -E "$pattern" . 2>/dev/null || true)
    
    if [ -n "$results" ]; then
        local count=$(echo "$results" | wc -l)
        TOTAL_ISSUES=$((TOTAL_ISSUES + count))
        
        if [ "$severity" = "HIGH" ]; then
            echo -e "${RED}[HIGH] Found $count potential issue(s)${NC}" | tee -a "$REPORT_FILE"
        elif [ "$severity" = "MEDIUM" ]; then
            echo -e "${YELLOW}[MEDIUM] Found $count potential issue(s)${NC}" | tee -a "$REPORT_FILE"
        else
            echo -e "[LOW] Found $count potential issue(s)" | tee -a "$REPORT_FILE"
        fi
        
        echo "$results" | tee -a "$REPORT_FILE"
        echo "" | tee -a "$REPORT_FILE"
    else
        echo -e "${GREEN}✓ No issues found${NC}" | tee -a "$REPORT_FILE"
        echo "" | tee -a "$REPORT_FILE"
    fi
}

echo "Starting comprehensive security scan..." | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Scan for hardcoded passwords
scan_pattern 'password\s*=\s*["\047][^"\047]{3,}["\047]' "Hardcoded passwords" "HIGH"

# Scan for API keys
scan_pattern '(api_key|apikey|api-key)\s*=\s*["\047][a-zA-Z0-9_-]{20,}["\047]' "Hardcoded API keys" "HIGH"

# Scan for AWS credentials
scan_pattern 'AKIA[0-9A-Z]{16}' "AWS Access Key IDs" "HIGH"
scan_pattern 'aws_secret_access_key\s*=\s*["\047][a-zA-Z0-9/+=]{40}["\047]' "AWS Secret Access Keys" "HIGH"

# Scan for private keys (Ethereum)
scan_pattern '0x[a-fA-F0-9]{64}' "Potential private keys (64 hex chars)" "HIGH"

# Scan for JWT secrets
scan_pattern '(jwt_secret|jwt-secret|NEXTAUTH_SECRET)\s*=\s*["\047][^"\047]{20,}["\047]' "JWT/Auth secrets" "HIGH"

# Scan for database URLs with credentials
scan_pattern 'postgresql://[^:]+:[^@]+@' "Database URLs with credentials" "MEDIUM"
scan_pattern 'mysql://[^:]+:[^@]+@' "MySQL URLs with credentials" "MEDIUM"

# Scan for generic secrets
scan_pattern '(secret|SECRET)\s*=\s*["\047][^"\047]{20,}["\047]' "Generic secrets" "MEDIUM"

# Scan for tokens
scan_pattern '(token|TOKEN)\s*=\s*["\047][a-zA-Z0-9_-]{20,}["\047]' "Access tokens" "MEDIUM"

# Scan for SSH private keys
scan_pattern 'BEGIN.*PRIVATE KEY' "SSH/TLS Private Keys" "HIGH"

# Scan for Google OAuth credentials
scan_pattern '[0-9]+-[a-zA-Z0-9_]{32}\.apps\.googleusercontent\.com' "Google OAuth Client IDs" "MEDIUM"

# Scan for GitHub tokens
scan_pattern 'ghp_[a-zA-Z0-9]{36}' "GitHub Personal Access Tokens" "HIGH"
scan_pattern 'gho_[a-zA-Z0-9]{36}' "GitHub OAuth Tokens" "HIGH"

# Scan for Slack tokens
scan_pattern 'xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}' "Slack tokens" "HIGH"

# Scan for SendGrid API keys
scan_pattern 'SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}' "SendGrid API keys" "HIGH"

# Scan for Stripe keys
scan_pattern 'sk_live_[a-zA-Z0-9]{24,}' "Stripe Secret Keys" "HIGH"
scan_pattern 'pk_live_[a-zA-Z0-9]{24,}' "Stripe Publishable Keys" "MEDIUM"

# Scan for Twilio credentials
scan_pattern 'SK[a-z0-9]{32}' "Twilio API Keys" "HIGH"

# Scan for IPFS credentials
scan_pattern '(IPFS_PROJECT_SECRET|PINATA_JWT|WEB3_STORAGE_TOKEN)\s*=\s*["\047][^"\047]{10,}["\047]' "IPFS Provider Credentials" "MEDIUM"

# Scan for TODO/FIXME with security implications
scan_pattern 'TODO.*(?i)(password|secret|key|token|credential)' "Security-related TODOs" "LOW"

# Check .env files are not committed
echo "Checking for committed .env files..." | tee -a "$REPORT_FILE"
if git ls-files | grep -E '\.env$|\.env\.local$|\.env\.production$' > /dev/null 2>&1; then
    echo -e "${RED}[HIGH] Found .env files in git history!${NC}" | tee -a "$REPORT_FILE"
    git ls-files | grep -E '\.env$|\.env\.local$|\.env\.production$' | tee -a "$REPORT_FILE"
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
else
    echo -e "${GREEN}✓ No .env files committed${NC}" | tee -a "$REPORT_FILE"
fi
echo "" | tee -a "$REPORT_FILE"

# Check for secrets in git history
echo "Checking git history for potential secrets (last 100 commits)..." | tee -a "$REPORT_FILE"
GIT_SECRETS=$(git log --all --full-history --source --branches --pretty=format:'%H' -100 | \
    while read commit; do
        git show "$commit" | grep -E '(password|secret|api_key|AKIA|0x[a-fA-F0-9]{64})' 2>/dev/null | head -5
    done | head -20 || true)

if [ -n "$GIT_SECRETS" ]; then
    echo -e "${YELLOW}[MEDIUM] Potential secrets found in git history:${NC}" | tee -a "$REPORT_FILE"
    echo "$GIT_SECRETS" | tee -a "$REPORT_FILE"
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
else
    echo -e "${GREEN}✓ No obvious secrets in recent git history${NC}" | tee -a "$REPORT_FILE"
fi
echo "" | tee -a "$REPORT_FILE"

# Summary
echo "=========================================" | tee -a "$REPORT_FILE"
echo "SCAN SUMMARY" | tee -a "$REPORT_FILE"
echo "=========================================" | tee -a "$REPORT_FILE"
echo "Scan completed at: $(date)" | tee -a "$REPORT_FILE"
echo "Total potential issues found: $TOTAL_ISSUES" | tee -a "$REPORT_FILE"
echo "Report saved to: $REPORT_FILE" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

if [ $TOTAL_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ No security issues detected!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Found $TOTAL_ISSUES potential security issue(s)${NC}"
    echo "Please review the report at: $REPORT_FILE"
    echo ""
    echo "Recommended actions:"
    echo "1. Review all flagged items in the report"
    echo "2. Remove any hardcoded secrets from code"
    echo "3. Rotate any exposed credentials immediately"
    echo "4. Update .gitignore to exclude sensitive files"
    echo "5. Run 'git-secrets' to prevent future commits with secrets"
    echo "6. Consider using a secret management solution (AWS Secrets Manager, Vault)"
    exit 1
fi
