# Student Module Migration - Kickoff

**Module**: Student  
**Version**: 1.0  
**Date**: December 31, 2025  
**Status**: Documentation Phase

---

## Executive Summary

This document defines the scope, dependencies, and acceptance criteria for migrating the Student module from ASP.NET Core Razor Pages to the React + Node.js/TypeScript stack. This module is selected as **Slice-1** (first migration iteration) due to its representative complexity—it includes pagination, search, sorting, and all CRUD operations—without the advanced concurrency handling found in Departments or the complex many-to-many relationships in Instructors.

**Priority**: High (First module to migrate)  
**Complexity**: Medium (Representative CRUD with pagination/search)  
**Estimated Effort**: 41 hours (per [Overview.md](../../Overview.md))

---

## Scope Statement

### In-Scope (Strict Parity)

Based on [Phases.md](../../Phases.md) Phase 1 Task 1.1 and [Overview.md](../../Overview.md) Section A:

#### Backend API (contoso-api)

- ✅ **GET /api/students** - Paginated list with search and sort

  - Query parameters: `page`, `pageSize`, `searchString`, `sortOrder`
  - Response: `{ data: Student[], total: number, page: number, pageSize: number }`
  - Search fields: LastName, FirstMidName (contains, case-insensitive)
  - Sort options: LastName (asc/desc), EnrollmentDate (asc/desc)
  - Default page size: 10 (configurable)

- ✅ **GET /api/students/:id** - Single student with enrollments

  - Response includes: Student entity + related Enrollments + Course details via Enrollment
  - Status codes: 200 (OK), 404 (Not Found)

- ✅ **POST /api/students** - Create new student

  - Request body: `{ FirstMidName: string, LastName: string, EnrollmentDate: Date }`
  - Validation: Required fields, data types
  - Response: 201 (Created) + created Student entity
  - Overposting protection: Only accept specified fields (Zod schema)

- ✅ **PUT /api/students/:id** - Update existing student

  - Request body: `{ FirstMidName: string, LastName: string, EnrollmentDate: Date }`
  - Response: 200 (OK) + updated Student entity, 404 (Not Found)
  - Overposting protection: Only accept specified fields

- ✅ **DELETE /api/students/:id** - Delete student
  - Response: 204 (No Content), 404 (Not Found)
  - Error handling: 409 (Conflict) if foreign key violations (student has enrollments)

#### Data Layer (Drizzle ORM)

- ✅ Student table defined in Drizzle schema (TypeScript)
- ✅ Relationships: One-to-many with Enrollment (FKs + joins)
- ✅ No computed properties in database (FullName computed client-side)

#### Frontend (React)

- ✅ **Student List Page** (`/students`)

  - Pagination component (page size: 10, configurable)
  - Search bar (LastName, FirstMidName)
  - Sort dropdown (LastName asc/desc, EnrollmentDate asc/desc)
  - Student table with columns: Last Name, First Name, Enrollment Date, Actions
  - Actions: View, Edit, Delete buttons
  - Bootstrap styling (table, form-control, btn classes)

- ✅ **Student Details Page** (`/students/:id`)

  - Display: Last Name, First Name, Enrollment Date
  - Display related enrollments with course titles and grades
  - Back to List button

- ✅ **Student Create Page** (`/students/create`)

  - Form fields: First Name (text), Last Name (text), Enrollment Date (date picker)
  - Validation: Client-side (Yup) matching server-side (Zod)
  - Submit → POST /api/students → Navigate to /students on success
  - Cancel button → Navigate back to /students

- ✅ **Student Edit Page** (`/students/:id/edit`)

  - Pre-populated form with current student data
  - Form fields: First Name, Last Name, Enrollment Date
  - Validation: Client-side (Yup) + server-side (Zod)
  - Submit → PUT /api/students/:id → Navigate to /students on success
  - Cancel button → Navigate back to /students

