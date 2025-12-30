---
title: 'ContosoUniversity Nonfunctional Requirements Baseline'
last_updated: '2025-12-30'
owner: 'Migration Architect'
status: 'Draft'
purpose: 'Establish baseline performance, reliability, scalability, security, and compliance metrics'
---

# ContosoUniversity Nonfunctional Requirements Baseline

## Executive Summary

This document establishes the baseline nonfunctional characteristics of the ContosoUniversity application prior to migration. It captures current performance metrics, reliability patterns, scalability constraints, security posture, and compliance requirements to inform migration planning and validate post-migration improvements.

**Key Baseline Findings:**
- No formal performance testing or APM monitoring currently in place
- Application designed for small-scale educational institution use
- Strong data consistency model (ACID transactions)
- Minimal security controls (no authentication/authorization detected)
- No documented SLAs or availability requirements

---

## Performance Baseline

### Current Performance Characteristics

#### Response Time Metrics

**Methodology:** Based on ASP.NET Core 6.0 Razor Pages typical performance characteristics and application architecture analysis.

| Operation Type | Estimated P50 Latency | Estimated P95 Latency | Estimated P99 Latency | Notes |
|----------------|----------------------|----------------------|----------------------|-------|
| **Page Load (Simple)** | 50-100ms | 150-200ms | 250-350ms | Students index, course list |
| **Page Load (Complex)** | 100-200ms | 250-400ms | 400-600ms | Instructor details with relationships |
| **Create/Update** | 75-150ms | 200-300ms | 350-500ms | Single entity CRUD operations |
| **Delete** | 50-100ms | 150-250ms | 250-400ms | Simple delete operations |
| **Search/Filter** | 100-200ms | 250-400ms | 400-700ms | Paginated queries with sorting |

**Assumptions:**
- LocalDB/SQL Server on same machine (dev environment)
- No network latency between app and database
- Minimal concurrent users (1-5)
- No caching layer
- Default EF Core query performance

#### Throughput Metrics

**Estimated Capacity:**

| Metric | Current Baseline | Target After Migration | Measurement Method |
|--------|-----------------|------------------------|-------------------|
| **Concurrent Users** | 5-10 | 50-100 | Anticipated increase |
| **Requests/Second** | 10-20 | 100-200 | Load testing required |
| **Database Connections** | 1-5 | 20-50 | Connection pool monitoring |
| **Page Views/Hour** | 100-500 | 1,000-5,000 | Application Insights |

**Current Bottlenecks:**
- No connection pooling optimization detected
- No caching strategy (every request hits database)
- No CDN for static assets
- No query optimization or indexing strategy documented

#### Error Rate Baseline

**Current Error Tracking:**

| Error Category | Estimated Rate | Detection Method | Recovery Strategy |
|----------------|---------------|------------------|-------------------|
| **Database Connection Failures** | <0.1% | Application logs | Automatic retry (EF Core default) |
| **Concurrency Conflicts** | <1% (Department edits only) | Try-catch in page models | User intervention required |
| **Validation Errors** | 5-10% (user input errors) | ModelState validation | User corrects and resubmits |
| **Unhandled Exceptions** | <0.5% | Generic error page | Manual investigation |
| **Not Found (404)** | 2-5% | HTTP status codes | User navigation |

**Current Limitations:**
- ❌ No Application Performance Monitoring (APM) tool deployed
- ❌ No structured logging or log aggregation
- ❌ No real-time alerting on errors
- ❌ No error rate SLOs defined

### Performance Test Results

**Current State:**
- ❌ **No formal load testing performed**
- ❌ **No performance benchmarks established**
- ❌ **No stress testing conducted**
- ❌ **No capacity planning documentation**

**Test Methodology Recommendations:**

1. **Load Testing:**
   - Tool: Apache JMeter, k6, or Azure Load Testing
   - Scenarios: Normal load (10 users), peak load (50 users), stress (100+ users)
   - Duration: 30-minute sustained load tests
   - Metrics: Response time, throughput, error rate, resource utilization

2. **Synthetic Monitoring:**
   - Critical user journeys: Student enrollment flow, course management, instructor assignment
   - Frequency: Every 5 minutes from multiple geographic locations
   - Baseline: <2 second page load time for 95th percentile

