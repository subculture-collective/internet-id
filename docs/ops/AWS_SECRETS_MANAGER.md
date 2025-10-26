# AWS Secrets Manager Integration Guide

## Overview

This guide provides step-by-step instructions for integrating AWS Secrets Manager with the Internet-ID project for secure secret management in production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Secret Structure](#secret-structure)
4. [Application Integration](#application-integration)
5. [Automatic Rotation](#automatic-rotation)
6. [Monitoring](#monitoring)
7. [Cost Optimization](#cost-optimization)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- AWS account with admin access
- AWS CLI installed and configured
- Node.js 18+ installed
- IAM permissions to create/manage secrets

## Setup

### Step 1: Install AWS SDK

```bash
npm install --save @aws-sdk/client-secrets-manager
```

### Step 2: Create Secret Namespace Structure

```bash
# Production secrets
aws secretsmanager create-secret \
    --name internet-id/prod/app \
    --description "Internet-ID production application secrets" \
    --secret-string file://secrets-prod.json \
    --region us-east-1

aws secretsmanager create-secret \
    --name internet-id/prod/database \
    --description "Internet-ID production database credentials" \
    --secret-string file://secrets-db-prod.json \
    --region us-east-1

# Staging secrets
aws secretsmanager create-secret \
    --name internet-id/staging/app \
    --description "Internet-ID staging application secrets" \
    --secret-string file://secrets-staging.json \
    --region us-east-1

aws secretsmanager create-secret \
    --name internet-id/staging/database \
    --description "Internet-ID staging database credentials" \
    --secret-string file://secrets-db-staging.json \
    --region us-east-1
```

### Step 3: Configure IAM Policies

**Create IAM policy for production application:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadApplicationSecrets",
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:internet-id/prod/app-*",
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:internet-id/prod/database-*"
      ]
    },
    {
      "Sid": "DecryptSecrets",
      "Effect": "Allow",
      "Action": ["kms:Decrypt", "kms:DescribeKey"],
      "Resource": "arn:aws:kms:us-east-1:ACCOUNT_ID:key/KEY_ID",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "secretsmanager.us-east-1.amazonaws.com"
        }
      }
    }
  ]
}
```

**Create the policy:**

```bash
aws iam create-policy \
    --policy-name InternetIDProductionSecretsReadOnly \
    --policy-document file://iam-policy-prod-readonly.json
```

**Attach to application role:**

```bash
aws iam attach-role-policy \
    --role-name internet-id-prod-api \
    --policy-arn arn:aws:iam::ACCOUNT_ID:policy/InternetIDProductionSecretsReadOnly
```

### Step 4: Enable Encryption with KMS

**Create KMS key for secrets:**

```bash
aws kms create-key \
    --description "Internet-ID Secrets Manager encryption key" \
    --tags TagKey=Project,TagValue=internet-id TagKey=Environment,TagValue=production
```

**Create alias:**

```bash
aws kms create-alias \
    --alias-name alias/internet-id-secrets \
    --target-key-id <KEY_ID>
```

**Update secret to use KMS key:**

```bash
aws secretsmanager update-secret \
    --secret-id internet-id/prod/app \
    --kms-key-id alias/internet-id-secrets