- ✅ **Student Delete Confirmation** (modal or page at `/students/:id/delete`)
  - Display student name and warning message
  - Confirm button → DELETE /api/students/:id → Navigate to /students on success
  - Error handling: Show error if foreign key violation (student has enrollments)
  - Cancel button → Navigate back to /students

#### Redux Toolkit State Management

- ✅ **studentsSlice** with state:

  - `students: Student[]` - current page of students
  - `currentStudent: Student | null` - selected student for details/edit
  - `loading: boolean` - API request in progress
  - `error: string | null` - error message
  - `pagination: { total: number, page: number, pageSize: number }`
  - `searchString: string` - current search term
  - `sortOrder: string` - current sort order

- ✅ **Async Thunks** (createAsyncThunk):
  - `fetchStudents(query)` - GET /api/students
  - `fetchStudentById(id)` - GET /api/students/:id
  - `createStudent(data)` - POST /api/students
  - `updateStudent({ id, data })` - PUT /api/students/:id
  - `deleteStudent(id)` - DELETE /api/students/:id

#### Testing

- ✅ **Backend Tests** (Mocha + Chai):

  - Unit tests: StudentService methods (mocked database client)
  - Integration tests: All 5 endpoints with real SQLite in-memory database
  - Validation tests: Zod schemas
  - Error handling tests: 404, 400, 409 scenarios
  - Pagination tests: Verify skip/take logic
  - Search tests: Verify LIKE queries (case-insensitive)
  - Sort tests: Verify ORDER BY logic

- ✅ **Frontend Tests** (Jest + React Testing Library):
  - Component tests: StudentListPage, StudentDetailsPage, StudentCreatePage, StudentEditPage
  - Redux slice tests: Reducers, thunks
  - Form validation tests: Yup schemas
  - Integration tests: User flows (create → view → edit → delete) with MSW

### Out-of-Scope (Deferred or N/A)

- ❌ Authentication/Authorization (no auth in legacy Student module per [Overview.md](../../Overview.md) Section A.3)
- ❌ Concurrency control (not applicable to Student entity per [Overview.md](../../Overview.md))
- ❌ Many-to-many relationships (Student has one-to-many with Enrollment only)
- ❌ File uploads/downloads
- ❌ Real-time updates (WebSockets)
- ❌ Soft deletes (hard delete only, matching legacy)
- ❌ Audit logging (not in legacy)
- ❌ Custom validation beyond Data Annotations (only standard Required, StringLength, DataType)

---

## Dependencies

### From Planning Documentation

**Source**: [Phases.md](../../Phases.md) Phase 1, Task 1.1 and Task 1.5

1. **Phase 0 Completion** (Prerequisites):

   - ✅ ADRs approved ([ADRs/ADR-0001.md](../../ADRs/ADR-0001.md))
   - ✅ Coding standards documented
   - ✅ PR templates created
   - ✅ Linting configured (ESLint + Prettier)
   - ✅ Risk register initialized ([Risks.md](../../Risks.md))

2. **Phase 1 Completion** (Discovery):

   - ✅ Endpoint inventory complete ([Overview.md](../../Overview.md) Section C.1)

- ✅ EF → Drizzle ORM mapping documented ([Phases.md](../../Phases.md) Task 1.2)
- ✅ Validation rules extracted ([Phases.md](../../Phases.md) Task 1.3)
- ✅ UI flow diagrams created ([Phases.md](../../Phases.md) Task 1.4)
- ✅ Business logic inventory complete ([Phases.md](../../Phases.md) Task 1.5)

3. **Phase 2 Completion** (Backend Planning):

   - ⏳ Express route structure designed (partially complete in contoso-api, needs student routes)
   - ⏳ DTOs and Zod schemas defined (to be created for Student)
   - ⏳ Middleware pipeline documented ([Overview.md](../../Overview.md) Section B.1)
   - ⏳ Error handling strategy ([Architecture.md](../../Architecture.md) Section 8)

4. **Phase 3 Completion** (Data Layer):

