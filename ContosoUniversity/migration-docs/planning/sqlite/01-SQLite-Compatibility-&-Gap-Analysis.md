# SQLite Compatibility & Gap Analysis

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Application:** ContosoUniversity  
**Current Database:** SQL Server (LocalDB/2019)  
**Target Database:** SQLite 3.x

---

## Executive Summary

This document analyzes the compatibility between ContosoUniversity's current SQL Server implementation and SQLite, identifying gaps, unsupported features, and migration strategies. The analysis is based on:

- **DDL/DML Analysis**: Entity Framework Core 6.0.2 migrations and model configurations
- **ORM Usage**: EF Core DbContext patterns, LINQ queries, and navigation properties
- **Raw Queries**: No raw SQL detected in codebase (100% EF Core abstraction)
- **Database Features**: Transactions, isolation levels, triggers, views, functions, and constraints

**Key Finding:** ContosoUniversity is a good candidate for SQLite migration due to heavy reliance on EF Core abstraction with minimal SQL Server-specific features.

---

## Current Database Features Inventory

### Tables and Schema
- **Tables**: 7 (Student, Instructor, Course, Department, Enrollment, OfficeAssignment, CourseInstructor)
- **Primary Keys**: Auto-increment integers and composite keys
- **Foreign Keys**: 8 relationships with cascade/no-action behaviors
- **Indexes**: 5 foreign key indexes
- **Data Types**: int, nvarchar, datetime2, decimal (money), rowversion

### EF Core Features Used
- Code-First migrations
- Navigation properties (one-to-many, many-to-many)
- Data annotations ([Required], [StringLength], [Timestamp])
- Fluent API configurations
- Include/ThenInclude eager loading
- Lazy loading via Collection.LoadAsync and Reference.LoadAsync
- DbContext pooling potential

### Transaction Patterns
- Implicit transactions via SaveChanges()
- No explicit transaction scopes detected
- Concurrency token using [Timestamp] attribute (Department.ConcurrencyToken)

---

## Feature Compatibility Matrix

