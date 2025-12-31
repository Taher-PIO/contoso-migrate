# Students – Migration Notes

## 1. Purpose & Responsibilities

The Students module manages all functionality related to student records in the ContosoUniversity application. This module is responsible for:

- **CRUD Operations**: Create, Read, Update, and Delete student records
- **Student Listing**: Paginated, searchable, and sortable student index
- **Student Details**: Display individual student information with enrollments
- **Student Validation**: Enforce business rules for student data entry
- **Student Enrollment Tracking**: Display course enrollments per student

This module serves as the primary interface for managing student lifecycle within the university system.

## 2. Public Surface (Controllers/Endpoints/Classes)

### Razor Pages (UI Layer)

All pages located in `Pages/Students/` namespace.

#### **Index Page** - Student Listing

- **Route**: `/Students` or `/Students/Index`
- **PageModel**: `ContosoUniversity.Pages.Students.IndexModel`
- **Handler**: `OnGetAsync(string sortOrder, string currentFilter, string searchString, int? pageIndex)`
- **Output**: `PaginatedList<Student>` with sorting and filtering
- **Features**:
  - Pagination (configurable page size from `appsettings.json`)
  - Sorting by Name (ascending/descending) or Enrollment Date
  - Search/filter by Last Name or First Name
  - Query string parameters preserved across page navigation

#### **Create Page** - New Student Registration

- **Route**: `/Students/Create`
- **PageModel**: `ContosoUniversity.Pages.Students.CreateModel`
- **Handlers**:
  - `OnGet()` - Display blank form
  - `OnPostAsync()` - Process form submission
- **Input**: `Student` model (bound via `[BindProperty]`)
- **Output**: Redirect to Index on success
- **Security**: Uses `TryUpdateModelAsync` to prevent overposting attacks
- **Bound Properties**: `FirstMidName`, `LastName`, `EnrollmentDate` only

#### **Edit Page** - Update Student Information

- **Route**: `/Students/Edit/{id}`
- **PageModel**: `ContosoUniversity.Pages.Students.EditModel`
- **Handlers**:
  - `OnGetAsync(int? id)` - Load existing student
  - `OnPostAsync(int id)` - Process updates
- **Input**: Student ID (route parameter), `Student` model (form)
- **Output**: Redirect to Index on success, NotFound if student doesn't exist
- **Security**: Uses `TryUpdateModelAsync` with explicit property list
- **Validation**: Returns page with validation errors if model state invalid

#### **Delete Page** - Remove Student Record

- **Route**: `/Students/Delete/{id}`
- **PageModel**: `ContosoUniversity.Pages.Students.DeleteModel`
- **Handlers**:
  - `OnGetAsync(int? id, bool? saveChangesError)` - Display confirmation
  - `OnPostAsync(int? id)` - Perform deletion
- **Input**: Student ID (route parameter)
- **Output**: Redirect to Index on success
- **Error Handling**:
  - Catches `DbUpdateException` and logs error
  - Displays error message on page reload if delete fails
  - Uses `AsNoTracking()` for read-only confirmation display
- **Dependencies**: Requires `ILogger<DeleteModel>` for error logging

#### **Details Page** - Student Profile View

- **Route**: `/Students/Details/{id}`
- **PageModel**: `ContosoUniversity.Pages.Students.DetailsModel`
- **Handler**: `OnGetAsync(int? id)`
- **Output**: Single `Student` with related enrollments and courses
- **Query Strategy**:
  - Uses `.Include(s => s.Enrollments).ThenInclude(e => e.Course)` for eager loading
  - Uses `.AsNoTracking()` for read-only display
- **Returns**: NotFound if student doesn't exist

### Input/Output Contracts

#### Input: Student Creation/Edit Form

```csharp
{
    "FirstMidName": "string (max 50 chars, required)",
    "LastName": "string (max 50 chars, required)",
    "EnrollmentDate": "DateTime (date only, formatted yyyy-MM-dd)"
}
```

#### Output: Student Index (Paginated)

```csharp
PaginatedList<Student> {
    Items: [
        {
            ID: int,
            FirstMidName: string,
            LastName: string,
            EnrollmentDate: DateTime,
            FullName: string (computed),
            Enrollments: null  // Not loaded in index
        }
    ],
    PageIndex: int,
    TotalPages: int,
    HasPreviousPage: bool,
    HasNextPage: bool
}
```