- ✅ Drizzle schema validated (Student table exists in schema definitions)
- ⏳ Seed script updated with Student data (from `ContosoUniversity/Data/DbInitializer.cs`)
- ⏳ Data access service layer designed (StudentService pattern)

### Technical Dependencies

**Backend (contoso-api)**:

- `express` - Web framework
- `drizzle-orm` - Database ORM
- `drizzle-kit` - Migrations tooling
- `zod` - Validation schemas
- `typescript` - Type safety
- `pino` - Logging (future)
- `mocha`, `chai`, `supertest` - Testing

**Frontend (to be created)**:

- `react` - UI library
- `react-router-dom` - Routing
- `@reduxjs/toolkit` - State management
- `axios` - HTTP client
- `yup` - Form validation
- `bootstrap` - UI styling
- `react-bootstrap` - Bootstrap components
- `jest`, `@testing-library/react` - Testing

### Data Dependencies

**Source**: ContosoUniversity EF Core entities

1. **Student Entity** (from `ContosoUniversity/Models/Student.cs`):

   ```csharp
   public class Student
   {
       public int ID { get; set; }
       [Required]
       [StringLength(50)]
       [Display(Name = "Last Name")]
       public string LastName { get; set; }

       [Required]
       [StringLength(50, MinimumLength = 1)]
       [Display(Name = "First Name")]
       public string FirstMidName { get; set; }

       [DataType(DataType.Date)]
       [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
       [Display(Name = "Enrollment Date")]
       public DateTime EnrollmentDate { get; set; }

       [Display(Name = "Full Name")]
       public string FullName => LastName + ", " + FirstMidName;

       public ICollection<Enrollment> Enrollments { get; set; }
   }
   ```

2. **Enrollment Relationship**:

   - Student has many Enrollments (one-to-many)
   - Enrollment links Student to Course
   - Cascade behavior: Restrict (cannot delete student with enrollments)

3. **Seed Data** (from `ContosoUniversity/Data/DbInitializer.cs`):
   - 8 students: Alexander, Alonso, Anand, Barzdukas, Li, Justice, Norman, Olivetto
   - Enrollment dates ranging from 2019 to 2021

### External Service Dependencies

- ❌ **None** (Student module has no external service calls per legacy implementation)

---

## Legacy Behavior Reference

### From ContosoUniversity/Pages/Students/

**Source**: [Overview.md](../../Overview.md) Section A "Key Endpoints/Features"

#### Student List (Index.cshtml.cs)

```csharp
// Pagination logic
var pageSize = Configuration.GetValue("PageSize", 3);
Students = await PaginatedList<Student>.CreateAsync(
    students.AsNoTracking(), pageIndex ?? 1, pageSize);

// Search logic
if (!String.IsNullOrEmpty(searchString))
{
    students = students.Where(s => s.LastName.Contains(searchString)
                           || s.FirstMidName.Contains(searchString));
}

// Sort logic
switch (sortOrder)
{
    case "name_desc":
        students = students.OrderByDescending(s => s.LastName);
        break;
    case "Date":
        students = students.OrderBy(s => s.EnrollmentDate);
        break;
    case "date_desc":
        students = students.OrderByDescending(s => s.EnrollmentDate);
        break;
    default:
        students = students.OrderBy(s => s.LastName);
        break;
}

// Query string preservation
CurrentFilter = searchString;
```

**Key Behaviors**:

- Default page size: 3 (from `appsettings.json`, will be 10 in React app)
- Search is case-insensitive (SQL Server default, must use LOWER() in SQLite)
- Default sort: LastName ascending
- Query strings preserved across navigation (searchString, sortOrder, pageIndex)

#### Student Details (Details.cshtml.cs)

```csharp
Student = await _context.Students
    .Include(s => s.Enrollments)
        .ThenInclude(e => e.Course)
    .AsNoTracking()
    .FirstOrDefaultAsync(m => m.ID == id);
```

**Key Behaviors**:

