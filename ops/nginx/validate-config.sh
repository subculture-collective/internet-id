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

# Test 1: Validate main nginx.conf syntax
echo "Test 1: Validating main nginx.conf syntax..."
docker run --rm \
    -v "$SCRIPT_DIR/nginx-test.conf:/etc/nginx/nginx.conf:ro" \
    nginx:1.25-alpine nginx -t
echo "✓ Main nginx.conf syntax is valid"
echo ""

# Test 2: Test environment variable substitution
echo "Test 2: Testing environment variable substitution..."
DOMAIN="${DOMAIN:-localhost}"
TEMP_CONF=$(mktemp)
envsubst '${DOMAIN}' < "$SCRIPT_DIR/conf.d/default.conf.template" > "$TEMP_CONF"

# Check that substitution worked
if grep -q "server_name $DOMAIN" "$TEMP_CONF"; then
    echo "✓ Environment variable substitution working (DOMAIN=$DOMAIN)"
else
    echo "✗ Environment variable substitution failed"
    rm "$TEMP_CONF"
    exit 1
fi

rm "$TEMP_CONF"
echo ""

# Test 3: Check for common issues
echo "Test 3: Checking for common configuration issues..."

# Check for deprecated directives
if grep -r "listen.*http2" "$SCRIPT_DIR/conf.d/" 2>/dev/null; then
    echo "✗ Warning: Deprecated 'listen ... http2' syntax found"
    echo "  Use 'http2 on;' instead"
else
    echo "✓ No deprecated http2 syntax"
fi

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

echo ""
echo "==================================="
echo "Validation Complete"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Set DOMAIN in .env file"
echo "2. Obtain SSL certificates: cd ops/ssl && ./manage-certs.sh obtain"
echo "3. Start services: docker-compose up -d"
echo "4. Test SSL: cd ops/ssl && ./test-ssl-config.sh"
