# HashiCorp Vault Integration Guide

## Overview

This guide provides step-by-step instructions for integrating HashiCorp Vault with the Internet-ID project for secure, cloud-agnostic secret management.

## Table of Contents

1. [Why Vault](#why-vault)
2. [Installation](#installation)
3. [Initial Configuration](#initial-configuration)
4. [Secret Structure](#secret-structure)
5. [Application Integration](#application-integration)
6. [Dynamic Secrets](#dynamic-secrets)
7. [Secret Rotation](#secret-rotation)
8. [Authentication Methods](#authentication-methods)
9. [Policies](#policies)
10. [High Availability](#high-availability)
11. [Monitoring](#monitoring)
12. [Troubleshooting](#troubleshooting)

## Why Vault

**Advantages over AWS Secrets Manager:**

- ✅ Cloud-agnostic (works on-premise, multi-cloud)
- ✅ Dynamic secret generation
- ✅ Advanced policy engine (fine-grained access control)
- ✅ Secret leasing and automatic revocation
- ✅ Extensive audit logging
- ✅ Plugin ecosystem for various backends

**Best for:**

- Multi-cloud deployments
- On-premise infrastructure
- Organizations with strict compliance requirements
- Complex secret management workflows

## Installation

### Option 1: Docker (Development)

```bash
# Start Vault in development mode
docker run --cap-add=IPC_LOCK \
  -p 8200:8200 \
  -e 'VAULT_DEV_ROOT_TOKEN_ID=dev-root-token' \
  --name vault-dev \
  -d vault:1.15

# Verify
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='dev-root-token'
vault status
```

### Option 2: Binary Installation (Production)

```bash
# Download Vault
wget https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip

# Extract
unzip vault_1.15.0_linux_amd64.zip

# Move to path
sudo mv vault /usr/local/bin/

# Verify
vault version
```

### Option 3: Kubernetes (Production)

```yaml
# vault-helm-values.yaml
server:
  ha:
    enabled: true
    replicas: 3

  dataStorage:
    enabled: true
    size: 10Gi

  auditStorage:
    enabled: true
    size: 10Gi

  resources:
    requests:
      memory: 256Mi
      cpu: 250m
    limits:
      memory: 512Mi
      cpu: 500m

ui:
  enabled: true
  serviceType: LoadBalancer
```

```bash
# Install with Helm
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault -f vault-helm-values.yaml
```

## Initial Configuration

### Step 1: Initialize Vault

```bash
# Initialize (production)
vault operator init -key-shares=5 -key-threshold=3 > vault-init.txt

# IMPORTANT: Store unseal keys and root token securely!
# Each key share should be given to a different operator
```

**Example output:**

```
Unseal Key 1: AbCdEf1234567890...
Unseal Key 2: GhIjKl1234567890...
Unseal Key 3: MnOpQr1234567890...
Unseal Key 4: StUvWx1234567890...
Unseal Key 5: YzAbCd1234567890...

Initial Root Token: s.RootToken1234567890

Vault initialized with 5 key shares and a key threshold of 3.
```

### Step 2: Unseal Vault

```bash
# Unseal (requires 3 out of 5 keys)
vault operator unseal <UNSEAL_KEY_1>
vault operator unseal <UNSEAL_KEY_2>
vault operator unseal <UNSEAL_KEY_3>

# Verify
vault status
```

### Step 3: Enable Audit Logging

```bash
# Login with root token
vault login <ROOT_TOKEN>

# Enable file audit device
vault audit enable file file_path=/vault/logs/audit.log

# Or enable syslog
vault audit enable syslog
```

### Step 4: Enable Secrets Engines

```bash
# Enable KV v2 secrets engine (versioned secrets)
vault secrets enable -path=secret -version=2 kv

# Enable database secrets engine (dynamic credentials)
vault secrets enable database

# Enable transit engine (encryption as a service)
vault secrets enable transit
```

## Secret Structure

### Namespace Organization

```
secret/
├── internet-id/
│   ├── prod/
│   │   ├── app              # Application secrets
│   │   ├── database         # Database credentials
│   │   ├── blockchain       # Blockchain private keys
│   │   └── oauth            # OAuth provider credentials
│   ├── staging/
│   │   ├── app
│   │   ├── database
│   │   ├── blockchain
│   │   └── oauth
│   └── dev/
│       ├── app
│       ├── database
│       └── oauth
```

### Creating Secrets

**Application secrets:**

```bash
vault kv put secret/internet-id/prod/app \
  API_KEY="prod_api_key_32_characters_minimum" \
  NEXTAUTH_SECRET="nextauth_signing_key_64_characters" \
  SESSION_SECRET="session_signing_key_32_characters" \
  RATE_LIMIT_EXEMPT_API_KEY="internal_service_key" \
  IPFS_PROJECT_ID="infura_ipfs_project_id" \
  IPFS_PROJECT_SECRET="infura_ipfs_project_secret" \
  WEB3_STORAGE_TOKEN="web3_storage_api_token" \
  PINATA_JWT="pinata_jwt_token"
```

**Database secrets:**

```bash
vault kv put secret/internet-id/prod/database \
  POSTGRES_USER="internetid_prod" \
  POSTGRES_PASSWORD="secure_generated_password" \
  POSTGRES_HOST="prod-db.example.com" \
  POSTGRES_PORT="5432" \
  POSTGRES_DB="internetid" \
  DATABASE_URL="postgresql://internetid_prod:PASSWORD@prod-db.example.com:5432/internetid?schema=public"
```

**OAuth credentials:**

```bash
vault kv put secret/internet-id/prod/oauth \
  GITHUB_ID="github_oauth_client_id" \
  GITHUB_SECRET="github_oauth_client_secret" \
  GOOGLE_CLIENT_ID="google_oauth_client_id" \
  GOOGLE_CLIENT_SECRET="google_oauth_client_secret" \
  TWITTER_CLIENT_ID="twitter_oauth_client_id" \
  TWITTER_CLIENT_SECRET="twitter_oauth_client_secret"
```

**Blockchain secrets:**

```bash
vault kv put secret/internet-id/prod/blockchain \
  PRIVATE_KEY="0x1234567890abcdef..." \
  RPC_URL="https://mainnet.base.org" \
  REGISTRY_ADDRESS="0xContractAddress..."
```

### Reading Secrets

```bash
# Read entire secret
vault kv get secret/internet-id/prod/app

# Read specific field
vault kv get -field=API_KEY secret/internet-id/prod/app

# Read as JSON
vault kv get -format=json secret/internet-id/prod/app
```

## Application Integration

### Install Node.js Client

```bash
npm install --save node-vault
```

### Create Vault Client Module

```typescript
// scripts/services/vault-client.ts
import vault from "node-vault";

const VAULT_ADDR = process.env.VAULT_ADDR || "http://localhost:8200";
const VAULT_TOKEN = process.env.VAULT_TOKEN;

if (!VAULT_TOKEN && process.env.ENVIRONMENT !== "development") {
  throw new Error("VAULT_TOKEN is required for non-development environments");
}

const client = vault({
  apiVersion: "v1",
  endpoint: VAULT_ADDR,
  token: VAULT_TOKEN,
});

export async function getSecret(path: string): Promise<Record<string, any>> {
  try {
    const response = await client.read(path);
    return response.data.data; // KV v2 uses data.data
  } catch (error) {
    console.error(`Failed to read secret at ${path}:`, error);
    throw error;
  }
}

export async function getAllSecrets(environment: string): Promise<Record<string, string>> {
  const secrets: Record<string, string> = {};

  // Load application secrets
  const appSecrets = await getSecret(`secret/data/internet-id/${environment}/app`);
  Object.assign(secrets, appSecrets);

  // Load database secrets
  const dbSecrets = await getSecret(`secret/data/internet-id/${environment}/database`);
  Object.assign(secrets, dbSecrets);

  // Load OAuth secrets
  const oauthSecrets = await getSecret(`secret/data/internet-id/${environment}/oauth`);
  Object.assign(secrets, oauthSecrets);

  return secrets;
}

export async function loadVaultSecrets(): Promise<void> {
  const environment = process.env.ENVIRONMENT || "development";

  if (environment === "development") {
    // Use .env file in development
    return;
  }

  console.log(`Loading secrets from Vault for environment: ${environment}`);

  const secrets = await getAllSecrets(environment);

  // Set as environment variables
  Object.entries(secrets).forEach(([key, value]) => {
    process.env[key] = value;
  });

  console.log(`Loaded ${Object.keys(secrets).length} secrets from Vault`);
}

export default client;
```

### Update Application Startup

```typescript
// scripts/api.ts
import * as dotenv from "dotenv";
import { loadVaultSecrets } from "./services/vault-client";

async function startServer() {
  // Load .env for local development
  dotenv.config();

  // Load secrets from Vault in staging/production
  if (process.env.VAULT_ADDR && process.env.ENVIRONMENT !== "development") {
    await loadVaultSecrets();
  }

  // Rest of application startup...
  const app = express();
  // ... configure app
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
```

## Dynamic Secrets

### Database Dynamic Secrets

**Step 1: Configure database connection**

```bash
vault write database/config/internetid-postgres \
  plugin_name=postgresql-database-plugin \
  allowed_roles="internet-id-api" \
  connection_url="postgresql://{{username}}:{{password}}@prod-db.example.com:5432/internetid?sslmode=require" \
  username="vault_admin" \
  password="vault_admin_password"
```

**Step 2: Create role for dynamic credentials**

```bash
vault write database/roles/internet-id-api \
  db_name=internetid-postgres \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\"; \
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"
```

**Step 3: Generate dynamic credentials**

```bash
# Generate credentials (valid for 1 hour)
vault read database/creds/internet-id-api

# Example output:
# Key                Value
# ---                -----
# lease_id           database/creds/internet-id-api/abc123
# lease_duration     1h
# lease_renewable    true
# password           A1a-BbCcDdEeFfGg
# username           v-token-internet-1234567890
```

**Step 4: Use in application**

```typescript
// scripts/services/dynamic-db-credentials.ts
import vault from "./vault-client";

export async function getDatabaseCredentials(): Promise<{
  username: string;
  password: string;
  lease_id: string;
}> {
  const response = await vault.read("database/creds/internet-id-api");

  return {
    username: response.data.username,
    password: response.data.password,
    lease_id: response.lease_id,
  };
}

export async function renewLease(leaseId: string): Promise<void> {
  await vault.write("sys/leases/renew", {
    lease_id: leaseId,
    increment: 3600, // Renew for 1 hour
  });
}

// Use in application
const { username, password, lease_id } = await getDatabaseCredentials();
const DATABASE_URL = `postgresql://${username}:${password}@prod-db.example.com:5432/internetid`;

// Renew lease before expiration
setInterval(
  async () => {
    await renewLease(lease_id);
  },
  30 * 60 * 1000
); // Renew every 30 minutes
```

## Secret Rotation

### Manual Rotation

```bash
# Create new version of secret
vault kv put secret/internet-id/prod/app \
  API_KEY="new_api_key_value" \
  NEXTAUTH_SECRET="new_nextauth_secret" \
  # ... other secrets

# View version history
vault kv metadata get secret/internet-id/prod/app

# Rollback if needed
vault kv rollback -version=1 secret/internet-id/prod/app
```

### Automated Rotation Script

```typescript
// scripts/rotate-vault-secrets.ts
import vault from "./services/vault-client";
import { randomBytes } from "crypto";

async function rotateApiKey(environment: string): Promise<void> {
  console.log(`Rotating API key for ${environment}...`);

  // Generate new API key
  const newApiKey = randomBytes(32).toString("hex");

  // Read current secrets
  const currentSecrets = await vault.read(`secret/data/internet-id/${environment}/app`);
  const secrets = currentSecrets.data.data;

  // Update with new API key
  secrets.API_KEY = newApiKey;

  // Write new version
  await vault.write(`secret/data/internet-id/${environment}/app`, {
    data: secrets,
  });

  console.log(`API key rotated successfully for ${environment}`);
}

async function rotateAllSecrets(): Promise<void> {
  const environments = ["staging", "prod"];

  for (const env of environments) {
    await rotateApiKey(env);
    // Add other rotation functions as needed
  }
}

// Run rotation
rotateAllSecrets().catch(console.error);
```

**Schedule rotation with cron:**

```bash
# Rotate secrets quarterly
0 0 1 */3 * cd /opt/internet-id && npm run rotate-secrets
```

## Authentication Methods

### AppRole (Recommended for Applications)

**Step 1: Enable AppRole**

```bash
vault auth enable approle
```

**Step 2: Create role for production API**

```bash
vault write auth/approle/role/internet-id-api \
  token_policies="internet-id-prod-read" \
  token_ttl=1h \
  token_max_ttl=4h
```

**Step 3: Get role credentials**

```bash
# Get role ID
vault read auth/approle/role/internet-id-api/role-id

# Generate secret ID
vault write -f auth/approle/role/internet-id-api/secret-id
```

**Step 4: Login with AppRole**

```typescript
// scripts/services/vault-approle-auth.ts
import vault from "node-vault";

const VAULT_ADDR = process.env.VAULT_ADDR!;
const ROLE_ID = process.env.VAULT_ROLE_ID!;
const SECRET_ID = process.env.VAULT_SECRET_ID!;

export async function authenticateWithAppRole() {
  const client = vault({
    apiVersion: "v1",
    endpoint: VAULT_ADDR,
  });

  // Login with AppRole
  const response = await client.approleLogin({
    role_id: ROLE_ID,
    secret_id: SECRET_ID,
  });

  // Set token for future requests
  client.token = response.auth.client_token;

  // Renew token before expiration
  setInterval(
    async () => {
      await client.tokenRenewSelf();
    },
    30 * 60 * 1000
  ); // Renew every 30 minutes

  return client;
}
```

### Kubernetes Auth (For Kubernetes Deployments)

**Step 1: Enable Kubernetes auth**

```bash
vault auth enable kubernetes

# Configure
vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc:443"
```

**Step 2: Create role**

```bash
vault write auth/kubernetes/role/internet-id-api \
  bound_service_account_names=internet-id-api \
  bound_service_account_namespaces=production \
  policies=internet-id-prod-read \
  ttl=1h
```

**Step 3: Login from pod**

```typescript
// scripts/services/vault-k8s-auth.ts
import vault from "node-vault";
import { readFileSync } from "fs";

export async function authenticateWithKubernetes() {
  const VAULT_ADDR = process.env.VAULT_ADDR!;
  const jwt = readFileSync("/var/run/secrets/kubernetes.io/serviceaccount/token", "utf8");

  const client = vault({
    apiVersion: "v1",
    endpoint: VAULT_ADDR,
  });

  // Login with Kubernetes auth
  const response = await client.kubernetesLogin({
    role: "internet-id-api",
    jwt: jwt,
  });

  client.token = response.auth.client_token;

  return client;
}
```

### AWS IAM Auth (For AWS Deployments)

```bash
# Enable AWS auth
vault auth enable aws

# Configure
vault write auth/aws/config/client \
  access_key=AKIAIOSFODNN7EXAMPLE \
  secret_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Create role for EC2 instances
vault write auth/aws/role/internet-id-api \
  auth_type=iam \
  bound_iam_principal_arn=arn:aws:iam::ACCOUNT_ID:role/internet-id-api \
  policies=internet-id-prod-read \
  ttl=1h
```

## Policies

### Production Read-Only Policy

```hcl
# internet-id-prod-read.hcl
# Read application secrets
path "secret/data/internet-id/prod/app" {
  capabilities = ["read"]
}

# Read database secrets
path "secret/data/internet-id/prod/database" {
  capabilities = ["read"]
}

# Read OAuth secrets
path "secret/data/internet-id/prod/oauth" {
  capabilities = ["read"]
}

# Read blockchain secrets
path "secret/data/internet-id/prod/blockchain" {
  capabilities = ["read"]
}

# Allow token renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Deny all other paths
path "secret/*" {
  capabilities = ["deny"]
}
```

**Apply policy:**

```bash
vault policy write internet-id-prod-read internet-id-prod-read.hcl
```

### DevOps Policy (Staging Management)

```hcl
# internet-id-devops.hcl
# Full access to staging secrets
path "secret/data/internet-id/staging/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/internet-id/staging/*" {
  capabilities = ["list", "read"]
}

# Read-only access to production
path "secret/data/internet-id/prod/*" {
  capabilities = ["read"]
}

# Can generate database credentials for staging
path "database/creds/internet-id-staging" {
  capabilities = ["read"]
}
```

**Apply policy:**

```bash
vault policy write internet-id-devops internet-id-devops.hcl
```

## High Availability

### Vault Cluster Setup

```hcl
# vault-ha.hcl
storage "consul" {
  address = "consul.service.consul:8500"
  path    = "vault/"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 0
  tls_cert_file = "/etc/vault/tls/vault.crt"
  tls_key_file  = "/etc/vault/tls/vault.key"
}

api_addr = "https://vault.example.com:8200"
cluster_addr = "https://vault-internal.example.com:8201"

ui = true
```

**Start Vault cluster:**

```bash
# On each node
vault server -config=/etc/vault/vault-ha.hcl
```

### Monitoring HA Status

```bash
# Check cluster status
vault operator raft list-peers

# Check leader
vault status | grep "HA Mode"
```

## Monitoring

### Enable Prometheus Metrics

```hcl
# vault.hcl
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
}
```

**Scrape metrics:**

```bash
curl http://localhost:8200/v1/sys/metrics?format=prometheus
```

### Key Metrics

- `vault_core_unsealed` - Vault seal status
- `vault_runtime_alloc_bytes` - Memory usage
- `vault_core_handle_request` - Request rate
- `vault_audit_log_request` - Audit log writes
- `vault_token_count` - Active tokens

### CloudWatch Integration

```typescript
// scripts/monitoring/vault-metrics.ts
import vault from "../services/vault-client";
import { CloudWatch } from "@aws-sdk/client-cloudwatch";

const cloudwatch = new CloudWatch({ region: "us-east-1" });

async function publishVaultMetrics() {
  const health = await vault.health();

  await cloudwatch.putMetricData({
    Namespace: "InternetID/Vault",
    MetricData: [
      {
        MetricName: "VaultSealed",
        Value: health.sealed ? 1 : 0,
        Unit: "None",
      },
      {
        MetricName: "VaultInitialized",
        Value: health.initialized ? 1 : 0,
        Unit: "None",
      },
    ],
  });
}

// Run every minute
setInterval(publishVaultMetrics, 60000);
```

## Troubleshooting

### Common Issues

**1. Vault Sealed**

```bash
# Check status
vault status

# Unseal
vault operator unseal <KEY_1>
vault operator unseal <KEY_2>
vault operator unseal <KEY_3>
```

**2. Token Expired**

```bash
# Check token info
vault token lookup

# Renew token
vault token renew

# Or re-authenticate
vault login <AUTH_METHOD>
```

**3. Permission Denied**

```bash
# Check current policies
vault token lookup -format=json | jq -r '.data.policies'

# Read policy details
vault policy read <POLICY_NAME>

# Update policy if needed
vault policy write <POLICY_NAME> policy.hcl
```

**4. Connection Refused**

```bash
# Check Vault is running
systemctl status vault

# Check listener address
vault status

# Verify VAULT_ADDR
echo $VAULT_ADDR
```

### Debug Commands

```bash
# Enable debug logging
export VAULT_LOG_LEVEL=debug

# View audit logs
vault audit list
cat /vault/logs/audit.log | jq

# Check secret versions
vault kv metadata get secret/internet-id/prod/app

# Test policy
vault policy read internet-id-prod-read

# List active leases
vault list sys/leases/lookup/database/creds/internet-id-api
```

## Security Best Practices

1. **Use TLS for all connections** - Never run Vault without TLS in production
2. **Enable audit logging** - Track all secret access
3. **Implement least-privilege policies** - Grant minimum necessary permissions
4. **Rotate unseal keys** - Use key rotation for long-term security
5. **Use dynamic secrets when possible** - Automatic expiration and rotation
6. **Monitor metrics and logs** - Detect anomalies early
7. **Backup Vault data** - Regular backups of Vault storage backend
8. **Test disaster recovery** - Practice restore procedures

## Additional Resources

- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
- [Vault Node.js Client](https://github.com/kr1sp1n/node-vault)
- [Vault Production Hardening](https://learn.hashicorp.com/tutorials/vault/production-hardening)
- [Vault Reference Architecture](https://learn.hashicorp.com/tutorials/vault/reference-architecture)

---

**Last Updated:** October 26, 2025  
**Version:** 1.0
