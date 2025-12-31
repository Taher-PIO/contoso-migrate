# Phase-by-Phase Migration Plan: .NET → React + Node/TypeScript

**Document Version**: 1.0  
**Date**: December 31, 2025  
**Status**: Active Planning

---

## Phase 0: Governance & Tooling

**Duration**: Week 1 (5 business days)  
**Goal**: Establish project standards, repository hygiene, and team processes before any migration work begins

### Objectives

1. Define architectural decision-making process
2. Establish code quality standards for TypeScript/React/Node ecosystem
3. Create PR templates and review guidelines
4. Document branching and commit strategies
5. Set up linting and formatting tools
6. Define team roles and responsibilities

### Tasks

#### Task 0.1: Create Architectural Decision Records (ADRs)

**Effort**: 8 hours  
**Owner**: Tech Lead

**Steps**:

1. Create `Docs/planning/ADRs/` directory structure
2. Create ADR template with sections: Context, Decision, Consequences, Alternatives Considered
3. Write ADR-0001: Technology Stack Selection (see [ADRs/ADR-0001.md](ADRs/ADR-0001.md))
   - Document why React/Node/TypeScript chosen
   - Document why Drizzle ORM over TypeORM
   - Document why SQLite over PostgreSQL/MySQL
   - Document why Redux Toolkit over Context API
4. Write ADR-0002: Authentication Strategy (JWT + httpOnly cookies)
5. Write ADR-0003: Testing Framework Selection (Jest/Mocha/Playwright)
6. Set up ADR review process (all ADRs require 2 approvals)

**Acceptance Criteria**:

- [ ] ADR template created and documented
- [ ] ADR-0001, ADR-0002, ADR-0003 written and approved
- [ ] Team understands when to create ADRs
- [ ] ADR directory linked from main README

#### Task 0.2: Create PR Templates

**Effort**: 4 hours  
**Owner**: Engineering Manager

**Steps**:

1. Create `.github/PULL_REQUEST_TEMPLATE.md`:

   ```markdown
   ## Description

   [Describe changes]

   ## Type of Change

   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Related Issues

   Closes #[issue number]

   ## Testing

   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing completed

   ## Checklist

   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings
   - [ ] Tests pass locally
   ```

2. Create `.github/ISSUE_TEMPLATE/` with bug report and feature request templates
3. Document PR review process (2 approvals required, 1 must be senior engineer)
4. Define review SLA (24-hour response time)

**Acceptance Criteria**:

- [ ] PR template enforced on all new PRs
- [ ] Issue templates created
- [ ] Review process documented in CONTRIBUTING.md
- [ ] Team trained on templates

#### Task 0.3: Set Up Linting and Formatting

**Effort**: 6 hours  
**Owner**: Senior Engineer

**Steps**:

1. Create root `.editorconfig`:

   ```ini
   root = true

   [*]
   charset = utf-8
   end_of_line = lf
   insert_final_newline = true
   trim_trailing_whitespace = true

   [*.{js,jsx,ts,tsx,json}]
   indent_style = space
   indent_size = 2
   ```

2. Create `contoso-api/.eslintrc.js`:

   ```js
   module.exports = {
     parser: '@typescript-eslint/parser',
     extends: [
       'eslint:recommended',
       'plugin:@typescript-eslint/recommended',
       'plugin:prettier/recommended',
     ],
     rules: {
       '@typescript-eslint/explicit-function-return-type': 'warn',
       '@typescript-eslint/no-explicit-any': 'error',
     },
   };
   ```

3. Create `.prettierrc`:

   ```json
   {
     "semi": true,
     "singleQuote": true,
     "tabWidth": 2,
     "trailingComma": "es5",
     "printWidth": 100
   }
   ```

4. Add npm scripts to package.json:

   ```json
   "scripts": {
     "lint": "eslint . --ext .ts,.tsx",
     "lint:fix": "eslint . --ext .ts,.tsx --fix",
     "format": "prettier --write \"src/**/*.{ts,tsx}\""
   }
   ```

5. Document linting rules in `Docs/planning/coding-standards.md`

**Acceptance Criteria**:

- [ ] ESLint configuration working (no errors on existing contoso-api code)
- [ ] Prettier formatting enforced
- [ ] Pre-commit hooks suggested (optional)
- [ ] CI pipeline includes lint check
- [ ] Team uses consistent editor settings

#### Task 0.4: Define Branching and Commit Strategy

**Effort**: 3 hours  
**Owner**: Tech Lead

**Steps**:

1. Document branching strategy in `CONTRIBUTING.md`:

   - `main` branch: Production-ready code
   - `develop` branch: Integration branch
   - Feature branches: `feature/TASK-123-description`
   - Bugfix branches: `bugfix/TASK-456-description`
   - Release branches: `release/v1.0.0`

2. Define commit message convention (Conventional Commits):

   ```
   type(scope): subject

   body

   footer
   ```

   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

   Examples:

   - `feat(students): add pagination to student list`
   - `fix(courses): resolve CourseID uniqueness validation`
   - `docs(readme): update setup instructions`

3. Document merge strategy:

   - Squash commits on PR merge to maintain clean history
   - Require linear history (rebase before merge)
   - Delete feature branches after merge

4. Set up branch protection rules (documentation):
   - Require PR reviews (2 approvals)
   - Require status checks to pass
   - Require branches to be up to date before merging
   - Restrict force pushes to `main` and `develop`

**Acceptance Criteria**:

- [ ] Branching strategy documented and approved
- [ ] Commit message examples provided
- [ ] Team trained on conventions
- [ ] First PRs follow conventions

#### Task 0.5: Document Coding Standards

**Effort**: 8 hours  
**Owner**: Senior Engineers (pair work)

**Steps**:

1. Create `Docs/planning/coding-standards.md` with sections:

   - **TypeScript Standards**:

     - Use strict mode (`strict: true` in tsconfig)
     - Avoid `any` type (use `unknown` when type is truly unknown)
     - Prefer interfaces over type aliases for objects
     - Use enums sparingly (prefer const objects or union types)

   - **React Standards**:

     - Use functional components (no class components)
     - Use hooks (useState, useEffect, custom hooks)
     - Prefer named exports over default exports
     - Keep components small (< 200 lines)
     - Extract logic to custom hooks
     - Use TypeScript prop interfaces

   - **Express/Node Standards**:

     - Use async/await (no callbacks)
     - Use Express Router for route organization
     - Separate concerns: routes → controllers → services → repositories
     - Use dependency injection where applicable
     - Always handle errors (try-catch in async handlers)

   - **Drizzle ORM Standards**:

     - Use transactions for multi-step operations
     - Avoid N+1 queries with explicit joins or composed queries
     - Select only required columns via `db.select({ ... })`
     - Leverage Drizzle's type safety; avoid raw SQL unless necessary

   - **Testing Standards**:

     - Test file naming: `*.test.ts` or `*.spec.ts`
     - Use AAA pattern (Arrange, Act, Assert)
     - Mock external dependencies
     - Aim for >80% coverage (backend), >75% (frontend)

   - **Naming Conventions**:
     - Files: kebab-case (`student-service.ts`)
     - Components: PascalCase (`StudentList.tsx`)
     - Variables/functions: camelCase (`getUserById`)
     - Constants: UPPER_SNAKE_CASE (`MAX_PAGE_SIZE`)
     - Interfaces: PascalCase with optional `I` prefix (`IStudentDTO` or `StudentDTO`)

