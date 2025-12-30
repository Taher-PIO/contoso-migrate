---
title: 'Integration & Dependency Map - ContosoUniversity'
last_updated: '2025-12-30'
owner: 'Migration Architect'
status: 'Complete'
scope: 'System integrations, dependencies, SLAs, and failure modes'
---

# Integration & Dependency Map - ContosoUniversity

## Executive Summary

This document maps all upstream/downstream systems, external dependencies, message queues, scheduled jobs, SLA requirements, and failure handling strategies for the ContosoUniversity application ecosystem. The analysis covers both the ASP.NET Core Razor Pages application and the Node.js Express API.

**Key Findings:**
- **Integration Pattern:** Simple synchronous architecture with direct database access
- **External Dependencies:** SQL Server LocalDB (development), Azure SQL (production assumed)
- **Message Queues:** None currently implemented
- **Scheduled Jobs:** No cron jobs or background workers detected
- **Authentication:** No external identity providers (unauthenticated system)
- **API Integrations:** No third-party API calls identified

**Architecture Type:** Monolithic, tightly-coupled, synchronous request-response pattern

---

## Table of Contents

- [System Integration Diagram](#system-integration-diagram)
- [Upstream Systems (Inbound Dependencies)](#upstream-systems-inbound-dependencies)
- [Downstream Systems (Outbound Dependencies)](#downstream-systems-outbound-dependencies)
- [Database Integration](#database-integration)
- [Message Queues & Async Patterns](#message-queues--async-patterns)
- [Scheduled Jobs & Background Workers](#scheduled-jobs--background-workers)
- [Service Dependencies Matrix](#service-dependencies-matrix)
- [SLA Requirements & Timeouts](#sla-requirements--timeouts)
- [Failure Modes & Retry Strategies](#failure-modes--retry-strategies)
- [Deployment Dependencies](#deployment-dependencies)
- [Migration Considerations](#migration-considerations)

---

## System Integration Diagram

### C4 Level 3: Integration Context Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                    ContosoUniversity System Context                     │
│                                                                          │
│                                                                          │
│  ┌──────────────┐                                                       │
│  │              │        HTTPS/Browser                                  │
│  │  End Users   │◄──────────────────────────────────────┐              │
│  │  (Web UI)    │                                        │              │
│  │              │──────────────────────────────────────► │              │
│  └──────────────┘                                        │              │
│                                                           │              │
│                                                           ▼              │
│  ┌──────────────┐                               ┌────────────────────┐ │
│  │              │        HTTP/REST               │                    │ │
│  │  API Clients │◄──────────────────────────────►│  ASP.NET Core 6.0  │ │
│  │  (Future)    │                                │  Razor Pages App   │ │
│  │              │                                │                    │ │
│  └──────────────┘                                └──────────┬─────────┘ │
│                                                              │           │
│                                                              │ SQL/TDS   │
│                                                              │ Port:1433 │
│  ┌──────────────┐                                           │           │
│  │              │        HTTP/REST                ┌─────────▼─────────┐ │
│  │  Health      │◄───────────────────────────────►│                   │ │
│  │  Monitoring  │                                 │   Node.js API     │ │
│  │  (Future)    │                                 │   (Express)       │ │
│  └──────────────┘                                 └─────────┬─────────┘ │
│                                                              │           │
│                                                              │ SQL/TDS   │
│                                                              │ Port:1433 │
│                                                              │           │
│                                                    ┌─────────▼─────────┐ │
│                                                    │                   │ │
│                                                    │   SQL Server      │ │
│                                                    │   LocalDB (Dev)   │ │
│                                                    │   Azure SQL (Prod)│ │
│                                                    │                   │ │
│                                                    │  SchoolContext DB │ │
│                                                    │                   │ │
│                                                    └───────────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Deployment Pipeline (GitHub Actions)                            │  │
│  │  ┌─────────┐    ┌─────────┐    ┌──────────────────────────┐    │  │
│  │  │  Build  │───►│  Test   │───►│  Azure App Service       │    │  │
│  │  │  Stage  │    │  Stage  │    │  (staging → production)  │    │  │
│  │  └─────────┘    └─────────┘    └──────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘
```

### Integration Flow Direction Legend

- **►** Synchronous HTTP/HTTPS request-response
- **│** Database connection (persistent connection pool)
- No asynchronous messaging or event-driven patterns detected

---

## Upstream Systems (Inbound Dependencies)

Systems or actors that **call into** ContosoUniversity applications.

### Summary Table

| Source System | Protocol | Port | Authentication | Rate Limit | Purpose | Criticality |
|--------------|----------|------|----------------|------------|---------|-------------|
| **Web Browsers** | HTTPS | 443 (prod), 5000-7000 (dev) | None | N/A | User interface access | HIGH |
| **Future API Clients** | HTTP/REST | 5000 (API) | None (planned) | TBD | Programmatic access | MEDIUM |
| **GitHub Actions CI/CD** | Deployment | N/A | Azure Service Principal | N/A | Automated deployments | HIGH |
| **Azure App Service Health Probe** | HTTP | 443 | None | Every 30s (typical) | Platform health monitoring | HIGH |

### Details

#### 1. Web Browsers (End Users)

**Type:** Human Actors  
**Protocol:** HTTPS (production), HTTP (development)  
**Interface:** ASP.NET Core Razor Pages rendering HTML

**Endpoints Consumed:**
- `/Students/*` - Student management CRUD operations
- `/Courses/*` - Course management CRUD operations
- `/Instructors/*` - Instructor management CRUD operations
- `/Departments/*` - Department management CRUD operations
- `/About` - Analytics dashboard (enrollment statistics)
- `/` - Home page

**Expected Traffic:**
- Concurrent Users: TBD (no load testing data available)
- Request Pattern: Synchronous page loads with form submissions
- Peak Times: TBD (no analytics data available)

**Failure Impact:** Complete loss of user access to application

---

#### 2. Future API Clients

**Status:** Planned (Node.js API provides minimal health endpoint only)  
**Current Implementation:** `/api/health` endpoint on port 5000  
**Protocol:** HTTP/REST  
**Authentication:** None implemented

**Planned Integrations:**
- Mobile applications (future)
- Third-party integrations (future)
- Microservices architecture (migration target)

---

#### 3. GitHub Actions CI/CD Pipeline

**Type:** Automation System  
**Protocol:** GitHub Actions workflow execution  
**Authentication:** Azure Service Principal (stored in `secrets.AZURE_CREDENTIALS`)

**Workflow File:** `.github/workflows/dotnet.yml`

**Stages:**
1. **Build** → Compiles .NET application
2. **Test** → Runs unit tests (if present)
3. **Deploy Staging** → Deploys to Azure App Service staging slot
4. **Deploy Production** → Performs slot swap to production

**Dependencies:**
- GitHub hosted runners (ubuntu-latest)
- .NET 6.0 SDK
- Azure CLI
- Azure App Service slots (staging, production)

**Failure Impact:** Blocked deployments, manual intervention required

---

## Downstream Systems (Outbound Dependencies)

Systems that ContosoUniversity applications **call out to**.

### Summary Table

| Target System | Direction | Protocol | Port | Timeout | Retry Policy | Circuit Breaker | Criticality |
|--------------|-----------|----------|------|---------|--------------|-----------------|-------------|
| **SQL Server LocalDB (Dev)** | Outbound | TDS/SQL | 1433 | 30s | None | No | CRITICAL |
| **Azure SQL (Production)** | Outbound | TDS/SQL | 1433 | 30s | None | No | CRITICAL |
| **Static Assets (wwwroot)** | Internal | File System | N/A | N/A | N/A | N/A | LOW |

### Details

#### 1. SQL Server Database

**Development:** SQL Server LocalDB (`(localdb)\mssqllocaldb`)  
**Production:** Azure SQL Database (assumed, not configured in source code)

**Connection Details:**
```
Server: (localdb)\mssqllocaldb (development)
Database: SchoolContext-a8778b0f-1bfd-4d0f-a500-09390a0df97f
Authentication: Windows Authentication (Trusted_Connection=True) - Dev
             : SQL Authentication (expected for Azure SQL) - Prod
Connection String Location: appsettings.json
```

**Entity Framework Core Configuration:**
```csharp
// Program.cs - Line 8-9
builder.Services.AddDbContext<SchoolContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SchoolContext")));
```

**Node.js API Configuration:**
```javascript
// contoso-api/src/config/database.ts
connectTimeout: 30000,     // 30 seconds
requestTimeout: 30000,     // 30 seconds
pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
}
```

**Connection Pool Settings:**
- **ASP.NET Core:** Default EF Core connection pooling (not explicitly configured)
- **Node.js API:** Max 10 connections, min 0, 30s idle timeout

**Database Operations:**
- CRUD operations on Student, Course, Instructor, Department, Enrollment entities
- Transaction support via Entity Framework Core
- Optimistic concurrency control using RowVersion on Department entity
- Automatic migrations on application startup (Program.cs line 34)

**Failure Impact:** Complete application failure - all operations depend on database

---

## Database Integration

### Connection String Management

**ASP.NET Core Application:**

File: `ContosoUniversity/appsettings.json`
```json
{
  "ConnectionStrings": {
    "SchoolContext": "Server=(localdb)\\mssqllocaldb;Database=SchoolContext-a8778b0f-1bfd-4d0f-a500-09390a0df97f;Trusted_Connection=True;MultipleActiveResultSets=true"
  }
}
```

**Node.js API:**

File: `contoso-api/.env.example`
```
DB_SERVER=(localdb)\\mssqllocaldb
DB_DATABASE=SchoolContext-a8778b0f-1bfd-4d0f-a500-09390a0df97f
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

### Database Access Pattern

**Pattern:** Direct synchronous queries via ORM (Entity Framework Core)  
**Transaction Boundaries:** Implicit via `DbContext.SaveChanges()` or `SaveChangesAsync()`  
**Isolation Level:** Read Committed (SQL Server default)

### Data Access Methods

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **ORM** | Entity Framework Core 6.0.2 | Object-relational mapping |
| **Provider** | Microsoft.EntityFrameworkCore.SqlServer | SQL Server data provider |
| **Context** | SchoolContext | Application database context |
| **Migration Tool** | EF Core Migrations | Schema version control |

### Critical Database Operations

**Startup Migration (Automatic):**
```csharp
// Program.cs - Lines 28-36
using (var scope = app.Services.CreateScope())
{
    var context = services.GetRequiredService<SchoolContext>();
    context.Database.Migrate();  // Applies pending migrations
    DbInitializer.Initialize(context);  // Seeds initial data
}
```

**Risk:** Application startup failure if database is unavailable or migrations fail.

---

## Message Queues & Async Patterns

### Status: NOT IMPLEMENTED

**Analysis Results:**
- ✗ No message queue implementations detected (Kafka, RabbitMQ, Azure Service Bus, etc.)
- ✗ No asynchronous messaging patterns found in codebase
- ✗ No event-driven architecture components
- ✓ All operations are synchronous request-response

**Grep Analysis:**
```bash
# Search results for message queue technologies
grep -r "Kafka\|RabbitMQ\|ServiceBus\|Queue\|Message" --include="*.cs"
Result: No matches found
```

### Future Considerations

Potential integration points for async patterns during migration:

1. **Student Enrollment Notifications** - Email/SMS notifications for enrollment confirmation
2. **Report Generation** - Async processing for large reports (e.g., transcript generation)
3. **Data Export** - Batch export of student/course data
4. **Audit Logging** - Asynchronous audit trail to separate datastore

**Current State:** All notifications and background processing must be implemented as future enhancements.

---

## Scheduled Jobs & Background Workers

### Status: NOT IMPLEMENTED

**Analysis Results:**
- ✗ No cron job configurations found
- ✗ No Windows Task Scheduler tasks
- ✗ No Azure Functions or WebJobs
- ✗ No Hangfire or Quartz.NET background job libraries
- ✗ No GitHub Actions scheduled workflows

**Searched Locations:**
```
- /.github/workflows/*.yml - No scheduled workflows (on: schedule)
- /ContosoUniversity/**/*.csproj - No background job packages
- /ContosoUniversity/**/*.cs - No IHostedService implementations
- /contoso-api/package.json - No cron or scheduler packages
```

### Potential Future Jobs

Based on typical university system requirements:

| Job Name | Frequency | Purpose | Priority |
|----------|-----------|---------|----------|
| **Data Backup** | Daily 2:00 AM | Database backup automation | HIGH |
| **Student Enrollment Reminders** | Daily 8:00 AM | Remind students of pending enrollments | MEDIUM |
| **Report Generation** | Weekly Sunday | Generate weekly analytics reports | LOW |
| **Inactive Account Cleanup** | Monthly | Archive inactive student records | LOW |
| **Grade Calculation Batch** | End of Term | Batch calculate final grades | HIGH |

**Current State:** All scheduled operations must be implemented as future enhancements or handled manually.

---

## Service Dependencies Matrix

### Critical Path Dependencies

```
User Request
    ↓
ASP.NET Core Kestrel (Web Server)
    ↓
Razor Page Model (Business Logic)
    ↓
Entity Framework Core (ORM)
    ↓
SQL Server Database
    ↓
Response Rendered
```

**Single Point of Failure:** SQL Server Database

### Dependency Criticality Matrix

| Component | Criticality | MTTR Target | Monitoring | Fallback Strategy |
|-----------|------------|-------------|------------|-------------------|
| **SQL Server** | CRITICAL | <15 min | Azure SQL monitoring (prod) | None - Application fails |
| **ASP.NET Core Runtime** | CRITICAL | <5 min | Azure App Service health checks | Auto-restart |
| **Static Assets (wwwroot)** | LOW | <1 min | None | Browser caching |
| **Entity Framework Core** | CRITICAL | <5 min | Application logging | None - Code dependency |
| **Azure App Service** | CRITICAL | <15 min | Azure platform monitoring | Slot swap rollback |

**Legend:**
- **MTTR:** Mean Time To Recovery
- **CRITICAL:** Application unusable if unavailable
- **HIGH:** Degraded functionality
- **MEDIUM:** Non-critical features affected
- **LOW:** Minimal impact

---

## SLA Requirements & Timeouts

### Application-Level SLAs

| Operation Category | Target SLA | Current Implementation | Monitoring |
|-------------------|-----------|----------------------|------------|
| **Page Loads (GET)** | <500ms (p95) | No monitoring | None |
| **Form Submissions (POST)** | <1000ms (p95) | No monitoring | None |
| **Database Queries** | <300ms (p95) | No monitoring | None |
| **API Health Check** | <100ms | Implemented | Manual testing only |

**Note:** No application performance monitoring (APM) tools detected. SLA targets are estimates based on industry standards.

### Timeout Configurations

#### ASP.NET Core Application

**Default Timeouts (not explicitly configured):**
```csharp
// Kestrel defaults (not overridden in code)
RequestTimeout: 5 minutes (300 seconds)
KeepAliveTimeout: 130 seconds
MinRequestBodyDataRate: 240 bytes/second
```

**Database Command Timeout:**
```csharp
// Entity Framework Core - Default: 30 seconds
// Not explicitly configured, uses provider default
```

**Configuration Location:** Not found in `Program.cs` or `appsettings.json`

#### Node.js API

**Configured Timeouts:**
```javascript
// contoso-api/src/config/database.ts
options: {
    connectTimeout: 30000,      // 30 seconds
    requestTimeout: 30000,      // 30 seconds
    enableArithAbort: true,
}

pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000    // 30 seconds
}
```

**HTTP Server Timeout:**
```javascript
// Express default (not explicitly configured)
Server timeout: 120 seconds (2 minutes)
```

### Recommended Timeout Policy

| Layer | Operation | Current Timeout | Recommended | Reason |
|-------|-----------|----------------|-------------|--------|
| **HTTP Request** | Web page load | 300s (default) | 30s | Prevent hung requests |
| **HTTP Request** | API call | 120s (default) | 10s | Fast failure for API |
| **Database Connection** | Connect | 30s | 15s | Faster failure detection |
| **Database Query** | Command | 30s | 30s | Adequate for complex queries |
| **Connection Pool** | Idle timeout | 30s | 60s | Reduce connection churn |

---

## Failure Modes & Retry Strategies

### Current Retry Policy: NONE IMPLEMENTED

**Analysis Results:**
- ✗ No retry logic detected in application code
- ✗ No resilience libraries (Polly, Microsoft.Extensions.Http.Resilience)
- ✗ No circuit breaker patterns
- ✗ No fallback strategies

### Identified Failure Modes

#### 1. Database Connection Failure

**Scenario:** SQL Server unavailable or connection timeout

**Current Behavior:**
```csharp
// No try-catch in Program.cs database initialization
context.Database.Migrate();  // Application crashes on failure
```

**Impact:**
- Application fails to start
- HTTP 500 error for all requests
- No graceful degradation

**Detection Time:** Immediate (application startup)  
**Recovery:** Manual restart after database restoration  
**User Experience:** Complete service outage

**Recommended Mitigation:**
```csharp
// Add retry policy with exponential backoff
services.AddDbContext<SchoolContext>(options =>
{
    options.UseSqlServer(connectionString,
        sqlServerOptionsAction: sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        });
});
```

---

#### 2. Database Query Timeout

**Scenario:** Long-running query exceeds 30-second timeout

**Current Behavior:**
- Exception thrown: `System.Data.SqlClient.SqlException: Timeout expired`
- User sees generic error page (development) or `/Error` page (production)
- No automatic retry

**Impact:**
- User loses form data
- Transaction rollback
- User must resubmit request

**Detection Time:** 30 seconds  
**Recovery:** User manual retry  
**User Experience:** Poor - data loss, frustration

**Recommended Mitigation:**
1. Optimize slow queries (add indexes)
2. Implement query timeout extension for reports
3. Add user-friendly error messages with retry button

---

#### 3. Optimistic Concurrency Conflict

**Scenario:** Two users edit same Department record simultaneously

**Current Behavior:**
```csharp
// Pages/Departments/Edit.cshtml.cs - Lines 50-70
catch (DbUpdateConcurrencyException)
{
    // Shows error message with current vs. attempted values
    // User must manually refresh and reapply changes
}
```

**Impact:**
- User sees concurrency error page
- Changes are lost
- Manual conflict resolution required

**Detection Time:** On save operation  
**Recovery:** User manual retry with refreshed data  
**User Experience:** Acceptable - clear error message provided

**Status:** ✓ Properly handled for Department entity only

---

#### 4. Azure App Service Platform Failure

**Scenario:** Azure App Service becomes unhealthy

**Current Behavior:**
- Azure platform health checks detect failure (default: HTTP ping to root)
- Automatic restart after 3 consecutive failures
- Slot swap rollback available (manual trigger)

**Impact:**
- Brief service interruption (1-2 minutes)
- In-flight requests lost
- Session state lost (no distributed session management)

**Detection Time:** 1-3 minutes (Azure health check frequency)  
**Recovery:** Automatic platform restart  
**User Experience:** Temporary service unavailable (503)

**Recommended Improvement:**
- Implement `/health` endpoint with database connectivity check
- Configure Azure health check to use `/health` endpoint
- Add distributed session storage (Redis/SQL Server)

---

#### 5. GitHub Actions Deployment Failure

**Scenario:** CI/CD pipeline fails during deployment

**Failure Points:**
1. **Build failure** - Compilation errors
2. **Test failure** - Unit test failures (if tests exist)
3. **Artifact upload failure** - GitHub Actions infrastructure issue
4. **Azure authentication failure** - Service principal credentials expired
5. **Deployment failure** - Azure App Service quota exceeded or slot unavailable
6. **Slot swap failure** - Staging slot unhealthy

**Current Behavior:**
- Workflow stops at failure point
- Email notification to commit author (GitHub default)
- Previous production version remains deployed
- Manual investigation required

**Impact:**
- Blocked deployments
- Delayed feature releases
- Hotfix deployment delays

**Detection Time:** 5-15 minutes (workflow execution time)  
**Recovery:** Manual intervention and workflow re-run  
**User Experience:** No impact (production unchanged)

**Recommended Mitigation:**
- Add automated rollback on deployment failure
- Implement smoke tests post-deployment
- Add Slack/Teams notifications for faster response

---

### Retry Strategy Recommendations

| Failure Type | Retry Policy | Max Retries | Backoff Strategy | Circuit Breaker |
|-------------|--------------|-------------|------------------|-----------------|
| **Database Connection** | Automatic | 5 | Exponential (2s, 4s, 8s, 16s, 30s) | After 10 failures in 1 min |
| **Database Query Timeout** | Manual | N/A | N/A | No |
| **Transient SQL Error** | Automatic | 3 | Exponential (1s, 2s, 4s) | No |
| **Azure Service Call** | Automatic | 3 | Exponential (1s, 2s, 4s) | After 5 failures in 30s |
| **File System Operation** | Automatic | 2 | Linear (500ms, 1s) | No |

**Implementation:** Use [Polly](https://github.com/App-vNext/Polly) library for resilience patterns

---

## Deployment Dependencies

### GitHub Actions Workflow Dependencies

**File:** `.github/workflows/dotnet.yml`

#### Build Stage Dependencies

```yaml
- actions/checkout@v2           # Source code checkout
- actions/setup-dotnet@v1        # .NET 6.0 SDK installation
- dotnet restore                 # NuGet package restoration
- dotnet build                   # Compilation
- dotnet test                    # Unit test execution
- dotnet publish                 # Release artifact creation
- actions/upload-artifact@v3.0.0 # Artifact storage
```

**External Dependencies:**
- GitHub-hosted runner (ubuntu-latest)
- NuGet package registry (nuget.org)
- .NET 6.0 SDK availability

---

#### Deploy Staging Dependencies

```yaml
- actions/download-artifact@v2.0.8  # Retrieve build artifacts
- azure/login@v1                    # Azure authentication
- azure/webapps-deploy@v2           # App Service deployment
- az logout                         # Azure CLI cleanup
```

**External Dependencies:**
- Azure subscription active
- Service principal credentials valid (`secrets.AZURE_CREDENTIALS`)
- Azure App Service `contoso-uni` exists
- Staging slot provisioned

**Required Secrets:**
- `AZURE_CREDENTIALS` - Service principal JSON with subscription access

---

#### Deploy Production Dependencies

```yaml
- azure/login@v1                    # Azure authentication
- az webapp deployment slot swap    # Slot swap operation
- az logout                         # Cleanup
```

**External Dependencies:**
- Staging deployment successful
- Staging slot healthy (passes health checks)
- Production slot ready to receive traffic

---

### Azure App Service Dependencies

**Resource Group:** `ContosoUniversity`  
**App Service:** `contoso-uni`  
**Deployment Slots:** `staging`, `production` (default)

**Platform Dependencies:**
- Azure App Service Plan (tier: TBD - not in source code)
- Azure SQL Database (production) - not configured in repo
- Application Insights (recommended, not detected)
- Azure Key Vault (recommended, not detected)

**Configuration Requirements:**
- Connection string for Azure SQL Database
- Application settings for environment-specific values
- Managed Identity or connection string authentication

---

## Migration Considerations

### Integration Gaps Requiring Attention

#### 1. Monitoring & Observability

**Current State:** No monitoring infrastructure detected

**Missing Components:**
- ✗ Application Performance Monitoring (APM)
- ✗ Distributed tracing
- ✗ Structured logging
- ✗ Health check endpoints (beyond basic HTTP ping)
- ✗ Metrics collection (response times, error rates, throughput)
- ✗ Alerting rules

**Recommendations:**
1. Add Application Insights SDK
2. Implement `/health` and `/ready` endpoints
3. Add structured logging (Serilog)
4. Define alerting thresholds (error rate >5%, p95 latency >1s)

---

#### 2. Resilience & Fault Tolerance

**Current State:** No resilience patterns implemented

**Gaps:**
- ✗ No retry policies
- ✗ No circuit breakers
- ✗ No fallback mechanisms
- ✗ No rate limiting
- ✗ No request throttling

**Recommendations:**
1. Integrate Polly for retry/circuit breaker policies
2. Add rate limiting middleware
3. Implement graceful degradation strategies
4. Add request timeout middleware

---

#### 3. Authentication & Authorization

**Current State:** Unauthenticated application (anyone can access all features)

**Security Risks:**
- No user identity management
- No role-based access control (RBAC)
- No audit trail of user actions
- Public CRUD operations on sensitive data

**Recommendations:**
1. Integrate Azure AD B2C or Okta
2. Implement role-based authorization (Admin, Faculty, Student)
3. Add audit logging for data modifications
4. Secure API endpoints with JWT bearer tokens

---

#### 4. Data Protection & Privacy

**Current State:** No encryption, no data masking

**Gaps:**
- ✗ No data encryption at rest (beyond SQL Server TDE if enabled)
- ✗ No PII data masking in logs
- ✗ No data retention policies
- ✗ No GDPR compliance features (right to be forgotten)

**Recommendations:**
1. Enable SQL Server Transparent Data Encryption (TDE)
2. Implement data masking for PII in logs
3. Add data retention and purge policies
4. Implement GDPR data export/deletion features

---

#### 5. API Gateway & Service Mesh

**Current State:** Direct access to applications, no API gateway

**Gaps:**
- ✗ No API gateway (Azure API Management, Kong, etc.)
- ✗ No service mesh (Istio, Linkerd)
- ✗ No centralized authentication
- ✗ No request routing/transformation

**Future Architecture Recommendation:**
```
Internet → Azure Front Door → API Gateway → Microservices
                                   ↓
                            Service Mesh (mTLS)
                                   ↓
                            Backend Services
```

---

#### 6. Async Processing & Event-Driven Architecture

**Current State:** Fully synchronous, blocking operations

**Opportunities for Async Patterns:**
1. Email/SMS notifications → Azure Service Bus + Azure Functions
2. Report generation → Azure Queue Storage + Background Worker
3. Data export → Event Grid + Blob Storage
4. Audit logging → Event Hub + Azure Data Lake

**Benefits:**
- Improved scalability
- Better user experience (non-blocking operations)
- Decoupled architecture
- Easier horizontal scaling

---

### Dependency Upgrade Path

#### Phase 1: Platform Modernization (Immediate)

- ✓ Upgrade .NET 6 → .NET 8 LTS
- ✓ Upgrade Entity Framework Core 6 → EF Core 8
- ✓ Upgrade GitHub Actions to latest versions
- ✓ Migrate LocalDB → Azure SQL Database (development)

#### Phase 2: Observability (Week 1-2)

- ⊙ Add Application Insights
- ⊙ Implement health check endpoints
- ⊙ Add structured logging
- ⊙ Configure alerts

#### Phase 3: Resilience (Week 3-4)

- ⊙ Implement retry policies with Polly
- ⊙ Add circuit breakers
- ⊙ Implement rate limiting
- ⊙ Add request timeouts

#### Phase 4: Security (Week 5-6)

- ⊙ Integrate authentication provider
- ⊙ Implement RBAC
- ⊙ Add audit logging
- ⊙ Enable data encryption

#### Phase 5: Async Patterns (Month 2-3)

- ⊙ Add message queue infrastructure
- ⊙ Implement background workers
- ⊙ Extract long-running operations to async processing
- ⊙ Add event-driven notifications

**Legend:** ✓ Ready to implement | ⊙ Planning required | ✗ Not planned

---

## Summary & Risk Assessment

### Integration Maturity Score

| Category | Current State | Target State | Gap |
|----------|--------------|--------------|-----|
| **External Dependencies** | 🟡 Minimal (SQL only) | 🟢 Well-managed | Low |
| **Resilience** | 🔴 None | 🟢 Comprehensive | High |
| **Monitoring** | 🔴 None | 🟢 Full observability | High |
| **Security** | 🔴 Unauthenticated | 🟢 Enterprise-grade | High |
| **Async Processing** | 🔴 None | 🟡 Selective use | Medium |
| **API Management** | 🔴 None | 🟡 API Gateway | Medium |

**Overall Integration Maturity:** 🔴 Low (Score: 2.5/10)

### Critical Risks

| Risk | Severity | Likelihood | Impact | Mitigation Priority |
|------|----------|-----------|--------|---------------------|
| **Database SPOF** | HIGH | Medium | Complete outage | HIGH - Add retry + monitoring |
| **No monitoring** | HIGH | High | Blind operations | HIGH - Add APM immediately |
| **No authentication** | CRITICAL | High | Security breach | CRITICAL - Add auth ASAP |
| **No retry logic** | MEDIUM | High | User frustration | MEDIUM - Add resilience patterns |
| **Manual deployments** | LOW | Low | Deployment delays | LOW - Automated CI/CD exists |

### Next Steps

1. **Immediate (Week 1):**
   - Add Application Insights
   - Implement health check endpoints
   - Add database retry policies

2. **Short-term (Month 1):**
   - Integrate authentication provider
   - Add structured logging
   - Implement circuit breakers

3. **Medium-term (Month 2-3):**
   - Add message queue infrastructure
   - Implement background workers
   - Deploy API gateway

4. **Long-term (Month 4-6):**
   - Migrate to microservices architecture
   - Implement event-driven patterns
   - Add service mesh

---

**Document Maintained By:** Migration Architecture Team  
**Last Updated:** 2025-12-30  
**Next Review:** Post-Phase 1 implementation  
**Version:** 1.0