#### Output: Student Details

```csharp
Student {
    ID: int,
    FirstMidName: string,
    LastName: string,
    EnrollmentDate: DateTime,
    FullName: string (computed),
    Enrollments: [
        {
            EnrollmentID: int,
            Grade: Grade? (enum: A, B, C, D, F, null),
            Course: {
                CourseID: int,
                Title: string,
                Credits: int
            }
        }
    ]
}
```

### External Contracts

- **None**: This module only interacts with the UI (Razor views) and does not expose APIs
- **Future API Consideration**: If REST API is added, endpoints would follow:
  - `GET /api/students` - List students
  - `GET /api/students/{id}` - Get student details
  - `POST /api/students` - Create student
  - `PUT /api/students/{id}` - Update student
  - `DELETE /api/students/{id}` - Delete student

## 3. Dependencies

### NuGet Packages

Inherits from main project (`ContosoUniversity.csproj`):

- `Microsoft.AspNetCore.Mvc.RazorPages` (via SDK)
- `Microsoft.EntityFrameworkCore` 6.0.2 (via `SchoolContext` dependency)

### Internal Project Dependencies

| Dependency                                          | Type          | Usage                            | Coupling Level |
| --------------------------------------------------- | ------------- | -------------------------------- | -------------- |
| `ContosoUniversity.Data.SchoolContext`              | Data Access   | All CRUD operations              | High           |
| `ContosoUniversity.Models.Student`                  | Entity Model  | Bound property, display          | High           |
| `ContosoUniversity.Models.Enrollment`               | Entity Model  | Details page navigation property | Medium         |
| `ContosoUniversity.Models.Course`                   | Entity Model  | Details page (via Enrollment)    | Low            |
| `ContosoUniversity.PaginatedList<T>`                | Utility       | Index page pagination            | Medium         |
| `Microsoft.Extensions.Logging.ILogger`              | Logging       | Delete page error logging        | Low            |
| `Microsoft.Extensions.Configuration.IConfiguration` | Configuration | Index page (page size)           | Low            |

### System.Web Usage

- ✅ **No System.Web dependencies**
- Uses modern ASP.NET Core Razor Pages patterns

### Framework Dependencies

- `Microsoft.AspNetCore.Mvc` - PageModel base class, model binding, routing
- `Microsoft.EntityFrameworkCore` - LINQ queries, async operations
- `System.ComponentModel.DataAnnotations` - Validation attributes on Student model

## 4. Migration Impact

### Current State Assessment

The Students module is **already modernized**:

- ✅ ASP.NET Core Razor Pages (not MVC or Web Forms)
- ✅ Async/await throughout
- ✅ Dependency injection for DbContext and configuration
- ✅ Modern validation with data annotations
- ✅ CSRF protection via Razor Pages anti-forgery tokens
- ✅ Overposting protection via `TryUpdateModelAsync`

### Migration from .NET 6 → .NET 8

#### API Changes Needed

1. **Minimal Breaking Changes Expected**:

   - Razor Pages API is stable between .NET 6 and 8
   - No significant changes to `PageModel`, model binding, or routing

2. **Recommended Enhancements for .NET 8**:

   **A. Use Minimal APIs as alternative** (optional):

   ```csharp
   // If exposing as API instead of Razor Pages
   app.MapGet("/api/students", async (SchoolContext db) =>
       await db.Students.ToListAsync());
   ```

   **B. Enhanced validation with IValidatableObject** (optional):

   ```csharp
   public class Student : IValidatableObject
   {
       public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
       {
           if (EnrollmentDate > DateTime.Now)
           {
               yield return new ValidationResult(
                   "Enrollment date cannot be in the future",
                   new[] { nameof(EnrollmentDate) });
           }
       }
   }
   ```

   **C. Use Output Caching** (new in .NET 7/8):

   ```csharp
   // For read-only pages like Details
   builder.Services.AddOutputCache();
   // Then on page: [OutputCache(Duration = 60)]
   ```

#### Configuration Deltas

**Current Configuration** (`appsettings.json`):

```json
{
  "PageSize": 3
}
```

**Post-.NET 8 Migration** (no changes required, but could add):

```json
{
  "StudentModule": {
    "PageSize": 10,
    "MaxSearchResults": 1000,
    "EnableCaching": true,
    "CacheDurationSeconds": 300
  }
}
```

**Access in Code**:

```csharp
public class IndexModel : PageModel
{
    private readonly IConfiguration _configuration;

    public async Task OnGetAsync(...)
    {
        var pageSize = _configuration.GetValue<int>("StudentModule:PageSize", 10);
        // ...
    }
}
```

#### Routing Changes

**Current** (convention-based):

- Routes automatically generated from folder structure
- Example: `Pages/Students/Index.cshtml` → `/Students` or `/Students/Index`

**Post-.NET 8** (no changes required, but could add custom routes):

```csharp
@page "/students/list"  // Custom route in .cshtml
@page "{handler?}"      // Optional handler route
```

## 5. Data Access

### Current Patterns

#### Index Page - Pagination with Filtering

```csharp
IQueryable<Student> studentsIQ = from s in _context.Students select s;

// Apply filter
if (!String.IsNullOrEmpty(searchString))
{
    studentsIQ = studentsIQ.Where(s => s.LastName.Contains(searchString)
                           || s.FirstMidName.Contains(searchString));
}

// Apply sorting
switch (sortOrder)
{
    case "name_desc":
        studentsIQ = studentsIQ.OrderByDescending(s => s.LastName);
        break;
    // ...
}

// Paginate
var pageSize = Configuration.GetValue("PageSize", 3);
Students = await PaginatedList<Student>.CreateAsync(
    studentsIQ.AsNoTracking(), pageIndex ?? 1, pageSize);
```

**Characteristics**:

- ✅ Deferred execution (IQueryable)
- ✅ AsNoTracking for read-only data
- ✅ Efficient pagination (OFFSET/FETCH in SQL)
- ⚠️ Case-sensitive search on SQL Server (could use EF.Functions.Like)

#### Details Page - Eager Loading

```csharp
Student = await _context.Students
    .Include(s => s.Enrollments)
    .ThenInclude(e => e.Course)
    .AsNoTracking()
    .FirstOrDefaultAsync(m => m.ID == id);
```

**Characteristics**:

- ✅ Single query with JOINs (efficient)
- ✅ AsNoTracking for read-only display
- ❌ Potential N+1 avoided by eager loading

#### Create/Edit - Overposting Prevention

```csharp
var emptyStudent = new Student();
if (await TryUpdateModelAsync<Student>(
    emptyStudent,
    "student",
    s => s.FirstMidName, s => s.LastName, s => s.EnrollmentDate))
{
    _context.Students.Add(emptyStudent);
    await _context.SaveChangesAsync();
}
```

**Characteristics**:

- ✅ Whitelist approach prevents mass assignment attacks
- ✅ Only specified properties can be updated from form
- ✅ ID and Enrollments cannot be set via form (security)

#### Delete - Error Handling

```csharp
try
{
    _context.Students.Remove(student);
    await _context.SaveChangesAsync();
}
catch (DbUpdateException ex)
{
    _logger.LogError(ex, ErrorMessage);
    return RedirectToAction("./Delete", new { id, saveChangesError = true });
}
```

**Characteristics**:

- ✅ Handles constraint violations gracefully
- ✅ Logs errors for diagnostics
- ✅ User-friendly error display

### Migration Considerations

#### EF Core 6 → 8 Optimizations

1. **Improved Contains() Performance**:

   - EF Core 8 optimizes `string.Contains()` to use SQL `LIKE '%value%'`
   - Current code will automatically benefit

2. **New ExecuteUpdate for Bulk Operations** (if needed):

   ```csharp
   // Instead of loading entities into memory for bulk updates
   await _context.Students
       .Where(s => s.EnrollmentDate < DateTime.Parse("2015-01-01"))
       .ExecuteUpdateAsync(s => s.SetProperty(
           p => p.EnrollmentDate,
           p => DateTime.Parse("2015-01-01")));
   ```

3. **JSON Columns** (if complex data needed):
   ```csharp
   // If Student had complex data like preferences
   public StudentPreferences Preferences { get; set; }
   // Configure as JSON in OnModelCreating
   ```

#### Repository Pattern (Optional Future Enhancement)

**Current**: Direct DbContext usage in PageModels

**Alternative**:

```csharp
public interface IStudentRepository
{
    Task<PaginatedList<Student>> GetStudentsAsync(int pageIndex, int pageSize, string searchString, string sortOrder);
    Task<Student> GetStudentByIdAsync(int id);
    Task<Student> CreateStudentAsync(Student student);
    Task UpdateStudentAsync(Student student);
    Task DeleteStudentAsync(int id);
}
```

