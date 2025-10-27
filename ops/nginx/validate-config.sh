#!/bin/bash
# Nginx Configuration Validation Script
# Tests configuration syntax without requiring Docker Compose network

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "==================================="
echo "Nginx Configuration Validation"
echo "==================================="
echo ""

# Test 1: Validate test nginx.conf syntax
echo "Test 1: Validating test nginx.conf syntax..."
if docker run --rm \
    -v "$SCRIPT_DIR/nginx-test.conf:/etc/nginx/nginx.conf:ro" \
    nginx:1.25-alpine nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo "✓ Test nginx.conf syntax is valid"
else
    echo "✗ Test nginx.conf syntax validation failed"
    exit 1
fi
echo ""

# Test 2: Validate main nginx.conf syntax
echo "Test 2: Validating main nginx.conf syntax..."
if docker run --rm \
    -v "$SCRIPT_DIR/nginx.conf:/etc/nginx/nginx.conf:ro" \
    nginx:1.25-alpine nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo "✓ Main nginx.conf syntax is valid"
else
    echo "✗ Main nginx.conf syntax validation failed"
    exit 1
fi
echo ""

# Test 3: Test environment variable substitution
echo "Test 3: Testing environment variable substitution..."
export DOMAIN="${DOMAIN:-localhost}"
TEMP_CONF=$(mktemp)
envsubst < "$SCRIPT_DIR/conf.d/default.conf.template" > "$TEMP_CONF"

# Check that substitution worked
if grep -q "server_name ${DOMAIN};" "$TEMP_CONF"; then
    echo "✓ Environment variable substitution working (DOMAIN=$DOMAIN)"
elif grep -q "ssl_certificate /etc/letsencrypt/live/${DOMAIN}/" "$TEMP_CONF"; then
    echo "✓ Environment variable substitution working (DOMAIN=$DOMAIN)"
else
    echo "✗ Environment variable substitution failed"
    echo "Could not find expected domain references in configuration"
    rm "$TEMP_CONF"
    exit 1
fi

rm "$TEMP_CONF"
echo ""

# Test 4: Check for common configuration issues
echo "Test 4: Checking for common configuration issues..."

# Check for proper SSL protocols
if grep -q "ssl_protocols TLSv1.2 TLSv1.3" "$SCRIPT_DIR/conf.d/default.conf.template"; then
    echo "✓ Modern TLS protocols configured (1.2, 1.3)"
else
    echo "⚠ Warning: TLS protocol configuration may need review"
fi

# Check for HSTS header
if grep -q "Strict-Transport-Security" "$SCRIPT_DIR/conf.d/default.conf.template"; then
    echo "✓ HSTS header configured"
else
    echo "✗ Warning: HSTS header not found"
fi

# Check for CSP header
if grep -q "Content-Security-Policy" "$SCRIPT_DIR/conf.d/default.conf.template"; then
    echo "✓ Content-Security-Policy header configured"
else
    echo "⚠ Warning: CSP header not found"
fi

# Check for rate limiting
if grep -q "limit_req_zone" "$SCRIPT_DIR/nginx.conf"; then
    echo "✓ Rate limiting configured"
else
    echo "⚠ Warning: Rate limiting not configured"
fi

echo ""
echo "==================================="
echo "Validation Complete"
echo "==================================="
echo ""
echo "All configuration tests passed!"
echo ""
echo "Next steps for production deployment:"
echo "1. Set DOMAIN in .env file (e.g., DOMAIN=yourdomain.com)"
echo "2. Set SSL_EMAIL in .env file (e.g., SSL_EMAIL=admin@yourdomain.com)"
echo "3. Obtain SSL certificates: cd ops/ssl && ./manage-certs.sh obtain"
echo "4. Start services: docker-compose up -d"
echo "5. Test SSL configuration: cd ops/ssl && ./test-ssl-config.sh"
echo "6. Test with SSL Labs: https://www.ssllabs.com/ssltest/"
