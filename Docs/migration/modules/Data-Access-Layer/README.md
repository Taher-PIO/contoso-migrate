# Data-Access-Layer – Migration Notes

## 1. Purpose & Responsibilities

The Data-Access-Layer (DAL) module is responsible for all database interactions and data persistence logic in the ContosoUniversity application. This module encapsulates:

- **Entity Framework Core DbContext** configuration and management
- **Entity Models** (POCOs) representing the university domain
- **Database Initialization and Seeding** logic for development/testing
- **Database Migrations** tracking schema evolution
- **Query abstraction** through EF Core's IQueryable interface

The DAL serves as the single source of truth for data access patterns, ensuring separation of concerns between business logic and persistence mechanisms.

## 2. Public Surface (Controllers/Endpoints/Classes)

### Key Classes

#### `SchoolContext : DbContext`

- **Location**: `Data/SchoolContext.cs`
- **Purpose**: Main database context providing access to all entity sets
- **DbSets**:
  - `Courses` - Course catalog management
  - `Enrollments` - Student course registrations
  - `Students` - Student records
  - `Departments` - Academic departments
  - `Instructors` - Faculty members
  - `OfficeAssignments` - Instructor office locations
- **Configuration**: Many-to-many relationships between Courses and Instructors
- **Registered in DI**: `Program.cs` with SQL Server connection string

#### `DbInitializer`

- **Location**: `Data/DbInitializer.cs`
- **Purpose**: Static class for seeding initial data
- **Method**: `Initialize(SchoolContext context)` - seeds database if empty
- **Invocation**: Called during application startup in `Program.cs`

### Entity Models (Data Contracts)

All models located in `Models/` namespace:

#### `Student`

- **Primary Key**: `ID` (int)
- **Properties**: `LastName`, `FirstMidName`, `EnrollmentDate`
- **Navigation**: `Enrollments` collection
- **Computed**: `FullName` property
- **Validation**: Required fields, string length constraints

#### `Course`

- **Primary Key**: `CourseID` (int, database-generated: None)
- **Properties**: `Title`, `Credits`, `DepartmentID`
- **Navigation**: `Department`, `Enrollments`, `Instructors` (many-to-many)
- **Validation**: String length (3-50), Credits range (0-5)

#### `Department`

- **Primary Key**: `DepartmentID` (int)
- **Properties**: `Name`, `Budget`, `StartDate`, `InstructorID`
- **Concurrency**: `ConcurrencyToken` (byte[] with [Timestamp] attribute)
- **Navigation**: `Administrator` (Instructor), `Courses` collection
- **Special**: Implements optimistic concurrency control

#### `Instructor`

- **Primary Key**: `ID` (int)
- **Properties**: `LastName`, `FirstMidName`, `HireDate`
- **Navigation**: `Courses` (many-to-many), `OfficeAssignment` (one-to-one)
- **Computed**: `FullName` property

#### `Enrollment`

- **Primary Key**: `EnrollmentID` (int)
- **Properties**: `CourseID`, `StudentID`, `Grade` (nullable enum)
- **Navigation**: `Course`, `Student`

#### `OfficeAssignment`

- **Primary Key**: `InstructorID` (int, also foreign key)
- **Properties**: `Location`
- **Navigation**: `Instructor` (one-to-one)

### Input/Output Contracts

- **Input**: Entity models bound from Razor Pages via model binding
- **Output**: IQueryable projections, entity instances, or collections
- **Serialization**: No direct API serialization in current architecture (Razor Pages render to HTML)

## 3. Dependencies

### NuGet Packages (from ContosoUniversity.csproj)

| Package                                                | Version | Purpose                                     | Migration Impact                   |
| ------------------------------------------------------ | ------- | ------------------------------------------- | ---------------------------------- |
| `Microsoft.EntityFrameworkCore.SqlServer`              | 6.0.2   | SQL Server database provider                | Update to 8.x for .NET 8 migration |
| `Microsoft.EntityFrameworkCore.Tools`                  | 6.0.2   | Design-time tools (migrations, scaffolding) | Update to 8.x for .NET 8 migration |
| `Microsoft.AspNetCore.Diagnostics.EntityFrameworkCore` | 6.0.2   | Developer exception page for EF errors      | Update to 8.x for .NET 8 migration |