```

## Secret Structure

### Application Secrets (`internet-id/prod/app`)

```json
{
  "API_KEY": "prod_api_key_32_characters_minimum",
  "NEXTAUTH_SECRET": "nextauth_signing_key_64_characters_recommended",
  "SESSION_SECRET": "session_signing_key_32_characters_minimum",
  "RATE_LIMIT_EXEMPT_API_KEY": "internal_service_key",

  "IPFS_PROJECT_ID": "infura_ipfs_project_id",
  "IPFS_PROJECT_SECRET": "infura_ipfs_project_secret",
  "WEB3_STORAGE_TOKEN": "web3_storage_api_token",
  "PINATA_JWT": "pinata_jwt_token",

  "GITHUB_ID": "github_oauth_client_id",
  "GITHUB_SECRET": "github_oauth_client_secret",
  "GOOGLE_CLIENT_ID": "google_oauth_client_id",
  "GOOGLE_CLIENT_SECRET": "google_oauth_client_secret",
  "TWITTER_CLIENT_ID": "twitter_oauth_client_id",
  "TWITTER_CLIENT_SECRET": "twitter_oauth_client_secret",

  "S3_ACCESS_KEY_ID": "aws_s3_access_key_for_backups",
  "S3_SECRET_ACCESS_KEY": "aws_s3_secret_key_for_backups",
  "S3_BUCKET": "internet-id-backups",
  "S3_REGION": "us-east-1"
}
```

### Database Secrets (`internet-id/prod/database`)

```json
{
  "POSTGRES_USER": "internetid_prod",
  "POSTGRES_PASSWORD": "secure_generated_password_32_chars",
  "POSTGRES_HOST": "prod-db.example.com",
  "POSTGRES_PORT": "5432",
  "POSTGRES_DB": "internetid",
  "DATABASE_URL": "postgresql://internetid_prod:PASSWORD@prod-db.example.com:5432/internetid?schema=public"
}
```

### Blockchain Secrets (`internet-id/prod/blockchain`)

```json
{
  "PRIVATE_KEY": "0x1234567890abcdef...",
  "RPC_URL": "https://mainnet.base.org",
  "REGISTRY_ADDRESS": "0xContractAddress..."
}
```

**Note:** For production, consider using AWS KMS for private key management or a hardware security module (HSM).

## Application Integration

### Option 1: Fetch Secrets at Startup (Recommended)

**Create secret loader module:**

```typescript
// scripts/services/secret-manager.ts
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || "us-east-1",
});

export async function loadSecrets(secretId: string): Promise<Record<string, string>> {
  try {
    const command = new GetSecretValueCommand({
      SecretId: secretId,
    });

    const response = await client.send(command);

    if (!response.SecretString) {
      throw new Error(`Secret ${secretId} has no string value`);
    }

    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error(`Failed to load secret ${secretId}:`, error);
    throw error;
  }
}

export async function loadAllSecrets(): Promise<void> {
  const environment = process.env.ENVIRONMENT || "development";

  if (environment === "development") {
    // Use .env file in development
    return;
  }

  // Load application secrets
  const appSecrets = await loadSecrets(`internet-id/${environment}/app`);
  Object.entries(appSecrets).forEach(([key, value]) => {
    process.env[key] = value;
  });

  // Load database secrets
  const dbSecrets = await loadSecrets(`internet-id/${environment}/database`);
  Object.entries(dbSecrets).forEach(([key, value]) => {
    process.env[key] = value;
  });

  console.log(`Loaded secrets for environment: ${environment}`);
}
```

**Update application startup:**

```typescript
// scripts/api.ts or main entry point
import * as dotenv from "dotenv";
import { loadAllSecrets } from "./services/secret-manager";