2. Create code review checklist (embedded in PR template)
3. Document error handling patterns
4. Document logging patterns (Pino structured logging)

**Acceptance Criteria**:

- [ ] Coding standards document complete
- [ ] Team reviewed and approved standards
- [ ] Examples provided for each standard
- [ ] Standards referenced in onboarding docs

#### Task 0.6: Define Definition of Done

**Effort**: 2 hours  
**Owner**: Engineering Manager + Product Owner

**Steps**:

1. Create `Docs/planning/definition-of-done.md`:

   **For User Stories**:

   - [ ] Acceptance criteria met
   - [ ] Code reviewed and approved (2 reviewers)
   - [ ] Unit tests written (>80% coverage for new code)
   - [ ] Integration tests written (if applicable)
   - [ ] Manual testing completed
   - [ ] Documentation updated (README, API docs, comments)
   - [ ] No linting errors
   - [ ] No accessibility issues (WCAG AA for frontend)
   - [ ] Code merged to develop branch
   - [ ] Product owner approved

   **For Bugs**:

   - [ ] Root cause identified
   - [ ] Fix implemented and code reviewed
   - [ ] Regression test added
   - [ ] Manual testing completed
   - [ ] Related bugs checked (same root cause?)
   - [ ] Code merged to develop branch

   **For Documentation**:

   - [ ] Content reviewed for accuracy
   - [ ] Markdown formatted correctly
   - [ ] Links tested (no broken links)
   - [ ] Approved by tech lead
   - [ ] Merged to main branch

2. Review Definition of Done with team
3. Post Definition of Done in team workspace

**Acceptance Criteria**:

- [ ] Definition of Done documented
- [ ] Team consensus achieved
- [ ] Used consistently in sprint planning

#### Task 0.7: Initialize Risk Register

**Effort**: 4 hours  
**Owner**: Project Manager + Tech Lead

**Steps**:

1. Create initial risk register in [Risks.md](Risks.md)
2. Identify top 12 risks (see Risks.md for details):

   - R-001: Data migration integrity
   - R-002: Concurrency control parity
   - R-003: Performance regression
   - R-004: Authentication security
   - R-005: Functional parity gaps
   - R-006: Dependency vulnerabilities
   - R-007: Browser compatibility
   - R-008: SQLite scaling limitations
   - R-009: State management complexity
   - R-010: Testing coverage gaps
   - R-011: Team learning curve
   - R-012: Documentation drift

3. Assign risk owners
4. Define risk review cadence (weekly in Phase 1-3, bi-weekly after)
5. Create risk escalation process

**Acceptance Criteria**:

- [ ] Risk register created with all identified risks
- [ ] Mitigation strategies defined for high-priority risks
- [ ] Risk owners assigned
- [ ] Risk review process established

### Deliverables

1. **ADRs**: 3 initial architectural decision records
2. **PR Template**: GitHub pull request template
3. **Linting Config**: ESLint + Prettier configurations
4. **Branching Strategy**: Documented branching and commit conventions
5. **Coding Standards**: Comprehensive coding standards document
6. **Definition of Done**: Team agreement on completion criteria
7. **Risk Register**: Initial risk inventory with mitigations

### Acceptance Criteria (Phase 0)

- [ ] All 7 tasks completed
- [ ] Team trained on all standards and processes
- [ ] First PR demonstrates template usage and standards compliance
- [ ] Linting passes on existing contoso-api code
- [ ] Risk register approved by project stakeholders
- [ ] Phase 0 retrospective completed

### Rollback Plan (Phase 0)

**Risk**: Minimal (documentation-only phase)

**If standards are rejected by team**:

1. Revise standards based on feedback
2. Re-review with team
3. Delay Phase 1 start until consensus achieved

---

## Phase 1: Discovery & Assessment

**Duration**: Week 1-2 (10 business days)  
**Goal**: Complete inventory of all .NET application features, endpoints, data models, and UI flows

### Objectives

1. Catalog every Razor Page and its functionality
2. Document all HTTP endpoints (GET/POST)
3. Map EF Core entities to Drizzle ORM schema
4. Inventory validation rules and business logic
5. Document UI flows and navigation paths
6. Assess test coverage (currently zero)
7. Identify technical debt and risks

### Tasks

#### Task 1.1: Endpoint Inventory

**Effort**: 16 hours  
**Owner**: Backend Developer

**Steps**:

1. Create endpoint inventory spreadsheet (Markdown table):

   | Module      | .NET Endpoint                         | HTTP Method | Request Body                                                 | Response                                                        | Notes                                          |
   | ----------- | ------------------------------------- | ----------- | ------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------- |
   | Students    | `/Students`                           | GET         | Query: searchString, sortOrder, pageIndex                    | PaginatedList\<Student\>                                        | Pagination, search, sort                       |
   | Students    | `/Students/Details/{id}`              | GET         | Route: id                                                    | Student with Enrollments                                        | Includes courses via Enrollment                |
   | Students    | `/Students/Create`                    | GET         | -                                                            | -                                                               | Render form                                    |
   | Students    | `/Students/Create`                    | POST        | Student (FirstMidName, LastName, EnrollmentDate)             | Redirect to Index or validation errors                          | Overposting protection via TryUpdateModelAsync |
   | Students    | `/Students/Edit/{id}`                 | GET         | Route: id                                                    | Student                                                         | Render form with current values                |
   | Students    | `/Students/Edit/{id}`                 | POST        | Route: id, Student (FirstMidName, LastName, EnrollmentDate)  | Redirect to Index or validation errors                          | Overposting protection                         |
   | Students    | `/Students/Delete/{id}`               | GET         | Route: id                                                    | Student                                                         | Render confirmation                            |
   | Students    | `/Students/Delete/{id}`               | POST        | Route: id                                                    | Redirect to Index or error message                              | FK violation handling                          |
   | Courses     | `/Courses`                            | GET         | -                                                            | List\<Course\> with Department                                  | No pagination                                  |
   | Courses     | `/Courses/Details/{id}`               | GET         | Route: id (int? nullable)                                    | Course with Department                                          | Handles null ID                                |
   | Courses     | `/Courses/Create`                     | GET         | -                                                            | -                                                               | Render form with departments dropdown          |
   | Courses     | `/Courses/Create`                     | POST        | Course (CourseID manual, Title, Credits, DepartmentID)       | Redirect to Index or validation errors                          | Manual CourseID entry                          |
   | Courses     | `/Courses/Edit/{id}`                  | GET         | Route: id (int? nullable)                                    | Course                                                          | CourseID immutable                             |
   | Courses     | `/Courses/Edit/{id}`                  | POST        | Route: id, Course (Title, Credits, DepartmentID)             | Redirect to Index or validation errors                          | CourseID not editable                          |
   | Courses     | `/Courses/Delete/{id}`                | GET         | Route: id (int? nullable)                                    | Course with Department                                          | Confirmation page                              |
   | Courses     | `/Courses/Delete/{id}`                | POST        | Route: id                                                    | Redirect to Index                                               | Cascade delete to Enrollments                  |
   | Departments | `/Departments`                        | GET         | -                                                            | List\<Department\> with Administrator                           | Administrator is Instructor                    |
   | Departments | `/Departments/Details/{id}`           | GET         | Route: id                                                    | Department with Administrator and Courses                       | Shows related courses                          |
   | Departments | `/Departments/Create`                 | GET         | -                                                            | -                                                               | Render form with instructors dropdown          |
   | Departments | `/Departments/Create`                 | POST        | Department (Name, Budget, StartDate, InstructorID)           | Redirect to Index or validation errors                          | InstructorID optional                          |
   | Departments | `/Departments/Edit/{id}`              | GET         | Route: id                                                    | Department with ConcurrencyToken                                | Hidden field for token                         |
   | Departments | `/Departments/Edit/{id}`              | POST        | Route: id, Department + ConcurrencyToken                     | Redirect to Index, validation errors, or concurrency error page | **Optimistic concurrency handling**            |
   | Departments | `/Departments/Delete/{id}`            | GET         | Route: id                                                    | Department with Administrator                                   | Confirmation page                              |
   | Departments | `/Departments/Delete/{id}`            | POST        | Route: id + ConcurrencyToken                                 | Redirect to Index or concurrency error                          | Checks concurrency before delete               |
   | Instructors | `/Instructors?id={id}&courseID={cid}` | GET         | Query: id, courseID                                          | InstructorIndexData with 3 levels                               | Master-detail with explicit loading            |
   | Instructors | `/Instructors/Details/{id}`           | GET         | Route: id                                                    | Instructor with OfficeAssignment and Courses                    | Many-to-many courses                           |
   | Instructors | `/Instructors/Create`                 | GET         | -                                                            | -                                                               | Form with course checkboxes                    |
   | Instructors | `/Instructors/Create`                 | POST        | Instructor + OfficeAssignment + selectedCourses[]            | Redirect to Index or validation errors                          | Many-to-many assignment                        |
   | Instructors | `/Instructors/Edit/{id}`              | GET         | Route: id                                                    | Instructor with Courses                                         | Checkboxes show current assignments            |
   | Instructors | `/Instructors/Edit/{id}`              | POST        | Route: id, Instructor + OfficeAssignment + selectedCourses[] | Redirect to Index or validation errors                          | Update many-to-many                            |
   | Instructors | `/Instructors/Delete/{id}`            | GET         | Route: id                                                    | Instructor                                                      | Confirmation page                              |
   | Instructors | `/Instructors/Delete/{id}`            | POST        | Route: id                                                    | Redirect to Index                                               | Handles FK violations (Department admin)       |
   | About       | `/About`                              | GET         | -                                                            | List\<EnrollmentDateGroup\>                                     | Groups students by enrollment date             |
   | Home        | `/`                                   | GET         | -                                                            | -                                                               | Home page                                      |
   | Privacy     | `/Privacy`                            | GET         | -                                                            | -                                                               | Privacy policy page                            |

2. Document query string parameters for each endpoint
3. Document response types (HTML vs. redirect vs. JSON if API)
4. Identify overposting vulnerabilities (students, courses, departments, instructors all use TryUpdateModelAsync - secure)

**Acceptance Criteria**:

- [ ] All 30+ endpoints documented
- [ ] Request/response shapes captured
- [ ] Query parameters documented
- [ ] Overposting protection noted

#### Task 1.2: Entity-to-Drizzle Schema Mapping

**Effort**: 12 hours  
**Owner**: Backend Developer

**Steps**:

1. Create entity mapping table:

   | EF Core Entity     | Drizzle Table/Schema | Fields Mapping                                                                                                                                                                                            | Relationships                                                                                      | Special Notes                                           |
   | ------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
   | `Student`          | `Student`            | ID → ID (Int autoincrement), LastName → LastName, FirstMidName → FirstMidName, EnrollmentDate → EnrollmentDate (DateTime)                                                                                 | Enrollments (one-to-many)                                                                          | FullName computed property → client-side                |
   | `Course`           | `Course`             | CourseID → CourseID (Int primary key), Title → Title, Credits → Credits (Int), DepartmentID → DepartmentID (Int)                                                                                          | Department (many-to-one), Enrollments (one-to-many), Instructors (many-to-many via join table)     | **Manual ID** (not autoincrement)                       |
   | `Department`       | `Department`         | DepartmentID → DepartmentID (Int autoincrement), Name → Name, Budget → Budget (Decimal), StartDate → StartDate (DateTime), InstructorID → InstructorID (Int?), ConcurrencyToken → version (Int default 1) | Administrator (many-to-one to Instructor), Courses (one-to-many)                                   | **Optimistic concurrency**: [Timestamp] → version field |
   | `Instructor`       | `Instructor`         | ID → ID (Int autoincrement), LastName → LastName, FirstMidName → FirstMidName, HireDate → HireDate (DateTime)                                                                                             | OfficeAssignment (one-to-one), Courses (many-to-many via join table), AdministeredDepartment (one) | FullName computed property → client-side                |
   | `Enrollment`       | `Enrollment`         | EnrollmentID → EnrollmentID (Int autoincrement), CourseID → CourseID (Int), StudentID → StudentID (Int), Grade → Grade (String?)                                                                          | Course (many-to-one), Student (many-to-one)                                                        | Grade enum (A/B/C/D/F) → String or Int enum in Drizzle  |
   | `OfficeAssignment` | `OfficeAssignment`   | InstructorID → InstructorID (Int primary key), Location → Location                                                                                                                                        | Instructor (one-to-one with shared PK)                                                             | Shared primary key pattern                              |

