# Core-Infrastructure – Migration Notes

## 1. Purpose & Responsibilities

The Core-Infrastructure module encompasses all foundational, cross-cutting concerns and shared components that support the entire ContosoUniversity application. This module is responsible for:

- **Application Startup and Configuration**: `Program.cs` orchestration
- **Dependency Injection Configuration**: Service registration and lifetime management
- **Database Connection Management**: Connection string configuration and DbContext setup
- **Middleware Pipeline**: Request/response processing pipeline
- **Shared Utilities**: Common helpers (e.g., `PaginatedList<T>`, `Utility`)
- **Global Error Handling**: Developer exception pages, production error pages
- **Static File Serving**: wwwroot assets (CSS, JS, images)
- **Routing Configuration**: Razor Pages routing conventions
- **ViewModels and Shared Models**: Cross-cutting data transfer objects
- **Database Initialization and Seeding**: Application of migrations and seed data

This module represents the "glue" that binds all feature modules together into a cohesive application.

## 2. Public Surface (Controllers/Endpoints/Classes)

### Application Entry Point

#### **Program.cs** - Application Composition Root

**Location**: `ContosoUniversity/Program.cs`

**Current Structure** (.NET 6 minimal hosting model):

```csharp
var builder = WebApplication.CreateBuilder(args);

// Service Configuration
builder.Services.AddRazorPages();
builder.Services.AddDbContext<SchoolContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SchoolContext")));
builder.Services.AddDatabaseDeveloperPageExceptionFilter();

var app = builder.Build();

// Middleware Pipeline Configuration
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

// Database Initialization (on app startup)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<SchoolContext>();
    context.Database.Migrate();
    DbInitializer.Initialize(context);
}

// Request Pipeline
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();
app.MapRazorPages();

app.Run();
```

**Responsibilities**:

1. Configure services (DI container)
2. Build application instance
3. Configure middleware pipeline
4. Apply database migrations on startup
5. Seed initial data
6. Start HTTP server

### Shared Utilities

#### **PaginatedList<T>** - Generic Pagination Helper

**Location**: `ContosoUniversity/PaginatedList.cs`

**Purpose**: Provides pagination functionality for any entity type

**Public API**:

```csharp
public class PaginatedList<T> : List<T>
{
    public int PageIndex { get; private set; }
    public int TotalPages { get; private set; }
    public bool HasPreviousPage => PageIndex > 1;
    public bool HasNextPage => PageIndex < TotalPages;

    public static async Task<PaginatedList<T>> CreateAsync(
        IQueryable<T> source, int pageIndex, int pageSize)
}
```

**Usage**: Students module Index page

**Characteristics**:

- ✅ Generic (works with any entity)
- ✅ Async factory method
- ✅ Efficient (uses Skip/Take)
- ✅ Computed properties for UI navigation

#### **Utility** - Miscellaneous Helpers

**Location**: `ContosoUniversity/Utility.cs`

**Purpose**: Utility methods (currently only concurrency token display)

**Public API**:

```csharp
public static class Utility
{
    public static string GetLastChars(byte[] token)
}
```

**Usage**: Departments module (display ConcurrencyToken in views)

**Characteristics**:

- ⚠️ Single method class (code smell)
- ⚠️ Could be moved to Departments module or expanded

### Configuration Files

#### **appsettings.json** - Application Configuration

**Location**: `ContosoUniversity/appsettings.json`

**Current Configuration**:

```json
{
  "PageSize": 3,
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "SchoolContext": "Server=(localdb)\\mssqllocaldb;Database=SchoolContext-...;Trusted_Connection=True;MultipleActiveResultSets=true"
  }
}
```

**appsettings.Development.json**:

- Typically used for development-specific overrides
- May contain debug logging levels
- Sensitive data should use User Secrets

#### **launchSettings.json** - Development Settings

**Location**: `ContosoUniversity/Properties/launchSettings.json`

**Purpose**: IIS Express and Kestrel launch profiles

### Shared Views

#### **\_Layout.cshtml** - Master Page Template

**Location**: `ContosoUniversity/Pages/Shared/_Layout.cshtml`

**Purpose**: Defines common HTML structure for all pages

