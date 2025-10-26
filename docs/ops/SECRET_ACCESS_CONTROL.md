# Secret Access Control Policy

## Overview

This document defines access control policies for secrets in the Internet-ID project. These policies enforce least-privilege access and ensure security compliance.

## Policy Principles

1. **Least Privilege** - Users and services receive minimum permissions necessary
2. **Need-to-Know** - Access granted only when required for job function
3. **Separation of Duties** - No single person has complete control
4. **Regular Review** - Access reviewed quarterly
5. **Audit Trail** - All access logged and monitored

## Environment Isolation

Secrets are strictly isolated by environment:

```
┌─────────────┬─────────────┬─────────────┐
│ Development │   Staging   │ Production  │
├─────────────┼─────────────┼─────────────┤
│ Developers  │ DevOps      │ Service     │
│ Full Access │ + QA Team   │ Accounts    │
│             │ Read/Write  │ Read Only   │
└─────────────┴─────────────┴─────────────┘
```

**Rules:**
- Development secrets MUST NOT be used in staging/production
- Production secrets MUST NOT be accessible from dev/staging
- Cross-environment secret sharing is PROHIBITED

## Role-Based Access Control (RBAC)

### Roles and Permissions

#### 1. Developer

**Access:**
- ✅ Full access to development secrets (read/write)
- ✅ Read-only access to `.env.example` template
- ❌ NO access to staging secrets
- ❌ NO access to production secrets

**Use Cases:**
- Local development
- Testing new features
- Debugging issues

**AWS IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:PutSecretValue",
        "secretsmanager:CreateSecret",
        "secretsmanager:UpdateSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:internet-id/dev/*"
    }
  ]
}
```

**Vault Policy:**
```hcl
# developers-policy.hcl
path "secret/data/internet-id/dev/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/internet-id/dev/*" {
  capabilities = ["list", "read"]
}
```

#### 2. QA Engineer

**Access:**
- ✅ Read-only access to staging secrets
- ✅ Full access to test data generators
- ❌ NO write access to staging secrets
- ❌ NO access to production secrets

**Use Cases:**
- Integration testing
- Performance testing
- Validation of deployments

**AWS IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:internet-id/staging/*"
    }
  ]
}
```

#### 3. DevOps Engineer

**Access:**
- ✅ Full access to development and staging secrets
- ✅ Read-only access to production secrets
- ✅ Permission to trigger deployments
- ⚠️ Write access to production requires approval

**Use Cases:**
- Deployment management
- Infrastructure maintenance
- Secret rotation (staging)
- Emergency production access (with approval)

**AWS IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:PutSecretValue",
        "secretsmanager:UpdateSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:*:*:secret:internet-id/dev/*",
        "arn:aws:secretsmanager:*:*:secret:internet-id/staging/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:internet-id/prod/*"
    }
  ]
}
```

**Vault Policy:**
```hcl
# devops-policy.hcl
# Full access to dev and staging
path "secret/data/internet-id/dev/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/data/internet-id/staging/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Read-only for production
path "secret/data/internet-id/prod/*" {
  capabilities = ["read"]
}
```

#### 4. Security Engineer

**Access:**
- ✅ Full access to all environments (dev, staging, prod)
- ✅ Audit log access
- ✅ Secret rotation authority
- ✅ Access review and revocation rights

**Use Cases:**
- Security audits
- Incident response
- Secret rotation
- Access control management

**AWS IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:*"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:internet-id/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudtrail:LookupEvents",
        "cloudwatch:GetMetricData",
        "logs:FilterLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

#### 5. Application Service Account (Production)

**Access:**
- ✅ Read-only access to environment-specific secrets
- ❌ NO write access
- ❌ NO cross-environment access
- ❌ NO access to secret metadata/versions

**Use Cases:**
- Production API runtime
- Production web UI runtime
- Automated jobs (cron, Lambda)

**AWS IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:internet-id/prod/*"
    },
    {
      "Effect": "Deny",
      "Action": [
        "secretsmanager:PutSecretValue",
        "secretsmanager:DeleteSecret",
        "secretsmanager:UpdateSecret"
      ],
      "Resource": "*"
    }
  ]
}
```

