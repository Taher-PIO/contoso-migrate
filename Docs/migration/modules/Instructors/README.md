# Instructors – Migration Notes

## 1. Purpose & Responsibilities

The Instructors module manages faculty members and implements advanced many-to-many relationship handling with courses. This module is responsible for:

- **Instructor CRUD Operations**: Create, Read, Update, and Delete instructor records
- **Course Assignment Management**: Many-to-many relationship between instructors and courses
- **Office Assignment Tracking**: One-to-one relationship with office locations
- **Master-Detail UI Pattern**: Three-level drill-down (Instructors → Courses → Enrollments)
- **ViewModels for Complex Data**: InstructorIndexData and AssignedCourseData
- **Department Administration**: Instructors can be department administrators

This module demonstrates advanced EF Core techniques including explicit loading, complex includes, and many-to-many relationship management.

## 2. Public Surface (Controllers/Endpoints/Classes)

### Razor Pages

#### **Index Page** - Master-Detail Three-Level View

- **Route**: `/Instructors` or `/Instructors/Index?id={instructorId}&courseID={courseId}`
- **PageModel**: `ContosoUniversity.Pages.Instructors.IndexModel`
- **Handler**: `OnGetAsync(int? id, int? courseID)`
- **Pattern**: Master-Detail with drill-down
  - Level 1: All instructors with office assignments and courses
  - Level 2 (if id present): Courses for selected instructor
  - Level 3 (if courseID present): Students enrolled in selected course
- **ViewModel**: `InstructorIndexData` aggregates data for all three levels
- **Advanced EF**: Uses explicit loading (`.LoadAsync()`) for level 3
- **Query Strategy**:
  - Eager loading for instructors (Include/ThenInclude)
  - Explicit loading for enrollments (on-demand)

#### **Create Page** - New Instructor with Course Assignment

- **Route**: `/Instructors/Create`
- **PageModel**: `ContosoUniversity.Pages.Instructors.CreateModel : InstructorCoursesPageModel`
- **Handlers**:
  - `OnGet()` - Display form with course checkboxes
  - `OnPostAsync(string[] selectedCourses)` - Process creation with course assignments
- **Special**: Course selection via checkboxes (many-to-many)
- **Security**: Uses `TryUpdateModelAsync` with property whitelist
- **Validation**: Checks if selectedCourses exist in database
- **Logging**: Warns if course not found

#### **Edit Page** - Update Instructor and Course Assignments

- **Route**: `/Instructors/Edit/{id}`
- **PageModel**: `ContosoUniversity.Pages.Instructors.EditModel : InstructorCoursesPageModel`
- **Handlers**:
  - `OnGetAsync(int? id)` - Load instructor with office and courses
  - `OnPostAsync(int? id, string[] selectedCourses)` - Process updates
- **Special Features**:
  - Office location can be cleared (set to null)
  - UpdateInstructorCourses() manages many-to-many changes
  - HashSet for efficient membership testing
- **OfficeAssignment**: Handles one-to-one relationship (shared PK)
- **Security**: Uses `TryUpdateModelAsync` with property whitelist

#### **Delete, Details Pages** - Standard CRUD

- Similar to other modules
- Details likely shows office assignment and courses

### Base Class: InstructorCoursesPageModel

**Purpose**: Shared functionality for Create and Edit pages

**Location**: `Pages/Instructors/InstructorCoursesPageModel.cs`

**Key Method**:

```csharp
public void PopulateAssignedCourseData(SchoolContext context, Instructor instructor)
```

**Functionality**:

- Loads all courses from database
- Creates AssignedCourseData for each course
- Sets `Assigned` flag if instructor teaches that course
- Uses HashSet for efficient lookup

**Property**:

- `AssignedCourseDataList` - List of AssignedCourseData for checkboxes

### ViewModels

#### **InstructorIndexData** (`Models/SchoolViewModels/InstructorIndexData.cs`)

```csharp
public class InstructorIndexData
{
    public IEnumerable<Instructor> Instructors { get; set; }
    public IEnumerable<Course> Courses { get; set; }
    public IEnumerable<Enrollment> Enrollments { get; set; }
}
```

- Aggregates data for three-level master-detail view
- Instructors: All instructors with office and courses
- Courses: Filtered to selected instructor
- Enrollments: Filtered to selected course

#### **AssignedCourseData** (`Models/SchoolViewModels/AssignedCourseData.cs`)

