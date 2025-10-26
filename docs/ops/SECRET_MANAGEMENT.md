# Secret Management Guide

## Overview

This guide provides comprehensive instructions for managing secrets (API keys, database credentials, signing keys, etc.) in the Internet-ID project using industry-standard secret management solutions.

## Table of Contents

1. [Architecture](#architecture)
2. [Supported Secret Managers](#supported-secret-managers)
3. [Secret Categories](#secret-categories)
4. [Secret Rotation Policies](#secret-rotation-policies)
5. [Environment-Specific Configuration](#environment-specific-configuration)
6. [Deployment Integration](#deployment-integration)
7. [Access Control](#access-control)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Emergency Procedures](#emergency-procedures)

## Architecture

The Internet-ID project uses a layered secret management approach:

```
┌─────────────────────────────────────────┐
│     Application Layer                   │
│  (API, Web UI, Scripts)                 │
└──────────────┬──────────────────────────┘
               │ Read secrets at runtime
               │
┌──────────────▼──────────────────────────┐
│   Secret Provider Abstraction           │
│   (Unified interface)                   │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
┌─────▼─────┐    ┌─────▼──────┐
│   AWS     │    │ HashiCorp  │
│ Secrets   │    │   Vault    │
│ Manager   │    │            │
└───────────┘    └────────────┘
```

**Key Principles:**

- **No hardcoded secrets** in code or configuration files
- **Secrets fetched at runtime** from secure storage
- **Environment-specific isolation** (dev/staging/prod)
- **Automatic rotation** with zero-downtime
- **Audit logging** for all secret access
- **Least-privilege access** control

## Supported Secret Managers

### AWS Secrets Manager (Recommended for AWS Deployments)

**Advantages:**
- Native AWS integration
- Automatic rotation support
- Built-in encryption (KMS)
- Fine-grained IAM policies
- Regional replication available

**Setup:** See [AWS Secrets Manager Integration](#aws-secrets-manager-integration)

### HashiCorp Vault (Recommended for Multi-Cloud/On-Premise)

**Advantages:**
- Cloud-agnostic
- Advanced policy engine
- Dynamic secrets support
- Multi-tenancy
- Extensive audit logging

**Setup:** See [HashiCorp Vault Integration](#hashicorp-vault-integration)

### Kubernetes Secrets (Development/Testing Only)

**Use Case:** Local development, testing environments

**Note:** Not recommended for production due to limited security features.

## Secret Categories

### 1. Database Credentials

**Secrets:**
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password
- `DATABASE_URL` - Full connection string

**Rotation:** Quarterly (90 days)

**Critical:** Yes - Database access controls all application data

### 2. IPFS Provider Credentials

**Secrets:**
- `IPFS_PROJECT_ID` - Infura IPFS project ID
- `IPFS_PROJECT_SECRET` - Infura IPFS secret
- `WEB3_STORAGE_TOKEN` - Web3.Storage API token
- `PINATA_JWT` - Pinata JWT token

**Rotation:** Quarterly (90 days)

**Critical:** Medium - Controls content upload capabilities

### 3. Authentication Secrets

**Secrets:**
- `NEXTAUTH_SECRET` - NextAuth session signing key
- `SESSION_SECRET` - Generic session secret
- `API_KEY` - API authentication key
- `RATE_LIMIT_EXEMPT_API_KEY` - Internal service API key

**Rotation:** Quarterly (90 days)

**Critical:** High - Compromised auth secrets enable session hijacking

### 4. OAuth Provider Credentials

**Secrets:**
- `GITHUB_ID` / `GITHUB_SECRET` - GitHub OAuth
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` - Twitter OAuth
- Additional OAuth providers as configured

**Rotation:** Semi-annually (180 days)

**Critical:** Medium - Limited to OAuth flow, revocable

### 5. Blockchain Private Keys

**Secrets:**
- `PRIVATE_KEY` - Deployer/creator account private key

**Rotation:** Annually or on compromise

**Critical:** Critical - Controls contract deployment and on-chain operations

**Special Handling:**
- Store in hardware security module (HSM) when possible
- Use multi-signature wallets for high-value operations
- Never rotate without updating on-chain registrations

### 6. Infrastructure Secrets

**Secrets:**
- `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` - AWS S3 for backups
- `REDIS_URL` - Redis connection (includes auth)
- `ALERT_EMAIL` / SMTP credentials

**Rotation:** Quarterly (90 days)

**Critical:** Medium-High - Infrastructure access

## Secret Rotation Policies

### Automatic Rotation

Secrets should be rotated automatically when supported:

**Supported by AWS Secrets Manager:**
- Database passwords (RDS)
- API keys (with Lambda rotation)

**Supported by HashiCorp Vault:**
- Database credentials (dynamic secrets)
- Cloud provider credentials

### Manual Rotation Procedure

For secrets requiring manual rotation:

1. **Generate new secret** in provider console
2. **Store new secret** in secret manager with version tag
3. **Update application configuration** to use new version
4. **Deploy application** with zero-downtime (blue-green or rolling)
5. **Validate** new secret works in production
6. **Revoke old secret** after validation period (7 days)
7. **Document rotation** in audit log

### Rotation Schedule

| Secret Category | Frequency | Automated | Owner |
|----------------|-----------|-----------|-------|
| Database passwords | Quarterly | Yes (preferred) | DevOps |
| IPFS API keys | Quarterly | Partial | DevOps |
| NextAuth secrets | Quarterly | Manual | Security |
| OAuth credentials | Semi-annually | Manual | Security |
| Private keys | Annually | Manual | Security Lead |
| Infrastructure keys | Quarterly | Partial | DevOps |

### Rotation Testing

**Pre-Production Validation:**

1. Test rotation in development environment
2. Validate rotation in staging environment
3. Execute rotation in production during maintenance window
4. Verify application functionality post-rotation

**Rollback Plan:**

- Keep previous secret version for 7 days
- Document rollback procedure
- Test rollback in staging

## Environment-Specific Configuration

### Development Environment

**Secret Storage:** Local `.env` file or Vault dev server

**Access Control:** Developer-level access

**Configuration:**
```bash
# Development secrets (non-sensitive)
POSTGRES_PASSWORD=dev_password_change_me
API_KEY=dev_api_key
NEXTAUTH_SECRET=dev_nextauth_secret_32_chars_min
```

**Best Practices:**
- Use non-production credentials
- Never commit `.env` to version control
- Use `.env.example` as template
- Rotate dev secrets quarterly

### Staging Environment

**Secret Storage:** AWS Secrets Manager or Vault (staging namespace)

**Access Control:** DevOps + QA team

**Configuration:**
```bash
# Staging - Fetch from secret manager
export ENVIRONMENT=staging
# Secrets fetched via deployment scripts
```

**Best Practices:**
- Mirror production secret structure
- Use separate AWS account or Vault namespace
- Test rotation procedures in staging first

### Production Environment

**Secret Storage:** AWS Secrets Manager or Vault (production namespace)

**Access Control:** Least privilege (application service accounts only)

**Configuration:**
```bash
# Production - Secrets injected at runtime
export ENVIRONMENT=production
# NO manual secret access - use audit trail
```

**Best Practices:**
- No human access to production secrets
- All access via service accounts with IAM roles
- Enable secret versioning
- Encrypt at rest with KMS/Vault encryption
- Enable audit logging
- Configure alerting for unauthorized access

## Deployment Integration

### GitHub Actions Integration

**Secret Storage:** GitHub Secrets (references to secret manager)

**Workflow Example:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    permissions:
      id-token: write  # OIDC token for AWS
      contents: read
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
      
      - name: Fetch secrets from AWS Secrets Manager
        run: |
          # Fetch secrets without exposing in logs
          SECRET_JSON=$(aws secretsmanager get-secret-value \
            --secret-id internet-id/prod/app \
            --query SecretString \
            --output text)
          
          # Parse and set as environment variables (not echoed)
          echo "::add-mask::$(echo $SECRET_JSON | jq -r .DATABASE_URL)"
          echo "DATABASE_URL=$(echo $SECRET_JSON | jq -r .DATABASE_URL)" >> $GITHUB_ENV
          
          echo "::add-mask::$(echo $SECRET_JSON | jq -r .NEXTAUTH_SECRET)"
          echo "NEXTAUTH_SECRET=$(echo $SECRET_JSON | jq -r .NEXTAUTH_SECRET)" >> $GITHUB_ENV
      
      - name: Deploy Application
        run: |
          # Deployment commands here
          # Secrets available as environment variables
          npm run deploy
```

**Security Measures:**

- Use OpenID Connect (OIDC) instead of long-lived credentials
- Mask secrets in logs using `::add-mask::`
- Never echo secrets
- Use GitHub's built-in secret storage for credentials
- Audit GitHub Actions logs regularly

### Docker Deployment

**Using AWS Secrets Manager:**

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production --legacy-peer-deps

COPY . .

# Install AWS CLI for secret fetching
RUN apk add --no-cache aws-cli jq

# Entry point script fetches secrets
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
```

**Entry Point Script:**

```bash
#!/bin/sh
# docker-entrypoint.sh

set -e

# Fetch secrets from AWS Secrets Manager
if [ "$ENVIRONMENT" = "production" ]; then
    echo "Fetching secrets from AWS Secrets Manager..."
    
    SECRET_JSON=$(aws secretsmanager get-secret-value \
        --secret-id "internet-id/$ENVIRONMENT/app" \
        --region us-east-1 \
        --query SecretString \
        --output text)
    
    # Export secrets as environment variables
    export DATABASE_URL=$(echo $SECRET_JSON | jq -r .DATABASE_URL)
    export NEXTAUTH_SECRET=$(echo $SECRET_JSON | jq -r .NEXTAUTH_SECRET)
    export API_KEY=$(echo $SECRET_JSON | jq -r .API_KEY)
    # ... other secrets
fi

# Execute main command
exec "$@"
```

**Kubernetes Deployment:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: internet-id-api
spec:
  template:
    spec:
      serviceAccountName: internet-id-api
      containers:
      - name: api
        image: internet-id:latest
        env:
        - name: ENVIRONMENT
          value: production
        
        # Use External Secrets Operator
        envFrom:
        - secretRef:
            name: internet-id-secrets  # Synced from AWS/Vault
```

**External Secrets Operator:**

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secretsmanager
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: internet-id-api

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: internet-id-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
  target:
    name: internet-id-secrets
  data:
  - secretKey: DATABASE_URL
    remoteRef:
      key: internet-id/prod/app
      property: DATABASE_URL
  - secretKey: NEXTAUTH_SECRET
    remoteRef:
      key: internet-id/prod/app
      property: NEXTAUTH_SECRET
```

## Access Control

### Principle of Least Privilege

**Development Team:**
- ✅ Read access to dev secrets
- ✅ Write access to dev secrets
- ❌ No access to staging/production secrets

**DevOps Team:**
- ✅ Read access to staging secrets
- ✅ Write access to staging secrets
- ✅ Read access to production secrets (emergency only)
- ⚠️ Write access to production (via approved change process)

**Security Team:**
- ✅ Full access to all environments
- ✅ Audit log review access
- ✅ Secret rotation authority

**Application Service Accounts:**
- ✅ Read access to environment-specific secrets only
- ❌ No write access
- ❌ No cross-environment access

### AWS IAM Policy Example

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadProductionSecrets",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:internet-id/prod/*"
    },
    {
      "Sid": "DenySecretModification",
      "Effect": "Deny",
      "Action": [
        "secretsmanager:PutSecretValue",
        "secretsmanager:DeleteSecret",
        "secretsmanager:UpdateSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:internet-id/prod/*"
    }
  ]
}
```

### HashiCorp Vault Policy Example

```hcl
# Policy for production API service
path "secret/data/internet-id/prod/app" {
  capabilities = ["read"]
}

path "secret/data/internet-id/prod/database" {
  capabilities = ["read"]
}

# Deny delete/destroy
path "secret/delete/internet-id/prod/*" {
  capabilities = ["deny"]
}

path "secret/destroy/internet-id/prod/*" {
  capabilities = ["deny"]
}
```

## Monitoring & Alerts

### Secret Access Monitoring

**Metrics to Track:**

1. **Access Frequency**
   - Normal: Secrets accessed during deployment or restart
   - Anomaly: Unexpected access patterns (frequency, timing)

2. **Access Source**
   - Normal: Known service accounts, CI/CD pipelines
   - Anomaly: Unfamiliar IAM roles, unknown IP addresses

3. **Failed Access Attempts**
   - Normal: Occasional permission errors during development
   - Anomaly: Repeated failed attempts (potential breach)

4. **Secret Rotation Status**
   - Normal: Secrets rotated within policy timeframe
   - Anomaly: Overdue rotations, rotation failures

### AWS CloudWatch Alarms

**Example Alert Configuration:**

```yaml
# cloudwatch-alarms.yml
Resources:
  UnauthorizedSecretAccess:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: internet-id-unauthorized-secret-access
      MetricName: UnauthorizedAccessAttempts
      Namespace: AWS/SecretsManager
      Statistic: Sum
      Period: 300  # 5 minutes
      EvaluationPeriods: 1
      Threshold: 3
      AlarmActions:
        - !Ref SecurityTeamSNSTopic
      Dimensions:
        - Name: SecretId
          Value: internet-id/prod/*

  SecretRotationFailure:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: internet-id-rotation-failure
      MetricName: RotationFailure
      Namespace: AWS/SecretsManager
      Statistic: Sum
      Period: 3600  # 1 hour
      EvaluationPeriods: 1
      Threshold: 1
      AlarmActions:
        - !Ref DevOpsSNSTopic
```

### Audit Log Analysis

**Key Events to Monitor:**

```sql
-- CloudWatch Insights or similar
-- Unauthorized access attempts
fields @timestamp, userIdentity.principalId, requestParameters.secretId, errorCode
| filter eventName = "GetSecretValue" and errorCode = "AccessDenied"
| sort @timestamp desc

-- Unusual access patterns
fields @timestamp, userIdentity.principalId, count() as access_count
| filter eventName = "GetSecretValue" 
| stats count() by userIdentity.principalId, bin(1h)
| filter access_count > 100  # Threshold for anomaly

-- Secret modifications
fields @timestamp, userIdentity.principalId, requestParameters.secretId, eventName
| filter eventName in ["PutSecretValue", "DeleteSecret", "UpdateSecret"]
| sort @timestamp desc
```

### Alert Channels

**Critical Alerts:**
- PagerDuty/Opsgenie (24/7 on-call)
- Security team Slack channel
- Email to security@subculture.io

**Warning Alerts:**
- DevOps Slack channel
- Email to ops@subculture.io

**Info Alerts:**
- CloudWatch dashboard
- Weekly digest email

## Emergency Procedures

### Suspected Secret Compromise

**Immediate Actions (within 1 hour):**

1. **Isolate Impact**
   - Identify compromised secret(s)
   - List all services using the secret
   - Document timeline of potential exposure

2. **Revoke Access**
   - Disable compromised secret immediately
   - Block suspicious access patterns (IP, IAM role)
   - Enable additional MFA if not already enabled

3. **Rotate Secret**
   - Generate new secret value
   - Update secret manager with new value
   - Deploy applications with new secret (rolling update)

4. **Notify Stakeholders**
   - Security team
   - DevOps team
   - Management (if data breach suspected)

**Post-Incident (within 24 hours):**

1. **Root Cause Analysis**
   - How was secret compromised?
   - What systems were affected?
   - What data was potentially accessed?

2. **Strengthen Controls**
   - Implement additional monitoring
   - Review access policies
   - Update security procedures

3. **Document Incident**
   - Write incident report
   - Update runbooks
   - Share lessons learned

### Secret Rotation Failure

**Recovery Steps:**

1. **Identify Failure Cause**
   - Check rotation logs
   - Verify permissions
   - Test connectivity to secret manager

2. **Manual Rotation**
   - If automation fails, rotate manually
   - Follow documented manual rotation procedure

3. **Fix Automation**
   - Update rotation scripts/lambdas
   - Test in non-production environment
   - Re-enable automation

### Lost Access to Secret Manager

**Backup Plan:**

1. **Break-Glass Procedure**
   - Use emergency IAM credentials (stored securely offline)
   - Access backup secret copy (encrypted, stored separately)

2. **Restore Access**
   - Verify identity through multiple channels
   - Reset credentials if necessary
   - Document access restoration

3. **Prevent Recurrence**
   - Review backup procedures
   - Update documentation
   - Test recovery quarterly

## Implementation Checklist

### Initial Setup

- [ ] Choose secret management solution (AWS Secrets Manager or Vault)
- [ ] Set up secret manager in all environments (dev, staging, prod)
- [ ] Configure access control policies (IAM/Vault policies)
- [ ] Create secret namespaces/paths for each environment
- [ ] Document secret naming conventions

### Secret Migration

- [ ] Audit current `.env` file for all secrets
- [ ] Categorize secrets by type and criticality
- [ ] Create secrets in secret manager (per environment)
- [ ] Update application code to fetch from secret manager
- [ ] Test secret fetching in development
- [ ] Deploy to staging and validate
- [ ] Deploy to production with rollback plan

### Rotation Setup

- [ ] Configure automatic rotation for database passwords
- [ ] Create rotation scripts/lambdas for API keys
- [ ] Document manual rotation procedures
- [ ] Set up rotation schedule (calendar reminders)
- [ ] Test rotation in non-production environment

### Monitoring Setup

- [ ] Configure CloudWatch/Datadog for secret access metrics
- [ ] Set up alerts for unauthorized access
- [ ] Set up alerts for rotation failures
- [ ] Create dashboard for secret health monitoring
- [ ] Enable audit logging for all secret operations

### Documentation

- [ ] Document secret management architecture
- [ ] Write access request procedures
- [ ] Create rotation runbooks
- [ ] Write emergency response procedures
- [ ] Create training materials for team

### Ongoing Operations

- [ ] Quarterly secret rotation (automated or manual)
- [ ] Monthly audit log review
- [ ] Quarterly access control review
- [ ] Annual disaster recovery drill
- [ ] Continuous monitoring and alerting

## Additional Resources

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
- [OWASP Secret Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [NIST Special Publication 800-57 (Key Management)](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)

## Support

For questions or issues with secret management:

- **Security Concerns:** security@subculture.io
- **Operational Issues:** ops@subculture.io
- **Documentation:** GitHub Discussions

---

**Last Updated:** October 26, 2025  
**Version:** 1.0  
**Maintained By:** Security & DevOps Teams