3. **Database Performance:**
   - Query profiling with EF Core logging
   - Index usage analysis
   - Lock contention monitoring
   - Connection pool saturation checks

---

## Reliability & Resilience

### Service Level Objectives (SLO) / Service Level Agreements (SLA)

**Current State:**
- ❌ **No formal SLOs defined**
- ❌ **No SLAs with stakeholders**
- ❌ **No availability monitoring**
- ❌ **No uptime tracking**

**Recommended Baseline SLOs:**

| Service Level Indicator (SLI) | Target SLO | Measurement Window | Current Achievement (Estimated) |
|------------------------------|------------|-------------------|--------------------------------|
| **Availability** | 99.5% (43.8 hours downtime/year) | Monthly | Unknown (no monitoring) |
| **Request Success Rate** | 99.0% | Daily | ~99.5% (estimated) |
| **P95 Response Time** | <500ms | Hourly | ~300-400ms (estimated) |
| **Database Availability** | 99.9% | Monthly | Dependent on SQL Server |

**Error Budget:**
- 99.5% availability = 3.65 hours downtime per month
- 99.0% success rate = 1% of requests can fail
- Must allocate budget for planned maintenance, deployments, and incidents

### Resilience Patterns

**Currently Implemented:**

1. **Transaction Management:**
   - ✅ ACID transactions via SQL Server
   - ✅ Automatic rollback on exceptions
   - ✅ Optimistic concurrency control (Department entity)
   - Pattern: Strong consistency model

2. **Error Handling:**
   - ✅ Global exception handler (production)
   - ✅ Developer exception page (development)
   - ✅ ModelState validation
   - ✅ Concurrency conflict resolution UI

**Not Implemented (Gaps):**

3. **Retry Logic:**
   - ❌ No retry policy for transient failures
   - ❌ No circuit breaker for database connections
   - ❌ No exponential backoff

4. **Fallback Strategies:**
   - ❌ No graceful degradation
   - ❌ No cached data fallback
   - ❌ No static error pages

5. **Bulkhead Pattern:**
   - ❌ No resource isolation
   - ❌ No rate limiting
   - ❌ No request throttling

6. **Health Checks:**
   - ❌ No health check endpoints
   - ❌ No database connectivity monitoring
   - ❌ No readiness/liveness probes

### High Availability & Disaster Recovery

**Current Architecture:**

```
┌────────────────────────────────────────────────┐
│         Single Point of Failure Analysis       │
└────────────────────────────────────────────────┘

Single Web Server Instance
         │
         ├─ No load balancer
         ├─ No auto-scaling
         └─ No redundancy
         
Single Database Instance
         │
         ├─ SQL Server LocalDB (dev)
         ├─ No replication
         ├─ No failover
         └─ No backup automation (dev)
```

**Disaster Recovery Plan:**
- ❌ **No documented DR plan**
- ❌ **No backup procedures documented**
- ❌ **No RTO (Recovery Time Objective) defined**
- ❌ **No RPO (Recovery Point Objective) defined**

**Recommended Targets:**

| Metric | Development | Production Target |
|--------|-------------|------------------|
| **RTO** | Best effort | <1 hour |
| **RPO** | Not applicable | <5 minutes |
| **Backup Frequency** | Manual only | Hourly (transaction logs), Daily (full) |
| **Backup Retention** | None | 30 days |

---

## Scalability

### Current Scalability Model

**Architecture Type:** Monolithic (single deployable unit)

**Scaling Approach:**

| Dimension | Current State | Scaling Capability | Constraints |
|-----------|--------------|-------------------|-------------|
| **Vertical (Scale Up)** | Single server | ✅ Possible | Hardware limits, cost |
| **Horizontal (Scale Out)** | Single instance | ❌ Not supported | No session management, in-process state |
| **Database** | Single SQL Server | ⚠️ Limited | Requires read replicas or sharding |
| **Static Assets** | Served from app | ✅ CDN possible | Requires configuration |

### Capacity Planning

**Current Capacity:**

