# Observability Playbook - Contoso University

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Author:** DevOps/Platform Engineering Team  
**Status:** Initial Assessment

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [Current Observability State](#current-observability-state)
- [Logging Architecture](#logging-architecture)
- [Metrics & Instrumentation](#metrics--instrumentation)
- [Distributed Tracing](#distributed-tracing)
- [Dashboards](#dashboards)
- [Alerting Strategy](#alerting-strategy)
- [SLO/SLI Definitions](#slosli-definitions)
- [Incident Response Runbooks](#incident-response-runbooks)
- [Target Stack Migration Plan](#target-stack-migration-plan)
- [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

This playbook documents the current observability posture of Contoso University and provides a comprehensive migration plan for implementing production-grade observability in the target stack. The application currently operates with **minimal observability capabilities**, relying primarily on basic ASP.NET Core logging with no structured logging, metrics collection, distributed tracing, or operational dashboards.

### Current State Assessment

| Capability | Status | Maturity Level |
|------------|--------|----------------|
| **Logging** | ⚠️ Basic | Level 1 (Console/Debug only) |
| **Metrics** | ❌ None | Level 0 (No instrumentation) |
| **Tracing** | ❌ None | Level 0 (No tracing) |
| **Dashboards** | ❌ None | Level 0 (No visualization) |
| **Alerts** | ❌ None | Level 0 (No alerting) |
| **SLOs** | ❌ None | Level 0 (No SLO tracking) |

**Key Findings:**
- ✅ Basic logging infrastructure present (ASP.NET Core ILogger)
- ✅ Request ID tracking in error pages (Activity.Current?.Id)
- ⚠️ No structured logging (JSON format)
- ⚠️ No log aggregation or central logging service
- ❌ No application performance monitoring (APM)
- ❌ No infrastructure metrics collection
- ❌ No distributed tracing instrumentation
- ❌ No operational dashboards or visualization
- ❌ No alerting or on-call rotation system
- ❌ No defined SLOs or error budgets

### Target State Goals

Implement **OpenTelemetry-based observability** with:
- Structured JSON logging with Serilog → Application Insights / ELK Stack
- OpenTelemetry metrics → Prometheus / Azure Monitor
- OpenTelemetry distributed tracing → Jaeger / Application Insights
- Grafana dashboards for application and infrastructure metrics
- Automated alerting via PagerDuty / Azure Alerts
- SLO tracking with error budgets (99.9% availability target)

---

## Current Observability State

### Application: Contoso University (.NET 6 Razor Pages)

#### Logging Infrastructure

**Configuration Source:** `appsettings.json` and `appsettings.Development.json`

```json
// appsettings.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}

// appsettings.Development.json
{
  "DetailedErrors": true,
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

**Logging Providers:**
- ✅ Console Logger (active in all environments)
- ✅ Debug Logger (active in Development)
- ❌ File Logger (not configured)
- ❌ Application Insights (not configured)
- ❌ Serilog (not configured)

**ILogger Usage:**
- `Pages/Error.cshtml.cs`: ILogger<ErrorModel> injected but **not actively used for logging**
- Other page models: **No logger injection detected**
- Program.cs: **No explicit logging calls**

**Request Correlation:**
- Error page uses `Activity.Current?.Id ?? HttpContext.TraceIdentifier` for request tracking
- **No custom correlation ID middleware**
- **No distributed trace context propagation**

#### Metrics Collection

**Current State:** ❌ **No metrics instrumentation**

**Available Data Sources:**
- ASP.NET Core built-in event counters (not exported)
- Entity Framework Core diagnostic events (not captured)
- IIS/Kestrel performance counters (if monitored externally)

**Missing Metrics:**
- Request throughput (requests/second)
- Request latency (p50, p95, p99)
- Error rates (4xx, 5xx)
- Database query performance
- Connection pool utilization
- Memory/CPU usage
- Custom business metrics (enrollments created, students added)

#### Tracing & APM

**Current State:** ❌ **No distributed tracing**

**What Exists:**
- `System.Diagnostics.Activity` (used for request ID in error page)
- **No OpenTelemetry SDK integration**
- **No APM agent (Application Insights, Datadog, New Relic)**

**Critical Paths Requiring Instrumentation:**
1. Student enrollment workflow: `Pages/Students/Create.cshtml.cs`
2. Course assignment: `Pages/Courses/Edit.cshtml.cs`
3. Department concurrency handling: `Pages/Departments/Edit.cshtml.cs`
4. Database initialization: `Data/DbInitializer.cs`
5. EF Core query execution spans

#### Error Handling & Monitoring

**Exception Handling:**
```csharp
// Program.cs
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}
else
{
    app.UseDeveloperExceptionPage();
    app.UseMigrationsEndPoint();
}
```

**Error Page Tracking:**
- Request ID displayed: `Activity.Current?.Id ?? HttpContext.TraceIdentifier`
- **No error logging to external service**
- **No error rate tracking**
- **No error notifications**

---

## Logging Architecture

### Current Log Schema

**Format:** Plain text (unstructured)

**Example Output (Console):**
```
info: Microsoft.AspNetCore.Hosting.Diagnostics[1]
      Request starting HTTP/1.1 GET https://localhost:5001/Students
info: Microsoft.AspNetCore.Routing.EndpointMiddleware[0]
      Executing endpoint '/Students'
info: Microsoft.AspNetCore.Mvc.RazorPages.Infrastructure.PageActionInvoker[3]
      Route matched with {page = "/Students/Index"}
```

**Log Levels Configured:**
- `Default`: Information
- `Microsoft.AspNetCore`: Warning

### Target Log Schema (Structured JSON)

**Format:** JSON with standard fields (Serilog format)

```json
{
  "timestamp": "2025-12-30T10:56:22.034Z",
  "level": "Information",
  "messageTemplate": "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000}ms",
  "message": "HTTP GET /Students responded 200 in 45.2341ms",
  "fields": {
    "RequestMethod": "GET",
    "RequestPath": "/Students",
    "StatusCode": 200,
    "Elapsed": 45.2341,
    "RequestId": "0HN3QRJV9K3J2",
    "CorrelationId": "a7f3c2d1-4e5f-6789-0abc-def123456789",
    "UserId": "user@contoso.edu",
    "MachineName": "contoso-web-01",
    "ApplicationName": "ContosoUniversity",
    "Environment": "Production"
  },
  "renderings": {
    "Elapsed": [{ "Format": "0.0000", "Rendering": "45.2341" }]
  }
}
```

### Log Categories & Retention

| Category | Log Level | Retention | Purpose |
|----------|-----------|-----------|---------|
| **Application** | Information | 30 days | Business logic, user actions |
| **Security** | Warning | 90 days | Authentication failures, authorization |
| **Performance** | Information | 14 days | Slow queries, high latency |
| **Infrastructure** | Warning | 30 days | Server health, connectivity |
| **Database** | Information | 30 days | EF Core queries, migrations |
| **Errors** | Error | 90 days | Exceptions, failures |
| **Audit** | Information | 1 year | Compliance, data changes |

### Critical Log Events

#### Application Events

| Event | Severity | Message Template | Fields |
|-------|----------|------------------|--------|
| `StudentEnrolled` | Information | "Student {StudentId} enrolled in course {CourseId}" | StudentId, CourseId, EnrollmentDate, UserId |
| `DepartmentUpdated` | Information | "Department {DepartmentId} updated by {UserId}" | DepartmentId, UserId, Changes |
| `ConcurrencyConflict` | Warning | "Concurrency conflict detected for Department {DepartmentId}" | DepartmentId, ConflictDetails |
| `DatabaseMigration` | Information | "Database migration {MigrationName} applied" | MigrationName, Duration |
| `SlowQuery` | Warning | "Query exceeded threshold: {QueryText} took {ElapsedMs}ms" | QueryText, ElapsedMs, Threshold |

#### Security Events

| Event | Severity | Message Template | Fields |
|-------|----------|------------------|--------|
| `AuthenticationFailed` | Warning | "Authentication failed for user {Username}" | Username, IPAddress, Reason |
| `UnauthorizedAccess` | Warning | "Unauthorized access attempt to {Resource}" | Resource, UserId, IPAddress |
| `SensitiveDataAccess` | Information | "Sensitive data accessed: {DataType}" | DataType, UserId, Timestamp |

#### Infrastructure Events

| Event | Severity | Message Template | Fields |
|-------|----------|------------------|--------|
| `ApplicationStarted` | Information | "Application started in {Environment}" | Environment, Version, MachineName |
| `HealthCheckFailed` | Error | "Health check {HealthCheckName} failed" | HealthCheckName, Reason, Duration |
| `DatabaseConnectionFailed` | Error | "Database connection failed: {ErrorMessage}" | ErrorMessage, ConnectionString, RetryCount |

### Log Enrichment

**Automatic Enrichers (Serilog):**
- Machine name
- Environment name (Development/Staging/Production)
- Application version
- Thread ID
- Process ID

**Custom Enrichers:**
- Request ID (correlation)
- User ID (from authentication context)
- Session ID
- Client IP address
- User agent

---

## Metrics & Instrumentation

### Target Metrics Architecture

**Collection:** OpenTelemetry .NET SDK  
**Export:** Prometheus (pull) or Azure Monitor (push)  
**Storage:** Prometheus TSDB or Azure Monitor workspace  
**Visualization:** Grafana dashboards

### Application Metrics

#### HTTP Request Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | method, path, status | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | method, path | Request latency distribution |
| `http_requests_in_progress` | Gauge | method, path | Active requests |
| `http_request_size_bytes` | Histogram | method, path | Request body size |
| `http_response_size_bytes` | Histogram | method, path | Response body size |

**Histogram Buckets (latency):** 0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10 seconds

#### Database Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `db_queries_total` | Counter | operation, table | Total database queries |
| `db_query_duration_seconds` | Histogram | operation, table | Query execution time |
| `db_connection_pool_size` | Gauge | state (active, idle) | Connection pool size |
| `db_connection_pool_wait_seconds` | Histogram | - | Time waiting for connection |
| `db_migrations_total` | Counter | status (success, failed) | Migration executions |

#### Business Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `students_enrolled_total` | Counter | department | Total student enrollments |
| `courses_created_total` | Counter | department | Courses created |
| `instructors_assigned_total` | Counter | department | Instructor assignments |
| `concurrency_conflicts_total` | Counter | entity_type | Optimistic concurrency conflicts |
| `validation_errors_total` | Counter | field | Validation failures |

#### System Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `process_cpu_seconds_total` | Counter | - | CPU time consumed |
| `process_memory_bytes` | Gauge | type (working_set, gc_heap) | Memory usage |
| `dotnet_gc_collections_total` | Counter | generation | Garbage collections |
| `dotnet_exceptions_total` | Counter | exception_type | Exceptions thrown |
| `dotnet_threadpool_threads` | Gauge | type (active, idle) | Thread pool size |

### Metric Cardinality Guidelines

**Low Cardinality (< 100 values):**
- HTTP methods (GET, POST, PUT, DELETE)
- HTTP status code classes (2xx, 3xx, 4xx, 5xx)
- Environment names (Development, Staging, Production)

**Medium Cardinality (< 1000 values):**
- Route paths (grouped by route template)
- Database operations (SELECT, INSERT, UPDATE, DELETE)
- Department names

**High Cardinality (avoid in labels):**
- User IDs (use trace context instead)
- Request IDs (use logs/traces)
- Specific error messages (use error_type label)

---

## Distributed Tracing

### Target Tracing Architecture

**Instrumentation:** OpenTelemetry .NET SDK  
**Propagation:** W3C Trace Context (traceparent header)  
**Export:** OTLP to Jaeger or Application Insights  
**Sampling:** Head-based sampling (10% for high traffic, 100% for errors)

### Trace Spans for Critical Paths

#### Student Enrollment Flow

**Operation:** `CreateStudent`

```
Span: HTTP POST /Students/Create
├─ Span: ValidateStudentModel
│  └─ Attributes: validation.field_count=3, validation.success=true
├─ Span: CheckDuplicateEnrollment
│  ├─ Span: EFCore.Query (SELECT from Enrollment)
│  │  └─ Attributes: db.system=mssql, db.operation=SELECT, db.table=Enrollment
│  └─ Attributes: duplicate_found=false
├─ Span: CreateStudentRecord
│  ├─ Span: EFCore.Insert (INSERT into Student)
│  │  └─ Attributes: db.system=mssql, db.operation=INSERT, db.table=Student
│  └─ Attributes: student_id=12345
└─ Span: RedirectToIndex
   └─ Attributes: redirect.target=/Students
```

**Span Attributes:**
- `http.method`: POST
- `http.route`: /Students/Create
- `http.status_code`: 302
- `user.id`: current_user_id
- `student.id`: created_student_id
- `enrollment.date`: ISO 8601 timestamp

#### Department Edit with Concurrency Handling

**Operation:** `UpdateDepartment`

```
Span: HTTP POST /Departments/Edit
├─ Span: LoadDepartmentFromDatabase
│  ├─ Span: EFCore.Query (SELECT from Department)
│  │  └─ Attributes: db.table=Department, department.id=5
│  └─ Attributes: concurrency_token=abc123
├─ Span: ValidateDepartmentModel
│  └─ Attributes: validation.success=true
├─ Span: UpdateDepartmentRecord
│  ├─ Span: EFCore.Update (UPDATE Department)
│  │  └─ Attributes: db.operation=UPDATE, db.table=Department
│  └─ Event: ConcurrencyConflictDetected
│     └─ Attributes: conflict.type=DbUpdateConcurrencyException
├─ Span: HandleConcurrencyConflict
│  ├─ Span: LoadCurrentDatabaseValues
│  └─ Attributes: conflict.resolution=user_decision_required
└─ Attributes: update.success=false, conflict.detected=true
```

**Span Events:**
- `validation.failed`: Field validation errors
- `concurrency.conflict`: Optimistic concurrency conflict
- `database.retry`: Connection retry attempts
- `exception.thrown`: Unhandled exceptions

### OpenTelemetry Configuration

**Instrumentation Libraries:**
```xml
<PackageReference Include="OpenTelemetry" Version="1.7.0" />
<PackageReference Include="OpenTelemetry.Exporter.OpenTelemetryProtocol" Version="1.7.0" />
<PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.7.0" />
<PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.7.0" />
<PackageReference Include="OpenTelemetry.Instrumentation.EntityFrameworkCore" Version="1.0.0-beta.10" />
<PackageReference Include="OpenTelemetry.Instrumentation.Http" Version="1.7.0" />
<PackageReference Include="OpenTelemetry.Instrumentation.SqlClient" Version="1.7.0-beta.1" />
```

**Program.cs Configuration (Pseudocode):**
```csharp
builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder =>
    {
        tracerProviderBuilder
            .AddSource("ContosoUniversity")
            .AddAspNetCoreInstrumentation()
            .AddEntityFrameworkCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddSqlClientInstrumentation()
            .AddOtlpExporter(options =>
            {
                options.Endpoint = new Uri("http://jaeger:4317");
            });
    })
    .WithMetrics(meterProviderBuilder =>
    {
        meterProviderBuilder
            .AddMeter("ContosoUniversity")
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddPrometheusExporter();
    });
```

### Sampling Strategy

| Environment | Sampling Rate | Justification |
|-------------|---------------|---------------|
| **Development** | 100% | Full visibility for debugging |
| **Staging** | 100% | Pre-production testing |
| **Production (low traffic)** | 100% | < 1000 req/sec |
| **Production (high traffic)** | 10% | > 1000 req/sec, reduce overhead |
| **Production (errors)** | 100% | Always trace errors |

---

## Dashboards

### Dashboard Inventory

#### 1. Application Performance Dashboard

**Tool:** Grafana  
**Refresh:** 30 seconds  
**Audience:** On-call engineers, SRE team

**Panels:**

| Panel | Visualization | Query | Threshold |
|-------|---------------|-------|-----------|
| Request Rate | Time series | `rate(http_requests_total[5m])` | - |
| Request Latency (p95) | Time series | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` | > 500ms warning |
| Error Rate | Time series | `rate(http_requests_total{status=~"5.."}[5m])` | > 1% warning, > 5% critical |
| Active Requests | Gauge | `http_requests_in_progress` | - |
| Status Code Distribution | Pie chart | `sum by (status) (rate(http_requests_total[5m]))` | - |
| Top 10 Slowest Endpoints | Table | `topk(10, rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]))` | - |

#### 2. Database Performance Dashboard

**Tool:** Grafana  
**Refresh:** 1 minute

**Panels:**

| Panel | Visualization | Query | Threshold |
|-------|---------------|-------|-----------|
| Query Rate | Time series | `rate(db_queries_total[5m])` | - |
| Query Latency (p99) | Time series | `histogram_quantile(0.99, rate(db_query_duration_seconds_bucket[5m]))` | > 1s warning |
| Connection Pool Usage | Time series | `db_connection_pool_size{state="active"}` | > 80% warning |
| Slow Queries | Table | `topk(10, rate(db_query_duration_seconds_sum[5m]) / rate(db_query_duration_seconds_count[5m]))` | - |
| Migrations Status | Stat | `db_migrations_total` | - |

#### 3. Business Metrics Dashboard

**Tool:** Grafana  
**Refresh:** 5 minutes  
**Audience:** Product managers, business stakeholders

**Panels:**

| Panel | Visualization | Query | Threshold |
|-------|---------------|-------|-----------|
| Daily Enrollments | Time series | `increase(students_enrolled_total[24h])` | - |
| Enrollments by Department | Bar chart | `sum by (department) (increase(students_enrolled_total[24h]))` | - |
| Courses Created (weekly) | Stat | `increase(courses_created_total[7d])` | - |
| Concurrency Conflicts | Time series | `rate(concurrency_conflicts_total[5m])` | > 5/min warning |
| Validation Error Rate | Time series | `rate(validation_errors_total[5m])` | - |

#### 4. Infrastructure Health Dashboard

**Tool:** Grafana  
**Refresh:** 1 minute

**Panels:**

| Panel | Visualization | Query | Threshold |
|-------|---------------|-------|-----------|
| CPU Usage | Time series | `rate(process_cpu_seconds_total[5m]) * 100` | > 80% warning |
| Memory Usage | Time series | `process_memory_bytes{type="working_set"}` | > 2GB warning |
| GC Collections | Time series | `rate(dotnet_gc_collections_total[5m])` | - |
| Thread Pool Usage | Time series | `dotnet_threadpool_threads{type="active"}` | - |
| Exception Rate | Time series | `rate(dotnet_exceptions_total[5m])` | > 1/sec warning |

### Dashboard Links

**Production:**
- Application Performance: `https://grafana.contoso.edu/d/app-perf`
- Database Performance: `https://grafana.contoso.edu/d/db-perf`
- Business Metrics: `https://grafana.contoso.edu/d/business`
- Infrastructure Health: `https://grafana.contoso.edu/d/infra`

**Staging:**
- Application Performance: `https://grafana-staging.contoso.edu/d/app-perf`

---

## Alerting Strategy

### Alert Channels

| Channel | Purpose | Response Time |
|---------|---------|---------------|
| **PagerDuty** | Critical production incidents | Immediate (on-call) |
| **Slack #alerts** | Warning-level alerts | 15 minutes |
| **Email** | Informational alerts | Best effort |
| **Slack #incidents** | Incident coordination | Real-time |

### Alert Definitions

#### Critical Alerts (PagerDuty)

| Alert Name | Condition | Threshold | Duration | Runbook |
|------------|-----------|-----------|----------|---------|
| **HighErrorRate** | `rate(http_requests_total{status=~"5.."}[5m]) > 0.05` | > 5% | 5 minutes | [Link](#runbook-high-error-rate) |
| **ApplicationDown** | `up{job="contoso-university"} == 0` | - | 1 minute | [Link](#runbook-application-down) |
| **DatabaseConnectionFailure** | `db_connection_pool_size == 0` | - | 2 minutes | [Link](#runbook-database-connection-failure) |
| **HighLatencyP99** | `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 5` | > 5 seconds | 10 minutes | [Link](#runbook-high-latency) |
| **DiskSpaceCritical** | `disk_free_percent < 10` | < 10% | 5 minutes | [Link](#runbook-disk-space) |

#### Warning Alerts (Slack)

| Alert Name | Condition | Threshold | Duration | Runbook |
|------------|-----------|-----------|----------|---------|
| **ElevatedErrorRate** | `rate(http_requests_total{status=~"5.."}[5m]) > 0.01` | > 1% | 10 minutes | [Link](#runbook-elevated-errors) |
| **HighLatencyP95** | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5` | > 500ms | 10 minutes | [Link](#runbook-high-latency) |
| **DatabaseSlowQueries** | `histogram_quantile(0.99, rate(db_query_duration_seconds_bucket[5m])) > 1` | > 1 second | 10 minutes | [Link](#runbook-slow-queries) |
| **HighCPUUsage** | `rate(process_cpu_seconds_total[5m]) * 100 > 80` | > 80% | 15 minutes | [Link](#runbook-high-cpu) |
| **HighMemoryUsage** | `process_memory_bytes{type="working_set"} > 2147483648` | > 2GB | 15 minutes | [Link](#runbook-high-memory) |
| **ConcurrencyConflictSpike** | `rate(concurrency_conflicts_total[5m]) > 0.083` | > 5/min | 5 minutes | [Link](#runbook-concurrency-conflicts) |

#### Informational Alerts (Email)

| Alert Name | Condition | Threshold | Duration |
|------------|-----------|-----------|----------|
| **LowTrafficAlert** | `rate(http_requests_total[5m]) < 0.1` | < 6 req/min | 1 hour |
| **NewDeployment** | Triggered by CI/CD | - | - |
| **DatabaseMigrationCompleted** | Triggered by migration script | - | - |

### Alert Severity Levels

| Severity | Response | Escalation | Examples |
|----------|----------|------------|----------|
| **Critical** | Immediate paging | 15 min → Team Lead | Application down, database failure, > 5% error rate |
| **Warning** | Slack notification | 1 hour → On-call | Elevated errors, high latency, resource pressure |
| **Info** | Email/log | None | Deployments, configuration changes |

---

## SLO/SLI Definitions

### Service Level Objectives (SLOs)

| SLO | Target | Error Budget (monthly) | Measurement Window |
|-----|--------|------------------------|-------------------|
| **Availability** | 99.9% | 43.2 minutes | Rolling 30 days |
| **Request Success Rate** | 99.5% | 0.5% errors | Rolling 30 days |
| **Latency (p95)** | < 500ms | 5% violations | Rolling 7 days |
| **Latency (p99)** | < 2s | 1% violations | Rolling 7 days |
| **Database Query Performance (p95)** | < 100ms | 5% violations | Rolling 7 days |

### Service Level Indicators (SLIs)

#### SLI: Availability

**Definition:** Percentage of time the application is accessible and responds to requests

**Measurement:**
```promql
(sum(up{job="contoso-university"}) / count(up{job="contoso-university"})) * 100
```

**Good Event:** HTTP response received (any status code)  
**Bad Event:** No response within timeout (30s)

#### SLI: Request Success Rate

**Definition:** Percentage of HTTP requests that complete successfully (non-5xx status)

**Measurement:**
```promql
(sum(rate(http_requests_total{status!~"5.."}[30d])) / sum(rate(http_requests_total[30d]))) * 100
```

**Good Event:** HTTP status 200-499  
**Bad Event:** HTTP status 5xx or timeout

#### SLI: Request Latency (p95)

**Definition:** 95th percentile of HTTP request duration

**Measurement:**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[7d]))
```

**Good Event:** Request completes in < 500ms  
**Bad Event:** Request takes ≥ 500ms

#### SLI: Request Latency (p99)

**Definition:** 99th percentile of HTTP request duration

**Measurement:**
```promql
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[7d]))
```

**Good Event:** Request completes in < 2s  
**Bad Event:** Request takes ≥ 2s

#### SLI: Database Query Performance (p95)

**Definition:** 95th percentile of database query execution time

**Measurement:**
```promql
histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[7d]))
```

**Good Event:** Query completes in < 100ms  
**Bad Event:** Query takes ≥ 100ms

### Error Budget Policy

| Error Budget Remaining | Action |
|------------------------|--------|
| **> 75%** | Normal operations; continue feature development |
| **50-75%** | Review recent changes; investigate trends |
| **25-50%** | Freeze feature releases; focus on reliability |
| **< 25%** | Incident declared; all hands on reliability improvements |
| **0%** | Feature freeze until budget replenished |

### SLO Tracking Dashboard

**Grafana Dashboard:** `https://grafana.contoso.edu/d/slo-tracking`

**Panels:**
- Availability (30-day rolling window)
- Success rate (30-day rolling window)
- Latency p95/p99 (7-day rolling window)
- Error budget burn rate
- Time to error budget exhaustion (projection)

---

## Incident Response Runbooks

### Runbook: High Error Rate

**Alert:** HighErrorRate or ElevatedErrorRate  
**Severity:** Critical / Warning  
**On-Call Team:** Application Engineering

#### Investigation Steps

1. **Confirm the alert**
   ```bash
   # Check current error rate
   curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])"
   ```

2. **Check recent deployments**
   ```bash
   # List recent deployments
   kubectl rollout history deployment/contoso-university -n production
   ```

3. **Review application logs**
   ```bash
   # Tail error logs (last 100 lines)
   kubectl logs -n production deployment/contoso-university --tail=100 --since=10m | grep -i error
   ```

4. **Check error distribution**
   - Open Grafana dashboard: Application Performance
   - Review "Status Code Distribution" panel
   - Identify which endpoints are failing

5. **Review exception logs**
   - Open Application Insights / Log Analytics
   - Query: `traces | where severityLevel >= 3 | summarize count() by operation_Name, outerMessage`

#### Common Causes

| Symptom | Likely Cause | Resolution |
|---------|--------------|------------|
| 500 errors on all endpoints | Application crash, configuration error | Rollback deployment |
| 500 errors on database operations | Database connection failure | Check database health |
| 503 errors | Resource exhaustion, pod restarts | Scale up application |
| Spike in 401/403 errors | Authentication service outage | Check identity provider |

#### Resolution Actions

**For Critical Issues:**
1. Page on-call team lead
2. Create incident in PagerDuty
3. Start incident Slack channel: `#incident-YYYYMMDD-NNN`
4. Execute rollback if recent deployment:
   ```bash
   kubectl rollout undo deployment/contoso-university -n production
   ```
5. Verify error rate returns to normal
6. Schedule postmortem

**For Warning Issues:**
1. Monitor for 5 minutes
2. If error rate continues to climb, escalate to critical
3. Review error logs for patterns
4. Create Jira ticket for investigation

#### Recovery Validation

- [ ] Error rate below 1% for 10 consecutive minutes
- [ ] No new errors in last 5 minutes
- [ ] Success rate above 99%
- [ ] Application logs show no exceptions

---

### Runbook: Application Down

**Alert:** ApplicationDown  
**Severity:** Critical  
**On-Call Team:** SRE / DevOps

#### Investigation Steps

1. **Verify application is truly down**
   ```bash
   # Check from multiple locations
   curl -I https://contoso-university.azurewebsites.net/
   curl -I https://contoso-uni.azurewebsites.net/api/health
   ```

2. **Check Kubernetes pod status**
   ```bash
   kubectl get pods -n production -l app=contoso-university
   kubectl describe pod <pod-name> -n production
   ```

3. **Review pod logs**
   ```bash
   kubectl logs -n production <pod-name> --previous  # Previous crashed pod
   kubectl logs -n production <pod-name>            # Current pod
   ```

4. **Check resource quotas**
   ```bash
   kubectl top pods -n production
   kubectl describe resourcequota -n production
   ```

#### Common Causes

| Symptom | Likely Cause | Resolution |
|---------|--------------|------------|
| Pods in CrashLoopBackOff | Application startup failure | Check logs for exceptions |
| Pods pending | Insufficient cluster resources | Scale cluster or reduce requests |
| Pods running but not responding | Application hang | Restart pods |
| No pods running | Deployment deleted/scaled to 0 | Re-deploy application |

#### Resolution Actions

1. **If pods are crashing:**
   ```bash
   # View startup errors
   kubectl logs -n production <pod-name> --previous
   # Common fixes: configuration errors, missing secrets
   ```

2. **If pods are hanging:**
   ```bash
   # Force restart
   kubectl rollout restart deployment/contoso-university -n production
   ```

3. **If database is unreachable:**
   ```bash
   # Test database connectivity
   kubectl run -it --rm debug --image=mcr.microsoft.com/mssql-tools --restart=Never -- \
     sqlcmd -S <db-server> -U <user> -P <password> -Q "SELECT 1"
   ```

4. **Emergency rollback:**
   ```bash
   kubectl rollout undo deployment/contoso-university -n production
   ```

#### Recovery Validation

- [ ] All pods in Running state
- [ ] Health check endpoint returns 200
- [ ] Application accessible from public internet
- [ ] Dashboard shows request traffic resuming

---

### Runbook: Database Connection Failure

**Alert:** DatabaseConnectionFailure  
**Severity:** Critical  
**On-Call Team:** Database / SRE

#### Investigation Steps

1. **Check database server status**
   ```bash
   # Azure SQL
   az sql server show --resource-group ContosoUniversity --name contoso-sql
   
   # AWS RDS
   aws rds describe-db-instances --db-instance-identifier contoso-db
   ```

2. **Test connectivity from application**
   ```bash
   # From Kubernetes pod
   kubectl exec -n production <pod-name> -- /bin/sh -c \
     "sqlcmd -S <server> -U <user> -P <pass> -Q 'SELECT 1'"
   ```

3. **Check connection string configuration**
   ```bash
   kubectl get secret -n production db-connection-string -o yaml
   ```

4. **Review database logs**
   - Azure SQL: Check Activity Log in Azure Portal
   - AWS RDS: Check CloudWatch Logs

#### Common Causes

| Symptom | Likely Cause | Resolution |
|---------|--------------|------------|
| Connection timeout | Network misconfiguration, firewall | Check security groups/NSGs |
| Authentication failure | Incorrect credentials | Verify secrets |
| Database offline | Maintenance, backup restore | Wait or restore from backup |
| Connection pool exhausted | Connection leak in application | Restart application |

#### Resolution Actions

1. **Verify network connectivity:**
   ```bash
   # Test from pod
   kubectl exec -n production <pod-name> -- nc -zv <db-host> 1433
   ```

2. **Check connection pool settings:**
   - Review `appsettings.json` for connection string
   - Look for `Max Pool Size` parameter
   - Increase if necessary: `Max Pool Size=200`

3. **Restart application to reset connections:**
   ```bash
   kubectl rollout restart deployment/contoso-university -n production
   ```

4. **If database is truly down, escalate to database team**

#### Recovery Validation

- [ ] Application can connect to database
- [ ] Connection pool shows healthy utilization (< 80%)
- [ ] Database queries executing successfully
- [ ] No connection errors in logs

---

### Runbook: High Latency

**Alert:** HighLatencyP95 or HighLatencyP99  
**Severity:** Critical / Warning  
**On-Call Team:** Application Engineering

#### Investigation Steps

1. **Identify slow endpoints**
   ```promql
   # Top 10 slowest endpoints
   topk(10, histogram_quantile(0.95, 
     rate(http_request_duration_seconds_bucket[5m])))
   ```

2. **Check database query performance**
   ```promql
   # Slow database queries
   histogram_quantile(0.99, rate(db_query_duration_seconds_bucket[5m]))
   ```

3. **Review distributed traces**
   - Open Jaeger UI: `http://jaeger.contoso.edu`
   - Filter by high latency: `duration > 2s`
   - Identify bottleneck spans

4. **Check external dependencies**
   - Third-party APIs (if any)
   - Authentication services
   - File storage

5. **Review CPU and memory usage**
   ```promql
   rate(process_cpu_seconds_total[5m]) * 100
   process_memory_bytes{type="working_set"}
   ```

#### Common Causes

| Symptom | Likely Cause | Resolution |
|---------|--------------|------------|
| All endpoints slow | High CPU, memory pressure | Scale up/out |
| Specific endpoints slow | Inefficient query, N+1 problem | Optimize query |
| Intermittent slowness | GC pressure, connection pool waits | Tune GC, increase pool size |
| Slow after deployment | New code regression | Rollback |

#### Resolution Actions

1. **For slow database queries:**
   ```sql
   -- Review query execution plan
   SET SHOWPLAN_XML ON;
   -- Run problematic query
   -- Analyze plan for missing indexes
   ```

2. **For high CPU:**
   ```bash
   # Scale up replicas
   kubectl scale deployment/contoso-university -n production --replicas=6
   ```

3. **For memory pressure:**
   - Check for memory leaks in traces
   - Increase pod memory limits
   - Restart pods to reclaim memory

4. **For slow endpoints (immediate mitigation):**
   - Add caching layer (Redis)
   - Implement request timeout
   - Rate limit expensive operations

#### Recovery Validation

- [ ] P95 latency below 500ms
- [ ] P99 latency below 2s
- [ ] No slow queries (> 1s)
- [ ] CPU usage below 70%

---

### Runbook: Concurrency Conflicts

**Alert:** ConcurrencyConflictSpike  
**Severity:** Warning  
**On-Call Team:** Application Engineering

#### Investigation Steps

1. **Check conflict rate by entity**
   ```promql
   rate(concurrency_conflicts_total[5m]) by (entity_type)
   ```

2. **Review recent Department updates**
   - Most conflicts occur in Department entity due to `ConcurrencyToken`
   - Check if multiple users editing same department

3. **Review application logs**
   ```bash
   kubectl logs -n production deployment/contoso-university | \
     grep "DbUpdateConcurrencyException"
   ```

4. **Check user behavior**
   - Are multiple admins editing departments simultaneously?
   - Is there an automated process causing conflicts?

#### Resolution Actions

1. **If conflicts are expected (multiple users):**
   - No action required
   - User will see conflict resolution UI
   - Monitor to ensure conflicts don't cause errors

2. **If conflicts are unexpected (automation):**
   - Review automated processes
   - Implement retry logic with exponential backoff
   - Consider pessimistic locking for automation

3. **If conflict rate is extremely high (> 100/min):**
   - Investigate for race condition bug
   - Check for retry loops causing cascading conflicts
   - Consider temporary pessimistic locking

#### Recovery Validation

- [ ] Conflict rate returns to baseline (< 5/min)
- [ ] Users successfully resolving conflicts
- [ ] No error alerts triggered

---

## Target Stack Migration Plan

### Migration Strategy: Phased Rollout

#### Phase 0: Foundation (Weeks 1-2)

**Goal:** Establish baseline observability infrastructure

**Tasks:**
- [ ] Deploy Prometheus server (Kubernetes or VM)
- [ ] Deploy Grafana server
- [ ] Configure Prometheus scraping for existing metrics (if any)
- [ ] Create initial Grafana dashboards (infrastructure only)
- [ ] Set up Slack integration for alerts
- [ ] Document runbook templates

**Deliverables:**
- Prometheus collecting basic system metrics
- Grafana dashboard showing infrastructure health
- Slack #alerts channel configured

**Validation:**
- Can view CPU/memory metrics in Grafana
- Test alert fires successfully to Slack

---

#### Phase 1: Structured Logging (Weeks 3-4)

**Goal:** Implement structured JSON logging with Serilog

**Tasks:**
- [ ] Add Serilog NuGet packages to ContosoUniversity.csproj
  ```xml
  <PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
  <PackageReference Include="Serilog.Sinks.Console" Version="5.0.1" />
  <PackageReference Include="Serilog.Sinks.File" Version="5.0.0" />
  <PackageReference Include="Serilog.Enrichers.Environment" Version="2.3.0" />
  <PackageReference Include="Serilog.Enrichers.Thread" Version="3.1.0" />
  ```

- [ ] Configure Serilog in `Program.cs`:
  ```csharp
  using Serilog;
  
  var builder = WebApplication.CreateBuilder(args);
  
  builder.Host.UseSerilog((context, configuration) =>
  {
      configuration
          .ReadFrom.Configuration(context.Configuration)
          .Enrich.FromLogContext()
          .Enrich.WithMachineName()
          .Enrich.WithEnvironmentName()
          .Enrich.WithProperty("ApplicationName", "ContosoUniversity")
          .WriteTo.Console(new Serilog.Formatting.Json.JsonFormatter())
          .WriteTo.File(
              formatter: new Serilog.Formatting.Json.JsonFormatter(),
              path: "/logs/contoso-university-.log",
              rollingInterval: RollingInterval.Day,
              retainedFileCountLimit: 30);
  });
  ```

- [ ] Add request logging middleware:
  ```csharp
  app.UseSerilogRequestLogging(options =>
  {
      options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
      {
          diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
          diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
          diagnosticContext.Set("RemoteIpAddress", httpContext.Connection.RemoteIpAddress);
      };
  });
  ```

- [ ] Add correlation ID middleware
- [ ] Inject ILogger into page models and add log statements
- [ ] Configure log levels in `appsettings.Production.json`

**Deliverables:**
- JSON-formatted logs to console and file
- Request correlation IDs in all logs
- Enriched log context (machine name, environment)

**Validation:**
- Logs are JSON formatted
- Each request has unique correlation ID
- Can filter logs by correlation ID

---

#### Phase 2: OpenTelemetry Metrics (Weeks 5-6)

**Goal:** Instrument application with OpenTelemetry metrics

**Tasks:**
- [ ] Add OpenTelemetry NuGet packages
- [ ] Configure OpenTelemetry in Program.cs (metrics)
- [ ] Expose Prometheus metrics endpoint `/metrics`
- [ ] Configure Prometheus to scrape application
- [ ] Create custom business metrics (enrollments, courses)
- [ ] Build Grafana dashboards:
  - Application Performance Dashboard
  - Database Performance Dashboard
  - Business Metrics Dashboard

**Deliverables:**
- `/metrics` endpoint exposing Prometheus metrics
- Grafana dashboards showing application metrics
- Custom business metrics tracked

**Validation:**
- Can query metrics in Prometheus
- Dashboards show real-time application data
- Business metrics accurate (compare with database counts)

---

#### Phase 3: Distributed Tracing (Weeks 7-8)

**Goal:** Implement distributed tracing with OpenTelemetry and Jaeger

**Tasks:**
- [ ] Deploy Jaeger backend (all-in-one or production setup)
- [ ] Add OpenTelemetry tracing packages
- [ ] Configure OpenTelemetry in Program.cs (tracing)
- [ ] Enable automatic instrumentation (ASP.NET Core, EF Core)
- [ ] Add custom spans for business operations
- [ ] Configure trace sampling (100% in staging, 10% in production)
- [ ] Create trace-based dashboards in Grafana

**Deliverables:**
- Jaeger UI accessible
- Traces visible for all HTTP requests
- Database queries appear as child spans
- Custom spans for critical business logic

**Validation:**
- Can view end-to-end trace in Jaeger
- Span duration accurate
- Database queries instrumented
- Error traces captured

---

#### Phase 4: Alerting & SLOs (Weeks 9-10)

**Goal:** Implement production alerting and SLO tracking

**Tasks:**
- [ ] Define SLOs (availability, latency, error rate)
- [ ] Configure Prometheus alert rules
- [ ] Set up PagerDuty integration
- [ ] Configure alert routing (critical → PagerDuty, warning → Slack)
- [ ] Create SLO tracking dashboard in Grafana
- [ ] Write incident response runbooks
- [ ] Test alert end-to-end (trigger test alert)

**Deliverables:**
- Production alerts firing to PagerDuty
- SLO dashboard showing compliance
- Error budget tracking
- Complete runbook documentation

**Validation:**
- Test alert reaches PagerDuty
- SLO dashboard accurate
- Error budget calculation correct
- Runbooks followed successfully in drill

---

#### Phase 5: Advanced Observability (Weeks 11-12)

**Goal:** Implement advanced features (log aggregation, APM, RUM)

**Tasks:**
- [ ] Deploy ELK Stack or use Azure Log Analytics
- [ ] Configure log shipping from application
- [ ] Enable Application Insights (Azure) or Datadog APM
- [ ] Implement Real User Monitoring (RUM) - frontend JavaScript
- [ ] Create anomaly detection alerts
- [ ] Implement log-based metrics
- [ ] Build executive dashboard (high-level metrics)

**Deliverables:**
- Centralized log aggregation
- Full-stack APM with dependency mapping
- RUM data from end users
- ML-based anomaly detection

**Validation:**
- Can search logs in Kibana/Log Analytics
- APM shows full application topology
- RUM data visible in dashboards
- Anomaly detection fires on test condition

---

### Target Stack Observability Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Contoso University                          │
│                  (.NET 8 / ASP.NET Core)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  OpenTelemetry SDK                                        │  │
│  │  • Metrics (Prometheus format)                            │  │
│  │  • Traces (OTLP protocol)                                 │  │
│  │  • Logs (via Serilog bridge)                              │  │
│  └────────┬─────────────────┬───────────────────┬────────────┘  │
└───────────┼─────────────────┼───────────────────┼────────────────┘
            │                 │                   │
            │ /metrics        │ OTLP              │ JSON logs
            │ (Prometheus)    │ (gRPC)            │
            │                 │                   │
            ▼                 ▼                   ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
   │  Prometheus  │  │    Jaeger    │  │  Azure Log       │
   │   (TSDB)     │  │  (Trace DB)  │  │  Analytics       │
   │              │  │              │  │  or ELK Stack    │
   └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘
          │                 │                    │
          └─────────────────┴────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │     Grafana      │
                  │  (Visualization) │
                  │  • Dashboards    │
                  │  • Alerts        │
                  └────────┬─────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
          ▼                                 ▼
   ┌────────────┐                   ┌──────────────┐
   │  PagerDuty │                   │     Slack    │
   │ (Critical) │                   │  (Warnings)  │
   └────────────┘                   └──────────────┘
```

### Technology Stack Comparison

| Component | Current | Target | Justification |
|-----------|---------|--------|---------------|
| **Logging Framework** | ASP.NET Core ILogger | Serilog | Structured logging, rich sinks |
| **Log Format** | Plain text | JSON | Machine parsable, structured |
| **Log Aggregation** | None | Azure Log Analytics / ELK | Centralized search and analysis |
| **Metrics Collection** | None | OpenTelemetry | Vendor-neutral, standard protocol |
| **Metrics Storage** | None | Prometheus | Time-series database, PromQL |
| **Tracing** | None | OpenTelemetry + Jaeger | W3C standard, open source |
| **APM** | None | Application Insights (optional) | Azure-native, full-stack visibility |
| **Visualization** | None | Grafana | Open source, flexible dashboards |
| **Alerting** | None | Grafana + Prometheus Alertmanager | Rule-based alerting, routing |
| **Incident Management** | None | PagerDuty | On-call scheduling, escalation |
| **SLO Tracking** | None | Grafana + custom calculations | Error budget management |

---

## Implementation Roadmap

### Week 1-2: Foundation Setup
- Deploy monitoring infrastructure (Prometheus, Grafana)
- Configure basic system metrics collection
- Set up Slack integration

### Week 3-4: Logging Upgrade
- Implement Serilog with JSON formatting
- Add correlation IDs
- Configure log enrichment

### Week 5-6: Metrics Instrumentation
- Add OpenTelemetry SDK
- Instrument HTTP and database metrics
- Build initial Grafana dashboards

### Week 7-8: Distributed Tracing
- Deploy Jaeger
- Enable automatic tracing
- Add custom business spans

### Week 9-10: Alerting & SLOs
- Define SLOs
- Configure alerts (PagerDuty, Slack)
- Write runbooks

### Week 11-12: Advanced Features
- Log aggregation (ELK / Log Analytics)
- APM integration (Application Insights)
- Anomaly detection

### Week 13: Production Rollout
- Deploy observability to production
- Monitor for 1 week
- Tune alert thresholds
- Conduct incident drill

### Week 14: Documentation & Training
- Finalize runbooks
- Train on-call engineers
- Create observability overview presentation
- Establish on-call rotation

---

## Appendix A: Configuration Examples

### Serilog Configuration (appsettings.json)

```json
{
  "Serilog": {
    "Using": ["Serilog.Sinks.Console", "Serilog.Sinks.File"],
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.AspNetCore": "Warning",
        "Microsoft.EntityFrameworkCore.Database.Command": "Information"
      }
    },
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "formatter": "Serilog.Formatting.Json.JsonFormatter, Serilog"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "/logs/contoso-university-.log",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30,
          "formatter": "Serilog.Formatting.Json.JsonFormatter, Serilog"
        }
      }
    ],
    "Enrich": ["FromLogContext", "WithMachineName", "WithThreadId"]
  }
}
```

### OpenTelemetry Configuration (Program.cs)

```csharp
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using OpenTelemetry.Resources;

var builder = WebApplication.CreateBuilder(args);

// Configure OpenTelemetry
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource =>
    {
        resource.AddService("ContosoUniversity", serviceVersion: "1.0.0");
    })
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation(options =>
            {
                options.RecordException = true;
                options.EnrichWithHttpRequest = (activity, httpRequest) =>
                {
                    activity.SetTag("client.address", httpRequest.HttpContext.Connection.RemoteIpAddress);
                };
            })
            .AddEntityFrameworkCoreInstrumentation(options =>
            {
                options.SetDbStatementForText = true;
                options.EnrichWithIDbCommand = (activity, command) =>
                {
                    activity.SetTag("db.query", command.CommandText);
                };
            })
            .AddHttpClientInstrumentation()
            .AddOtlpExporter(options =>
            {
                options.Endpoint = new Uri(builder.Configuration["OpenTelemetry:OtlpEndpoint"]);
            });
    })
    .WithMetrics(metrics =>
    {
        metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddPrometheusExporter();
    });

var app = builder.Build();

// Map Prometheus scraping endpoint
app.MapPrometheusScrapingEndpoint();

app.Run();
```

### Prometheus Configuration (prometheus.yml)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'contoso-prod'
    environment: 'production'

scrape_configs:
  - job_name: 'contoso-university'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - production
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: contoso-university
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

rule_files:
  - /etc/prometheus/rules/*.yml
```

### Prometheus Alert Rules (alerts.yml)

```yaml
groups:
  - name: contoso-university-alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5..", job="contoso-university"}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
          team: application
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for job {{ $labels.job }}"
          runbook_url: "https://wiki.contoso.edu/runbooks/high-error-rate"

      - alert: HighLatencyP95
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="contoso-university"}[5m])) > 0.5
        for: 10m
        labels:
          severity: warning
          team: application
        annotations:
          summary: "High request latency (p95)"
          description: "95th percentile latency is {{ $value }}s for job {{ $labels.job }}"

      - alert: ApplicationDown
        expr: up{job="contoso-university"} == 0
        for: 1m
        labels:
          severity: critical
          team: sre
        annotations:
          summary: "Application is down"
          description: "Contoso University application is not responding"
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **APM** | Application Performance Monitoring - Tools for monitoring application behavior and performance |
| **Cardinality** | Number of unique values for a metric label; high cardinality can impact performance |
| **ELK Stack** | Elasticsearch, Logstash, Kibana - Popular log aggregation and analysis platform |
| **Error Budget** | Amount of downtime allowed before SLO is violated; e.g., 99.9% = 43.2 min/month |
| **Histogram** | Metric type that samples observations and counts them in configurable buckets |
| **OTLP** | OpenTelemetry Protocol - Standard protocol for transmitting telemetry data |
| **Quantile** | Statistical measure; p95 means 95% of requests are faster than this value |
| **RUM** | Real User Monitoring - Collecting performance data from actual end users |
| **SLI** | Service Level Indicator - Quantitative measure of service level (e.g., latency) |
| **SLO** | Service Level Objective - Target value for an SLI (e.g., latency < 500ms) |
| **Span** | Single operation within a trace; represents a unit of work |
| **Trace** | End-to-end journey of a request through all system components |
| **TSDB** | Time-Series Database - Optimized for storing timestamped data like metrics |

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-12-30  
**Next Review:** 2026-03-30 (Quarterly)  
**Owner:** DevOps Team  
**Stakeholders:** SRE, Application Engineering, Product Management
