# Secret Rotation Procedures

## Overview

This document provides step-by-step procedures for rotating all secrets in the Internet-ID project. Follow these procedures to maintain security and comply with rotation policies.

## Rotation Schedule

| Secret Type                  | Frequency                 | Automation            | Owner         |
| ---------------------------- | ------------------------- | --------------------- | ------------- |
| Database passwords           | Quarterly (90 days)       | Automated (preferred) | DevOps        |
| API keys (IPFS, third-party) | Quarterly (90 days)       | Semi-automated        | DevOps        |
| NextAuth secrets             | Quarterly (90 days)       | Manual                | Security      |
| OAuth credentials            | Semi-annually (180 days)  | Manual                | Security      |
| Private keys (blockchain)    | Annually or on compromise | Manual                | Security Lead |
| Infrastructure keys          | Quarterly (90 days)       | Semi-automated        | DevOps        |

## Pre-Rotation Checklist

Before rotating any secret:

- [ ] Schedule rotation during low-traffic period or maintenance window
- [ ] Notify team of planned rotation (24-48 hours advance notice)
- [ ] Ensure backup of current secrets exists
- [ ] Test rotation procedure in staging environment
- [ ] Prepare rollback plan
- [ ] Document expected downtime (if any)

## General Rotation Procedure

### Phase 1: Preparation (1-2 days before)

1. **Test in Staging**

   ```bash
   # Rotate in staging first
   export ENVIRONMENT=staging
   npm run rotate-secrets:staging

   # Verify application works
   npm run test:integration
   ```

2. **Schedule Maintenance Window**
   - Notify users of scheduled maintenance
   - Set up monitoring alerts
   - Prepare rollback procedure

3. **Create Backup**
   ```bash
   # Backup current secrets
   npm run backup-secrets
   ```

### Phase 2: Rotation (Maintenance Window)

1. **Generate New Secret**

   ```bash
   # Example: Generate new API key
   openssl rand -hex 32
   ```

2. **Store in Secret Manager**

   **AWS Secrets Manager:**

   ```bash
   aws secretsmanager put-secret-value \
     --secret-id internet-id/prod/app \
     --secret-string "$(cat secrets-new.json)"
   ```

   **Vault:**

   ```bash
   vault kv put secret/internet-id/prod/app \
     @secrets-new.json
   ```

3. **Deploy Application**

   ```bash
   # Rolling deployment to pickup new secrets
   kubectl rollout restart deployment/internet-id-api

   # Or for Docker
   docker-compose up -d --force-recreate
   ```

4. **Verify**

   ```bash
   # Test endpoints
   curl -H "x-api-key: NEW_API_KEY" \
     https://api.example.com/health

   # Check logs for errors
   kubectl logs -f deployment/internet-id-api
   ```

### Phase 3: Validation (First 24 hours)

1. **Monitor Metrics**
   - Check error rates
   - Monitor authentication failures
   - Verify API call success rates

2. **Test Critical Paths**
   - Upload content
   - Register on-chain
   - Verify content
   - OAuth sign-in flows

3. **Keep Old Secret Active**
   - Wait 24-48 hours before revoking old secret
   - Allows time to catch issues

### Phase 4: Cleanup (2-7 days after)

1. **Revoke Old Secret**

   **AWS:**

   ```bash
   aws secretsmanager update-secret-version-stage \
     --secret-id internet-id/prod/app \
     --version-stage AWSPREVIOUS \
     --remove-from-version-id OLD_VERSION
   ```

   **Vault:**

   ```bash
   vault kv delete secret/internet-id/prod/app
   ```

2. **Update Documentation**
   - Record rotation date
   - Update runbooks if needed
   - Note any issues encountered

3. **Schedule Next Rotation**
   - Add to calendar (90 days from now)
   - Set reminder (7 days before)

## Secret-Specific Procedures

### 1. Database Password Rotation

**Automated (AWS RDS + Secrets Manager):**

```bash
# Enable automatic rotation
aws secretsmanager rotate-secret \
  --secret-id internet-id/prod/database \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:ACCOUNT:function:rotate-db \
  --rotation-rules AutomaticallyAfterDays=90

# Monitor rotation
aws secretsmanager describe-secret \
  --secret-id internet-id/prod/database \
  --query 'RotationEnabled'
```

**Manual (PostgreSQL):**

