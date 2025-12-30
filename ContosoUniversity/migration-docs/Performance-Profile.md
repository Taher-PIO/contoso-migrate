# Performance Profile - Contoso University

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Author:** Performance Engineering Team  

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [Current Performance Baseline](#current-performance-baseline)
- [Endpoint Performance Metrics](#endpoint-performance-metrics)
- [Database Query Performance](#database-query-performance)
- [Performance Hotspots](#performance-hotspots)
- [Profiling Tools and Methodology](#profiling-tools-and-methodology)
- [Load Testing Methodology](#load-testing-methodology)
- [Monitoring and APM Setup](#monitoring-and-apm-setup)
- [Performance Optimization Recommendations](#performance-optimization-recommendations)

---

## Executive Summary

This document provides a comprehensive performance profile for the Contoso University application, a monolithic ASP.NET Core 6.0 web application with server-rendered Razor Pages and a companion Node.js API service.

**Current Performance Status:**
- ❌ **No APM Integration** - No application performance monitoring configured
- ❌ **No Profiling Artifacts** - No flamegraphs, JFR files, or perf reports found
- ❌ **No Load Tests** - No k6, JMeter, Gatling, or Locust tests present
- ⚠️ **Baseline Metrics Unavailable** - Performance characteristics must be established

**Key Performance Concerns:**
1. **N+1 Query Problems** - Multiple entities loaded with lazy loading (Instructors page)
2. **No Caching Layer** - All requests hit the database directly
3. **No Query Optimization** - EF Core queries not optimized with AsNoTracking
4. **No Connection Pooling Tuning** - Default SQL Server connection pool settings
5. **No Performance Budget** - No SLAs or performance targets defined

**Deployment Context:**
- **Development:** Kestrel + SQL Server LocalDB (localhost)
- **Production:** Azure App Service + Azure SQL Database (inferred from CI/CD)
- **Architecture:** Monolithic web application with synchronous database operations

---

## Current Performance Baseline

### Application Components

| Component | Technology | Purpose | Performance Impact |
|-----------|-----------|---------|-------------------|
| **ContosoUniversity Web App** | ASP.NET Core 6.0 Razor Pages | Main UI application | Database I/O bound |
| **Contoso API** | Node.js + Express + mssql | API service (minimal endpoints) | Database I/O bound |
| **Database** | SQL Server LocalDB (dev) / Azure SQL (prod) | Data persistence | Primary bottleneck |

### Expected Performance Characteristics

**Based on Application Architecture Analysis:**

| Metric | Development (LocalDB) | Production (Azure SQL) | Notes |
|--------|----------------------|----------------------|-------|
| **Startup Time** | 2-5 seconds | 3-7 seconds | Includes EF Core migration check |
| **Average Response Time** | 50-200ms | 100-400ms | Network latency in production |
| **Database Round Trips** | 1-5 per request | 1-5 per request | N+1 problems on some pages |
| **Memory Footprint** | ~100-200 MB | ~150-300 MB | Per application instance |
| **Cold Start (Serverless)** | N/A | 5-15 seconds | If using Azure Functions |

### Resource Utilization (Estimated)

**CPU Usage:**
- Light load (< 10 concurrent users): 5-15%
- Medium load (50 concurrent users): 30-50%
- Heavy load (200+ concurrent users): 70-90%

**Memory Usage:**
- Base: ~150 MB
- Under load: ~300-500 MB
- GC pressure: Low (no large object allocations)

**Database Connections:**
- Default pool size: 100 connections
- Typical active connections: 5-20 under normal load

---

## Endpoint Performance Metrics

### ASP.NET Core Razor Pages

**Performance estimates based on code complexity analysis:**

| Endpoint | Method | Function | Est. p50 | Est. p95 | Est. p99 | Throughput | Error Rate | Database Queries |
|----------|--------|----------|----------|----------|----------|------------|------------|------------------|
| `/` | GET | Home page | 30ms | 80ms | 150ms | High | 0% | 0 (static) |
| `/Students` | GET | Student list with pagination | 100ms | 250ms | 500ms | Medium | <0.1% | 1-2 |
| `/Students/Details/{id}` | GET | Student details with enrollments | 80ms | 200ms | 400ms | High | <0.1% | 2-3 |
| `/Students/Create` | GET | Create form | 20ms | 50ms | 100ms | High | 0% | 0 |
| `/Students/Create` | POST | Insert student | 120ms | 300ms | 600ms | Medium | 1-2% | 1 + validation |
| `/Students/Edit/{id}` | GET | Edit form | 80ms | 200ms | 400ms | High | <0.1% | 1 |
| `/Students/Edit/{id}` | POST | Update student | 120ms | 300ms | 600ms | Medium | 1-2% | 2 + validation |
| `/Students/Delete/{id}` | GET | Delete confirmation | 80ms | 200ms | 400ms | Medium | <0.1% | 1 |
| `/Students/Delete/{id}` | POST | Delete student | 100ms | 250ms | 500ms | Medium | 1-2% | 1-2 |
| `/Instructors` | GET | **⚠️ HOTSPOT** - Instructor list with eager loading | 250ms | 800ms | 1500ms | Low | <0.1% | 10-20 (N+1) |
| `/Instructors/Details/{id}` | GET | Instructor details | 100ms | 250ms | 500ms | Medium | <0.1% | 3-5 |
| `/Courses` | GET | Course list with departments | 120ms | 300ms | 600ms | Medium | <0.1% | 2 |
| `/Courses/Details/{id}` | GET | Course details | 80ms | 200ms | 400ms | High | <0.1% | 2-3 |
| `/Departments` | GET | Department list | 80ms | 200ms | 400ms | High | <0.1% | 1-2 |
| `/Departments/Edit/{id}` | POST | **⚠️ HOTSPOT** - Update with concurrency check | 150ms | 400ms | 800ms | Medium | 2-5% | 3-4 + conflict resolution |
| `/About` | GET | **⚠️ HOTSPOT** - Student statistics (GROUP BY) | 180ms | 450ms | 900ms | Low | <0.1% | 1 complex query |

**Legends:**
- **Est. p50/p95/p99:** Estimated latency percentiles (milliseconds)
- **Throughput:** High (>100 req/s), Medium (20-100 req/s), Low (<20 req/s)
- **Error Rate:** Percentage of 4xx/5xx responses
- **Database Queries:** Number of database round trips per request

### Node.js API Endpoints

| Endpoint | Method | Function | Est. p50 | Est. p95 | Est. p99 | Throughput | Error Rate | Database Queries |
|----------|--------|----------|----------|----------|----------|------------|------------|------------------|
| `GET /` | GET | Root info endpoint | 10ms | 25ms | 50ms | Very High | 0% | 0 |
| `GET /api/health` | GET | Health check | 50ms | 150ms | 300ms | High | <0.1% | 1 (DB connection test) |

---

## Database Query Performance

### Query Complexity Analysis

**Based on EF Core usage patterns:**

| Query Pattern | Location | Complexity | Est. Execution Time | Optimization Status |
|---------------|----------|------------|---------------------|---------------------|
| **Simple SELECT with WHERE** | Students/Index search | Low | 10-30ms | ✅ Adequate |
| **SELECT with ORDER BY + OFFSET/FETCH** | Students/Index pagination | Low | 20-50ms | ⚠️ No covering index |
| **SELECT with JOIN (2-3 tables)** | Courses/Index | Medium | 30-80ms | ⚠️ No query hints |
| **Eager loading with Include/ThenInclude** | Instructors/Index | High | 100-500ms | ❌ N+1 problem |
| **GROUP BY aggregation** | About page stats | Medium | 50-150ms | ⚠️ No materialized view |
| **SELECT with explicit Load() calls** | Instructors/Index (courseID drill-down) | Very High | 200-1000ms | ❌ Multiple round trips |
| **UPDATE with concurrency token** | Departments/Edit | Medium | 40-100ms | ✅ Optimistic locking |

### Slow Query Candidates

**Queries requiring optimization:**

#### 1. Instructor Index with Drill-Down (⚠️ CRITICAL)
```csharp
// Location: Pages/Instructors/Index.cshtml.cs:25-52
InstructorData.Instructors = await _context.Instructors
    .Include(i => i.OfficeAssignment)
    .Include(i => i.Courses)
        .ThenInclude(c => c.Department)
    .OrderBy(i => i.LastName)
    .ToListAsync();

// THEN: Additional lazy loads
await _context.Entry(selectedCourse).Collection(x => x.Enrollments).LoadAsync();
foreach (Enrollment enrollment in selectedCourse.Enrollments)
{
    await _context.Entry(enrollment).Reference(x => x.Student).LoadAsync();
}
```

**Performance Impact:**
- **Database Round Trips:** 10-20+ queries per page load
- **Est. Total Time:** 250-1500ms (depending on data volume)
- **SQL Operations:** 
  1. Load all instructors + offices + courses + departments
  2. Load enrollments for selected course
  3. Load student for EACH enrollment (N+1 loop)

**Suspected Cause:** Lazy loading in loop causing cascading database calls

**Remediation:**
```csharp
// Optimize with single query using projection
InstructorData.Instructors = await _context.Instructors
    .Include(i => i.OfficeAssignment)
    .Include(i => i.Courses).ThenInclude(c => c.Department)
    .Include(i => i.Courses).ThenInclude(c => c.Enrollments).ThenInclude(e => e.Student)
    .AsNoTracking()  // Read-only query optimization
    .AsSplitQuery()  // Prevent cartesian explosion
    .OrderBy(i => i.LastName)
    .ToListAsync();
```

#### 2. About Page Student Statistics (⚠️ MEDIUM)
```csharp
// Location: Pages/About.cshtml.cs:21-30
IQueryable<EnrollmentDateGroup> data =
    from student in _context.Students
    group student by student.EnrollmentDate into dateGroup
    select new EnrollmentDateGroup()
    {
        EnrollmentDate = dateGroup.Key,
        StudentCount = dateGroup.Count()
    };
Students = await data.AsNoTracking().ToListAsync();
```

**Performance Impact:**
- **Est. Execution Time:** 50-150ms for thousands of students
- **SQL Operation:** GROUP BY with COUNT aggregate

**Suspected Cause:** No caching for frequently accessed aggregate data

**Remediation:**
```csharp
// Option 1: Add response caching
[ResponseCache(Duration = 300, VaryByQueryKeys = new[] { })]
public async Task OnGetAsync() { ... }

// Option 2: Materialize as indexed view in SQL Server
// Option 3: Cache in Redis/MemoryCache with TTL
```

#### 3. Student Index with Search and Sort (⚠️ LOW)
```csharp
// Location: Pages/Students/Index.cshtml.cs:43-63
IQueryable<Student> studentsIQ = from s in _context.Students select s;
if (!String.IsNullOrEmpty(searchString))
{
    studentsIQ = studentsIQ.Where(s => s.LastName.Contains(searchString)
                           || s.FirstMidName.Contains(searchString));
}
// ... sorting logic
Students = await PaginatedList<Student>.CreateAsync(
    studentsIQ.AsNoTracking(), pageIndex ?? 1, pageSize);
```

**Performance Impact:**
- **Est. Execution Time:** 30-100ms depending on result set size
- **SQL Operation:** SELECT with WHERE, ORDER BY, OFFSET/FETCH

**Suspected Cause:** 
- No full-text search index
- `LIKE '%searchString%'` pattern scan (non-sargable)

**Remediation:**
```sql
-- Add full-text catalog for faster searches
CREATE FULLTEXT CATALOG StudentCatalog AS DEFAULT;
CREATE FULLTEXT INDEX ON Student(LastName, FirstMidName) 
    KEY INDEX PK_Student;
```

---

## Performance Hotspots

### Critical Hotspots (Immediate Attention Required)

#### 1. Instructor Index Page - N+1 Query Problem
**Severity:** 🔴 CRITICAL  
**Location:** `Pages/Instructors/Index.cshtml.cs`  
**Impact:** 10-20x slower than necessary (250-1500ms vs. 50-150ms potential)

**Root Cause:**
- Eager loading of multiple related entities
- Additional lazy loading in foreach loop
- No query result caching

**Remediation Steps:**
1. Replace lazy loading loops with comprehensive Include chain
2. Add `.AsNoTracking()` for read-only operations
3. Use `.AsSplitQuery()` to prevent cartesian explosion
4. Implement response caching (5-minute TTL)
5. Consider GraphQL or projection to reduce over-fetching

**Priority:** P0 - Fix before production migration

---

#### 2. Department Edit - Concurrency Conflict Resolution
**Severity:** 🟡 MEDIUM  
**Location:** `Pages/Departments/Edit.cshtml.cs`  
**Impact:** 2-5% error rate under concurrent edits, poor user experience

**Root Cause:**
- Optimistic concurrency using `ConcurrencyToken`
- Conflict resolution requires manual user intervention
- No retry logic or conflict auto-resolution

**Remediation Steps:**
1. Implement last-write-wins for non-critical fields
2. Add field-level merge strategy for concurrent edits
3. Implement exponential backoff retry for transient conflicts
4. Add real-time notifications for concurrent edit detection (SignalR)

**Priority:** P1 - Improve before scale-up

---

#### 3. About Page - Unaggregated Statistics
**Severity:** 🟡 MEDIUM  
**Location:** `Pages/About.cshtml.cs`  
**Impact:** 50-150ms per request for rarely-changing data

**Root Cause:**
- Statistics calculated on every page load
- No caching of aggregate results
- GROUP BY query on potentially large dataset

**Remediation Steps:**
1. Implement `IMemoryCache` with 5-minute sliding expiration
2. Create indexed view in SQL Server for pre-aggregated stats
3. Consider background job to refresh statistics hourly
4. Add response caching header

**Priority:** P2 - Optimize for scale

---

### Secondary Hotspots (Monitor and Optimize)

#### 4. Student Search - Non-Sargable LIKE Queries
**Severity:** 🟢 LOW  
**Location:** `Pages/Students/Index.cshtml.cs`  
**Impact:** 30-100ms, degrades linearly with table growth

**Remediation:**
- Implement full-text search catalog
- Add covering indexes for common query patterns
- Consider Elasticsearch for advanced search

---

#### 5. No Connection Pooling Tuning
**Severity:** 🟡 MEDIUM  
**Impact:** Connection exhaustion under high load

**Remediation:**
```json
// appsettings.json
"ConnectionStrings": {
  "SchoolContext": "Server=...;Max Pool Size=200;Min Pool Size=10;Connection Lifetime=300;"
}
```

---

#### 6. No Output Caching for Static Content
**Severity:** 🟢 LOW  
**Impact:** Unnecessary server processing for unchanging pages

**Remediation:**
```csharp
// Program.cs
builder.Services.AddOutputCache(options =>
{
    options.AddBasePolicy(builder => builder.Cache());
    options.AddPolicy("Expire5Minutes", builder => 
        builder.Expire(TimeSpan.FromMinutes(5)));
});
```

---

## Profiling Tools and Methodology

### Recommended Profiling Tools

#### 1. .NET Performance Profiling

**Application-Level Profiling:**

| Tool | Purpose | Usage | Output |
|------|---------|-------|--------|
| **dotnet-trace** | Collect performance traces | `dotnet-trace collect --process-id <PID>` | `.nettrace` file (view in PerfView/VS) |
| **dotnet-counters** | Real-time performance counters | `dotnet-counters monitor --process-id <PID>` | Live metrics (CPU, GC, exceptions) |
| **dotnet-dump** | Memory dump analysis | `dotnet-dump collect --process-id <PID>` | `.dump` file for memory leak analysis |
| **PerfView** | Flamegraph and CPU sampling | Download from GitHub, open `.nettrace` | CPU flamegraphs, GC analysis |
| **Visual Studio Profiler** | IDE-integrated profiling | Debug → Performance Profiler | CPU, memory, database profiling |

**Example Commands:**
```bash
# Install tools
dotnet tool install --global dotnet-trace
dotnet tool install --global dotnet-counters
dotnet tool install --global dotnet-dump

# Collect 60-second CPU trace
dotnet-trace collect --process-id <PID> --duration 00:01:00 --format speedscope

# Monitor live performance counters
dotnet-counters monitor --process-id <PID> System.Runtime Microsoft.AspNetCore.Hosting

# Capture memory snapshot
dotnet-dump collect --process-id <PID> --type Full
```

---

#### 2. Database Profiling

**SQL Server Profiling:**

| Tool | Purpose | Usage | Output |
|------|---------|-------|--------|
| **SQL Server Profiler** | Trace all database queries | SSMS → Tools → SQL Server Profiler | Query log with execution times |
| **Extended Events** | Low-overhead query tracing | `CREATE EVENT SESSION...` | `.xel` file for analysis |
| **Query Store** | Automatic query performance tracking | Enable in Azure SQL Database | Query stats over time |
| **EF Core Logging** | Log generated SQL queries | `LogTo(Console.WriteLine)` in DbContext | Console output of SQL |

**Enable EF Core Query Logging:**
```csharp
// Program.cs or Startup.cs
builder.Services.AddDbContext<SchoolContext>(options =>
{
    options.UseSqlServer(connectionString)
           .EnableSensitiveDataLogging()  // Development only
           .LogTo(Console.WriteLine, LogLevel.Information);
});
```

**Example Extended Events Session:**
```sql
-- Create session to capture slow queries
CREATE EVENT SESSION [SlowQueries] ON SERVER 
ADD EVENT sqlserver.sql_statement_completed(
    ACTION(sqlserver.client_app_name, sqlserver.database_name)
    WHERE duration > 100000  -- 100ms in microseconds
)
ADD TARGET package0.event_file(SET filename=N'SlowQueries.xel')
WITH (MAX_MEMORY=4096 KB, MAX_DISPATCH_LATENCY=5 SECONDS);

-- Start session
ALTER EVENT SESSION [SlowQueries] ON SERVER STATE = START;
```

---

#### 3. Load Testing Tools

**Recommended Tools:**

| Tool | Best For | License | Learning Curve |
|------|----------|---------|----------------|
| **k6** | Developer-friendly, JavaScript-based | AGPL/Commercial | Low |
| **JMeter** | GUI-based, comprehensive | Apache 2.0 | Medium |
| **Gatling** | Scala-based, high performance | Apache 2.0 | Medium |
| **Locust** | Python-based, distributed | MIT | Low |
| **NBomber** | .NET-native, strong typing | Apache 2.0 | Low (for .NET devs) |
| **Azure Load Testing** | Managed service, JMeter-based | Commercial | Low |

**Recommended Choice for Contoso University:**
- **Primary:** k6 (open source, CI/CD friendly)
- **Secondary:** Azure Load Testing (production-grade at scale)

---

## Load Testing Methodology

### Load Test Strategy

#### Phase 1: Baseline Performance Test

**Objective:** Establish single-user performance baseline

**Tool:** k6  
**Duration:** 5 minutes  
**Virtual Users (VUs):** 1  
**Scenarios:**
1. Home page load
2. Student list with pagination
3. Student search
4. Student details view
5. Instructor list (hotspot)
6. About page (statistics)

**Success Criteria:**
- All requests return 200 OK
- p95 latency < 500ms for all pages
- No database connection errors

---

#### Phase 2: Load Test (Normal Traffic)

**Objective:** Validate performance under typical production load

**Tool:** k6  
**Duration:** 15 minutes  
**Virtual Users (VUs):** 50 concurrent users  
**Ramp-up:** 5 minutes to reach 50 VUs  
**Think Time:** 5-10 seconds between requests  

**Traffic Mix:**
- 40% Student pages (Index, Details)
- 30% Course pages
- 15% Instructor pages
- 10% Department pages
- 5% About/Statistics

**Success Criteria:**
- p95 latency < 1 second for all pages
- Error rate < 1%
- CPU utilization < 70%
- Database connections < 50

---

#### Phase 3: Stress Test (Peak Load)

**Objective:** Find breaking point and system limits

**Tool:** k6  
**Duration:** 20 minutes  
**Virtual Users (VUs):** Start at 50, increase to 500  
**Ramp-up:** Incremental (50 VUs every 2 minutes)  

**Metrics to Monitor:**
- Response time degradation curve
- Error rate inflection point
- Database connection pool saturation
- Memory and CPU exhaustion thresholds

**Success Criteria:**
- System remains stable up to 200 concurrent users
- Graceful degradation (no crashes)
- Clear indicators of resource exhaustion

---

#### Phase 4: Soak Test (Endurance)

**Objective:** Detect memory leaks and resource exhaustion

**Tool:** k6  
**Duration:** 4-8 hours  
**Virtual Users (VUs):** 25-50 steady state  

**Metrics to Monitor:**
- Memory growth over time
- GC frequency and duration
- Database connection leaks
- Response time regression

**Success Criteria:**
- No memory leaks (stable memory footprint)
- No response time degradation over time
- No connection pool exhaustion

---

### Sample k6 Load Test Script

```javascript
// contoso-university-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp-up to 10 VUs
    { duration: '5m', target: 50 },   // Ramp-up to 50 VUs
    { duration: '10m', target: 50 },  // Stay at 50 VUs
    { duration: '2m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests < 1s
    http_req_failed: ['rate<0.01'],     // Error rate < 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // Scenario: Browse student list
  let res = http.get(`${BASE_URL}/Students`);
  check(res, {
    'Student list status 200': (r) => r.status === 200,
    'Student list loads quickly': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
  sleep(Math.random() * 5 + 5); // Think time: 5-10s

  // Scenario: Search for student
  res = http.get(`${BASE_URL}/Students?searchString=Alexander`);
  check(res, {
    'Search status 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  sleep(Math.random() * 3 + 2);

  // Scenario: View student details
  res = http.get(`${BASE_URL}/Students/Details/1`);
  check(res, {
    'Details status 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  sleep(Math.random() * 5 + 5);

  // Scenario: View instructors (HOTSPOT)
  res = http.get(`${BASE_URL}/Instructors`);
  check(res, {
    'Instructors status 200': (r) => r.status === 200,
    'Instructors load under 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);
  sleep(Math.random() * 5 + 5);

  // Scenario: View statistics
  res = http.get(`${BASE_URL}/About`);
  check(res, {
    'About status 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  sleep(Math.random() * 10 + 10);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

**Run Command:**
```bash
# Install k6: https://k6.io/docs/getting-started/installation/

# Run basic load test
k6 run contoso-university-load-test.js

# Run with custom base URL and output
BASE_URL=https://contoso-uni.azurewebsites.net k6 run --out json=results.json contoso-university-load-test.js

# Run with InfluxDB for visualization
k6 run --out influxdb=http://localhost:8086/k6 contoso-university-load-test.js
```

---

### Load Test Data Sets

**Test Data Requirements:**

| Entity | Minimum Records | Recommended Records | Purpose |
|--------|----------------|---------------------|---------|
| **Students** | 100 | 10,000 | Test pagination, search performance |
| **Instructors** | 10 | 500 | Test N+1 query impact at scale |
| **Courses** | 20 | 1,000 | Test many-to-many joins |
| **Departments** | 5 | 50 | Test concurrency conflicts |
| **Enrollments** | 500 | 100,000 | Test aggregate queries, statistics |

**Data Generation Script:**
```bash
# Use EF Core seed data or custom script
dotnet run --seed-data --student-count 10000 --enrollment-count 100000
```

---

## Monitoring and APM Setup

### Recommended APM Solutions

| APM Tool | Best For | Cost | Integration Effort |
|----------|----------|------|-------------------|
| **Application Insights** | Azure-hosted apps | Pay-as-you-go | Low (native .NET support) |
| **New Relic** | Multi-cloud, comprehensive | Starts at $99/mo | Low (agent-based) |
| **Datadog** | Infrastructure + APM | Starts at $15/host/mo | Medium (agent + SDK) |
| **Elastic APM** | Open source, self-hosted | Free (OSS) | Medium (requires Elasticsearch) |
| **Prometheus + Grafana** | Metrics and dashboards | Free (OSS) | High (custom instrumentation) |

**Recommended for Contoso University:**
- **Azure Application Insights** (already deploying to Azure App Service)

---

### Application Insights Integration

**Installation:**
```bash
# Add NuGet package
dotnet add package Microsoft.ApplicationInsights.AspNetCore
```

**Configuration:**
```csharp
// Program.cs
builder.Services.AddApplicationInsightsTelemetry(
    builder.Configuration["ApplicationInsights:ConnectionString"]);
```

```json
// appsettings.json
{
  "ApplicationInsights": {
    "ConnectionString": "InstrumentationKey=...;IngestionEndpoint=https://..."
  },
  "Logging": {
    "ApplicationInsights": {
      "LogLevel": {
        "Default": "Information",
        "Microsoft": "Warning"
      }
    }
  }
}
```

**Key Metrics to Track:**

1. **Request Telemetry:**
   - Request rate (requests/sec)
   - Response time (p50, p95, p99)
   - Failed request rate

2. **Dependency Telemetry:**
   - SQL query duration
   - Dependency call failures
   - External API latency

3. **Exception Telemetry:**
   - Exception count by type
   - Failure rate
   - Stack traces

4. **Custom Metrics:**
   - Database connection pool utilization
   - Cache hit/miss ratio (when implemented)
   - Concurrent user count

**Dashboard Queries (KQL):**
```kql
// Top 10 slowest requests
requests
| where timestamp > ago(1h)
| summarize avg(duration), percentile(duration, 95) by name
| order by percentile_duration_95 desc
| take 10

// Failed request rate by endpoint
requests
| where timestamp > ago(1h)
| summarize totalCount = count(), failedCount = countif(success == false) by name
| extend failureRate = (failedCount * 100.0) / totalCount
| order by failureRate desc

// Database query performance
dependencies
| where type == "SQL"
| where timestamp > ago(1h)
| summarize avg(duration), percentile(duration, 95), count() by name
| order by percentile_duration_95 desc
| take 20
```

---

## Performance Optimization Recommendations

### Immediate Actions (Pre-Migration)

#### 1. Fix N+1 Query on Instructor Page (⚠️ P0)
```csharp
// Replace lazy loading loop with comprehensive eager loading
InstructorData.Instructors = await _context.Instructors
    .Include(i => i.OfficeAssignment)
    .Include(i => i.Courses).ThenInclude(c => c.Department)
    .Include(i => i.Courses).ThenInclude(c => c.Enrollments).ThenInclude(e => e.Student)
    .AsNoTracking()
    .AsSplitQuery()
    .OrderBy(i => i.LastName)
    .ToListAsync();
```

**Expected Impact:** 5-10x faster (250ms → 50ms)

---

#### 2. Add Response Caching for About Page (⚠️ P1)
```csharp
// Pages/About.cshtml.cs
[ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
public async Task OnGetAsync()
{
    // Cache for 5 minutes
}
```

**Expected Impact:** 50ms → 5ms (cache hit)

---

#### 3. Enable Output Caching (⚠️ P1)
```csharp
// Program.cs
builder.Services.AddOutputCache(options =>
{
    options.AddBasePolicy(builder => builder.Cache());
    options.AddPolicy("Expire5", builder => builder.Expire(TimeSpan.FromMinutes(5)));
});

app.UseOutputCache();
```

**Expected Impact:** 20-40% reduction in CPU usage

---

### Short-Term Optimizations (Post-Migration)

#### 4. Implement Distributed Caching with Redis
```csharp
// Install: Microsoft.Extensions.Caching.StackExchangeRedis
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "ContosoUni:";
});
```

**Use Cases:**
- Cache student search results
- Cache enrollment statistics
- Store session state for multi-instance deployment

---

#### 5. Add Database Indexes
```sql
-- Covering index for student search
CREATE NONCLUSTERED INDEX IX_Student_Search 
ON Student (LastName, FirstMidName) 
INCLUDE (EnrollmentDate);

-- Covering index for pagination with sorting
CREATE NONCLUSTERED INDEX IX_Student_LastName_Paging
ON Student (LastName, ID)
INCLUDE (FirstMidName, EnrollmentDate);

-- Index for course lookup by department
CREATE NONCLUSTERED INDEX IX_Course_Department
ON Course (DepartmentID)
INCLUDE (Title, Credits);
```

**Expected Impact:** 30-50% faster search and pagination

---

#### 6. Implement Connection Pooling Tuning
```json
// appsettings.json
{
  "ConnectionStrings": {
    "SchoolContext": "Server=...;Database=...;Max Pool Size=200;Min Pool Size=20;Connection Lifetime=300;"
  }
}
```

**Expected Impact:** Reduce connection creation overhead under high load

---

### Long-Term Optimizations (Architectural)

#### 7. Implement CQRS Pattern for Read-Heavy Operations
- Separate read models from write models
- Use denormalized views for statistics (About page)
- Implement event sourcing for audit trails

---

#### 8. Add CDN for Static Assets
- Azure CDN or Cloudflare
- Cache JS, CSS, images at edge locations
- Reduce server load for static content

---

#### 9. Implement GraphQL API Layer
- Allow clients to request exactly what they need
- Reduce over-fetching (Instructor page scenario)
- Enable efficient batching and caching

---

## Performance Budget and SLAs

### Proposed Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Page Load Time (p95)** | < 1 second | Browser navigation timing |
| **API Response Time (p95)** | < 500ms | Server-side telemetry |
| **Database Query Time (p95)** | < 200ms | EF Core logging / App Insights |
| **Throughput** | > 100 requests/sec | Load testing |
| **Error Rate** | < 0.1% | Application Insights |
| **Availability** | > 99.5% | Azure uptime SLA |

---

## Appendix: Profiling Artifact Locations

**Current Status:**
- ❌ No flamegraphs found
- ❌ No JFR (Java Flight Recorder) files (not applicable to .NET)
- ❌ No perf reports found
- ❌ No load test results found

**Recommended Artifact Storage:**
```
/ContosoUniversity/
├── performance-artifacts/
│   ├── profiles/
│   │   ├── baseline-2025-01-01.nettrace
│   │   ├── cpu-profile-2025-01-01.speedscope.json
│   │   └── memory-snapshot-2025-01-01.dump
│   ├── load-tests/
│   │   ├── k6-baseline-results.json
│   │   ├── k6-stress-test-results.json
│   │   └── azure-load-test-report.pdf
│   └── apm-reports/
│       ├── app-insights-dashboard.png
│       ├── slow-queries-report.xlsx
│       └── performance-baseline.xlsx
```

---

## Next Steps

1. **Immediate (This Week):**
   - [ ] Fix Instructor Index N+1 query problem
   - [ ] Add response caching for About page
   - [ ] Enable EF Core query logging in development

2. **Short-Term (Next Sprint):**
   - [ ] Integrate Application Insights
   - [ ] Write and execute k6 baseline load test
   - [ ] Add database indexes for search and pagination

3. **Medium-Term (Next Quarter):**
   - [ ] Implement Redis distributed caching
   - [ ] Conduct full performance audit under production load
   - [ ] Establish performance regression testing in CI/CD

4. **Long-Term (6+ Months):**
   - [ ] Evaluate CQRS pattern for read-heavy operations
   - [ ] Consider GraphQL API layer
   - [ ] Implement CDN for static assets

---

**Document Status:** ✅ Complete - Ready for Review  
**Next Review Date:** 2025-03-30  
**Owner:** Performance Engineering Team