### Internal Project Dependencies

- **None**: This is the only project in the solution
- **Namespace Dependencies**: Models consumed by all Razor Pages

### System.Web Usage

- ✅ **No System.Web dependencies detected**
- The application uses modern ASP.NET Core patterns throughout

### Framework Dependencies

- `Microsoft.EntityFrameworkCore` (6.0.x) - Core EF abstractions
- `System.ComponentModel.DataAnnotations` - Model validation attributes
- `System.Linq` - Query composition

## 4. Migration Impact

### Current State Assessment

The DAL is **already migrated** to modern .NET technologies:

- ✅ Uses EF Core 6 (not EF6 or classic EF)
- ✅ SDK-style project format
- ✅ .NET 6 target framework
- ✅ Dependency injection for DbContext
- ✅ Async/await patterns throughout
- ✅ Code-first migrations

### Migration from .NET 6 → .NET 8

#### API Changes Required

1. **EF Core 6 → 8 Breaking Changes**:

   - Update all `Microsoft.EntityFrameworkCore.*` packages to 8.x
   - Review [EF Core 7](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-7.0/breaking-changes) and [EF Core 8](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-8.0/breaking-changes) breaking changes
   - Minimal impact expected - primarily bug fixes and performance improvements

2. **Potential Optimizations**:
   - Consider using EF Core 8's new `ExecuteUpdate` and `ExecuteDelete` for bulk operations
   - Evaluate JSON column support for complex types
   - Consider HierarchyId support if applicable

#### Configuration Deltas

**Current** (`appsettings.json`):

```json
"ConnectionStrings": {
  "SchoolContext": "Server=(localdb)\\mssqllocaldb;Database=SchoolContext-a8778b0f-1bfd-4d0f-a500-09390a0df97f;Trusted_Connection=True;MultipleActiveResultSets=true"
}
```

**Post-.NET 8 Migration**:

- No changes required
- Consider adding retry logic: `options.EnableRetryOnFailure()`
- Consider adding sensitive data logging flag for dev environments

**Program.cs Registration** (current):

```csharp
builder.Services.AddDbContext<SchoolContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SchoolContext")));
```

**Post-.NET 8 Migration** (recommended enhancements):

```csharp
builder.Services.AddDbContext<SchoolContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("SchoolContext"),
        sqlOptions => sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null));

    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});
```

## 5. Data Access

### Current Strategy

- **ORM**: Entity Framework Core 6.0.2
- **Database**: SQL Server (LocalDB for development)
- **Pattern**: Repository pattern NOT used - direct DbContext injection
- **Queries**: IQueryable composition in PageModel classes
- **Transactions**: Implicit (SaveChanges handles unit of work)
- **Concurrency**: Optimistic concurrency with `[Timestamp]` on Department entity

### Migration Plan: EF Core 6 → EF Core 8

#### Phase 1: Package Updates (0.5 days)

1. Update NuGet packages in `.csproj`
2. Run `dotnet restore` and verify build
3. Review migration compatibility: `dotnet ef migrations list`

#### Phase 2: Code Review (1 day)

1. Search for deprecated API usage (unlikely)
2. Review query patterns for performance improvements
3. Test all CRUD operations

#### Phase 3: Migration Regeneration (0.5 days)

- EF Core 8 may generate slightly different migration code
- Options:
  - **A. Keep existing migrations** (recommended for production)
  - **B. Regenerate from scratch** (only if starting fresh)

#### Phase 4: Testing (2 days)

- Run all database operations
- Verify concurrency handling on Department edits
- Load test pagination with large datasets
- Verify seeding logic

### Alternative Considerations

**Repository Pattern Introduction**:

- **Pros**: Better testability, abstraction over EF Core
- **Cons**: Additional complexity, less flexibility with IQueryable
- **Recommendation**: NOT recommended unless moving to CQRS or DDD patterns

**Dapper for Read-Heavy Operations**:

- **Pros**: Better performance for complex queries
- **Cons**: Loss of change tracking, manual SQL
- **Recommendation**: Evaluate if query performance becomes bottleneck

## 6. Test Coverage

### Existing Tests

**Current State**: ❌ **No test project found in solution**

### Gaps

1. **Unit Tests**: None

   - DbContext configuration
   - Entity validation logic
   - DbInitializer seeding logic

2. **Integration Tests**: None

   - Database CRUD operations
   - Concurrency conflict handling (Department updates)
   - Migration application
   - Seeding on empty database

3. **Performance Tests**: None
   - Query performance with pagination
   - Large dataset operations
   - Concurrent user scenarios

### Proposed Tests

#### Test Project Structure

```
ContosoUniversity.Tests/
├── Unit/
│   ├── Models/
│   │   ├── StudentTests.cs (validation, computed properties)
│   │   ├── CourseTests.cs
│   │   └── DepartmentTests.cs (concurrency token)
│   └── Data/
│       └── DbInitializerTests.cs (seeding logic)
└── Integration/
    ├── SchoolContextTests.cs (CRUD operations)
    ├── ConcurrencyTests.cs (Department edit conflicts)
    └── MigrationTests.cs (migration application)
```

#### Priority Test Cases

**P0 - Critical** (must have before production):

1. `Department_ConcurrencyConflict_ThrowsDbUpdateConcurrencyException`
2. `SchoolContext_ApplyMigrations_CreatesAllTables`
3. `DbInitializer_EmptyDatabase_SeedsInitialData`
4. `Student_InvalidLastName_FailsValidation` (> 50 chars)

**P1 - High** (should have):

1. `Course_ManyToMany_Instructor_RelationshipWorks`
2. `Enrollment_Grade_AcceptsNullValue`
3. `PaginatedList_CreateAsync_ReturnsCorrectPage`

**P2 - Medium** (nice to have):

1. Query performance tests with 10,000+ records
2. Concurrent SaveChanges operations

### Test Infrastructure Requirements

**NuGet Packages**:

```xml
<PackageReference Include="xUnit" Version="2.6.*" />
<PackageReference Include="xUnit.runner.visualstudio" Version="2.5.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.0.*" />
<PackageReference Include="FluentAssertions" Version="6.12.*" />
<PackageReference Include="Moq" Version="4.20.*" />
```

**In-Memory Database for Tests**:

```csharp
var options = new DbContextOptionsBuilder<SchoolContext>()
    .UseInMemoryDatabase(databaseName: "TestDatabase")
    .Options;
var context = new SchoolContext(options);
```

## 7. Risks & Rollback

### Module-Specific Risks

| Risk                                  | Likelihood | Impact   | Mitigation                                                                         |
| ------------------------------------- | ---------- | -------- | ---------------------------------------------------------------------------------- |
| **EF Core 8 breaking changes**        | Low        | Medium   | Thorough review of breaking changes documentation; comprehensive test suite        |
| **Migration conflicts**               | Low        | High     | Keep existing migrations; only add new ones; maintain backup before migration      |
| **Connection string incompatibility** | Very Low   | Medium   | Test connection strings in staging environment first                               |
| **Performance regression**            | Low        | Medium   | Benchmark queries before/after; use EF Core logging                                |
| **Data loss during migration**        | Very Low   | Critical | **Always backup production database before migration**; test migrations in staging |
| **Concurrency handling changes**      | Very Low   | Medium   | Thoroughly test Department edit scenarios with simultaneous updates                |

### Rollback Strategy

#### If Migration Fails (Pre-Production)

1. **Code Rollback**:

   ```bash
   git revert <commit-hash>
   dotnet restore
   dotnet build
   ```

2. **Database Rollback**:

   ```bash
   # If new migrations were applied
   dotnet ef database update <PreviousMigrationName>
   ```