```csharp
public class AssignedCourseData
{
    public int CourseID { get; set; }
    public string Title { get; set; }
    public bool Assigned { get; set; }
}
```

- Represents course checkbox state in Create/Edit forms
- `Assigned`: True if instructor teaches this course

## 3. Dependencies

### NuGet Packages

Inherits from main project:

- `Microsoft.AspNetCore.Mvc.RazorPages`
- `Microsoft.EntityFrameworkCore` 6.0.2

### Internal Project Dependencies

| Dependency            | Type        | Usage                               | Coupling Level |
| --------------------- | ----------- | ----------------------------------- | -------------- |
| `SchoolContext`       | Data Access | All CRUD, explicit loading          | High           |
| `Instructor`          | Entity      | Bound property, display             | High           |
| `Course`              | Entity      | Many-to-many relationship           | High           |
| `OfficeAssignment`    | Entity      | One-to-one relationship (shared PK) | High           |
| `Enrollment`          | Entity      | Displayed in Index level 3          | Medium         |
| `Student`             | Entity      | Displayed via Enrollment            | Medium         |
| `Department`          | Entity      | Displayed via Course                | Low            |
| `InstructorIndexData` | ViewModel   | Index page data aggregation         | Medium         |
| `AssignedCourseData`  | ViewModel   | Course checkbox rendering           | Medium         |

## 4. Migration Impact

### Current State

✅ Already modernized with advanced patterns:

- ASP.NET Core Razor Pages
- ViewModels for complex data
- Explicit loading for performance
- Many-to-many relationship management
- Async/await throughout
- Overposting protection (Edit page)

### Unique Characteristics

| Feature                     | Other Modules | Instructors          | Significance               |
| --------------------------- | ------------- | -------------------- | -------------------------- |
| **Master-Detail UI**        | ❌ No         | ✅ Three levels      | Advanced UI pattern        |
| **Explicit Loading**        | ❌ No         | ✅ Yes (enrollments) | Performance optimization   |
| **ViewModels**              | ❌ No         | ✅ Yes (2 VMs)       | Separation of concerns     |
| **Many-to-Many Management** | ❌ No         | ✅ Complex logic     | UpdateInstructorCourses()  |
| **Checkbox Binding**        | ❌ No         | ✅ Yes (courses)     | Advanced form handling     |
| **One-to-One Relationship** | ❌ No         | ✅ OfficeAssignment  | Shared primary key         |
| **HashSet for Performance** | ❌ No         | ✅ Yes               | Efficient membership tests |

### Migration .NET 6 → 8

#### API Changes Needed

1. **Minimal Breaking Changes**: EF Core many-to-many APIs stable
2. **EF Core 8 Enhancements**:
   - Many-to-many now has better support for join entities
   - Consider adding explicit join table if audit fields needed

#### Recommended Enhancements

**A. Add Overposting Protection to Create Page**:

```csharp
public async Task<IActionResult> OnPostAsync(string[] selectedCourses)
{
    var newInstructor = new Instructor();

    if (await TryUpdateModelAsync<Instructor>(
        newInstructor,
        "Instructor",
        i => i.FirstMidName, i => i.LastName, i => i.HireDate))
    {
        // ... rest of code
    }
}
```

**B. Cache Course List** (if courses rarely change):

```csharp
public void PopulateAssignedCourseData(
    SchoolContext context,
    IMemoryCache cache,
    Instructor instructor)
{
    var allCourses = cache.GetOrCreate("AllCourses", entry =>
    {
        entry.SlidingExpiration = TimeSpan.FromMinutes(30);
        return context.Courses.ToList();
    });
    // ... rest of logic
}
```

**C. Use AsNoTracking in Index** (Level 1):

```csharp
InstructorData.Instructors = await _context.Instructors
    .Include(i => i.OfficeAssignment)
    .Include(i => i.Courses)
        .ThenInclude(c => c.Department)
    .AsNoTracking()  // ADD THIS
    .OrderBy(i => i.LastName)
    .ToListAsync();
```

## 5. Data Access

### Current Patterns

#### Index Page - Three-Level Loading Strategy

**Level 1: All Instructors** (eager loading):

```csharp
InstructorData.Instructors = await _context.Instructors
    .Include(i => i.OfficeAssignment)
    .Include(i => i.Courses)
        .ThenInclude(c => c.Department)
    .OrderBy(i => i.LastName)
    .ToListAsync();
```

