# Internet-ID Alerting Runbook

## Overview

This runbook provides triage steps and escalation procedures for production alerts in the Internet-ID system. Each alert includes diagnostic steps, resolution procedures, and escalation paths.

**Related Documentation:**
- [Observability Guide](../OBSERVABILITY.md)
- [Deployment Playbook](./DEPLOYMENT_PLAYBOOK.md)
- [Disaster Recovery Runbook](./DISASTER_RECOVERY_RUNBOOK.md)

**Alert Severity Levels:**
- **Critical**: Immediate action required, service impacting
- **Warning**: Attention needed, potential service impact
- **Info**: Informational, no immediate action needed

---

## Table of Contents

1. [Service Availability Alerts](#service-availability-alerts)
2. [Error Rate Alerts](#error-rate-alerts)
3. [Queue Depth Alerts](#queue-depth-alerts)
4. [Database Alerts](#database-alerts)
5. [IPFS Alerts](#ipfs-alerts)
6. [Blockchain Alerts](#blockchain-alerts)
7. [Performance Alerts](#performance-alerts)
8. [Resource Alerts](#resource-alerts)
9. [Cache Alerts](#cache-alerts)
10. [Escalation Procedures](#escalation-procedures)

---

## Service Availability Alerts

### Service Down

**Alert Name:** `ServiceDown`, `WebServiceDown`  
**Severity:** Critical  
**Threshold:** Service unreachable for >2 minutes (2 consecutive failures)

#### Symptoms
- HTTP health check endpoint returning non-200 status
- Service not responding to requests
- Container stopped or crashed

#### Diagnostic Steps

1. **Check service status:**
   ```bash
   docker ps | grep internet-id
   docker compose ps
   ```

2. **Check container logs:**
   ```bash
   # API service
   docker compose logs --tail=100 api
   
   # Web service
   docker compose logs --tail=100 web
   ```

3. **Check resource usage:**
   ```bash
   docker stats --no-stream
   ```

4. **Check health endpoint manually:**
   ```bash
   curl -i http://localhost:3001/api/health
   curl -i http://localhost:3000/
   ```

#### Resolution Steps

1. **If container is stopped:**
   ```bash
   docker compose up -d api
   # or
   docker compose up -d web
   ```

2. **If container is running but unhealthy:**
   ```bash
   # Restart the service
   docker compose restart api
   
   # If restart fails, recreate
   docker compose up -d --force-recreate api
   ```

3. **If out of memory:**
   ```bash
   # Check memory limits
   docker inspect api | grep -A 5 Memory
   
   # Increase memory limits in docker-compose.yml
   # Then recreate
   docker compose up -d --force-recreate api
   ```

4. **If database connection issues:**
   - See [Database Down](#database-down) section
   - Check DATABASE_URL environment variable
   - Verify database is running

5. **If persistent issues:**
   - Check application logs for errors
   - Verify all environment variables are set
   - Check for deployment issues

#### Prevention
- Set up proper health checks in docker-compose.yml
- Configure automatic restarts
- Monitor resource usage trends
- Set appropriate resource limits

#### Escalation
- **Immediate:** Page on-call engineer (PagerDuty)
- **15 minutes:** Escalate to senior on-call
- **30 minutes:** Escalate to engineering lead

---

## Error Rate Alerts

### High Error Rate

**Alert Name:** `HighErrorRate`, `CriticalErrorRate`  
**Severity:** Warning (>5%), Critical (>10%)  
**Threshold:** Error rate >5% of requests over 5-minute window

#### Symptoms
- HTTP 5xx responses increasing
- User reports of errors
- Failed operations in logs

#### Diagnostic Steps

1. **Check error metrics:**
   ```bash
   # View metrics
   curl http://localhost:3001/api/metrics | grep http_requests_total
   ```

2. **Check application logs:**
   ```bash
   docker compose logs --tail=200 api | grep -i error
   ```

3. **Identify error patterns:**
   ```bash
   # Check most common errors
   docker compose logs api | grep -i error | sort | uniq -c | sort -rn | head -20
   ```

4. **Check for specific issues:**
   - Database connection errors
   - IPFS upload failures
   - Blockchain RPC errors
   - Authentication failures

#### Resolution Steps

1. **If database errors:**
   - Check database connectivity
   - Verify connection pool not exhausted
   - See [Database Alerts](#database-alerts)

2. **If IPFS errors:**
   - Check IPFS provider status
   - Verify credentials
   - See [IPFS Alerts](#ipfs-alerts)

3. **If blockchain errors:**
   - Check RPC endpoint
   - Verify network connectivity
   - See [Blockchain Alerts](#blockchain-alerts)

4. **If authentication errors:**
   - Check API keys
   - Verify JWT secrets
   - Check auth service logs

5. **If unknown errors:**
   - Enable debug logging
   - Capture full error traces
   - Check for recent deployments

#### Prevention
- Implement proper error handling
- Add retry logic for transient failures
- Monitor error trends
- Set up error tracking (Sentry)

#### Escalation
- **Warning (>5%):** Notify team via Slack
- **Critical (>10%):** Page on-call engineer
- **Sustained >10 min:** Escalate to engineering lead

---

## Queue Depth Alerts

### High Queue Depth

**Alert Name:** `HighQueueDepth`, `CriticalQueueDepth`  
**Severity:** Warning (>100 jobs), Critical (>500 jobs)  
**Threshold:** Queue depth exceeds threshold for >5 minutes

#### Symptoms
- Background jobs not processing
- Delayed operations
- Increasing queue size

#### Diagnostic Steps

1. **Check queue metrics:**
   ```bash
   # View queue depth (if implemented)
   curl http://localhost:3001/api/metrics | grep queue_depth
   ```

2. **Check worker status:**
   ```bash
   docker compose ps | grep worker
   docker compose logs worker
   ```

3. **Identify bottlenecks:**
   - Slow job processing
   - Worker crashes
   - Resource constraints

#### Resolution Steps

1. **If workers not running:**
   ```bash
   docker compose up -d worker
   ```

2. **If workers slow:**
   - Scale up workers:
     ```bash
     docker compose up -d --scale worker=3
     ```

3. **If resource constrained:**
   - Increase worker resources
   - Optimize job processing
   - Add worker capacity

4. **If jobs failing:**
   - Check job error logs
   - Fix underlying issues
   - Requeue failed jobs

#### Prevention
- Monitor queue trends
- Set up auto-scaling
- Optimize job processing
- Implement job prioritization

#### Escalation
- **Warning (>100):** Notify team via Slack
- **Critical (>500):** Page on-call engineer
- **Sustained >30 min:** Escalate to engineering lead

---

## Database Alerts

### Database Down

**Alert Name:** `DatabaseDown`  
**Severity:** Critical  
**Threshold:** Database unreachable for >1 minute

#### Symptoms
- Application cannot connect to database
- Database health check failing
- Connection timeout errors

#### Diagnostic Steps

1. **Check database status:**
   ```bash
   docker compose ps db
   docker compose logs db
   ```

2. **Test connectivity:**
   ```bash
   # From host
   docker compose exec db pg_isready -U internetid
   
   # From API container
   docker compose exec api psql ${DATABASE_URL} -c "SELECT 1"
   ```

3. **Check database logs:**
   ```bash
   docker compose logs --tail=100 db | grep -i error
   ```

#### Resolution Steps

1. **If container stopped:**
   ```bash
   docker compose up -d db
   ```

2. **If container running but unresponsive:**
   ```bash
   docker compose restart db
   ```

3. **If disk full:**
   ```bash
   # Check disk space
   df -h
   
   # Clean up old backups if needed
   docker compose exec db du -sh /var/lib/postgresql/backups/*
   ```

4. **If corrupted data:**
   - See [Disaster Recovery Runbook](./DISASTER_RECOVERY_RUNBOOK.md)
   - Restore from backup if necessary

#### Prevention
- Set up database replication
- Monitor disk space
- Regular backups
- Database health monitoring

#### Escalation
- **Immediate:** Page on-call DBA
- **5 minutes:** Escalate to senior DBA
- **15 minutes:** Execute disaster recovery plan

---

### Connection Pool Exhaustion

**Alert Name:** `DatabaseConnectionPoolExhaustion`, `DatabaseConnectionPoolCritical`  
**Severity:** Warning (>80%), Critical (>95%)  
**Threshold:** Active connections exceed threshold

#### Symptoms
- "Too many connections" errors
- Application timeouts
- Slow query performance

#### Diagnostic Steps

1. **Check active connections:**
   ```bash
   docker compose exec db psql -U internetid -d internetid -c \
     "SELECT count(*) FROM pg_stat_activity;"
   ```

2. **Identify connection sources:**
   ```bash
   docker compose exec db psql -U internetid -d internetid -c \
     "SELECT client_addr, count(*) FROM pg_stat_activity GROUP BY client_addr;"
   ```

3. **Check for long-running queries:**
   ```bash
   docker compose exec db psql -U internetid -d internetid -c \
     "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
      FROM pg_stat_activity 
      WHERE state = 'active' 
      ORDER BY duration DESC;"
   ```

#### Resolution Steps

1. **Kill idle connections:**
   ```bash
   docker compose exec db psql -U internetid -d internetid -c \
     "SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE state = 'idle' 
      AND now() - state_change > interval '10 minutes';"
   ```

2. **Kill long-running queries:**
   ```bash
   # Identify problematic queries first
   # Then kill specific PIDs
   docker compose exec db psql -U internetid -d internetid -c \
     "SELECT pg_terminate_backend(<PID>);"
   ```

3. **Increase connection limit (temporary):**
   ```bash
   # Edit docker-compose.production.yml
   # Update: -c max_connections=200
   docker compose up -d --force-recreate db
   ```

4. **Fix connection leaks:**
   - Review application code
   - Ensure proper connection closing
   - Implement connection pooling

#### Prevention
- Use connection pooling (Prisma handles this)
- Set proper connection limits
- Monitor connection usage
- Implement timeout policies

#### Escalation
- **Warning (>80%):** Notify team via Slack
- **Critical (>95%):** Page on-call engineer
- **Sustained >15 min:** Escalate to DBA

---

### High Database Latency

**Alert Name:** `HighDatabaseLatency`  
**Severity:** Warning  
**Threshold:** P95 query latency >1 second for >5 minutes

#### Symptoms
- Slow API responses
- Query timeouts
- Database CPU high

#### Diagnostic Steps

1. **Check slow queries:**
   ```bash
   docker compose exec db psql -U internetid -d internetid -c \
     "SELECT query, calls, total_time, mean_time 
      FROM pg_stat_statements 
      ORDER BY mean_time DESC 
      LIMIT 20;"
   ```

2. **Check database metrics:**
   ```bash
   curl http://localhost:9187/metrics | grep pg_stat
   ```

3. **Check for missing indexes:**
   ```bash
   npm run db:verify-indexes
   ```

4. **Check database load:**
   ```bash
   docker stats db --no-stream
   ```

#### Resolution Steps

1. **If missing indexes:**
   - Review query plans
   - Add missing indexes
   - Run migrations

2. **If high CPU:**
   - Identify expensive queries
   - Optimize queries
   - Add caching

3. **If high I/O:**
   - Check disk performance
   - Optimize vacuum settings
   - Consider storage upgrade

4. **If connection issues:**
   - See [Connection Pool Exhaustion](#connection-pool-exhaustion)

#### Prevention
- Regular query optimization
- Proper indexing strategy
- Query performance monitoring
- Database tuning

#### Escalation
- **Sustained >15 min:** Notify team via Slack
- **Sustained >30 min:** Page on-call DBA
- **Critical impact:** Escalate to engineering lead

---

## IPFS Alerts

### IPFS Upload Failures

**Alert Name:** `HighIpfsFailureRate`, `CriticalIpfsFailureRate`  
**Severity:** Warning (>20%), Critical (>50%)  
**Threshold:** IPFS upload failure rate exceeds threshold

#### Symptoms
- Failed content uploads
- Upload timeouts
- Provider errors

#### Diagnostic Steps

1. **Check IPFS metrics:**
   ```bash
   curl http://localhost:3001/api/metrics | grep ipfs_uploads
   ```

2. **Check application logs:**
   ```bash
   docker compose logs api | grep -i ipfs
   ```

3. **Test IPFS providers:**
   ```bash
   # Test Web3.Storage
   curl -X POST https://api.web3.storage/upload \
     -H "Authorization: Bearer ${WEB3_STORAGE_TOKEN}" \
     -F file=@test.txt
   
   # Test Pinata
   curl -X POST https://api.pinata.cloud/pinning/pinFileToIPFS \
     -H "Authorization: Bearer ${PINATA_JWT}" \
     -F file=@test.txt
   ```

4. **Check provider status pages:**
   - Web3.Storage: https://status.web3.storage
   - Pinata: https://status.pinata.cloud
   - Infura: https://status.infura.io

#### Resolution Steps

1. **If provider outage:**
   - Switch to backup provider
   - Update IPFS_PROVIDER environment variable
   - Restart API service

2. **If credential issues:**
   - Verify API keys/tokens
   - Check environment variables
   - Rotate credentials if needed

3. **If rate limiting:**
   - Implement backoff/retry
   - Upgrade provider plan
   - Distribute across providers

4. **If network issues:**
   - Check network connectivity
   - Verify DNS resolution
   - Check firewall rules

#### Prevention
- Use multiple IPFS providers
- Implement automatic fallback
- Monitor provider health
- Set appropriate timeouts

#### Escalation
- **Warning (>20%):** Notify team via Slack
- **Critical (>50%):** Page on-call engineer
- **Sustained >15 min:** Escalate to engineering lead

---

## Blockchain Alerts

### Contract Transaction Failures

**Alert Name:** `BlockchainTransactionFailures`  
**Severity:** Warning  
**Threshold:** Transaction failure rate >10% over 5 minutes

#### Symptoms
- Failed on-chain registrations
- Transaction reverts
- Insufficient gas errors

#### Diagnostic Steps

1. **Check blockchain metrics:**
   ```bash
   curl http://localhost:3001/api/metrics | grep blockchain_transactions
   ```

2. **Check application logs:**
   ```bash
   docker compose logs api | grep -i blockchain
   ```

3. **Test RPC endpoint:**
   ```bash
   curl -X POST ${RPC_URL} \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

4. **Check wallet balance:**
   ```bash
   # Use scripts to check deployer balance
   npm run check-balance
   ```

#### Resolution Steps

1. **If insufficient gas:**
   - Fund deployer wallet
   - Increase gas limits
   - Optimize contract calls

2. **If RPC issues:**
   - Switch to backup RPC
   - Update RPC_URL
   - Restart API service

3. **If contract issues:**
   - Check contract state
   - Verify contract not paused
   - Check for contract upgrades

4. **If network congestion:**
   - Increase gas price
   - Implement retry logic
   - Queue transactions

#### Prevention
- Monitor wallet balance
- Use multiple RPC endpoints
- Implement gas price strategy
- Set up transaction monitoring

#### Escalation
- **Warning (>10%):** Notify team via Slack
- **Critical (>50%):** Page on-call engineer
- **Sustained >15 min:** Escalate to blockchain team

---

### Blockchain RPC Down

**Alert Name:** `BlockchainRPCDown`  
**Severity:** Critical  
**Threshold:** >50% of blockchain requests failing for >2 minutes

#### Symptoms
- Cannot connect to blockchain
- RPC timeout errors
- Network unreachable

#### Diagnostic Steps

1. **Test RPC connectivity:**
   ```bash
   curl -v ${RPC_URL}
   ```

2. **Check RPC provider status:**
   - Base: https://status.base.org
   - Alchemy: https://status.alchemy.com
   - Infura: https://status.infura.io

3. **Test alternative RPCs:**
   ```bash
   # Test public RPC
   curl -X POST https://sepolia.base.org \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

#### Resolution Steps

1. **Switch to backup RPC:**
   ```bash
   # Update environment variable
   export RPC_URL="https://backup-rpc-url.com"
   
   # Restart API
   docker compose restart api
   ```

2. **If provider outage:**
   - Use alternative provider
   - Update configuration
   - Monitor provider status

3. **If network issues:**
   - Check DNS resolution
   - Verify firewall rules
   - Test connectivity

#### Prevention
- Configure multiple RPC endpoints
- Implement automatic failover
- Monitor RPC health
- Use reliable providers

#### Escalation
- **Immediate:** Page on-call engineer
- **5 minutes:** Escalate to blockchain team
- **15 minutes:** Escalate to engineering lead

---

## Performance Alerts

### High Response Time

**Alert Name:** `HighResponseTime`  
**Severity:** Warning  
**Threshold:** P95 response time >5 seconds for >5 minutes

#### Symptoms
- Slow API responses
- User complaints
- Request timeouts

#### Diagnostic Steps

1. **Check response time metrics:**
   ```bash
   curl http://localhost:3001/api/metrics | grep http_request_duration
   ```

2. **Identify slow endpoints:**
   ```bash
   docker compose logs api | grep -i "duration" | sort -k5 -rn | head -20
   ```

3. **Check resource usage:**
   ```bash
   docker stats --no-stream
   ```

4. **Check database performance:**
   - See [High Database Latency](#high-database-latency)

#### Resolution Steps

1. **If database slow:**
   - Optimize queries
   - Add indexes
   - Increase database resources

2. **If high CPU:**
   - Scale horizontally
   - Optimize code
   - Add caching

3. **If memory pressure:**
   - Increase memory limits
   - Fix memory leaks
   - Restart service

4. **If external API slow:**
   - Implement caching
   - Add timeouts
   - Use circuit breakers

#### Prevention
- Performance testing
- Load testing
- Caching strategy
- Code optimization

#### Escalation
- **Sustained >10 min:** Notify team via Slack
- **Sustained >30 min:** Page on-call engineer
- **Critical impact:** Escalate to engineering lead

---

## Resource Alerts

### High Memory Usage

**Alert Name:** `HighMemoryUsage`, `CriticalMemoryUsage`  
**Severity:** Warning (>85%), Critical (>95%)  
**Threshold:** Memory usage exceeds threshold

#### Symptoms
- Out of memory errors
- Service crashes
- Slow performance

#### Diagnostic Steps

1. **Check memory usage:**
   ```bash
   docker stats --no-stream
   ```

2. **Check process memory:**
   ```bash
   docker compose exec api node -e \
     "console.log(process.memoryUsage())"
   ```

3. **Identify memory leaks:**
   ```bash
   # Enable heap snapshots
   docker compose logs api | grep -i "heap\|memory"
   ```

#### Resolution Steps

1. **If memory leak:**
   - Restart service (temporary)
   - Identify leak source
   - Fix application code

2. **If insufficient memory:**
   - Increase memory limits
   - Update docker-compose.yml
   - Recreate service

3. **If cache too large:**
   - Reduce cache TTL
   - Implement cache eviction
   - Optimize cache usage

#### Prevention
- Regular memory profiling
- Proper cache configuration
- Memory limit monitoring
- Code reviews for leaks

#### Escalation
- **Warning (>85%):** Notify team via Slack
- **Critical (>95%):** Page on-call engineer
- **OOM kills:** Escalate immediately

---

### High CPU Usage

**Alert Name:** `HighCPUUsage`  
**Severity:** Warning  
**Threshold:** CPU usage >80% for >5 minutes

#### Symptoms
- Slow performance
- Request timeouts
- High load

#### Diagnostic Steps

1. **Check CPU usage:**
   ```bash
   docker stats --no-stream
   ```

2. **Identify CPU-intensive processes:**
   ```bash
   docker compose exec api top -b -n 1
   ```

3. **Check for infinite loops:**
   ```bash
   docker compose logs api | grep -i "loop\|timeout"
   ```

#### Resolution Steps

1. **If high legitimate load:**
   - Scale horizontally
   - Increase CPU limits
   - Optimize code

2. **If runaway process:**
   - Restart service
   - Fix application bug
   - Add resource limits

3. **If DOS attack:**
   - Enable rate limiting
   - Block malicious IPs
   - Scale up temporarily

#### Prevention
- Load testing
- Code optimization
- Resource limits
- Auto-scaling

#### Escalation
- **Sustained >10 min:** Notify team via Slack
- **Sustained >30 min:** Page on-call engineer
- **Critical impact:** Escalate to engineering lead

---

## Cache Alerts

### Redis Down

**Alert Name:** `RedisDown`  
**Severity:** Warning  
**Threshold:** Redis unreachable for >2 minutes

#### Symptoms
- Cache misses
- Degraded performance
- Application still functional (graceful degradation)

#### Diagnostic Steps

1. **Check Redis status:**
   ```bash
   docker compose ps redis
   docker compose logs redis
   ```

2. **Test connectivity:**
   ```bash
   docker compose exec redis redis-cli ping
   ```

3. **Check memory usage:**
   ```bash
   docker compose exec redis redis-cli info memory
   ```

#### Resolution Steps

1. **If container stopped:**
   ```bash
   docker compose up -d redis
   ```

2. **If memory full:**
   ```bash
   # Check memory settings
   docker compose exec redis redis-cli config get maxmemory
   
   # Flush cache if needed
   docker compose exec redis redis-cli flushall
   ```

3. **If corrupted data:**
   ```bash
   # Restart Redis
   docker compose restart redis
   ```

#### Prevention
- Monitor Redis health
- Set proper memory limits
- Implement persistence
- Regular backups

#### Escalation
- **Warning:** Notify team via Slack
- **Sustained >15 min:** Page on-call engineer
- **Impact on service:** Escalate to engineering lead

---

### Low Cache Hit Rate

**Alert Name:** `LowCacheHitRate`  
**Severity:** Info  
**Threshold:** Cache hit rate <50% for >10 minutes

#### Symptoms
- High database load
- Slow performance
- Increased latency

#### Diagnostic Steps

1. **Check cache metrics:**
   ```bash
   curl http://localhost:3001/api/cache/metrics
   ```

2. **Analyze cache patterns:**
   ```bash
   docker compose exec redis redis-cli --stat
   ```

3. **Check cache TTL:**
   ```bash
   docker compose exec redis redis-cli ttl <key>
   ```

#### Resolution Steps

1. **If TTL too short:**
   - Increase cache TTL
   - Review caching strategy

2. **If data changing frequently:**
   - Optimize invalidation
   - Use cache tags
   - Implement smart caching

3. **If cache too small:**
   - Increase Redis memory
   - Implement cache eviction policy

#### Prevention
- Monitor cache patterns
- Optimize TTL values
- Implement cache warming
- Regular cache analysis

#### Escalation
- **Info:** No immediate escalation
- **If causing performance issues:** Notify team via Slack

---

## Escalation Procedures

### On-Call Rotation

**Primary On-Call:**
- Responds to all critical alerts
- Available 24/7 via PagerDuty
- Response time: 5 minutes

**Secondary On-Call:**
- Escalation after 15 minutes
- Backup for primary
- Response time: 10 minutes

**Engineering Lead:**
- Escalation for sustained issues
- Decision authority for major changes
- Response time: 15 minutes

**DBA On-Call:**
- Database-specific issues
- Escalation for data integrity concerns
- Response time: 10 minutes

### Escalation Thresholds

| Alert Type | Initial Response | Escalate to Secondary | Escalate to Lead |
|------------|------------------|----------------------|------------------|
| Service Down | Immediate | 15 minutes | 30 minutes |
| Critical Error Rate | 5 minutes | 15 minutes | 30 minutes |
| Database Down | Immediate | 5 minutes | 15 minutes |
| High Error Rate | 10 minutes | 30 minutes | 1 hour |
| Performance Issues | 15 minutes | 30 minutes | 1 hour |

### Communication Channels

**Critical Alerts:**
- PagerDuty: Immediate notification
- Slack (#alerts-critical): Real-time updates
- Email: Summary after resolution

**Warning Alerts:**
- Slack (#alerts-warnings): Real-time notification
- Email: Daily digest

**Info Alerts:**
- Slack (#alerts-info): Real-time notification
- Email: Weekly summary

### Incident Communication

**During Incident:**
1. Acknowledge alert in PagerDuty
2. Post status update in #incidents channel
3. Update status page (if customer-facing)
4. Provide regular updates (every 15 minutes for critical)

**After Resolution:**
1. Post resolution in #incidents channel
2. Update status page
3. Write incident summary
4. Schedule post-mortem (for critical incidents)

### Post-Mortem Process

**Required for:**
- All critical incidents
- Service outages >15 minutes
- Data loss or corruption
- Security incidents

**Timeline:**
- Schedule within 48 hours
- Complete within 1 week

**Components:**
- Timeline of events
- Root cause analysis
- Impact assessment
- Action items
- Prevention measures

---

## Additional Resources

- [Observability Guide](../OBSERVABILITY.md) - Logging and metrics
- [Deployment Playbook](./DEPLOYMENT_PLAYBOOK.md) - Deployment procedures
- [Disaster Recovery Runbook](./DISASTER_RECOVERY_RUNBOOK.md) - Recovery procedures
- [Database Backup Guide](./DATABASE_BACKUP_RECOVERY.md) - Backup and restore
- [Prometheus Alerting](https://prometheus.io/docs/alerting/) - Alert configuration
- [Grafana Dashboards](https://grafana.com/docs/) - Visualization

---

## Contact Information

**On-Call Contacts:**
- Primary On-Call: PagerDuty rotation
- Engineering Lead: [lead@example.com](mailto:lead@example.com)
- DBA: [dba@example.com](mailto:dba@example.com)
- Security: [security@example.com](mailto:security@example.com)

**Slack Channels:**
- #alerts-critical - Critical alerts
- #alerts-warnings - Warning alerts
- #incidents - Active incident coordination
- #ops - Operations team
- #engineering - Engineering team

**External Links:**
- Status Page: https://status.internet-id.com
- Grafana: https://grafana.internet-id.com
- PagerDuty: https://subculture-collective.pagerduty.com
- GitHub: https://github.com/subculture-collective/internet-id

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-31  
**Maintained By:** Operations Team