3. **Dependency Rollback**:
   - Revert `ContosoUniversity.csproj` package versions to 6.x
   - Run `dotnet restore`

#### If Issues Found in Production

1. **Immediate**: Switch back to previous deployment slot (if using Azure App Service)
2. **Database**: Restore from last known good backup
3. **Data Validation**: Run data integrity checks post-restore

### Testing Gates

Must pass before production deployment:

- ✅ All unit tests pass (100% pass rate)
- ✅ All integration tests pass (100% pass rate)
- ✅ No EF Core warnings in logs during test runs
- ✅ Performance benchmarks within 5% of baseline
- ✅ Successful migration application in staging environment
- ✅ Concurrency conflict handling verified manually

## 8. Work Breakdown

All tasks sized to ≤300 LOC changes per PR.

### Task DAL-1: Create Test Project Infrastructure

**Estimate**: 2 hours  
**LOC**: ~50  
**Acceptance Criteria**:

- [ ] Create `ContosoUniversity.Tests` project (xUnit)
- [ ] Add NuGet packages: xUnit, EF Core InMemory, FluentAssertions
- [ ] Create base test class with InMemory DbContext setup
- [ ] Verify test project builds and test runner discovers tests
- [ ] Add to solution file

**Files Changed**:

- `NEW: ContosoUniversity.Tests/ContosoUniversity.Tests.csproj`
- `NEW: ContosoUniversity.Tests/TestBase.cs`
- `MODIFY: ContosoUniversity.sln`

---

### Task DAL-2: Unit Tests for Entity Models

**Estimate**: 4 hours  
**LOC**: ~200  
**Acceptance Criteria**:

- [ ] Test Student validation (required fields, string lengths)
- [ ] Test Course validation (Credits range 0-5, Title length)
- [ ] Test Department concurrency token property exists
- [ ] Test computed properties (Student.FullName, Instructor.FullName)
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Models/StudentTests.cs`
- `NEW: ContosoUniversity.Tests/Unit/Models/CourseTests.cs`
- `NEW: ContosoUniversity.Tests/Unit/Models/DepartmentTests.cs`
- `NEW: ContosoUniversity.Tests/Unit/Models/InstructorTests.cs`

---

### Task DAL-3: DbInitializer Unit Tests

**Estimate**: 3 hours  
**LOC**: ~100  
**Acceptance Criteria**:

- [ ] Test seeding on empty database creates all entities
- [ ] Test seeding skips if database already has data
- [ ] Verify correct number of Students, Instructors, Courses created
- [ ] Verify relationships established (Course-Instructor many-to-many)
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Data/DbInitializerTests.cs`

---

### Task DAL-4: Integration Tests for CRUD Operations

**Estimate**: 5 hours  
**LOC**: ~250  
**Acceptance Criteria**:

- [ ] Test Create/Read/Update/Delete for Student entity
- [ ] Test Create/Read/Update/Delete for Course entity
- [ ] Test many-to-many relationship persistence (Course-Instructor)
- [ ] Test eager loading with `.Include()`
- [ ] All tests pass with InMemory database

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Integration/CrudTests.cs`

---

### Task DAL-5: Concurrency Conflict Tests

**Estimate**: 4 hours  
**LOC**: ~150  
**Acceptance Criteria**:

- [ ] Test Department update throws DbUpdateConcurrencyException on token mismatch
- [ ] Test successful update when token matches
- [ ] Test conflict resolution scenarios
- [ ] Verify ConcurrencyToken is updated after save
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Integration/ConcurrencyTests.cs`

---

### Task DAL-6: Update EF Core to Version 8.x

**Estimate**: 2 hours  
**LOC**: ~10 (csproj changes)  
**Acceptance Criteria**:

- [ ] Update `Microsoft.EntityFrameworkCore.SqlServer` to 8.0.x
- [ ] Update `Microsoft.EntityFrameworkCore.Tools` to 8.0.x
- [ ] Update `Microsoft.AspNetCore.Diagnostics.EntityFrameworkCore` to 8.0.x
- [ ] Run `dotnet restore` successfully
- [ ] Run `dotnet build` successfully
- [ ] No compiler warnings related to EF Core

