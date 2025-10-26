# Secret Access Monitoring and Alerts

## Overview

This document describes the monitoring and alerting configuration for detecting anomalous secret access patterns and potential security incidents in the Internet-ID project.

## Monitoring Architecture

```
┌──────────────────────────────────────────────┐
│         Secret Access Events                  │
│  (AWS Secrets Manager, Vault, etc.)          │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│         CloudTrail / Vault Audit             │
│         (Event Collection)                    │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│      CloudWatch / Prometheus                 │
│      (Metrics & Log Analysis)                │
└─────────────────┬────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│   Alerts     │    │  Dashboard   │
│  (SNS/Slack) │    │  (Grafana)   │
└──────────────┘    └──────────────┘
```

## Metrics to Monitor

### 1. Access Frequency Metrics

**Normal Patterns:**

- Secrets accessed during deployments (2-5 times per deployment)
- Application startup (once per pod/instance)
- Secret rotation events (scheduled)

**Anomalous Patterns:**

- Unusually high access frequency (>100 requests/hour)
- Access outside business hours
- Repeated access from same source

**CloudWatch Metric:**

```
Namespace: AWS/SecretsManager
MetricName: GetSecretValueCount
Dimensions: SecretId=internet-id/prod/*
Statistic: Sum
Period: 300 seconds (5 minutes)
```

### 2. Failed Access Attempts

**Normal:**

- Occasional permission errors during development
- Typos in secret names

**Anomalous:**

- Multiple failed attempts from same source (>5 in 10 minutes)
- Failed attempts for high-value secrets (database, blockchain keys)
- Systematic scanning of secret names

**CloudWatch Metric:**

```
Namespace: AWS/SecretsManager
MetricName: GetSecretValueErrors
Dimensions: SecretId=internet-id/prod/*, ErrorCode=AccessDenied
Statistic: Sum
Period: 600 seconds (10 minutes)
```

### 3. Unauthorized Access Attempts

**Detection:**

- IAM user/role without proper permissions
- Service account from wrong environment
- Unknown source IP address
- Access from unexpected AWS region

**CloudWatch Insights Query:**

```sql
fields @timestamp, userIdentity.principalId, sourceIPAddress, errorCode
| filter eventName = "GetSecretValue"
  and errorCode = "AccessDenied"
  and eventSource = "secretsmanager.amazonaws.com"
| stats count() by userIdentity.principalId, sourceIPAddress
| sort count desc
```

### 4. Secret Rotation Status

**Metrics:**

- Secrets overdue for rotation (>90 days)
- Failed rotation attempts
- Rotation completion time

**Custom CloudWatch Metric:**

```python
import boto3
from datetime import datetime, timedelta

cloudwatch = boto3.client('cloudwatch')
secretsmanager = boto3.client('secretsmanager')

def check_rotation_status():
    secrets = secretsmanager.list_secrets()

    for secret in secrets['SecretList']:
        if not secret['Name'].startswith('internet-id/'):
            continue

        last_rotated = secret.get('LastRotatedDate')
        if last_rotated:
            days_old = (datetime.now() - last_rotated).days

            cloudwatch.put_metric_data(
                Namespace='InternetID/Secrets',
                MetricData=[
                    {
                        'MetricName': 'SecretAge',
                        'Value': days_old,
                        'Unit': 'Count',
                        'Dimensions': [
                            {
                                'Name': 'SecretName',
                                'Value': secret['Name']
                            }
                        ]
                    }
                ]
            )
```

### 5. Access Source Metrics

**Track:**

- Geographic location of access (IP geolocation)
- Service account vs. human user access ratio
- Access from CI/CD pipelines vs. manual

**Anomalies:**

- Access from unexpected countries
- Human user accessing production secrets
- Access from unknown IP ranges

## Alert Configuration

### Critical Alerts (Immediate Response Required)

#### 1. Multiple Failed Access Attempts

**Condition:** >5 failed `GetSecretValue` calls in 10 minutes

**CloudWatch Alarm:**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name internet-id-secret-access-failures \
  --alarm-description "Alert on multiple failed secret access attempts" \
  --metric-name GetSecretValueErrors \
  --namespace AWS/SecretsManager \
  --statistic Sum \
  --period 600 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:security-critical
```

**Response:**

- PagerDuty/Opsgenie notification
- Automated IP blocking (if enabled)
- Security team investigation

#### 2. Production Secret Access from Unauthorized Source

**Condition:** Access from IP not in whitelist OR from unknown IAM role

**CloudWatch Insights Alert:**

```sql
fields @timestamp, userIdentity.principalId, sourceIPAddress
| filter eventName = "GetSecretValue"
  and eventSource = "secretsmanager.amazonaws.com"
  and Resources.0.ARN like "internet-id/prod"
  and (sourceIPAddress not in ["52.1.2.3", "52.1.2.4"]
       or userIdentity.principalId not like "AIDAI*")