2. Define Drizzle schema files (e.g., `contoso/src/db/schema.ts`) that match this mapping
3. Document any discrepancies or missing features
4. Validate relationships (foreign keys, cascade deletes)

**Acceptance Criteria**:

- [ ] All 6 entities mapped
- [ ] Drizzle schema validated against EF schema
- [ ] Relationships verified
- [ ] Special cases documented (manual ID, concurrency token)

#### Task 1.3: Validation Rules Inventory

**Effort**: 10 hours  
**Owner**: Full-stack Developer

**Steps**:

1. Extract all Data Annotations validation from models:

   **Student**:

   - `[Required]` LastName
   - `[Required]` FirstMidName
   - `[DataType(DataType.Date)]` EnrollmentDate
   - `[Display(Name = "Last Name")]` LastName
   - `[Display(Name = "First Name")]` FirstMidName
   - `[Display(Name = "Enrollment Date")]` EnrollmentDate

   **Course**:

   - `[DatabaseGenerated(DatabaseGeneratedOption.None)]` CourseID (manual entry)
   - `[StringLength(50, MinimumLength = 3)]` Title
   - `[Range(0, 5)]` Credits
   - `[Required]` DepartmentID

   **Department**:

   - `[StringLength(50, MinimumLength = 3)]` Name
   - `[DataType(DataType.Currency)]` Budget
   - `[Display(Name = "Start Date")]` StartDate
   - `[Display(Name = "Administrator")]` InstructorID (optional)
   - `[Timestamp]` ConcurrencyToken

   **Instructor**:

   - `[Required]` LastName
   - `[Required]` FirstMidName
   - `[DataType(DataType.Date)]` HireDate

   **OfficeAssignment**:

   - `[StringLength(50)]` Location
   - `[Display(Name = "Office Location")]` Location

   **Enrollment**:

   - `[Required]` CourseID
   - `[Required]` StudentID
   - Grade (nullable enum, no validation)

2. Create Zod schema equivalents for backend validation
3. Create Yup schema equivalents for frontend validation
4. Document any implicit validation (e.g., foreign key constraints)
5. Identify validation gaps (e.g., Course.CourseID uniqueness not validated in .NET)

**Acceptance Criteria**:

- [ ] All validation rules documented
- [ ] Zod schemas drafted for backend
- [ ] Yup schemas drafted for frontend
- [ ] Validation gaps identified

#### Task 1.4: UI Flow Documentation

**Effort**: 14 hours  
**Owner**: Frontend Developer

**Steps**:

1. Create UI flow diagrams for each module (Mermaid diagrams):

   **Student Flow**:

   ```
   Index (List) → Details → Back to Index
   Index → Create → Success → Index
   Index → Edit → Success → Index
   Index → Delete (Confirmation) → Success → Index
   Index → Search/Sort/Paginate → Stay on Index
   ```

   **Course Flow**:

   ```
   Index (List) → Details → Back to Index
   Index → Create (select Department) → Success → Index
   Index → Edit (CourseID readonly) → Success → Index
   Index → Delete → Success → Index
   ```

   **Department Flow**:

   ```
   Index (List) → Details (show Courses) → Back to Index
   Index → Create (select Instructor) → Success → Index
   Index → Edit → Success → Index
   Index → Edit → Concurrency Conflict → Show Current Values → Retry or Cancel
   Index → Delete → Concurrency Check → Success or Error → Index
   ```

   **Instructor Flow**:

   ```
   Index (Master-Detail, 3 levels) → Click Instructor → Show Courses
   Click Course → Show Enrollments (explicit load)
   Index → Details → Back to Index
   Index → Create (checkboxes for Courses) → Success → Index
   Index → Edit (checkboxes for Courses) → Success → Index
   Index → Delete → Success or FK Error → Index
   ```

2. Document navigation patterns (breadcrumbs, back buttons, redirects)
3. Screenshot key pages for reference (optional but recommended)
4. Document query string preservation (e.g., search terms, sort order)
5. Document error message display patterns (validation errors, concurrency errors, FK violation errors)

**Acceptance Criteria**:

- [ ] Flow diagrams created for all 4 modules
- [ ] Navigation patterns documented
- [ ] Error handling patterns documented
- [ ] Query string behavior documented

#### Task 1.5: Business Logic Inventory

**Effort**: 10 hours  
**Owner**: Backend Developer

**Steps**:

1. Extract business logic from PageModel classes:

   **Students**:

   - Pagination logic: `PaginatedList<T>.CreateAsync()` with page size 3
   - Search logic: `if (!String.IsNullOrEmpty(searchString)) { students = students.Where(s => s.LastName.Contains(searchString) || s.FirstMidName.Contains(searchString)); }`
   - Sort logic: Switch on sortOrder (LastName asc/desc, Date asc/desc)
   - Query string preservation: Store searchString, sortOrder in ViewData
   - Overposting protection: `TryUpdateModelAsync<Student>(studentToUpdate, "student", s => s.FirstMidName, s => s.LastName, s => s.EnrollmentDate)`

   **Courses**:

   - Department dropdown population: `PopulateDepartmentsDropDownList()` in base class
   - Manual CourseID entry: No auto-increment
   - **Gap**: No uniqueness validation on CourseID (can create duplicates)

   **Departments**:

   - Instructor dropdown population: `PopulateInstructorsDropDownList()`
   - **Optimistic concurrency logic**:
     - Store original ConcurrencyToken in hidden field
     - On update: `context.Entry(departmentToUpdate).Property("ConcurrencyToken").OriginalValue = ConcurrencyToken`
     - Catch `DbUpdateConcurrencyException`
     - Show current DB values vs. user values
     - Allow user to overwrite or cancel
   - Concurrency on delete: Similar logic

   **Instructors**:

   - Course checkbox population: `PopulateAssignedCourseData()`
   - **Many-to-many update logic**:
     - Clear existing courses: `instructorToUpdate.Courses.Clear()`
     - Add selected courses: `instructorToUpdate.Courses.Add(courseToAdd)`
     - Use HashSet for efficient lookup
   - **Explicit loading**: `await context.Entry(courseToDisplay).Collection(c => c.Enrollments).LoadAsync();`
   - OfficeAssignment nullable handling: Check if Location is empty, remove assignment if so

   **About**:

   - Group by EnrollmentDate: `from student in context.Students group student by student.EnrollmentDate into dateGroup`
   - Count students per date: `select new EnrollmentDateGroup { EnrollmentDate = dateGroup.Key, StudentCount = dateGroup.Count() }`

