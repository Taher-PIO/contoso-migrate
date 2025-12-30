---
title: 'Test Strategy & Coverage - ContosoUniversity'
last_updated: '2025-12-30'
owner: 'Migration Architect'
status: 'Assessment Complete'
test_framework: 'None (To Be Implemented)'
coverage_target: 'TBD'
---

# Test Strategy & Coverage - ContosoUniversity

## Executive Summary

ContosoUniversity currently has **no automated test infrastructure** in place. The application lacks unit tests, integration tests, and end-to-end tests, creating significant risk for the upcoming migration. This document assesses the current testing state, identifies critical paths requiring coverage, and provides a comprehensive test strategy for the migration phases.

**Current State:**
- ❌ No test projects in the solution
- ❌ No test frameworks referenced (xUnit, NUnit, MSTest)
- ❌ No code coverage tools configured
- ❌ No test data fixtures or test harnesses
- ❌ CI/CD pipeline includes test step but no tests to execute
- ❌ Zero documented test cases

**Risk Level:** 🔴 **HIGH** - Migration without tests presents significant regression risk

**Recommendation:** Implement comprehensive test coverage **before** beginning migration work to ensure feature parity and prevent regressions.

---

## Table of Contents

- [Current Testing State Assessment](#current-testing-state-assessment)
- [Test Types Inventory](#test-types-inventory)
- [Coverage Analysis](#coverage-analysis)
- [Test Infrastructure & Frameworks](#test-infrastructure--frameworks)
- [Flaky Tests Documentation](#flaky-tests-documentation)
- [Test Data & Fixtures](#test-data--fixtures)
- [Prerequisites & Harnesses](#prerequisites--harnesses)
- [Critical Integration Tests](#critical-integration-tests)
- [Migration Test Plan](#migration-test-plan)
- [Recommendations](#recommendations)

---

## Current Testing State Assessment

### Findings

#### 1. **No Test Projects**
- Solution file (`ContosoUniversity.sln`) contains only the main application project
- No dedicated test projects (e.g., `ContosoUniversity.Tests`, `ContosoUniversity.IntegrationTests`)
- Running `dotnet test` finds zero test projects

#### 2. **No Test Frameworks**
The main project file (`ContosoUniversity.csproj`) includes:
```xml
<PackageReference Include="Microsoft.AspNetCore.Diagnostics.EntityFrameworkCore" Version="6.0.2" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="6.0.2" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="6.0.2" />
<PackageReference Include="Microsoft.VisualStudio.Web.CodeGeneration.Design" Version="6.0.2" />
```

**Missing test dependencies:**
- ❌ xUnit / NUnit / MSTest framework
- ❌ Moq / NSubstitute (mocking frameworks)
- ❌ FluentAssertions (assertion library)
- ❌ Coverlet / ReportGenerator (coverage tools)
- ❌ Microsoft.AspNetCore.Mvc.Testing (integration test support)
- ❌ Microsoft.EntityFrameworkCore.InMemory (in-memory database for testing)
- ❌ Testcontainers (Docker-based integration tests)

#### 3. **CI/CD Test Step**
The GitHub Actions workflow (`.github/workflows/dotnet.yml`) includes:
```yaml
- name: Test
  run: dotnet test --no-build --verbosity normal
```

This step will succeed with zero tests, potentially masking the lack of test coverage.

#### 4. **No Coverage Reports**
- No `lcov.xml`, `jacoco.xml`, or `cobertura.xml` files found
- No coverage tools configured in CI/CD
- No coverage badges or reporting

#### 5. **Application Structure**
The application uses:
- **Architecture:** ASP.NET Core 6.0 Razor Pages
- **Data Access:** Entity Framework Core 6.0.2 with SQL Server
- **Database:** SQL Server LocalDB (development), Azure SQL (production)
- **Seeding:** `DbInitializer.Initialize()` provides seed data
- **Entities:** Student, Instructor, Course, Enrollment, Department, OfficeAssignment

---

## Test Types Inventory

### Unit Tests ❌ NOT IMPLEMENTED

**Current Status:** None exist  
**Recommended Coverage:** 60-80% of business logic

**Proposed Structure:**
```
ContosoUniversity.Tests/
├── Models/
│   ├── StudentTests.cs
│   ├── InstructorTests.cs
│   ├── CourseTests.cs
│   ├── EnrollmentTests.cs
│   └── DepartmentTests.cs
├── PageModels/
│   ├── Students/
│   │   ├── IndexModelTests.cs
│   │   ├── CreateModelTests.cs
│   │   ├── EditModelTests.cs
│   │   └── DeleteModelTests.cs
│   ├── Instructors/
│   ├── Courses/
│   └── Departments/
├── Data/
│   ├── SchoolContextTests.cs
│   └── DbInitializerTests.cs
└── Utilities/
    ├── PaginatedListTests.cs
    └── UtilityTests.cs
```

**Key Test Scenarios:**
- Model validation rules
- Page model business logic
- Pagination logic (`PaginatedList<T>`)
- Data seeding logic
- Utility methods

### Integration Tests ❌ NOT IMPLEMENTED

**Current Status:** None exist  
**Recommended Coverage:** All CRUD operations and critical workflows

**Proposed Structure:**
```
ContosoUniversity.IntegrationTests/
├── Api/
│   ├── StudentEndpointsTests.cs
│   ├── InstructorEndpointsTests.cs
│   ├── CourseEndpointsTests.cs
│   └── DepartmentEndpointsTests.cs
├── Database/
│   ├── SchoolContextIntegrationTests.cs
│   ├── MigrationTests.cs
│   └── ConcurrencyTests.cs
├── Pages/
│   ├── StudentPagesIntegrationTests.cs
│   ├── InstructorPagesIntegrationTests.cs
│   └── CoursePagesIntegrationTests.cs
└── Infrastructure/
    ├── TestWebApplicationFactory.cs
    └── DatabaseFixture.cs
```

**Key Test Scenarios:**
- Full CRUD operations per entity
- Database concurrency handling (RowVersion)
- EF Core migrations application
- Search and pagination with database
- Transaction rollback scenarios
- Foreign key constraint validation

### End-to-End (E2E) Tests ❌ NOT IMPLEMENTED

**Current Status:** None exist  
**Recommended Coverage:** Critical user workflows

**Proposed Structure:**
```
ContosoUniversity.E2ETests/
├── StudentWorkflows/
│   ├── EnrollStudentE2ETests.cs
│   ├── UpdateStudentInfoE2ETests.cs
│   └── ViewStudentHistoryE2ETests.cs
├── InstructorWorkflows/
│   ├── AssignCourseE2ETests.cs
│   ├── ManageOfficeE2ETests.cs
│   └── ViewInstructorCoursesE2ETests.cs
├── CourseWorkflows/
│   ├── CreateCourseE2ETests.cs
│   ├── UpdateCourseE2ETests.cs
│   └── DeleteCourseE2ETests.cs
└── Infrastructure/
    ├── BrowserFixture.cs
    └── SeleniumWebDriver.cs
```

**Recommended Frameworks:**
- Selenium WebDriver for browser automation
- Playwright for modern web testing
- SpecFlow for BDD-style scenarios (optional)

**Key Test Scenarios:**
- Student enrollment workflow (create → assign courses → view)
- Instructor assignment workflow
- Course creation and department assignment
- Data validation and error handling
- Navigation and pagination
- Concurrency conflict resolution

---

## Coverage Analysis

### Current Coverage: 0% ❌

**No coverage data available** - No tests exist to measure coverage.

### Recommended Coverage Baselines

Once tests are implemented, target the following coverage levels:

| Coverage Type | Target | Critical Paths Target | Notes |
|---------------|--------|----------------------|-------|
| **Line Coverage** | 60-70% | 90%+ | Measure executed lines of code |
| **Branch Coverage** | 55-65% | 85%+ | Measure all conditional branches |
| **Method Coverage** | 70-80% | 95%+ | Measure methods executed |
| **Class Coverage** | 65-75% | 90%+ | Measure classes with tests |

### Critical Paths Requiring High Coverage

1. **Student Management** (95%+ coverage)
   - Student CRUD operations
   - Enrollment management
   - Student search and pagination

2. **Instructor Management** (95%+ coverage)
   - Instructor CRUD operations
   - Course assignments
   - Office assignment management

3. **Course Management** (95%+ coverage)
   - Course CRUD operations
   - Department relationships
   - Instructor assignments

4. **Data Integrity** (90%+ coverage)
   - Foreign key validation
   - Concurrency conflict detection
   - Transaction handling

5. **Database Seeding** (85%+ coverage)
   - `DbInitializer.Initialize()` method
   - Seed data validation

### Coverage Tools (To Be Implemented)

**Recommended Stack:**
```xml
<PackageReference Include="coverlet.collector" Version="6.0.0" />
<PackageReference Include="coverlet.msbuild" Version="6.0.0" />
<PackageReference Include="ReportGenerator" Version="5.2.0" />
```

**CI/CD Integration:**
```yaml
- name: Test with Coverage
  run: dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura

- name: Generate Coverage Report
  run: |
    dotnet tool install -g dotnet-reportgenerator-globaltool
    reportgenerator -reports:**/coverage.cobertura.xml -targetdir:coverage-report -reporttypes:Html

- name: Upload Coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage.cobertura.xml
```

---

## Test Infrastructure & Frameworks

### Recommended Test Frameworks

#### Primary Test Framework: xUnit
```xml
<PackageReference Include="xunit" Version="2.6.6" />
<PackageReference Include="xunit.runner.visualstudio" Version="2.5.6" />
<PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
```

**Rationale:**
- Industry standard for .NET Core applications
- Excellent Visual Studio and VS Code integration
- Strong community support
- Built-in parallelization
- Clean, attribute-based syntax

#### Mocking Framework: Moq
```xml
<PackageReference Include="Moq" Version="4.20.70" />
```

**Use Cases:**
- Mock `DbContext` for unit tests
- Mock repository patterns (if implemented)
- Isolate page models from data access

#### Assertions: FluentAssertions
```xml
<PackageReference Include="FluentAssertions" Version="6.12.0" />
```

**Benefits:**
- Readable, expressive assertions
- Better error messages
- Chainable assertions

#### Integration Testing: WebApplicationFactory
```xml
<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="6.0.25" />
```

**Use Cases:**
- In-memory test server for Razor Pages
- End-to-end request/response testing
- Authentication/authorization testing

#### Database Testing Options

**Option 1: In-Memory Database (Faster, Limited Realism)**
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="6.0.25" />
```

**Option 2: Testcontainers (Realistic, Slower)**
```xml
<PackageReference Include="Testcontainers" Version="3.7.0" />
<PackageReference Include="Testcontainers.MsSql" Version="3.7.0" />
```

**Recommendation:** Use **In-Memory** for unit tests, **Testcontainers** for integration tests.

---

## Flaky Tests Documentation

### Current Status: N/A (No Tests Exist)

**Definition:** Flaky tests are tests that produce inconsistent results (pass/fail) without code changes.

### Common Causes in ASP.NET Core Applications

1. **Database State Issues**
   - Tests sharing database instances
   - Seed data conflicts
   - Transaction not rolled back

2. **Timing Issues**
   - Asynchronous operations not awaited
   - Race conditions in parallel tests
   - Insufficient wait times for database commits

3. **Test Isolation Problems**
   - Static variables not reset
   - DbContext instances shared
   - Test order dependencies

4. **External Dependencies**
   - Network-dependent tests (should be mocked)
   - Time-dependent logic (use `ISystemClock`)
   - File system dependencies

### Prevention Strategies (For Future Implementation)

1. **Test Isolation**
   ```csharp
   public class StudentTests : IDisposable
   {
       private readonly DbContext _context;
       
       public StudentTests()
       {
           var options = new DbContextOptionsBuilder<SchoolContext>()
               .UseInMemoryDatabase(Guid.NewGuid().ToString())
               .Options;
           _context = new SchoolContext(options);
       }
       
       public void Dispose() => _context.Dispose();
   }
   ```

2. **Use Database Transactions**
   ```csharp
   [Fact]
   public async Task Test_With_Rollback()
   {
       using var transaction = await _context.Database.BeginTransactionAsync();
       
       // Test code here
       
       await transaction.RollbackAsync();
   }
   ```

3. **Avoid Test Order Dependencies**
   - Each test should be fully independent
   - Use `[Collection]` attribute to control parallelization
   - Avoid shared state between tests

4. **Mock Time-Dependent Logic**
   ```csharp
   public interface IDateTimeProvider
   {
       DateTime UtcNow { get; }
   }
   ```

### Monitoring Flaky Tests

Once tests are implemented, track flakiness using:
- GitHub Actions test result artifacts
- Test retry counts
- Historical pass/fail patterns

**Target:** 0% flaky tests before migration

---

## Test Data & Fixtures

### Current Test Data Infrastructure: None

### Seed Data Analysis

The application includes a `DbInitializer` class that seeds data:

**Current Seed Data:**
- 8 Students (Sample data from 2005-2017)
- 5 Instructors
- 4 Departments (Engineering, English, Economics, Mathematics)
- 7 Courses (Chemistry, Microeconomics, Macroeconomics, Calculus, Trigonometry, Composition, Literature)
- 11 Enrollments (Student-Course relationships)
- 3 Office Assignments

**File:** `/ContosoUniversity/Data/DbInitializer.cs`

### Recommended Test Data Strategy

#### 1. **Builder Pattern for Test Data**
```csharp
public class StudentBuilder
{
    private int _id = 1;
    private string _lastName = "TestLast";
    private string _firstName = "TestFirst";
    private DateTime _enrollmentDate = DateTime.Parse("2020-09-01");
    
    public StudentBuilder WithId(int id)
    {
        _id = id;
        return this;
    }
    
    public StudentBuilder WithName(string firstName, string lastName)
    {
        _firstName = firstName;
        _lastName = lastName;
        return this;
    }
    
    public Student Build()
    {
        return new Student
        {
            ID = _id,
            FirstName = _firstName,
            LastName = _lastName,
            EnrollmentDate = _enrollmentDate
        };
    }
}
```

#### 2. **Test Data Fixtures**
```csharp
public class SchoolContextFixture : IDisposable
{
    public SchoolContext Context { get; private set; }
    
    public SchoolContextFixture()
    {
        var options = new DbContextOptionsBuilder<SchoolContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        
        Context = new SchoolContext(options);
        SeedTestData();
    }
    
    private void SeedTestData()
    {
        // Minimal, controlled seed data
        Context.Students.Add(new Student { ... });
        Context.SaveChanges();
    }
    
    public void Dispose() => Context.Dispose();
}
```

#### 3. **Integration Test Database Setup**

**Option A: Testcontainers (Recommended for Integration Tests)**
```csharp
public class DatabaseFixture : IAsyncLifetime
{
    private readonly MsSqlContainer _container;
    public SchoolContext Context { get; private set; }
    
    public DatabaseFixture()
    {
        _container = new MsSqlBuilder()
            .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
            .Build();
    }
    
    public async Task InitializeAsync()
    {
        await _container.StartAsync();
        
        var connectionString = _container.GetConnectionString();
        var options = new DbContextOptionsBuilder<SchoolContext>()
            .UseSqlServer(connectionString)
            .Options;
        
        Context = new SchoolContext(options);
        await Context.Database.MigrateAsync();
    }
    
    public async Task DisposeAsync()
    {
        await _container.DisposeAsync();
    }
}
```

**Option B: Separate Test Database**
- Create `SchoolContext_Test` database
- Reset schema before each test run
- Use connection string from `appsettings.Testing.json`

### Test Data Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Object Mother** | Reusable standard objects | `Students.NewStudent()`, `Courses.EngineeringCourse()` |
| **Builder** | Flexible test object creation | `new StudentBuilder().WithGPA(3.5).Build()` |
| **Fixture** | Shared context setup | `SchoolContextFixture`, `DatabaseFixture` |
| **Anonymous Data** | Randomized test data | AutoFixture, Bogus libraries |

### Recommended Libraries

```xml
<PackageReference Include="Bogus" Version="35.0.1" />
<PackageReference Include="AutoFixture" Version="4.18.1" />
<PackageReference Include="AutoFixture.Xunit2" Version="4.18.1" />
```

---

## Prerequisites & Harnesses

### Current Prerequisites: None

### Recommended Test Environment Setup

#### Local Development Prerequisites

**Software Requirements:**
- .NET 6 SDK (minimum) or .NET 8 SDK (recommended)
- SQL Server LocalDB (for integration tests) OR
- Docker Desktop (for Testcontainers)
- Visual Studio 2022 / VS Code with C# extension
- Git

**Environment Variables:**
```bash
# For integration tests
ConnectionStrings__SchoolContext="Server=(localdb)\\mssqllocaldb;Database=SchoolContext_Test;Trusted_Connection=True;MultipleActiveResultSets=true"

# For Testcontainers (if used)
TESTCONTAINERS_RYUK_DISABLED=false
```

**Configuration Files:**
```
ContosoUniversity.Tests/
└── appsettings.Testing.json
```

**Sample `appsettings.Testing.json`:**
```json
{
  "ConnectionStrings": {
    "SchoolContext": "Server=(localdb)\\mssqllocaldb;Database=SchoolContext_Test;Trusted_Connection=True;MultipleActiveResultSets=true"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}
```

#### CI/CD Prerequisites

**GitHub Actions Requirements:**
- .NET SDK installation step
- SQL Server container (for integration tests)
- Docker (for Testcontainers)

**Recommended CI Workflow Updates:**
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      sqlserver:
        image: mcr.microsoft.com/mssql/server:2022-latest
        env:
          ACCEPT_EULA: Y
          SA_PASSWORD: YourStrong@Passw0rd
        ports:
          - 1433:1433
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: 8.0.x
      
      - name: Restore dependencies
        run: dotnet restore
      
      - name: Build
        run: dotnet build --no-restore
      
      - name: Run Unit Tests
        run: dotnet test --filter Category=Unit --no-build --verbosity normal
      
      - name: Run Integration Tests
        run: dotnet test --filter Category=Integration --no-build --verbosity normal
        env:
          ConnectionStrings__SchoolContext: "Server=localhost;Database=SchoolContext_Test;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True"
      
      - name: Generate Coverage Report
        run: dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

### Test Harnesses & Utilities

#### Custom Test Harness: `TestWebApplicationFactory`
```csharp
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove real database
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<SchoolContext>));
            if (descriptor != null)
                services.Remove(descriptor);
            
            // Add in-memory database
            services.AddDbContext<SchoolContext>(options =>
            {
                options.UseInMemoryDatabase("InMemoryTestDb");
            });
        });
    }
}
```

#### Database Reset Utility
```csharp
public static class DatabaseUtilities
{
    public static async Task ResetDatabaseAsync(SchoolContext context)
    {
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();
    }
    
    public static async Task SeedMinimalDataAsync(SchoolContext context)
    {
        // Minimal seed data for testing
        context.Students.Add(new Student { ... });
        await context.SaveChangesAsync();
    }
}
```

---

## Critical Integration Tests

### Priority 1: Student Management (HIGH PRIORITY)

| Test ID | Test Name | Description | Expected Outcome | Priority |
|---------|-----------|-------------|------------------|----------|
| **INT-STU-001** | Create_Student_Success | Create a new student with valid data | Student persisted to database, ID assigned | P0 |
| **INT-STU-002** | Create_Student_Validation_Fails | Create student with invalid data (missing name) | Validation error, no database entry | P0 |
| **INT-STU-003** | Read_Student_By_Id | Retrieve existing student by ID | Student returned with all properties | P0 |
| **INT-STU-004** | Update_Student_Success | Update student information | Changes persisted to database | P0 |
| **INT-STU-005** | Update_Student_Concurrency_Conflict | Two users update same student simultaneously | Concurrency exception thrown | P1 |
| **INT-STU-006** | Delete_Student_Success | Delete student with no enrollments | Student removed from database | P0 |
| **INT-STU-007** | Delete_Student_With_Enrollments | Delete student with active enrollments | Either cascade delete or FK constraint | P0 |
| **INT-STU-008** | List_Students_Pagination | List students with pagination (page 1, size 10) | 10 students returned, correct page info | P1 |
| **INT-STU-009** | Search_Students_By_Name | Search students by last name | Matching students returned | P1 |
| **INT-STU-010** | Filter_Students_By_Enrollment_Date | Filter students by enrollment date range | Only matching students returned | P2 |

### Priority 1: Enrollment Management (HIGH PRIORITY)

| Test ID | Test Name | Description | Expected Outcome | Priority |
|---------|-----------|-------------|------------------|----------|
| **INT-ENR-001** | Create_Enrollment_Success | Enroll student in course | Enrollment record created | P0 |
| **INT-ENR-002** | Create_Enrollment_Duplicate | Enroll student in same course twice | Error or prevent duplicate | P0 |
| **INT-ENR-003** | Update_Enrollment_Grade | Update enrollment grade | Grade updated in database | P0 |
| **INT-ENR-004** | Delete_Enrollment | Remove student from course | Enrollment deleted | P0 |
| **INT-ENR-005** | Enrollment_With_Invalid_Student | Create enrollment with non-existent student | FK constraint violation | P0 |
| **INT-ENR-006** | Enrollment_With_Invalid_Course | Create enrollment with non-existent course | FK constraint violation | P0 |
| **INT-ENR-007** | List_Enrollments_By_Student | Get all enrollments for a student | All enrollments returned | P1 |
| **INT-ENR-008** | List_Enrollments_By_Course | Get all enrollments for a course | All enrollments returned | P1 |

### Priority 1: Instructor Management (HIGH PRIORITY)

| Test ID | Test Name | Description | Expected Outcome | Priority |
|---------|-----------|-------------|------------------|----------|
| **INT-INS-001** | Create_Instructor_Success | Create new instructor | Instructor persisted to database | P0 |
| **INT-INS-002** | Assign_Instructor_To_Course | Assign instructor to course | CourseInstructor record created | P0 |
| **INT-INS-003** | Remove_Instructor_From_Course | Remove instructor assignment | CourseInstructor record deleted | P0 |
| **INT-INS-004** | Create_Office_Assignment | Assign office to instructor | OfficeAssignment created | P1 |
| **INT-INS-005** | Update_Office_Assignment | Change instructor office | OfficeAssignment updated | P1 |
| **INT-INS-006** | Delete_Instructor_With_Courses | Delete instructor with active courses | Handle cascade or FK constraint | P0 |
| **INT-INS-007** | List_Instructor_Courses | Get all courses for an instructor | All assigned courses returned | P1 |

### Priority 1: Course Management (HIGH PRIORITY)

| Test ID | Test Name | Description | Expected Outcome | Priority |
|---------|-----------|-------------|------------------|----------|
| **INT-CRS-001** | Create_Course_Success | Create new course | Course persisted to database | P0 |
| **INT-CRS-002** | Create_Course_With_Department | Create course assigned to department | Course created with FK to department | P0 |
| **INT-CRS-003** | Update_Course_Details | Update course title/credits | Changes persisted | P0 |
| **INT-CRS-004** | Delete_Course_No_Enrollments | Delete course with no enrollments | Course deleted | P0 |
| **INT-CRS-005** | Delete_Course_With_Enrollments | Delete course with active enrollments | Handle cascade or FK constraint | P0 |
| **INT-CRS-006** | List_Courses_By_Department | Get all courses in department | All courses returned | P1 |

### Priority 2: Department Management (MEDIUM PRIORITY)

| Test ID | Test Name | Description | Expected Outcome | Priority |
|---------|-----------|-------------|------------------|----------|
| **INT-DEP-001** | Create_Department_Success | Create new department | Department persisted | P1 |
| **INT-DEP-002** | Update_Department_Budget | Update department budget | Budget updated | P1 |
| **INT-DEP-003** | Delete_Department_No_Courses | Delete department with no courses | Department deleted | P1 |
| **INT-DEP-004** | Delete_Department_With_Courses | Delete department with courses | Handle cascade or FK constraint | P1 |
| **INT-DEP-005** | Department_Concurrency_Test | Concurrent updates to department | Concurrency conflict detected | P1 |

### Priority 2: Database Seeding (MEDIUM PRIORITY)

| Test ID | Test Name | Description | Expected Outcome | Priority |
|---------|-----------|-------------|------------------|----------|
| **INT-SEED-001** | Initialize_Empty_Database | Run DbInitializer on empty database | All seed data created | P1 |
| **INT-SEED-002** | Initialize_Existing_Database | Run DbInitializer on populated database | No duplicate data, idempotent | P1 |
| **INT-SEED-003** | Verify_Seed_Data_Relationships | Check FK relationships in seed data | All FKs valid | P1 |

### Priority 3: Migrations (MEDIUM PRIORITY)

| Test ID | Test Name | Description | Expected Outcome | Priority |
|---------|-----------|-------------|------------------|----------|
| **INT-MIG-001** | Apply_All_Migrations | Apply migrations to empty database | Schema created successfully | P1 |
| **INT-MIG-002** | Rollback_Latest_Migration | Rollback most recent migration | Schema reverted | P2 |
| **INT-MIG-003** | Migration_Idempotency | Apply same migration twice | Second apply is no-op | P2 |

---

## Migration Test Plan

### Phase 1: Pre-Migration Testing (CRITICAL)

**Objective:** Establish baseline test coverage before migration work begins

**Timeline:** 2-3 weeks

**Tasks:**

1. **Week 1: Test Infrastructure Setup**
   - [ ] Create `ContosoUniversity.Tests` project (xUnit)
   - [ ] Create `ContosoUniversity.IntegrationTests` project
   - [ ] Configure Testcontainers for SQL Server
   - [ ] Set up test fixtures and builders
   - [ ] Configure CI/CD for test execution
   - [ ] Implement code coverage reporting

2. **Week 2: Unit Test Implementation**
   - [ ] Implement Student model tests (10 tests)
   - [ ] Implement Instructor model tests (8 tests)
   - [ ] Implement Course model tests (8 tests)
   - [ ] Implement Enrollment model tests (6 tests)
   - [ ] Implement PaginatedList tests (5 tests)
   - [ ] Implement DbInitializer tests (3 tests)
   - **Target:** 40+ unit tests, 60%+ code coverage

3. **Week 3: Integration Test Implementation**
   - [ ] Implement all Priority 0 integration tests (20 tests)
   - [ ] Implement all Priority 1 integration tests (15 tests)
   - [ ] Configure test database setup/teardown
   - [ ] Verify CI/CD test execution
   - **Target:** 35+ integration tests

**Success Criteria:**
- ✅ 75+ automated tests passing
- ✅ 60%+ code coverage
- ✅ All Priority 0 integration tests passing
- ✅ CI/CD pipeline runs tests successfully
- ✅ Zero flaky tests

### Phase 2: During Migration Testing (CONTINUOUS)

**Objective:** Validate feature parity during migration work

**Activities:**

1. **Regression Testing**
   - Run full test suite after each migration change
   - Compare baseline vs. migrated behavior
   - Document any deviations

2. **New Test Creation**
   - Add tests for new features introduced during migration
   - Add tests for bug fixes
   - Maintain 60%+ coverage threshold

3. **Test Maintenance**
   - Update tests for API changes
   - Refactor tests for new architecture
   - Remove obsolete tests

4. **Performance Testing** (Optional but Recommended)
   - Benchmark response times (baseline vs. migrated)
   - Load testing for critical endpoints
   - Database query performance comparison

**Regression Detection:**
```bash
# Run baseline tests
dotnet test --configuration Release --logger "trx;LogFileName=baseline.trx"

# After migration changes
dotnet test --configuration Release --logger "trx;LogFileName=migrated.trx"

# Compare results
# Any test that passed in baseline but fails in migrated = regression
```

### Phase 3: Post-Migration Testing (VALIDATION)

**Objective:** Ensure migration success and production readiness

**Timeline:** 1 week

**Tasks:**

1. **Full Test Suite Execution**
   - [ ] Run all unit tests (target: 100% pass)
   - [ ] Run all integration tests (target: 100% pass)
   - [ ] Run all E2E tests if implemented (target: 100% pass)

2. **Manual Smoke Testing**
   - [ ] Verify all CRUD operations work in production-like environment
   - [ ] Test navigation and pagination
   - [ ] Verify data integrity
   - [ ] Check error handling

3. **Performance Validation**
   - [ ] Compare performance metrics (baseline vs. migrated)
   - [ ] Verify response times meet SLA (<200ms 95th percentile)
   - [ ] Load testing

4. **Security Testing**
   - [ ] Run CodeQL analysis
   - [ ] Check for SQL injection vulnerabilities
   - [ ] Verify authentication/authorization (if applicable)

5. **Database Validation**
   - [ ] Verify schema matches expected state
   - [ ] Check all migrations applied
   - [ ] Validate foreign key constraints
   - [ ] Verify seed data integrity

**Success Criteria:**
- ✅ 100% test pass rate
- ✅ Zero regressions detected
- ✅ Performance metrics meet or exceed baseline
- ✅ Zero critical security vulnerabilities
- ✅ Database integrity validated
- ✅ Manual smoke tests pass

### Phase 4: Post-Production Monitoring (ONGOING)

**Objective:** Monitor production for issues missed during testing

**Activities:**

1. **Application Monitoring**
   - Set up Application Insights or similar APM
   - Monitor error rates
   - Track performance metrics
   - Set up alerts for anomalies

2. **Test Maintenance**
   - Add tests for any production bugs discovered
   - Update tests for new features
   - Maintain coverage thresholds

3. **Continuous Improvement**
   - Review and reduce flaky tests
   - Optimize slow tests
   - Expand test coverage

---

## Recommendations

### Immediate Actions (Before Migration)

1. **🔴 CRITICAL: Implement Core Test Infrastructure**
   - Create test projects
   - Add test frameworks (xUnit, Moq, FluentAssertions)
   - Set up CI/CD test execution
   - **Timeline:** 1 week
   - **Owner:** Development Team

2. **🔴 CRITICAL: Implement Priority 0 Integration Tests**
   - Focus on CRUD operations for all entities
   - Ensure data integrity tests
   - Validate concurrency handling
   - **Timeline:** 2 weeks
   - **Owner:** Development Team
   - **Target:** 20+ integration tests

3. **🟡 HIGH: Establish Code Coverage Baseline**
   - Configure Coverlet + ReportGenerator
   - Generate baseline coverage report
   - Set minimum coverage thresholds (60%)
   - **Timeline:** 1 week
   - **Owner:** DevOps Engineer

4. **🟡 HIGH: Document Test Execution Procedures**
   - How to run tests locally
   - How to run specific test categories
   - How to generate coverage reports
   - **Timeline:** 2 days
   - **Owner:** Development Team

### Short-Term Actions (During Migration)

5. **🟢 MEDIUM: Implement Unit Tests**
   - Add unit tests for models
   - Add unit tests for page models
   - Add unit tests for utilities
   - **Timeline:** Ongoing
   - **Owner:** Development Team (concurrent with migration)

6. **🟢 MEDIUM: Set Up Database Test Fixtures**
   - Implement Testcontainers or test database
   - Create database reset utilities
   - Create test data builders
   - **Timeline:** 1 week
   - **Owner:** Development Team

7. **🟢 MEDIUM: Implement Performance Benchmarks**
   - Baseline response times
   - Database query performance
   - Page load times
   - **Timeline:** 1 week
   - **Owner:** QA/Performance Engineer

### Long-Term Actions (Post-Migration)

8. **🔵 LOW: Implement E2E Tests**
   - Set up Selenium or Playwright
   - Implement critical user workflows
   - Integrate with CI/CD
   - **Timeline:** 2-3 weeks
   - **Owner:** QA Team

9. **🔵 LOW: Implement Visual Regression Testing**
   - Percy, Chromatic, or similar
   - Capture baseline screenshots
   - Automate visual comparison
   - **Timeline:** 1-2 weeks
   - **Owner:** QA Team

10. **🔵 LOW: Implement Contract Testing**
    - If API endpoints are added
    - Use Pact or similar
    - **Timeline:** TBD
    - **Owner:** Development Team

### Risk Mitigation

| Risk | Mitigation Strategy | Owner |
|------|---------------------|-------|
| **No tests = high regression risk** | Implement Priority 0 tests before migration | Development Team |
| **Untested edge cases** | Add tests for all known edge cases | QA Team |
| **Database migration failures** | Test migrations on copy of production data | Database Admin |
| **Performance degradation** | Establish performance benchmarks | Performance Engineer |
| **Production bugs** | Implement comprehensive monitoring | DevOps Team |

### Quality Gates

Before proceeding with migration:
- ✅ Minimum 40 automated tests implemented
- ✅ All Priority 0 integration tests passing
- ✅ Code coverage ≥ 60%
- ✅ CI/CD pipeline runs tests successfully
- ✅ Test execution documented

### Success Metrics

**During Migration:**
- Test pass rate: ≥ 95%
- Test execution time: < 5 minutes (unit + integration)
- Code coverage: ≥ 60% (increasing to 70%)
- Flaky test rate: < 1%

**Post-Migration:**
- Zero regressions detected
- 100% feature parity
- Performance maintained or improved
- Zero critical bugs in production (first 30 days)

---

## Appendix A: Sample Test Structure

### Sample Unit Test
```csharp
using Xunit;
using FluentAssertions;
using ContosoUniversity.Models;

namespace ContosoUniversity.Tests.Models
{
    public class StudentTests
    {
        [Fact]
        public void Student_WithValidData_ShouldCreateSuccessfully()
        {
            // Arrange
            var firstName = "John";
            var lastName = "Doe";
            var enrollmentDate = DateTime.Parse("2020-09-01");
            
            // Act
            var student = new Student
            {
                FirstName = firstName,
                LastName = lastName,
                EnrollmentDate = enrollmentDate
            };
            
            // Assert
            student.FirstName.Should().Be(firstName);
            student.LastName.Should().Be(lastName);
            student.EnrollmentDate.Should().Be(enrollmentDate);
            student.FullName.Should().Be("Doe, John");
        }
        
        [Theory]
        [InlineData("", "Doe")]
        [InlineData("John", "")]
        [InlineData(null, "Doe")]
        public void Student_WithInvalidName_ShouldFailValidation(
            string firstName, string lastName)
        {
            // Arrange & Act
            var student = new Student
            {
                FirstName = firstName,
                LastName = lastName,
                EnrollmentDate = DateTime.Now
            };
            
            // Assert
            var validationResults = new List<ValidationResult>();
            var isValid = Validator.TryValidateObject(
                student, 
                new ValidationContext(student), 
                validationResults, 
                true);
            
            isValid.Should().BeFalse();
        }
    }
}
```

### Sample Integration Test
```csharp
using Xunit;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ContosoUniversity.Data;
using ContosoUniversity.Models;

namespace ContosoUniversity.IntegrationTests.Database
{
    public class StudentIntegrationTests : IClassFixture<DatabaseFixture>
    {
        private readonly DatabaseFixture _fixture;
        
        public StudentIntegrationTests(DatabaseFixture fixture)
        {
            _fixture = fixture;
        }
        
        [Fact]
        public async Task CreateStudent_WithValidData_ShouldPersistToDatabase()
        {
            // Arrange
            await using var context = _fixture.CreateContext();
            var student = new Student
            {
                FirstName = "Jane",
                LastName = "Smith",
                EnrollmentDate = DateTime.Parse("2021-09-01")
            };
            
            // Act
            context.Students.Add(student);
            await context.SaveChangesAsync();
            
            // Assert
            var savedStudent = await context.Students
                .FirstOrDefaultAsync(s => s.LastName == "Smith");
            
            savedStudent.Should().NotBeNull();
            savedStudent.ID.Should().BeGreaterThan(0);
            savedStudent.FirstName.Should().Be("Jane");
        }
        
        [Fact]
        public async Task DeleteStudent_WithEnrollments_ShouldHandleCascade()
        {
            // Arrange
            await using var context = _fixture.CreateContext();
            var student = new Student
            {
                FirstName = "Test",
                LastName = "Student",
                EnrollmentDate = DateTime.Now
            };
            context.Students.Add(student);
            await context.SaveChangesAsync();
            
            var course = await context.Courses.FirstAsync();
            context.Enrollments.Add(new Enrollment
            {
                StudentID = student.ID,
                CourseID = course.CourseID,
                Grade = Grade.A
            });
            await context.SaveChangesAsync();
            
            // Act & Assert
            context.Students.Remove(student);
            
            // Should either cascade delete or throw FK exception
            var exception = await Record.ExceptionAsync(
                async () => await context.SaveChangesAsync());
            
            // Verify expected behavior based on FK configuration
            exception.Should().BeNull(); // if cascade delete
            // OR
            // exception.Should().BeOfType<DbUpdateException>(); // if FK constraint
        }
    }
}
```

---

## Appendix B: Test Execution Commands

### Local Development

```bash
# Run all tests
dotnet test

# Run only unit tests
dotnet test --filter Category=Unit

# Run only integration tests
dotnet test --filter Category=Integration

# Run tests with code coverage
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura

# Generate HTML coverage report
reportgenerator -reports:**/coverage.cobertura.xml -targetdir:coverage-report -reporttypes:Html
# Then open: coverage-report/index.html

# Run tests in parallel
dotnet test --parallel

# Run tests with detailed output
dotnet test --verbosity detailed

# Run specific test by name
dotnet test --filter FullyQualifiedName~StudentTests
```

### CI/CD

```bash
# Restore dependencies
dotnet restore

# Build
dotnet build --configuration Release --no-restore

# Run tests with coverage
dotnet test --configuration Release --no-build \
  /p:CollectCoverage=true \
  /p:CoverletOutputFormat=cobertura \
  /p:CoverletOutput=./coverage/ \
  --logger "trx;LogFileName=test-results.trx"

# Generate coverage report
reportgenerator \
  -reports:./coverage/coverage.cobertura.xml \
  -targetdir:./coverage-report \
  -reporttypes:"Html;Badges"
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Migration Architect | Initial assessment and test strategy documentation |

---

## Related Documents

- [01-Architecture-Overview.md](./01-Architecture-Overview.md) - Application architecture details
- [Data-Model-Catalog.md](./Data-Model-Catalog.md) - Database schema and entities
- [Technology-Inventory.md](./Technology-Inventory.md) - Current technology stack
- [00-Project-Overview.md](./00-Project-Overview.md) - Migration project overview

---

**Last Updated:** 2025-12-30  
**Status:** ✅ Assessment Complete - Awaiting Test Implementation