| stats count() as unauthorized_access
| filter unauthorized_access > 0
```

**Response:**

- Immediate notification to security team
- Automatically disable compromised credentials
- Begin incident response procedure

#### 3. Secret Deletion or Modification

**Condition:** `DeleteSecret` or `PutSecretValue` on production secrets

**CloudWatch Alarm:**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name internet-id-secret-modification \
  --alarm-description "Alert on secret deletion or unauthorized modification" \
  --metric-name SecretModificationEvents \
  --namespace InternetID/Secrets \
  --statistic Sum \
  --period 60 \
  --threshold 0 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:security-critical
```

**Custom Metric Script:**

```python
# Lambda function triggered by CloudTrail
import boto3

cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    # Parse CloudTrail event
    detail = event['detail']

    if detail['eventName'] in ['DeleteSecret', 'PutSecretValue', 'UpdateSecret']:
        secret_name = detail['requestParameters'].get('secretId', '')

        if 'internet-id/prod' in secret_name:
            # Send critical alert
            cloudwatch.put_metric_data(
                Namespace='InternetID/Secrets',
                MetricData=[{
                    'MetricName': 'SecretModificationEvents',
                    'Value': 1,
                    'Unit': 'Count'
                }]
            )
```

### High Priority Alerts (Response within 1 hour)

#### 4. Excessive Secret Access

**Condition:** >100 `GetSecretValue` calls in 1 hour from single source

**CloudWatch Alarm:**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name internet-id-excessive-secret-access \
  --alarm-description "Unusually high secret access rate" \
  --metric-name GetSecretValueCount \
  --namespace AWS/SecretsManager \
  --statistic Sum \
  --period 3600 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:security-high
```

#### 5. Secret Rotation Failure

**Condition:** Rotation attempt failed

**CloudWatch Alarm:**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name internet-id-rotation-failure \
  --alarm-description "Secret rotation failed" \
  --metric-name RotationFailed \
  --namespace AWS/SecretsManager \
  --statistic Sum \
  --period 3600 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:ops-alerts
```

### Medium Priority Alerts (Response within 24 hours)

#### 6. Secrets Nearing Rotation Deadline

**Condition:** Secret not rotated in >80 days (10 days before 90-day policy)

**Custom Lambda Check (runs daily):**

```python
import boto3
from datetime import datetime, timedelta

sns = boto3.client('sns')
secretsmanager = boto3.client('secretsmanager')

def check_rotation_deadline():
    cutoff_date = datetime.now() - timedelta(days=80)

    secrets = secretsmanager.list_secrets()
    overdue = []

    for secret in secrets['SecretList']:
        if not secret['Name'].startswith('internet-id/'):
            continue

        last_rotated = secret.get('LastRotatedDate', secret['CreatedDate'])

        if last_rotated < cutoff_date:
            days_overdue = (datetime.now() - last_rotated).days
            overdue.append(f"{secret['Name']} ({days_overdue} days)")

    if overdue:
        sns.publish(
            TopicArn='arn:aws:sns:us-east-1:ACCOUNT_ID:ops-alerts',
            Subject='Secrets Nearing Rotation Deadline',
            Message=f"The following secrets need rotation:\n" + "\n".join(overdue)
        )
```

#### 7. Unusual Access Patterns

**Condition:** Access from new geographic location or time of day

**Anomaly Detection:**

- Use AWS GuardDuty or custom ML model
- Baseline normal access patterns over 30 days
- Alert on statistical anomalies

## Alert Channels

### SNS Topics

```bash
# Critical alerts (PagerDuty/Opsgenie)
aws sns create-topic --name internet-id-security-critical

# High priority alerts (Slack #security-alerts)
aws sns create-topic --name internet-id-security-high

# Medium priority alerts (Email + Slack #ops)
aws sns create-topic --name internet-id-ops-alerts

# Subscribe endpoints
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:internet-id-security-critical \
  --protocol email \
  --notification-endpoint security@subculture.io

aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:internet-id-security-critical \
  --protocol https \
  --notification-endpoint https://events.pagerduty.com/integration/KEY/enqueue
```

### Slack Integration

**Lambda function for Slack notifications:**

```javascript
// slack-notification-lambda.js
const https = require("https");

exports.handler = async (event) => {
  const message = JSON.parse(event.Records[0].Sns.Message);

  const slackPayload = {
    channel: "#security-alerts",
    username: "Secret Monitor",
    icon_emoji: ":rotating_light:",
    attachments: [
      {
        color: "danger",
        title: message.AlarmName,
        text: message.NewStateReason,
        fields: [
          {
            title: "Alarm",
            value: message.AlarmName,
            short: true,
          },
          {
            title: "Status",
            value: message.NewStateValue,
            short: true,
          },
        ],
        footer: "AWS CloudWatch",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "hooks.slack.com",
        path: "/services/YOUR/WEBHOOK/URL",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      (res) => {
        resolve({ statusCode: 200 });
      }
    );

    req.on("error", reject);
    req.write(JSON.stringify(slackPayload));
    req.end();
  });
};
```

## Dashboards

### Grafana Dashboard Configuration

**Panels:**

1. **Secret Access Rate** (Time series)
   - `GetSecretValue` calls per minute
   - Grouped by environment (dev/staging/prod)

