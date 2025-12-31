# Departments – Migration Notes

## 1. Purpose & Responsibilities

The Departments module manages academic departments and implements advanced optimistic concurrency control patterns. This module is responsible for:

- **Department CRUD Operations**: Create, Read, Update, and Delete department records
- **Optimistic Concurrency Control**: Prevent lost updates using concurrency tokens
- **Conflict Resolution**: Detect and handle simultaneous edits by multiple users
- **Administrator Assignment**: Link departments to faculty administrators (Instructors)
- **Budget Tracking**: Manage department budgets with currency formatting
- **Courses Association**: Departments own courses (one-to-many relationship)

This module serves as a reference implementation for handling concurrency conflicts in ASP.NET Core applications.

## 2. Public Surface (Controllers/Endpoints/Classes)

### Razor Pages (UI Layer)

All pages located in `Pages/Departments/` namespace.

#### **Index Page** - Department Listing

- **Route**: `/Departments` or `/Departments/Index`
- **PageModel**: `ContosoUniversity.Pages.Departments.IndexModel`
- **Handler**: `OnGetAsync()`
- **Output**: `IList<Department>` with Administrator eager loading
- **Features**:
  - Display all departments
  - Show name, budget, start date, and administrator
  - No pagination, sorting, or filtering

#### **Create Page** - New Department

- **Route**: `/Departments/Create`
- **PageModel**: `ContosoUniversity.Pages.Departments.CreateModel`
- **Handlers**:
  - `OnGet()` - Display form with instructor dropdown
  - `OnPostAsync()` - Process department creation
- **Input**: `Department` model (full model binding)
- **Output**: Redirect to Index on success
- **Validation**: Uses ModelState validation (no TryUpdateModelAsync)
- **Dropdown**: ViewData["InstructorID"] for administrator selection

#### **Edit Page** - Update Department (with Concurrency Control)

- **Route**: `/Departments/Edit/{id}`
- **PageModel**: `ContosoUniversity.Pages.Departments.EditModel`
- **Handlers**:
  - `OnGetAsync(int id)` - Load department with concurrency token
  - `OnPostAsync(int id)` - Process updates with concurrency check
- **Special**: **Most Complex Page in Application**
- **Concurrency**: Uses `ConcurrencyToken` ([Timestamp]) to detect conflicts
- **Conflict Detection**: Catches `DbUpdateConcurrencyException`
- **Conflict Resolution**: Displays current values and user's values side-by-side
- **Helper Methods**:
  - `HandleDeletedDepartment()` - Handle delete during edit
  - `setDbErrorMessage()` - Display field-level conflicts
- **Security**: Uses `TryUpdateModelAsync` with property whitelist

#### **Delete Page** - Remove Department (with Concurrency Control)

- **Route**: `/Departments/Delete/{id}`
- **PageModel**: `ContosoUniversity.Pages.Departments.DeleteModel`
- **Handlers**:
  - `OnGetAsync(int id, bool? concurrencyError)` - Display confirmation
  - `OnPostAsync(int id)` - Perform deletion with concurrency check
- **Concurrency**: Catches `DbUpdateConcurrencyException` on delete
- **Error Handling**: Displays error if record modified after delete selected
- **Query Strategy**: Uses `.AsNoTracking()` for confirmation page

#### **Details Page** - Department Information View

- **Route**: `/Departments/Details/{id}`
- **PageModel**: `ContosoUniversity.Pages.Departments.DetailsModel`
- **Handler**: `OnGetAsync(int? id)`
- **Output**: Single `Department` with Administrator information
- **Query Strategy**: Uses `.Include(d => d.Administrator)` for eager loading
- **Missing**: Does not display related Courses

### Input/Output Contracts

#### Input: Department Creation/Edit Form

```csharp
{
    "Name": "string (3-50 chars, required)",
    "Budget": "decimal (currency format)",
    "StartDate": "DateTime (date only, formatted yyyy-MM-dd)",
    "InstructorID": "int? (nullable, selected from dropdown)",
    "ConcurrencyToken": "byte[] (hidden field for Edit only)"
}
```

**Validation Rules**:

- Name: StringLength(50, MinimumLength = 3)
- Budget: DataType(DataType.Currency), Column(TypeName = "money")
- StartDate: DataType(DataType.Date)
- InstructorID: Nullable (department may not have administrator)
- ConcurrencyToken: [Timestamp] attribute (database-managed)

#### Output: Department Index Listing

```csharp
IList<Department> [
    {
        DepartmentID: int,
        Name: string,
        Budget: decimal,
        StartDate: DateTime,
        InstructorID: int?,
        Administrator: {
            ID: int,
            FirstMidName: string,
            LastName: string,
            FullName: string (computed)
        },
        ConcurrencyToken: byte[],
        Courses: null  // Not loaded
    }
]
```

#### Concurrency Conflict Response (Edit Page)

```
ModelState Errors:
- "Department.Name": "Current value: Engineering"
- "Department.Budget": "Current value: $350,000.00"
- "Department.StartDate": "Current value: 2007-09-01"
- "Department.InstructorID": "Current value: Fadi Fakhouri"
- "": "The record you attempted to edit was modified by another user after you..."
```

### External Contracts

- **None**: This module only interacts with the UI
- **Future API**: Would require complex concurrency handling in REST APIs (ETag headers, If-Match)

## 3. Dependencies

### NuGet Packages

Inherits from main project:

- `Microsoft.AspNetCore.Mvc.RazorPages` (via SDK)
- `Microsoft.EntityFrameworkCore` 6.0.2

### Internal Project Dependencies

| Dependency                             | Type         | Usage                                    | Coupling Level |
| -------------------------------------- | ------------ | ---------------------------------------- | -------------- |
| `ContosoUniversity.Data.SchoolContext` | Data Access  | All CRUD and concurrency operations      | High           |
| `ContosoUniversity.Models.Department`  | Entity Model | Bound property, concurrency token        | High           |
| `ContosoUniversity.Models.Instructor`  | Entity Model | Administrator relationship, dropdown     | High           |
| `ContosoUniversity.Models.Course`      | Entity Model | One-to-many relationship (not displayed) | Low            |
| `ContosoUniversity.Utility`            | Utility      | GetLastChars (display ConcurrencyToken)  | Low            |

### System.Web Usage

- ✅ **No System.Web dependencies**

### Framework Dependencies

- `Microsoft.AspNetCore.Mvc` - PageModel, ViewData, SelectList
- `Microsoft.EntityFrameworkCore` - DbUpdateConcurrencyException, Include, Entry, GetDatabaseValues
- `System.ComponentModel.DataAnnotations` - [Timestamp], validation attributes

## 4. Migration Impact

### Current State Assessment

The Departments module is **already modernized** and implements **advanced patterns**:

- ✅ ASP.NET Core Razor Pages
- ✅ Async/await throughout
- ✅ **Optimistic Concurrency Control** with [Timestamp]
- ✅ **Conflict Detection and Resolution** with detailed error messages
- ✅ Dependency injection
- ✅ Modern validation
- ✅ CSRF protection
- ✅ Overposting protection (Edit page only)

### Unique Characteristics

| Feature                                   | Students/Courses    | Departments              | Significance                          |
| ----------------------------------------- | ------------------- | ------------------------ | ------------------------------------- |
| **Concurrency Control**                   | ❌ No               | ✅ Yes                   | **Critical** for multi-user scenarios |
| **Conflict Resolution UI**                | ❌ No               | ✅ Yes                   | Shows current vs. user values         |
| **DbUpdateConcurrencyException Handling** | Basic (Delete only) | Advanced (Edit & Delete) | Production-grade error handling       |
| **OriginalValue Tracking**                | ❌ No               | ✅ Yes                   | EF Core advanced feature              |
| **GetDatabaseValues()**                   | ❌ No               | ✅ Yes                   | Fetch current DB values on conflict   |
| **Field-Level Conflict Display**          | ❌ No               | ✅ Yes                   | User-friendly conflict resolution     |
| **Create Overposting Protection**         | ✅ Yes              | ❌ No                    | **Security Gap** in Create            |

### Migration from .NET 6 → .NET 8

#### API Changes Needed

1. **Minimal Breaking Changes Expected**:

   - Concurrency APIs unchanged in EF Core 8
   - DbUpdateConcurrencyException handling unchanged