**Vault Policy:**
```hcl
# prod-api-policy.hcl
# Read-only access to production secrets
path "secret/data/internet-id/prod/app" {
  capabilities = ["read"]
}

path "secret/data/internet-id/prod/database" {
  capabilities = ["read"]
}

path "secret/data/internet-id/prod/oauth" {
  capabilities = ["read"]
}

# Deny all write operations
path "secret/data/internet-id/prod/*" {
  capabilities = ["read"]
}

path "secret/metadata/internet-id/prod/*" {
  capabilities = ["deny"]
}

# Allow token renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}
```

#### 6. CI/CD Pipeline

**Access:**
- ✅ Read-only access to secrets for deployment
- ✅ Temporary credentials (1-hour TTL)
- ✅ Access logging enabled
- ❌ NO long-lived credentials

**Use Cases:**
- Automated deployments
- Integration tests
- Secret validation

**AWS IAM Policy (with OIDC):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:internet-id/${ENVIRONMENT}/*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    }
  ]
}
```

**GitHub OIDC Trust Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:subculture-collective/internet-id:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

## Access Request Process

### Requesting Access

1. **Submit Request**
   - Use access request form or ticket system
   - Specify: environment, secret(s), reason, duration
   - Get manager approval

2. **Security Review**
   - Security team reviews request
   - Validates business justification
   - Approves or denies within 1 business day

3. **Grant Access**
   - DevOps creates IAM user/role or Vault policy
   - Access granted with expiration date
   - Requestor notified via email

4. **Documentation**
   - Access logged in access control matrix
   - Audit trail maintained

### Access Request Template

```
Access Request Form
===================

Requestor: [Name]
Email: [email@example.com]
Team: [Engineering/DevOps/QA]
Manager: [Manager Name]

Environment: [Development/Staging/Production]
Secrets Requested: [List specific secrets or "all in namespace"]
Access Level: [Read-Only/Read-Write]
Justification: [Business reason for access]
Duration: [Temporary (specify end date) / Permanent]

Manager Approval: [Yes/No]
Security Approval: [Pending]
Date Requested: [YYYY-MM-DD]
```

## Access Revocation

### Automatic Revocation

Access is automatically revoked when:
- Employee leaves the company (immediate)
- Employee changes roles (within 24 hours)
- Temporary access expires
- 90 days of inactivity

### Manual Revocation

Security team can revoke access:
- Suspected account compromise
- Policy violation
- Security incident
- Management request

### Revocation Procedure

```bash
# AWS - Disable IAM user
aws iam update-access-key \
  --access-key-id AKIA... \
  --status Inactive \
  --user-name username

# Delete access key
aws iam delete-access-key \
  --access-key-id AKIA... \
  --user-name username

# Vault - Revoke token
vault token revoke <TOKEN>

# Revoke all tokens for a role
vault token revoke -mode path auth/approle/login
```

## Multi-Factor Authentication (MFA)

### MFA Requirements

| Role | MFA Required | Method |
|------|--------------|--------|
| Developer | Yes (for production VPN) | Authenticator app |
| QA Engineer | Yes (for staging VPN) | Authenticator app |
| DevOps Engineer | Yes (always) | Hardware token or authenticator app |
| Security Engineer | Yes (always) | Hardware token (YubiKey) |
| Service Accounts | N/A | Short-lived credentials |

### AWS MFA Configuration

```bash
# Require MFA for production secret access
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:internet-id/prod/*",
      "Condition": {
        "Bool": {
          "aws:MultiFactorAuthPresent": "true"
        },
        "NumericLessThan": {
          "aws:MultiFactorAuthAge": "3600"
        }
      }
    }
  ]
}
```

## Break-Glass Access

### Emergency Access Procedure

For critical incidents requiring immediate production access:

1. **Declare Incident**
   - Severity: P0 (outage) or P1 (security incident)
   - Incident Commander approves break-glass access

2. **Use Emergency Credentials**
   - Emergency IAM role with full access
   - Credentials stored in secure vault (offline)
   - Requires 2 people to access (dual control)

3. **Access Logging**
   - All actions logged to immutable audit trail
   - CloudTrail + S3 Object Lock

4. **Post-Incident**
   - Rotate all accessed secrets
   - Generate incident report
   - Review access logs
   - Update procedures if needed

### Break-Glass IAM Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:*",
        "rds:*",
        "ec2:*"
      ],
      "Resource": "*"
    }
  ]
}
```

**Conditions:**
- Assumed only during declared incidents
- Requires MFA
- 1-hour session duration
- Logged to separate audit stream

## Access Review

### Quarterly Access Review

**Process:**

1. **Generate Report** (Week 1)
   ```bash
   # List all users with secret access
   aws iam list-users | jq -r '.Users[].UserName' | while read user; do
     echo "User: $user"
     aws iam list-attached-user-policies --user-name $user
   done
   ```

2. **Review Access** (Week 2)
   - Security team reviews all access
   - Validates each user still needs access
   - Checks for over-privileged accounts

3. **Revoke Unnecessary Access** (Week 3)
   - Remove access for users who no longer need it
   - Downgrade over-privileged accounts
   - Document changes

4. **Report** (Week 4)
   - Generate compliance report
   - Document all changes
   - Present to management

### Access Review Checklist

- [ ] All current users still employed?
- [ ] All users still in same role?
- [ ] Any users with access to multiple environments?
- [ ] Any users with write access to production?
- [ ] Any long-lived credentials (>90 days)?
- [ ] Any service accounts with excessive permissions?
- [ ] All temporary access grants expired?
- [ ] All access properly documented?

## Compliance and Auditing

### Audit Logging

All secret access is logged:

- **What:** Secret accessed, action performed
- **Who:** User/service account
- **When:** Timestamp (UTC)
- **Where:** Source IP, region
- **Why:** Request context (if available)

**Retention:** 1 year (minimum), 7 years for compliance

### Audit Queries

**Recent access to production secrets:**
```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::SecretsManager::Secret \
  --start-time $(date -d '7 days ago' +%s) \
  --max-results 100 | jq -r '.Events[] | select(.Resources[].ResourceName | contains("internet-id/prod"))'
```

**Failed access attempts:**
```bash
aws logs filter-log-events \
  --log-group-name /aws/cloudtrail/logs \
  --filter-pattern '{ $.errorCode = "AccessDenied" && $.eventName = "GetSecretValue" }' \
  --start-time $(date -d '24 hours ago' +%s)000
```

### Compliance Standards

This access control policy supports compliance with:

- **SOC 2** - Access control and audit logging
- **GDPR** - Data protection and access limitations
- **PCI-DSS** - Secrets management (if applicable)
- **HIPAA** - Access control and audit (if applicable)

## Violations and Consequences

### Policy Violations

Examples of violations:
- Sharing credentials with unauthorized users
- Accessing secrets without business need
- Using production secrets in dev/staging
- Hardcoding secrets in code
- Committing secrets to git
- Sharing secrets via email/Slack

### Consequences

| Severity | First Offense | Second Offense | Third Offense |
|----------|--------------|----------------|---------------|
| Minor | Warning | Access revoked (7 days) | Permanent revocation |
| Moderate | Access revoked (30 days) | Written warning | Termination |
| Severe | Written warning | Termination | Legal action |

**Severe violations include:**
- Intentional data breach
- Malicious access to secrets
- Sharing secrets with external parties

## Contact Information

**Access Requests:**
- Email: access-requests@subculture.io
- Slack: #access-control

**Security Incidents:**
- Emergency: security@subculture.io
- Slack: #security-incidents

**Questions:**
- DevOps: ops@subculture.io
- Security: security@subculture.io

---

**Last Updated:** October 26, 2025  
**Version:** 1.0  
**Approved By:** Security Team, CTO  
**Next Review:** January 26, 2026