2. **Failed Access Attempts** (Time series)
   - `AccessDenied` errors over time
   - Grouped by user/role

3. **Top Secret Accessors** (Table)
   - Ranking of users/services by access count
   - Last access timestamp

4. **Secret Age** (Gauge)
   - Days since last rotation
   - Color-coded: Green (<60), Yellow (60-80), Red (>80)

5. **Alert Status** (Stat panel)
   - Current alert status
   - Count of active alerts

**JSON Configuration:**

```json
{
  "dashboard": {
    "title": "Secret Access Monitoring",
    "panels": [
      {
        "title": "Secret Access Rate",
        "type": "graph",
        "datasource": "CloudWatch",
        "targets": [
          {
            "namespace": "AWS/SecretsManager",
            "metricName": "GetSecretValueCount",
            "dimensions": {
              "SecretId": "internet-id/prod/*"
            },
            "statistics": ["Sum"],
            "period": 300
          }
        ]
      }
    ]
  }
}
```

### CloudWatch Dashboard

```bash
aws cloudwatch put-dashboard \
  --dashboard-name internet-id-secrets \
  --dashboard-body file://cloudwatch-dashboard.json
```

**cloudwatch-dashboard.json:**

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/SecretsManager", "GetSecretValueCount", { "stat": "Sum" }],
          [".", "GetSecretValueErrors", { "stat": "Sum" }]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Secret Access Metrics"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/aws/cloudtrail/logs'\n| fields @timestamp, userIdentity.principalId, sourceIPAddress\n| filter eventName = 'GetSecretValue'\n| stats count() by userIdentity.principalId",
        "region": "us-east-1",
        "title": "Top Secret Accessors"
      }
    }
  ]
}
```

## Incident Response Workflow

### Alert Received → Investigation → Response

```
┌─────────────────┐
│  Alert Fired    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auto-Triage    │ ◄── Check severity, context
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌───────┐
│ Auto- │  │Manual │
│Handle │  │Review │
└───┬───┘  └───┬───┘
    │          │
    └────┬─────┘
         ▼
┌─────────────────┐
│   Investigate   │
│  - Check logs   │
│  - Verify user  │
│  - Assess risk  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│False   │ │ True   │
│Positive│ │Positive│
└───┬────┘ └───┬────┘
    │          │
    │          ▼
    │    ┌──────────┐
    │    │ Contain  │
    │    │ - Block  │
    │    │ - Rotate │
    │    └────┬─────┘
    │         │
    │         ▼
    │    ┌──────────┐
    │    │ Document │
    │    │ - Ticket │
    │    │ - Report │
    │    └──────────┘
    │
    └──────────────┐
                   │
                   ▼
             ┌──────────┐
             │  Close   │
             └──────────┘
```

## Automated Response Actions

### Auto-Block Suspicious IPs

**Lambda function triggered by CloudWatch alarm:**

```python
import boto3

ec2 = boto3.client('ec2')

def lambda_handler(event, context):
    # Parse alarm event
    alarm_name = event['detail']['alarmName']

    if 'unauthorized-access' in alarm_name:
        # Extract offending IP from alarm metrics
        suspicious_ip = extract_ip_from_alarm(event)

        # Add to network ACL deny rule
        ec2.create_network_acl_entry(
            NetworkAclId='acl-12345',
            RuleNumber=100,
            Protocol='-1',
            RuleAction='deny',
            Egress=False,
            CidrBlock=f'{suspicious_ip}/32'
        )

        # Send notification
        print(f"Blocked IP: {suspicious_ip}")
```

### Auto-Rotate on Compromise

```python
import boto3

secretsmanager = boto3.client('secretsmanager')

def lambda_handler(event, context):
    compromised_secret = event['detail']['requestParameters']['secretId']

    # Trigger immediate rotation
    response = secretsmanager.rotate_secret(
        SecretId=compromised_secret,
        RotateImmediately=True
    )

    print(f"Emergency rotation initiated for: {compromised_secret}")
```

## Testing and Validation

### Monthly Drill

Execute monthly alert testing:

```bash
# Test failed access alert
aws secretsmanager get-secret-value \
  --secret-id internet-id/prod/fake-secret \
  # This should fail and trigger alarm

# Test excessive access alert
for i in {1..110}; do
  aws secretsmanager get-secret-value \
    --secret-id internet-id/prod/app > /dev/null 2>&1
done
# Should trigger after 100 requests
```

### Validation Checklist

- [ ] Alerts delivered to correct channels (Slack, email, PagerDuty)
- [ ] Alert message contains necessary context
- [ ] Response time meets SLA (<15 min for critical)
- [ ] Automated actions execute correctly
- [ ] Dashboards display real-time data
- [ ] Audit logs capture all access events
- [ ] Rotation monitoring detects overdue secrets

## Contact Information

**Alert Issues:**

- DevOps: ops@subculture.io
- Slack: #ops-alerts

**Security Incidents:**

- Security Team: security@subculture.io
- On-Call: PagerDuty escalation
- Slack: #security-incidents

---

**Last Updated:** October 26, 2025  
**Version:** 1.0  
**Maintained By:** DevOps & Security Teams