2. Document shared utilities:

   - `PaginatedList<T>`: Generic pagination helper
   - Base classes: `DepartmentNamePageModel`, `InstructorCoursesPageModel`

3. Identify business rules not captured in annotations:
   - CourseID must be unique (not enforced in code)
   - Instructor can administer at most one department (DB constraint)
   - Deleting instructor fails if they administer a department (FK constraint)

**Acceptance Criteria**:

- [ ] All business logic documented
- [ ] Shared utilities cataloged
- [ ] Business rules extracted
- [ ] Gaps identified (CourseID uniqueness)

#### Task 1.6: Data Seeding Requirements

**Effort**: 6 hours  
**Owner**: Backend Developer

**Steps**:

1. Analyze `DbInitializer.cs`:

   - Creates 8 students (Alexander, Alonso, Anand, Barzdukas, Li, Justice, Norman, Olivetto)
   - Creates 4 instructors (Abercrombie, Fakhouri, Harui, Kapoor)
   - Creates 5 departments (English, Mathematics, Engineering, Economics, IT) with budgets and start dates
   - Creates 10 courses (Chemistry, Microeconomics, Macroeconomics, Calculus, Trigonometry, Composition, Literature, 2 more)
   - Creates enrollments (random grades)
   - Creates office assignments for some instructors
   - Creates instructor-course assignments

2. Document seed data requirements for Drizzle ORM:

   - Same data structure
   - Same IDs (for consistency)
   - Same relationships

3. Create seed script (e.g., `src/db/seed.ts`) using Drizzle ORM:

   ```typescript
   // Seed students
   await db.insert(students).values([
     /* ... */
   ]);

   // Seed instructors
   await db.insert(instructors).values([
     /* ... */
   ]);

   // Seed departments
   await db.insert(departments).values([
     /* ... */
   ]);

   // Seed courses (with manual IDs)
   await db.insert(courses).values([
     /* ... */
   ]);

   // Seed enrollments
   await db.insert(enrollments).values([
     /* ... */
   ]);

   // Seed office assignments
   await db.insert(officeAssignments).values([
     /* ... */
   ]);

   // Seed instructor-course relationships (many-to-many via join table)
   await db.insert(instructorCourses).values([
     /* ... */
   ]);
   ```

4. Document seed data execution strategy:
   - Run seed script after migrations
   - Seed only in development/staging (not production)
   - Ensure idempotency (check if data exists before seeding)

**Acceptance Criteria**:

- [ ] Seed data structure documented
- [ ] Drizzle seed script structure defined
- [ ] Execution strategy documented
- [ ] Idempotency ensured

#### Task 1.7: Test Coverage Assessment

**Effort**: 4 hours  
**Owner**: QA Lead

**Steps**:

1. Confirm: **No test project exists in .NET solution**
2. Document testing gaps:

   - No unit tests for business logic
   - No integration tests for database operations
   - No E2E tests for user flows
   - No validation tests
   - No concurrency tests (critical gap for Departments)

3. Create test requirement document:

   - Target coverage: >80% (backend), >75% (frontend)
   - Prioritize: Concurrency tests, validation tests, CRUD tests, relationship tests
   - E2E tests: Critical user journeys (create → edit → delete)

4. Estimate test writing effort (see Phase 6)

**Acceptance Criteria**:

- [ ] Test coverage gaps documented
- [ ] Test requirements defined
- [ ] Effort estimated

### Deliverables (Phase 1)

1. **Endpoint Inventory**: Complete table of all 30+ endpoints
2. **Entity Mapping**: EF Core → Drizzle ORM mapping table
3. **Validation Rules**: Extracted validation rules with Zod/Yup schemas
4. **UI Flow Diagrams**: Mermaid diagrams for all modules
5. **Business Logic Document**: Extracted logic from PageModels
6. **Seed Data Requirements**: Documented data structure
7. **Test Requirements**: Coverage gaps and targets

### Acceptance Criteria (Phase 1)

- [ ] 100% endpoint coverage documented
- [ ] All 6 entities mapped to Drizzle ORM
- [ ] All validation rules captured
- [ ] UI flows documented with diagrams
- [ ] Business logic extracted
- [ ] Seed data structure defined
- [ ] Test gaps identified
- [ ] Phase 1 retrospective completed

### Rollback Plan (Phase 1)

**Risk**: Minimal (documentation-only phase)

**If inventory incomplete**:

1. Extend Phase 1 duration
2. Prioritize critical functionality first
3. Document known unknowns for Phase 2

---

## Phase 2: Backend (contoso-api) Planning

**Duration**: Week 2-3 (10 business days)  
**Goal**: Design Express/TypeScript project structure with complete routing parity to .NET application

**See**: [modules/backend-contoso-api.md](modules/backend-contoso-api.md) for detailed module-specific plan

### Objectives

1. Complete Express route structure mirroring all Razor Page endpoints
2. Design controller/service/repository architecture
3. Define TypeScript DTOs with Zod validation
4. Design error handling and logging middleware
5. Plan API documentation (OpenAPI/Swagger)
6. Define transaction and concurrency handling patterns

### High-Level Tasks

- Task 2.1: Design route structure (16 hours)
- Task 2.2: Design controller/service layer (14 hours)
- Task 2.3: Define DTOs and Zod schemas (12 hours)
- Task 2.4: Design middleware pipeline (10 hours)
- Task 2.5: Plan error handling strategy (8 hours)
- Task 2.6: Create OpenAPI/Swagger spec (10 hours)
- Task 2.7: Document transaction patterns (6 hours)

**Total Effort**: 76 hours (~10 days with 1 engineer)

### Acceptance Criteria (Phase 2)

- [ ] All routes documented with Express equivalents
- [ ] Controller/service architecture designed
- [ ] All DTOs defined with Zod schemas
- [ ] Middleware pipeline documented
- [ ] Error handling strategy documented
- [ ] OpenAPI spec generated
- [ ] Transaction patterns documented

**See full details in**: [modules/backend-contoso-api.md](modules/backend-contoso-api.md)

---

## Phase 3: Data & Persistence (Drizzle ORM)

**Duration**: Week 3-4 (10 business days)  
**Goal**: Complete Drizzle ORM schema, migrations (drizzle-kit), and seed script with full parity to EF Core

**See**: data persistence planning notes for detailed module-specific plan

### Objectives