**Level 2: Filter Courses** (in-memory):

```csharp
if (id != null)
{
    Instructor instructor = InstructorData.Instructors
        .Where(i => i.ID == id.Value).Single();
    InstructorData.Courses = instructor.Courses;
}
```

**Level 3: Explicit Loading** (on-demand):

```csharp
if (courseID != null)
{
    var selectedCourse = InstructorData.Courses
        .Where(x => x.CourseID == courseID).Single();

    // Explicit loading - only loads when needed
    await _context.Entry(selectedCourse)
        .Collection(x => x.Enrollments).LoadAsync();

    foreach (Enrollment enrollment in selectedCourse.Enrollments)
    {
        await _context.Entry(enrollment)
            .Reference(x => x.Student).LoadAsync();
    }

    InstructorData.Enrollments = selectedCourse.Enrollments;
}
```

**Performance Characteristics**:

- ✅ Level 1: Single query with multiple JOINs (efficient)
- ✅ Level 2: No query (already loaded)
- ⚠️ Level 3: N+1 query problem (one per enrollment)
  - Alternative: `.Include(c => c.Enrollments).ThenInclude(e => e.Student)` at Level 1
  - Trade-off: Load all enrollments upfront vs. on-demand

#### Edit Page - Many-to-Many Management

**Load Instructor with Courses**:

```csharp
var instructorToUpdate = await _context.Instructors
    .Include(i => i.OfficeAssignment)
    .Include(i => i.Courses)
    .FirstOrDefaultAsync(s => s.ID == id);
```

**Update Courses (Many-to-Many)**:

```csharp
public void UpdateInstructorCourses(string[] selectedCourses, Instructor instructorToUpdate)
{
    if (selectedCourses == null)
    {
        instructorToUpdate.Courses = new List<Course>();
        return;
    }

    var selectedCoursesHS = new HashSet<string>(selectedCourses);
    var instructorCourses = new HashSet<int>(
        instructorToUpdate.Courses.Select(c => c.CourseID));

    foreach (var course in _context.Courses)
    {
        if (selectedCoursesHS.Contains(course.CourseID.ToString()))
        {
            if (!instructorCourses.Contains(course.CourseID))
            {
                instructorToUpdate.Courses.Add(course);  // Add relationship
            }
        }
        else
        {
            if (instructorCourses.Contains(course.CourseID))
            {
                instructorToUpdate.Courses.Remove(course);  // Remove relationship
            }
        }
    }
}
```

**Characteristics**:

- ✅ EF Core automatically manages join table (InstructorCourse)
- ✅ HashSet provides O(1) membership checks
- ⚠️ Iterates all courses (could optimize to only load relevant courses)

#### Create Page - Course Assignment

**Load Courses into Context**:

```csharp
if (selectedCourses.Length > 0)
{
    newInstructor.Courses = new List<Course>();
    _context.Courses.Load();  // Load all courses into context
}

foreach (var course in selectedCourses)
{
    var foundCourse = await _context.Courses.FindAsync(int.Parse(course));
    if (foundCourse != null)
    {
        newInstructor.Courses.Add(foundCourse);
    }
}
```

**Characteristics**:

- ✅ `.Load()` loads all courses into context (single query)
- ✅ `.FindAsync()` checks local context first (no additional queries)
- ⚠️ Could optimize to only load selected courses

### Known Issues & Risks

| Issue                                            | Risk Level | Impact                 | Recommendation                               |
| ------------------------------------------------ | ---------- | ---------------------- | -------------------------------------------- |
| **N+1 queries in Index Level 3**                 | Medium     | Performance            | Consider eager loading if typically accessed |
| **Loading all courses in Edit**                  | Low        | Performance            | Only significant if 1000+ courses            |
| **No AsNoTracking in Index**                     | Low        | Minor memory           | Add AsNoTracking                             |
| **Create page no TryUpdateModelAsync**           | High       | Security vulnerability | Add overposting protection                   |
| **HashSet iteration in UpdateInstructorCourses** | Low        | Code readability       | Consider LINQ except/intersect               |

## 6. Test Coverage

### Existing Tests

❌ **No tests exist**

### Critical Test Cases

**P0 - Critical**:

1. **IndexModel**:

   - `OnGetAsync_NoParams_LoadsAllInstructors`
   - `OnGetAsync_WithInstructorID_LoadsInstructorCourses`
   - `OnGetAsync_WithCourseID_LoadsEnrollments`
   - `ExplicitLoading_LoadsStudentsForEnrollments`

2. **EditModel**:

   - `UpdateInstructorCourses_AddCourse_Succeeds`
   - `UpdateInstructorCourses_RemoveCourse_Succeeds`
   - `OnPostAsync_ClearOfficeLocation_SetsToNull`
   - `OnPostAsync_ValidUpdate_SavesChanges`

3. **CreateModel**:
   - `OnPostAsync_ValidInstructor_CreatesWithCourses`
   - `OnPostAsync_InvalidCourseID_LogsWarning`

**P1 - High**:

- Integration tests for many-to-many operations
- Performance tests for Index page with 100+ instructors
- ViewModel population tests

## 7. Risks & Rollback

### Module-Specific Risks

| Risk                              | Likelihood | Impact | Mitigation                                       |
| --------------------------------- | ---------- | ------ | ------------------------------------------------ |
| **N+1 query performance**         | Medium     | Medium | Monitor query count; add eager loading if needed |
| **Many-to-many sync issues**      | Low        | High   | Comprehensive integration tests                  |
| **Create page overposting**       | Medium     | High   | Add TryUpdateModelAsync (Task INST-5)            |
| **Office assignment PK conflict** | Low        | High   | Already handled (shared PK pattern)              |
| **Large course list performance** | Low        | Medium | Add pagination or search if > 500 courses        |

### Rollback Strategy

Standard git revert; no special database considerations for Instructor records.

## 8. Work Breakdown

### Task INST-1: Create Test Infrastructure

**Estimate**: 3 hours | **LOC**: ~100

- Create test helpers for instructors, courses, office assignments
- Add ViewModel test helpers

### Task INST-2: Unit Tests for IndexModel

**Estimate**: 6 hours | **LOC**: ~300

- Test all three drill-down levels
- Test explicit loading behavior
- Test ViewModel population

### Task INST-3: Unit Tests for Edit/Create Models

**Estimate**: 5 hours | **LOC**: ~250

- Test UpdateInstructorCourses logic (add/remove/clear)
- Test course assignment on create
- Test office assignment clearing

### Task INST-4: Integration Tests for Many-to-Many

**Estimate**: 5 hours | **LOC**: ~200

- Test complete workflow: create → assign courses → edit courses → delete
- Test join table management
- Test concurrent course assignments

### Task INST-5: Add Overposting Protection to Create

**Estimate**: 2 hours | **LOC**: ~30

- Add TryUpdateModelAsync with property whitelist
- Add tests for overposting prevention

### Task INST-6: Add AsNoTracking to Index

**Estimate**: 1 hour | **LOC**: ~5

- Add AsNoTracking to Level 1 query
- Verify explicit loading still works

### Task INST-7: Optimize Course Loading in Edit

**Estimate**: 3 hours | **LOC**: ~50

- Load only relevant courses instead of all
- Add caching for course list (optional)
- Performance benchmark

### Task INST-8: Consider Eager Loading for Level 3

**Estimate**: 4 hours | **LOC**: ~40

- Evaluate eager loading vs. explicit loading trade-off
- Implement if beneficial
- Performance comparison

---

**Total Estimated Effort**: 29 hours (~3.6 days)  
**Total LOC**: ~975  
**PRs**: 8  
**Risk Level**: Medium (many-to-many complexity)

## 9. Links

### Related Documentation

- [EF Core Many-to-Many Relationships](https://learn.microsoft.com/en-us/ef/core/modeling/relationships/many-to-many)
- [Explicit Loading in EF Core](https://learn.microsoft.com/en-us/ef/core/querying/related-data/explicit)
- [Master-Detail Razor Pages](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/read-related-data)

### Related Modules

- [Data-Access-Layer](../Data-Access-Layer/README.md) - Instructor, Course, OfficeAssignment entities
- [Courses](../Courses/README.md) - Related courses (many-to-many)
- [Departments](../Departments/README.md) - Administrator relationship

### Related Issues/PRs

- `Issue #40`: Create test suite for Instructors module
- `Issue #41`: Add overposting protection to Create page
- `Issue #42`: Optimize Index page query strategy
- `PR #40`: [INST-1] Create test infrastructure
- (Additional PRs to be linked)