2. **Recommended Enhancements for .NET 8**:

   **A. Add Overposting Protection to Create Page**:

   ```csharp
   public async Task<IActionResult> OnPostAsync()
   {
       var emptyDepartment = new Department();

       if (await TryUpdateModelAsync<Department>(
           emptyDepartment,
           "department",
           d => d.Name, d => d.Budget, d => d.StartDate, d => d.InstructorID))
       {
           _context.Departments.Add(emptyDepartment);
           await _context.SaveChangesAsync();
           return RedirectToPage("./Index");
       }

       ViewData["InstructorID"] = new SelectList(_context.Instructors, "ID", "FullName");
       return Page();
   }
   ```

   **B. Add AsNoTracking to Details Page**:

   ```csharp
   Department = await _context.Departments
       .Include(d => d.Administrator)
       .AsNoTracking()  // Add this
       .FirstOrDefaultAsync(m => m.DepartmentID == id);
   ```

   **C. Display Related Courses in Details**:

   ```csharp
   Department = await _context.Departments
       .Include(d => d.Administrator)
       .Include(d => d.Courses)
       .AsNoTracking()
       .FirstOrDefaultAsync(m => m.DepartmentID == id);
   ```

   **D. Add InstructorNameSL Property** (like Courses module):

   ```csharp
   public SelectList InstructorNameSL { get; set; }

   private void PopulateInstructorsDropDownList(int? selectedInstructor = null)
   {
       var instructorsQuery = from i in _context.Instructors
                              orderby i.LastName, i.FirstMidName
                              select i;
       InstructorNameSL = new SelectList(instructorsQuery, "ID", "FullName", selectedInstructor);
   }
   ```

#### Configuration Deltas

**Current Configuration**: None specific to Departments module

**Post-.NET 8 Migration** (recommended additions):

```json
{
  "DepartmentModule": {
    "DefaultBudget": 250000,
    "EnableConcurrencyLogging": true,
    "ConcurrencyRetryAttempts": 3,
    "CascadeDeleteBehavior": "Restrict"
  }
}
```

## 5. Data Access

### Current Patterns

#### Index Page - Simple List with Administrator

```csharp
Department = await _context.Departments
    .Include(d => d.Administrator)
    .ToListAsync();
```

**Characteristics**:

- ✅ Eager loading Administrator
- ❌ NOT using AsNoTracking (should for read-only)
- ⚠️ No pagination (could be issue with many departments)

#### Edit Page - Complex Concurrency Handling

```csharp
// Step 1: Load for display
Department = await _context.Departments
    .Include(d => d.Administrator)
    .AsNoTracking()
    .FirstOrDefaultAsync(m => m.DepartmentID == id);

// Step 2: Load for update
var departmentToUpdate = await _context.Departments
    .Include(i => i.Administrator)
    .FirstOrDefaultAsync(m => m.DepartmentID == id);

// Step 3: Set original concurrency token
_context.Entry(departmentToUpdate)
    .Property(d => d.ConcurrencyToken)
    .OriginalValue = Department.ConcurrencyToken;

// Step 4: Update specific properties
if (await TryUpdateModelAsync<Department>(
    departmentToUpdate,
    "Department",
    s => s.Name, s => s.StartDate, s => s.Budget, s => s.InstructorID))
{
    try
    {
        await _context.SaveChangesAsync();  // May throw DbUpdateConcurrencyException
        return RedirectToPage("./Index");
    }
    catch (DbUpdateConcurrencyException ex)
    {
        // Concurrency conflict detected
        var exceptionEntry = ex.Entries.Single();
        var clientValues = (Department)exceptionEntry.Entity;
        var databaseEntry = exceptionEntry.GetDatabaseValues();

        if (databaseEntry == null)
        {
            // Record deleted by another user
            ModelState.AddModelError(string.Empty, "Department was deleted");
            return Page();
        }

        var dbValues = (Department)databaseEntry.ToObject();
        await setDbErrorMessage(dbValues, clientValues, _context);

        // Update hidden field with new token for retry
        Department.ConcurrencyToken = dbValues.ConcurrencyToken;
        ModelState.Remove($"{nameof(Department)}.{nameof(Department.ConcurrencyToken)}");
    }
}
```