- Eager loading: Enrollments + nested Course
- Returns 404 if student not found
- Read-only (AsNoTracking)

#### Student Create (Create.cshtml.cs)

```csharp
[BindProperty]
public Student Student { get; set; }

public async Task<IActionResult> OnPostAsync()
{
    if (!ModelState.IsValid)
    {
        return Page();
    }

    var emptyStudent = new Student();

    if (await TryUpdateModelAsync<Student>(
        emptyStudent,
        "student",   // Prefix for properties to bind
        s => s.FirstMidName, s => s.LastName, s => s.EnrollmentDate))
    {
        _context.Students.Add(emptyStudent);
        await _context.SaveChangesAsync();
        return RedirectToPage("./Index");
    }

    return Page();
}
```

**Key Behaviors**:

- **Overposting protection**: TryUpdateModelAsync with explicit property list
- Validation: ModelState.IsValid (Data Annotations)
- Redirect to Index on success
- Return to form with errors on failure

#### Student Edit (Edit.cshtml.cs)

```csharp
public async Task<IActionResult> OnPostAsync(int id)
{
    var studentToUpdate = await _context.Students.FindAsync(id);

    if (studentToUpdate == null)
    {
        return NotFound();
    }

    if (await TryUpdateModelAsync<Student>(
        studentToUpdate,
        "student",
        s => s.FirstMidName, s => s.LastName, s => s.EnrollmentDate))
    {
        await _context.SaveChangesAsync();
        return RedirectToPage("./Index");
    }

    return Page();
}
```

**Key Behaviors**:

- **Overposting protection**: TryUpdateModelAsync with explicit property list
- 404 if student not found
- SaveChanges throws DbUpdateConcurrencyException (not applicable to Student, no concurrency token)
- Redirect to Index on success

#### Student Delete (Delete.cshtml.cs)

```csharp
public async Task<IActionResult> OnPostAsync(int id)
{
    var student = await _context.Students.FindAsync(id);

    if (student == null)
    {
        return NotFound();
    }

    try
    {
        _context.Students.Remove(student);
        await _context.SaveChangesAsync();
        return RedirectToPage("./Index");
    }
    catch (DbUpdateException /* ex */)
    {
        return RedirectToAction("./Delete", new { id = id, saveChangesError = true });
    }
}
```

**Key Behaviors**:

- **Foreign key violation handling**: Catch DbUpdateException
- Show error message if student has enrollments (cannot delete)
- Redirect to Index on success
- Redirect to Delete page with error flag on failure

---

## Acceptance Criteria

**Source**: [Phases.md](../../Phases.md) Phase 5 Task 5.4 (Student module)

### Backend API (contoso-api)

- [ ] **Endpoint Parity**:

  - [ ] All 5 endpoints return correct status codes (200, 201, 204, 404, 400, 409)
  - [ ] Response JSON structure matches documented DTOs
  - [ ] Query parameter handling matches legacy (page, pageSize, searchString, sortOrder)
  - [ ] Pagination math correct (skip, take, total)
  - [ ] Search is case-insensitive (use LOWER() in SQLite WHERE clause)
  - [ ] Sort order matches legacy (LastName asc default, 4 sort options)

- [ ] **Data Access Parity**:

  - [ ] Drizzle queries use explicit joins for eager loading (Student + Enrollments + Course)
  - [ ] Drizzle queries use `limit` and `offset` for pagination
  - [ ] Drizzle queries use `orderBy` for sorting
  - [ ] Drizzle queries use `LIKE` + `COLLATE NOCASE` or `lower()` for search (case-insensitive)

- [ ] **Validation Parity**:

  - [ ] Zod schemas enforce Required, StringLength, DataType from Data Annotations
  - [ ] Validation error messages match .NET ModelState errors (field names, messages)
  - [ ] Overposting protection: Zod schemas only accept FirstMidName, LastName, EnrollmentDate

