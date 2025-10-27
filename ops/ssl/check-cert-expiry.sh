#!/bin/bash
# Certificate Expiration Monitoring Script
# Checks SSL certificate expiration and sends alerts

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Configuration
DOMAIN="${DOMAIN:-example.com}"
ALERT_EMAIL="${SSL_ALERT_EMAIL:-${SSL_EMAIL:-admin@${DOMAIN}}}"
WARNING_DAYS="${CERT_WARNING_DAYS:-14}"
CRITICAL_DAYS="${CERT_CRITICAL_DAYS:-7}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

send_alert() {
    local subject="$1"
    local message="$2"
    
    log_warn "ALERT: $subject"
    
    # Try to send email if mail command is available
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
        log_info "Alert email sent to $ALERT_EMAIL"
    else
        log_warn "mail command not available - alert not sent via email"
    fi
    
    # Log to syslog if available
    if command -v logger &> /dev/null; then
        logger -t certbot-monitor -p user.warning "$subject: $message"
    fi
    
    # Write to alert log
    local alert_log="/var/log/certbot-alerts.log"
    echo "[$(date -Iseconds)] $subject: $message" >> "$alert_log" 2>/dev/null || true
}

check_certificate_expiry() {
    local cert_path="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    
    if [ ! -f "$cert_path" ]; then
        log_error "Certificate not found at $cert_path"
        send_alert "Certificate Missing - $DOMAIN" \
            "SSL certificate not found at $cert_path. Please investigate immediately."
        return 1
    fi
    
    # Get expiration date
    local expiry_date=$(openssl x509 -in "$cert_path" -noout -enddate | cut -d= -f2)
    local expiry_epoch=$(date -d "$expiry_date" +%s)
    local current_epoch=$(date +%s)
    local days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))
    
    log_info "Certificate for $DOMAIN expires in $days_left days ($expiry_date)"
    
    # Check for critical expiration (< 7 days)
    if [ $days_left -le $CRITICAL_DAYS ]; then
        log_error "Certificate expires in $days_left days - CRITICAL!"
        send_alert "CRITICAL: SSL Certificate Expiring - $DOMAIN" \
            "SSL certificate for $DOMAIN will expire in $days_left days on $expiry_date. Immediate action required!"
        return 2
    fi
    
    # Check for warning expiration (< 14 days)
    if [ $days_left -le $WARNING_DAYS ]; then
        log_warn "Certificate expires in $days_left days - WARNING!"
        send_alert "WARNING: SSL Certificate Expiring - $DOMAIN" \
            "SSL certificate for $DOMAIN will expire in $days_left days on $expiry_date. Please renew soon."
        return 1
    fi
    
    log_info "Certificate expiration is within acceptable range"
    return 0
}

# Verify certificate is valid
verify_certificate() {
    local cert_path="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    
    if ! openssl x509 -in "$cert_path" -noout -checkend 0 2>/dev/null; then
        log_error "Certificate has already expired!"
        send_alert "CRITICAL: SSL Certificate EXPIRED - $DOMAIN" \
            "SSL certificate for $DOMAIN has EXPIRED. Service is at risk!"
        return 1
    fi
    
    log_info "Certificate is currently valid"
    return 0
}

# Check OCSP stapling
check_ocsp() {
    log_info "Checking OCSP stapling for $DOMAIN..."
    
    # This requires the domain to be accessible
    if command -v openssl &> /dev/null; then
        timeout 10 openssl s_client -connect "$DOMAIN:443" -status < /dev/null 2>&1 | grep -A 17 "OCSP Response Status" || {
            log_warn "Could not verify OCSP stapling (domain may not be accessible)"
            return 1
        }
    fi
}

# Main execution
main() {
    log_info "Starting certificate expiration check for $DOMAIN"
    
    verify_certificate
    check_certificate_expiry
    check_ocsp
    
    log_info "Certificate check completed"
}

main "$@"
