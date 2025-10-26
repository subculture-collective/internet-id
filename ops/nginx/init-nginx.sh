#!/bin/sh
# Nginx configuration initialization script
# Substitutes environment variables in configuration files

set -e

DOMAIN="${DOMAIN:-localhost}"

echo "Initializing Nginx configuration..."
echo "Domain: $DOMAIN"

# Create a temporary config with substituted variables
envsubst '${DOMAIN}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Test configuration
nginx -t

echo "Nginx configuration initialized successfully"