**Recommendation**:

- ❌ NOT recommended for this application size
- ✅ Direct DbContext usage is appropriate for CRUD operations
- ✅ Only introduce repository if moving to CQRS or needing complex query composition

## 6. Test Coverage

### Existing Tests

**Current State**: ❌ **No tests exist for Students module**

### Gaps

1. **Unit Tests**: None

   - PageModel initialization
   - Sorting logic (OnGetAsync switch statement)
   - Error handling paths
   - TryUpdateModelAsync success/failure scenarios

2. **Integration Tests**: None

   - Full CRUD workflow
   - Pagination with various page sizes
   - Search functionality
   - Concurrent edit scenarios
   - Delete with related enrollments (cascade behavior)

3. **UI/E2E Tests**: None
   - Form submission validation
   - Navigation between pages
   - Error message display

### Proposed Tests

#### Test Project Structure

```
ContosoUniversity.Tests/
├── Unit/
│   └── Pages/
│       └── Students/
│           ├── IndexModelTests.cs
│           ├── CreateModelTests.cs
│           ├── EditModelTests.cs
│           ├── DeleteModelTests.cs
│           └── DetailsModelTests.cs
└── Integration/
    └── Students/
        ├── StudentCrudWorkflowTests.cs
        ├── StudentPaginationTests.cs
        └── StudentSearchTests.cs
```

#### Priority Test Cases

**P0 - Critical** (must have before production):

1. **IndexModelTests**:

   - `OnGetAsync_NoParameters_ReturnsFirstPageOfStudents`
   - `OnGetAsync_WithSearchString_FiltersStudentsByName`
   - `OnGetAsync_WithSortOrder_SortsStudentsCorrectly`
   - `OnGetAsync_WithPageIndex_ReturnsCorrectPage`

2. **CreateModelTests**:

   - `OnPostAsync_ValidStudent_RedirectsToIndex`
   - `OnPostAsync_InvalidStudent_ReturnsPageWithErrors`
   - `OnPostAsync_OverpostingAttempt_IgnoresExtraProperties` (security)

3. **EditModelTests**:

   - `OnGetAsync_ValidId_ReturnsStudentData`
   - `OnGetAsync_InvalidId_ReturnsNotFound`
   - `OnPostAsync_ValidUpdate_SavesChanges`
   - `OnPostAsync_ConcurrentEdit_HandlesCorrectly`

4. **DeleteModelTests**:

   - `OnPostAsync_ValidId_DeletesStudent`
   - `OnPostAsync_StudentWithEnrollments_HandlesConstraintViolation`
   - `OnGetAsync_WithSaveChangesError_DisplaysErrorMessage`

5. **DetailsModelTests**:
   - `OnGetAsync_ValidId_LoadsStudentWithEnrollments`
   - `OnGetAsync_InvalidId_ReturnsNotFound`
   - `OnGetAsync_StudentWithNoEnrollments_ReturnsEmptyCollection`

**P1 - High** (should have):

1. **StudentCrudWorkflowTests** (integration):

   - `CreateEditDeleteStudent_FullWorkflow_Succeeds`
   - `CreateStudent_DuplicateName_AllowsCreation` (no unique constraint)
   - `DeleteStudent_WithEnrollments_CascadesCorrectly`

2. **StudentPaginationTests** (integration):

   - `Pagination_With1000Students_PerformanceAcceptable` (< 100ms)
   - `Pagination_LastPage_HandlesPartialPage`

3. **StudentSearchTests** (integration):
   - `Search_PartialLastName_FindsMatches`
   - `Search_PartialFirstName_FindsMatches`
   - `Search_CaseInsensitive_FindsMatches`

**P2 - Medium** (nice to have):

1. UI/E2E tests with Playwright or Selenium
2. Load testing with 10,000+ student records
3. Accessibility testing (WCAG compliance)

### Test Infrastructure Requirements

**Dependencies**:

```xml
<PackageReference Include="xUnit" Version="2.6.*" />
<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.0.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.0.*" />
<PackageReference Include="FluentAssertions" Version="6.12.*" />
<PackageReference Include="Moq" Version="4.20.*" />
```

**Sample Test Setup**:

```csharp
public class IndexModelTests
{
    private SchoolContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<SchoolContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new SchoolContext(options);
    }

    [Fact]
    public async Task OnGetAsync_NoParameters_ReturnsFirstPageOfStudents()
    {
        // Arrange
        var context = GetInMemoryContext();
        SeedStudents(context, 20);
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new[] {
                new KeyValuePair<string, string>("PageSize", "10")
            })
            .Build();
        var pageModel = new IndexModel(context, config);

        // Act
        await pageModel.OnGetAsync(null, null, null, null);

        // Assert
        pageModel.Students.Should().HaveCount(10);
        pageModel.Students.HasNextPage.Should().BeTrue();
    }
}
```

## 7. Risks & Rollback

### Module-Specific Risks

| Risk                                   | Likelihood | Impact   | Mitigation                                                               |
| -------------------------------------- | ---------- | -------- | ------------------------------------------------------------------------ |
| **Data loss during edit**              | Very Low   | High     | Use `TryUpdateModelAsync` (already implemented); add comprehensive tests |
| **Pagination performance degradation** | Low        | Medium   | Benchmark with large datasets (10K+ records); use indexes on `LastName`  |
| **Search case-sensitivity issues**     | Medium     | Low      | Switch to `EF.Functions.Like()` for case-insensitive search              |
| **Overposting vulnerability**          | Very Low   | Critical | Already mitigated with `TryUpdateModelAsync`; add security tests         |
| **Cascade delete unintended**          | Low        | High     | Test delete behavior with related enrollments; add confirmation dialogs  |
| **Concurrent edit conflicts**          | Medium     | Medium   | Student entity has no concurrency token; consider adding if needed       |
| **Injection attacks via search**       | Very Low   | Critical | EF Core parameterizes queries automatically; add penetration tests       |

### Security Considerations

**Current Protections**:

- ✅ CSRF protection (Razor Pages anti-forgery tokens)
- ✅ Overposting prevention (`TryUpdateModelAsync` with property whitelist)
- ✅ SQL injection prevention (EF Core parameterized queries)
- ✅ No direct SQL execution

**Potential Enhancements**:

- Add authorization attributes (if authentication added)
- Rate limiting on search endpoint (prevent DoS)
- Input sanitization for display (already handled by Razor encoding)

### Rollback Strategy

#### If Migration Causes Issues

**Code Rollback**:

```bash
git revert <commit-hash>
dotnet build
dotnet run
```

**Database Rollback**:

- Student records: No special considerations (standard CRUD)
- If migrations change Student schema: `dotnet ef database update <PreviousMigration>`

**Testing Before Production**:

1. ✅ Run all unit tests
2. ✅ Run integration tests with production-like data volume
3. ✅ Manual smoke test of all CRUD operations
4. ✅ Performance test pagination with 10K+ records
5. ✅ Security scan for OWASP Top 10

#### Monitoring in Production

**Key Metrics**:

- Page load time for Index (target: < 500ms)
- Search response time (target: < 200ms)
- Error rate on Create/Edit/Delete (target: < 0.1%)
- Database query duration (target: < 100ms)

**Logging**:

```csharp
_logger.LogInformation("Student {StudentId} created by user {UserId}", student.ID, userId);
_logger.LogWarning("Failed to delete student {StudentId}: {ErrorMessage}", id, ex.Message);
```

## 8. Work Breakdown

All tasks sized to ≤300 LOC changes per PR.

### Task STU-1: Create Students Module Test Infrastructure

**Estimate**: 3 hours  
**LOC**: ~80  
**Acceptance Criteria**:

- [ ] Create `Pages/Students/` test directory structure
- [ ] Add base test class with InMemory DbContext helper
- [ ] Add student seed data helper method
- [ ] Add mock `IConfiguration` helper for PageSize
- [ ] Verify test project builds

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Students/TestBase.cs`
- `NEW: ContosoUniversity.Tests/Helpers/StudentTestData.cs`

---

### Task STU-2: Unit Tests for Index Page

**Estimate**: 5 hours  
**LOC**: ~250  
**Acceptance Criteria**:

- [ ] Test default page load (first page, no sort, no filter)
- [ ] Test sorting by name (ascending/descending)
- [ ] Test sorting by enrollment date (ascending/descending)
- [ ] Test search by last name
- [ ] Test search by first name
- [ ] Test pagination (first page, middle page, last page)
- [ ] Test page navigation preserves search and sort
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Students/IndexModelTests.cs`