```sql
-- 1. Create new user with same privileges
CREATE USER internetid_new WITH PASSWORD 'new_secure_password';
GRANT ALL PRIVILEGES ON DATABASE internetid TO internetid_new;
GRANT ALL ON ALL TABLES IN SCHEMA public TO internetid_new;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO internetid_new;

-- 2. Update connection string in secret manager
-- DATABASE_URL=postgresql://internetid_new:new_secure_password@...

-- 3. Deploy application with new connection string

-- 4. Verify application works

-- 5. Drop old user (after 7 days)
DROP USER internetid_old;
```

### 2. API Key Rotation (API_KEY)

```bash
# 1. Generate new API key
NEW_API_KEY=$(openssl rand -hex 32)

# 2. Update secret manager
aws secretsmanager update-secret \
  --secret-id internet-id/prod/app \
  --secret-string "{\"API_KEY\":\"$NEW_API_KEY\",...}"

# 3. Update clients with new key
# Send email to API key holders with new key
# Provide 30-day transition period

# 4. Support both old and new keys during transition
# Modify API middleware to accept both keys

# 5. After 30 days, disable old key
```

### 3. NextAuth Secret Rotation

```bash
# 1. Generate new secret (minimum 32 characters)
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update secret manager
vault kv put secret/internet-id/prod/app \
  NEXTAUTH_SECRET="$NEW_SECRET"

# 3. Rolling deployment
kubectl rollout restart deployment/internet-id-web

# 4. All existing sessions will be invalidated
# Users will need to sign in again

# 5. Monitor sign-in success rate
```

**Note:** Rotating NextAuth secret invalidates all sessions. Schedule during low-activity period.

### 4. OAuth Provider Credentials

**GitHub OAuth:**

1. Create new OAuth app in GitHub Settings
2. Get new Client ID and Client Secret
3. Update secret manager:
   ```bash
   vault kv patch secret/internet-id/prod/oauth \
     GITHUB_ID="new_client_id" \
     GITHUB_SECRET="new_client_secret"
   ```
4. Deploy application
5. Test sign-in flow
6. Delete old OAuth app after validation

**Google OAuth:**

Similar process via Google Cloud Console:

1. Go to APIs & Services > Credentials
2. Create new OAuth 2.0 Client ID
3. Update secret manager
4. Deploy application
5. Test sign-in
6. Delete old credentials

### 5. IPFS Provider Credentials

**Infura:**

```bash
# 1. Create new project in Infura dashboard
# 2. Get new PROJECT_ID and PROJECT_SECRET

# 3. Update secrets
aws secretsmanager update-secret \
  --secret-id internet-id/prod/app \
  --secret-string '{
    "IPFS_PROJECT_ID": "new_project_id",
    "IPFS_PROJECT_SECRET": "new_project_secret"
  }'

# 4. Deploy application
kubectl rollout restart deployment/internet-id-api

# 5. Test upload
npm run test:ipfs-upload

# 6. Delete old Infura project after validation
```

**Pinata:**

```bash
# 1. Generate new JWT in Pinata dashboard
NEW_JWT="eyJ..."

# 2. Update secret
vault kv patch secret/internet-id/prod/app \
  PINATA_JWT="$NEW_JWT"

# 3. Deploy and test
# 4. Revoke old JWT
```

### 6. Blockchain Private Key Rotation

⚠️ **CRITICAL: High-risk operation**

**Prerequisites:**

- Requires updating on-chain registry
- Plan for extended maintenance window
- Consider using multi-sig for future operations

**Procedure:**

```bash
# 1. Generate new private key
NEW_KEY=$(openssl rand -hex 32)
NEW_ADDRESS="0x..."

# 2. Transfer ownership of ContentRegistry
# Call transferOwnership(newAddress) on contract

# 3. Update secret manager
aws secretsmanager put-secret-value \
  --secret-id internet-id/prod/blockchain \
  --secret-string "{\"PRIVATE_KEY\":\"$NEW_KEY\"}"

# 4. Deploy application

# 5. Verify new key can interact with contract

# 6. Securely destroy old key
# Use secure deletion (shred, wipe)
```

**Recommendation:** Use hardware security module (HSM) or multi-sig wallet instead.

### 7. Infrastructure Secrets (S3, Redis)

**AWS S3 Credentials:**

```bash
# 1. Create new IAM user or rotate access keys
aws iam create-access-key --user-name internet-id-backup

# 2. Update secret manager
aws secretsmanager update-secret \
  --secret-id internet-id/prod/infrastructure \
  --secret-string '{
    "S3_ACCESS_KEY_ID": "AKIA...",
    "S3_SECRET_ACCESS_KEY": "..."
  }'

# 3. Deploy application

# 4. Test backup/restore

# 5. Delete old access key
aws iam delete-access-key \
  --user-name internet-id-backup \
  --access-key-id OLD_KEY_ID
```

