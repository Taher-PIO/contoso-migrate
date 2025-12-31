# Courses – Migration Notes

## 1. Purpose & Responsibilities

The Courses module manages the university's course catalog and course-related operations. This module is responsible for:

- **Course CRUD Operations**: Create, Read, Update, and Delete course records
- **Course Catalog Management**: Maintain course offerings across departments
- **Department Association**: Link courses to their respective academic departments
- **Course-Instructor Relationships**: Manage many-to-many assignments (displayed in other modules)
- **Course Metadata**: Track course titles, credit hours, and identifiers
- **Dropdown Population**: Provide department selection for course assignment

This module serves as the central repository for academic course information and facilitates curriculum management.

## 2. Public Surface (Controllers/Endpoints/Classes)

### Razor Pages (UI Layer)

All pages located in `Pages/Courses/` namespace.

#### **Index Page** - Course Catalog Listing

- **Route**: `/Courses` or `/Courses/Index`
- **PageModel**: `ContosoUniversity.Pages.Courses.IndexModel`
- **Handler**: `OnGetAsync()`
- **Output**: `IList<Course>` with Department eager loading
- **Features**:
  - Display all courses in system
  - Show course number, title, credits, and department name
  - No pagination, sorting, or filtering (simpler than Students)
  - Uses `.AsNoTracking()` for read-only display

#### **Create Page** - New Course Definition

- **Route**: `/Courses/Create`
- **PageModel**: `ContosoUniversity.Pages.Courses.CreateModel : DepartmentNamePageModel`
- **Handlers**:
  - `OnGet()` - Display form with department dropdown
  - `OnPostAsync()` - Process course creation
- **Input**: `Course` model (bound via `[BindProperty]`)
- **Output**: Redirect to Index on success
- **Special Feature**: Manually specified CourseID (not database-generated)
- **Security**: Uses `TryUpdateModelAsync` to prevent overposting
- **Bound Properties**: `CourseID`, `DepartmentID`, `Title`, `Credits`

#### **Edit Page** - Update Course Information

- **Route**: `/Courses/Edit/{id}`
- **PageModel**: `ContosoUniversity.Pages.Courses.EditModel : DepartmentNamePageModel`
- **Handlers**:
  - `OnGetAsync(int? id)` - Load existing course with department
  - `OnPostAsync(int? id)` - Process updates
- **Input**: CourseID (route parameter), `Course` model (form)
- **Output**: Redirect to Index on success
- **Special**: CourseID is NOT editable (database-generated: None)
- **Security**: Uses `TryUpdateModelAsync` with explicit property list
- **Bound Properties**: `Credits`, `DepartmentID`, `Title` (excludes CourseID)

#### **Delete Page** - Remove Course from Catalog

- **Route**: `/Courses/Delete/{id}`
- **PageModel**: `ContosoUniversity.Pages.Courses.DeleteModel`
- **Handlers**:
  - `OnGetAsync(int? id)` - Display confirmation with department info
  - `OnPostAsync(int? id)` - Perform deletion
- **Input**: CourseID (route parameter)
- **Output**: Redirect to Index on success
- **Query Strategy**: Uses `.AsNoTracking()` for confirmation page
- **Error Handling**: No explicit DbUpdateException handling (unlike Students)
- **Risk**: May fail if course has enrollments or instructor assignments

#### **Details Page** - Course Information View

- **Route**: `/Courses/Details/{id}`
- **PageModel**: `ContosoUniversity.Pages.Courses.DetailsModel`
- **Handler**: `OnGetAsync(int? id)`
- **Output**: Single `Course` with Department information
- **Query Strategy**: Uses `.Include(c => c.Department)` for eager loading
- **Missing**: Does not display Enrollments or Instructors (potential enhancement)

### Base Class: DepartmentNamePageModel

**Purpose**: Shared functionality for Create and Edit pages

**Location**: `Pages/Courses/DepartmentNamePageModel.cs`

**Key Method**:

```csharp
public void PopulateDepartmentsDropDownList(
    SchoolContext _context,
    object selectedDepartment = null)
```

**Functionality**:

- Queries all departments from database
- Orders by department name
- Returns `SelectList` for dropdown binding
- Uses `.AsNoTracking()` for read-only query
- Supports pre-selecting current department (for Edit page)

**Property**:

- `DepartmentNameSL` (SelectList) - Bound to dropdown in views

**Inheritance**:

- `CreateModel : DepartmentNamePageModel`
- `EditModel : DepartmentNamePageModel`

### Input/Output Contracts

#### Input: Course Creation/Edit Form

```csharp
{
    "CourseID": "int (1-9999, required, manually entered for Create)",
    "Title": "string (3-50 chars, required)",
    "Credits": "int (0-5, required)",
    "DepartmentID": "int (required, selected from dropdown)"
}
```

**Validation Rules**:

- CourseID: No auto-increment, must be manually specified
- Title: StringLength(50, MinimumLength = 3)
- Credits: Range(0, 5)
- DepartmentID: Must exist in Departments table (foreign key)

#### Output: Course Index Listing

```csharp
IList<Course> [
    {
        CourseID: int,
        Title: string,
        Credits: int,
        DepartmentID: int,
        Department: {
            DepartmentID: int,
            Name: string
        },
        Enrollments: null,  // Not loaded
        Instructors: null   // Not loaded
    }
]
```

#### Output: Course Details

```csharp
Course {
    CourseID: int,
    Title: string,
    Credits: int,
    DepartmentID: int,
    Department: {
        DepartmentID: int,
        Name: string,
        Budget: decimal,
        StartDate: DateTime,
        InstructorID: int?
    },
    Enrollments: null,  // Not loaded (potential gap)
    Instructors: null   // Not loaded (potential gap)
}
```

### External Contracts

- **None**: This module only interacts with the UI (Razor views)
- **Future API Consideration**: If REST API is added:
  - `GET /api/courses` - List all courses
  - `GET /api/courses/{id}` - Get course details
  - `GET /api/courses/{id}/enrollments` - Get course enrollments
  - `GET /api/courses/{id}/instructors` - Get assigned instructors
  - `POST /api/courses` - Create course
  - `PUT /api/courses/{id}` - Update course
  - `DELETE /api/courses/{id}` - Delete course

## 3. Dependencies

### NuGet Packages

Inherits from main project (`ContosoUniversity.csproj`):

- `Microsoft.AspNetCore.Mvc.RazorPages` (via SDK)
- `Microsoft.EntityFrameworkCore` 6.0.2 (via `SchoolContext` dependency)

### Internal Project Dependencies

| Dependency                             | Type         | Usage                                     | Coupling Level |
| -------------------------------------- | ------------ | ----------------------------------------- | -------------- |
| `ContosoUniversity.Data.SchoolContext` | Data Access  | All CRUD operations                       | High           |
| `ContosoUniversity.Models.Course`      | Entity Model | Bound property, display                   | High           |
| `ContosoUniversity.Models.Department`  | Entity Model | Dropdown population, FK relationship      | High           |
| `ContosoUniversity.Models.Instructor`  | Entity Model | Many-to-many relationship (not displayed) | Low            |
| `ContosoUniversity.Models.Enrollment`  | Entity Model | One-to-many relationship (not displayed)  | Low            |
| `DepartmentNamePageModel`              | Base Class   | Shared dropdown logic                     | Medium         |

### System.Web Usage

- ✅ **No System.Web dependencies**
- Uses modern ASP.NET Core Razor Pages patterns
- `SelectList` from `Microsoft.AspNetCore.Mvc.Rendering` (not System.Web.Mvc)

### Framework Dependencies

- `Microsoft.AspNetCore.Mvc` - PageModel, SelectList, model binding
- `Microsoft.AspNetCore.Mvc.Rendering` - SelectList for dropdowns
- `Microsoft.EntityFrameworkCore` - LINQ queries, Include, AsNoTracking
- `System.ComponentModel.DataAnnotations` - Validation attributes on Course model

## 4. Migration Impact

### Current State Assessment

The Courses module is **already modernized**:

- ✅ ASP.NET Core Razor Pages (not MVC or Web Forms)
- ✅ Async/await throughout
- ✅ Dependency injection for DbContext
- ✅ Modern validation with data annotations
- ✅ CSRF protection via anti-forgery tokens
- ✅ Overposting protection via `TryUpdateModelAsync`
- ✅ Base class inheritance for code reuse

### Unique Characteristics vs. Other Modules

| Feature                     | Students Module  | Courses Module          | Impact                                        |
| --------------------------- | ---------------- | ----------------------- | --------------------------------------------- |
| **Pagination**              | ✅ Yes           | ❌ No                   | Consider adding if course catalog grows       |
| **Search/Filter**           | ✅ Yes           | ❌ No                   | Consider adding search by title or department |
| **Sorting**                 | ✅ Yes           | ❌ No                   | Currently no user-controlled sorting          |
| **Primary Key**             | Auto-increment   | Manual entry            | **Risk**: Duplicate CourseID entry            |
| **Error Handling (Delete)** | ✅ Comprehensive | ❌ Basic                | **Risk**: Unhandled FK constraint violations  |
| **Related Data Display**    | ✅ Enrollments   | ❌ None                 | **Gap**: Cannot see enrollments/instructors   |
| **Base Class**              | None             | DepartmentNamePageModel | Better code reuse                             |

### Migration from .NET 6 → .NET 8

#### API Changes Needed

1. **Minimal Breaking Changes Expected**:

   - Razor Pages API is stable
   - SelectList unchanged
   - No deprecated methods used

