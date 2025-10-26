# SSL/TLS Certificate Management

This directory contains scripts and configuration for managing SSL/TLS certificates for the Internet-ID production deployment.

## Files

- **manage-certs.sh** - Main certificate management script
  - Obtain new certificates
  - Renew existing certificates
  - Test certificate validity
  - Revoke certificates
  - Show certificate information

- **check-cert-expiry.sh** - Certificate expiration monitoring
  - Automated daily checks
  - Email alerts for expiring certificates
  - Logs to syslog and file

- **test-ssl-config.sh** - SSL/TLS configuration testing
  - Tests HTTP to HTTPS redirect
  - Verifies TLS versions (1.2, 1.3 only)
  - Checks security headers
  - Tests OCSP stapling
  - Validates cipher strength
  - Tests rate limiting

- **certbot-cron** - Cron job configuration
  - Automatic certificate renewal (twice daily)
  - Daily expiration checks
  - Alert notifications

## Quick Start

### Initial Setup

1. Set environment variables in `.env`:
   ```bash
   DOMAIN=yourdomain.com
   SSL_EMAIL=admin@yourdomain.com
   CERTBOT_STAGING=0  # 0 for production, 1 for testing
   ```

2. Obtain certificate:
   ```bash
   ./manage-certs.sh obtain
   ```

3. Start services:
   ```bash
   docker-compose up -d
   ```

### Daily Operations

Check certificate status:
```bash
./manage-certs.sh info
```

Test certificate validity:
```bash
./manage-certs.sh test
```

Test SSL configuration:
```bash
./test-ssl-config.sh
```

### Certificate Renewal

Automatic renewal happens twice daily via cron (in Docker container).

Manual renewal:
```bash
./manage-certs.sh renew
```

### Monitoring

Check expiration status:
```bash
./check-cert-expiry.sh
```

View logs:
```bash
tail -f /var/log/certbot-renew.log
tail -f /var/log/certbot-check.log
tail -f /var/log/certbot-alerts.log
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOMAIN` | Domain name for certificates | `example.com` |
| `SSL_EMAIL` | Email for Let's Encrypt notifications | `admin@${DOMAIN}` |
| `SSL_ALERT_EMAIL` | Email for expiration alerts | `${SSL_EMAIL}` |
| `CERTBOT_STAGING` | Use staging environment (0/1) | `0` |
| `CERT_WARNING_DAYS` | Days before warning alert | `14` |
| `CERT_CRITICAL_DAYS` | Days before critical alert | `7` |

## Troubleshooting

### Certificate Not Found

Ensure certificates exist:
```bash
ls -la /etc/letsencrypt/live/$DOMAIN/
```

Check certbot logs:
```bash
docker-compose logs certbot
```

### Renewal Failing

Common causes:
- Port 80 not accessible
- DNS not pointing to server
- Rate limits hit
- Disk space full

Check webroot permissions:
```bash
docker-compose exec nginx ls -la /var/www/certbot
```

### Testing Without Production Domain

Use Let's Encrypt staging:
```bash
export CERTBOT_STAGING=1
./manage-certs.sh obtain
```

## Security Best Practices

1. **Never commit certificates or private keys** to version control
2. **Rotate certificates** if compromised immediately
3. **Monitor expiration** with automated alerts
4. **Test configuration** regularly with SSL Labs
5. **Keep certbot updated** for security patches
6. **Use strong email security** for alert notifications
7. **Audit access** to certificate files regularly

## Let's Encrypt Rate Limits

Be aware of Let's Encrypt rate limits:
- 50 certificates per registered domain per week
- 5 duplicate certificates per week
- 300 new orders per account per 3 hours
- 10 accounts per IP per 3 hours

See: https://letsencrypt.org/docs/rate-limits/

Use `CERTBOT_STAGING=1` for testing to avoid hitting limits.

## Related Documentation

- [HTTPS/SSL Setup Guide](../../docs/ops/HTTPS_SSL_SETUP.md)
- [Nginx Configuration](../nginx/)
- [Docker Compose Configuration](../../docker-compose.yml)

## Support

For issues or questions:
- Review logs in `/var/log/`
- Check [Let's Encrypt Community](https://community.letsencrypt.org/)
- Contact ops team