async function startServer() {
  // Load .env for local development
  dotenv.config();

  // Load secrets from AWS Secrets Manager in staging/production
  if (process.env.ENVIRONMENT !== "development") {
    await loadAllSecrets();
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

### Option 2: Fetch Secrets On-Demand (For Sensitive Operations)

```typescript
// For operations requiring blockchain private key
import { loadSecrets } from "./services/secret-manager";

async function deployContract() {
  const environment = process.env.ENVIRONMENT || "development";

  let privateKey: string;

  if (environment === "development") {
    privateKey = process.env.PRIVATE_KEY!;
  } else {
    const blockchainSecrets = await loadSecrets(`internet-id/${environment}/blockchain`);
    privateKey = blockchainSecrets.PRIVATE_KEY;
  }

  // Use private key for deployment
  const wallet = new ethers.Wallet(privateKey);
  // ... deploy contract
}
```

### Option 3: Use Environment Variables (Docker/Kubernetes)

**Fetch secrets in entry point script:**

```bash
#!/bin/sh
# docker-entrypoint.sh

set -e

if [ "$ENVIRONMENT" != "development" ]; then
    echo "Loading secrets from AWS Secrets Manager..."

    # Install jq if not present
    apk add --no-cache jq aws-cli

    # Fetch application secrets
    APP_SECRET_JSON=$(aws secretsmanager get-secret-value \
        --secret-id "internet-id/$ENVIRONMENT/app" \
        --region ${AWS_REGION:-us-east-1} \
        --query SecretString \
        --output text)

    # Export each secret as environment variable
    export API_KEY=$(echo $APP_SECRET_JSON | jq -r .API_KEY)
    export NEXTAUTH_SECRET=$(echo $APP_SECRET_JSON | jq -r .NEXTAUTH_SECRET)
    export IPFS_PROJECT_ID=$(echo $APP_SECRET_JSON | jq -r .IPFS_PROJECT_ID)
    export IPFS_PROJECT_SECRET=$(echo $APP_SECRET_JSON | jq -r .IPFS_PROJECT_SECRET)
    # ... export other secrets

    # Fetch database secrets
    DB_SECRET_JSON=$(aws secretsmanager get-secret-value \
        --secret-id "internet-id/$ENVIRONMENT/database" \
        --region ${AWS_REGION:-us-east-1} \
        --query SecretString \
        --output text)

    export DATABASE_URL=$(echo $DB_SECRET_JSON | jq -r .DATABASE_URL)

    echo "Secrets loaded successfully"
fi

# Start application
exec "$@"
```

## Automatic Rotation

### Database Password Rotation

**Step 1: Create rotation Lambda function**

```bash
# Clone AWS rotation templates
git clone https://github.com/aws-samples/aws-secrets-manager-rotation-lambdas.git
cd aws-secrets-manager-rotation-lambdas/SecretsManagerRDSPostgreSQLRotationSingleUser
```

**Step 2: Deploy Lambda**

```bash
aws cloudformation deploy \
    --template-file serverless-rotation.yaml \
    --stack-name internet-id-rotation-lambda \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        endpoint=https://secretsmanager.us-east-1.amazonaws.com \
        functionName=internet-id-postgres-rotation
```

**Step 3: Enable automatic rotation**

```bash
aws secretsmanager rotate-secret \
    --secret-id internet-id/prod/database \
    --rotation-lambda-arn arn:aws:lambda:us-east-1:ACCOUNT_ID:function:internet-id-postgres-rotation \
    --rotation-rules AutomaticallyAfterDays=90
```

### API Key Rotation (Custom Lambda)

**Create rotation Lambda:**

```typescript
// lambda/rotate-api-keys.ts
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { randomBytes } from "crypto";

export async function handler(event: any) {
  const { SecretId, Token, Step } = event;

  const client = new SecretsManagerClient({ region: "us-east-1" });

  switch (Step) {
    case "createSecret":
      // Generate new API key
      const newApiKey = randomBytes(32).toString("hex");

      // Get current secret
      const getCurrentCommand = new GetSecretValueCommand({
        SecretId,
        VersionStage: "AWSCURRENT",
      });
      const currentResponse = await client.send(getCurrentCommand);
      const currentSecret = JSON.parse(currentResponse.SecretString!);

      // Update with new API key
      currentSecret.API_KEY = newApiKey;

      // Store as AWSPENDING
      const putCommand = new PutSecretValueCommand({
        SecretId,
        ClientRequestToken: Token,
        SecretString: JSON.stringify(currentSecret),
        VersionStages: ["AWSPENDING"],
      });
      await client.send(putCommand);
      break;

    case "setSecret":
      // In this case, no external service to update
      // API key is just stored in Secrets Manager
      break;

    case "testSecret":
      // Test new API key works
      // Could make a test request to the API
      const getTestCommand = new GetSecretValueCommand({
        SecretId,
        VersionId: Token,
        VersionStage: "AWSPENDING",
      });
      const testResponse = await client.send(getTestCommand);
      const testSecret = JSON.parse(testResponse.SecretString!);

      // Verify API key format
      if (!/^[a-f0-9]{64}$/.test(testSecret.API_KEY)) {
        throw new Error("Invalid API key format");
      }
      break;

    case "finishSecret":
      // Mark AWSPENDING as AWSCURRENT
      // AWS Secrets Manager handles this automatically
      break;
  }

  return { statusCode: 200 };
}
```

**Deploy and configure:**

```bash
# Package Lambda
cd lambda
npm install
zip -r rotation-lambda.zip .

# Create Lambda function
aws lambda create-function \
    --function-name internet-id-api-key-rotation \
    --runtime nodejs20.x \
    --role arn:aws:iam::ACCOUNT_ID:role/lambda-rotation-role \
    --handler rotate-api-keys.handler \
    --zip-file fileb://rotation-lambda.zip \
    --timeout 30

# Enable rotation
aws secretsmanager rotate-secret \
    --secret-id internet-id/prod/app \
    --rotation-lambda-arn arn:aws:lambda:us-east-1:ACCOUNT_ID:function:internet-id-api-key-rotation \
    --rotation-rules AutomaticallyAfterDays=90
```

## Monitoring

### CloudWatch Metrics

**Enable CloudWatch logging:**

```bash
# Create log group
aws logs create-log-group \
    --log-group-name /aws/secretsmanager/internet-id

# Set retention
aws logs put-retention-policy \
    --log-group-name /aws/secretsmanager/internet-id \
    --retention-in-days 90
```

**Key metrics to monitor:**

- `GetSecretValue` call count
- `GetSecretValue` errors
- `RotateSecret` success/failure
- Secret age (days since last rotation)

### CloudWatch Alarms

```bash
# Alarm for failed secret access
aws cloudwatch put-metric-alarm \
    --alarm-name internet-id-secret-access-failures \
    --alarm-description "Alert on failed secret access attempts" \
    --metric-name GetSecretValueErrors \
    --namespace AWS/SecretsManager \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:security-alerts

# Alarm for rotation failures
aws cloudwatch put-metric-alarm \
    --alarm-name internet-id-rotation-failures \
    --alarm-description "Alert on secret rotation failures" \
    --metric-name RotationFailed \
    --namespace AWS/SecretsManager \
    --statistic Sum \
    --period 3600 \
    --threshold 1 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:ops-alerts
```

### Audit with CloudTrail

**Enable CloudTrail logging for Secrets Manager:**

```bash
aws cloudtrail put-event-selectors \
    --trail-name internet-id-audit \
    --event-selectors '[
        {
            "ReadWriteType": "All",
            "IncludeManagementEvents": true,
            "DataResources": [{
                "Type": "AWS::SecretsManager::Secret",
                "Values": ["arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:internet-id/*"]
            }]
        }
    ]'
```

**Query CloudTrail logs:**

```bash
# Recent secret access
aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::SecretsManager::Secret \
    --max-results 50

# Unauthorized access attempts
aws logs filter-log-events \
    --log-group-name /aws/cloudtrail/internet-id-audit \
    --filter-pattern '{ ($.errorCode = "AccessDenied") && ($.eventName = "GetSecretValue") }'
```

## Cost Optimization

### Secret Pricing (AWS Secrets Manager)

- **Storage:** $0.40 per secret per month
- **API Calls:** $0.05 per 10,000 API calls

### Cost Saving Strategies

**1. Consolidate related secrets:**

```json
// Instead of separate secrets (costs $2/month):
// - internet-id/prod/api-key
// - internet-id/prod/nextauth-secret
// - internet-id/prod/session-secret
// - internet-id/prod/github-id
// - internet-id/prod/github-secret

// Use single secret (costs $0.40/month):
{
  "API_KEY": "...",
  "NEXTAUTH_SECRET": "...",
  "SESSION_SECRET": "...",
  "GITHUB_ID": "...",
  "GITHUB_SECRET": "..."
}
```

**2. Cache secrets in application:**

```typescript
// Cache secrets for 5 minutes to reduce API calls
let secretCache: Record<string, string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedSecrets(): Promise<Record<string, string>> {
  const now = Date.now();

  if (secretCache && now - cacheTimestamp < CACHE_TTL) {
    return secretCache;
  }

  secretCache = await loadSecrets("internet-id/prod/app");
  cacheTimestamp = now;

  return secretCache;
}
```

**3. Use AWS Systems Manager Parameter Store for non-sensitive config:**

```bash
# Free tier: 10,000 parameters
# Use for non-secret configuration
aws ssm put-parameter \
    --name /internet-id/prod/config/app-version \
    --value "1.0.0" \
    --type String

aws ssm put-parameter \
    --name /internet-id/prod/config/feature-flags \
    --value '{"newUI":true}' \
    --type String
```

### Estimated Monthly Cost

**Production environment (6 secrets):**

| Secret                         | Cost/Month       |
| ------------------------------ | ---------------- |
| internet-id/prod/app           | $0.40            |
| internet-id/prod/database      | $0.40            |
| internet-id/prod/blockchain    | $0.40            |
| internet-id/staging/app        | $0.40            |
| internet-id/staging/database   | $0.40            |
| internet-id/staging/blockchain | $0.40            |
| **Total Storage**              | **$2.40**        |
| API Calls (est. 100K/month)    | $0.50            |
| **Total**                      | **~$2.90/month** |

## Troubleshooting

### Common Issues

**1. Access Denied Error**

```
Error: User: arn:aws:iam::ACCOUNT_ID:role/app is not authorized
to perform: secretsmanager:GetSecretValue on resource: internet-id/prod/app
```

**Solution:**

- Verify IAM policy attached to role
- Check resource ARN matches
- Verify KMS key permissions if using custom KMS key

**2. Secret Not Found**

```
Error: Secrets Manager can't find the specified secret.
```

**Solution:**

- Verify secret exists: `aws secretsmanager list-secrets`
- Check secret name/ID is correct
- Verify region matches

**3. Rotation Failure**

```
Error: Rotation failed: Unable to finish rotation
```

**Solution:**

- Check Lambda function logs: `aws logs tail /aws/lambda/internet-id-rotation`
- Verify Lambda has network access to database
- Check database user has necessary permissions

**4. Slow Application Startup**

**Solution:**

- Use secret caching
- Fetch secrets in parallel
- Consider using Parameter Store for non-sensitive config

### Debug Commands

```bash
# List all secrets
aws secretsmanager list-secrets --filters Key=name,Values=internet-id

# Get secret value (masked)
aws secretsmanager get-secret-value \
    --secret-id internet-id/prod/app \
    --query 'SecretString' \
    --output text | jq -r 'keys'

# Check secret rotation status
aws secretsmanager describe-secret \
    --secret-id internet-id/prod/app \
    --query 'RotationEnabled'

# View rotation history
aws secretsmanager describe-secret \
    --secret-id internet-id/prod/app \
    --query 'VersionIdsToStages'

# Test IAM permissions
aws secretsmanager get-secret-value \
    --secret-id internet-id/prod/app \
    --dry-run
```

## Security Best Practices

1. **Enable encryption with KMS** - Use customer-managed KMS keys
2. **Rotate secrets regularly** - Enable automatic rotation where possible
3. **Use least-privilege IAM policies** - Grant only necessary permissions
4. **Enable CloudTrail logging** - Audit all secret access
5. **Set up monitoring and alerts** - Detect unauthorized access attempts
6. **Use VPC endpoints** - Keep secret traffic within AWS network
7. **Implement secret versioning** - Maintain rollback capability
8. **Test rotation procedures** - Validate in staging before production

## Additional Resources

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/)
- [Secret Rotation Templates](https://github.com/aws-samples/aws-secrets-manager-rotation-lambdas)
- [Best Practices for AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)

---

**Last Updated:** October 26, 2025  
**Version:** 1.0