**Features**:

- Navigation menu
- Footer
- References to Bootstrap CSS/JS
- RenderBody() placeholder for page content
- RenderSection() for page-specific scripts

#### **\_ValidationScriptsPartial.cshtml** - Client-Side Validation

**Location**: `ContosoUniversity/Pages/Shared/_ValidationScriptsPartial.cshtml`

**Purpose**: jQuery validation scripts for forms

#### **Error Pages**

- `Error.cshtml` / `Error.cshtml.cs` - Production error page
- `Privacy.cshtml` / `Privacy.cshtml.cs` - Privacy policy page
- `Index.cshtml` / `Index.cshtml.cs` - Home page

### Static Assets

**Location**: `ContosoUniversity/wwwroot/`

- `css/site.css` - Custom application styles
- `js/site.js` - Custom JavaScript
- `lib/` - Third-party libraries (Bootstrap, jQuery)
  - `bootstrap/` - Bootstrap CSS/JS
  - `jquery/` - jQuery library
  - `jquery-validation/` - jQuery validation

## 3. Dependencies

### NuGet Packages (Core)

| Package                                                | Version | Purpose             | Migration Impact           |
| ------------------------------------------------------ | ------- | ------------------- | -------------------------- |
| `Microsoft.NET.Sdk.Web`                                | SDK     | Web application SDK | Update to .NET 8 SDK       |
| `Microsoft.AspNetCore.Diagnostics.EntityFrameworkCore` | 6.0.2   | EF error pages      | Update to 8.0.x            |
| `Microsoft.EntityFrameworkCore.SqlServer`              | 6.0.2   | SQL Server provider | Update to 8.0.x            |
| `Microsoft.EntityFrameworkCore.Tools`                  | 6.0.2   | Migrations tooling  | Update to 8.0.x            |
| `Microsoft.VisualStudio.Web.CodeGeneration.Design`     | 6.0.2   | Scaffolding         | Update to 8.0.x (optional) |

### Framework Dependencies

- `Microsoft.AspNetCore.App` (implicitly referenced)
- `Microsoft.Extensions.Configuration`
- `Microsoft.Extensions.DependencyInjection`
- `Microsoft.Extensions.Hosting`
- `Microsoft.Extensions.Logging`

### System.Web Usage

- ✅ **No System.Web dependencies** - fully modernized

## 4. Migration Impact

### Current State Assessment

✅ **Already Modernized**:

- .NET 6 minimal hosting model
- Modern dependency injection
- Configuration system (not Web.config)
- Middleware pipeline (not HttpModules)
- Razor Pages (not Web Forms)

### Migration from .NET 6 → .NET 8

#### Framework Changes

**Target Framework Update**:

```xml
<!-- Before (.NET 6) -->
<TargetFramework>net6.0</TargetFramework>

<!-- After (.NET 8) -->
<TargetFramework>net8.0</TargetFramework>
```

#### Program.cs Enhancements for .NET 8

**A. Add Output Caching** (new in .NET 7/8):

```csharp
builder.Services.AddOutputCache();

// After app.Build()
app.UseOutputCache();
```

**B. Add Rate Limiting** (new in .NET 7):

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.Window = TimeSpan.FromSeconds(10);
        opt.PermitLimit = 100;
    });
});

// After app.Build()
app.UseRateLimiter();
```

**C. Enhanced Logging Configuration**:

```csharp
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
// Or add Serilog
```

**D. Health Checks** (for production monitoring):

```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<SchoolContext>();

// After app.Build()
app.MapHealthChecks("/health");
```

**E. API Versioning** (if REST API added):

```csharp
builder.Services.AddApiVersioning();
```

#### Configuration Enhancements

**appsettings.json** (recommended structure for .NET 8):

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "SchoolContext": "Server=(localdb)\\mssqllocaldb;Database=SchoolContext;Trusted_Connection=True;MultipleActiveResultSets=true"
  },
  "Features": {
    "EnableOutputCache": true,
    "EnableRateLimiting": true,
    "EnableDetailedErrors": false
  },
  "Pagination": {
    "DefaultPageSize": 10,
    "MaxPageSize": 100
  },
  "Database": {
    "CommandTimeout": 30,
    "EnableRetryOnFailure": true,
    "MaxRetryCount": 3
  }
}
```