1. Validate and complete Drizzle schema
2. Create Drizzle migrations (drizzle-kit) matching EF migrations
3. Implement seed script (e.g., `src/db/seed.ts`)
4. Design data access service layer
5. Implement optimistic concurrency for Departments
6. Document SQLite configuration (WAL mode)
7. Plan transaction handling patterns

### High-Level Tasks

- Task 3.1: Validate Drizzle schema completeness (8 hours)
- Task 3.2: Create Drizzle migrations (10 hours)
- Task 3.3: Implement seed script (12 hours)
- Task 3.4: Design data access layer (14 hours)
- Task 3.5: Implement concurrency handling (16 hours)
- Task 3.6: Configure SQLite (6 hours)
- Task 3.7: Document transaction patterns (6 hours)

**Total Effort**: 72 hours (~9 days with 1 engineer)

### Acceptance Criteria (Phase 3)

- [ ] Drizzle schema matches EF schema 100%
- [ ] Migrations created and tested
- [ ] Seed script populates data correctly
- [ ] Data access layer designed
- [ ] Optimistic concurrency works for Departments
- [ ] SQLite configured with WAL mode
- [ ] Transaction patterns documented

**See full details in**: data persistence planning notes

---

## Phase 4: Auth & Security (JWT)

**Duration**: Week 4-5 (10 business days)  
**Goal**: Implement JWT-based authentication with httpOnly cookies and role-based access control design

**See**: [modules/auth-jwt.md](modules/auth-jwt.md) for detailed module-specific plan

### Objectives

1. Design JWT token structure (claims, expiry)
2. Implement login/logout endpoints
3. Implement token refresh strategy
4. Create auth middleware for protected routes
5. Design RBAC for future use
6. Configure CORS and security headers
7. Document security best practices

### High-Level Tasks

- Task 4.1: Design JWT structure (6 hours)
- Task 4.2: Implement login endpoint (10 hours)
- Task 4.3: Implement logout endpoint (4 hours)
- Task 4.4: Implement token refresh (12 hours)
- Task 4.5: Create auth middleware (8 hours)
- Task 4.6: Design RBAC (10 hours)
- Task 4.7: Configure CORS and security headers (8 hours)
- Task 4.8: Security audit (12 hours)

**Total Effort**: 70 hours (~9 days with 1 engineer)

### Acceptance Criteria (Phase 4)

- [ ] JWT tokens issued with 15-min expiry
- [ ] Refresh tokens with 7-day expiry
- [ ] Login/logout endpoints working
- [ ] Auth middleware protects routes
- [ ] RBAC designed (implementation optional)
- [ ] CORS configured correctly
- [ ] Security audit passed

**See full details in**: [modules/auth-jwt.md](modules/auth-jwt.md)

---

## Phase 5: Frontend Migration (React)

**Duration**: Week 5-8 (20 business days)  
**Goal**: Migrate all Razor Pages to React components with Redux Toolkit and Bootstrap styling

**See**: [modules/frontend-react.md](modules/frontend-react.md) for detailed module-specific plan

### Objectives

1. Set up React + TypeScript project
2. Implement React Router routing
3. Create layout components
4. Migrate all 20+ pages to React
5. Implement Redux Toolkit state management
6. Integrate Axios for API calls
7. Implement forms with Yup validation
8. Style with Bootstrap 5.3

### High-Level Tasks

- Task 5.1: Set up React project (8 hours)
- Task 5.2: Implement routing (12 hours)
- Task 5.3: Create layout components (10 hours)
- Task 5.4: Migrate Student module (24 hours)
- Task 5.5: Migrate Course module (20 hours)
- Task 5.6: Migrate Department module (26 hours)
- Task 5.7: Migrate Instructor module (28 hours)
- Task 5.8: Implement Redux slices (20 hours)
- Task 5.9: Integrate Axios (12 hours)
- Task 5.10: Implement forms and validation (20 hours)

**Total Effort**: 180 hours (~23 days with 1 engineer)

### Acceptance Criteria (Phase 5)

- [ ] All pages render with Bootstrap styling
- [ ] Navigation matches .NET routing
- [ ] Forms validate client-side
- [ ] Pagination, search, sort work identically
- [ ] Redux state managed correctly
- [ ] API calls authenticated with JWT
- [ ] Error handling matches .NET

**See full details in**: [modules/frontend-react.md](modules/frontend-react.md)

---

## Phase 6: Testing & Quality Gates

**Duration**: Week 8-10 (15 business days)  
**Goal**: Achieve comprehensive test coverage (>80% backend, >75% frontend) with E2E tests

**See**: [modules/testing-strategy.md](modules/testing-strategy.md) for detailed module-specific plan

### Objectives

1. Write backend unit tests (Mocha + Chai)
2. Write backend integration tests (Supertest)
3. Write frontend unit tests (Jest + RTL)
4. Write frontend integration tests (MSW)
5. Write E2E tests (Playwright)
6. Generate coverage reports
7. Set up CI test execution

### High-Level Tasks

- Task 6.1: Backend unit tests (40 hours)
- Task 6.2: Backend integration tests (36 hours)
- Task 6.3: Frontend unit tests (44 hours)
- Task 6.4: Frontend integration tests (24 hours)
- Task 6.5: E2E tests (32 hours)
- Task 6.6: Coverage reporting (8 hours)
- Task 6.7: CI integration (12 hours)

**Total Effort**: 196 hours (~25 days with 1 engineer)

### Acceptance Criteria (Phase 6)

- [ ] Backend coverage >80%
- [ ] Frontend coverage >75%
- [ ] All CRUD operations tested
- [ ] Concurrency scenarios tested
- [ ] E2E tests pass
- [ ] Tests run in CI
- [ ] No test flakiness

**See full details in**: [modules/testing-strategy.md](modules/testing-strategy.md)

---

## Phase 7: CI/CD Documentation

**Duration**: Week 10 (5 business days)  
**Goal**: Document CI/CD pipeline requirements and deployment strategy

### Objectives

1. Document GitHub Actions workflow requirements
2. Define build steps
3. Define test execution strategy
4. Document deployment targets
5. Plan database migration execution
6. Document environment variable management
7. Define deployment strategy (blue-green)
8. Document rollback procedures

### Tasks

#### Task 7.1: Document CI/CD Pipeline

**Effort**: 16 hours  
**Owner**: DevOps Engineer

**Steps**:

1. Create `Docs/planning/ci-cd/build-pipeline.md`:
   - Prerequisites (Node.js 20.x, npm 10.x)
   - Backend build steps:
     ```bash
     cd contoso-api
     npm.cmd ci
     npm.cmd run build
     npm.cmd exec drizzle-kit generate
     npm.cmd test
     ```
   - Frontend build steps:
     ```bash
     cd contoso-client
     npm.cmd ci
     npm.cmd run build
     npm.cmd test
     ```
   - Artifact generation (ZIP or Docker image)
2. Create `Docs/planning/ci-cd/test-execution.md`:

   - Unit test execution (backend + frontend)
   - Integration test execution (with SQLite in-memory)
   - E2E test execution (Playwright)
   - Coverage report generation (c8, jest-coverage)
   - Quality gates (80% backend, 75% frontend, no failing tests)

3. Create `Docs/planning/ci-cd/deployment.md`:

   - Deployment targets (Azure App Service, AWS ECS, Docker)
   - Pre-deployment checklist (tests pass, coverage met, security scan passed)
   - Database migration execution (`npm.cmd exec drizzle-kit migrate`)
   - Blue-green deployment strategy:
     - Deploy to blue environment
     - Run smoke tests on blue
     - Switch traffic to blue
     - Keep green for rollback
   - Health check endpoints (`GET /api/health`)
   - Post-deployment smoke tests
   - Rollback procedure (switch back to green)

4. Create `Docs/planning/ci-cd/environments.md`:
   - Development environment setup (.env.development)
   - Staging environment setup (.env.staging)
   - Production environment setup (.env.production)
   - Environment variable catalog (all required vars)
   - Secrets management (Azure Key Vault, AWS Secrets Manager)

**Acceptance Criteria**:

- [ ] Pipeline steps documented
- [ ] Test execution strategy documented
- [ ] Deployment steps reproducible
- [ ] Environment configs documented
- [ ] Rollback procedure validated

#### Task 7.2: Document Monitoring and Logging

**Effort**: 8 hours  
**Owner**: DevOps Engineer

**Steps**:

1. Create `Docs/planning/ci-cd/monitoring.md`:

   - Logging strategy (Pino structured logging)
   - Log levels (error, warn, info, debug)
   - Log aggregation (e.g., Azure Application Insights, AWS CloudWatch)
   - Metrics to track:
     - Request rate
     - Error rate
     - Response time (p50, p95, p99)
     - Database query time
     - JWT token issuance rate
   - Alerting thresholds:
     - Error rate >5%
     - Response time p95 >500ms
     - CPU usage >80%
     - Memory usage >80%
   - Monitoring dashboard (Grafana or cloud provider dashboard)

2. Document incident response plan:
   - On-call rotation
   - Alert escalation (Slack, PagerDuty)
   - Runbook for common issues (database connection errors, high CPU, JWT token issues)

**Acceptance Criteria**:

- [ ] Monitoring strategy documented
- [ ] Alerting thresholds defined
- [ ] Incident response plan documented
- [ ] Runbook created

### Deliverables (Phase 7)

1. **Build Pipeline Documentation**: Step-by-step build process
2. **Test Execution Documentation**: Test strategy and quality gates
3. **Deployment Documentation**: Deployment steps and blue-green strategy
4. **Environment Configuration Documentation**: All environment variables and secrets
5. **Monitoring and Logging Documentation**: Metrics, alerts, runbooks

### Acceptance Criteria (Phase 7)

- [ ] All 5 documentation files created
- [ ] Pipeline steps reproducible
- [ ] Deployment strategy validated (in staging)
- [ ] Rollback procedure tested
- [ ] Monitoring strategy defined

**Note**: Per project constraints, **no actual CI/CD scripts** (.yml, .sh, .ps1) will be created, only documentation.

### Rollback Plan (Phase 7)

**Risk**: Low (documentation-only)

**If documentation is incomplete**:

1. Extend Phase 7 duration
2. Prioritize deployment and rollback docs
3. Complete monitoring docs later

---

## Phase 8: Cutover Plan

**Duration**: Week 11-12 (10 business days)  
**Goal**: Execute production migration with zero data loss and minimal downtime

### Objectives

1. Prepare production environment
2. Execute database migration (SQL Server → SQLite)
3. Deploy backend API
4. Deploy frontend React app
5. Configure DNS/load balancer
6. Run smoke tests
7. Monitor post-deployment
8. Execute rollback if critical issues arise

### Tasks

#### Task 8.1: Pre-Cutover Checklist

**Effort**: 8 hours  
**Owner**: Project Manager + Tech Lead

**Steps**:

1. Create cutover checklist:

   - [ ] All phases 0-7 completed
   - [ ] All tests passing (>80% backend, >75% frontend)
   - [ ] E2E tests passing
   - [ ] Security audit passed
   - [ ] Performance benchmarks met
   - [ ] Staging environment tested
   - [ ] Rollback procedure practiced
   - [ ] Production environment provisioned
   - [ ] Database backup created
   - [ ] Team trained on new stack
   - [ ] Stakeholders notified of cutover date
   - [ ] Maintenance window scheduled (if needed)
   - [ ] Monitoring dashboard configured
   - [ ] On-call rotation staffed

2. Schedule go-live date and time (recommend off-peak hours)
3. Notify stakeholders (email, Slack)
4. Assign roles for cutover (deployment lead, QA lead, monitoring lead, rollback lead)

**Acceptance Criteria**:

- [ ] Checklist completed
- [ ] Go-live date set
- [ ] Team assignments clear

#### Task 8.2: Database Migration

**Effort**: 16 hours (includes dry-run and actual migration)  
**Owner**: Backend Developer

**Steps**:

1. **Dry-run in staging**:

   - Export SQL Server data to JSON/CSV
   - Validate data integrity (row counts, foreign keys)
   - Import data to SQLite using Drizzle seed script
   - Validate imported data (compare with SQL Server)
   - Measure migration time

2. **Actual production migration**:

   - Create SQL Server backup (before export)
   - Export production data to JSON/CSV
   - Validate export (row counts, no NULL violations)
   - Create SQLite database
   - Run Drizzle migrations (`npm.cmd exec drizzle-kit migrate`)
   - Import data using seed script or custom import script
   - Validate imported data:
     - Row counts match
     - Foreign keys intact
     - Relationships preserved
     - No NULL constraint violations
   - Create SQLite backup (after import)

3. **Data validation queries**:

   ```sql
   -- Count students
   SELECT COUNT(*) FROM Student;

   -- Count enrollments with courses and students
   SELECT COUNT(*) FROM Enrollment
   INNER JOIN Course ON Enrollment.CourseID = Course.CourseID
   INNER JOIN Student ON Enrollment.StudentID = Student.ID;

   -- Count departments with administrators
   SELECT COUNT(*) FROM Department WHERE InstructorID IS NOT NULL;

   -- Count instructors with courses (many-to-many)
   SELECT COUNT(DISTINCT InstructorID) FROM _CourseToInstructor;
   ```

