---
title: 'SQLite Testing & Validation Plan - ContosoUniversity'
last_updated: '2025-12-30'
owner: 'Migration Architect'
status: 'Planning Phase'
database: 'SQL Server → SQLite Migration'
test_framework: 'xUnit, MSTest, Integration Tests'
---

# SQLite Testing & Validation Plan - ContosoUniversity

## Executive Summary

This document defines a comprehensive testing and validation strategy for migrating the ContosoUniversity application from SQL Server to SQLite. It establishes unit, integration, and end-to-end test frameworks for data operations, migration scripts, and rollback verification. The plan includes data reconciliation procedures (row counts, checksums, referential integrity checks), golden dataset validation, and shadow traffic testing protocols.

**Migration Scope:** SQL Server → SQLite database migration with full feature parity  
**Testing Objective:** Zero data loss, 100% referential integrity, verified rollback capability  
**Risk Level:** 🟡 **MEDIUM** - SQLite has feature limitations compared to SQL Server  
**Quality Gate:** All tests must pass before production deployment

**Key Testing Pillars:**
1. **Unit Tests** - Individual migration script validation
2. **Integration Tests** - End-to-end data pipeline verification
3. **E2E Tests** - Application-level functional validation
4. **Data Reconciliation** - Automated data quality checks
5. **Shadow Traffic** - Production traffic replay validation
6. **Rollback Verification** - Disaster recovery testing

---

## Table of Contents