#### Middleware Pipeline Optimization

**Current Order** (correct for .NET 6):

```csharp
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();
app.MapRazorPages();
```

**Recommended for .NET 8** (with new features):

```csharp
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

// NEW: Add these if implemented
app.UseOutputCache();
app.UseRateLimiter();

// NEW: Add authentication if implemented
// app.UseAuthentication();
app.UseAuthorization();

app.MapRazorPages();
app.MapHealthChecks("/health");
```

**Middleware Order Rules**:

1. Exception handling (first)
2. HTTPS redirection
3. Static files (before routing if no auth needed)
4. Routing
5. Output cache / Rate limiting
6. Authentication
7. Authorization
8. Endpoint mapping (last)

## 5. Data Access

### Database Initialization Pattern

**Current Approach** (in `Program.cs`):

```csharp
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<SchoolContext>();
    context.Database.Migrate();  // Apply pending migrations
    DbInitializer.Initialize(context);  // Seed data
}
```

**Characteristics**:

- ✅ Runs synchronously on app startup
- ✅ Applies migrations automatically
- ✅ Idempotent (DbInitializer checks if data exists)
- ⚠️ Blocks startup until complete
- ⚠️ Not suitable for production (use migration scripts instead)

**Recommended for Production**:

```csharp
// Remove automatic migration in production
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<SchoolContext>();
        context.Database.Migrate();
        DbInitializer.Initialize(context);
    }
}
```

**Production Migration Strategy**:

1. Generate SQL scripts: `dotnet ef migrations script`
2. Review and approve scripts
3. Apply via deployment pipeline (e.g., Azure DevOps, GitHub Actions)
4. Use tools like DbUp or Flyway for versioning

### Connection String Management

**Current** (appsettings.json):

```json
"ConnectionStrings": {
  "SchoolContext": "Server=(localdb)\\mssqllocaldb;..."
}
```

**Production Best Practices**:

1. **Azure**: Use Azure SQL connection string from Key Vault
2. **On-Premises**: Use Windows Authentication (no passwords in config)
3. **Docker**: Use environment variables
4. **Development**: Use User Secrets (not checked into source control)

**User Secrets** (for development):

```bash
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:SchoolContext" "Server=...;Database=..."
```

## 6. Test Coverage

### Existing Tests

❌ **No infrastructure tests exist**

### Proposed Tests

#### Integration Tests

```
ContosoUniversity.Tests/
└── Integration/
    └── Infrastructure/
        ├── ProgramTests.cs
        ├── DatabaseInitializationTests.cs
        └── MiddlewarePipelineTests.cs
```

**P0 - Critical**:

1. `ProgramTests`:

   - `Application_Starts_Successfully`
   - `DatabaseContext_IsRegistered_InDI`
   - `RazorPages_AreDiscovered`

2. `DatabaseInitializationTests`:

   - `Migrations_AreApplied_OnStartup`
   - `DbInitializer_Seeds_Data_WhenEmpty`
   - `DbInitializer_DoesNotDuplicate_WhenDataExists`

3. `MiddlewarePipelineTests`:
   - `StaticFiles_AreServed_FromWwwroot`
   - `ErrorPage_IsShown_InProduction`
   - `DeveloperExceptionPage_IsShown_InDevelopment`

#### Unit Tests

```
ContosoUniversity.Tests/
└── Unit/
    └── Infrastructure/
        ├── PaginatedListTests.cs
        └── UtilityTests.cs
```

**P1 - High**:

1. `PaginatedListTests`:

   - `CreateAsync_FirstPage_ReturnsCorrectItems`
   - `CreateAsync_MiddlePage_HasPreviousAndNext`
   - `CreateAsync_LastPage_HasNoNext`
   - `CreateAsync_EmptySource_ReturnsEmptyList`

2. `UtilityTests`:
   - `GetLastChars_ValidToken_ReturnsLastByte`

## 7. Risks & Rollback

### Module-Specific Risks