2. **Recommended Enhancements for .NET 8**:

   **A. Add Validation for CourseID Uniqueness**:

   ```csharp
   public async Task<IActionResult> OnPostAsync()
   {
       // Check if CourseID already exists
       if (await _context.Courses.AnyAsync(c => c.CourseID == Course.CourseID))
       {
           ModelState.AddModelError("Course.CourseID",
               "A course with this ID already exists.");
           PopulateDepartmentsDropDownList(_context);
           return Page();
       }
       // ... rest of code
   }
   ```

   **B. Add Cascade Delete Error Handling**:

   ```csharp
   public async Task<IActionResult> OnPostAsync(int? id)
   {
       try
       {
           _context.Courses.Remove(Course);
           await _context.SaveChangesAsync();
       }
       catch (DbUpdateException ex)
       {
           _logger.LogError(ex, "Failed to delete course {CourseID}", id);
           return RedirectToPage("./Delete", new { id, saveChangesError = true });
       }
       return RedirectToPage("./Index");
   }
   ```

   **C. Add Pagination for Course Index** (if catalog grows):

   ```csharp
   public PaginatedList<Course> Courses { get; set; }

   public async Task OnGetAsync(int? pageIndex)
   {
       var pageSize = Configuration.GetValue("PageSize", 10);
       var coursesIQ = _context.Courses
           .Include(c => c.Department)
           .AsNoTracking();

       Courses = await PaginatedList<Course>.CreateAsync(
           coursesIQ, pageIndex ?? 1, pageSize);
   }
   ```

   **D. Display Enrollments and Instructors in Details**:

   ```csharp
   Course = await _context.Courses
       .Include(c => c.Department)
       .Include(c => c.Enrollments)
           .ThenInclude(e => e.Student)
       .Include(c => c.Instructors)
       .AsNoTracking()
       .FirstOrDefaultAsync(m => m.CourseID == id);
   ```

#### Configuration Deltas

**Current Configuration**: None specific to Courses module

**Post-.NET 8 Migration** (recommended additions):

```json
{
  "CourseModule": {
    "PageSize": 20,
    "AllowManualCourseIDEntry": true,
    "CourseIDRange": { "Min": 1000, "Max": 9999 },
    "EnableCascadeDeleteWarning": true
  }
}
```

#### Routing Changes

**Current** (convention-based):

- `/Courses` → Index
- `/Courses/Create` → Create
- `/Courses/Edit/1050` → Edit
- `/Courses/Delete/1050` → Delete
- `/Courses/Details/1050` → Details

**Post-.NET 8** (no changes required, but could add):

```csharp
@page "/courses/catalog"  // Alternative route for Index
@page "/courses/{id:int}/edit"  // Constrained route parameter
```

## 5. Data Access

### Current Patterns

#### Index Page - Simple List Query

```csharp
Courses = await _context.Courses
    .Include(c => c.Department)
    .AsNoTracking()
    .ToListAsync();
```

**Characteristics**:

- ✅ Eager loading Department (single query with JOIN)
- ✅ AsNoTracking for read-only display
- ⚠️ No pagination - **could be problematic with 1000+ courses**
- ⚠️ No sorting or filtering options

**SQL Generated** (approximate):

```sql
SELECT c.CourseID, c.Title, c.Credits, c.DepartmentID,
       d.DepartmentID, d.Name, d.Budget, d.StartDate
FROM Course c
INNER JOIN Department d ON c.DepartmentID = d.DepartmentID
```

#### Details Page - Single Course Query

```csharp
Course = await _context.Courses
    .Include(c => c.Department)
    .FirstOrDefaultAsync(m => m.CourseID == id);
```

**Characteristics**:

- ✅ Eager loading Department
- ❌ NOT using AsNoTracking (read-only page, should use it)
- ❌ Does NOT load Enrollments or Instructors (user cannot see who's enrolled)

#### Create - Department Dropdown Population

```csharp
var departmentsQuery = from d in _context.Departments
                       orderby d.Name
                       select d;

DepartmentNameSL = new SelectList(
    departmentsQuery.AsNoTracking(),
    "DepartmentID", "Name", selectedDepartment);
```

**Characteristics**:

- ✅ AsNoTracking for dropdown data
- ✅ Ordered by Name (user-friendly)
- ✅ Efficient query (only loads needed fields implicitly)
- ⚠️ Could cache if departments don't change frequently

#### Edit - Two Queries (Load + Update)

```csharp
// Query 1: Load for display
Course = await _context.Courses
    .Include(c => c.Department)
    .FirstOrDefaultAsync(m => m.CourseID == id);

// Query 2: Load for update
var courseToUpdate = await _context.Courses.FindAsync(id);
```

**Characteristics**:

- ⚠️ **Two queries for the same course** (inefficiency)
- First query loads Department (for display)
- Second query uses FindAsync (efficient, checks local cache first)
- ✅ TryUpdateModelAsync prevents overposting

#### Delete - Two Queries (Confirmation + Delete)

```csharp
// Query 1: Display confirmation
Course = await _context.Courses
    .AsNoTracking()
    .Include(c => c.Department)
    .FirstOrDefaultAsync(m => m.CourseID == id);

// Query 2: Delete
Course = await _context.Courses.FindAsync(id);
_context.Courses.Remove(Course);
await _context.SaveChangesAsync();
```

**Characteristics**:

- ✅ Uses AsNoTracking for confirmation page
- ❌ No error handling for FK constraint violations
- ⚠️ Could fail if course has enrollments or instructor assignments

### Known Issues & Risks

| Issue                         | Risk Level | Impact                             | Recommendation                           |
| ----------------------------- | ---------- | ---------------------------------- | ---------------------------------------- |
| **Manual CourseID Entry**     | High       | Duplicate key exceptions           | Add uniqueness check before insert       |
| **No Pagination**             | Medium     | Performance with 1000+ courses     | Add pagination like Students module      |
| **No Delete Error Handling**  | High       | Unhandled exceptions in production | Add try-catch with DbUpdateException     |
| **Redundant Queries in Edit** | Low        | Minor performance impact           | Consider refactoring to single query     |
| **Missing Related Data**      | Low        | Incomplete information display     | Show enrollments/instructors in Details  |
| **No Search/Filter**          | Medium     | User experience with large catalog | Add search by title or department filter |

### Migration Considerations

#### EF Core 6 → 8 Optimizations

1. **Compiled Queries for Dropdown** (performance):

   ```csharp
   private static readonly Func<SchoolContext, IAsyncEnumerable<Department>>
       GetDepartmentsQuery = EF.CompileAsyncQuery(
           (SchoolContext context) =>
               context.Departments.OrderBy(d => d.Name));
   ```

2. **Batch Loading for Index** (if adding pagination):

   - EF Core 8 has improved batching for Include operations

3. **JSON Columns** (if course metadata expands):
   ```csharp
   public CourseMetadata Metadata { get; set; }  // Complex type
   // Configure as JSON in SchoolContext
   ```

#### Caching Strategy (Optional)

**Department Dropdown Caching**:

```csharp
public void PopulateDepartmentsDropDownList(
    SchoolContext _context,
    IMemoryCache cache,
    object selectedDepartment = null)
{
    const string cacheKey = "DepartmentList";

    if (!cache.TryGetValue(cacheKey, out List<Department> departments))
    {
        departments = _context.Departments
            .OrderBy(d => d.Name)
            .AsNoTracking()
            .ToList();

        var cacheOptions = new MemoryCacheEntryOptions()
            .SetSlidingExpiration(TimeSpan.FromMinutes(30));

        cache.Set(cacheKey, departments, cacheOptions);
    }

    DepartmentNameSL = new SelectList(departments,
        "DepartmentID", "Name", selectedDepartment);
}
```

**Pros**: Reduces database queries for frequently accessed data  
**Cons**: Cache invalidation complexity when departments change  
**Recommendation**: Only if dropdown is performance bottleneck

## 6. Test Coverage

### Existing Tests

**Current State**: ❌ **No tests exist for Courses module**

### Gaps

1. **Unit Tests**: None

   - DepartmentNamePageModel dropdown population
   - CourseID uniqueness validation (not implemented)
   - Create/Edit form validation
   - Error handling paths

2. **Integration Tests**: None

   - Full CRUD workflow
   - Duplicate CourseID prevention
   - Delete with related enrollments (cascade behavior)
   - Delete with instructor assignments
   - Department dropdown loading

3. **UI/E2E Tests**: None
   - Dropdown selection and form submission
   - Validation error display
   - Manual CourseID entry workflow

### Proposed Tests

#### Test Project Structure

```
ContosoUniversity.Tests/
├── Unit/
│   └── Pages/
│       └── Courses/
│           ├── DepartmentNamePageModelTests.cs
│           ├── IndexModelTests.cs
│           ├── CreateModelTests.cs
│           ├── EditModelTests.cs
│           ├── DeleteModelTests.cs
│           └── DetailsModelTests.cs
└── Integration/
    └── Courses/
        ├── CourseCrudWorkflowTests.cs
        ├── CourseDuplicateIdTests.cs
        └── CourseCascadeDeleteTests.cs
```

#### Priority Test Cases

**P0 - Critical** (must have before production):

1. **CreateModelTests**:

   - `OnPostAsync_ValidCourse_CreatesSuccessfully`
   - `OnPostAsync_DuplicateCourseID_ReturnsError` (test for future enhancement)
   - `OnPostAsync_InvalidDepartmentID_FailsForeignKeyConstraint`
   - `OnPostAsync_InvalidCredits_FailsValidation` (Credits > 5)
   - `OnGet_PopulatesDepartmentDropdown_Succeeds`

2. **EditModelTests**:

   - `OnPostAsync_ValidUpdate_SavesChanges`
   - `OnPostAsync_CourseIDNotChanged_Succeeds` (CourseID excluded from TryUpdateModelAsync)
   - `OnPostAsync_InvalidDepartmentID_FailsForeignKeyConstraint`

3. **DeleteModelTests**:

   - `OnPostAsync_CourseWithNoEnrollments_DeletesSuccessfully`
   - `OnPostAsync_CourseWithEnrollments_FailsOrCascades` (depends on FK setup)
   - `OnPostAsync_CourseWithInstructors_FailsOrCascades`

4. **DepartmentNamePageModelTests**:

   - `PopulateDepartmentsDropDownList_NoDepartments_ReturnsEmptyList`
   - `PopulateDepartmentsDropDownList_MultipleDepartments_OrdersByName`
   - `PopulateDepartmentsDropDownList_WithSelectedDepartment_PreselectsCorrectly`

5. **IndexModelTests**:
   - `OnGetAsync_MultipleCourses_LoadsAllWithDepartments`
   - `OnGetAsync_1000Courses_PerformanceAcceptable` (load test)

**P1 - High** (should have):

1. **CourseCrudWorkflowTests** (integration):

   - `CreateEditDeleteCourse_FullWorkflow_Succeeds`
   - `CreateCourse_ThenAssignInstructor_Succeeds`
   - `CreateCourse_ThenEnrollStudent_Succeeds`

2. **CourseDuplicateIdTests** (integration):

   - `CreateCourse_DuplicateCourseID_ThrowsException` (current behavior)
   - `CreateCourse_DuplicateCourseID_DisplaysValidationError` (after enhancement)

3. **CourseCascadeDeleteTests** (integration):
   - Determine actual cascade behavior (ON DELETE CASCADE vs RESTRICT)
   - Test delete with enrollments
   - Test delete with instructor assignments

**P2 - Medium** (nice to have):

1. Performance tests with 10,000+ courses
2. Concurrent edit scenarios
3. UI/E2E tests for dropdown interaction

### Test Infrastructure Requirements

**Dependencies** (same as Students module):

```xml
<PackageReference Include="xUnit" Version="2.6.*" />
<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.0.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.0.*" />
<PackageReference Include="FluentAssertions" Version="6.12.*" />
```

**Sample Test**:

```csharp
[Fact]
public async Task OnPostAsync_DuplicateCourseID_ThrowsDbUpdateException()
{
    // Arrange
    var context = GetInMemoryContext();
    context.Departments.Add(new Department
    {
        DepartmentID = 1,
        Name = "Engineering",
        Budget = 100000,
        StartDate = DateTime.Now
    });
    context.Courses.Add(new Course
    {
        CourseID = 1050,
        Title = "Chemistry",
        Credits = 3,
        DepartmentID = 1
    });
    await context.SaveChangesAsync();

    var pageModel = new CreateModel(context);
    pageModel.Course = new Course
    {
        CourseID = 1050,  // Duplicate
        Title = "Physics",
        Credits = 4,
        DepartmentID = 1
    };

    // Act & Assert
    await Assert.ThrowsAsync<InvalidOperationException>(
        async () => await pageModel.OnPostAsync());
}
```

## 7. Risks & Rollback

### Module-Specific Risks

| Risk                                        | Likelihood | Impact | Mitigation                                                                   |
| ------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------- |
| **Duplicate CourseID entry**                | High       | High   | Add uniqueness check in Create page; add unique index in database            |
| **Delete with enrollments fails**           | Medium     | High   | Add error handling with DbUpdateException; warn user before delete           |
| **Delete with instructors fails**           | Medium     | High   | Check for assigned instructors before delete; provide guidance               |
| **Manual ID entry errors**                  | Medium     | Medium | Add validation for ID range (e.g., 1000-9999); provide format guidance       |
| **Performance degradation (no pagination)** | Low        | Medium | Monitor query performance; add pagination if catalog exceeds 500 courses     |
| **Department dropdown empty**               | Low        | High   | Add validation: cannot create course without departments; seed data check    |
| **Foreign key constraint violations**       | Medium     | Medium | Comprehensive FK error handling; user-friendly error messages                |
| **Concurrent CourseID entry**               | Low        | Medium | Database will handle with unique constraint; need to catch and display error |

### Database Constraints

**Current Foreign Keys**:

- `Course.DepartmentID` → `Department.DepartmentID`

**Expected Cascade Behavior** (verify in migrations):

```csharp
// Check in Migrations or SchoolContext
modelBuilder.Entity<Course>()
    .HasOne(c => c.Department)
    .WithMany(d => d.Courses)
    .OnDelete(DeleteBehavior.Restrict);  // or Cascade?
```

**Action Items**:

1. Verify actual ON DELETE behavior in database
2. Add tests for cascade vs. restrict behavior
3. Document expected behavior in this section
4. Add appropriate error handling based on behavior

### Security Considerations

**Current Protections**:

- ✅ CSRF protection (anti-forgery tokens)
- ✅ Overposting prevention (`TryUpdateModelAsync` with property whitelist)
- ✅ SQL injection prevention (EF Core parameterized queries)
- ✅ CourseID immutable on Edit (not in property list)

**Potential Enhancements**:

- Input sanitization for Title field (prevent XSS)
- Authorization (restrict Create/Edit/Delete to admin roles)
- Audit logging (track who creates/modifies courses)

### Rollback Strategy

#### If Migration Causes Issues

**Code Rollback**:

```bash
git revert <commit-hash>
dotnet build
dotnet run
```

**Database Rollback**:

- Course records: No special considerations (standard CRUD)
- If schema changes: `dotnet ef database update <PreviousMigration>`

**Testing Before Production**:

1. ✅ Run all unit tests (100% pass rate)
2. ✅ Run integration tests with real database
3. ✅ Manual test: Create course with duplicate ID (should handle gracefully)
4. ✅ Manual test: Delete course with enrollments (verify error handling)
5. ✅ Manual test: Create course with invalid department (should fail gracefully)
6. ✅ Load test: Index page with 1000+ courses (acceptable performance)

#### Monitoring in Production

**Key Metrics**:

- CourseID uniqueness violations (should trigger alerts)
- Delete operation failures (DbUpdateException count)
- Index page load time (should remain < 1 second)
- Dropdown query time (should remain < 100ms)

**Logging Recommendations**:

```csharp
_logger.LogInformation("Course {CourseID} created by user {UserId}", courseId, userId);
_logger.LogWarning("Duplicate CourseID {CourseID} attempted", courseId);
_logger.LogError(ex, "Failed to delete course {CourseID}", courseId);
```

## 8. Work Breakdown

All tasks sized to ≤300 LOC changes per PR.

### Task CRS-1: Create Courses Module Test Infrastructure

**Estimate**: 2 hours  
**LOC**: ~60  
**Acceptance Criteria**:

- [ ] Create `Pages/Courses/` test directory
- [ ] Add helper method for creating test courses
- [ ] Add helper method for creating test departments
- [ ] Add helper for DepartmentNamePageModel testing
- [ ] Verify test project builds

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Courses/TestBase.cs`
- `NEW: ContosoUniversity.Tests/Helpers/CourseTestData.cs`

---

### Task CRS-2: Unit Tests for DepartmentNamePageModel

**Estimate**: 3 hours  
**LOC**: ~120  
**Acceptance Criteria**:

- [ ] Test PopulateDepartmentsDropDownList with no departments
- [ ] Test with multiple departments (verify ordering by name)
- [ ] Test with selected department (verify pre-selection)
- [ ] Test SelectList properties (DataValueField, DataTextField)
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Courses/DepartmentNamePageModelTests.cs`

---

### Task CRS-3: Unit Tests for Create Page

**Estimate**: 4 hours  
**LOC**: ~180  
**Acceptance Criteria**:

- [ ] Test OnGet populates department dropdown
- [ ] Test OnPostAsync with valid course saves to database
- [ ] Test OnPostAsync redirects to Index on success
- [ ] Test OnPostAsync with invalid model returns Page()
- [ ] Test OnPostAsync repopulates dropdown on failure
- [ ] Test TryUpdateModelAsync property whitelist
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Courses/CreateModelTests.cs`

---

### Task CRS-4: Unit Tests for Edit Page

**Estimate**: 4 hours  
**LOC**: ~200  
**Acceptance Criteria**:

- [ ] Test OnGetAsync with valid ID loads course
- [ ] Test OnGetAsync populates dropdown with selected department
- [ ] Test OnGetAsync with invalid ID returns NotFound
- [ ] Test OnPostAsync with valid data saves changes
- [ ] Test OnPostAsync excludes CourseID from updates
- [ ] Test OnPostAsync redirects to Index on success
- [ ] Test OnPostAsync repopulates dropdown on failure
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Courses/EditModelTests.cs`

---

### Task CRS-5: Unit Tests for Delete Page

**Estimate**: 3 hours  
**LOC**: ~150  
**Acceptance Criteria**:

- [ ] Test OnGetAsync with valid ID loads course
- [ ] Test OnGetAsync uses AsNoTracking
- [ ] Test OnPostAsync with valid ID deletes course
- [ ] Test OnPostAsync redirects to Index
- [ ] Test OnPostAsync with invalid ID returns NotFound
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Courses/DeleteModelTests.cs`

---

### Task CRS-6: Integration Tests for Cascade Delete Behavior

**Estimate**: 5 hours  
**LOC**: ~200  
**Acceptance Criteria**:

- [ ] Determine actual cascade behavior (ON DELETE CASCADE vs RESTRICT)
- [ ] Test delete course with no enrollments (should succeed)
- [ ] Test delete course with enrollments (test expected behavior)
- [ ] Test delete course with instructor assignments (test expected behavior)
- [ ] Document cascade behavior in module README
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Integration/Courses/CourseCascadeDeleteTests.cs`
- `UPDATE: Docs/migration/modules/Courses/README.md` (Section 7)

---

### Task CRS-7: Add CourseID Uniqueness Validation

**Estimate**: 3 hours  
**LOC**: ~40  
**Acceptance Criteria**:

- [ ] Add check in CreateModel.OnPostAsync for duplicate CourseID
- [ ] Add ModelState error if CourseID exists
- [ ] Ensure dropdown is repopulated on error
- [ ] Add unit test for duplicate CourseID scenario
- [ ] Add integration test with concurrent creates
- [ ] All tests pass

**Files Changed**:

- `MODIFY: ContosoUniversity/Pages/Courses/Create.cshtml.cs` (~15 LOC)
- `MODIFY: ContosoUniversity.Tests/Unit/Pages/Courses/CreateModelTests.cs` (~50 LOC)
- `NEW: ContosoUniversity.Tests/Integration/Courses/CourseDuplicateIdTests.cs` (~80 LOC)

**Code Change**:

```csharp
public async Task<IActionResult> OnPostAsync()
{
    var emptyCourse = new Course();

    if (await TryUpdateModelAsync<Course>(
         emptyCourse, "course",
         s => s.CourseID, s => s.DepartmentID, s => s.Title, s => s.Credits))
    {
        // NEW: Check for duplicate CourseID
        if (await _context.Courses.AnyAsync(c => c.CourseID == emptyCourse.CourseID))
        {
            ModelState.AddModelError("Course.CourseID",
                $"A course with ID {emptyCourse.CourseID} already exists.");
            PopulateDepartmentsDropDownList(_context, emptyCourse.DepartmentID);
            return Page();
        }

        _context.Courses.Add(emptyCourse);
        await _context.SaveChangesAsync();
        return RedirectToPage("./Index");
    }

    PopulateDepartmentsDropDownList(_context, emptyCourse.DepartmentID);
    return Page();
}
```

---

### Task CRS-8: Add Delete Error Handling

**Estimate**: 3 hours  
**LOC**: ~60  
**Acceptance Criteria**:

- [ ] Add ILogger dependency to DeleteModel
- [ ] Add try-catch around SaveChangesAsync in OnPostAsync
- [ ] Catch DbUpdateException and log error
- [ ] Add ErrorMessage property to page model
- [ ] Modify OnGetAsync to display error message
- [ ] Add tests for delete error scenarios
- [ ] All tests pass

**Files Changed**:

- `MODIFY: ContosoUniversity/Pages/Courses/Delete.cshtml.cs` (~30 LOC)
- `MODIFY: ContosoUniversity/Pages/Courses/Delete.cshtml` (~10 LOC, display error)
- `MODIFY: ContosoUniversity.Tests/Unit/Pages/Courses/DeleteModelTests.cs` (~50 LOC)

**Code Change**:

```csharp
private readonly ILogger<DeleteModel> _logger;
public string ErrorMessage { get; set; }

public async Task<IActionResult> OnGetAsync(int? id, bool? saveChangesError = false)
{
    // ... existing code ...

    if (saveChangesError.GetValueOrDefault())
    {
        ErrorMessage = $"Delete failed. The course may have enrollments or instructor assignments.";
    }

    return Page();
}

public async Task<IActionResult> OnPostAsync(int? id)
{
    if (id == null) return NotFound();

    var course = await _context.Courses.FindAsync(id);
    if (course == null) return NotFound();

    try
    {
        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();
        return RedirectToPage("./Index");
    }
    catch (DbUpdateException ex)
    {
        _logger.LogError(ex, "Failed to delete course {CourseID}", id);
        return RedirectToPage("./Delete", new { id, saveChangesError = true });
    }
}
```

---

### Task CRS-9: Add AsNoTracking to Details Page

**Estimate**: 1 hour  
**LOC**: ~5  
**Acceptance Criteria**:

- [ ] Add `.AsNoTracking()` to Details page query
- [ ] Verify query still works correctly
- [ ] Add test to verify AsNoTracking is used
- [ ] All tests pass

**Files Changed**:

- `MODIFY: ContosoUniversity/Pages/Courses/Details.cshtml.cs` (~1 LOC)
- `MODIFY: ContosoUniversity.Tests/Unit/Pages/Courses/DetailsModelTests.cs` (~20 LOC)

**Code Change**:

```csharp
Course = await _context.Courses
    .Include(c => c.Department)
    .AsNoTracking()  // ADD THIS
    .FirstOrDefaultAsync(m => m.CourseID == id);
```

---

### Task CRS-10: Add Enrollments and Instructors to Details Page

**Estimate**: 3 hours  
**LOC**: ~30  
**Acceptance Criteria**:

- [ ] Add `.Include(c => c.Enrollments).ThenInclude(e => e.Student)` to query
- [ ] Add `.Include(c => c.Instructors)` to query
- [ ] Update Details.cshtml to display enrollments list
- [ ] Update Details.cshtml to display instructors list
- [ ] Add tests for eager loading behavior
- [ ] All tests pass

**Files Changed**:

- `MODIFY: ContosoUniversity/Pages/Courses/Details.cshtml.cs` (~10 LOC)
- `MODIFY: ContosoUniversity/Pages/Courses/Details.cshtml` (~40 LOC, UI changes)
- `MODIFY: ContosoUniversity.Tests/Unit/Pages/Courses/DetailsModelTests.cs` (~30 LOC)

---

### Task CRS-11: Add Pagination to Index Page (Optional)

**Estimate**: 4 hours  
**LOC**: ~80  
**Acceptance Criteria**:

- [ ] Change Courses property from IList to PaginatedList
- [ ] Update OnGetAsync to accept pageIndex parameter
- [ ] Use PaginatedList.CreateAsync (like Students module)
- [ ] Update Index.cshtml to display pagination links
- [ ] Add tests for pagination behavior
- [ ] All tests pass

**Files Changed**:

- `MODIFY: ContosoUniversity/Pages/Courses/Index.cshtml.cs` (~30 LOC)
- `MODIFY: ContosoUniversity/Pages/Courses/Index.cshtml` (~30 LOC)
- `MODIFY: ContosoUniversity.Tests/Unit/Pages/Courses/IndexModelTests.cs` (~60 LOC)

**Note**: Only implement if course catalog is expected to grow beyond 500 courses.

---

### Task CRS-12: Add Search and Filter to Index Page (Optional)

**Estimate**: 5 hours  
**LOC**: ~120  
**Acceptance Criteria**:

- [ ] Add searchString parameter to OnGetAsync
- [ ] Filter courses by Title containing search string
- [ ] Add department filter dropdown
- [ ] Update Index.cshtml to include search form
- [ ] Add tests for search and filter behavior
- [ ] All tests pass

**Files Changed**:

- `MODIFY: ContosoUniversity/Pages/Courses/Index.cshtml.cs` (~50 LOC)
- `MODIFY: ContosoUniversity/Pages/Courses/Index.cshtml` (~40 LOC)
- `MODIFY: ContosoUniversity.Tests/Unit/Pages/Courses/IndexModelTests.cs` (~80 LOC)

**Note**: Only implement if user feedback indicates difficulty finding courses.

---

### Summary

**Total Estimated Effort (Core Tasks)**: 35 hours (~4.4 developer days)  
**Total Estimated LOC (Core Tasks)**: ~1,200 (mostly tests)  
**Optional Enhancements**: +12 hours (~1.5 days)  
**Number of PRs**: 12 (core) + 2 (optional)  
**Risk Level**: Medium (manual CourseID entry, cascade delete behavior)

## 9. Links

### Related Documentation

- [Razor Pages with EF Core - CRUD](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/crud)
- [Working with Related Data](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/read-related-data)
- [SelectList Class](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.rendering.selectlist)

### Related Modules

- [Data-Access-Layer](../Data-Access-Layer/README.md) - Database context and Course entity
- [Departments](../Departments/README.md) - Related department management (FK relationship)
- [Students](../Students/README.md) - Related student management (via Enrollments)
- [Instructors](../Instructors/README.md) - Related instructor management (many-to-many)

### Related Issues/PRs

- (To be created during implementation)
- `Issue #20`: Create comprehensive test suite for Courses module
- `Issue #21`: Add CourseID uniqueness validation
- `Issue #22`: Add cascade delete error handling
- `Issue #23`: Display enrollments and instructors in Course Details
- `PR #20`: [CRS-1] Create Courses module test infrastructure
- `PR #21`: [CRS-2] Add unit tests for DepartmentNamePageModel
- (Additional PRs to be linked as created)

### Database Schema References

- Course.CourseID: Primary Key (DatabaseGeneratedOption.None - manual entry)
- Course.DepartmentID: Foreign Key → Department.DepartmentID
- Course-Instructor: Many-to-many relationship (join table)
- Course-Enrollment: One-to-many relationship

### External Resources

- [ContosoUniversity Tutorial - Working with Related Data](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/read-related-data)
- [EF Core - Database Generated Values](https://learn.microsoft.com/en-us/ef/core/modeling/generated-properties)
- [EF Core - Cascade Delete](https://learn.microsoft.com/en-us/ef/core/saving/cascade-delete)