```
┌─────────────────────────────────────────────────────────┐
│            Resource Utilization Baseline                │
│                  (Estimated for 10 Users)               │
└─────────────────────────────────────────────────────────┘

CPU Usage:         ▓░░░░░░░░░  10-15% average
Memory:            ▓▓░░░░░░░░  200-300 MB RAM
Database Size:     ▓░░░░░░░░░  <100 MB (seed data)
Network I/O:       ▓░░░░░░░░░  <1 Mbps
Disk I/O:          ▓░░░░░░░░░  Minimal (LocalDB)
```

**Growth Projections:**

| Users | CPU | Memory | Database Size | Network | Notes |
|-------|-----|--------|---------------|---------|-------|
| 10 | 10-15% | 300 MB | 100 MB | 1 Mbps | Current baseline |
| 50 | 40-60% | 500 MB | 500 MB | 5 Mbps | Expected with proper caching |
| 100 | 70-90% | 800 MB | 1 GB | 10 Mbps | Requires optimization |
| 200+ | ❌ Saturated | ❌ Saturated | 2+ GB | 20+ Mbps | Requires horizontal scaling |

**Scaling Triggers:**

- CPU sustained >70% for 5 minutes → Scale up or optimize queries
- Memory >80% → Investigate memory leaks, optimize EF Core
- Database size >5 GB → Implement data archival strategy
- Response time P95 >1 second → Add caching layer

### Database Scalability

**Current Database Constraints:**

- **Single SQL Server instance**
- **No read replicas**
- **No query caching** (EF Core second-level cache not configured)
- **No connection pooling optimization**
- **No indexing strategy** (default EF Core indexes only)

**Scaling Options:**

1. **Vertical Scaling:** Increase SQL Server resources (CPU, RAM, SSD)
2. **Read Replicas:** Separate read and write workloads
3. **Connection Pooling:** Optimize `min/max pool size` in connection string
4. **Query Optimization:** Add strategic indexes, optimize EF Core queries
5. **Caching:** Implement Redis or in-memory cache for frequent queries

---

## Security Posture

### Authentication & Authorization

**Current State:**

| Security Control | Status | Risk Level | Notes |
|-----------------|--------|-----------|-------|
| **Authentication** | ❌ Not implemented | **CRITICAL** | No user login system |
| **Authorization** | ❌ Not implemented | **CRITICAL** | All data publicly accessible |
| **Session Management** | ⚠️ Default ASP.NET Core | **MEDIUM** | No custom session handling |
| **Password Policy** | ❌ N/A | N/A | No user accounts |
| **Multi-Factor Authentication** | ❌ Not implemented | **CRITICAL** | No users to protect |

**Security Gaps:**

- 🚨 **CRITICAL:** No authentication means anyone can access, modify, or delete all data
- 🚨 **CRITICAL:** No authorization means no role-based access control
- ⚠️ **WARNING:** Application designed for trusted internal network only

### Data Protection

**Encryption:**

| Data State | Current Protection | Risk | Recommendation |
|-----------|-------------------|------|----------------|
| **Data at Rest** | ❌ Not encrypted (LocalDB) | **HIGH** | Enable Transparent Data Encryption (TDE) |
| **Data in Transit** | ⚠️ HTTPS in production (assumed) | **MEDIUM** | Enforce HTTPS redirect, HSTS |
| **Connection Strings** | ⚠️ Plain text in appsettings.json | **MEDIUM** | Use Azure Key Vault or User Secrets |
| **Sensitive Data** | ⚠️ No data classification | **MEDIUM** | Identify PII, implement field-level encryption |

**Personal Identifiable Information (PII):**

- Student names, enrollment dates, grades
- Instructor names, hire dates, office locations
- No encryption, masking, or anonymization
- ⚠️ Potential FERPA compliance issues

### Vulnerability Management

**Dependency Security:**

| Package | Version | Known Vulnerabilities | Status |
|---------|---------|---------------------|--------|
| **.NET 6.0** | 6.0.x | ❌ **Out of support (Nov 2024)** | **CRITICAL** - No security patches |
| **EF Core** | 6.0.2 | ❌ **Out of support** | **CRITICAL** - Upgrade to 8.0.x |
| **ASP.NET Core** | 6.0.2 | ❌ **Out of support** | **CRITICAL** - Upgrade to 8.0.x |