| Risk                                         | Likelihood | Impact   | Mitigation                                                     |
| -------------------------------------------- | ---------- | -------- | -------------------------------------------------------------- |
| **Automatic migrations in production**       | High       | Critical | Remove for production; use script-based migrations             |
| **Startup failure due to DB unavailability** | Medium     | Critical | Add retry logic; health checks; separate initialization        |
| **Missing appsettings in production**        | Low        | Critical | Validate configuration on startup; use Azure App Configuration |
| **Connection string exposure**               | Medium     | Critical | Use Key Vault, managed identities, or Windows Auth             |
| **Middleware order incorrect**               | Low        | High     | Comprehensive integration tests                                |
| **Static file cache issues**                 | Low        | Medium   | Configure cache headers appropriately                          |

### Configuration Management

**Current Issues**:

- ⚠️ Connection string contains GUID (generated database name)
- ⚠️ No separation between dev/staging/prod settings
- ⚠️ Hardcoded PageSize in appsettings.json

**Recommended**:

- Environment-specific appsettings: `appsettings.Production.json`
- Azure App Configuration for centralized config
- Feature flags for gradual rollouts

### Rollback Strategy

**Code Rollback**:

```bash
git revert <commit-hash>
dotnet build
dotnet run
```

**Database Rollback**:

```bash
dotnet ef database update <PreviousMigration>
```

**Configuration Rollback**:

- Revert appsettings changes
- Update environment variables in hosting environment

## 8. Work Breakdown

### Task INFRA-1: Update to .NET 8

**Estimate**: 2 hours  
**LOC**: ~10  
**Acceptance Criteria**:

- [ ] Update `<TargetFramework>` to `net8.0`
- [ ] Update all NuGet packages to 8.0.x
- [ ] Run `dotnet restore` and `dotnet build`
- [ ] Verify application starts successfully
- [ ] Run all existing tests (if any)

**Files Changed**:

- `MODIFY: ContosoUniversity/ContosoUniversity.csproj`

---

### Task INFRA-2: Separate Dev/Prod Database Initialization

**Estimate**: 2 hours  
**LOC**: ~20  
**Acceptance Criteria**:

- [ ] Wrap `context.Database.Migrate()` in `if (IsDevelopment())`
- [ ] Add warning log for production
- [ ] Document SQL script generation process
- [ ] Create deployment documentation

**Files Changed**:

- `MODIFY: ContosoUniversity/Program.cs`
- `NEW: Docs/migration/Database-Deployment.md`

---

### Task INFRA-3: Add Health Checks

**Estimate**: 2 hours  
**LOC**: ~30  
**Acceptance Criteria**:

- [ ] Add `AddHealthChecks()` with DbContext check
- [ ] Map `/health` endpoint
- [ ] Test health check returns 200 when DB available
- [ ] Test health check returns 503 when DB unavailable
- [ ] Document monitoring strategy

**Files Changed**:

- `MODIFY: ContosoUniversity/Program.cs`
- `NEW: Docs/migration/Monitoring.md`

---

### Task INFRA-4: Implement User Secrets for Development

**Estimate**: 1 hour  
**LOC**: ~5  
**Acceptance Criteria**:

- [ ] Run `dotnet user-secrets init`
- [ ] Move connection string to User Secrets
- [ ] Update documentation for developers
- [ ] Verify connection works from User Secrets

**Files Changed**:

- `MODIFY: ContosoUniversity/ContosoUniversity.csproj` (UserSecretsId)
- `UPDATE: README.md` (developer setup instructions)

---

### Task INFRA-5: Add Output Caching

**Estimate**: 3 hours  
**LOC**: ~40  
**Acceptance Criteria**:

- [ ] Add `AddOutputCache()` service registration
- [ ] Add `UseOutputCache()` middleware
- [ ] Add `[OutputCache]` attribute to read-only pages (Details)
- [ ] Configure cache duration and vary-by rules
- [ ] Test cache hit/miss behavior

**Files Changed**:

- `MODIFY: ContosoUniversity/Program.cs`
- `MODIFY: Selected Razor Pages` (add [OutputCache] attribute)

---

### Task INFRA-6: Add Rate Limiting

**Estimate**: 3 hours  
**LOC**: ~50  
**Acceptance Criteria**:

- [ ] Add `AddRateLimiter()` with fixed window policy
- [ ] Add `UseRateLimiter()` middleware
- [ ] Configure limits (e.g., 100 requests per 10 seconds)
- [ ] Test rate limiting behavior
- [ ] Add user-friendly error page for rate limit exceeded

**Files Changed**:

- `MODIFY: ContosoUniversity/Program.cs`
- `NEW: ContosoUniversity/Pages/RateLimitExceeded.cshtml`

---

### Task INFRA-7: Enhance Configuration Structure

**Estimate**: 3 hours  
**LOC**: ~80  
**Acceptance Criteria**:

- [ ] Create `appsettings.Production.json`
- [ ] Restructure settings into logical sections (Features, Pagination, Database)
- [ ] Add strongly-typed configuration classes
- [ ] Register configuration classes in DI
- [ ] Update modules to use strongly-typed config

**Files Changed**:

- `NEW: ContosoUniversity/appsettings.Production.json`
- `NEW: ContosoUniversity/Configuration/PaginationOptions.cs`
- `NEW: ContosoUniversity/Configuration/DatabaseOptions.cs`
- `MODIFY: ContosoUniversity/Program.cs`

---

### Task INFRA-8: Unit Tests for PaginatedList

**Estimate**: 3 hours  
**LOC**: ~150  
**Acceptance Criteria**:

- [ ] Test CreateAsync with various page sizes and indexes
- [ ] Test HasPreviousPage and HasNextPage properties
- [ ] Test edge cases (empty list, single page, last page)
- [ ] Test TotalPages calculation
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Infrastructure/PaginatedListTests.cs`

---

### Task INFRA-9: Integration Tests for Application Startup

**Estimate**: 4 hours  
**LOC**: ~200  
**Acceptance Criteria**:

- [ ] Test application starts successfully
- [ ] Test services are registered in DI container
- [ ] Test middleware pipeline order
- [ ] Test static files are served
- [ ] Test error pages for dev/production
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Integration/Infrastructure/ProgramTests.cs`
- `NEW: ContosoUniversity.Tests/Integration/Infrastructure/MiddlewarePipelineTests.cs`

---

### Task INFRA-10: Enhanced Logging with Serilog (Optional)

**Estimate**: 4 hours  
**LOC**: ~100  
**Acceptance Criteria**:

- [ ] Add Serilog NuGet packages
- [ ] Configure Serilog in Program.cs
- [ ] Add structured logging throughout application
- [ ] Configure log sinks (Console, File, Application Insights)
- [ ] Document logging strategy

**Files Changed**:

- `MODIFY: ContosoUniversity/ContosoUniversity.csproj`
- `MODIFY: ContosoUniversity/Program.cs`
- `NEW: ContosoUniversity/appsettings.json` (Serilog section)

---

### Summary

**Total Estimated Effort (Core Tasks)**: 23 hours (~2.9 days)  
**Total Estimated LOC**: ~575  
**Optional Enhancements**: +4 hours  
**Number of PRs**: 10  
**Risk Level**: High (affects entire application)

## 9. Links

### Related Documentation

- [ASP.NET Core Fundamentals](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/)
- [Minimal APIs and Hosting](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis)
- [Configuration in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/)
- [Dependency Injection](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection)
- [Middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/)

### Related Modules

- All modules depend on Core-Infrastructure

### .NET 8 New Features

- [What's New in .NET 8](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-8)
- [ASP.NET Core 8.0 Features](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-8.0)
- [EF Core 8.0 Features](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-8.0/whatsnew)

### Deployment & Operations

- [Health Checks](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks)
- [Rate Limiting](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit)
- [Output Caching](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/output)
- [Azure App Service Deployment](https://learn.microsoft.com/en-us/azure/app-service/quickstart-dotnetcore)

### Related Issues/PRs

- `Issue #50`: Migrate to .NET 8
- `Issue #51`: Implement production-ready database deployment
- `Issue #52`: Add health checks and monitoring
- `Issue #53`: Implement output caching
- `Issue #54`: Add rate limiting
- `PR #50`: [INFRA-1] Update to .NET 8
- (Additional PRs to be linked)