**Acceptance Criteria**:

- [ ] Dry-run successful (staging)
- [ ] Production export validated
- [ ] SQLite import successful
- [ ] Data validation queries pass
- [ ] Zero data loss
- [ ] Backups created

#### Task 8.3: Deploy Backend API

**Effort**: 6 hours  
**Owner**: DevOps Engineer

**Steps**:

1. Deploy backend API to production environment:

   - Build backend (`npm run build`)
   - Run Drizzle migrations (`npm.cmd exec drizzle-kit migrate`)
   - Deploy to Azure App Service, AWS ECS, or Docker container
   - Configure environment variables (.env.production)
   - Start application
   - Verify health check endpoint (`GET /api/health`)

2. Smoke tests:
   - Test `/api/students` (GET list)
   - Test `/api/students/{id}` (GET details)
   - Test `/api/courses` (GET list)
   - Test `/api/departments` (GET list)
   - Test `/api/auth/login` (POST login)

**Acceptance Criteria**:

- [ ] Backend deployed
- [ ] Health check returns 200 OK
- [ ] Smoke tests pass
- [ ] No errors in logs

#### Task 8.4: Deploy Frontend React App

**Effort**: 6 hours  
**Owner**: DevOps Engineer

**Steps**:

1. Deploy frontend to production:

   - Build frontend (`npm run build`)
   - Deploy static files to Azure Storage, AWS S3, or CDN
   - Configure environment variables (REACT_APP_API_URL=https://api.contoso.com)
   - Invalidate CDN cache (if using CDN)

2. Configure DNS:

   - Point www.contoso.com to frontend
   - Point api.contoso.com to backend

3. Smoke tests:
   - Navigate to www.contoso.com
   - Test navigation (Home → Students → Courses → Departments → Instructors)
   - Test create student flow
   - Test search and pagination
   - Test error handling (navigate to /nonexistent)

**Acceptance Criteria**:

- [ ] Frontend deployed
- [ ] DNS configured
- [ ] Smoke tests pass
- [ ] No console errors

#### Task 8.5: Post-Deployment Monitoring

**Effort**: 4 hours  
**Owner**: Monitoring Lead

**Steps**:

1. Monitor application for first 4 hours:

   - Error rate (should be <1%)
   - Response time (p95 should be <500ms)
   - Request rate (baseline)
   - CPU and memory usage (should be <70%)
   - Database query performance

2. Check logs for errors or warnings
3. Monitor user feedback (if users have access)
4. Run automated E2E tests against production

**Acceptance Criteria**:

- [ ] No critical errors
- [ ] Performance within acceptable range
- [ ] E2E tests pass
- [ ] User feedback positive (or no complaints)

#### Task 8.6: Rollback Execution (If Needed)

**Effort**: 4 hours (only if rollback triggered)  
**Owner**: Rollback Lead

**Steps**:

1. **Rollback triggers** (any of):

   - Critical bug affecting all users
   - Data integrity issue
   - Error rate >10%
   - Performance degradation >50%
   - Security vulnerability discovered

2. **Rollback steps**:

   - Switch DNS back to .NET application
   - Stop new API deployments
   - Restore SQL Server database from backup (if needed)
   - Notify stakeholders of rollback
   - Investigate root cause

3. **Post-rollback**:
   - Document what went wrong
   - Fix issues in staging
   - Re-plan cutover date
   - Re-test in staging

**Acceptance Criteria**:

- [ ] Rollback decision made within 15 minutes
- [ ] Rollback executed within 30 minutes
- [ ] .NET application restored
- [ ] Post-mortem scheduled

### Deliverables (Phase 8)

1. **Cutover Checklist**: Pre-cutover verification
2. **Data Migration Report**: Row counts, validation results
3. **Deployment Report**: Deployment steps and results
4. **Smoke Test Report**: Post-deployment verification
5. **Monitoring Report**: Performance metrics (first 24 hours)
6. **Lessons Learned Document**: What went well, what to improve

### Acceptance Criteria (Phase 8)

- [ ] All tasks completed
- [ ] Zero data loss
- [ ] All functionality works
- [ ] Performance within acceptable range
- [ ] Rollback tested (or executed if needed)
- [ ] Team trained on new stack
- [ ] Documentation complete
- [ ] Post-migration retrospective completed

### Rollback Plan (Phase 8)

**See Task 8.6 above**

**Rollback Prerequisites**:

- Keep .NET application deployable for 30 days post-cutover
- Maintain SQL Server backups (hourly for 7 days)
- Document rollback steps with screenshots
- Practice rollback in staging before cutover

---

## Summary: Effort Estimates by Phase

| Phase                      | Duration        | Total Effort (hours) | Team Size      | Notes                       |
| -------------------------- | --------------- | -------------------- | -------------- | --------------------------- |
| P0: Governance & Tooling   | 1 week          | 35 hours             | 2-3 people     | Standards setup             |
| P1: Discovery & Assessment | 2 weeks         | 72 hours             | 2-3 people     | Documentation only          |
| P2: Backend Planning       | 1.5 weeks       | 76 hours             | 1-2 people     | Design & architecture       |
| P3: Data & Persistence     | 1.5 weeks       | 72 hours             | 1-2 people     | Drizzle schema & migrations |
| P4: Auth & Security        | 1.5 weeks       | 70 hours             | 1-2 people     | JWT implementation          |
| P5: Frontend Migration     | 4 weeks         | 180 hours            | 2-3 people     | React components            |
| P6: Testing & Quality      | 3 weeks         | 196 hours            | 2-3 people     | Comprehensive testing       |
| P7: CI/CD Documentation    | 1 week          | 24 hours             | 1 person       | Documentation only          |
| P8: Cutover                | 2 weeks         | 44 hours             | 3-4 people     | Go-live execution           |
| **Total**                  | **16-17 weeks** | **769 hours**        | **2-4 people** | ~4 months with team         |

**Notes**:

- Effort estimates assume experienced developers (mid-senior level)
- Parallel work possible in some phases (e.g., backend + frontend in Phase 5)
- Add 20% buffer for unknowns and rework
- Total calendar time: 4-5 months with dedicated team

---

**Document Status**: Draft - Ready for Review  
**Next Steps**:

1. Review phase plan with team
2. Assign phase owners
3. Begin Phase 0: Governance & Tooling
4. Track progress using project management tool (Jira, Azure DevOps, etc.)
