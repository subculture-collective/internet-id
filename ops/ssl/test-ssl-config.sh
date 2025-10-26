#!/bin/bash
# SSL Configuration Testing Script
# Tests SSL/TLS configuration and security headers

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

DOMAIN="${DOMAIN:-localhost}"
HTTPS_URL="https://$DOMAIN"
HTTP_URL="http://$DOMAIN"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Test HTTP to HTTPS redirect
test_http_redirect() {
    info "Testing HTTP to HTTPS redirect..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" -L "$HTTP_URL" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        local final_url=$(curl -s -o /dev/null -w "%{url_effective}" -L "$HTTP_URL" 2>/dev/null)
        if [[ $final_url == https://* ]]; then
            pass "HTTP redirects to HTTPS"
        else
            fail "HTTP does not redirect to HTTPS"
        fi
    else
        warn "Could not test HTTP redirect (status: $response)"
    fi
}

# Test TLS version
test_tls_version() {
    info "Testing TLS version..."
    
    # Test TLS 1.0 (should fail)
    if openssl s_client -connect "$DOMAIN:443" -tls1 < /dev/null 2>&1 | grep -q "Cipher is (NONE)"; then
        pass "TLS 1.0 disabled"
    else
        warn "TLS 1.0 may be enabled (should be disabled)"
    fi
    
    # Test TLS 1.1 (should fail)
    if openssl s_client -connect "$DOMAIN:443" -tls1_1 < /dev/null 2>&1 | grep -q "Cipher is (NONE)"; then
        pass "TLS 1.1 disabled"
    else
        warn "TLS 1.1 may be enabled (should be disabled)"
    fi
    
    # Test TLS 1.2 (should succeed)
    if openssl s_client -connect "$DOMAIN:443" -tls1_2 < /dev/null 2>&1 | grep -q "Cipher"; then
        pass "TLS 1.2 enabled"
    else
        fail "TLS 1.2 not working"
    fi
    
    # Test TLS 1.3 (should succeed if supported)
    if command -v openssl &> /dev/null; then
        if openssl s_client -connect "$DOMAIN:443" -tls1_3 < /dev/null 2>&1 | grep -q "Cipher"; then
            pass "TLS 1.3 enabled"
        else
            info "TLS 1.3 not available (may not be supported by OpenSSL version)"
        fi
    fi
}

# Test security headers
test_security_headers() {
    info "Testing security headers..."
    
    local headers=$(curl -s -I "$HTTPS_URL" 2>/dev/null)
    
    # HSTS
    if echo "$headers" | grep -qi "Strict-Transport-Security"; then
        local hsts=$(echo "$headers" | grep -i "Strict-Transport-Security" | cut -d: -f2-)
        if echo "$hsts" | grep -q "max-age=63072000"; then
            pass "HSTS header with 2-year max-age"
        else
            warn "HSTS header present but max-age may be too short"
        fi
    else
        fail "HSTS header missing"
    fi
    
    # CSP
    if echo "$headers" | grep -qi "Content-Security-Policy"; then
        pass "Content-Security-Policy header present"
    else
        warn "Content-Security-Policy header missing"
    fi
    
    # X-Frame-Options
    if echo "$headers" | grep -qi "X-Frame-Options"; then
        pass "X-Frame-Options header present"
    else
        warn "X-Frame-Options header missing"
    fi
    
    # X-Content-Type-Options
    if echo "$headers" | grep -qi "X-Content-Type-Options.*nosniff"; then
        pass "X-Content-Type-Options: nosniff"
    else
        warn "X-Content-Type-Options header missing or incorrect"
    fi
    
    # Referrer-Policy
    if echo "$headers" | grep -qi "Referrer-Policy"; then
        pass "Referrer-Policy header present"
    else
        warn "Referrer-Policy header missing"
    fi
}

# Test certificate validity
test_certificate() {
    info "Testing certificate validity..."
    
    local cert_info=$(openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" < /dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ -n "$cert_info" ]; then
        pass "Certificate is valid and readable"
        
        local expiry=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        info "Certificate expires: $expiry"
        
        # Check if certificate is from Let's Encrypt
        local issuer=$(openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" < /dev/null 2>/dev/null | openssl x509 -noout -issuer 2>/dev/null)
        if echo "$issuer" | grep -qi "Let's Encrypt"; then
            pass "Certificate issued by Let's Encrypt"
        else
            info "Certificate issuer: $issuer"
        fi
    else
        fail "Could not retrieve certificate information"
    fi
}

# Test OCSP stapling
test_ocsp_stapling() {
    info "Testing OCSP stapling..."
    
    local ocsp_response=$(timeout 10 openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" -status < /dev/null 2>&1 | grep -A 17 "OCSP Response Status")
    
    if echo "$ocsp_response" | grep -q "successful"; then
        pass "OCSP stapling is working"
    else
        warn "OCSP stapling may not be configured or not working"
    fi
}

# Test cipher strength
test_cipher_strength() {
    info "Testing cipher strength..."
    
    local cipher=$(openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" < /dev/null 2>/dev/null | grep "Cipher" | head -1)
    
    if echo "$cipher" | grep -qE "ECDHE|DHE"; then
        pass "Forward secrecy enabled (ECDHE/DHE)"
    else
        warn "Forward secrecy may not be enabled"
    fi
    
    info "Negotiated cipher: $cipher"
}

# Test rate limiting
test_rate_limiting() {
    info "Testing rate limiting..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$HTTPS_URL/api/health" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        pass "API endpoint accessible"
        
        # Make rapid requests to test rate limiting
        local count=0
        for i in {1..10}; do
            local code=$(curl -s -o /dev/null -w "%{http_code}" "$HTTPS_URL/api/health" 2>/dev/null)
            if [ "$code" = "429" ]; then
                count=$((count + 1))
            fi
        done
        
        if [ $count -gt 0 ]; then
            pass "Rate limiting is active ($count/10 requests rate-limited)"
        else
            info "Rate limiting may not be active or threshold is high"
        fi
    else
        warn "API endpoint not accessible (status: $response)"
    fi
}

# Generate report
generate_report() {
    echo ""
    echo "========================================="
    echo "SSL/TLS Configuration Test Report"
    echo "========================================="
    echo "Domain: $DOMAIN"
    echo "Tested at: $(date -Iseconds)"
    echo ""
    
    test_http_redirect
    echo ""
    
    test_tls_version
    echo ""
    
    test_security_headers
    echo ""
    
    test_certificate
    echo ""
    
    test_ocsp_stapling
    echo ""
    
    test_cipher_strength
    echo ""
    
    test_rate_limiting
    echo ""
    
    echo "========================================="
    echo ""
    info "For a comprehensive test, run SSL Labs test:"
    echo "   https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
    echo ""
    info "Target grade: A+"
}

# Main execution
main() {
    if [ "$DOMAIN" = "localhost" ] || [ "$DOMAIN" = "example.com" ]; then
        warn "Using default domain ($DOMAIN). Set DOMAIN in .env for production testing."
        echo ""
    fi
    
    generate_report
}

main "$@"