**Security Scanning:**

- ✅ **CodeQL** enabled in GitHub Actions (static analysis)
- ❌ **No dependency scanning** (Dependabot not configured)
- ❌ **No dynamic application security testing (DAST)**
- ❌ **No penetration testing** performed
- ❌ **No security audit** conducted

**OWASP Top 10 Assessment:**

| OWASP Risk | Current Mitigation | Risk Level | Notes |
|-----------|-------------------|-----------|-------|
| **A01: Broken Access Control** | ❌ None | **CRITICAL** | No authentication/authorization |
| **A02: Cryptographic Failures** | ⚠️ Partial | **HIGH** | No data encryption at rest |
| **A03: Injection** | ✅ Mitigated | **LOW** | EF Core parameterized queries |
| **A04: Insecure Design** | ⚠️ Partial | **MEDIUM** | No security requirements |
| **A05: Security Misconfiguration** | ⚠️ Partial | **MEDIUM** | Default ASP.NET Core settings |
| **A06: Vulnerable Components** | ❌ None | **CRITICAL** | .NET 6 out of support |
| **A07: Authentication Failures** | ❌ N/A | **CRITICAL** | No authentication system |
| **A08: Software & Data Integrity** | ⚠️ Partial | **MEDIUM** | No integrity checks |
| **A09: Logging & Monitoring Failures** | ❌ None | **HIGH** | Minimal logging, no monitoring |
| **A10: Server-Side Request Forgery** | ✅ Mitigated | **LOW** | No external HTTP requests |

### Network Security

**Current Configuration:**

- **Firewall:** Not documented
- **TLS/SSL:** Assumed enabled in production (no HTTPS enforcement in code)
- **CORS:** Not configured (no API endpoints)
- **CSP (Content Security Policy):** ❌ Not configured
- **Rate Limiting:** ❌ Not implemented
- **DDoS Protection:** ❌ Not implemented

---

## Compliance & Regulatory Requirements

### Current Compliance Status

**Applicable Regulations:**

| Regulation | Applicability | Current Compliance | Gaps |
|-----------|---------------|-------------------|------|
| **FERPA (Family Educational Rights and Privacy Act)** | ✅ High | ❌ **Non-compliant** | No access controls, audit logs, consent management |
| **GDPR (General Data Protection Regulation)** | ⚠️ Medium (if EU users) | ❌ **Non-compliant** | No data subject rights, no privacy controls |
| **SOC 2** | ⚠️ Low (internal use) | ❌ Not assessed | No security controls documentation |
| **PCI-DSS** | ❌ Not applicable | N/A | No payment processing |

### FERPA Requirements

**Student Records Protection:**

| FERPA Requirement | Current State | Compliance Status |
|------------------|--------------|------------------|
| **Access Controls** | ❌ None | ❌ **Non-compliant** |
| **Audit Logging** | ❌ None | ❌ **Non-compliant** |
| **Consent Management** | ❌ Not implemented | ❌ **Non-compliant** |
| **Data Retention Policy** | ❌ Not documented | ❌ **Non-compliant** |
| **Breach Notification** | ❌ Not documented | ❌ **Non-compliant** |
| **Student Rights (View/Correct)** | ⚠️ Partial (via UI) | ⚠️ **Partial** |

**Recommendations:**

1. Implement role-based access control (students, faculty, administrators)
2. Add comprehensive audit logging for all data access
3. Implement consent workflow for data sharing
4. Document and enforce data retention policies
5. Establish incident response and breach notification procedures

### Data Residency & Sovereignty

**Current State:**

- **Data Location:** LocalDB on developer machine (dev), unknown for production
- **Hosting Region:** Not documented (Azure region not specified)
- **Cross-Border Transfers:** Not documented
- **Data Residency Requirements:** Not assessed

**Compliance Gaps:**

- ❌ No data classification policy
- ❌ No data flow mapping
- ❌ No data residency enforcement
- ❌ No data retention schedule

### Audit & Compliance Reporting

**Current Capabilities:**