- [ ] **Error Handling Parity**:

  - [ ] 404 returned for non-existent student ID
  - [ ] 400 returned for validation errors with field-level messages
  - [ ] 409 returned for foreign key violations (delete student with enrollments)
  - [ ] Error JSON structure: `{ error: string, details?: object }`

- [ ] **Testing Coverage**:
  - [ ] Unit tests: StudentService methods (>80% coverage)
  - [ ] Integration tests: All 5 endpoints with assertions on status codes, response bodies
  - [ ] Validation tests: All Zod schema rules
  - [ ] Error tests: 404, 400, 409 scenarios
  - [ ] Pagination tests: Edge cases (page 0, page > total, pageSize limits)
  - [ ] Search tests: Empty string, partial match, no results
  - [ ] Sort tests: All 4 sort options

### Frontend (React)

- [ ] **Page Parity**:

  - [ ] All 5 pages render with Bootstrap styling matching legacy
  - [ ] Navigation matches legacy (breadcrumbs, back buttons, redirects)
  - [ ] Forms render with same field labels and placeholders
  - [ ] Error messages display in same locations (validation summary, field-level)
  - [ ] Loading states display during API calls

- [ ] **Functionality Parity**:

  - [ ] Pagination: Previous/Next buttons, page numbers, page size selector
  - [ ] Search: Input field, search on keystroke or button click, clear button
  - [ ] Sort: Dropdown with 4 options (LastName asc/desc, EnrollmentDate asc/desc)
  - [ ] CRUD operations: Create, edit, delete work identically to legacy
  - [ ] Validation: Client-side (Yup) errors match server-side (Zod) errors

- [ ] **Redux State Parity**:

  - [ ] Redux state structure mirrors legacy ViewModels
  - [ ] Async thunks handle loading/error states
  - [ ] State updates trigger re-renders
  - [ ] Navigation preserves query parameters (page, search, sort)

- [ ] **Testing Coverage**:
  - [ ] Component tests: All 5 pages render correctly
  - [ ] Redux slice tests: All reducers and thunks
  - [ ] Form validation tests: All Yup schema rules
  - [ ] Integration tests: Create → view → edit → delete user flow
  - [ ] Coverage: >75% for components and Redux slices

### Data Layer (Drizzle ORM)

- [ ] **Schema Parity**:

  - [ ] Student model matches EF Core entity (fields, types, relationships)
  - [ ] Relationships: One-to-many with Enrollment (correct)
  - [ ] No computed properties in schema (FullName computed in frontend)

- [ ] **Migration Parity**:

  - [ ] Drizzle migration creates Student table with correct columns
  - [ ] Foreign keys enforced (Enrollment.StudentID → Student.ID)
  - [ ] Indexes created for frequently queried columns (LastName for search/sort)

- [ ] **Seed Data Parity**:
  - [ ] 8 students seeded with same data as legacy DbInitializer
  - [ ] Enrollment dates match legacy
  - [ ] Related enrollments seeded correctly

### Non-Functional Requirements

- [ ] **Performance**:

  - [ ] Student list page loads in <500ms (with 1000 students, page size 10)
  - [ ] Search response time <300ms
  - [ ] Sort response time <300ms
  - [ ] Individual student details load in <200ms

- [ ] **Security**:

  - [ ] No authentication required (matches legacy public access)
  - [ ] SQL injection prevented (Drizzle parameterized queries)
  - [ ] XSS prevented (React escapes by default)
  - [ ] Overposting prevented (Zod schemas)

- [ ] **Accessibility**:
  - [ ] Forms have proper labels and ARIA attributes
  - [ ] Keyboard navigation works
  - [ ] Screen reader compatible
  - [ ] Bootstrap accessibility features preserved

---

## Rollback Plan

**Source**: [Phases.md](../../Phases.md) Phase 8 Task 8.6

### Rollback Triggers (Any of):

- ❌ Critical bug affecting all users (unable to list, create, view, edit, or delete students)
- ❌ Data integrity issue (students not saved correctly, enrollments lost)
- ❌ Performance degradation >50% compared to legacy (page load >1 second)
- ❌ Validation failure (incorrect error messages, missing validation)
- ❌ Foreign key violation not handled (app crashes on delete)

