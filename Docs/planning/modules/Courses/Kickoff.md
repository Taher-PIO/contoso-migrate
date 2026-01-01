# Courses Module - Migration Kickoff

**Module**: Courses  
**Priority**: High  
**Complexity**: Medium  
**Estimated Effort**: 12 hours (Frontend implementation)  
**Status**: Documentation Complete, Implementation Pending  
**Date**: January 1, 2026

---

## Executive Summary

The Courses module manages the core academic offering entity in Contoso University. This migration establishes strict functional parity with the legacy ASP.NET Core Razor Pages implementation, preserving the **manual CourseID entry pattern** (no auto-increment), department associations via dropdown, and cascade delete behavior to enrollments.

**Backend Status**: ✅ Complete - All CRUD endpoints, validation, and service layer implemented  
**Frontend Status**: ❌ Not Started - React pages, Redux state, and Bootstrap UI required  
**Critical Requirement**: Manual CourseID assignment must be preserved (no auto-increment)  
**Validation Fix Required**: Title validation must match legacy (3-50 chars, not 1-100)

---

## Scope Statement

### In-Scope (Strict Parity Only)

#### Backend API (✅ Implemented)

- ✅ **GET /api/courses** - List all courses with department names (no pagination)
- ✅ **GET /api/courses/:id** - Retrieve single course details with relationships
- ✅ **POST /api/courses** - Create course with manual CourseID entry
- ✅ **PUT /api/courses/:id** - Update course (CourseID immutable)
- ✅ **DELETE /api/courses/:id** - Delete course with cascade to enrollments
- ✅ Manual CourseID uniqueness validation (improvement over legacy)
- ✅ Credits range validation (0-5)
- ⚠️ **Title validation fix required**: Change from (1-100 chars) to (3-50 chars)

#### Database Schema (✅ Implemented)

- ✅ Drizzle ORM schema: `courses` table with manual CourseID (no autoincrement)
- ✅ Foreign key: DepartmentID → departments.DepartmentID (cascade delete)
- ✅ Relationships: Department (many-to-one), Enrollments (one-to-many), Instructors (many-to-many)
- ✅ Join table: `CourseInstructor` for course-instructor assignments
- ⚠️ **Schema fix recommended**: Set Title as NOT NULL to match legacy intent

#### Frontend React Pages (❌ Not Started)

- ❌ **Course Index** - List all courses with department names, Edit/Details/Delete actions
- ❌ **Course Details** - Display course information with department name
- ❌ **Course Create** - Form with manual CourseID input + department dropdown (ordered by Name)
- ❌ **Course Edit** - Form with immutable CourseID display + editable Title/Credits/DepartmentID
- ❌ **Course Delete** - Confirmation dialog with course details
- ❌ Bootstrap styling matching legacy layout
- ❌ Redux Toolkit state management (courses slice, thunks, selectors)

#### Testing Coverage (⚠️ Partial)

- ✅ Backend service tests (create, findById, update, delete)
- ❌ Backend instructor assignment tests (assignInstructor, removeInstructor)
- ❌ Backend controller integration tests (supertest)
- ❌ Frontend component tests (all 5 pages)
- ❌ Frontend Redux slice tests
- ❌ E2E user flow tests (create → view → edit → delete)

### Out-of-Scope (No Feature Changes)

❌ Pagination on course list (legacy displays all courses)  
❌ Search/filter functionality (not in legacy)  
❌ Sorting options (not in legacy)  
❌ Bulk operations (not in legacy)  
❌ Course instructor assignment UI in Courses pages (managed in Instructors module per legacy)  
❌ Enrollment display on Course Details page (not shown in legacy)  
❌ Optimistic concurrency control (legacy has none for Course entity)  
❌ Soft delete or archive functionality (not in legacy)  
❌ Authentication/authorization (deferred to Phase 4 per planning docs)

---

## Dependencies

### From Planning Documentation

**Referenced Documents**:

- [Overview.md](../../Overview.md) - Section A: Course entity structure, manual CourseID entry
- [Phases.md](../../Phases.md) - Phase 5.2: Courses frontend (12 hours), Phase 6: Testing coverage
- [Architecture.md](../../Architecture.md) - Technology stack, validation patterns
- [Risks.md](../../Risks.md) - R-005 (Functional Parity), R-001 (Data Integrity), R-003 (Performance)
- [Backlog.md](../../Backlog.md) - Task structure and acceptance criteria format