---

### Task STU-3: Unit Tests for Create Page

**Estimate**: 3 hours  
**LOC**: ~150  
**Acceptance Criteria**:

- [ ] Test OnGet returns Page()
- [ ] Test OnPostAsync with valid student saves to database
- [ ] Test OnPostAsync redirects to Index on success
- [ ] Test OnPostAsync with invalid ModelState returns Page()
- [ ] Test TryUpdateModelAsync only binds whitelisted properties
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Students/CreateModelTests.cs`

---

### Task STU-4: Unit Tests for Edit Page

**Estimate**: 4 hours  
**LOC**: ~200  
**Acceptance Criteria**:

- [ ] Test OnGetAsync with valid ID loads student
- [ ] Test OnGetAsync with invalid ID returns NotFound
- [ ] Test OnGetAsync with null ID returns NotFound
- [ ] Test OnPostAsync with valid data saves changes
- [ ] Test OnPostAsync with invalid ID returns NotFound
- [ ] Test OnPostAsync redirects to Index on success
- [ ] Test TryUpdateModelAsync property whitelist
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Students/EditModelTests.cs`

---

### Task STU-5: Unit Tests for Delete Page

**Estimate**: 4 hours  
**LOC**: ~200  
**Acceptance Criteria**:

- [ ] Test OnGetAsync with valid ID loads student
- [ ] Test OnGetAsync with saveChangesError displays error message
- [ ] Test OnPostAsync with valid ID deletes student
- [ ] Test OnPostAsync with invalid ID returns NotFound
- [ ] Test OnPostAsync catches DbUpdateException and logs
- [ ] Test OnPostAsync redirects with error flag on exception
- [ ] Mock ILogger and verify LogError called
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Students/DeleteModelTests.cs`

---

### Task STU-6: Unit Tests for Details Page

**Estimate**: 3 hours  
**LOC**: ~120  
**Acceptance Criteria**:

- [ ] Test OnGetAsync with valid ID loads student
- [ ] Test OnGetAsync eager loads enrollments and courses
- [ ] Test OnGetAsync with invalid ID returns NotFound
- [ ] Test OnGetAsync with null ID returns NotFound
- [ ] Test AsNoTracking is used (verify with EF tracking state)
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Students/DetailsModelTests.cs`

---

### Task STU-7: Integration Tests for Full CRUD Workflow

**Estimate**: 5 hours  
**LOC**: ~250  
**Acceptance Criteria**:

- [ ] Test Create → Read → Update → Delete full workflow
- [ ] Test Create student, verify in database
- [ ] Test Edit student, verify changes persisted
- [ ] Test Delete student, verify removed from database
- [ ] Test Delete student with enrollments (cascade behavior)
- [ ] Use real SQL Server LocalDB or SQLite in-memory
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Integration/Students/StudentCrudWorkflowTests.cs`

---

### Task STU-8: Integration Tests for Pagination Performance

**Estimate**: 4 hours  
**LOC**: ~150  
**Acceptance Criteria**:

- [ ] Seed database with 1,000 students
- [ ] Test pagination through all pages completes in reasonable time
- [ ] Test search with 1,000 students completes < 200ms
- [ ] Test sorting with 1,000 students completes < 500ms
- [ ] Measure and document query execution times
- [ ] All tests pass with acceptable performance

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Integration/Students/StudentPaginationTests.cs`
- `NEW: Docs/migration/modules/Students/Performance-Benchmarks.md`

---

### Task STU-9: Add Case-Insensitive Search

**Estimate**: 2 hours  
**LOC**: ~20  
**Acceptance Criteria**:

- [ ] Replace `Contains()` with `EF.Functions.Like()` for case-insensitive search
- [ ] Update Index page OnGetAsync search logic
- [ ] Add tests for case-insensitive search (e.g., "smith" matches "Smith")
- [ ] Verify SQL generated uses `LIKE` with case-insensitive collation
- [ ] All existing tests still pass

**Files Changed**:

- `MODIFY: ContosoUniversity/Pages/Students/Index.cshtml.cs`
- `MODIFY: ContosoUniversity.Tests/Unit/Pages/Students/IndexModelTests.cs`

**Code Change**:

```csharp
// Before
studentsIQ = studentsIQ.Where(s => s.LastName.Contains(searchString)
                       || s.FirstMidName.Contains(searchString));

// After
studentsIQ = studentsIQ.Where(s =>
    EF.Functions.Like(s.LastName, $"%{searchString}%") ||
    EF.Functions.Like(s.FirstMidName, $"%{searchString}%"));
```

---

### Task STU-10: Add Database Indexes for Performance

**Estimate**: 2 hours  
**LOC**: ~50  
**Acceptance Criteria**:

- [ ] Create EF Core migration to add index on Student.LastName
- [ ] Create index on Student.EnrollmentDate
- [ ] Apply migration to test database
- [ ] Measure query performance improvement (before/after)
- [ ] Document index strategy in migration notes
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity/Migrations/YYYYMMDDHHMMSS_AddStudentIndexes.cs`
- `UPDATE: Docs/migration/modules/Students/README.md` (document indexes)

**Migration Code**:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.CreateIndex(
        name: "IX_Student_LastName",
        table: "Student",
        column: "LastName");

    migrationBuilder.CreateIndex(
        name: "IX_Student_EnrollmentDate",
        table: "Student",
        column: "EnrollmentDate");
}
```

---

### Task STU-11: Add Authorization Attributes (Optional)

**Estimate**: 3 hours  
**LOC**: ~50  
**Acceptance Criteria**:

- [ ] Add `[Authorize]` attribute to all Student pages
- [ ] Add `[Authorize(Roles = "Admin")]` to Delete page
- [ ] Configure authentication in Program.cs (if not already present)
- [ ] Add tests for authorization behavior
- [ ] Update documentation with authorization requirements
- [ ] All tests pass

**Files Changed**:

- `MODIFY: ContosoUniversity/Pages/Students/*.cshtml.cs` (add [Authorize])
- `MODIFY: ContosoUniversity/Program.cs` (configure auth if needed)
- `NEW: ContosoUniversity.Tests/Unit/Pages/Students/AuthorizationTests.cs`

**Note**: Only implement if user authentication is part of migration scope.

---

### Task STU-12: Add Validation Enhancements

**Estimate**: 3 hours  
**LOC**: ~80  
**Acceptance Criteria**:

- [ ] Add validation: EnrollmentDate cannot be in future
- [ ] Add validation: EnrollmentDate cannot be before 1900
- [ ] Implement IValidatableObject on Student model
- [ ] Add client-side validation scripts (optional)
- [ ] Add tests for new validation rules
- [ ] Update Create/Edit pages to display validation errors
- [ ] All tests pass

**Files Changed**:

- `MODIFY: ContosoUniversity/Models/Student.cs`
- `MODIFY: ContosoUniversity.Tests/Unit/Models/StudentTests.cs`
- `MODIFY: ContosoUniversity/Pages/Students/Create.cshtml` (validation messages)
- `MODIFY: ContosoUniversity/Pages/Students/Edit.cshtml` (validation messages)

---

### Summary

**Total Estimated Effort**: 41 hours (~5.1 developer days)  
**Total Estimated LOC**: ~1,600 (mostly tests)  
**Number of PRs**: 12  
**Risk Level**: Low (already modernized, adding tests and enhancements)

## 9. Links

### Related Documentation

- [Razor Pages with EF Core - CRUD](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/crud)
- [Prevent Overposting in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/crud#prevent-overposting)
- [Sorting, Filtering, and Paging](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/sort-filter-page)

### Related Modules

- [Data-Access-Layer](../Data-Access-Layer/README.md) - Database context and entities
- [Courses](../Courses/README.md) - Related course management (via Enrollments)
- [Instructors](../Instructors/README.md) - Related instructor management

### Related Issues/PRs

- (To be created during implementation)
- `Issue #10`: Create comprehensive test suite for Students module
- `Issue #11`: Add case-insensitive search for student names
- `Issue #12`: Add database indexes for Student query performance
- `PR #10`: [STU-1] Create Students module test infrastructure
- `PR #11`: [STU-2] Add unit tests for Student Index page
- (Additional PRs to be linked as created)

### Security References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [ASP.NET Core Security Best Practices](https://learn.microsoft.com/en-us/aspnet/core/security/)
- [EF Core SQL Injection Prevention](https://learn.microsoft.com/en-us/ef/core/querying/sql-queries)

### External Resources

- [ContosoUniversity Tutorial](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/intro)
- [Pagination in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/sort-filter-page)