**Concurrency Flow**:

1. User A loads department (ConcurrencyToken = `0x12345`)
2. User B loads same department (ConcurrencyToken = `0x12345`)
3. User A saves changes → Token changes to `0x67890` in database
4. User B submits form with old token `0x12345`
5. EF Core detects mismatch → `DbUpdateConcurrencyException` thrown
6. Catch block fetches current DB values (`0x67890`)
7. Display both User B's values and current DB values
8. User B reviews and resubmits with new token

#### Delete Page - Concurrency on Delete

```csharp
try
{
    if (await _context.Departments.AnyAsync(m => m.DepartmentID == id))
    {
        _context.Departments.Remove(Department);
        await _context.SaveChangesAsync();
    }
    return RedirectToPage("./Index");
}
catch (DbUpdateConcurrencyException)
{
    return RedirectToPage("./Delete", new { concurrencyError = true, id = id });
}
```

**Characteristics**:

- ✅ Catches concurrency exceptions
- ✅ User-friendly error message
- ⚠️ Department.ConcurrencyToken must be populated from hidden field in view

### Known Issues & Risks

| Issue                              | Risk Level | Impact                                  | Recommendation                   |
| ---------------------------------- | ---------- | --------------------------------------- | -------------------------------- |
| **Create page overposting**        | High       | Security vulnerability                  | Add TryUpdateModelAsync          |
| **Index page no AsNoTracking**     | Low        | Minor performance impact                | Add AsNoTracking()               |
| **No pagination**                  | Low        | Performance with many departments       | Add if needed                    |
| **Concurrency complexity**         | Medium     | Developer must understand pattern       | Thorough documentation and tests |
| **ViewData instead of properties** | Low        | Less type-safe than SelectList property | Refactor to property             |
| **Cascade delete with courses**    | High       | May fail or delete courses              | Test and document behavior       |

### EF Core Concurrency Internals

**Database Schema** (SQL Server):

```sql
CREATE TABLE [Department] (
    [DepartmentID] INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(50),
    [Budget] MONEY,
    [StartDate] DATETIME2,
    [InstructorID] INT NULL,
    [ConcurrencyToken] ROWVERSION NOT NULL  -- Auto-updated by SQL Server
);
```

**ROWVERSION Behavior**:

- Automatically incremented by SQL Server on INSERT/UPDATE
- EF Core tracks original value and checks on SaveChanges
- WHERE clause includes `ConcurrencyToken = @OriginalToken`
- If no rows affected (token mismatch), exception thrown

## 6. Test Coverage

### Existing Tests

**Current State**: ❌ **No tests exist for Departments module**

### Critical Test Gaps

Given the complexity of concurrency handling, **testing is CRITICAL** for this module:

1. **Concurrency Tests**: None

   - Simultaneous edit by two users
   - Edit after delete
   - Delete after edit
   - Correct conflict resolution display

2. **Unit Tests**: None

   - setDbErrorMessage() logic
   - HandleDeletedDepartment() logic
   - Dropdown population

3. **Integration Tests**: None
   - Full Edit workflow with conflict
   - Delete workflow with conflict
   - Cascade delete with related courses

### Proposed Tests

#### Test Project Structure

```
ContosoUniversity.Tests/
├── Unit/
│   └── Pages/
│       └── Departments/
│           ├── IndexModelTests.cs
│           ├── CreateModelTests.cs
│           ├── EditModelTests.cs (CRITICAL - concurrency)
│           ├── DeleteModelTests.cs (CRITICAL - concurrency)
│           └── DetailsModelTests.cs
└── Integration/
    └── Departments/
        ├── ConcurrencyEditTests.cs (CRITICAL)
        ├── ConcurrencyDeleteTests.cs (CRITICAL)
        └── CascadeDeleteTests.cs
```

#### Priority Test Cases

**P0 - CRITICAL** (concurrency scenarios):

