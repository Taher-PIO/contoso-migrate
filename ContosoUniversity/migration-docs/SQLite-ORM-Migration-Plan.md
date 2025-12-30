---
title: 'SQLite & ORM Migration Plan - ContosoUniversity'
last_updated: '2025-12-30'
owner: 'Migration Engineering Team'
status: 'Draft - For Review'
current_db: 'SQL Server (LocalDB for dev, SQL Server for prod)'
target_db: 'SQLite'
current_orm: 'Entity Framework Core 6.0.2 (.NET) / mssql package (Node.js)'
target_orm: 'To Be Determined'
---

# SQLite & ORM Migration Plan - ContosoUniversity

## Executive Summary

This document outlines the strategic plan for migrating the ContosoUniversity application from **SQL Server** to **SQLite** and evaluating alternative ORM approaches for both the .NET (ContosoUniversity) and Node.js (contoso-api) components.

**Migration Drivers:**
- **Simplification**: Eliminate dependency on SQL Server infrastructure
- **Portability**: Enable file-based database for easier development and deployment
- **Cost Reduction**: Remove SQL Server licensing and hosting costs
- **Development Velocity**: Simplify local development setup

**Target State:**
- Database: SQLite (file-based relational database)
- .NET ORM: Entity Framework Core 8.x with SQLite provider OR alternative lightweight ORM
- Node.js ORM: Evaluate Sequelize, Prisma, TypeORM, or better-sqlite3

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Migration Rationale](#migration-rationale)
3. [SQLite Feature Analysis](#sqlite-feature-analysis)
4. [ORM Evaluation](#orm-evaluation)
5. [Migration Strategy](#migration-strategy)
6. [Phased Implementation Plan](#phased-implementation-plan)
7. [Data Migration Approach](#data-migration-approach)
8. [Testing Strategy](#testing-strategy)
9. [Rollback Plan](#rollback-plan)
10. [Risk Assessment](#risk-assessment)
11. [Effort Estimation](#effort-estimation)
12. [Decision Matrix](#decision-matrix)

---

## Current State Assessment

### .NET Application (ContosoUniversity)

**Current Stack:**
- Framework: ASP.NET Core 6.0 (Razor Pages)
- Database: SQL Server (LocalDB for development)
- ORM: Entity Framework Core 6.0.2
- Provider: Microsoft.EntityFrameworkCore.SqlServer 6.0.2

**Database Context:**
```csharp
// Program.cs - Current configuration
builder.Services.AddDbContext<SchoolContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SchoolContext")));
```

**Entities:**
- Student (Primary entity with enrollments)
- Instructor (With office assignments)
- Course (Many-to-many with students via Enrollment)
- Department (With concurrency token - RowVersion)
- Enrollment (Junction table with grade enum)
- OfficeAssignment (One-to-one with Instructor)

**EF Core Features Used:**
- Migrations (2 migrations present)
- Conventions-based mapping
- Eager/explicit loading navigation properties
- Concurrency control (RowVersion on Department)
- Cascade delete behaviors
- Database seeding (DbInitializer)
- Query filters and pagination

### Node.js API (contoso-api)

**Current Stack:**
- Runtime: Node.js 18+
- Database: SQL Server (shared with .NET app)
- Data Access: mssql package (direct SQL queries, no ORM)
- TypeScript: Yes

**Current Implementation:**
```typescript
// config/database.ts
import sql from 'mssql';

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};
```

**Usage Pattern:**
- Raw SQL queries via mssql connection pool
- Manual query construction
- No schema validation
- No migrations

---

## Migration Rationale

### Why SQLite?

#### Advantages

1. **Zero Configuration**
   - No database server installation required
   - File-based storage (single `.db` file)
   - Embedded database engine

2. **Simplified Development**
   - Immediate local development without SQL Server setup
   - Easy to reset/clone database (copy file)
   - Version control friendly (can commit small test databases)

3. **Portability**
   - Cross-platform (Windows, macOS, Linux)
   - No external dependencies
   - Easy CI/CD integration (no database service setup needed)

4. **Cost Savings**
   - No licensing costs
   - No dedicated database server required
   - Reduced infrastructure complexity

5. **Performance for Small-to-Medium Datasets**
   - Fast for read-heavy workloads
   - Excellent for embedded scenarios
   - Low latency (no network hop)

#### Disadvantages

1. **Limited Concurrency**
   - Single writer at a time (readers can be concurrent)
   - Not suitable for high-write workloads
   - Lock contention under heavy concurrent writes

2. **Feature Limitations vs SQL Server**
   - No `ROWVERSION` type (must use alternative approach)
   - Limited stored procedure support (not recommended)
   - No full-text search (FTS5 extension available but limited)
   - No user-defined functions (UDFs) in database
   - Weaker type system (dynamic typing with affinity)

3. **Data Type Mapping Challenges**
   - No native `DATETIME2` (uses TEXT, REAL, or INTEGER storage)
   - No `UNIQUEIDENTIFIER` (store as TEXT or BLOB)
   - Limited precision for decimals

4. **Scalability Limits**
   - Database size practical limit ~1TB (theoretical 281TB)
   - Not suitable for distributed systems
   - No horizontal scaling

5. **Enterprise Features Missing**
   - No built-in backup/restore (file copy instead)
   - No point-in-time recovery
   - No replication
   - Limited monitoring/diagnostics

### Trade-off Assessment

| Criterion | SQL Server | SQLite | Winner |
|-----------|------------|--------|--------|
| **Setup Complexity** | High (server install) | Low (embedded) | ✅ SQLite |
| **Development Experience** | Medium | High | ✅ SQLite |
| **Concurrent Writes** | Excellent | Limited | ✅ SQL Server |
| **Horizontal Scalability** | Good (clustering) | None | ✅ SQL Server |
| **Portability** | Low | High | ✅ SQLite |
| **Cost** | High | Free | ✅ SQLite |
| **Feature Richness** | Excellent | Good | ✅ SQL Server |
| **Suitable for Production (High Traffic)** | Yes | No | ✅ SQL Server |
| **Suitable for Dev/Demo/Small Apps** | Overkill | Perfect | ✅ SQLite |

**Recommendation Context:**
- ✅ **Use SQLite if**: Educational/demo app, low concurrent users (<50), single-server deployment, cost-sensitive
- ⚠️ **Use SQL Server if**: Production app with high traffic, multiple concurrent writers, need enterprise features

---

## SQLite Feature Analysis

### Feature Compatibility Matrix

| Feature | SQL Server | SQLite | Migration Strategy |
|---------|------------|--------|-------------------|
| **ACID Transactions** | ✅ Yes | ✅ Yes | ✅ Direct migration |
| **Foreign Keys** | ✅ Yes | ✅ Yes (must enable) | ⚠️ Enable pragma |
| **CHECK Constraints** | ✅ Yes | ✅ Yes | ✅ Direct migration |
| **UNIQUE Constraints** | ✅ Yes | ✅ Yes | ✅ Direct migration |
| **AUTO INCREMENT** | `IDENTITY` | `AUTOINCREMENT` | ⚠️ Syntax change |
| **Row Versioning** | `ROWVERSION` | ❌ No native support | ⚠️ Use `LastModified` timestamp |
| **Cascade Delete** | ✅ Yes | ✅ Yes (with FK pragma) | ✅ Direct migration |
| **Indexes** | ✅ Full support | ✅ Good support | ✅ Direct migration |
| **Triggers** | ✅ Yes | ✅ Yes (limited) | ⚠️ Review trigger logic |
| **Views** | ✅ Yes | ✅ Yes | ✅ Direct migration |
| **Stored Procedures** | ✅ Yes | ❌ No | ⚠️ Move logic to app layer |
| **Full-Text Search** | ✅ Yes | ⚠️ FTS5 extension | ⚠️ Use FTS5 or app-level search |
| **JSON Support** | ✅ Yes | ✅ Yes (JSON1 extension) | ✅ Direct migration |
| **Computed Columns** | ✅ Yes | ⚠️ Via triggers/views | ⚠️ App-level or triggers |

### Concurrency Control Strategy

**Problem:** Department entity uses `ROWVERSION` for optimistic concurrency control.

**SQL Server Implementation:**
```csharp
[Timestamp]
public byte[] RowVersion { get; set; }
```

**SQLite Solutions:**

#### Option 1: LastModified Timestamp (Recommended)
```csharp
public DateTime LastModified { get; set; }

// In DbContext configuration
modelBuilder.Entity<Department>()
    .Property(d => d.LastModified)
    .IsConcurrencyToken()
    .ValueGeneratedOnAddOrUpdate();
```

#### Option 2: Version Counter
```csharp
public int Version { get; set; }

// In DbContext
modelBuilder.Entity<Department>()
    .Property(d => d.Version)
    .IsConcurrencyToken();
```

**Implementation:**
- Replace `[Timestamp]` attribute with `[ConcurrencyCheck]` or configure via Fluent API
- Update existing Department entity
- Migrate existing data (initialize Version or LastModified)

---

## ORM Evaluation

### .NET Options

#### Option 1: Entity Framework Core 8.x with SQLite Provider (Recommended)

**Pros:**
- ✅ Minimal code changes (mostly connection string + provider swap)
- ✅ Existing migrations can be adapted
- ✅ EF Core abstractions remain unchanged
- ✅ Strong typing and LINQ support
- ✅ Official Microsoft support
- ✅ Mature SQLite provider (`Microsoft.EntityFrameworkCore.Sqlite`)

**Cons:**
- ⚠️ Still carries EF Core overhead
- ⚠️ Some SQL Server-specific features won't translate
- ⚠️ Generated migrations need review (data type differences)

**Migration Effort:** Low (1-2 days)

**Example Change:**
```csharp
// Before
builder.Services.AddDbContext<SchoolContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SchoolContext")));

// After
builder.Services.AddDbContext<SchoolContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("SchoolContext")));
```

#### Option 2: Dapper (Micro-ORM)

**Pros:**
- ✅ Lightweight and fast
- ✅ Full SQL control
- ✅ Excellent performance (minimal overhead)
- ✅ Simple to learn

**Cons:**
- ❌ No migration framework (manual schema management)
- ❌ No automatic change tracking
- ❌ More boilerplate code
- ❌ Requires writing SQL queries manually

**Migration Effort:** High (2-3 weeks)

**Not Recommended:** Major rewrite required; loses EF Core benefits.

#### Option 3: LLBLGen Pro / NHibernate

**Not Recommended:** Overkill for this application; commercial licensing or steep learning curve.

### Node.js Options

#### Option 1: Prisma (Recommended)

**Pros:**
- ✅ Type-safe query builder
- ✅ Auto-generated TypeScript types
- ✅ Built-in migration system (`prisma migrate`)
- ✅ Excellent developer experience
- ✅ SQLite support out-of-the-box
- ✅ Schema introspection

**Cons:**
- ⚠️ Additional build step (prisma generate)
- ⚠️ Learning curve for team

**Migration Effort:** Medium (3-5 days)

**Example Schema:**
```prisma
// schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./school.db"
}

model Student {
  ID              Int          @id @default(autoincrement())
  LastName        String
  FirstMidName    String
  EnrollmentDate  DateTime
  Enrollments     Enrollment[]
}
```

#### Option 2: Sequelize

**Pros:**
- ✅ Mature and widely used
- ✅ Supports multiple databases (PostgreSQL, MySQL, SQLite)
- ✅ Migration system included
- ✅ ORM with associations

**Cons:**
- ⚠️ Less type-safe than Prisma
- ⚠️ More verbose than Prisma
- ⚠️ Declining community activity

**Migration Effort:** Medium (4-6 days)

#### Option 3: TypeORM

**Pros:**
- ✅ Decorators for entity definition (similar to EF Core)
- ✅ TypeScript-first design
- ✅ Migration support

**Cons:**
- ⚠️ More complex than Prisma
- ⚠️ Active Record pattern can be confusing

**Migration Effort:** Medium (4-6 days)

#### Option 4: better-sqlite3 (Low-Level)

**Pros:**
- ✅ Fastest SQLite library for Node.js (synchronous)
- ✅ Minimal overhead

**Cons:**
- ❌ No ORM features (manual SQL)
- ❌ No migrations
- ❌ More boilerplate

**Not Recommended:** Too low-level for this use case.

### Recommended ORM Strategy

| Component | Current | Recommended | Reason |
|-----------|---------|-------------|--------|
| **.NET App** | EF Core 6 + SQL Server | **EF Core 8 + SQLite** | Minimal changes, proven stack |
| **Node.js API** | mssql (raw SQL) | **Prisma + SQLite** | Modern DX, type-safety, migrations |

---

## Migration Strategy

### High-Level Approach

**Strategy:** Phased Migration with Parallel Development

1. **Phase 1:** Create SQLite schema and data export scripts
2. **Phase 2:** Update .NET application to use EF Core + SQLite
3. **Phase 3:** Migrate Node.js API to Prisma + SQLite
4. **Phase 4:** Testing and validation
5. **Phase 5:** Documentation and deployment

### Architecture Decision

**ADR-021: Database Migration to SQLite**
- **Status:** Proposed
- **Decision:** Migrate from SQL Server to SQLite for simplified development and deployment
- **Rationale:** Application is a demo/educational system with low concurrent users; SQLite sufficient
- **Impact:** Improved portability, reduced costs, simplified local setup

**ADR-022: Node.js ORM Selection - Prisma**
- **Status:** Proposed
- **Decision:** Adopt Prisma as ORM for Node.js API layer
- **Rationale:** Type-safe, modern DX, excellent SQLite support, migration tooling
- **Impact:** Requires team training; improved code quality and developer productivity

---

## Phased Implementation Plan

### Phase 1: Schema Migration & Export (Week 1)

**Goal:** Create SQLite schema and export data from SQL Server

**Tasks:**
1. ✅ Analyze current schema (`SchoolContext` database)
2. ✅ Create SQLite DDL script (convert SQL Server migrations)
3. ✅ Export data from SQL Server to CSV/JSON
4. ✅ Create import scripts for SQLite
5. ✅ Test data import and validate referential integrity

**Deliverables:**
- `schema.sql` - SQLite DDL
- `data-export.ps1` - PowerShell script to export SQL Server data
- `data-import.sql` - SQL script to import into SQLite
- `school.db` - SQLite database file with sample data

**Validation Criteria:**
- [ ] All tables created successfully
- [ ] All foreign keys enforced
- [ ] Row counts match source database
- [ ] Sample queries return expected results

---

### Phase 2: .NET Application Migration (Week 2)

**Goal:** Update ContosoUniversity to use SQLite with EF Core

**Tasks:**
1. ✅ Upgrade to .NET 8 (prerequisite)
2. ✅ Replace `Microsoft.EntityFrameworkCore.SqlServer` with `Microsoft.EntityFrameworkCore.Sqlite`
3. ✅ Update `Program.cs` to use `UseSqlite()`
4. ✅ Update connection string in `appsettings.json`
5. ✅ Replace `[Timestamp]` with `[ConcurrencyCheck]` + `LastModified` on Department
6. ✅ Re-create EF Core migrations for SQLite
7. ✅ Test all CRUD operations
8. ✅ Validate pagination, sorting, filtering
9. ✅ Test concurrency conflict handling (Department)

**Code Changes:**

**File:** `ContosoUniversity.csproj`
```xml
<!-- Before -->
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="6.0.2" />

<!-- After -->
<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.0" />
```

**File:** `Program.cs`
```csharp
// Before
builder.Services.AddDbContext<SchoolContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SchoolContext")));

// After
builder.Services.AddDbContext<SchoolContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("SchoolContext")));
```

**File:** `appsettings.json`
```json
{
  "ConnectionStrings": {
    "SchoolContext": "Data Source=school.db"
  }
}
```

**File:** `Models/Department.cs`
```csharp
// Before
[Timestamp]
public byte[] RowVersion { get; set; }

// After
[ConcurrencyCheck]
public DateTime LastModified { get; set; }
```

**File:** `Data/SchoolContext.cs` (Add configuration)
```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Enable foreign keys in SQLite
    if (Database.IsSqlite())
    {
        // SQLite doesn't enforce FK by default in some configurations
        // Ensure it's enabled via connection string or pragma
    }

    // Configure LastModified to auto-update
    modelBuilder.Entity<Department>()
        .Property(d => d.LastModified)
        .ValueGeneratedOnAddOrUpdate()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    // ... existing configuration
}
```

**Deliverables:**
- Updated project file and dependencies
- New EF Core migrations for SQLite
- Updated connection strings
- Test report (all pages functional)

---

### Phase 3: Node.js API Migration (Week 3)

**Goal:** Migrate contoso-api to use Prisma with SQLite

**Tasks:**
1. ✅ Install Prisma dependencies (`prisma`, `@prisma/client`)
2. ✅ Initialize Prisma (`npx prisma init --datasource-provider sqlite`)
3. ✅ Create Prisma schema from existing database
4. ✅ Generate Prisma Client
5. ✅ Refactor database config to use Prisma
6. ✅ Replace raw SQL queries with Prisma queries
7. ✅ Test API endpoints
8. ✅ Validate data consistency with .NET app

**Setup:**

```bash
cd contoso-api
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite
```

**File:** `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:../school.db"
}

model Student {
  ID              Int          @id @default(autoincrement())
  LastName        String
  FirstMidName    String
  EnrollmentDate  DateTime
  Enrollments     Enrollment[]
}

model Instructor {
  ID                Int                @id @default(autoincrement())
  LastName          String
  FirstMidName      String
  HireDate          DateTime
  OfficeAssignment  OfficeAssignment?
  Courses           Course[]          @relation("CourseInstructor")
}

model Course {
  CourseID    Int          @id
  Title       String
  Credits     Int
  DepartmentID Int
  Department  Department   @relation(fields: [DepartmentID], references: [DepartmentID])
  Enrollments Enrollment[]
  Instructors Instructor[] @relation("CourseInstructor")
}

model Department {
  DepartmentID Int        @id @default(autoincrement())
  Name         String     @unique
  Budget       Float
  StartDate    DateTime
  InstructorID Int?
  LastModified DateTime   @default(now()) @updatedAt
  Courses      Course[]
}

model Enrollment {
  EnrollmentID Int       @id @default(autoincrement())
  CourseID     Int
  StudentID    Int
  Grade        String?
  Course       Course    @relation(fields: [CourseID], references: [CourseID])
  Student      Student   @relation(fields: [StudentID], references: [ID])
}

model OfficeAssignment {
  InstructorID Int        @id
  Location     String
  Instructor   Instructor @relation(fields: [InstructorID], references: [ID])
}
```

**File:** `src/config/database.ts`
```typescript
// Before (mssql)
import sql from 'mssql';

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
};

export const pool = new sql.ConnectionPool(config);

// After (Prisma)
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
```

**Example Query Refactor:**

```typescript
// Before (raw SQL)
const result = await pool.request()
    .input('id', sql.Int, studentId)
    .query('SELECT * FROM Student WHERE ID = @id');

// After (Prisma)
const student = await prisma.student.findUnique({
    where: { ID: studentId },
    include: { Enrollments: true }
});
```

**Deliverables:**
- Prisma schema file
- Updated database configuration
- Refactored API routes to use Prisma
- API test results

---

### Phase 4: Testing & Validation (Week 4)

**Goal:** Comprehensive testing of migrated application

**Testing Strategy:**

#### Unit Tests
- [ ] EF Core DbContext tests with SQLite in-memory database
- [ ] Prisma query tests
- [ ] Business logic tests (independent of database)

#### Integration Tests
- [ ] CRUD operations on all entities (.NET)
- [ ] API endpoint tests (Node.js)
- [ ] Cross-app data consistency tests

#### Manual Testing
- [ ] All Razor Pages (Students, Instructors, Courses, Departments)
- [ ] Pagination and sorting
- [ ] Concurrency conflict handling (Department edit by two users)
- [ ] Data seeding on fresh database

#### Performance Tests
- [ ] Page load times (compare to SQL Server baseline)
- [ ] Concurrent user simulation (10 users)
- [ ] Query performance benchmarks

**Validation Criteria:**
- ✅ All automated tests pass
- ✅ No data loss or corruption
- ✅ Performance within acceptable range (< 10% degradation)
- ✅ Concurrency handling works correctly
- ✅ Foreign key constraints enforced

**Deliverables:**
- Test report with pass/fail status
- Performance comparison report
- List of issues/bugs found and resolved

---

### Phase 5: Documentation & Deployment (Week 5)

**Goal:** Update documentation and prepare for deployment

**Tasks:**
1. ✅ Update README.md with SQLite setup instructions
2. ✅ Update migration documentation
3. ✅ Create developer setup guide (no SQL Server needed)
4. ✅ Update CI/CD pipelines (remove SQL Server dependency)
5. ✅ Create deployment guide for production (SQLite considerations)
6. ✅ Update ADR index with new decisions
7. ✅ Create rollback procedure document

**Documentation Updates:**

**File:** `README.md`
```markdown
## Prerequisites

- .NET 8 SDK
- Node.js 18+
- **No database server required** (uses SQLite)

## Setup

1. Clone repository
2. Restore .NET dependencies: `dotnet restore`
3. Apply database migrations: `dotnet ef database update`
4. Run application: `dotnet run --project ContosoUniversity`

Database file will be created at `school.db` in project root.
```

**CI/CD Updates:**
- Remove SQL Server service container from GitHub Actions
- Use SQLite in-memory or file-based database for tests
- Update deployment scripts (copy `school.db` to server)

**Deliverables:**
- Updated README and setup guides
- Updated CI/CD workflows
- Deployment runbook
- Migration retrospective document

---

## Data Migration Approach

### Export from SQL Server

**Tool:** BCP Utility + PowerShell

**Script:** `scripts/export-data.ps1`
```powershell
# Export all tables to CSV
$tables = @('Student', 'Instructor', 'Course', 'Department', 'Enrollment', 'OfficeAssignment')
$server = 'localhost'
$database = 'SchoolContext'

foreach ($table in $tables) {
    bcp "$database.dbo.$table" out "$table.csv" -S $server -T -c -t ","
}
```

### Import to SQLite

**Script:** `scripts/import-data.sql`
```sql
-- Disable foreign keys during import
PRAGMA foreign_keys = OFF;

-- Import data (example for Student table)
.mode csv
.import Student.csv Student

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

-- Validate
SELECT COUNT(*) FROM Student;
```

### Validation Queries

```sql
-- Row count validation
SELECT 
    'Student' AS TableName, COUNT(*) AS RowCount FROM Student
UNION ALL
SELECT 'Instructor', COUNT(*) FROM Instructor
UNION ALL
SELECT 'Course', COUNT(*) FROM Course
-- ... etc
```

### Data Transformation Considerations

| Data Type | SQL Server | SQLite | Transformation |
|-----------|------------|--------|----------------|
| `DATETIME2` | Native | TEXT/REAL/INTEGER | Store as ISO8601 text: `YYYY-MM-DD HH:MM:SS` |
| `UNIQUEIDENTIFIER` | Native | TEXT/BLOB | Convert to TEXT (hex string) |
| `ROWVERSION` | `TIMESTAMP` | INTEGER | Convert to `LastModified` DATETIME or Version INTEGER |
| `DECIMAL(18,2)` | Native | REAL | SQLite uses floating point; acceptable for Budget |
| `NVARCHAR(MAX)` | Native | TEXT | Direct mapping |

---

## Testing Strategy

### Test Environments

1. **Local Development**
   - SQLite file: `school-dev.db`
   - Fresh database created on each `dotnet ef database update`
   - Fast iteration

2. **CI/CD (GitHub Actions)**
   - SQLite in-memory database (`:memory:`)
   - Fastest test execution
   - No file persistence needed

3. **Staging**
   - SQLite file: `school-staging.db`
   - Mirrors production setup
   - Used for UAT

4. **Production**
   - SQLite file: `school.db`
   - Regular backups (file copy)
   - Read-only replica option (copy file for reporting)

### Automated Test Strategy

**Unit Tests:**
```csharp
// Use EF Core SQLite in-memory database
public class StudentRepositoryTests
{
    private SchoolContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<SchoolContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;

        var context = new SchoolContext(options);
        context.Database.OpenConnection(); // Required for in-memory
        context.Database.EnsureCreated();

        return context;
    }

    [Fact]
    public void CanCreateStudent()
    {
        using var context = GetInMemoryDbContext();
        
        var student = new Student { LastName = "Doe", FirstMidName = "John" };
        context.Students.Add(student);
        context.SaveChanges();

        Assert.True(student.ID > 0);
    }
}
```

**Integration Tests:**
```csharp
// Use SQLite file database for integration tests
public class IntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task GetStudentList_ReturnsSuccess()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/Students");

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Contains("Students", await response.Content.ReadAsStringAsync());
    }
}
```

---

## Rollback Plan

### Scenario 1: Migration Failure During Development

**Symptoms:** SQLite migration doesn't work, data corruption, critical bugs

**Action:**
1. Revert to SQL Server connection string
2. Restore SQL Server backup
3. Revert code changes (`git checkout` previous commit)
4. Resume using SQL Server

**Complexity:** Low (no production impact)

### Scenario 2: Post-Deployment Issues (Production)

**Symptoms:** Performance degradation, concurrency errors, data inconsistency

**Action:**
1. Put application in maintenance mode
2. Restore SQL Server backup
3. Update connection strings to point back to SQL Server
4. Redeploy previous version of application
5. Communicate to users

**Complexity:** Medium (requires coordination)

**Prevention:**
- Maintain SQL Server backup for 30 days post-migration
- Keep SQL Server-compatible code branch
- Blue-green deployment strategy

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Data loss during migration** | Low | Critical | Multiple backups, validation scripts, dry runs |
| **Performance degradation** | Medium | High | Benchmark testing, optimization, fallback to SQL Server |
| **Concurrency bugs** | Medium | Medium | Replace RowVersion correctly, test conflict scenarios |
| **SQLite file corruption** | Low | High | Regular backups, write-ahead logging (WAL mode), file system monitoring |
| **Developer resistance** | Medium | Low | Training, documentation, pair programming |
| **Production scalability issues** | High | Critical | ⚠️ **Assess user load first**; SQLite not suitable for high-write workloads |
| **Missing SQL Server features** | Medium | Medium | Identify features used, find alternatives or app-level implementation |
| **Type mapping bugs** | Low | Medium | Comprehensive testing, especially dates and decimals |

**High-Priority Risks:**
1. ⚠️ **Production Scalability** - If concurrent users >50 or write-heavy workload, SQLite may not be suitable
2. ⚠️ **Concurrency Control** - Replacing RowVersion requires careful testing

---

## Effort Estimation

### Time Breakdown by Phase

| Phase | Task | Effort (Hours) | Owner |
|-------|------|----------------|-------|
| **Phase 1: Schema Migration** | Analyze schema | 4h | Data Engineer |
| | Create SQLite DDL | 8h | Data Engineer |
| | Export SQL Server data | 4h | Data Engineer |
| | Import to SQLite | 4h | Data Engineer |
| | Validation | 4h | QA |
| **Phase 2: .NET Migration** | Upgrade to .NET 8 | 8h | Backend Dev |
| | Install SQLite packages | 1h | Backend Dev |
| | Update DbContext | 2h | Backend Dev |
| | Update Department concurrency | 6h | Backend Dev |
| | Create new migrations | 3h | Backend Dev |
| | Test all CRUD | 8h | QA |
| **Phase 3: Node.js Migration** | Install Prisma | 1h | Backend Dev |
| | Create Prisma schema | 6h | Backend Dev |
| | Refactor queries | 12h | Backend Dev |
| | Test API | 6h | QA |
| **Phase 4: Testing** | Unit tests | 12h | Dev Team |
| | Integration tests | 8h | Dev Team |
| | Manual testing | 8h | QA |
| | Performance tests | 6h | QA |
| **Phase 5: Documentation** | Update docs | 8h | Tech Writer |
| | Update CI/CD | 4h | DevOps |
| | Deployment guide | 4h | Tech Writer |
| **TOTAL** | | **127 hours** | **~3-4 weeks** |

**Assumptions:**
- Team of 3 developers + 1 QA + 1 DevOps
- Parallel work where possible
- No major blockers or unforeseen issues

---

## Decision Matrix

### Should We Migrate to SQLite?

Use this decision tree to determine if migration is appropriate:

```
Is this a demo/educational/low-traffic application?
├─ YES → Continue
│  └─ Are concurrent writes <10/second?
│     ├─ YES → Continue
│     │  └─ Can you sacrifice some enterprise features (stored procs, replication)?
│     │     ├─ YES → ✅ MIGRATE TO SQLITE
│     │     └─ NO → ❌ STAY WITH SQL SERVER
│     └─ NO → ❌ STAY WITH SQL SERVER
│
└─ NO → Is this a production app with >50 concurrent users?
   ├─ YES → ❌ STAY WITH SQL SERVER
   └─ NO → Evaluate case-by-case
```

### Decision Recommendation

**For ContosoUniversity:**

| Criterion | Assessment | Recommendation |
|-----------|------------|----------------|
| **Application Type** | Educational demo | ✅ Suitable for SQLite |
| **Expected Traffic** | Low (<10 concurrent users) | ✅ Suitable for SQLite |
| **Write Intensity** | Low (mostly reads) | ✅ Suitable for SQLite |
| **Cost Sensitivity** | High (demo app) | ✅ SQLite saves costs |
| **Deployment Complexity** | Want simplification | ✅ SQLite simplifies |
| **Need Enterprise Features** | No stored procs, no replication | ✅ SQLite sufficient |

**VERDICT:** ✅ **Recommend migrating to SQLite**

**Conditions:**
1. Application remains a demo/educational project
2. Production traffic stays below 50 concurrent users
3. Write operations remain low (<10 writes/second)
4. Team is comfortable with limitations (no RowVersion, limited concurrency)

**If conditions change** (e.g., becomes production app with high traffic):
- Maintain SQL Server migration path
- Re-evaluate scalability requirements
- Consider PostgreSQL as middle-ground alternative

---

## Alternative: PostgreSQL Consideration

If SQLite limitations are concerning but SQL Server costs are prohibitive, consider **PostgreSQL**:

**Pros:**
- ✅ Free and open-source
- ✅ Excellent concurrency support
- ✅ Rich feature set (closer to SQL Server)
- ✅ Strong community and ecosystem
- ✅ Horizontal scalability (with extensions)

**Cons:**
- ⚠️ Requires database server (not embedded)
- ⚠️ More complex setup than SQLite
- ⚠️ Migration from SQL Server still required (but more features compatible)

**When to choose PostgreSQL over SQLite:**
- Need better concurrency than SQLite
- Want free alternative to SQL Server
- Planning for future scalability
- Need advanced features (JSON, full-text search, etc.)

---

## Next Steps

### Immediate Actions (Week 1)

1. **Stakeholder Approval**
   - [ ] Review this plan with product owner
   - [ ] Get approval for SQLite migration
   - [ ] Confirm acceptable downtime for production migration (if applicable)

2. **Technical Validation**
   - [ ] Create proof-of-concept branch
   - [ ] Migrate one entity (e.g., Student) to SQLite
   - [ ] Validate performance and functionality
   - [ ] Present findings to team

3. **Resource Allocation**
   - [ ] Assign team members to phases
   - [ ] Schedule training on SQLite and Prisma
   - [ ] Set up tracking (Jira/Azure DevOps)

### Go/No-Go Criteria

**Proceed with migration if:**
- ✅ Stakeholders approve
- ✅ POC demonstrates feasibility
- ✅ Team has capacity (3-4 weeks)
- ✅ Rollback plan is acceptable
- ✅ Performance meets requirements

**Do NOT proceed if:**
- ❌ Application will have high concurrent writes
- ❌ Enterprise features (stored procs, replication) are required
- ❌ Team lacks capacity or training
- ❌ Production scalability concerns exist

---

## Conclusion

This migration plan provides a comprehensive roadmap for migrating ContosoUniversity from **SQL Server** to **SQLite** and modernizing the ORM approach with **Entity Framework Core 8** (.NET) and **Prisma** (Node.js).

**Key Takeaways:**
1. **Feasibility:** Migration is technically feasible with moderate effort (3-4 weeks)
2. **Benefits:** Simplified development, reduced costs, improved portability
3. **Risks:** Concurrency limitations, missing RowVersion, scalability ceiling
4. **Recommendation:** Proceed if application remains demo/low-traffic; re-evaluate for high-traffic production use

**Success Criteria:**
- Zero data loss
- All features working correctly
- Performance within 10% of SQL Server baseline
- Team comfortable with new stack
- Comprehensive documentation

**Final Recommendation:** ✅ **APPROVED** for demo/educational use; revisit if production requirements change.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Migration Engineering Team | Initial comprehensive migration plan |

---

## Feedback & Questions

Please direct questions or feedback to:
- **Technical Questions:** Migration Engineering Team
- **Business Questions:** Product Owner
- **Deployment Questions:** DevOps Team

**Review Status:** ⏳ Awaiting stakeholder approval

---

_This document is a living document and will be updated as the migration progresses._
