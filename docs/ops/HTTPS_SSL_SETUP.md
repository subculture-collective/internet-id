# HTTPS/SSL Configuration Guide

This guide covers the complete setup and management of HTTPS/SSL certificates for the Internet-ID production deployment.

## Overview

The Internet-ID platform uses a comprehensive SSL/TLS setup that includes:

- **Nginx reverse proxy** for SSL/TLS termination
- **Let's Encrypt certificates** via certbot for free, automated SSL
- **Automatic certificate renewal** with monitoring and alerts
- **Modern security headers** (HSTS, CSP, etc.)
- **TLS 1.2/1.3 only** with strong cipher suites
- **OCSP stapling** for improved performance
- **Rate limiting** at the proxy level

## Architecture

```
Internet
    ↓
[Nginx - Port 80/443]
    ↓ SSL Termination
    ├─→ [Next.js Web - Port 3000]
    └─→ [Express API - Port 3001]
        └─→ [PostgreSQL DB - Port 5432]
```

All external traffic flows through Nginx, which handles:
- HTTP → HTTPS redirect
- SSL/TLS termination
- Security headers
- Rate limiting
- Reverse proxying to backend services

## Prerequisites

1. **Domain name** pointing to your server
2. **DNS A/AAAA records** configured
3. **Firewall rules** allowing ports 80 and 443
4. **Docker and Docker Compose** installed

## Initial Setup

### 1. Configure Environment Variables

Add to your `.env` file:

```bash
# Domain Configuration
DOMAIN=yourdomain.com
SSL_EMAIL=admin@yourdomain.com

# Optional: Use Let's Encrypt staging for testing
CERTBOT_STAGING=0

# Alert Configuration
SSL_ALERT_EMAIL=ops@yourdomain.com
CERT_WARNING_DAYS=14
CERT_CRITICAL_DAYS=7

# Application URLs (use HTTPS)
NEXT_PUBLIC_API_BASE=https://yourdomain.com/api
NEXT_PUBLIC_SITE_BASE=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
```

### 2. Initial Certificate Obtainment

**Option A: Using Docker Compose (Recommended)**

The first time you deploy, you'll need to obtain certificates before starting Nginx:

```bash
# Start only the certbot service with a temporary configuration
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $SSL_EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Start all services
docker-compose up -d
```

**Option B: Using the Management Script**

```bash
# Set your domain in .env first
export DOMAIN=yourdomain.com
export SSL_EMAIL=admin@yourdomain.com

# Run the certificate management script
./ops/ssl/manage-certs.sh obtain
```

### 3. Start the Services

```bash
# Start all services with SSL enabled
docker-compose up -d

# Verify Nginx is running
docker-compose ps nginx

# Check logs
docker-compose logs -f nginx
```

### 4. Verify SSL Configuration

Test your SSL setup:

```bash
# Check certificate
curl -I https://yourdomain.com

# Test SSL Labs (external)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

# Check HSTS header
curl -I https://yourdomain.com | grep -i strict-transport-security

# Verify redirect
curl -I http://yourdomain.com
```

## Certificate Management

### Automatic Renewal

Certificates are automatically renewed by the certbot container, which runs twice daily. Certbot only renews certificates within 30 days of expiration.

### Manual Operations

Use the certificate management script for manual operations:

```bash
# View certificate information
./ops/ssl/manage-certs.sh info

# Test certificate validity
./ops/ssl/manage-certs.sh test

# Force renewal
./ops/ssl/manage-certs.sh renew

# Revoke certificate
./ops/ssl/manage-certs.sh revoke

# Help
./ops/ssl/manage-certs.sh help
```

### Certificate Monitoring

The system includes automated monitoring:

```bash
# Check certificate expiration manually
./ops/ssl/check-cert-expiry.sh

# View monitoring logs
tail -f /var/log/certbot-check.log
tail -f /var/log/certbot-alerts.log
```

#### Setting up Cron (for non-Docker deployments)

```bash
# Install the cron jobs
crontab -l | cat - ops/ssl/certbot-cron | crontab -

# Or manually add to crontab
crontab -e
```

The cron jobs:
- Renew certificates twice daily (3:15 AM and 3:15 PM)
- Check expiration daily (8:30 AM)
- Send email alerts if certificate expires within 14 days

## Security Configuration

### TLS Protocols and Ciphers

The Nginx configuration uses:
- **Protocols:** TLS 1.2 and TLS 1.3 only (TLS 1.0/1.1 disabled)
- **Ciphers:** Strong ECDHE and DHE cipher suites
- **Preference:** Client cipher preference disabled (server chooses best cipher)

### Security Headers

All responses include:

1. **HSTS (HTTP Strict Transport Security)**
   - Max age: 2 years
   - Includes subdomains
   - Preload ready

2. **Content Security Policy (CSP)**
   - Restricts resource loading
   - Prevents XSS attacks
   - Allows necessary external resources (IPFS gateways, RPC endpoints)

3. **X-Frame-Options**
   - Prevents clickjacking
   - Set to SAMEORIGIN