- [Testing Strategy Overview](#testing-strategy-overview)
- [Test Environment Setup](#test-environment-setup)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [End-to-End Tests](#end-to-end-tests)
- [Data Reconciliation Tests](#data-reconciliation-tests)
- [Migration Script Testing](#migration-script-testing)
- [Rollback Verification Tests](#rollback-verification-tests)
- [Golden Dataset Validation](#golden-dataset-validation)
- [Shadow Traffic Validation](#shadow-traffic-validation)
- [Test Matrix & Pass/Fail Criteria](#test-matrix--passfail-criteria)
- [Test Execution Schedule](#test-execution-schedule)
- [Tooling & Automation](#tooling--automation)
- [Monitoring & Observability](#monitoring--observability)

---

## Testing Strategy Overview

### Testing Philosophy

**Test Pyramid Approach:**
```
                    /\
                   /E2E\          ← 10% (Critical user workflows)
                  /------\
                 /  INT   \       ← 30% (Data operations, API contracts)
                /----------\
               /    UNIT     \    ← 60% (Migration scripts, transformations)
              /--------------\
```

### Testing Phases

| Phase | Duration | Focus | Pass Criteria |
|-------|----------|-------|---------------|
| **Phase 1: Unit Testing** | Week 1-2 | Migration script validation, transformation logic | 100% unit test pass rate |
| **Phase 2: Integration Testing** | Week 3-4 | Data pipeline, CRUD operations, referential integrity | 100% integration test pass, zero data discrepancies |
| **Phase 3: E2E Testing** | Week 5 | Application functionality, user workflows | All critical paths functional |
| **Phase 4: Shadow Testing** | Week 6-7 | Production traffic replay, performance validation | <5% error rate, performance within 10% baseline |
| **Phase 5: Rollback Testing** | Week 8 | Disaster recovery, data restoration | Successful rollback in <30 minutes |

### Quality Gates

Before proceeding to next phase:
- ✅ 100% of current phase tests passing
- ✅ Zero critical defects
- ✅ Code review approval
- ✅ Documentation updated
- ✅ Stakeholder sign-off

---

## Test Environment Setup

### Environment Configuration

| Environment | Purpose | Database | Data Volume | Access |
|-------------|---------|----------|-------------|--------|
| **LOCAL-DEV** | Developer unit testing | SQLite (in-memory) | Minimal seed data (50 rows) | All developers |
| **TEST** | Integration testing | SQLite (file-based) | Partial dataset (10% production) | QA team |
| **STAGING** | E2E & shadow testing | SQLite (file-based) | Full production clone | QA + DevOps |
| **CANARY** | Production validation | SQLite (file-based) | Live production data | Limited access |

### Prerequisites

**Software Requirements:**
```bash
# .NET SDK
dotnet --version  # Requires 6.0+

# SQLite
sqlite3 --version  # Requires 3.35.0+

# Test Frameworks
dotnet add package xunit --version 2.6.6
dotnet add package xunit.runner.visualstudio --version 2.5.6
dotnet add package Microsoft.NET.Test.Sdk --version 17.8.0
dotnet add package FluentAssertions --version 6.12.0
dotnet add package Microsoft.EntityFrameworkCore.Sqlite --version 6.0.25
dotnet add package Microsoft.EntityFrameworkCore.InMemory --version 6.0.25

# Testing utilities
dotnet add package Testcontainers --version 3.7.0
dotnet add package Bogus --version 35.0.1  # Fake data generation
dotnet add package Respawn --version 6.2.1  # Database cleanup
```

**Test Data Requirements:**
- **Golden Dataset:** 500 records across all entities (immutable reference)
- **Seed Dataset:** Minimal valid data (current `DbInitializer` seed data)
- **Synthetic Dataset:** Generated test data using Bogus library
- **Production Clone:** Sanitized production data (PII masked)

### Connection Strings

```json
{
  "ConnectionStrings": {
    "SchoolContext_SqlServer": "Server=(localdb)\\mssqllocaldb;Database=SchoolContext;Trusted_Connection=True;",
    "SchoolContext_SQLite_InMemory": "Data Source=:memory:",
    "SchoolContext_SQLite_File": "Data Source=school_test.db",
    "SchoolContext_SQLite_Staging": "Data Source=school_staging.db"
  }
}
```

### Test Fixture Setup

```csharp
public class SQLiteDatabaseFixture : IDisposable
{
    public SchoolContext Context { get; private set; }
    private readonly DbConnection _connection;
    
    public SQLiteDatabaseFixture()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        
        var options = new DbContextOptionsBuilder<SchoolContext>()
            .UseSqlite(_connection)
            .Options;
        
        Context = new SchoolContext(options);
        Context.Database.EnsureCreated();
        
        // Load golden dataset
        LoadGoldenDataset();
    }
    
    private void LoadGoldenDataset()
    {
        // Seed test data
        DbInitializer.Initialize(Context);
    }
    
    public void Dispose()
    {
        Context?.Dispose();
        _connection?.Dispose();
    }
}
```

---

## Unit Tests

### Migration Script Unit Tests

**Objective:** Validate individual migration scripts execute correctly without side effects

#### Test Categories

##### 1. Schema Migration Tests

| Test ID | Test Name | Description | Pass Criteria |
|---------|-----------|-------------|---------------|
| **UNIT-MIG-001** | Test_Initial_Migration_Creates_All_Tables | Apply initial migration to empty SQLite DB | 7 tables created (Student, Instructor, Course, Enrollment, Department, OfficeAssignment, CourseInstructor) |
| **UNIT-MIG-002** | Test_Migration_Creates_Primary_Keys | Verify all PKs created | All tables have PK constraints |
| **UNIT-MIG-003** | Test_Migration_Creates_Foreign_Keys | Verify all FKs created | All expected FK constraints exist |
| **UNIT-MIG-004** | Test_Migration_Creates_Indexes | Verify indexes created | All performance indexes present |
| **UNIT-MIG-005** | Test_Migration_Idempotency | Apply same migration twice | Second apply is no-op or succeeds |
| **UNIT-MIG-006** | Test_Migration_Rollback | Rollback migration | Database reverted to pre-migration state |

**Example Test:**
```csharp
[Fact]
public async Task Test_Initial_Migration_Creates_All_Tables()
{
    // Arrange
    var options = new DbContextOptionsBuilder<SchoolContext>()
        .UseSqlite("Data Source=:memory:")
        .Options;
    
    using var context = new SchoolContext(options);
    
    // Act
    await context.Database.MigrateAsync();
    
    // Assert
    var tables = await context.Database
        .SqlQueryRaw<string>("SELECT name FROM sqlite_master WHERE type='table'")
        .ToListAsync();
    
    tables.Should().Contain("Student");
    tables.Should().Contain("Instructor");
    tables.Should().Contain("Course");
    tables.Should().Contain("Enrollments");
    tables.Should().Contain("Departments");
    tables.Should().Contain("OfficeAssignments");
    tables.Should().Contain("CourseInstructor");
}
```

##### 2. Data Transformation Tests

| Test ID | Test Name | Description | Pass Criteria |
|---------|-----------|-------------|---------------|
| **UNIT-XFORM-001** | Test_Student_Data_Transformation | Transform Student entity from SQL Server to SQLite format | All fields mapped correctly, no data loss |
| **UNIT-XFORM-002** | Test_DateTime_Conversion | Convert SQL Server datetime2 to SQLite TEXT/INTEGER | Timestamps preserve millisecond precision |
| **UNIT-XFORM-003** | Test_Decimal_Conversion | Convert SQL Server decimal to SQLite REAL | Precision maintained within tolerance (0.01) |
| **UNIT-XFORM-004** | Test_GUID_Conversion | Convert uniqueidentifier to TEXT | GUIDs preserved as valid strings |
| **UNIT-XFORM-005** | Test_Null_Value_Handling | Validate NULL handling | NULLs preserved where allowed |
| **UNIT-XFORM-006** | Test_Unicode_String_Preservation | Test nvarchar → TEXT with unicode | Unicode characters preserved (e.g., é, ñ, 中) |

**Example Test:**
```csharp
[Theory]
[InlineData("2020-09-01", "2020-09-01T00:00:00")]
[InlineData("2021-12-31", "2021-12-31T00:00:00")]
public void Test_DateTime_Conversion(string sqlServerDate, string expectedSqliteDate)
{
    // Arrange
    var sourceDate = DateTime.Parse(sqlServerDate);
    
    // Act
    var student = new Student
    {
        FirstMidName = "Test",
        LastName = "Student",
        EnrollmentDate = sourceDate
    };
    
    // Insert into SQLite
    _context.Students.Add(student);
    _context.SaveChanges();
    
    // Assert
    var savedStudent = _context.Students.First();
    savedStudent.EnrollmentDate.ToString("yyyy-MM-ddTHH:mm:ss")
        .Should().Be(expectedSqliteDate);
}
```

##### 3. Constraint Validation Tests

| Test ID | Test Name | Description | Pass Criteria |
|---------|-----------|-------------|---------------|
| **UNIT-CONST-001** | Test_Primary_Key_Uniqueness | Insert duplicate PK | Exception thrown |
| **UNIT-CONST-002** | Test_Foreign_Key_Enforcement | Insert record with invalid FK | Exception thrown |
| **UNIT-CONST-003** | Test_NOT_NULL_Enforcement | Insert NULL in NOT NULL column | Exception thrown |
| **UNIT-CONST-004** | Test_Max_Length_Enforcement | Insert string exceeding max length | Exception thrown or truncation |
| **UNIT-CONST-005** | Test_Check_Constraints | Insert invalid data (if check constraints exist) | Exception thrown |

**Example Test:**
```csharp
[Fact]
public async Task Test_Foreign_Key_Enforcement()
{
    // Arrange
    var invalidEnrollment = new Enrollment
    {
        StudentID = 99999,  // Non-existent student
        CourseID = 1,
        Grade = Grade.A
    };
    
    _context.Enrollments.Add(invalidEnrollment);
    
    // Act & Assert
    var exception = await Record.ExceptionAsync(
        async () => await _context.SaveChangesAsync()
    );
    
    exception.Should().NotBeNull();
    exception.Should().BeOfType<DbUpdateException>();
}
```

### Unit Test Coverage Goals

| Category | Test Count | Coverage Target |
|----------|------------|-----------------|
| Schema Migrations | 6 tests | 100% |
| Data Transformations | 6 tests | 100% |
| Constraint Validation | 5 tests | 100% |
| **Total Unit Tests** | **17+ tests** | **100%** |

---

## Integration Tests

### Data Pipeline Integration Tests

**Objective:** Validate end-to-end data migration from SQL Server to SQLite

#### Test Categories

##### 1. CRUD Operation Tests

| Test ID | Test Name | Description | Pass Criteria |
|---------|-----------|-------------|---------------|
| **INT-CRUD-001** | Test_Create_Student_SQLite | Create student in SQLite DB | Student persisted, ID assigned |
| **INT-CRUD-002** | Test_Read_Student_SQLite | Read student by ID | All properties match |
| **INT-CRUD-003** | Test_Update_Student_SQLite | Update student information | Changes persisted |
| **INT-CRUD-004** | Test_Delete_Student_SQLite | Delete student (no enrollments) | Student removed |
| **INT-CRUD-005** | Test_Delete_Student_With_Enrollments | Delete student with enrollments | Cascade delete or FK exception |
| **INT-CRUD-006** | Test_Bulk_Insert_Students | Insert 1000 students | All inserted, no duplicates |
| **INT-CRUD-007** | Test_Concurrent_Writes | Simulate concurrent updates | No data corruption |

**Example Test:**
```csharp
[Fact]
public async Task Test_Create_Student_SQLite()
{
    // Arrange
    using var context = _fixture.CreateContext();
    var student = new Student
    {
        FirstMidName = "John",
        LastName = "Doe",
        EnrollmentDate = DateTime.Parse("2020-09-01")
    };
    
    // Act
    context.Students.Add(student);
    await context.SaveChangesAsync();
    
    // Assert
    student.ID.Should().BeGreaterThan(0);
    
    var savedStudent = await context.Students
        .FirstOrDefaultAsync(s => s.ID == student.ID);
    
    savedStudent.Should().NotBeNull();
    savedStudent.LastName.Should().Be("Doe");
    savedStudent.FirstMidName.Should().Be("John");
}
```

##### 2. Relationship & Foreign Key Tests

| Test ID | Test Name | Description | Pass Criteria |
|---------|-----------|-------------|---------------|
| **INT-REL-001** | Test_Student_Enrollment_Relationship | Create student with enrollments | Navigation properties populated |
| **INT-REL-002** | Test_Course_Department_Relationship | Create course with department | FK constraint enforced |
| **INT-REL-003** | Test_Instructor_Course_ManyToMany | Assign instructors to courses | Junction table populated |
| **INT-REL-004** | Test_Instructor_OfficeAssignment_OneToOne | Assign office to instructor | One-to-one constraint enforced |
| **INT-REL-005** | Test_Cascade_Delete_Student_Enrollments | Delete student with enrollments | Enrollments cascade deleted (if configured) |
| **INT-REL-006** | Test_Orphan_Record_Prevention | Delete department with courses | FK constraint prevents deletion |

**Example Test:**
```csharp
[Fact]
public async Task Test_Student_Enrollment_Relationship()
{
    // Arrange
    using var context = _fixture.CreateContext();
    var student = new Student
    {
        FirstMidName = "Jane",
        LastName = "Smith",
        EnrollmentDate = DateTime.Parse("2021-09-01")
    };
    
    var course = await context.Courses.FirstAsync();
    
    var enrollment = new Enrollment
    {
        Student = student,
        CourseID = course.CourseID,
        Grade = Grade.A
    };
    
    context.Enrollments.Add(enrollment);
    await context.SaveChangesAsync();
    
    // Act
    var loadedStudent = await context.Students
        .Include(s => s.Enrollments)
        .FirstAsync(s => s.ID == student.ID);
    
    // Assert
    loadedStudent.Enrollments.Should().HaveCount(1);
    loadedStudent.Enrollments.First().CourseID.Should().Be(course.CourseID);
}
```

##### 3. Migration Data Transfer Tests

| Test ID | Test Name | Description | Pass Criteria |
|---------|-----------|-------------|---------------|
| **INT-MIG-001** | Test_Full_Database_Migration | Migrate all data from SQL Server to SQLite | Row counts match, no errors |
| **INT-MIG-002** | Test_Incremental_Migration | Migrate new records only | Only new records transferred |
| **INT-MIG-003** | Test_Migration_Resume_After_Failure | Simulate failure and resume | Migration completes from checkpoint |
| **INT-MIG-004** | Test_Large_Dataset_Migration | Migrate 100K+ records | All records transferred, performance acceptable |
| **INT-MIG-005** | Test_Special_Characters_Migration | Migrate data with unicode/special chars | Characters preserved |

##### 4. Query Performance Tests

| Test ID | Test Name | Description | Pass Criteria |
|---------|-----------|-------------|---------------|
| **INT-PERF-001** | Test_Student_List_Query_Performance | Query 1000 students with pagination | <100ms response time |
| **INT-PERF-002** | Test_Complex_Join_Performance | Query students with enrollments and courses | <200ms response time |
| **INT-PERF-003** | Test_Aggregate_Query_Performance | Count enrollments by course | <50ms response time |
| **INT-PERF-004** | Test_Search_Query_Performance | Search students by name (LIKE query) | <150ms response time |

### Integration Test Coverage Goals

| Category | Test Count | Coverage Target |
|----------|------------|-----------------|
| CRUD Operations | 7 tests | 100% |
| Relationships & FKs | 6 tests | 100% |
| Migration Transfer | 5 tests | 100% |
| Query Performance | 4 tests | Key queries validated |
| **Total Integration Tests** | **22+ tests** | **100%** |

---

## End-to-End Tests

### Application-Level E2E Tests

**Objective:** Validate complete user workflows function correctly with SQLite backend

#### Test Categories

##### 1. Student Management Workflows

| Test ID | Test Name | Description | Pass Criteria |
|---------|-----------|-------------|---------------|
| **E2E-STU-001** | Test_Create_Student_Workflow | Navigate to Create page, submit form | Student appears in list |
| **E2E-STU-002** | Test_Edit_Student_Workflow | Edit existing student, save changes | Changes reflected in details |
| **E2E-STU-003** | Test_Delete_Student_Workflow | Delete student, confirm deletion | Student removed from list |
| **E2E-STU-004** | Test_Student_Search_Workflow | Search for student by name | Correct results displayed |
| **E2E-STU-005** | Test_Student_Pagination_Workflow | Navigate through paginated list | All pages accessible |

##### 2. Enrollment Workflows

| Test ID | Test Name | Description | Pass Criteria |
|---------|-----------|-------------|---------------|
| **E2E-ENR-001** | Test_Enroll_Student_In_Course | Create enrollment for student | Enrollment visible in student details |
| **E2E-ENR-002** | Test_Update_Enrollment_Grade | Update grade for existing enrollment | Grade updated |
| **E2E-ENR-003** | Test_View_Student_Courses | View all courses for a student | All enrollments displayed |

##### 3. Instructor & Course Workflows

| Test ID | Test Name | Description | Pass Criteria |
|---------|-----------|-------------|---------------|
| **E2E-INS-001** | Test_Assign_Instructor_To_Course | Assign instructor to course | Assignment visible |
| **E2E-CRS-001** | Test_Create_Course_Workflow | Create new course | Course appears in list |
| **E2E-DEP-001** | Test_Create_Department_Workflow | Create new department | Department appears in list |

### E2E Test Coverage Goals

| Category | Test Count | Coverage Target |
|----------|------------|-----------------|
| Student Workflows | 5 tests | All critical paths |
| Enrollment Workflows | 3 tests | Key operations |
| Instructor/Course Workflows | 3 tests | Key operations |
| **Total E2E Tests** | **11+ tests** | **Critical paths only** |

---

## Data Reconciliation Tests

### Automated Data Quality Checks

**Objective:** Verify data integrity between SQL Server source and SQLite target

#### Reconciliation Test Matrix

| Test ID | Test Name | Check Type | Pass Criteria |
|---------|-----------|------------|---------------|
| **REC-001** | Test_Row_Count_Reconciliation | Count validation | Source count = Target count (all tables) |
| **REC-002** | Test_Checksum_Reconciliation | Data checksum | Checksums match for all tables |
| **REC-003** | Test_Primary_Key_Reconciliation | PK validation | All PKs exist in both DBs |
| **REC-004** | Test_Foreign_Key_Reconciliation | FK validation | All FK relationships valid |
| **REC-005** | Test_Null_Value_Reconciliation | NULL consistency | NULL patterns match |
| **REC-006** | Test_Unique_Constraint_Reconciliation | Uniqueness validation | No duplicate violations |
| **REC-007** | Test_Orphan_Record_Detection | Referential integrity | Zero orphan records |
| **REC-008** | Test_Data_Type_Compatibility | Type validation | All data types compatible |

### Row Count Reconciliation Implementation

```csharp
[Fact]
public async Task Test_Row_Count_Reconciliation()
{
    // Arrange
    using var sqlServerContext = CreateSqlServerContext();
    using var sqliteContext = CreateSqliteContext();
    
    // Act - Compare counts for all tables
    var results = new Dictionary<string, (int SqlServer, int SQLite)>
    {
        ["Students"] = (
            await sqlServerContext.Students.CountAsync(),
            await sqliteContext.Students.CountAsync()
        ),
        ["Instructors"] = (
            await sqlServerContext.Instructors.CountAsync(),
            await sqliteContext.Instructors.CountAsync()
        ),
        ["Courses"] = (
            await sqlServerContext.Courses.CountAsync(),
            await sqliteContext.Courses.CountAsync()
        ),
        ["Enrollments"] = (
            await sqlServerContext.Enrollments.CountAsync(),
            await sqliteContext.Enrollments.CountAsync()
        ),
        ["Departments"] = (
            await sqlServerContext.Departments.CountAsync(),
            await sqliteContext.Departments.CountAsync()
        ),
        ["OfficeAssignments"] = (
            await sqlServerContext.OfficeAssignments.CountAsync(),
            await sqliteContext.OfficeAssignments.CountAsync()
        )
    };
    
    // Assert
    foreach (var (table, counts) in results)
    {
        counts.SqlServer.Should().Be(counts.SQLite, 
            $"{table} row count mismatch: SQL Server={counts.SqlServer}, SQLite={counts.SQLite}");
    }
}
```

### Checksum Validation Implementation

```csharp
[Fact]
public async Task Test_Checksum_Reconciliation()
{
    // Arrange
    var validator = new ChecksumValidator();
    using var sqlServerContext = CreateSqlServerContext();
    using var sqliteContext = CreateSqliteContext();
    
    // Act
    var sqlServerChecksum = await validator.CalculateTableChecksum(sqlServerContext.Students);
    var sqliteChecksum = await validator.CalculateTableChecksum(sqliteContext.Students);
    
    // Assert
    sqlServerChecksum.Should().Be(sqliteChecksum, "Student table checksums do not match");
}
```

### Foreign Key Validation Implementation

```csharp
[Fact]
public async Task Test_Foreign_Key_Reconciliation()
{
    // Arrange
    using var context = CreateSqliteContext();
    
    // Act - Check for orphan enrollments
    var orphanEnrollments = await context.Enrollments
        .Where(e => !context.Students.Any(s => s.ID == e.StudentID)
                 || !context.Courses.Any(c => c.CourseID == e.CourseID))
        .ToListAsync();
    
    // Assert
    orphanEnrollments.Should().BeEmpty("No orphan enrollment records should exist");
}
```

---

## Migration Script Testing

### Migration Script Validation

**Objective:** Test migration scripts in isolation before production deployment

#### Test Scenarios

| Test ID | Test Name | Description | Pass Criteria |
|---------|-----------|-------------|---------------|
| **SCR-001** | Test_Migration_Script_Syntax | Validate SQL syntax | No syntax errors |
| **SCR-002** | Test_Migration_Script_Performance | Measure execution time | <5 minutes for 100K records |
| **SCR-003** | Test_Migration_Script_Idempotency | Run script twice | Second run succeeds or no-ops |
| **SCR-004** | Test_Migration_Script_Error_Handling | Simulate errors during migration | Script fails gracefully with rollback |
| **SCR-005** | Test_Migration_Script_Logging | Verify logging output | All operations logged |
| **SCR-006** | Test_Partial_Migration_Resume | Stop and resume migration | Resumes from checkpoint |

---

## Rollback Verification Tests

### Disaster Recovery Testing

**Objective:** Ensure database can be restored to pre-migration state within SLA

#### Rollback Test Matrix

| Test ID | Test Name | Description | Pass Criteria |
|---------|-----------|-------------|---------------|
| **RBK-001** | Test_Immediate_Rollback | Rollback immediately after migration | SQL Server restored, zero data loss |
| **RBK-002** | Test_Delayed_Rollback | Rollback after 1 hour of SQLite usage | SQL Server restored, new data preserved |
| **RBK-003** | Test_Rollback_Performance | Measure rollback execution time | <30 minutes to complete |
| **RBK-004** | Test_Rollback_Data_Integrity | Verify data after rollback | All data matches pre-migration snapshot |
| **RBK-005** | Test_Rollback_Application_Connectivity | Reconnect app to SQL Server | Application functional |
| **RBK-006** | Test_Partial_Rollback | Rollback single table | Only specified table restored |

### Rollback Test Implementation

```csharp
[Fact]
public async Task Test_Immediate_Rollback()
{
    // Arrange - Create backup
    var backupPath = "test_backup.db";
    File.Copy("school_test.db", backupPath, overwrite: true);
    
    // Capture pre-migration state
    using var preContext = CreateSqliteContext();
    var preStudentCount = await preContext.Students.CountAsync();
    
    // Simulate migration changes
    var newStudent = new Student
    {
        FirstMidName = "Migration",
        LastName = "Test",
        EnrollmentDate = DateTime.Now
    };
    preContext.Students.Add(newStudent);
    await preContext.SaveChangesAsync();
    
    // Act - Perform rollback
    File.Copy(backupPath, "school_test.db", overwrite: true);
    
    // Assert
    using var postContext = CreateSqliteContext();
    var postStudentCount = await postContext.Students.CountAsync();
    postStudentCount.Should().Be(preStudentCount, "Student count should match pre-migration");
}
```

---

## Golden Dataset Validation

### Reference Dataset Testing

**Objective:** Validate migration against known-good reference dataset

#### Golden Dataset Characteristics

**Dataset Composition:**
- **500 Students** (diverse enrollment dates, names with unicode)
- **50 Instructors** (various hire dates, office assignments)
- **100 Courses** (all departments, various credit values)
- **2000 Enrollments** (all grade values including NULL)
- **10 Departments** (with budgets, start dates)
- **30 Office Assignments** (one-to-one relationships)

**Dataset Features:**
- ✅ Edge cases (NULL values, max length strings, boundary dates)
- ✅ Unicode characters (é, ñ, 中, 日)
- ✅ Special characters (O'Brien, Smith-Jones)
- ✅ All relationship types (1:1, 1:N, M:N)
- ✅ Known checksums for validation

#### Golden Dataset Tests

| Test ID | Test Name | Description | Pass Criteria |
|---------|-----------|-------------|---------------|
| **GOLD-001** | Test_Golden_Dataset_Load | Load golden dataset into SQLite | All 500 students loaded |
| **GOLD-002** | Test_Golden_Dataset_Checksum | Verify checksums match | All table checksums match reference |
| **GOLD-003** | Test_Golden_Dataset_Relationships | Verify all FKs valid | Zero orphan records |
| **GOLD-004** | Test_Golden_Dataset_Queries | Run 20 predefined queries | All query results match expected |
| **GOLD-005** | Test_Golden_Dataset_Edge_Cases | Validate edge case handling | All edge cases handled correctly |

---

## Shadow Traffic Validation

### Production Traffic Replay Testing

**Objective:** Validate SQLite performance and correctness with production traffic patterns

#### Shadow Testing Architecture

```
Production Traffic
       ↓
   Load Balancer
    /         \
   /           \
SQL Server   SQLite (Shadow)
(Primary)    (Read-Only)
   ↓             ↓
Response    [Validation]
to User     [Logging]
```

### Shadow Testing Procedures

#### Traffic Capture & Replay

**Capture Period:** 7 days  
**Capture Rate:** 100% of production traffic  
**Replay Strategy:** Replay at same rate as production (1x speed)

**Validation Metrics:**

| Metric | Target | Measured | Pass/Fail |
|--------|--------|----------|-----------|
| Response Time (p50) | ≤110% of SQL Server | TBD | - |
| Response Time (p95) | ≤115% of SQL Server | TBD | - |
| Response Time (p99) | ≤120% of SQL Server | TBD | - |
| Error Rate | <5% | TBD | - |
| Data Accuracy | 100% | TBD | - |

---

## Test Matrix & Pass/Fail Criteria

### Comprehensive Test Matrix

| Test Category | Test Count | Pass Criteria | Priority | Blocker? |
|---------------|------------|---------------|----------|----------|
| **Unit Tests - Schema** | 6 | 100% pass | P0 | Yes |
| **Unit Tests - Transformations** | 6 | 100% pass | P0 | Yes |
| **Unit Tests - Constraints** | 5 | 100% pass | P0 | Yes |
| **Integration - CRUD** | 7 | 100% pass | P0 | Yes |
| **Integration - Relationships** | 6 | 100% pass | P0 | Yes |
| **Integration - Migration** | 5 | 100% pass | P0 | Yes |
| **Integration - Performance** | 4 | 80% pass | P1 | No |
| **E2E - Workflows** | 11 | 100% critical paths | P0 | Yes |
| **Data Reconciliation** | 8 | 100% pass | P0 | Yes |
| **Migration Scripts** | 6 | 100% pass | P0 | Yes |
| **Rollback Tests** | 6 | 100% pass | P0 | Yes |
| **Golden Dataset** | 5 | 100% pass | P1 | No |
| **Shadow Traffic** | Ongoing | <5% error rate, <20% perf delta | P1 | No |

**Total Tests:** 75+ automated tests

### Pass/Fail Criteria Definitions

#### Quality Gates

**Gate 1: Unit Tests**
- ✅ 100% unit tests passing
- ✅ Zero P0 defects
- ✅ Code review completed

**Gate 2: Integration Tests**
- ✅ 100% integration tests passing
- ✅ Zero data discrepancies
- ✅ Performance within 20% baseline

**Gate 3: E2E Tests**
- ✅ All critical workflows functional
- ✅ Zero P0/P1 defects in production scenarios

**Gate 4: Production Readiness**
- ✅ Shadow traffic <5% error rate
- ✅ Rollback tested successfully
- ✅ Golden dataset validated
- ✅ Stakeholder sign-off

---

## Test Execution Schedule

### Testing Timeline (8 Weeks)

| Week | Phase | Activities | Deliverables |
|------|-------|------------|--------------|
| **Week 1** | Setup | Test environment setup, framework configuration | Test infrastructure ready |
| **Week 2** | Unit Testing | Implement all unit tests | 17+ unit tests passing |
| **Week 3** | Integration (Part 1) | CRUD, relationships, FK tests | 13 integration tests passing |
| **Week 4** | Integration (Part 2) | Migration, performance tests | 9 additional integration tests passing |
| **Week 5** | E2E Testing | Critical workflow automation | 11 E2E tests passing |
| **Week 6** | Data Reconciliation | Implement reconciliation suite | Reconciliation reports generated |
| **Week 7** | Shadow Testing | Deploy shadow environment, collect data | 7 days of shadow traffic captured |
| **Week 8** | Rollback & UAT | Rollback drills, user acceptance testing | Production readiness sign-off |

---

## Tooling & Automation

### Test Automation Stack

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **xUnit** | Unit/Integration test framework | `.csproj` package reference |
| **FluentAssertions** | Readable assertions | `.csproj` package reference |
| **Bogus** | Fake data generation | `.csproj` package reference |
| **Respawn** | Database cleanup | `.csproj` package reference |
| **Playwright** | E2E browser automation | `npm install playwright` |
| **SQLite CLI** | Direct database queries | System package manager |
| **GitHub Actions** | CI/CD orchestration | `.github/workflows/test.yml` |

### CI/CD Pipeline Configuration

```yaml
name: SQLite Migration Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: 6.0.x
    
    - name: Run Unit Tests
      run: dotnet test --filter Category=Unit --logger "trx"
    
    - name: Run Integration Tests
      run: dotnet test --filter Category=Integration --logger "trx"
    
    - name: Run Data Reconciliation Tests
      run: dotnet test --filter Category=Reconciliation --logger "trx"
    
    - name: Generate Test Report
      if: always()
      uses: dorny/test-reporter@v1
      with:
        name: Test Results
        path: '**/*.trx'
        reporter: dotnet-trx
```

---

## Monitoring & Observability

### Test Observability

**Key Metrics:**
- Test pass rate (trend over time)
- Test execution time (detect slowdowns)
- Code coverage (per module)
- Defect density (defects per 1000 LOC)
- Mean time to recovery (MTTR for failed tests)

### Alerting

**Alert Conditions:**
- Test pass rate drops below 95% → Slack notification
- Integration test execution time >10 minutes → Email alert
- Data reconciliation mismatch detected → Page on-call engineer
- Shadow traffic error rate >5% → Halt migration, investigate

---

## Appendix: Rollback Runbook

### Emergency Rollback Procedure

**Trigger Conditions:**
- Data corruption detected
- >10% performance degradation
- Critical bugs in production
- Unrecoverable migration failure

**Rollback Steps:**
1. **Stop Application** (2 minutes)
2. **Restore SQL Server Backup** (10 minutes)
3. **Update Connection String** (1 minute)
4. **Restart Application** (2 minutes)
5. **Verify Health** (5 minutes)

**Total Rollback Time:** 20 minutes

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Migration Architect | Initial SQLite Testing & Validation Plan |

---

## Related Documents

- [Test-Strategy-&-Coverage.md](../../Test-Strategy-&-Coverage.md) - Overall test strategy
- [Data-Migration-Runbook.md](../../Data-Migration-Runbook.md) - Migration procedures
- [Data-Model-Catalog.md](../../Data-Model-Catalog.md) - Database schema reference
- [Compatibility-Gap-Analysis.md](../../Compatibility-Gap-Analysis.md) - SQL Server vs SQLite differences

---

**Last Updated:** 2025-12-30  
**Status:** ✅ Planning Complete - Ready for Implementation

**Next Steps:**
1. Set up test environments
2. Implement unit tests (Week 1-2)
3. Implement integration tests (Week 3-4)
4. Execute E2E and shadow testing (Week 5-7)
5. Production deployment (Week 8+)