## Emergency Rotation (Suspected Compromise)

If a secret is suspected to be compromised, execute emergency rotation immediately:

### Immediate Actions (Within 1 hour)

1. **Revoke compromised secret**

   ```bash
   # Disable immediately, don't wait
   aws secretsmanager update-secret-version-stage \
     --secret-id internet-id/prod/app \
     --version-stage AWSCURRENT \
     --remove-from-version-id COMPROMISED_VERSION
   ```

2. **Generate and deploy new secret**

   ```bash
   # Generate new
   NEW_SECRET=$(openssl rand -hex 32)

   # Update
   aws secretsmanager put-secret-value \
     --secret-id internet-id/prod/app \
     --secret-string "..."

   # Force restart all services
   kubectl rollout restart deployment/internet-id-api
   kubectl rollout restart deployment/internet-id-web
   ```

3. **Audit access logs**

   ```bash
   # Check who accessed the secret
   aws cloudtrail lookup-events \
     --lookup-attributes AttributeKey=ResourceName,AttributeValue=internet-id/prod/app
   ```

4. **Notify security team**
   - Document incident
   - Notify stakeholders
   - Begin investigation

### Follow-Up (Within 24 hours)

1. Review all related secrets
2. Check for unauthorized access
3. Rotate related secrets if necessary
4. Update security procedures
5. Write incident report

## Automation Scripts

### Rotation Script

```bash
#!/bin/bash
# scripts/security/rotate-secret.sh

SECRET_PATH="$1"
NEW_VALUE="$2"

if [ -z "$SECRET_PATH" ] || [ -z "$NEW_VALUE" ]; then
    echo "Usage: $0 <secret-path> <new-value>"
    exit 1
fi

# Backup current value
echo "Backing up current value..."
vault kv get -format=json "$SECRET_PATH" > "backup-$(date +%Y%m%d).json"

# Update secret
echo "Updating secret..."
vault kv patch "$SECRET_PATH" "$NEW_VALUE"

# Trigger deployment
echo "Triggering deployment..."
kubectl rollout restart deployment/internet-id-api

echo "Rotation complete. Monitor application for issues."
```

### Validation Script

```bash
#!/bin/bash
# scripts/security/validate-rotation.sh

ENVIRONMENT="$1"

# Test API endpoint
echo "Testing API endpoint..."
curl -f -H "x-api-key: $API_KEY" https://api.example.com/health || exit 1

# Test database connection
echo "Testing database connection..."
psql $DATABASE_URL -c "SELECT 1" || exit 1

# Test IPFS upload
echo "Testing IPFS upload..."
npm run test:ipfs-upload || exit 1

echo "All validations passed!"
```

## Rollback Procedure

If rotation causes issues:

1. **Immediate rollback**

   ```bash
   # Restore previous secret version
   aws secretsmanager update-secret-version-stage \
     --secret-id internet-id/prod/app \
     --version-stage AWSCURRENT \
     --move-to-version-id PREVIOUS_VERSION

   # Restart services
   kubectl rollout restart deployment/internet-id-api
   ```

2. **Verify rollback**

   ```bash
   # Test functionality
   npm run test:integration
   ```

3. **Investigate issue**
   - Review logs
   - Identify root cause
   - Document findings

4. **Retry rotation**
   - Fix identified issues
   - Test in staging
   - Re-attempt production rotation

## Compliance and Auditing

### Rotation Log

Maintain a rotation log for compliance:

```markdown
# Secret Rotation Log

| Date       | Secret                    | Type     | Rotated By | Status  | Notes              |
| ---------- | ------------------------- | -------- | ---------- | ------- | ------------------ |
| 2025-10-26 | internet-id/prod/app      | API_KEY  | DevOps     | Success | Quarterly rotation |
| 2025-10-26 | internet-id/prod/database | Password | Automated  | Success | RDS auto-rotation  |
```

### Audit Report

Generate quarterly audit reports:

```bash
# List all secrets and last rotation date
aws secretsmanager list-secrets \
  --query 'SecretList[?starts_with(Name, `internet-id/prod`)].{Name:Name,LastRotated:LastRotatedDate}' \
  --output table

# Check for overdue rotations
```

## Contact and Escalation

**Rotation Issues:**

- Primary: DevOps team (ops@subculture.io)
- Escalation: Security team (security@subculture.io)

**Emergency (Secret Compromise):**

- Immediate: Security Lead (on-call)
- Email: security@subculture.io
- Slack: #security-incidents (urgent)

---

**Last Updated:** October 26, 2025  
**Version:** 1.0  
**Maintained By:** Security & DevOps Teams