4. **X-Content-Type-Options**
   - Prevents MIME sniffing
   - Set to nosniff

5. **Referrer-Policy**
   - Strict origin when cross-origin

6. **Permissions-Policy**
   - Disables unnecessary browser features

### OCSP Stapling

Enabled for improved performance and privacy:
- Caches OCSP responses
- Reduces client-side OCSP lookups
- Uses Google DNS (8.8.8.8, 8.8.4.4) for resolution

## Rate Limiting

Nginx implements multi-tier rate limiting:

1. **General Traffic:** 100 requests/second (burst: 100)
2. **API Endpoints:** 30 requests/second (burst: 50)
3. **Upload Endpoints:** 5 requests/second (burst: 3)

Health check endpoint (`/health`) bypasses rate limiting.

## SSL Labs Testing

For an A+ rating, ensure:

1. ✅ TLS 1.2+ only
2. ✅ Strong cipher suites
3. ✅ HSTS with long max-age
4. ✅ OCSP stapling enabled
5. ✅ Certificate chain complete
6. ✅ Forward secrecy supported

Test at: https://www.ssllabs.com/ssltest/

## Troubleshooting

### Certificate Not Found

If Nginx fails to start due to missing certificates:

```bash
# Create self-signed cert for initial startup
docker-compose run --rm nginx sh -c "mkdir -p /etc/letsencrypt/live/$DOMAIN && \
    openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -days 1 -subj '/CN=localhost'"

# Start services
docker-compose up -d

# Obtain real certificate
./ops/ssl/manage-certs.sh obtain

# Restart Nginx
docker-compose restart nginx
```

### Let's Encrypt Rate Limits

If you hit rate limits:

1. Use staging environment: `CERTBOT_STAGING=1`
2. Wait for rate limit reset (see: https://letsencrypt.org/docs/rate-limits/)
3. Ensure DNS is correctly configured before attempting

### Certificate Renewal Failures

Check logs:

```bash
# Certbot logs
docker-compose logs certbot

# Nginx logs
docker-compose logs nginx

# Check file permissions
docker-compose exec nginx ls -la /etc/letsencrypt/live/$DOMAIN
```

Common issues:
- Webroot not accessible
- Firewall blocking port 80
- DNS not pointing to server
- Disk space full

### Testing Without Real Domain

For local testing, use staging certificates:

```bash
# In .env
CERTBOT_STAGING=1
DOMAIN=staging.yourdomain.com

# Obtain staging certificate
./ops/ssl/manage-certs.sh obtain
```

Note: Staging certificates won't be trusted by browsers but allow testing the flow.

## Production Checklist

Before going live:

- [ ] Domain DNS configured (A/AAAA records)
- [ ] Firewall allows ports 80 and 443
- [ ] Environment variables set in `.env`
- [ ] SSL email configured for notifications
- [ ] Obtained production certificates (not staging)
- [ ] Verified HTTPS redirect works
- [ ] Tested SSL Labs rating (aim for A+)
- [ ] Confirmed HSTS header present
- [ ] Set up monitoring/alerts
- [ ] Configured cron jobs for renewal
- [ ] Documented emergency procedures
- [ ] Tested certificate renewal process

## Emergency Procedures

### Certificate Expired

1. Check renewal logs: `docker-compose logs certbot`
2. Manually renew: `./ops/ssl/manage-certs.sh renew`
3. Restart Nginx: `docker-compose restart nginx`
4. If renewal fails, obtain new certificate: `./ops/ssl/manage-certs.sh obtain`

### Nginx Won't Start

1. Check configuration: `docker-compose exec nginx nginx -t`
2. Review logs: `docker-compose logs nginx`
3. Verify certificate files exist
4. Check file permissions
5. Validate nginx config syntax

### Compromised Private Key

1. Revoke certificate immediately: `./ops/ssl/manage-certs.sh revoke`
2. Obtain new certificate: `./ops/ssl/manage-certs.sh obtain`
3. Investigate how compromise occurred
4. Update security procedures

## Performance Optimization

### HTTP/2

Already enabled in Nginx configuration for improved performance.

### Session Resumption

Configured with:
- 1-day session timeout
- 50MB session cache
- Session tickets disabled (security)

### Compression

Gzip enabled for:
- Text files (HTML, CSS, JS)
- JSON/XML
- Fonts
- SVG images

## Monitoring and Alerts

### Metrics to Monitor

1. Certificate expiration date
2. SSL handshake errors
3. TLS protocol versions used
4. Cipher suite distribution
5. OCSP stapling failures
6. Rate limit hits

### Alert Conditions

- Certificate expires in < 14 days (WARNING)
- Certificate expires in < 7 days (CRITICAL)
- Certificate expired (CRITICAL)
- Renewal failures
- High rate limit rejections

## Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Module](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs Testing](https://www.ssllabs.com/ssltest/)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Support

For issues:
1. Check logs: `docker-compose logs nginx certbot`
2. Verify configuration: `nginx -t`
3. Review this documentation
4. Contact ops team: ops@yourdomain.com