- ❌ **No audit trail** for data modifications
- ❌ **No compliance reports** generated
- ❌ **No access logs** maintained
- ❌ **No change management** process

**Required Improvements:**

1. Implement audit logging middleware
2. Store audit events in separate database
3. Generate compliance reports (access logs, data modifications)
4. Implement log retention policy (minimum 1 year)
5. Provide student record access reports for FERPA compliance

---

## Monitoring & Observability

### Current Monitoring

**Application Monitoring:**

| Metric Category | Current State | Tooling | Gaps |
|----------------|--------------|---------|------|
| **Performance Metrics** | ❌ None | None | No APM tool |
| **Availability Monitoring** | ❌ None | None | No uptime checks |
| **Error Tracking** | ⚠️ Basic logs | ASP.NET Core logging | No aggregation |
| **User Behavior** | ❌ None | None | No analytics |
| **Infrastructure Metrics** | ❌ None | None | No system monitoring |

**Logging:**

```json
"Logging": {
  "LogLevel": {
    "Default": "Information",
    "Microsoft.AspNetCore": "Warning"
  }
}
```

- ✅ Console logging enabled (development)
- ❌ No structured logging (Serilog, NLog)
- ❌ No log aggregation (ELK, Azure Log Analytics)
- ❌ No log retention policy
- ❌ No log-based alerting

### Recommended Observability Stack

**Production Monitoring Requirements:**

1. **Application Performance Monitoring (APM):**
   - Tool: Azure Application Insights, New Relic, or Datadog
   - Metrics: Response time, throughput, error rate, dependency tracking
   - Distributed tracing for database calls

2. **Infrastructure Monitoring:**
   - Tool: Azure Monitor, CloudWatch, or Prometheus/Grafana
   - Metrics: CPU, memory, disk I/O, network traffic
   - Alerts on resource saturation

3. **Log Aggregation:**
   - Tool: Azure Log Analytics, ELK Stack, or Splunk
   - Structured logging with correlation IDs
   - Centralized log search and analysis

4. **Synthetic Monitoring:**
   - Tool: Azure Application Insights Availability Tests, Pingdom, or UptimeRobot
   - Critical user journey monitoring
   - Multi-region availability checks

5. **Real User Monitoring (RUM):**
   - Tool: Application Insights (client-side telemetry)
   - Browser performance metrics
   - User behavior analytics

---

## Migration Impact Assessment

### Nonfunctional Requirements Priorities

**Must Have (P0) - Pre-Migration:**

1. ✅ Establish performance baseline via load testing
2. ✅ Implement basic authentication/authorization
3. ✅ Upgrade .NET 6 to .NET 8 LTS (security critical)
4. ✅ Configure HTTPS enforcement and HSTS
5. ✅ Implement health check endpoints

**Should Have (P1) - During Migration:**

6. ✅ Deploy Application Performance Monitoring (APM)
7. ✅ Implement structured logging with correlation IDs
8. ✅ Configure database backups and retention
9. ✅ Document SLOs and error budgets
10. ✅ Add retry logic for transient failures

**Could Have (P2) - Post-Migration:**

11. ⚠️ Implement caching layer (Redis)
12. ⚠️ Add rate limiting and throttling
13. ⚠️ Implement data encryption at rest
14. ⚠️ Configure CDN for static assets
15. ⚠️ Establish disaster recovery procedures

**Won't Have (P3) - Future Consideration:**

16. ❌ Horizontal scaling (multi-instance deployment)
17. ❌ Microservices decomposition
18. ❌ Advanced resilience patterns (circuit breaker, bulkhead)
19. ❌ Multi-region deployment
20. ❌ Advanced compliance automation

### Performance Improvement Targets

**Post-Migration Goals:**

| Metric | Current Baseline | Target Improvement | Success Criteria |
|--------|-----------------|-------------------|------------------|
| **P95 Response Time** | 300-400ms | <200ms | 33% improvement |
| **Throughput** | 10-20 req/s | 100-200 req/s | 10x improvement |
| **Error Rate** | ~0.5% | <0.1% | 5x reduction |
| **Availability** | Unknown | 99.5% | Measured uptime |
| **Database Query Time** | Unknown | <50ms (P95) | Indexed queries |