| Feature | Current (SQL Server) | SQLite Support | Strategy | Effort | Risk | Notes |
|---------|---------------------|----------------|----------|--------|------|-------|
| **Data Types** |
| INT (Identity) | IDENTITY(1,1) auto-increment | AUTOINCREMENT on INTEGER PRIMARY KEY | Drop-in | XS | L | SQLite auto-increment is equivalent for single-column PKs |
| NVARCHAR(n) | Unicode variable-length strings | TEXT (no length enforcement) | Adapter | S | L | SQLite TEXT has no max length; validation must be application-side (already present via [StringLength]) |
| DATETIME2 | High-precision date/time | TEXT/REAL/INTEGER formats | Adapter | S | M | EF Core SQLite provider handles conversion; may need date format validation |
| DECIMAL (MONEY) | Fixed-precision decimal | TEXT or REAL (approx.) | Adapter | M | M | SQLite lacks native DECIMAL; EF Core stores as TEXT with precision loss risk on arithmetic |
| ROWVERSION | 8-byte auto-incrementing binary | Not supported natively | Rewrite | M | H | Replace with INTEGER version column or GUID; requires migration logic and testing |
| **Constraints** |
| Primary Keys | Clustered/non-clustered | Clustered only (ROWID) | Drop-in | XS | L | SQLite always uses ROWID-based clustering |
| Foreign Keys | Enforced with ON DELETE CASCADE/NO ACTION | Supported (requires PRAGMA foreign_keys=ON) | Adapter | S | M | Must enable foreign key enforcement in connection string; EF Core provider does this by default |
| Unique Constraints | Supported | Supported | Drop-in | XS | L | Full compatibility |
| Check Constraints | Supported | Supported (v3.3.0+) | Drop-in | XS | L | Full compatibility |
| Default Values | Supported | Supported | Drop-in | XS | L | Full compatibility |
| **Indexes** |
| B-Tree Indexes | Default index type | Default index type | Drop-in | XS | L | Full compatibility |
| Filtered Indexes | WHERE clause in index | WHERE clause supported | Drop-in | XS | L | Full compatibility |
| Composite Indexes | Multiple columns | Multiple columns | Drop-in | XS | L | Full compatibility |
| **Transactions** |
| Implicit Transactions | Auto-commit mode | Auto-commit mode | Drop-in | XS | L | SaveChanges() behavior identical |
| Explicit Transactions | BEGIN TRANSACTION / COMMIT | BEGIN / COMMIT | Drop-in | XS | L | EF Core abstractions work identically |
| Savepoints | Nested transactions | Supported via SAVEPOINT | Drop-in | XS | L | Full compatibility |
| **Isolation Levels** |
| READ UNCOMMITTED | Dirty reads allowed | Not supported (mapped to SERIALIZABLE) | Rewrite | S | M | SQLite only supports SERIALIZABLE and READ UNCOMMITTED (as DEFERRED); EF Core may need isolation config review |
| READ COMMITTED | Default level | Not supported (mapped to SERIALIZABLE) | Rewrite | S | M | Default isolation level difference may affect concurrent access patterns |
| REPEATABLE READ | Phantom reads prevented | Not supported (mapped to SERIALIZABLE) | Rewrite | S | M | Minimal impact for read-heavy workloads |
| SERIALIZABLE | Full isolation | Default and only true isolation | Drop-in | XS | L | SQLite default is SERIALIZABLE; safest but may reduce concurrency |
| **Concurrency** |
| Optimistic Concurrency | ROWVERSION / Timestamp | Requires manual version column | Rewrite | M | H | Replace Department.ConcurrencyToken with INTEGER Version; update DetectChanges logic |
| Pessimistic Locking | Row/table locks | Table-level locks only | Rewrite | S | M | SQLite locks entire database for writes; may cause contention in high-concurrency scenarios |
| Multiple Writers | Row-level locking | Database-level locking | Adapter | M | H | Write serialization may bottleneck multi-user updates; consider write queue or connection pooling |
| **Functions & Stored Procedures** |
| T-SQL Functions | GETDATE(), NEWID(), etc. | Not supported | N/A | XS | L | No T-SQL functions used in codebase; all logic in C# |
| Stored Procedures | CREATE PROCEDURE | Not supported | N/A | XS | L | No stored procedures in current implementation |
| User-Defined Functions | CREATE FUNCTION | Not supported (use C# or custom SQLite functions) | N/A | XS | L | No UDFs in current implementation |
| **Triggers** |
| AFTER/INSTEAD OF Triggers | Server-side triggers | AFTER triggers only (no INSTEAD OF) | N/A | XS | L | No triggers in current implementation |
| **Views** |
| CREATE VIEW | SQL Server views | Supported with limitations | N/A | XS | L | No views in current implementation; EF Core queries can replace |
| Indexed Views | Materialized views | Not supported | N/A | XS | L | No indexed views used |
| **Advanced Features** |
| Full-Text Search | SQL Server FTS | FTS5 extension (different syntax) | Rewrite | L | M | Not used in current implementation; if added later, requires FTS5 module |
| JSON Support | JSON functions (2016+) | JSON1 extension (different syntax) | Rewrite | M | M | Not used in current implementation |
| Window Functions | OVER() clause | Supported (v3.25.0+) | Drop-in | XS | L | Not used in current implementation |
| Common Table Expressions (CTEs) | WITH clause | Supported (v3.8.3+) | Drop-in | XS | L | Not used in current implementation; all queries via EF Core LINQ |
| **Multi-Database Queries** |
| Cross-Database Queries | USE / Linked Servers | ATTACH DATABASE (same process) | Adapter | M | M | Not used; N/A for single-database app |
| **Backup & Recovery** |
| Online Backup | SQL Server backup tools | .backup command or file copy | Rewrite | S | L | Simpler file-based backup; requires new runbook |
| Point-in-Time Recovery | Transaction log shipping | Not supported | Rewrite | M | H | SQLite lacks transaction log; use periodic file snapshots |

---

## Critical Gaps and Workarounds

### 1. **ROWVERSION / Concurrency Token**
**Gap:** SQLite does not support SQL Server's `ROWVERSION` data type.

**Current Usage:**
```csharp
// Department.cs
[Timestamp]
public byte[] ConcurrencyToken { get; set; }
```

**Migration Strategy:** 
- **Replace** `byte[] ConcurrencyToken` with `int Version` (shadow property or explicit column)
- Update `Department` model and migration to use integer-based versioning
- Modify concurrency detection in edit workflows (Courses/Edit, Departments/Edit)

**Code Changes Required:**
```csharp
// New approach
public int Version { get; set; } // or use [ConcurrencyCheck] attribute

// In OnModelCreating:
modelBuilder.Entity<Department>()
    .Property(d => d.Version)
    .IsConcurrencyToken();
```

**Effort:** Medium (model change + migration + update tests)  
**Risk:** Medium (requires careful testing of concurrent update scenarios)

---

### 2. **DECIMAL / MONEY Data Type**
**Gap:** SQLite lacks native fixed-precision decimal; stores as TEXT or approximates as REAL.

**Current Usage:**
```csharp
// Department.cs
[Column(TypeName = "money")]
public decimal Budget { get; set; }
```

**Migration Strategy:**
- **Adapter**: EF Core SQLite provider automatically converts `decimal` to TEXT with string representation
- Precision maintained for storage/retrieval but arithmetic operations may have subtle differences
- Application logic already handles decimal in C#; no code changes required

**Validation Required:**
- Test currency calculations (budget summations, comparisons)
- Verify no direct SQL arithmetic operations on Budget column (confirmed: none exist)

**Effort:** Small (EF Core handles automatically; requires validation only)  
**Risk:** Low-Medium (precision loss in edge cases if direct SQL used in future)

---

### 3. **Write Concurrency / Database-Level Locking**
**Gap:** SQLite locks the entire database file for write transactions, not individual rows.

**Current Usage:**
- Low-concurrency ASP.NET Core Razor Pages app
- Single-user development mode (LocalDB)
- Implicit transactions via SaveChanges()

**Migration Strategy:**
- **Adapter**: Configure WAL (Write-Ahead Logging) mode for better concurrency
- **Adapter**: Enable connection pooling with appropriate busy timeout
- **Monitor**: Add retry logic for SQLITE_BUSY errors in production

**Implementation:**
```csharp
// In Program.cs
builder.Services.AddDbContext<SchoolContext>(options =>
    options.UseSqlite(
        connectionString,
        sqliteOptions => sqliteOptions.CommandTimeout(30)
    )
);

// Connection string adjustment
"Data Source=school.db;Mode=ReadWriteCreate;Cache=Shared;Foreign Keys=True;Journal Mode=WAL;"
```

**Effort:** Small (configuration change)  
**Risk:** Medium (may require retry logic if concurrent writes increase)

---

### 4. **Datetime2 to SQLite Date Format**
**Gap:** SQLite stores dates as TEXT, REAL (Julian day), or INTEGER (Unix timestamp). EF Core uses TEXT (ISO 8601) by default.

**Current Usage:**
```csharp
[DataType(DataType.Date)]
public DateTime EnrollmentDate { get; set; }

[DataType(DataType.Date)]
public DateTime HireDate { get; set; }
```

**Migration Strategy:**
- **Drop-in**: EF Core SQLite provider handles conversion automatically
- Dates stored as TEXT in ISO 8601 format: `"YYYY-MM-DD HH:MM:SS.SSS"`
- Comparisons and sorting work correctly via string comparison

**Validation Required:**
- Test date range queries (enrollment reports, hire date filters)
- Verify date format display in UI (already handled by display formatting)

**Effort:** Extra-Small (no code changes; EF Core handles automatically)  
**Risk:** Low (EF Core abstraction is tested)

---

### 5. **Foreign Key Enforcement**
**Gap:** SQLite requires explicit `PRAGMA foreign_keys=ON` to enforce foreign key constraints (disabled by default).

**Current Usage:**
- 8 foreign key relationships with cascade/no-action behaviors
- EF Core migrations define foreign keys

**Migration Strategy:**
- **Adapter**: EF Core SQLite provider enables foreign keys by default in connection
- Explicitly verify in connection string or OnConfiguring

**Implementation:**
```csharp
// Verify foreign keys are enabled (EF Core does this by default)
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder.UseSqlite("Data Source=school.db;Foreign Keys=True;");
}
```

**Effort:** Extra-Small (verification only; EF Core handles by default)  
**Risk:** Low (provider handles automatically)

---

### 6. **Identity Column Differences**
**Gap:** SQL Server `IDENTITY(1,1)` vs SQLite `AUTOINCREMENT`.

**Current Usage:**
- Auto-incrementing primary keys on: Student.ID, Instructor.ID, Enrollment.ID, Department.DepartmentID
- Course.CourseID uses `[DatabaseGenerated(DatabaseGeneratedOption.None)]` (manual IDs)

**Migration Strategy:**
- **Drop-in**: EF Core translates IDENTITY to AUTOINCREMENT automatically
- SQLite `AUTOINCREMENT` ensures IDs are never reused (slightly different from SQL Server)

**Key Difference:**
- SQL Server may reuse identity values after DELETE (in some configurations)
- SQLite AUTOINCREMENT guarantees strictly increasing IDs

**Effort:** Extra-Small (EF Core handles automatically)  
**Risk:** Low (difference is beneficial for data integrity)

---

## Unsupported SQL Constructs (Not Currently Used)

The following SQL Server features are **not supported in SQLite** but are **not currently used** in ContosoUniversity:

| Feature | SQLite Support | Impact |
|---------|----------------|--------|
| Stored Procedures | ❌ Not supported | ✅ None (not used) |
| User-Defined Functions | ❌ Not supported (use C# or custom functions) | ✅ None (not used) |
| Triggers (INSTEAD OF) | ❌ Only AFTER triggers | ✅ None (not used) |
| Full-Text Search | ⚠️ Different syntax (FTS5 extension) | ✅ None (not used) |
| JSON Functions | ⚠️ Different syntax (JSON1 extension) | ✅ None (not used) |
| XML Support | ❌ Not supported | ✅ None (not used) |
| Spatial Data | ❌ Not supported (use SpatiaLite extension) | ✅ None (not used) |
| Computed Columns | ❌ Not supported | ✅ None (not used) |
| Indexed Views | ❌ Not supported | ✅ None (not used) |
| Partitioning | ❌ Not supported | ✅ None (not used) |
| Replication | ❌ Not supported | ✅ None (not used) |

---

## Migration Strategy Summary

### Phase 1: Package & Configuration Updates
**Strategy:** Adapter  
**Effort:** Small  
**Risk:** Low

**Actions:**
1. Replace `Microsoft.EntityFrameworkCore.SqlServer` with `Microsoft.EntityFrameworkCore.Sqlite` (v8.0.x recommended)
2. Update connection string in `appsettings.json`:
   ```json
   "ConnectionStrings": {
     "SchoolContext": "Data Source=school.db;Foreign Keys=True;Cache=Shared;Journal Mode=WAL;"
   }
   ```
3. Update `Program.cs`:
   ```csharp
   builder.Services.AddDbContext<SchoolContext>(options =>
       options.UseSqlite(builder.Configuration.GetConnectionString("SchoolContext")));
   ```

**Validation:**
- Run `dotnet build` to verify package compatibility
- Test connection initialization

---

### Phase 2: Model & Migration Changes
**Strategy:** Rewrite (concurrency token only)  
**Effort:** Medium  
**Risk:** Medium

**Actions:**
1. **Update Department Model:**
   ```csharp
   // Replace:
   [Timestamp]
   public byte[] ConcurrencyToken { get; set; }
   
   // With:
   [ConcurrencyCheck]
   public int Version { get; set; }
   ```

2. **Create New SQLite Migration:**
   ```bash
   dotnet ef migrations add SQLiteMigration --context SchoolContext
   dotnet ef database update
   ```

3. **Update Concurrency Handling in Pages:**
   - Review Departments/Edit.cshtml.cs for DbUpdateConcurrencyException handling
   - Ensure Version property is included in update logic

**Validation:**
- Test concurrent department updates
- Verify concurrency exception handling

---

### Phase 3: Data Migration & Seeding
**Strategy:** Drop-in (with validation)  
**Effort:** Small  
**Risk:** Low

**Actions:**
1. Verify `DbInitializer.cs` works with SQLite (no changes expected)
2. Test data seeding with new migration
3. Validate date formatting in seed data

**Validation:**
- Run `DbInitializer.Initialize()` and verify all records created
- Check date fields display correctly in UI

---

### Phase 4: Testing & Validation
**Strategy:** Adapter  
**Effort:** Medium  
**Risk:** Low

**Actions:**
1. **Functional Testing:**
   - CRUD operations on all entities
   - Navigation property loading (Include, ThenInclude, LoadAsync)
   - Date range filtering
   - Decimal arithmetic (budget operations)

2. **Concurrency Testing:**
   - Simulate concurrent department updates
   - Verify optimistic concurrency exception handling

3. **Performance Testing:**
   - Compare query performance (SQLite typically faster for reads on small datasets)
   - Test write contention scenarios (WAL mode should handle well)

**Validation:**
- All existing UI workflows function identically
- No data loss or precision issues

---

## EF Core SQLite Provider Considerations

### Automatically Handled by EF Core
✅ Data type conversions (int, string, DateTime, decimal)  
✅ Foreign key enforcement  
✅ Auto-increment primary keys  
✅ Index creation  
✅ Transaction management  
✅ Navigation property queries  
✅ Migration generation  

### Manual Configuration Required
⚠️ WAL mode (recommend for concurrency)  
⚠️ Busy timeout (recommend 30 seconds)  
⚠️ Concurrency token strategy (int Version instead of rowversion)  
⚠️ Connection string flags (Foreign Keys, Cache Shared)  

---

## Risk Assessment

| Risk Category | Level | Mitigation |
|---------------|-------|------------|
| Data Loss During Migration | Low | Backup SQL Server DB before migration; validate data integrity post-migration |
| Concurrency Issues | Medium | Enable WAL mode; add retry logic; test concurrent scenarios |
| Decimal Precision Loss | Low | Validate budget calculations; EF Core TEXT storage maintains precision |
| Date Format Issues | Low | EF Core handles automatically; test date queries |
| Rowversion Replacement | Medium | Thorough testing of Department edit concurrency; regression tests |
| Production Write Contention | Medium | Monitor SQLITE_BUSY errors; consider connection pooling; evaluate workload |
| Tooling & Debugging | Low | SQLite has excellent tooling (SQLite Studio, DB Browser, CLI) |

---

## Effort Estimation

| Phase | Effort | Duration (Dev Days) |
|-------|--------|---------------------|
| Package & Configuration Updates | Small | 0.5 |
| Model Changes (Concurrency Token) | Medium | 1.0 |
| Migration Generation | Small | 0.5 |
| Data Migration & Seeding Validation | Small | 0.5 |
| Functional Testing | Medium | 1.5 |
| Concurrency Testing | Small | 0.5 |
| Documentation & Runbook Updates | Small | 0.5 |
| **Total** | **Medium** | **5.0 days** |

**Assumptions:**
- Single developer
- No unexpected migration issues
- Existing test infrastructure (if any) requires minimal updates

---

## Recommended Migration Path

### ✅ Recommended: SQLite Migration
**Rationale:**
- Application is **ORM-first** (100% EF Core, no raw SQL)
- Simple schema with **standard relationships**
- No server-side features (stored procedures, triggers, complex functions)
- **Single critical change**: Concurrency token strategy
- SQLite benefits: Simpler deployment, file-based portability, zero-config, reduced hosting costs

**Best For:**
- Development and testing environments
- Low-to-moderate concurrency workloads (<50 concurrent users)
- Single-server deployments
- Applications prioritizing simplicity over scale

---

### ⚠️ Stay on SQL Server If:
- High write concurrency expected (>100 concurrent writes/sec)
- Need for advanced features: full-text search, complex analytics, replication
- Enterprise tooling requirements (SQL Server Management Studio, profiling)
- Existing SQL Server infrastructure investments

---

## Next Steps

1. **Approval Gate:** Review this analysis with stakeholders; confirm SQLite suitability for target environment
2. **Prototype:** Create SQLite branch and execute Phases 1-2 in isolated environment
3. **Data Migration Test:** Migrate copy of SQL Server data to SQLite; validate integrity
4. **Performance Baseline:** Benchmark read/write operations; compare with SQL Server
5. **Rollout Plan:** Document rollback procedure; plan staged deployment
6. **Update Runbooks:** Modify `Data-Migration-Runbook.md` and `Operational-Runbook.md` for SQLite-specific procedures

---

## Appendix: SQLite Configuration Best Practices

### Recommended Connection String
```
Data Source=school.db;Mode=ReadWriteCreate;Cache=Shared;Foreign Keys=True;Journal Mode=WAL;Busy Timeout=30000;
```

### Explanation:
- **Mode=ReadWriteCreate**: Create database if it doesn't exist
- **Cache=Shared**: Enable shared cache for better concurrency
- **Foreign Keys=True**: Enforce foreign key constraints
- **Journal Mode=WAL**: Write-Ahead Logging for better concurrency
- **Busy Timeout=30000**: Wait 30 seconds for database lock (prevents immediate SQLITE_BUSY errors)

### Program.cs Configuration
```csharp
builder.Services.AddDbContext<SchoolContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("SchoolContext"),
        sqliteOptions =>
        {
            sqliteOptions.CommandTimeout(60);
            sqliteOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
        }
    )
);
```

---

## Document Maintenance

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Migration Team | Initial compatibility analysis |

**Review Cycle:** Update after each migration phase completion or when new database features are introduced.

---

**Classification:** Internal Migration Planning Document  
**Confidentiality:** Internal Use Only