### Technical Dependencies

**Backend Prerequisites**:

- ✅ Express.js server configured at `contoso/src/index.ts`
- ✅ Drizzle ORM schema at `contoso/src/db/schema.ts`
- ✅ SQLite database with WAL mode at `contoso/data/contoso-university.sqlite`
- ✅ Validation middleware at `contoso/src/middleware/validation.ts`
- ✅ Error handling middleware at `contoso/src/middleware/errorHandler.ts`
- ✅ Custom error classes at `contoso/src/utils/errors.ts`

**Frontend Prerequisites**:

- ✅ React + TypeScript + Vite setup at `contoso/client/`
- ✅ Redux Toolkit store configured at `contoso/client/src/store/index.ts`
- ✅ Bootstrap CSS imported at `contoso/client/src/styles/main.css`
- ✅ Axios client configured in service layer pattern (see `studentService.ts`)
- ✅ Layout component at `contoso/client/src/components/Layout.tsx`
- ✅ Pagination component at `contoso/client/src/components/Pagination.tsx` (not used for Courses)
- ❌ Courses service file needs creation at `contoso/client/src/services/courseService.ts`
- ❌ Courses Redux slice needs creation at `contoso/client/src/store/slices/coursesSlice.ts`

### Data Dependencies

**Entity Relationships**:

1. **Course → Department** (Many-to-One, Required)

   - Foreign Key: `Course.DepartmentID → Department.DepartmentID`
   - Cascade: Deleting Department cascades to Courses
   - UI Requirement: Department dropdown on Create/Edit forms ordered by Name
   - API Dependency: `GET /api/departments` for dropdown population (✅ exists)

2. **Course → Enrollments** (One-to-Many)

   - Foreign Key: `Enrollment.CourseID → Course.CourseID`
   - Cascade: Deleting Course cascades to Enrollments
   - No UI display required (legacy does not show enrollments on Course Details)

3. **Course ↔ Instructor** (Many-to-Many via CourseInstructor)
   - Join Table: `CourseInstructor` with CourseID + InstructorID
   - Backend endpoints exist: POST/DELETE `/api/courses/:id/instructors`
   - UI managed in Instructors module (not in Courses pages per legacy)

**Migration Order**:

- ✅ Departments must be migrated first (FK dependency)
- ⏳ Courses migration (this module)
- ⏳ Enrollments can migrate after Courses
- ⏳ Instructors can migrate in parallel (join table only)

### External Services

**None** - Courses module operates entirely within the local application boundary. No external APIs, third-party services, or cloud dependencies.

---

## Legacy Behavior Reference

### Key Legacy Patterns

#### 1. Manual CourseID Entry (No Auto-Increment)

**Source**: `ContosoUniversity/ContosoUniversity/Models/Course.cs`

```csharp
[DatabaseGenerated(DatabaseGeneratedOption.None)]
[Display(Name = "Number")]
public int CourseID { get; set; }
```

**Behavior**:

- User **must manually enter** CourseID when creating a course
- CourseID is displayed as "Number" in UI
- No auto-increment or sequence generation
- Database enforces PRIMARY KEY uniqueness constraint
- Legacy has **no application-level duplicate check** (relies on DB error)

**Target Implementation**:

- ✅ Drizzle schema: `CourseID: integer('CourseID').primaryKey()` (no autoincrement)
- ✅ Service validation: Checks for existing CourseID before insert (improvement)
- ❌ Frontend: Manual input field required on Create form

---

#### 2. CourseID Immutable on Edit

**Source**: `ContosoUniversity/ContosoUniversity/Pages/Courses/Edit.cshtml.cs`

```csharp
if (await TryUpdateModelAsync<Course>(
     courseToUpdate,
     "course",
     c => c.Credits, c => c.DepartmentID, c => c.Title))  // CourseID excluded
{
    await _context.SaveChangesAsync();
    return RedirectToPage("./Index");
}
```

**Behavior**:

- CourseID **not included** in TryUpdateModelAsync property list
- CourseID displayed as read-only field in Edit form
- Only Title, Credits, DepartmentID can be updated

**Target Implementation**:

- ✅ Backend: PUT `/api/courses/:id` uses route param for ID, excludes CourseID from body
- ❌ Frontend: Edit form must display CourseID as read-only (not editable)

---

#### 3. Department Dropdown (Ordered by Name)

**Source**: `ContosoUniversity/ContosoUniversity/Pages/Courses/DepartmentNamePageModel.cs`

```csharp
public void PopulateDepartmentsDropDownList(SchoolContext _context,
    object selectedDepartment = null)
{
    var departmentsQuery = from d in _context.Departments
                           orderby d.Name  // Sort by name
                           select d;

    DepartmentNameSL = new SelectList(departmentsQuery.AsNoTracking(),
                "DepartmentID", "Name", selectedDepartment);
}
```

**Behavior**:

- Shared base class `DepartmentNamePageModel` used by Create and Edit pages
- Dropdown populated from all departments **ordered by Name**
- Displays department Name, submits DepartmentID value
- Pre-selects current department on Edit form

**Target Implementation**:

- ✅ Backend: `GET /api/departments` returns all departments (verify ordering)
- ❌ Frontend: Department dropdown component with client-side sort by Name if needed
- ❌ Frontend: Pre-select current department on Edit form

---

#### 4. No Pagination (Display All Courses)

**Source**: `ContosoUniversity/ContosoUniversity/Pages/Courses/Index.cshtml.cs`

```csharp
public async Task OnGetAsync()
{
    Courses = await _context.Courses
        .Include(c => c.Department)
        .AsNoTracking()
        .ToListAsync();
}
```

**Behavior**:

- Loads **all courses** in a single query
- No pagination, no search, no filtering
- Includes Department for display (Department.Name shown in table)

**Target Implementation**:

- ✅ Backend: `GET /api/courses` returns all courses with department
- ❌ Frontend: Simple table display (no pagination component)

---

#### 5. Title Validation (3-50 Characters)

**Source**: `ContosoUniversity/ContosoUniversity/Models/Course.cs`

```csharp
[StringLength(50, MinimumLength = 3)]
public string Title { get; set; }
```

**Behavior**:

- Title **required** (not nullable)
- Minimum length: **3 characters**
- Maximum length: **50 characters**

**Target Implementation**:

- ⚠️ **Current validation is WRONG**: `.isLength({ min: 1, max: 100 })` in `validation.ts`
- 🔧 **Fix Required**: Change to `.isLength({ min: 3, max: 50 })` for strict parity

---

#### 6. Credits Range (0-5)

**Source**: `ContosoUniversity/ContosoUniversity/Models/Course.cs`

```csharp
[Range(0, 5)]
public int Credits { get; set; }
```

**Behavior**:

- Credits must be between 0 and 5 (inclusive)

**Target Implementation**:

- ✅ Backend validation: `.isInt({ min: 0, max: 5 })` in `validation.ts`
- ✅ Service validation: Checks range in create/update methods

---

#### 7. Cascade Delete to Enrollments

**Source**: Entity Framework configuration (implicit)

**Behavior**:

- Deleting a Course **cascades to Enrollments** (enrollment records deleted)
- No warning shown to user (unlike Student delete)
- No FK violation handling in Delete page code

**Target Implementation**:

- ✅ Drizzle schema: `references(() => courses.CourseID, { onDelete: 'cascade' })` on Enrollment
- ✅ Service: No explicit FK handling (matches legacy - relies on DB cascade)
- ❌ Frontend: Consider adding cascade warning in Delete confirmation dialog

---

## Acceptance Criteria

### Backend API (✅ Mostly Complete)

**Endpoints & Validation**:

- ✅ GET /api/courses returns all courses with department relationships
- ✅ GET /api/courses/:id returns single course with department, instructors, enrollments
- ✅ POST /api/courses validates manual CourseID, checks uniqueness, validates Credits (0-5)
- ⚠️ POST /api/courses validates Title (MUST FIX: change to min 3, max 50)
- ✅ PUT /api/courses/:id updates Title/Credits/DepartmentID only (CourseID immutable)
- ⚠️ PUT /api/courses/:id validates Title (MUST FIX: change to min 3, max 50)
- ✅ DELETE /api/courses/:id deletes course with cascade to enrollments
- ✅ All endpoints return proper status codes (200, 201, 400, 404)
- ✅ Validation errors return structured JSON with field-level messages