**Key Performance Initiatives:**

- Add strategic database indexes
- Implement Redis caching for frequent queries
- Optimize EF Core query patterns
- Enable response compression
- Configure CDN for static assets
- Implement connection pooling optimization

---

## Testing Strategy

### Performance Testing

**Load Test Scenarios:**

1. **Normal Load:**
   - 10 concurrent users
   - 60-minute duration
   - Mix: 60% reads, 30% updates, 10% deletes
   - Target: P95 <500ms, error rate <0.1%

2. **Peak Load:**
   - 50 concurrent users
   - 30-minute duration
   - Same operation mix
   - Target: P95 <1000ms, error rate <1%

3. **Stress Test:**
   - Gradually increase from 10 to 200 users
   - Identify breaking point
   - Measure degradation curve
   - Document failure modes

**Tools:**
- Apache JMeter or k6 for load generation
- Azure Load Testing for cloud-based testing
- Application Insights for metrics collection

### Security Testing

**Required Tests:**

1. **Vulnerability Scanning:**
   - OWASP ZAP or Burp Suite
   - Dependency scanning (Dependabot, Snyk)
   - Container scanning (if containerized)

2. **Penetration Testing:**
   - Third-party security audit
   - Focus on authentication bypass, injection, broken access control
   - Annual testing cadence

3. **Compliance Audits:**
   - FERPA compliance review
   - Access control validation
   - Audit log completeness

### Reliability Testing

**Chaos Engineering:**

1. **Database Failure Simulation:**
   - Kill database connection
   - Validate error handling and recovery
   - Test connection retry logic

2. **Network Latency Injection:**
   - Add 1-5 second delays
   - Verify timeout handling
   - Test user experience degradation

3. **Resource Exhaustion:**
   - Simulate CPU/memory saturation
   - Test graceful degradation
   - Validate alerting

---

## Appendix: Data Sources & Assumptions

### Data Collection Methodology

**Analysis Methods:**

1. **Static Code Analysis:**
   - Repository code review
   - Architecture documentation review
   - Dependency analysis

2. **Configuration Review:**
   - appsettings.json inspection
   - Project file (.csproj) analysis
   - GitHub Actions workflow review

3. **Estimations:**
   - ASP.NET Core 6.0 performance benchmarks
   - Entity Framework Core typical performance
   - SQL Server LocalDB characteristics

### Assumptions & Limitations

**Key Assumptions:**

- Development environment representative of production topology
- LocalDB performance similar to SQL Server Express
- No significant load testing data available
- No production telemetry available
- Small-scale educational institution deployment (<100 concurrent users)

**Limitations:**

- ❌ No real-world performance data
- ❌ No production monitoring baseline
- ❌ No user behavior analytics
- ❌ No capacity planning data
- ❌ No incident history

### Recommended Next Steps

**Phase 0: Baseline Establishment (Weeks 1-2)**

1. **Deploy APM tooling** (Application Insights) to development environment
2. **Conduct load testing** with JMeter/k6 to establish real performance baseline
3. **Implement basic authentication** (ASP.NET Core Identity)
4. **Configure structured logging** (Serilog) with Azure Log Analytics
5. **Document current architecture** with C4 diagrams (already completed)
6. **Perform dependency security audit** with OWASP Dependency-Check

**Phase 1: Critical Improvements (Weeks 3-4)**

7. **Upgrade to .NET 8 LTS** for security patches
8. **Implement health check endpoints** for monitoring
9. **Configure database backups** and test restore procedures
10. **Define and document SLOs** with stakeholder approval
11. **Deploy production monitoring** (APM, uptime checks)

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Migration Architect | Initial baseline document created from architecture analysis |

---

## Sign-Off

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | TBD | ____________ | ______ |
| Security Architect | TBD | ____________ | ______ |
| Product Owner | TBD | ____________ | ______ |
| QA Lead | TBD | ____________ | ______ |

---

_This baseline document should be reviewed and updated after establishing real-world monitoring and conducting performance testing. All estimates should be validated against actual measurements before finalizing migration plans._
