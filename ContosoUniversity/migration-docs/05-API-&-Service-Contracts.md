# API & Service Contracts - Contoso University

**Document Version:** 1.0  
**Date:** 2025-12-23  
**Author:** Migration Engineering Team  

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [Inbound Endpoints](#inbound-endpoints)
  - [ASP.NET Core Razor Pages (Web UI)](#aspnet-core-razor-pages-web-ui)
  - [Node.js Express API](#nodejs-express-api)
- [Outbound Dependencies](#outbound-dependencies)
- [Authentication & Authorization](#authentication--authorization)
- [Versioning Strategy](#versioning-strategy)
- [Error Contracts](#error-contracts)
- [Pagination Conventions](#pagination-conventions)
- [SLA & Performance Targets](#sla--performance-targets)
- [Migration Recommendations](#migration-recommendations)

---

## Executive Summary

Contoso University consists of two applications:
1. **ASP.NET Core 6.0 Razor Pages Application** - Server-rendered web UI serving HTML pages
2. **Node.js Express API** - RESTful API providing health check endpoint (minimal implementation)

Both applications share the same SQL Server LocalDB database (`SchoolContext`) and follow conventional HTTP patterns. There are **no GraphQL or gRPC endpoints** in the current implementation.

**Key Characteristics:**
- **Protocol:** HTTP/HTTPS
- **Authentication:** None (unauthenticated access)
- **API Style:** RESTful conventions (Razor Pages use standard HTTP GET/POST)
- **Serialization:** HTML (Razor Pages), JSON (Express API)
- **Pagination:** Custom implementation with query string parameters
- **Error Handling:** HTTP status codes with ModelState validation

---

## Inbound Endpoints

### ASP.NET Core Razor Pages (Web UI)

Razor Pages follow convention-based routing: `/Pages/{Area}/{Action}` maps to URL pattern `/{Area}/{Action}`.

#### Students Management

| Method | Path | Auth | Version | SLA | Query Parameters | Notes |
|--------|------|------|---------|-----|-----------------|-------|
| **GET** | `/Students` | None | N/A | <500ms | `sortOrder`, `currentFilter`, `searchString`, `pageIndex` | List students with search, sort, and pagination |
| **GET** | `/Students/Details?id={id}` | None | N/A | <300ms | `id` (required) | View student details with enrollments |
| **GET** | `/Students/Create` | None | N/A | <200ms | None | Display student creation form |
| **POST** | `/Students/Create` | None | N/A | <1000ms | Form data | Create new student record |
| **GET** | `/Students/Edit?id={id}` | None | N/A | <300ms | `id` (required) | Display student edit form |
| **POST** | `/Students/Edit?id={id}` | None | N/A | <1000ms | `id`, Form data | Update student record |
| **GET** | `/Students/Delete?id={id}` | None | N/A | <300ms | `id` (required) | Display delete confirmation |
| **POST** | `/Students/Delete?id={id}` | None | N/A | <1000ms | `id` (required) | Delete student record |

**Sorting Options:** `name_desc`, `Date`, `date_desc` (default: last name ascending)  
**Search Fields:** `LastName`, `FirstMidName` (partial match)  
**Pagination:** Page size configurable via `appsettings.json` (default: 3)

#### Courses Management

| Method | Path | Auth | Version | SLA | Query Parameters | Notes |
|--------|------|------|---------|-----|-----------------|-------|
| **GET** | `/Courses` | None | N/A | <500ms | None | List all courses with department information |
| **GET** | `/Courses/Details?id={id}` | None | N/A | <300ms | `id` (required) | View course details including enrollments |
| **GET** | `/Courses/Create` | None | N/A | <200ms | None | Display course creation form with departments |
| **POST** | `/Courses/Create` | None | N/A | <1000ms | Form data | Create new course |
| **GET** | `/Courses/Edit?id={id}` | None | N/A | <300ms | `id` (required) | Display course edit form |
| **POST** | `/Courses/Edit?id={id}` | None | N/A | <1000ms | `id`, Form data | Update course record |
| **GET** | `/Courses/Delete?id={id}` | None | N/A | <300ms | `id` (required) | Display delete confirmation |
| **POST** | `/Courses/Delete?id={id}` | None | N/A | <1000ms | `id` (required) | Delete course record |

**Related Data:** Course details include department name via joined query  
**Business Logic:** Courses are associated with departments (foreign key relationship)

#### Instructors Management

| Method | Path | Auth | Version | SLA | Query Parameters | Notes |
|--------|------|------|---------|-----|-----------------|-------|
| **GET** | `/Instructors` | None | N/A | <500ms | `id`, `courseID` | List instructors with office assignments and courses |
| **GET** | `/Instructors/Details?id={id}` | None | N/A | <300ms | `id` (required) | View instructor details |
| **GET** | `/Instructors/Create` | None | N/A | <200ms | None | Display instructor creation form |
| **POST** | `/Instructors/Create` | None | N/A | <1000ms | Form data | Create new instructor with optional office assignment |
| **GET** | `/Instructors/Edit?id={id}` | None | N/A | <300ms | `id` (required) | Display instructor edit form with course assignments |
| **POST** | `/Instructors/Edit?id={id}` | None | N/A | <1000ms | `id`, Form data | Update instructor and course assignments |
| **GET** | `/Instructors/Delete?id={id}` | None | N/A | <300ms | `id` (required) | Display delete confirmation |
| **POST** | `/Instructors/Delete?id={id}` | None | N/A | <1000ms | `id` (required) | Delete instructor record |

**Complex Relationships:**
- Instructors have 1:1 relationship with `OfficeAssignment`
- Instructors have M:N relationship with `Courses` via `CourseInstructor` join table
- Index page includes nested queries for courses taught by selected instructor

#### Departments Management

| Method | Path | Auth | Version | SLA | Query Parameters | Notes |
|--------|------|------|---------|-----|-----------------|-------|
| **GET** | `/Departments` | None | N/A | <500ms | None | List all departments with administrator names |
| **GET** | `/Departments/Details?id={id}` | None | N/A | <300ms | `id` (required) | View department details |
| **GET** | `/Departments/Create` | None | N/A | <200ms | None | Display department creation form |
| **POST** | `/Departments/Create` | None | N/A | <1000ms | Form data | Create new department |
| **GET** | `/Departments/Edit?id={id}` | None | N/A | <300ms | `id` (required) | Display department edit form |
| **POST** | `/Departments/Edit?id={id}` | None | N/A | <1000ms | `id`, Form data | Update department with optimistic concurrency check |
| **GET** | `/Departments/Delete?id={id}` | None | N/A | <300ms | `id` (required) | Display delete confirmation |
| **POST** | `/Departments/Delete?id={id}` | None | N/A | <1000ms | `id` (required) | Delete department record |

**Concurrency Control:**
- Department entity includes `ConcurrencyToken` (row version)
- Edit operations check for concurrent modifications
- `DbUpdateConcurrencyException` handling provides user feedback

#### Supporting Endpoints

| Method | Path | Auth | Version | SLA | Query Parameters | Notes |
|--------|------|------|---------|-----|-----------------|-------|
| **GET** | `/` | None | N/A | <200ms | None | Home page (landing) |
| **GET** | `/About` | None | N/A | <500ms | None | Student statistics grouped by enrollment date |
| **GET** | `/Privacy` | None | N/A | <100ms | None | Privacy policy page (static) |
| **GET** | `/Error` | None | N/A | <100ms | None | Generic error page (production only) |

---

### Node.js Express API

| Method | Path | Auth | Version | SLA | Request Body | Response | Notes |
|--------|------|------|---------|-----|--------------|----------|-------|
| **GET** | `/` | None | 1.0.0 | <100ms | None | JSON | API information and available endpoints |
| **GET** | `/api/health` | None | 1.0.0 | <1000ms | None | JSON | Health check with database connectivity test |

#### `/` Root Endpoint

**Response Schema:**
```json
{
  "message": "Contoso University API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health"
  }
}
```

#### `/api/health` Health Check Endpoint

**Success Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-23T06:27:53.431Z",
  "database": {
    "connected": true,
    "name": "SchoolContext-a8778b0f-1bfd-4d0f-a500-09390a0df97f",
    "serverTime": "2025-12-23T06:27:53.500Z"
  }
}
```

**Failure Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-12-23T06:27:53.431Z",
  "database": {
    "connected": false
  },
  "error": "Connection timeout"
}
```

**Database Check:**
- Executes `SELECT DB_NAME() AS database, GETDATE() AS serverTime, 1 AS status`
- Tests connection pool and query execution
- Returns 503 if database is unreachable

---

## Outbound Dependencies

### SQL Server Database

| Target | Protocol | Host | Auth | Retries | Backoff | CircuitBreaker | ConnectionPool | Notes |
|--------|----------|------|------|---------|---------|----------------|----------------|-------|
| **SQL Server LocalDB** | TDS (TCP/IP) | `(localdb)\mssqllocaldb` | Windows Auth (Trusted Connection) | EF Core Default | Exponential (via EF) | None | Yes (ASP.NET) | Development database only |
| **SQL Server LocalDB** | TDS (TCP/IP) | `(localdb)\mssqllocaldb` | Windows Auth (Trusted Connection) | None (manual retry required) | None | None | Yes (10 max, 0 min) | Node.js API connection via `mssql` package |

**ASP.NET Core Connection String:**
```
Server=(localdb)\mssqllocaldb;
Database=SchoolContext-a8778b0f-1bfd-4d0f-a500-09390a0df97f;
Trusted_Connection=True;
MultipleActiveResultSets=true
```

**Node.js Connection Configuration:**
```typescript
{
  server: '(localdb)\\mssqllocaldb',
  database: 'SchoolContext-a8778b0f-1bfd-4d0f-a500-09390a0df97f',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
}
```

**Connection Resilience:**
- **ASP.NET Core:** Entity Framework Core provides built-in retry logic for transient failures (implementation varies by provider)
- **Node.js:** No automatic retry; application-level error handling required
- **Connection Pooling:** Both applications use connection pooling to reduce connection overhead
- **Timeout Configuration:** 30-second connection and request timeouts
- **Circuit Breaker:** Not implemented (recommendation: add for production)

**Database Schema Migrations:**
- Managed via EF Core Migrations (`20220226005057_InitialCreate`, `20220226012101_RowVersion`)
- Automatic migration on application startup: `context.Database.Migrate()`
- Seed data initialization via `DbInitializer.Initialize(context)`

### No External API Dependencies

**Current State:**
- ✅ No third-party REST APIs
- ✅ No GraphQL clients
- ✅ No message queue subscriptions (Azure Service Bus, RabbitMQ, Kafka)
- ✅ No external authentication providers (OAuth, OIDC)
- ✅ No blob storage or CDN dependencies
- ✅ No caching layers (Redis, Memcached)

**Future Considerations:**
- Authentication provider integration (Azure AD, Auth0)
- Email service for notifications (SendGrid, Azure Communication Services)
- File storage for documents (Azure Blob Storage, AWS S3)
- Application monitoring (Application Insights, Datadog)

---

## Authentication & Authorization

**Current Implementation: None**

- ❌ No authentication middleware configured
- ❌ No authorization policies
- ❌ No user identity management
- ❌ No role-based access control (RBAC)
- ❌ No claims-based authorization
- ❌ All endpoints are publicly accessible

**Security Risk:**
- **Critical:** All data is accessible without authentication
- **High:** No audit trail for user actions (creates, updates, deletes)
- **Medium:** No rate limiting or throttling

**Recommendation:**
Implement ASP.NET Core Identity or integrate with external identity provider:

```csharp
// Future authentication configuration
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options => {
        options.LoginPath = "/Account/Login";
    });

builder.Services.AddAuthorization(options => {
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Administrator"));
    options.AddPolicy("InstructorOrAdmin", policy => 
        policy.RequireRole("Instructor", "Administrator"));
});
```

**Node.js API Authentication:**
Consider JWT bearer token authentication:
```typescript
// Future implementation
app.use('/api', authenticateJWT);
```

---

## Versioning Strategy

**Current Implementation: None**

### ASP.NET Core Razor Pages
- **Versioning:** Not implemented (implicit v1)
- **URL Structure:** No version prefix in URLs
- **Breaking Changes:** Would require URL changes (not versioned)
- **Backward Compatibility:** Not guaranteed

**Recommendation:**
For future API endpoints (if REST API is added):
- Use URL versioning: `/api/v1/students`, `/api/v2/students`
- Or header-based versioning: `Accept: application/vnd.contoso.v1+json`
- Implement Microsoft.AspNetCore.Mvc.Versioning package

### Node.js Express API
- **Versioning:** Hardcoded version string (`1.0.0`) in root response
- **URL Structure:** `/api/*` prefix but no version number
- **Breaking Changes:** Would require new major version

**Recommendation:**
```typescript
// Version 1
app.use('/api/v1', v1Routes);

// Version 2 (future)
app.use('/api/v2', v2Routes);
```

---

## Error Contracts

### ASP.NET Core Razor Pages

#### Validation Errors (400 Bad Request)

**Client-Side Validation:**
- jQuery Validation (enabled for form fields)
- Real-time validation feedback on form inputs

**Server-Side Validation:**
```csharp
if (!ModelState.IsValid)
{
    // Re-display form with validation errors
    return Page();
}
```

**Validation Messages:**
- Displayed inline next to form fields
- Uses Data Annotations on entity models:
  - `[Required]`
  - `[StringLength(50)]`
  - `[DataType(DataType.Date)]`
  - `[Display(Name = "Last Name")]`

#### Not Found Errors (404)

```csharp
if (student == null)
{
    return NotFound();
}
```

**User Experience:**
- Returns HTTP 404 response
- Browser displays "Not Found" message
- No custom 404 page implemented

#### Concurrency Conflicts (Department Edit)

```csharp
catch (DbUpdateConcurrencyException ex)
{
    var exceptionEntry = ex.Entries.Single();
    var databaseEntry = exceptionEntry.GetDatabaseValues();
    
    if (databaseEntry == null)
    {
        ModelState.AddModelError(string.Empty, 
            "Unable to save. The department was deleted by another user.");
    }
    else
    {
        var dbValues = (Department)databaseEntry.ToObject();
        ModelState.AddModelError("Department.Name", 
            $"Current value: {dbValues.Name}");
        // ... field-by-field comparison
    }
}
```

**User Experience:**
- Displays current database values vs. user's submitted values
- User can review and choose to overwrite or cancel
- Preserves user's input for re-submission

#### Server Errors (500 Internal Server Error)

**Development Environment:**
- Full exception details displayed via Developer Exception Page
- Stack trace, request details, and environment variables
- EF Core migration error page for database issues

**Production Environment:**
```csharp
app.UseExceptionHandler("/Error");
```

**Error Page Model:**
```csharp
public class ErrorModel : PageModel
{
    public string RequestId { get; set; }
    public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);

    public void OnGet()
    {
        RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier;
    }
}
```

**User Experience:**
- Generic error page with Request ID for support tracking
- No sensitive information exposed

### Node.js Express API

#### Not Found (404)

```json
{
  "error": "Not Found",
  "path": "/api/invalid-endpoint",
  "message": "The requested resource was not found"
}
```

#### Server Error (500)

**Development:**
```json
{
  "error": "Internal Server Error",
  "message": "Database connection failed",
  "stack": "Error: connect ECONNREFUSED...\n    at..."
}
```

**Production:**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Error Handling:**
```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('❌ Error occurred:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' 
            ? err.message 
            : 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
```

---

## Pagination Conventions

### ASP.NET Core Custom Pagination

**Implementation:** `PaginatedList<T>` class

**Query Parameters:**
- `pageIndex` - Current page number (1-based)
- `pageSize` - Items per page (configurable via `appsettings.json`, default: 3)

**Response Metadata (included in page model):**
```csharp
public class PaginatedList<T> : List<T>
{
    public int PageIndex { get; private set; }
    public int TotalPages { get; private set; }
    public bool HasPreviousPage => PageIndex > 1;
    public bool HasNextPage => PageIndex < TotalPages;
}
```

**Calculation:**
```csharp
var count = await source.CountAsync();
var items = await source
    .Skip((pageIndex - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();
TotalPages = (int)Math.Ceiling(count / (double)pageSize);
```

**UI Navigation:**
- Previous/Next buttons rendered based on `HasPreviousPage`/`HasNextPage`
- Preserves sort order and search filters across page navigation

**Example URL:**
```
/Students?pageIndex=2&sortOrder=name_desc&searchString=Smith
```

### Node.js API Pagination

**Current State:** Not implemented (health endpoint returns single object)

**Recommendation for Future Endpoints:**

**Query Parameters:**
```
?page=1&limit=20&offset=0
```

**Response Format (HAL/JSON:API style):**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  },
  "links": {
    "self": "/api/v1/students?page=1&limit=20",
    "next": "/api/v1/students?page=2&limit=20",
    "first": "/api/v1/students?page=1&limit=20",
    "last": "/api/v1/students?page=8&limit=20"
  }
}
```

---

## SLA & Performance Targets

### Current Performance Characteristics

**No formal SLAs defined.** Estimated targets based on typical web application expectations:

| Endpoint Type | Target Response Time (p95) | Target Availability | Current Implementation |
|--------------|---------------------------|---------------------|----------------------|
| **Static Pages** (Home, Privacy) | <200ms | 99.9% | No caching, server-rendered |
| **List Pages** (Index) | <500ms | 99.9% | Database query + pagination |
| **Detail Pages** | <300ms | 99.9% | Single entity query with joins |
| **Create/Edit Forms (GET)** | <300ms | 99.9% | Lookup queries for dropdowns |
| **Create/Edit/Delete (POST)** | <1000ms | 99.9% | Database writes with validation |
| **Health Check** | <1000ms | 99.0% | Database connectivity test |

### Performance Bottlenecks

**Identified Issues:**
1. **No caching strategy** - Every request hits database
2. **N+1 query potential** - Some pages may generate multiple queries per entity
3. **Synchronous seed data** - Blocks application startup
4. **LocalDB limitations** - Not suitable for production load

**Optimization Opportunities:**
```csharp
// Add eager loading to reduce queries
var students = await _context.Students
    .Include(s => s.Enrollments)
        .ThenInclude(e => e.Course)
    .AsNoTracking()  // Read-only queries
    .ToListAsync();

// Add response caching for static content
[ResponseCache(Duration = 3600)]
public async Task OnGetAsync() { }

// Add output caching for expensive queries
builder.Services.AddOutputCache();
```

### Monitoring & Observability

**Current State:**
- ✅ Console logging (ASP.NET Core default logger)
- ❌ No structured logging
- ❌ No distributed tracing
- ❌ No application performance monitoring (APM)
- ❌ No custom metrics or dashboards
- ❌ No alerting

**Recommendation:**
```csharp
// Add Application Insights
builder.Services.AddApplicationInsightsTelemetry();

// Add Serilog for structured logging
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.ApplicationInsights(
        builder.Configuration["ApplicationInsights:InstrumentationKey"], 
        TelemetryConverter.Traces)
    .CreateLogger();

// Add health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<SchoolContext>();
    
app.MapHealthChecks("/health");
```

### Scalability Considerations

**Current Limitations:**
- **Single instance deployment** - No load balancing
- **LocalDB** - Single-user database, not cluster-ready
- **No distributed session** - Would break with multiple instances
- **No CDN** - Static assets served from application server

**Migration Path:**
1. **Database:** Migrate to Azure SQL Database or SQL Server cluster
2. **Caching:** Add Redis for distributed caching
3. **Static Assets:** Move to CDN (Azure CDN, CloudFront)
4. **Load Balancing:** Azure App Service with multiple instances or Kubernetes
5. **Session State:** Use distributed cache for session storage

---

## Migration Recommendations

### Short-Term (Pre-Migration)

#### 1. API Documentation
- **Generate OpenAPI/Swagger spec** for future REST APIs
- Document all Razor Page routes and parameters
- Create Postman/Thunder Client collections for testing

#### 2. Add Resilience Patterns
```csharp
// Add Polly for retry and circuit breaker
builder.Services.AddHttpClient("ContosoAPI")
    .AddTransientHttpErrorPolicy(policy => 
        policy.WaitAndRetryAsync(3, retryAttempt => 
            TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))))
    .AddTransientHttpErrorPolicy(policy =>
        policy.CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));
```

#### 3. Health Checks
```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<SchoolContext>()
    .AddSqlServer(connectionString)
    .AddCheck<DatabaseSeedHealthCheck>("database-seed");
```

#### 4. API Versioning (if adding REST endpoints)
```csharp
builder.Services.AddApiVersioning(options => {
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
});
```

### Mid-Term (During Migration)

#### 5. Extract REST API Layer
- Create dedicated Controllers for REST endpoints
- Separate UI concerns from API concerns
- Version API endpoints (`/api/v1/`)
- Implement proper JSON serialization settings

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = 
            JsonIgnoreCondition.WhenWritingNull;
    });
```

#### 6. Implement Authentication
- ASP.NET Core Identity or Azure AD integration
- JWT tokens for API access
- Cookie authentication for Razor Pages
- Authorization policies for role-based access

#### 7. Add Monitoring
- Application Insights or OpenTelemetry
- Structured logging with correlation IDs
- Custom metrics (request count, response times, error rates)
- Distributed tracing for multi-service calls

### Long-Term (Post-Migration)

#### 8. GraphQL Gateway (Optional)
If complex queries are needed:
```csharp
builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>()
    .AddMutationType<Mutation>()
    .AddFiltering()
    .AddSorting();
```

#### 9. gRPC Services (Optional)
For inter-service communication:
```csharp
builder.Services.AddGrpc();
app.MapGrpcService<StudentService>();
```

#### 10. Event-Driven Architecture
- Publish domain events for student enrollment, course changes
- Integrate with message bus (Azure Service Bus, RabbitMQ)
- Implement eventual consistency patterns

---

## Appendix: Endpoint Inventory

### Complete Endpoint List (ASP.NET Core)

**Total Endpoints:** 28 (7 per resource × 4 resources)

```
GET  /                                  - Home page
GET  /About                             - Statistics page
GET  /Privacy                           - Privacy policy
GET  /Error                             - Error page

GET  /Students                          - List students
GET  /Students/Details?id={id}          - Student details
GET  /Students/Create                   - Create form
POST /Students/Create                   - Create action
GET  /Students/Edit?id={id}             - Edit form
POST /Students/Edit?id={id}             - Edit action
GET  /Students/Delete?id={id}           - Delete confirmation
POST /Students/Delete?id={id}           - Delete action

GET  /Courses                           - List courses
GET  /Courses/Details?id={id}           - Course details
GET  /Courses/Create                    - Create form
POST /Courses/Create                    - Create action
GET  /Courses/Edit?id={id}              - Edit form
POST /Courses/Edit?id={id}              - Edit action
GET  /Courses/Delete?id={id}            - Delete confirmation
POST /Courses/Delete?id={id}            - Delete action

GET  /Instructors                       - List instructors
GET  /Instructors/Details?id={id}       - Instructor details
GET  /Instructors/Create                - Create form
POST /Instructors/Create                - Create action
GET  /Instructors/Edit?id={id}          - Edit form
POST /Instructors/Edit?id={id}          - Edit action
GET  /Instructors/Delete?id={id}        - Delete confirmation
POST /Instructors/Delete?id={id}        - Delete action

GET  /Departments                       - List departments
GET  /Departments/Details?id={id}       - Department details
GET  /Departments/Create                - Create form
POST /Departments/Create                - Create action
GET  /Departments/Edit?id={id}          - Edit form (with concurrency)
POST /Departments/Edit?id={id}          - Edit action (with concurrency)
GET  /Departments/Delete?id={id}        - Delete confirmation
POST /Departments/Delete?id={id}        - Delete action
```

### Node.js API Endpoints

```
GET  /                                  - API information
GET  /api/health                        - Health check
```

---

**Document Status:** ✅ Complete  
**Next Steps:** 
1. Review with technical stakeholders
2. Define formal SLAs for production
3. Implement authentication and authorization
4. Add API versioning strategy
5. Enhance monitoring and observability
