#!/bin/bash
# SSL/TLS Certificate Management Script for Internet-ID
# Uses Let's Encrypt with certbot for automatic certificate provisioning

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
EMAIL="${SSL_EMAIL:-admin@${DOMAIN}}"
STAGING="${CERTBOT_STAGING:-0}"
WEBROOT="/var/www/certbot"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in Docker or host
is_docker() {
    [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null
}

# Function to obtain new certificate
obtain_certificate() {
    log_info "Obtaining SSL certificate for $DOMAIN..."
    
    local staging_flag=""
    if [ "$STAGING" = "1" ]; then
        staging_flag="--staging"
        log_warn "Using Let's Encrypt staging environment (test certificates)"
    fi
    
    certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        $staging_flag \
        -d "$DOMAIN" \
        --non-interactive
    
    if [ $? -eq 0 ]; then
        log_info "Certificate obtained successfully for $DOMAIN"
        return 0
    else
        log_error "Failed to obtain certificate for $DOMAIN"
        return 1
    fi
}

# Function to renew certificates
renew_certificates() {
    log_info "Checking and renewing certificates..."
    
    certbot renew --quiet --webroot --webroot-path="$WEBROOT"
    
    if [ $? -eq 0 ]; then
        log_info "Certificate renewal check completed"
        # Reload nginx if certificates were renewed
        if is_docker; then
            nginx -s reload 2>/dev/null || log_warn "Could not reload nginx"
        else
            docker-compose exec nginx nginx -s reload 2>/dev/null || \
            docker exec internet-id-nginx nginx -s reload 2>/dev/null || \
            log_warn "Could not reload nginx in Docker"
        fi
        return 0
    else
        log_error "Certificate renewal failed"
        return 1
    fi
}

# Function to test certificate
test_certificate() {
    log_info "Testing SSL certificate for $DOMAIN..."
    
    if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        log_error "Certificate not found at /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
        return 1
    fi
    
    # Check certificate validity
    openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -noout -text | grep -A 2 "Validity"
    
    # Check expiration date
    local expiry_date=$(openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -noout -enddate | cut -d= -f2)
    log_info "Certificate expires: $expiry_date"
    
    # Calculate days until expiration
    local expiry_epoch=$(date -d "$expiry_date" +%s)
    local current_epoch=$(date +%s)
    local days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))
    
    log_info "Days until expiration: $days_left"
    
    if [ $days_left -lt 30 ]; then
        log_warn "Certificate expires in less than 30 days - renewal recommended"
    fi
    
    return 0
}

# Function to revoke certificate
revoke_certificate() {
    log_warn "Revoking SSL certificate for $DOMAIN..."
    
    certbot revoke \
        --cert-path "/etc/letsencrypt/live/$DOMAIN/cert.pem" \
        --non-interactive
    
    if [ $? -eq 0 ]; then
        log_info "Certificate revoked successfully"
        certbot delete --cert-name "$DOMAIN" --non-interactive
        return 0
    else
        log_error "Failed to revoke certificate"
        return 1
    fi
}

# Function to show certificate info
show_certificate_info() {
    log_info "Certificate information for $DOMAIN:"
    certbot certificates -d "$DOMAIN"
}

# Main command handler
case "${1:-help}" in
    obtain)
        obtain_certificate
        ;;
    renew)
        renew_certificates
        ;;
    test)
        test_certificate
        ;;
    revoke)
        revoke_certificate
        ;;
    info)
        show_certificate_info
        ;;
    help|--help|-h)
        echo "SSL/TLS Certificate Management Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  obtain  - Obtain new SSL certificate from Let's Encrypt"
        echo "  renew   - Renew existing certificates (automatic check)"
        echo "  test    - Test certificate validity and expiration"
        echo "  revoke  - Revoke and delete certificate"
        echo "  info    - Show certificate information"
        echo "  help    - Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  DOMAIN           - Domain name for certificate (default: example.com)"
        echo "  SSL_EMAIL        - Email for Let's Encrypt notifications"
        echo "  CERTBOT_STAGING  - Use staging environment (1) or production (0)"
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