**Files Changed**:

- `MODIFY: ContosoUniversity/ContosoUniversity.csproj`

---

### Task DAL-7: Verify and Test EF Core 8 Migration

**Estimate**: 4 hours  
**LOC**: ~20  
**Acceptance Criteria**:

- [ ] Run `dotnet ef migrations list` - all existing migrations shown
- [ ] Run `dotnet ef database update` on test database successfully
- [ ] Verify all existing data migrations apply cleanly
- [ ] Run full test suite - all tests pass
- [ ] Manual smoke test of all CRUD pages

**Files Changed**:

- (No code changes expected, verification only)
- `DOCUMENT: Test results log`

---

### Task DAL-8: Add Retry Logic and Enhanced Logging

**Estimate**: 2 hours  
**LOC**: ~30  
**Acceptance Criteria**:

- [ ] Add `.EnableRetryOnFailure()` to DbContext configuration
- [ ] Add sensitive data logging for Development environment
- [ ] Add detailed errors for Development environment
- [ ] Document configuration changes
- [ ] Test transient failure scenarios (optional)

**Files Changed**:

- `MODIFY: ContosoUniversity/Program.cs` (~15 LOC)
- `UPDATE: Docs/migration/modules/Data-Access-Layer/README.md`

---

### Task DAL-9: Performance Baseline and Benchmarking

**Estimate**: 6 hours  
**LOC**: ~200  
**Acceptance Criteria**:

- [ ] Create benchmark project using BenchmarkDotNet
- [ ] Benchmark Student Index page query with pagination (1000, 10000 records)
- [ ] Benchmark Course Index with eager loading
- [ ] Benchmark Department Edit concurrency check
- [ ] Document baseline metrics (query time, memory allocation)
- [ ] Compare EF Core 6 vs 8 performance (optional)

**Files Changed**:

- `NEW: ContosoUniversity.Benchmarks/ContosoUniversity.Benchmarks.csproj`
- `NEW: ContosoUniversity.Benchmarks/QueryBenchmarks.cs`
- `NEW: Docs/migration/Performance-Baseline.md`

---

### Task DAL-10: Update Solution Documentation

**Estimate**: 2 hours  
**LOC**: ~0 (documentation only)  
**Acceptance Criteria**:

- [ ] Update main README.md with .NET 8 information
- [ ] Document test project structure
- [ ] Add "Running Tests" section to README
- [ ] Update migration status in Overview.md
- [ ] Mark DAL migration as complete

**Files Changed**:

- `MODIFY: ContosoUniversity/README.md`
- `MODIFY: Docs/migration/Overview.md`

---

### Summary

**Total Estimated Effort**: 34 hours (~4.25 developer days)  
**Total Estimated LOC**: ~1,000 (mostly tests)  
**Number of PRs**: 10  
**Risk Level**: Low (already on modern stack)

## 9. Links

### Related Documentation

- [EF Core 8 What's New](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-8.0/)
- [EF Core 8 Breaking Changes](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-8.0/breaking-changes)
- [Migration from EF Core 6 to 8](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-8.0/whatsnew)

### Related Issues/PRs

- (To be created during implementation)
- `Issue #1`: Create comprehensive test suite for DAL
- `Issue #2`: Migrate EF Core 6 → 8
- `Issue #3`: Add performance benchmarking
- `PR #1`: [DAL-1] Create test project infrastructure
- `PR #2`: [DAL-2] Add entity model unit tests
- (Additional PRs to be linked as created)

### External Resources

- [ContosoUniversity Sample Tutorial](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/intro)
- [Testing EF Core Applications](https://learn.microsoft.com/en-us/ef/core/testing/)
- [Optimistic Concurrency in EF Core](https://learn.microsoft.com/en-us/ef/core/saving/concurrency)