### Rollback Steps:

1. **Immediate Actions** (within 15 minutes):

   - Switch DNS/routing back to legacy ContosoUniversity app
   - Disable new Student API endpoints in contoso-api (if deployed)
   - Notify stakeholders of rollback

2. **Data Validation** (within 30 minutes):

   - Compare SQLite Student table with SQL Server Student table (row counts, data integrity)
   - If data corruption detected: Restore SQLite from backup
   - If data out of sync: Re-run data migration from SQL Server backup

3. **Root Cause Analysis** (within 2 hours):

   - Review logs (Pino backend logs, browser console logs)
   - Identify failing test cases (if any were missed)
   - Document bug details (steps to reproduce, expected vs. actual behavior)

4. **Remediation Plan** (within 24 hours):
   - Fix identified bugs in staging environment
   - Add regression tests to prevent recurrence
   - Re-test in staging with production-like data
   - Schedule re-deployment after fixes validated

### Rollback Prevention:

- ✅ **Staging Validation**: Deploy to staging first, test all scenarios
- ✅ **Smoke Tests**: Run automated smoke tests post-deployment
- ✅ **Canary Deployment**: Deploy to 10% of users first, monitor for 24 hours
- ✅ **Feature Flags**: Use feature flags to toggle new Student module on/off
- ✅ **Monitoring**: Set up alerts for error rate, response time, 404 rate

### Evidence of Readiness (Before Deployment):

- [ ] All acceptance criteria met (100%)
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code reviewed and approved (2 reviewers)
- [ ] Performance benchmarks met (page load <500ms)
- [ ] Staging validation passed (all user flows tested)
- [ ] Rollback procedure tested in staging

---

## Success Metrics

**Source**: [Overview.md](../../Overview.md) Section H "Success Criteria"

### Technical Metrics:

- ✅ All 5 endpoints functional (100% parity)
- ✅ Test coverage: >80% backend, >75% frontend
- ✅ Performance within 20% of legacy baseline
- ✅ Zero data loss during migration
- ✅ All validation rules enforced

### Business Metrics:

- ✅ User workflows unchanged (create → view → edit → delete)
- ✅ UI/UX unchanged (Bootstrap styling preserved)
- ✅ Error messages identical to legacy
- ✅ No new bugs introduced
- ✅ Stakeholder approval (UAT passed)

### Process Metrics:

- ✅ Documentation complete and reviewed
- ✅ Code reviews completed within 24 hours
- ✅ PRs merged within 48 hours of approval
- ✅ Zero rollbacks required
- ✅ Team velocity on track (41 hours estimate)

---

## Next Steps

1. **Proceed to Slice Planning**: Create detailed technical plan in [Slice-Plan.md](Slice-Plan.md)
2. **Validate Readiness**: Complete checklist in [Readiness-Checklist.md](Readiness-Checklist.md)
3. **Update Backlog**: Add Student tasks to [Backlog.md](../../Backlog.md)
4. **Begin Implementation**: Start with backend API (Phase 2 tasks)

---

**Document Status**: Draft - Ready for Review  
**Review Required By**: Tech Lead, Backend Developer, Frontend Developer, QA Lead  
**Target Approval Date**: January 2, 2026  
**Target Implementation Start**: January 6, 2026

**Related Documents**:

- [Slice-Plan.md](Slice-Plan.md) - Detailed technical plan
- [Readiness-Checklist.md](Readiness-Checklist.md) - Pre-implementation validation
- [../../Backlog.md](../../Backlog.md) - Task backlog
- [../../Phases.md](../../Phases.md) - Overall migration phases
- [../../Overview.md](../../Overview.md) - Migration overview
- [../../Architecture.md](../../Architecture.md) - Architecture diagrams
- [../../Risks.md](../../Risks.md) - Risk register