**Error Handling**:

- ✅ 404 NotFoundError when course ID doesn't exist
- ✅ 400 ValidationError for invalid CourseID, Title, Credits, DepartmentID
- ✅ 400 ValidationError for duplicate CourseID on create (improvement over legacy)

**Data Integrity**:

- ✅ Manual CourseID assignment preserved (no autoincrement in schema)
- ✅ Foreign key constraint to Department enforced
- ✅ Cascade delete from Department → Courses functional
- ✅ Cascade delete from Course → Enrollments functional

### Frontend React/Redux (❌ Not Started)

**Pages & Routing**:

- ❌ `/courses` route displays Course Index page (list all courses)
- ❌ `/courses/:id` route displays Course Details page
- ❌ `/courses/create` route displays Course Create form
- ❌ `/courses/:id/edit` route displays Course Edit form
- ❌ `/courses/:id/delete` route displays Course Delete confirmation

**Course Index Page**:

- ❌ Bootstrap table with columns: Number (CourseID), Title, Credits, Department
- ❌ Action buttons: Edit, Details, Delete for each row
- ❌ "Create New" button linking to create form
- ❌ No pagination controls (display all courses)
- ❌ Loading spinner while fetching data
- ❌ Error message display on API failure

**Course Create Page**:

- ❌ Form with 4 fields: Number (CourseID - manual entry), Title, Credits, DepartmentID dropdown
- ❌ CourseID input: Integer, required, unique (client-side validation)
- ❌ Title input: Text, required, 3-50 chars (client-side validation)
- ❌ Credits input: Integer, required, 0-5 range, dropdown or number input
- ❌ Department dropdown: Populated from GET /api/departments, ordered by Name, required
- ❌ "Create" button submits POST /api/courses
- ❌ "Back to List" button/link to Course Index
- ❌ Display validation errors from API response
- ❌ Redirect to Course Index on successful creation

**Course Edit Page**:

- ❌ Form pre-populated with current course data
- ❌ CourseID displayed as **read-only** (label or disabled input)
- ❌ Title, Credits, DepartmentID editable (same validation as Create)
- ❌ Department dropdown pre-selected to current department
- ❌ "Save" button submits PUT /api/courses/:id
- ❌ "Back to List" button/link to Course Index
- ❌ Display validation errors from API response
- ❌ Redirect to Course Index on successful update

**Course Details Page**:

- ❌ Display course information: Number, Title, Credits, Department Name
- ❌ "Edit" button/link to Edit page
- ❌ "Back to List" button/link to Course Index
- ❌ No enrollment or instructor display (not in legacy)

**Course Delete Page**:

- ❌ Display course information for confirmation
- ❌ Warning message: "Are you sure you want to delete this?"
- ❌ Optional: Warning about cascade delete to enrollments
- ❌ "Delete" button submits DELETE /api/courses/:id
- ❌ "Back to List" button/link to Course Index
- ❌ Redirect to Course Index on successful deletion

**Redux State Management**:

- ❌ Courses slice with state: `courses[]`, `currentCourse`, `loading`, `error`
- ❌ Thunks: `fetchCourses`, `fetchCourseById`, `createCourse`, `updateCourse`, `deleteCourse`
- ❌ Selectors: `selectAllCourses`, `selectCurrentCourse`, `selectCoursesLoading`, `selectCoursesError`
- ❌ State resets on navigation and after mutations

**Bootstrap Styling**:

- ❌ Match legacy layout: `.table`, `.table-striped`, `.table-hover` for index
- ❌ Form styling: `.form-group`, `.form-control`, `.form-label`
- ❌ Button classes: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`
- ❌ Consistent spacing and alignment with Student module pages

### Testing Coverage

**Backend Tests (⚠️ Partial - Mocha + Chai)**:

- ✅ CourseService.create() - validates manual CourseID, duplicate check, Credits range
- ✅ CourseService.findById() - returns course with relationships, throws NotFoundError
- ✅ CourseService.update() - updates Title/Credits/DepartmentID, validates range
- ✅ CourseService.delete() - deletes course successfully
- ❌ CourseService.assignInstructor() - assigns instructor to course
- ❌ CourseService.removeInstructor() - removes instructor assignment
- ❌ CourseController integration tests with supertest (all 5 endpoints)
- ❌ Validation middleware tests (Title 3-50 chars, Credits 0-5)
- ❌ Cascade delete tests (verify enrollments deleted when course deleted)
- ❌ FK violation tests (invalid DepartmentID returns 400 or DB error)

**Frontend Tests (❌ Not Started - Jest)**:

- ❌ Course Index page renders course list with department names
- ❌ Course Create form validates manual CourseID input
- ❌ Course Create form validates Title length (3-50 chars)
- ❌ Course Create form validates Credits range (0-5)
- ❌ Course Create form populates department dropdown (ordered by Name)
- ❌ Course Edit form displays CourseID as read-only
- ❌ Course Edit form pre-selects current department
- ❌ Course Delete page displays confirmation dialog
- ❌ Redux coursesSlice handles all action types correctly
- ❌ Redux thunks dispatch correct actions on success/failure
- ❌ User flow: Create course → View details → Edit → Delete (E2E)

**Coverage Goals**:

- Backend: >80% line coverage (currently ~60% for Course module)
- Frontend: >75% line coverage (0% - not started)

---

## Rollback Plan

**Reference**: [Phases.md](../../Phases.md) - Section: Rollback Strategy

### Pre-Implementation State

**Backend**:

- Courses API endpoints functional but validation discrepancy exists
- Database schema deployed with manual CourseID pattern
- No breaking changes to revert

**Frontend**:

- No Courses pages exist (clean state)
- No Redux courses slice (nothing to remove)

### Rollback Triggers

1. **Critical bug** in manual CourseID entry flow blocking course creation
2. **Data corruption** in CourseID uniqueness or FK relationships
3. **Performance degradation** loading all courses (>5 seconds)
4. **Validation parity breach** discovered post-deployment
5. **User acceptance failure** on manual CourseID UX

### Rollback Procedure

**If validation fix breaks existing data**:

1. Revert validation changes in `contoso/src/middleware/validation.ts`
2. Restart backend server: `npm.cmd run dev` in `contoso/` directory
3. Verify existing courses still accessible via GET /api/courses
4. Document discrepancy for future resolution

**If frontend deployment causes issues**:

1. Remove Courses routes from React Router configuration
2. Delete `contoso/client/src/pages/courses/` directory
3. Delete `contoso/client/src/store/slices/coursesSlice.ts`
4. Delete `contoso/client/src/services/courseService.ts`
5. Rebuild frontend: `npm.cmd run build` in `contoso/client/` directory
6. Backend API remains functional for future retry

**If database schema changes required**:

1. Revert Drizzle migration affecting Courses table
2. Run: `npm.cmd run db:push` to restore previous schema
3. Restore database backup from `contoso/data/` directory
4. Re-seed data if necessary: `npm.cmd run db:seed`

**Communication**:

- Notify team via Slack/email within 1 hour of rollback decision
- Document rollback reason in `Docs/planning/Risks.md` with timestamp
- Schedule retrospective within 24 hours to analyze root cause

### Post-Rollback Actions

1. Preserve rollback logs and error messages for analysis
2. Update Readiness Checklist with additional preconditions
3. Add regression tests for failure scenario
4. Re-plan implementation addressing root cause
5. Obtain sign-off before retry (see Readiness Checklist)

---

## Sign-Off

**Planning Documentation Complete**: January 1, 2026

| Role               | Name | Date | Status     |
| ------------------ | ---- | ---- | ---------- |
| **Backend Lead**   |      |      | ⏳ Pending |
| **Frontend Lead**  |      |      | ⏳ Pending |
| **Data Architect** |      |      | ⏳ Pending |
| **QA Lead**        |      |      | ⏳ Pending |
| **Product Owner**  |      |      | ⏳ Pending |

---

## Related Documentation

- [Courses Slice Plan](./Slice-Plan.md) - Detailed technical parity mappings
- [Courses Readiness Checklist](./Readiness-Checklist.md) - Pre-implementation validation
- [Overview.md](../../Overview.md) - System-wide migration context
- [Architecture.md](../../Architecture.md) - Technology stack details
- [Risks.md](../../Risks.md) - Risk register with mitigation strategies
- [Backlog.md](../../Backlog.md) - Courses task breakdown and acceptance criteria
