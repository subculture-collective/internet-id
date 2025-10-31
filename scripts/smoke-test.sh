#!/bin/bash
# Smoke test script for deployment validation
# Usage: ./smoke-test.sh <BASE_URL>

set -e

BASE_URL=${1:-http://localhost:3001}
TIMEOUT=10

echo "🔍 Running smoke tests against: $BASE_URL"
echo "================================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    local check_json=${4:-false}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $name... "
    
    # Make request with timeout
    response=$(curl -s -o /tmp/response.txt -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        if [ "$check_json" = "true" ]; then
            if jq empty /tmp/response.txt 2>/dev/null; then
                echo -e "${GREEN}✓ PASS${NC} (HTTP $response, valid JSON)"
                PASSED_TESTS=$((PASSED_TESTS + 1))
                return 0
            else
                echo -e "${RED}✗ FAIL${NC} (HTTP $response, invalid JSON)"
                FAILED_TESTS=$((FAILED_TESTS + 1))
                return 1
            fi
        else
            echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got $response)"
        cat /tmp/response.txt 2>/dev/null || echo "(no response)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Core API endpoints
echo ""
echo "📡 Core API Endpoints"
echo "------------------------"
test_endpoint "API Health" "$BASE_URL/api/health" 200 true
test_endpoint "API Network Info" "$BASE_URL/api/network" 200 true
test_endpoint "API Registry" "$BASE_URL/api/registry" 200 true

# Observability endpoints
echo ""
echo "📊 Observability Endpoints"
echo "------------------------"
test_endpoint "Metrics (Prometheus)" "$BASE_URL/api/metrics" 200 false
test_endpoint "Metrics (JSON)" "$BASE_URL/api/metrics/json" 200 true

# Public endpoints
echo ""
echo "🌐 Public Endpoints"
echo "------------------------"
test_endpoint "Contents List" "$BASE_URL/api/contents" 200 true
test_endpoint "Verifications List" "$BASE_URL/api/verifications" 200 true

# Cache metrics (may not be available without Redis)
echo ""
echo "💾 Cache Endpoints (optional)"
echo "------------------------"
curl -s --max-time $TIMEOUT "$BASE_URL/api/cache/metrics" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    test_endpoint "Cache Metrics" "$BASE_URL/api/cache/metrics" 200 true
else
    echo -e "${YELLOW}Cache not available (Redis not configured)${NC}"
fi

# Web application (if testing full stack)
if [ "$BASE_URL" = "http://localhost:3001" ]; then
    WEB_URL="http://localhost:3000"
else
    # Extract protocol and domain, remove /api path if present
    WEB_URL=$(echo "$BASE_URL" | sed 's|/api.*$||')
fi

echo ""
echo "🌍 Web Application"
echo "------------------------"
# Try to reach web app
curl -s --max-time $TIMEOUT "$WEB_URL" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    test_endpoint "Web Home" "$WEB_URL" 200 false
else
    echo -e "${YELLOW}Web application not accessible at $WEB_URL${NC}"
fi

# Summary
echo ""
echo "================================================"
echo "📋 Test Summary"
echo "================================================"
echo -e "Total tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All smoke tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some smoke tests failed!${NC}"
    exit 1
fi
