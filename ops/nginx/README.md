# Nginx Configuration for Internet-ID

This directory contains Nginx configuration files for SSL/TLS termination and reverse proxy setup.

## Files

- **nginx.conf** - Main Nginx configuration
  - Worker processes and connections
  - HTTP settings
  - Gzip compression
  - Rate limiting zones
  - Security settings

- **conf.d/default.conf** - Server configuration
  - HTTP to HTTPS redirect
  - SSL/TLS settings
  - Security headers (HSTS, CSP, etc.)
  - Reverse proxy to API and web services
  - OCSP stapling
  - Rate limiting rules

## Configuration Highlights

### SSL/TLS Settings

- **Protocols**: TLS 1.2 and 1.3 only (TLS 1.0/1.1 disabled)
- **Ciphers**: Modern, secure cipher suites with forward secrecy
- **OCSP Stapling**: Enabled for improved performance
- **Session Cache**: 50MB shared cache, 1-day timeout
- **Certificate Locations**: `/etc/letsencrypt/live/${DOMAIN}/`

### Security Headers

All HTTPS responses include:

1. **HSTS** (HTTP Strict Transport Security)
   - `max-age=63072000` (2 years)
   - `includeSubDomains`
   - `preload` ready

2. **CSP** (Content Security Policy)
   - Restricts resource loading to trusted sources
   - Allows necessary external services (IPFS, RPC endpoints)
   - Prevents XSS attacks

3. **X-Frame-Options**: `SAMEORIGIN`
4. **X-Content-Type-Options**: `nosniff`
5. **X-XSS-Protection**: `1; mode=block`
6. **Referrer-Policy**: `strict-origin-when-cross-origin`
7. **Permissions-Policy**: Restricts browser features

### Rate Limiting

Three-tier rate limiting:

| Zone | Rate | Burst | Applied To |
|------|------|-------|------------|
| general | 100 req/s | 100 | Web pages |
| api | 30 req/s | 50 | API endpoints |
| upload | 5 req/s | 3 | Upload/register operations |

Health check endpoint (`/health`) bypasses rate limiting.

### Reverse Proxy Routes

- `/` → Next.js web app (port 3000)
- `/api/` → Express API server (port 3001)
- `/health` → API health check (no rate limit)
- `/.well-known/acme-challenge/` → Certbot webroot

## Usage

### Docker Deployment

The configuration is mounted into the Nginx container:

```yaml
volumes:
  - ./ops/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
  - ./ops/nginx/conf.d:/etc/nginx/conf.d:ro
```

### Environment Variables

The configuration uses environment variable substitution:

- `${DOMAIN}` - Your domain name (set in `.env`)

Example in `docker-compose.yml`:
```yaml
environment:
  - DOMAIN=${DOMAIN:-localhost}
```

### Testing Configuration

Test Nginx configuration syntax:
```bash
# In Docker
docker-compose exec nginx nginx -t

# On host (if Nginx installed)
nginx -t -c ops/nginx/nginx.conf
```

Reload configuration without downtime:
```bash
docker-compose exec nginx nginx -s reload
```

## Customization

### Adjusting Rate Limits

Edit `nginx.conf`:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
```

Edit `conf.d/default.conf`:
```nginx
location /api/ {
    limit_req zone=api burst=50 nodelay;
    # ...
}
```

### Modifying CSP Header

Edit `conf.d/default.conf`:
```nginx
add_header Content-Security-Policy "..." always;
```

Adjust directives based on your application needs:
- `script-src` - JavaScript sources
- `style-src` - CSS sources
- `img-src` - Image sources
- `connect-src` - AJAX/WebSocket sources
- `font-src` - Font sources

### Adding Additional Domains

For multiple domains, duplicate the HTTPS server block with different `server_name`:

```nginx
server {
    listen 443 ssl http2;
    server_name www.yourdomain.com;
    # ... SSL settings ...
    
    # Redirect to primary domain
    return 301 https://yourdomain.com$request_uri;
}
```

### Client Body Size

For larger uploads, adjust in `nginx.conf`:
```nginx
client_max_body_size 1G;  # Default: 1GB
```

And in the location block:
```nginx
location /api/upload {
    client_max_body_size 2G;  # Override for specific endpoint
    # ...
}
```

## Troubleshooting

### Configuration Test Fails

```bash
# Check syntax
docker-compose exec nginx nginx -t

# View error details
docker-compose logs nginx
```

Common issues:
- Missing semicolons
- Mismatched braces
- Invalid directives
- Missing SSL certificate files

### SSL Certificate Errors

```bash
# Verify certificate files exist
docker-compose exec nginx ls -la /etc/letsencrypt/live/$DOMAIN/

# Check certificate validity
docker-compose exec nginx openssl x509 -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem -text -noout
```

### Rate Limiting Too Aggressive

Temporarily disable for testing:
```nginx
# Comment out the limit_req line
# limit_req zone=api burst=50 nodelay;
```

Or increase limits:
```nginx
limit_req zone=api burst=100 nodelay;
```

### Headers Not Appearing

Ensure `always` is specified:
```nginx
add_header X-Custom-Header "value" always;
```

Check response with curl:
```bash
curl -I https://yourdomain.com
```

## Performance Tuning

### Worker Processes

```nginx
worker_processes auto;  # One per CPU core
worker_connections 1024;  # Adjust based on traffic
```

### Compression

Gzip is enabled by default. Adjust level if needed:
```nginx
gzip_comp_level 6;  # 1-9, higher = more CPU but better compression
```

### Caching (Optional)

Add proxy caching for static assets:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;

location /static/ {
    proxy_cache my_cache;
    proxy_cache_valid 200 1h;
    proxy_pass http://web:3000;
}
```

## Security Best Practices

1. **Keep Nginx Updated**: Regular security patches
2. **Monitor Logs**: Watch for suspicious activity
3. **Rate Limits**: Prevent abuse and DDoS
4. **Strong Ciphers**: Disable weak/deprecated ciphers
5. **HSTS Preload**: Submit to HSTS preload list
6. **Regular Testing**: Use SSL Labs for configuration audit
7. **Access Control**: Restrict sensitive endpoints if needed

## SSL Labs Testing

Target grade: **A+**

Test your configuration:
```
https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

Key requirements for A+:
- TLS 1.2+ only ✓
- Strong cipher suites ✓
- Forward secrecy ✓
- HSTS with long max-age ✓
- Certificate chain complete ✓
- No weak protocols/ciphers ✓

## Related Documentation

- [HTTPS/SSL Setup Guide](../../docs/ops/HTTPS_SSL_SETUP.md)
- [SSL Certificate Management](../ssl/README.md)
- [Nginx Official Documentation](https://nginx.org/en/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

## Support

For issues:
- Check Nginx logs: `docker-compose logs nginx`
- Test configuration: `nginx -t`
- Review SSL Labs test results
- Consult Nginx documentation