1. **EditModelTests**:

   - `OnPostAsync_ConcurrentEdit_ThrowsDbUpdateConcurrencyException`
   - `OnPostAsync_ConcurrentEdit_DisplaysCurrentValues`
   - `OnPostAsync_ConcurrentEdit_DisplaysClientValues`
   - `OnPostAsync_ConcurrentEdit_UpdatesConcurrencyToken`
   - `OnPostAsync_DeletedDuringEdit_HandlesCorrectly`
   - `setDbErrorMessage_AllFieldsChanged_DisplaysAllErrors`
   - `HandleDeletedDepartment_AddsModelStateError`

2. **DeleteModelTests**:

   - `OnPostAsync_ConcurrentDelete_CatchesException`
   - `OnPostAsync_ConcurrentDelete_DisplaysErrorMessage`
   - `OnGetAsync_WithConcurrencyError_DisplaysMessage`

3. **ConcurrencyEditTests** (integration):
   - `TwoUsers_SimultaneousEdit_SecondUserSeesConflict`
   - `UserA_Edits_UserB_DeletesThenEdits_Fails`
   - `Conflict_UserResubmits_Succeeds`

**P1 - High**:

4. **CreateModelTests**:

   - `OnPostAsync_ValidDepartment_Succeeds`
   - `OnPostAsync_NullAdministrator_Succeeds`
   - `OnPostAsync_InvalidBudget_FailsValidation`

5. **CascadeDeleteTests**:
   - `DeleteDepartment_WithCourses_VerifyBehavior`

**P2 - Medium**:

- Performance tests
- Load tests with many departments

### Sample Concurrency Test

```csharp
[Fact]
public async Task TwoUsers_SimultaneousEdit_SecondUserSeesConflict()
{
    // Arrange
    var context = GetTestDbContext();
    var department = new Department
    {
        Name = "Engineering",
        Budget = 350000,
        StartDate = DateTime.Parse("2007-09-01")
    };
    context.Departments.Add(department);
    await context.SaveChangesAsync();
    var originalToken = department.ConcurrencyToken;

    // User A loads department
    var contextA = GetTestDbContext();
    var deptA = await contextA.Departments.FindAsync(department.DepartmentID);

    // User B loads department
    var contextB = GetTestDbContext();
    var deptB = await contextB.Departments.FindAsync(department.DepartmentID);

    // User A makes changes and saves
    deptA.Name = "Computer Science";
    await contextA.SaveChangesAsync();
    deptA.ConcurrencyToken.Should().NotEqual(originalToken);

    // User B makes changes and tries to save
    deptB.Name = "Software Engineering";
    contextB.Entry(deptB).Property(d => d.ConcurrencyToken).OriginalValue = originalToken;

    // Act & Assert
    await Assert.ThrowsAsync<DbUpdateConcurrencyException>(
        async () => await contextB.SaveChangesAsync());
}
```

## 7. Risks & Rollback

### Module-Specific Risks

| Risk                                           | Likelihood | Impact   | Mitigation                                   |
| ---------------------------------------------- | ---------- | -------- | -------------------------------------------- |
| **Concurrency conflicts not handled**          | High       | Critical | Already mitigated with excellent pattern     |
| **Concurrency complexity confuses developers** | Medium     | Medium   | Thorough documentation, code comments, tests |
| **Create page overposting**                    | Medium     | High     | Add TryUpdateModelAsync (Task DEPT-7)        |
| **Cascade delete with courses**                | Medium     | High     | Test behavior; add error handling            |
| **Lost updates without concurrency token**     | Very Low   | Critical | Already mitigated with [Timestamp]           |
| **Token display confuses users**               | Low        | Low      | Utility.GetLastChars shows last byte only    |
| **Performance with large datasets**            | Low        | Medium   | Add pagination if needed                     |

### Concurrency Token Considerations

**Database-Managed Token**:

- ✅ SQL Server ROWVERSION auto-increments
- ✅ Cannot be manually set or spoofed
- ✅ Guaranteed uniqueness per row version
- ⚠️ Different databases (SQLite, PostgreSQL) handle differently

**Hidden Field in View**:

```html
<input type="hidden" asp-for="Department.ConcurrencyToken" />
```

- ✅ Preserves token across postback
- ✅ Required for concurrency check
- ⚠️ View must include this field or concurrency check fails

### Security Considerations

**Current Protections**:

- ✅ CSRF protection (anti-forgery tokens)
- ✅ SQL injection prevention (EF Core parameterized queries)
- ✅ Overposting protection (Edit page with TryUpdateModelAsync)
- ❌ **Missing**: Overposting protection on Create page
- ✅ Concurrency token prevents lost updates

**Potential Enhancements**:

- Add authorization (restrict to admin roles)
- Audit logging for department changes
- Budget approval workflow for large changes

### Rollback Strategy

#### If Concurrency Issues Arise

**Code Rollback**:

```bash
git revert <commit-hash>
dotnet build
dotnet run
```

**Database Rollback**:

- No special considerations for Department data
- ConcurrencyToken is database-managed (no manual intervention needed)

**Testing Before Production**:

1. ✅ Run concurrency conflict tests (simulate simultaneous edits)
2. ✅ Test Edit → Edit conflict resolution flow manually
3. ✅ Test Delete → Edit conflict manually
4. ✅ Test Edit → Delete conflict manually
5. ✅ Verify error messages are user-friendly
6. ✅ Test cascade delete with related courses

#### Monitoring in Production

**Key Metrics**:

- DbUpdateConcurrencyException rate (should be low)
- Department edit success rate
- User conflict resolution success rate (do they retry successfully?)

**Logging Recommendations**:

```csharp
_logger.LogWarning("Concurrency conflict detected for Department {DepartmentID} by user {UserId}",
    id, userId);
_logger.LogInformation("Department {DepartmentID} edited successfully after conflict resolution", id);
```

## 8. Work Breakdown

All tasks sized to ≤300 LOC changes per PR.

### Task DEPT-1: Create Departments Module Test Infrastructure

**Estimate**: 2 hours  
**LOC**: ~70  
**Acceptance Criteria**:

- [ ] Create `Pages/Departments/` test directory
- [ ] Add helper for creating test departments with concurrency tokens
- [ ] Add helper for simulating concurrent contexts
- [ ] Add helper for creating test instructors
- [ ] Verify test project builds

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Departments/TestBase.cs`
- `NEW: ContosoUniversity.Tests/Helpers/DepartmentTestData.cs`

---

### Task DEPT-2: Unit Tests for Edit Page Concurrency Logic

**Estimate**: 8 hours (complex)  
**LOC**: ~400  
**Acceptance Criteria**:

- [ ] Test OnGetAsync loads department with administrator
- [ ] Test OnPostAsync saves changes successfully (no conflict)
- [ ] Test OnPostAsync catches DbUpdateConcurrencyException
- [ ] Test setDbErrorMessage displays all field conflicts
- [ ] Test HandleDeletedDepartment adds model error
- [ ] Test ConcurrencyToken update after conflict
- [ ] Test ModelState error clearing for retry
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Departments/EditModelTests.cs`

---

### Task DEPT-3: Integration Tests for Concurrent Edit Scenarios

**Estimate**: 6 hours  
**LOC**: ~300  
**Acceptance Criteria**:

- [ ] Test two users editing same department simultaneously
- [ ] Test UserA edits → UserB submits → conflict detected
- [ ] Test UserA deletes → UserB edits → handles correctly
- [ ] Test conflict resolution and successful retry
- [ ] Use real database (LocalDB or SQLite)
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Integration/Departments/ConcurrencyEditTests.cs`

---

### Task DEPT-4: Unit Tests for Delete Page Concurrency

**Estimate**: 4 hours  
**LOC**: ~180  
**Acceptance Criteria**:

- [ ] Test OnGetAsync loads department with administrator
- [ ] Test OnGetAsync with concurrencyError displays message
- [ ] Test OnPostAsync deletes successfully (no conflict)
- [ ] Test OnPostAsync catches DbUpdateConcurrencyException
- [ ] Test OnPostAsync redirects with concurrencyError=true
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Departments/DeleteModelTests.cs`

---

### Task DEPT-5: Integration Tests for Concurrent Delete Scenarios

**Estimate**: 4 hours  
**LOC**: ~200  
**Acceptance Criteria**:

- [ ] Test UserA edits → UserB deletes → conflict
- [ ] Test UserA deletes → UserB deletes → one succeeds
- [ ] Test delete after another user modified record
- [ ] Use real database
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Integration/Departments/ConcurrencyDeleteTests.cs`

---

### Task DEPT-6: Unit Tests for Create, Index, Details Pages

**Estimate**: 3 hours  
**LOC**: ~150  
**Acceptance Criteria**:

- [ ] CreateModel: Test OnGet, OnPostAsync valid/invalid
- [ ] IndexModel: Test OnGetAsync loads all departments
- [ ] DetailsModel: Test OnGetAsync valid/invalid ID
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Unit/Pages/Departments/CreateModelTests.cs`
- `NEW: ContosoUniversity.Tests/Unit/Pages/Departments/IndexModelTests.cs`
- `NEW: ContosoUniversity.Tests/Unit/Pages/Departments/DetailsModelTests.cs`

---

### Task DEPT-7: Add Overposting Protection to Create Page

**Estimate**: 2 hours  
**LOC**: ~30  
**Acceptance Criteria**:

- [ ] Replace full model binding with TryUpdateModelAsync
- [ ] Specify property whitelist (Name, Budget, StartDate, InstructorID)
- [ ] Repopulate dropdown on validation failure
- [ ] Add test for overposting prevention
- [ ] All existing tests still pass

**Files Changed**:

- `MODIFY: ContosoUniversity/Pages/Departments/Create.cshtml.cs` (~20 LOC)
- `MODIFY: ContosoUniversity.Tests/Unit/Pages/Departments/CreateModelTests.cs` (~30 LOC)

**Code Change**:

```csharp
public async Task<IActionResult> OnPostAsync()
{
    var emptyDepartment = new Department();

    if (await TryUpdateModelAsync<Department>(
        emptyDepartment,
        "department",
        d => d.Name, d => d.Budget, d => d.StartDate, d => d.InstructorID))
    {
        _context.Departments.Add(emptyDepartment);
        await _context.SaveChangesAsync();
        return RedirectToPage("./Index");
    }

    ViewData["InstructorID"] = new SelectList(_context.Instructors, "ID", "FullName");
    return Page();
}
```

---

### Task DEPT-8: Add AsNoTracking to Index and Details Pages

**Estimate**: 1 hour  
**LOC**: ~10  
**Acceptance Criteria**:

- [ ] Add AsNoTracking() to Index page query
- [ ] Add AsNoTracking() to Details page query
- [ ] Verify queries still work correctly
- [ ] Add tests to verify AsNoTracking used
- [ ] All tests pass

**Files Changed**:

- `MODIFY: ContosoUniversity/Pages/Departments/Index.cshtml.cs` (~2 LOC)
- `MODIFY: ContosoUniversity/Pages/Departments/Details.cshtml.cs` (~2 LOC)
- `MODIFY: ContosoUniversity.Tests/Unit/Pages/Departments/IndexModelTests.cs` (~20 LOC)
- `MODIFY: ContosoUniversity.Tests/Unit/Pages/Departments/DetailsModelTests.cs` (~20 LOC)

---

### Task DEPT-9: Refactor Create/Edit to Use SelectList Property

**Estimate**: 3 hours  
**LOC**: ~60  
**Acceptance Criteria**:

- [ ] Add InstructorNameSL property to CreateModel and EditModel
- [ ] Create PopulateInstructorsDropDownList() helper method
- [ ] Replace ViewData["InstructorID"] with InstructorNameSL
- [ ] Update Create.cshtml and Edit.cshtml to use new property
- [ ] Add tests for dropdown population
- [ ] All tests pass

**Files Changed**:

- `MODIFY: ContosoUniversity/Pages/Departments/Create.cshtml.cs` (~25 LOC)
- `MODIFY: ContosoUniversity/Pages/Departments/Edit.cshtml.cs` (~20 LOC)
- `MODIFY: ContosoUniversity/Pages/Departments/Create.cshtml` (~5 LOC)
- `MODIFY: ContosoUniversity/Pages/Departments/Edit.cshtml` (~5 LOC)
- `UPDATE: Tests` (~40 LOC)

---

### Task DEPT-10: Display Related Courses in Details Page

**Estimate**: 3 hours  
**LOC**: ~50  
**Acceptance Criteria**:

- [ ] Add `.Include(d => d.Courses)` to Details query
- [ ] Update Details.cshtml to display courses list
- [ ] Show CourseID, Title, Credits for each course
- [ ] Handle case where department has no courses
- [ ] Add tests for eager loading
- [ ] All tests pass

**Files Changed**:

- `MODIFY: ContosoUniversity/Pages/Departments/Details.cshtml.cs` (~5 LOC)
- `MODIFY: ContosoUniversity/Pages/Departments/Details.cshtml` (~30 LOC)
- `MODIFY: ContosoUniversity.Tests/Unit/Pages/Departments/DetailsModelTests.cs` (~30 LOC)

---

### Task DEPT-11: Integration Tests for Cascade Delete with Courses

**Estimate**: 4 hours  
**LOC**: ~150  
**Acceptance Criteria**:

- [ ] Determine actual ON DELETE behavior from migrations
- [ ] Test delete department with no courses (should succeed)
- [ ] Test delete department with courses (test expected behavior)
- [ ] Document cascade behavior in README
- [ ] Add error handling if ON DELETE RESTRICT
- [ ] All tests pass

**Files Changed**:

- `NEW: ContosoUniversity.Tests/Integration/Departments/CascadeDeleteTests.cs`
- `UPDATE: Docs/migration/modules/Departments/README.md` (Section 7)

---

### Task DEPT-12: Add Concurrency Logging and Monitoring

**Estimate**: 2 hours  
**LOC**: ~40  
**Acceptance Criteria**:

- [ ] Add ILogger to EditModel and DeleteModel
- [ ] Log concurrency conflicts with department ID and user
- [ ] Log successful conflict resolution
- [ ] Add structured logging (e.g., Serilog)
- [ ] Document logging strategy in README
- [ ] Verify logs appear in console/file

**Files Changed**:

- `MODIFY: ContosoUniversity/Pages/Departments/Edit.cshtml.cs` (~15 LOC)
- `MODIFY: ContosoUniversity/Pages/Departments/Delete.cshtml.cs` (~10 LOC)
- `UPDATE: Docs/migration/modules/Departments/README.md` (Section 7)

---

### Summary

**Total Estimated Effort**: 42 hours (~5.3 developer days)  
**Total Estimated LOC**: ~1,600 (mostly tests)  
**Number of PRs**: 12  
**Risk Level**: High (concurrency complexity)  
**Critical Tasks**: DEPT-2, DEPT-3, DEPT-4, DEPT-5 (concurrency tests)

## 9. Links

### Related Documentation

- [Handling Concurrency Conflicts](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/concurrency)
- [Optimistic Concurrency in EF Core](https://learn.microsoft.com/en-us/ef/core/saving/concurrency)
- [ROWVERSION Data Type (SQL Server)](https://learn.microsoft.com/en-us/sql/t-sql/data-types/rowversion-transact-sql)

### Related Modules

- [Data-Access-Layer](../Data-Access-Layer/README.md) - Department entity with [Timestamp]
- [Courses](../Courses/README.md) - Related courses (one-to-many)
- [Instructors](../Instructors/README.md) - Administrator relationship

### Related Issues/PRs

- (To be created during implementation)
- `Issue #30`: Create comprehensive test suite for Departments module
- `Issue #31`: Add overposting protection to Create page
- `Issue #32`: Add concurrency conflict integration tests
- `Issue #33`: Document cascade delete behavior with courses
- `PR #30`: [DEPT-1] Create Departments module test infrastructure
- `PR #31`: [DEPT-2] Add unit tests for Edit page concurrency
- (Additional PRs to be linked as created)

### Concurrency Pattern References

- [Pessimistic vs. Optimistic Concurrency](https://learn.microsoft.com/en-us/ef/core/saving/concurrency#optimistic-concurrency)
- [Handling Concurrency Tokens](https://learn.microsoft.com/en-us/ef/core/modeling/concurrency)
- [ETags in REST APIs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) (for future API)

### External Resources

- [ContosoUniversity Tutorial - Concurrency](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/concurrency)
- [Timestamp Attribute](https://learn.microsoft.com/en-us/dotnet/api/system.componentmodel.dataannotations.timestampattribute)
