# Contoso Migration Overview – .NET → React + Node/TypeScript

**Document Version**: 1.0  
**Date**: December 31, 2025  
**Status**: Planning Phase

## A. Current System Summary

### Solution Layout

**Solution**: `ContosoUniversity.sln`  
**Primary Project**: `ContosoUniversity` (.NET 6.0 Web Application)

**Project Structure**:

```
ContosoUniversity/
├── Program.cs                    # Application entry point (minimal hosting)
├── Data/
│   ├── SchoolContext.cs         # EF Core DbContext
│   └── DbInitializer.cs         # Database seeding
├── Models/
│   ├── Student.cs               # Student entity
│   ├── Course.cs                # Course entity (manual ID)
│   ├── Department.cs            # Department entity (optimistic concurrency)
│   ├── Instructor.cs            # Instructor entity
│   ├── Enrollment.cs            # Enrollment entity (junction)
│   ├── OfficeAssignment.cs      # Office assignment (1-to-1)
│   └── SchoolViewModels/        # View-specific DTOs
├── Pages/                        # Razor Pages (UI)
│   ├── Students/                # Student CRUD pages
│   ├── Courses/                 # Course CRUD pages
│   ├── Departments/             # Department CRUD pages
│   └── Instructors/             # Instructor CRUD pages
├── Migrations/                   # EF Core migrations
└── wwwroot/                      # Static assets (CSS, JS, Bootstrap)
```

**Technology Stack**:

- **Framework**: ASP.NET Core 6.0
- **UI**: Razor Pages
- **ORM**: Entity Framework Core 6.0.2
- **Database**: SQL Server (LocalDB for development)
- **Validation**: Data Annotations
- **Styling**: Bootstrap 5
- **JavaScript**: jQuery + jQuery Validation

### Application Models

#### **Domain Entities**

1. **Student**

   - Properties: ID, LastName, FirstMidName, EnrollmentDate
   - Relationships: Has many Enrollments
   - Features: Computed FullName property

2. **Course**

   - Properties: CourseID (manual entry), Title, Credits, DepartmentID
   - Relationships: Belongs to Department, Has many Enrollments, Many-to-many with Instructors
   - Features: CourseID not auto-generated (DatabaseGeneratedOption.None)

3. **Department**

   - Properties: DepartmentID, Name, Budget, StartDate, InstructorID, ConcurrencyToken
   - Relationships: Has one Administrator (Instructor), Has many Courses
   - Features: **Optimistic concurrency control** with [Timestamp] attribute

4. **Instructor**

   - Properties: ID, LastName, FirstMidName, HireDate
   - Relationships: Has one OfficeAssignment, Many-to-many with Courses, Can administer Department
   - Features: Computed FullName property

5. **Enrollment**

   - Properties: EnrollmentID, CourseID, StudentID, Grade (nullable enum)
   - Relationships: Belongs to Student and Course
   - Features: Grade enum (A, B, C, D, F, or null)

6. **OfficeAssignment**
   - Properties: InstructorID (PK + FK), Location
   - Relationships: One-to-one with Instructor (shared primary key)

#### **ViewModels**

1. **InstructorIndexData**: Aggregates Instructors, Courses, Enrollments for master-detail view
2. **AssignedCourseData**: Represents course assignment checkboxes
3. **EnrollmentDateGroup**: Groups students by enrollment date (About page)

### Key Endpoints/Features

#### **Student Management** (`/Students`)

- **GET /Students** - Paginated list with search (LastName, FirstMidName) and sorting
- **GET /Students/Details/{id}** - View student with enrollments and courses
- **GET /Students/Create** - Display create form
- **POST /Students/Create** - Create new student (overposting protection via TryUpdateModelAsync)
- **GET /Students/Edit/{id}** - Display edit form
- **POST /Students/Edit/{id}** - Update student (overposting protection)
- **GET /Students/Delete/{id}** - Display delete confirmation
- **POST /Students/Delete/{id}** - Delete student (with error handling for FK violations)

**Features**:

- Pagination via `PaginatedList<T>` utility (page size configurable)
- Sorting by LastName (asc/desc) and EnrollmentDate (asc/desc)
- Search by LastName or FirstMidName (contains)
- Query string preservation across navigation

#### **Course Management** (`/Courses`)

- **GET /Courses** - List all courses with departments
- **GET /Courses/Details/{id}** - View course details
- **GET /Courses/Create** - Display create form with department dropdown
- **POST /Courses/Create** - Create new course with manual CourseID entry
- **GET /Courses/Edit/{id}** - Display edit form
- **POST /Courses/Edit/{id}** - Update course (CourseID immutable)
- **GET /Courses/Delete/{id}** - Display delete confirmation
- **POST /Courses/Delete/{id}** - Delete course

**Features**:

- Department dropdown (ordered by name)
- Manual CourseID entry (no auto-increment)
- Base class `DepartmentNamePageModel` for shared dropdown logic
- No pagination (all courses displayed)
- Risk: No uniqueness validation on CourseID entry

#### **Department Management** (`/Departments`)

- **GET /Departments** - List all departments with administrators
- **GET /Departments/Details/{id}** - View department details
- **GET /Departments/Create** - Display create form with instructor dropdown
- **POST /Departments/Create** - Create new department
- **GET /Departments/Edit/{id}** - Display edit form with concurrency token
- **POST /Departments/Edit/{id}** - Update department with **concurrency conflict detection**
- **GET /Departments/Delete/{id}** - Display delete confirmation
- **POST /Departments/Delete/{id}** - Delete department with concurrency check

**Features**:

- **Advanced optimistic concurrency control** using [Timestamp] attribute
- Conflict resolution UI showing current DB values vs. user values
- Field-level conflict messages
- Handles concurrent edit and delete scenarios
- Reference implementation for concurrency patterns

#### **Instructor Management** (`/Instructors`)

- **GET /Instructors?id={instructorId}&courseID={courseId}** - Master-detail view (three levels)
  - Level 1: All instructors with office assignments and courses
  - Level 2: Courses for selected instructor
  - Level 3: Enrollments for selected course (explicit loading)
- **GET /Instructors/Details/{id}** - View instructor details
- **GET /Instructors/Create** - Display create form with course checkboxes
- **POST /Instructors/Create** - Create instructor with course assignments
- **GET /Instructors/Edit/{id}** - Display edit form with current course assignments
- **POST /Instructors/Edit/{id}** - Update instructor and course assignments
- **GET /Instructors/Delete/{id}** - Display delete confirmation
- **POST /Instructors/Delete/{id}** - Delete instructor

**Features**:

- **Many-to-many relationship management** with courses
- Checkbox-based course assignment UI
- Office assignment can be set or cleared
- Explicit loading for performance (load enrollments on-demand)
- Base class `InstructorCoursesPageModel` for shared course logic
- HashSet for efficient membership testing

#### **Additional Pages**

- **GET /** - Home page
- **GET /About** - Enrollment statistics grouped by date
- **GET /Privacy** - Privacy policy
- **GET /Error** - Error page

### Current Authentication/Authorization

**Status**: ❌ **No authentication or authorization implemented**

- All pages are publicly accessible
- No user login/logout functionality
- No role-based access control
- No claims or permissions

**Implication**: Migration must design and implement auth from scratch while maintaining public access patterns.

---

## B. Target Stack & Equivalents

### Target Technology Stack

| Layer                 | Technology                   | Version/Framework                 |
| --------------------- | ---------------------------- | --------------------------------- |
| **Backend API**       | Node.js + TypeScript         | Node 20.x, TypeScript 5.x         |
| **API Framework**     | Express.js                   | Express 4.x                       |
| **ORM**               | Drizzle ORM                  | Drizzle ORM (latest)              |
| **Database**          | SQLite                       | SQLite 3 with WAL mode            |
| **Frontend**          | React + TypeScript           | React 18.x, TypeScript 5.x        |
| **State Management**  | Redux Toolkit                | Redux Toolkit 2.x                 |
| **UI Library**        | Bootstrap                    | Bootstrap 5.3.x (same as current) |
| **HTTP Client**       | Axios                        | Axios 1.x                         |
| **Authentication**    | JWT (jsonwebtoken)           | JWT tokens with refresh strategy  |
| **Backend Testing**   | Mocha + Chai                 | Mocha 10.x, Chai 4.x              |
| **Frontend Testing**  | Jest + React Testing Library | Jest 29.x, RTL 14.x               |
| **API Documentation** | OpenAPI/Swagger              | Swagger UI Express                |
| **Logging**           | Pino                         | Pino 8.x                          |
| **Validation**        | Zod                          | Zod 3.x (backend), Yup (frontend) |

### Stack Equivalents Mapping

#### ASP.NET Core → Express.js

| .NET Concept                              | Node.js Equivalent                              | Notes                             |
| ----------------------------------------- | ----------------------------------------------- | --------------------------------- |
| `Program.cs` with `WebApplicationBuilder` | `src/index.ts` with `express()`                 | Application composition root      |
| ASP.NET Core Middleware Pipeline          | Express middleware                              | Similar `app.use()` pattern       |
| Razor Pages (`*.cshtml.cs`)               | Express route handlers                          | MVC-like structure preserved      |
| PageModel classes                         | Controller classes                              | Similar separation of concerns    |
| `IActionResult`                           | Response methods (`res.json()`, `res.status()`) | HTTP response abstraction         |
| Model Binding                             | Request body parsing (`express.json()`)         | Automatic JSON parsing            |
| Data Annotations Validation               | Zod schemas                                     | TypeScript-first validation       |
| Dependency Injection (`builder.Services`) | Constructor injection or factory pattern        | Less framework support, manual DI |
| Configuration (`IConfiguration`)          | `dotenv` + `process.env`                        | Environment variable based        |
| Logging (`ILogger`)                       | Pino logger                                     | Structured logging                |
| Static Files (`UseStaticFiles()`)         | React build output served via Express           | Frontend assets separate          |

#### Entity Framework Core → Drizzle ORM

| EF Core Concept                     | Drizzle Equivalent                             | Notes                     |
| ----------------------------------- | ---------------------------------------------- | ------------------------- |
| `DbContext`                         | Drizzle database client (`db`)                 | Database client           |
| Entity classes (C#)                 | Drizzle schema (TS table definitions)          | Code-first schema         |
| Navigation properties               | FKs + joins                                    | Explicit joins            |
| Migrations (`dotnet ef migrations`) | `drizzle-kit generate` / `drizzle-kit migrate` | Schema versioning         |
| LINQ queries                        | Drizzle query builder                          | Type-safe queries         |
| `Include()` / `ThenInclude()`       | Explicit joins / composed queries              | Eager loading via joins   |
| `AsNoTracking()`                    | Not applicable (stateless)                     | No change tracking        |
| `DbUpdateConcurrencyException`      | Check affected rows on update                  | Optimistic locking        |
| `[Timestamp]` attribute             | `version` numeric column (default 1)           | Manual version field      |
| SQL Server                          | SQLite                                         | Database engine change    |
| Connection strings                  | SQLite file path / driver config               | Environment configuration |

#### Razor Pages → React Components

| Razor Concept                      | React Equivalent                                       | Notes                       |
| ---------------------------------- | ------------------------------------------------------ | --------------------------- |
| `*.cshtml` view                    | React component (`.tsx`)                               | JSX instead of Razor syntax |
| `*.cshtml.cs` PageModel            | React component logic + hooks                          | State and effects           |
| `@page` directive                  | React Router route                                     | Client-side routing         |
| `asp-for`, `asp-route` tag helpers | React props and `useNavigate()`                        | Data binding and navigation |
| `@Model` properties                | Component props/state                                  | Data flow                   |
| `ViewData` / `TempData`            | Redux Toolkit state                                    | Global state management     |
| `_Layout.cshtml`                   | Layout component                                       | Master page equivalent      |
| `_ViewImports.cshtml`              | Shared imports/providers                               | React context providers     |
| Form submission (POST)             | Axios POST with form data                              | AJAX-based submission       |
| `ModelState.IsValid`               | Client-side validation (Yup) + server validation (Zod) | Dual validation             |
| Query strings                      | URL search params (`useSearchParams()`)                | React Router v6             |
| `RedirectToPage()`                 | `navigate('/path')`                                    | Client-side navigation      |
| Partial views                      | Child components                                       | Component composition       |
| jQuery validation                  | Formik/React Hook Form + Yup                           | Modern form libraries       |

#### Configuration Management

| .NET Config                    | Node/React Config                         | Notes                 |
| ------------------------------ | ----------------------------------------- | --------------------- |
| `appsettings.json`             | Backend: `.env` file                      | Environment variables |
| `appsettings.Development.json` | `.env.development`                        | Environment-specific  |
| `IConfiguration` interface     | `process.env.*`                           | Direct access         |
| User Secrets                   | `.env.local` (gitignored)                 | Local overrides       |
| Connection strings             | `DATABASE_URL` env var                    | Drizzle configuration |
| App settings sections          | Prefix-based (`REACT_APP_*` for frontend) | Naming convention     |
| Frontend config                | React: `REACT_APP_` env vars              | Build-time injection  |

---

## C. Phase Plan (P0–P8)

### Phase 0: Governance & Tooling (Week 1)

**Goal**: Establish project standards, repository hygiene, and team processes

**Key Activities**:

- Define ADRs (Architectural Decision Records) for major technology choices
- Create PR templates and code review guidelines
- Establish branch strategy (feature branches, main, develop)
- Define commit message conventions
- Set up EditorConfig and linting rules (ESLint, Prettier)
- Document coding standards (TypeScript, React, Express)
- Define "Definition of Done" for migration tasks

**Deliverables**:

- `/Docs/planning/ADRs/` directory with ADR-0001 (technology stack)
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.editorconfig`, `.eslintrc.js`, `.prettierrc`
- `CONTRIBUTING.md` guide
- Risk register initialized

**Acceptance Criteria**:

- All team members trained on standards
- First PR demonstrates template usage
- Linting passes on existing contoso-api code

---

### Phase 1: Discovery & Assessment (Week 1-2)

**Goal**: Complete inventory of .NET application functionality, endpoints, data models, and UI flows

**Key Activities**:

- Catalog all Razor Pages and their functionality
- Document all EF Core entities, relationships, and constraints
- List all endpoints (GET/POST) with request/response shapes
- Identify shared components (PaginatedList, ViewModels, base classes)
- Map out current navigation flows
- Document validation rules and business logic
- Identify data seeding requirements
- Assess test coverage gaps (currently zero tests)

**Deliverables**:

- Endpoint inventory spreadsheet (see [Phases.md](Phases.md))
- EF → Drizzle ORM entity mapping document
- UI component hierarchy diagram
- Business rules documentation
- Data seeding requirements

**Acceptance Criteria**:

- 100% endpoint coverage documented
- All 6 entities mapped to Drizzle schema
- UI flow diagrams complete
- No undocumented features

---

### Phase 2: Backend (contoso-api) Planning (Week 2-3)

**Goal**: Design Express/TypeScript project structure with routing parity to .NET application

**Key Activities**:

- Complete Express route structure mirroring Razor Pages
- Design controller/service layer architecture
- Define DTO schemas (Zod) matching .NET models
- Plan error handling strategy (match .NET status codes)
- Design middleware pipeline (CORS, auth, logging, validation)
- Plan request/response interceptors
- Define API versioning strategy (if needed)
- Document OpenAPI/Swagger spec

**Deliverables**:

- `contoso-api` project structure documented
- Route mapping table (.NET → Express)
- DTO schema definitions (TypeScript interfaces + Zod)
- Error handling middleware design
- API documentation (Swagger)

**Acceptance Criteria**:

- All 30+ endpoints mapped
- DTOs preserve .NET validation rules
- Status codes match .NET responses
- Swagger spec generated

**Links**: See [modules/backend-contoso-api.md](modules/backend-contoso-api.md)

---

### Phase 3: Data & Persistence (Week 3-4)

**Goal**: Migrate EF Core schema to Drizzle ORM with SQLite, preserving all relationships and constraints

**Key Activities**:

- Complete Drizzle schema mapping from EF entities
- Handle special cases:
  - Department.ConcurrencyToken → version field
  - Course manual ID assignment
  - One-to-one relationship (OfficeAssignment)
  - Many-to-many (Instructor-Course) with implicit join table
- Define Drizzle migrations strategy (drizzle-kit)
- Create seed script (e.g., `src/db/seed.ts`) mirroring `DbInitializer.cs`
- Plan SQLite WAL mode configuration
- Document transaction handling
- Plan for SQLite limitations (no ROWVERSION)

**Deliverables**:

- Drizzle schema files (validate completeness)
- Drizzle migration files
- Seed script with test data
- Data access service layer design
- Transaction patterns documented

**Acceptance Criteria**:

- Schema matches EF entities 100%
- All relationships preserved
- Seed data matches .NET seeding
- Foreign key constraints enforced
- Version-based concurrency works

**Links**: See data persistence planning notes

---

### Phase 4: Auth & Security (Week 4-5)

**Goal**: Implement JWT-based authentication preserving current access patterns (public access initially, then role-based)

**Key Activities**:

- Design JWT token structure (claims, expiry)
- Implement token issuance endpoint (`POST /api/auth/login`)
- Implement token refresh endpoint (`POST /api/auth/refresh`)
- Create auth middleware for protected routes
- Design role-based access control (RBAC) for future use
- Plan frontend token storage (httpOnly cookies vs. localStorage)
- Implement logout endpoint
- Document security headers (CORS, CSP, HSTS)

**Deliverables**:

- JWT auth middleware
- Login/logout endpoints
- Token refresh strategy
- RBAC design document
- Security testing plan

**Acceptance Criteria**:

- JWT tokens issued with 15-min expiry
- Refresh tokens with 7-day expiry
- Protected routes return 401 if no token
- CORS configured for React frontend
- No tokens in URLs or localStorage (use httpOnly cookies)

**Links**: See [modules/auth-jwt.md](modules/auth-jwt.md)

---

### Phase 5: Frontend Migration (Week 5-8)

**Goal**: Migrate all Razor Pages to React components with Bootstrap UI and Redux Toolkit state

**Key Activities**:

- Set up React + TypeScript project with Vite or Create React App
- Implement React Router v6 routing (match .NET routes)
- Create layout component (match `_Layout.cshtml`)
- Migrate each Razor Page to React component:
  - Students module (Index, Create, Edit, Delete, Details)
  - Courses module (Index, Create, Edit, Delete, Details)
  - Departments module (Index, Create, Edit, Delete, Details)
  - Instructors module (Index, Create, Edit, Delete, Details)
  - About page
- Implement Redux Toolkit slices for each domain entity
- Integrate Axios for API calls
- Implement pagination component (match `PaginatedList<T>`)
- Implement search/sort functionality
- Implement form validation (Yup schemas matching .NET rules)
- Style with Bootstrap 5.3 (preserve existing look-and-feel)
- Implement error boundaries and 404 page

**Deliverables**:

- React app structure
- All 20+ page components
- Redux slices (students, courses, departments, instructors)
- Shared components (Layout, Pagination, ErrorBoundary)
- Form components with validation
- API client service (Axios wrapper)

**Acceptance Criteria**:

- All pages render with Bootstrap styling
- Navigation matches .NET routing
- Forms validate client-side (Yup)
- Pagination, search, sort work identically
- Redux state managed correctly
- API calls use JWT tokens
- Error handling matches .NET behavior

**Links**: See [modules/frontend-react.md](modules/frontend-react.md)

---

### Phase 6: Testing & Quality Gates (Week 8-10)

**Goal**: Achieve comprehensive test coverage matching .NET test intent (which was zero, so establish baseline)

**Key Activities**:

- Backend unit tests (Mocha + Chai):
  - Service layer tests (courseService, departmentService, etc.)
  - Controller tests (mock services)
  - Middleware tests (auth, error handling)
  - Validation tests (Zod schemas)
- Backend integration tests (Mocha + Chai + Supertest):
  - API endpoint tests (all CRUD operations)
  - Database integration tests (Drizzle ORM queries)
  - Concurrency conflict tests (Department version)
  - Transaction tests
- Frontend unit tests (Jest + React Testing Library):
  - Component tests (all pages)
  - Redux slice tests (reducers, thunks)
  - Hook tests (custom hooks)
  - Form validation tests
- Frontend integration tests:
  - User flow tests (create → edit → delete)
  - API mocking (MSW)
- E2E tests (Playwright or Cypress):
  - Critical user journeys
  - Cross-browser testing

**Deliverables**:

- Test suites for backend (Mocha/Chai)
- Test suites for frontend (Jest/RTL)
- E2E test suite (Playwright)
- Code coverage reports (>80% target)
- Performance benchmarks

**Acceptance Criteria**:

- Backend coverage >80%
- Frontend coverage >75%
- All CRUD operations tested
- Concurrency scenarios tested
- E2E tests for main flows pass
- No test flakiness
- Tests run in CI pipeline

**Links**: See [modules/testing-strategy.md](modules/testing-strategy.md)

---

### Phase 7: CI/CD Documentation (Week 10)

**Goal**: Document CI/CD pipeline requirements and deployment strategy (documentation only per constraint)

**Key Activities**:

- Document GitHub Actions workflow requirements
- Define build steps (backend, frontend)
- Define test execution strategy
- Document deployment targets (Azure, AWS, Docker)
- Plan database migration execution
- Document environment variable management
- Define blue-green or canary deployment strategy
- Document rollback procedures
- Plan monitoring and alerting

**Deliverables**:

- CI/CD pipeline documentation
- Deployment runbook
- Environment configuration guide
- Monitoring and logging strategy
- Incident response plan

**Acceptance Criteria**:

- Pipeline steps clearly documented
- Deployment steps reproducible
- Rollback procedure validated
- All environment configs documented
- Monitoring strategy defined

**Note**: Per project constraints, **no actual scripts** (.sh/.ps1) will be created, only documentation.

---

### Phase 8: Cutover Plan (Week 11-12)

**Goal**: Execute step-by-step migration with minimal downtime and rollback capability

**Key Activities**:

- Prepare production environment
- Execute database migration (SQL Server → SQLite export)
- Deploy backend API (contoso-api)
- Deploy frontend (React app)
- Configure DNS/load balancer
- Run smoke tests
- Monitor error rates and performance
- Execute rollback if needed
- Post-migration validation

**Deliverables**:

- Cutover checklist
- Data migration scripts (documentation)
- Deployment verification tests
- Go-live communication plan
- Post-migration monitoring dashboard
- Lessons learned document

**Acceptance Criteria**:

- Zero data loss
- All functionality works
- Performance within acceptable range
- Rollback tested successfully
- Team trained on new stack
- Documentation complete

**Links**: See [Phases.md](Phases.md) for detailed steps

---

## D. Dependency Map

### NuGet → npm Package Mapping

| .NET Package                                           | npm Equivalent                    | Purpose           | Notes                         |
| ------------------------------------------------------ | --------------------------------- | ----------------- | ----------------------------- |
| `Microsoft.AspNetCore.App`                             | `express`                         | Web framework     | Express replaces ASP.NET Core |
| `Microsoft.EntityFrameworkCore`                        | `drizzle-orm`                     | ORM               | Drizzle replaces EF Core      |
| `Microsoft.EntityFrameworkCore.SqlServer`              | `better-sqlite3`                  | Database provider | SQLite replaces SQL Server    |
| `Microsoft.EntityFrameworkCore.Tools`                  | `drizzle-kit`                     | Migration tooling | Schema management             |
| `Microsoft.AspNetCore.Diagnostics.EntityFrameworkCore` | N/A                               | EF error pages    | Not needed (API-only backend) |
| System.ComponentModel.DataAnnotations                  | `zod` (backend), `yup` (frontend) | Validation        | TypeScript schema validation  |
| `Microsoft.VisualStudio.Web.CodeGeneration.Design`     | N/A                               | Scaffolding       | Manual component creation     |
| Bootstrap (via LibMan/CDN)                             | `bootstrap` (npm)                 | UI framework      | Same version (5.3.x)          |
| jQuery                                                 | `react`                           | UI library        | React replaces jQuery         |
| jQuery Validation                                      | `yup`, `react-hook-form`          | Form validation   | React ecosystem               |
| N/A (.NET has no equivalent)                           | `cors`                            | CORS middleware   | Required for SPA              |
| N/A                                                    | `dotenv`                          | Configuration     | Environment variables         |
| N/A                                                    | `jsonwebtoken`                    | JWT auth          | Authentication tokens         |
| N/A                                                    | `axios`                           | HTTP client       | Frontend API calls            |
| N/A                                                    | `@reduxjs/toolkit`                | State management  | Global state                  |
| N/A                                                    | `react-router-dom`                | Client routing    | SPA routing                   |
| N/A                                                    | `pino`, `pino-http`               | Logging           | Structured logging            |
| N/A                                                    | `helmet`                          | Security headers  | Express security              |
| N/A                                                    | `express-rate-limit`              | Rate limiting     | API protection                |

### Windows-Specific APIs Requiring Parity

**Finding**: ✅ **No Windows-specific APIs detected in current codebase**

Analysis:

- No `System.Windows.*` references
- No P/Invoke or COM interop
- No Windows-specific file path handling (`Path.Combine` usage is cross-platform)
- No Windows services or IIS-specific code
- LocalDB connection string is Windows-specific but easily replaced with SQLite

**Action Required**: None. Migration to Node.js/SQLite is straightforward.

### Third-Party Library Assessment

| Library                | Usage                      | Migration Strategy                              |
| ---------------------- | -------------------------- | ----------------------------------------------- |
| Bootstrap 5            | Current UI styling         | **Preserve**: Use same version via npm          |
| jQuery                 | Minimal (validation, AJAX) | **Replace**: React handles DOM + Axios for AJAX |
| jQuery Validation      | Client-side validation     | **Replace**: Yup + React Hook Form              |
| Unobtrusive Validation | ASP.NET integration        | **Replace**: Yup schemas match Zod backend      |

---

## E. Config Map

### Current .NET Configuration

#### appsettings.json

```json
{
  "PageSize": 3,
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "SchoolContext": "Server=(localdb)\\mssqllocaldb;Database=SchoolContext;..."
  }
}
```

#### appsettings.Development.json

- Overrides for development environment
- Debug logging levels

#### launchSettings.json

- IIS Express and Kestrel profiles
- Port configuration (5000, 5001)
- Environment variables (ASPNETCORE_ENVIRONMENT)

### Target Configuration Strategy

#### Backend (.env)

```bash
# Node environment
NODE_ENV=development  # or production

# Server configuration
PORT=5000
HOST=0.0.0.0

# Database
DATABASE_URL="file:./dev.db"  # SQLite file path

# JWT configuration
JWT_SECRET=your-256-bit-secret
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:3000  # React dev server

# Logging
LOG_LEVEL=info

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Pagination
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```

#### Frontend (.env for React)

```bash
# React environment
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development

# Feature flags
REACT_APP_ENABLE_DEBUG=true

# Pagination
REACT_APP_DEFAULT_PAGE_SIZE=10
```

#### Drizzle Configuration (SQLite datasource)

```bash
# SQLite file path for Drizzle ORM
DATABASE_URL="file:./dev.db"
```

### Configuration Mapping Table

| .NET Config                          | Node/React Config          | Location                         | Notes                    |
| ------------------------------------ | -------------------------- | -------------------------------- | ------------------------ |
| `appsettings.json:PageSize`          | `DEFAULT_PAGE_SIZE`        | Backend `.env` + Frontend `.env` | Both need value          |
| `ConnectionStrings:SchoolContext`    | `DATABASE_URL`             | Backend `.env`                   | Drizzle configuration    |
| `Logging:LogLevel`                   | `LOG_LEVEL`                | Backend `.env`                   | Pino logger config       |
| `AllowedHosts`                       | `CORS_ORIGIN`              | Backend `.env`                   | CORS middleware          |
| Environment (Development/Production) | `NODE_ENV`                 | Process environment              | Standard Node convention |
| N/A (no auth in .NET)                | `JWT_SECRET`, `JWT_EXPIRY` | Backend `.env`                   | New for JWT auth         |
| N/A                                  | `REACT_APP_API_URL`        | Frontend `.env`                  | API base URL             |

### Secrets Management Strategy

**Development**:

- Use `.env.local` files (gitignored)
- Commit `.env.example` with placeholder values
- Document required variables in README

**Production**:

- Use environment variables (Azure App Service, AWS ECS, etc.)
- Use secrets management service (Azure Key Vault, AWS Secrets Manager)
- Never commit secrets to repository
- Rotate secrets regularly

---

## F. Testing Strategy

### Current State: Zero Tests

The .NET application currently has **no test project** or test coverage.

### Target: Comprehensive Test Coverage

#### Backend Testing (Mocha + Chai)

**Unit Tests** (`tests/unit/`):

- **Services**: Test business logic in isolation (mocked database client)
  - `courseService.test.ts`: CRUD operations, validation
  - `departmentService.test.ts`: Concurrency handling, version updates
  - `studentService.test.ts`: Pagination, search, sort logic
  - `instructorService.test.ts`: Many-to-many management
- **Controllers**: Test request/response handling (mocked services)
- **Middleware**: Test auth, error handling, validation
- **Utils**: Test pagination logic, helpers

**Integration Tests** (`tests/integration/`):

- **API Endpoints**: Test full request/response cycle with real database
  - All CRUD operations for each entity
  - Error scenarios (404, 400, 409, 500)
  - Query parameter handling (pagination, search, sort)
  - Relationship loading (include parameters)
- **Database**: Test Drizzle ORM queries with SQLite in-memory
  - Complex queries (joins, includes)
  - Transactions
  - Concurrency conflicts (Department version)
  - Cascade deletes
- **Authentication**: Test JWT token lifecycle
  - Login, logout, refresh
  - Protected routes
  - Token expiry handling

**Coverage Target**: >80% for services and controllers

#### Frontend Testing (Jest + React Testing Library)

**Unit Tests** (`src/__tests__/`):

- **Components**: Test rendering, props, events
  - Form components (input, validation, submission)
  - List components (pagination, sorting, search)
  - Detail components (data display)
- **Redux Slices**: Test reducers and thunks
  - Action creators
  - State updates
  - Async actions (API calls)
- **Hooks**: Test custom hooks in isolation
- **Utils**: Test helper functions

**Integration Tests**:

- **User Flows**: Test multi-step interactions
  - Create → View → Edit → Delete flow
  - Search → Sort → Paginate flow
  - Form validation → Submit → Success/Error
- **API Integration**: Use MSW (Mock Service Worker) for API mocking

**Coverage Target**: >75% for components and state logic

#### E2E Testing (Playwright or Cypress)

**Critical Paths** (`e2e/`):

- Student management workflow
- Course creation with department selection
- Department edit with concurrency conflict
- Instructor assignment to courses
- Navigation and routing
- Error handling (404, 500)

**Coverage Target**: All major user journeys

### Test Parity with .NET Intent

Since .NET app has no tests, establish baseline expectations:

**Functional Parity**:

- All CRUD operations work correctly
- Validation rules enforced (client + server)
- Relationships maintained (foreign keys, many-to-many)
- Pagination matches behavior
- Search and sort produce same results
- Concurrency conflicts detected and handled
- Error messages match .NET responses

**Performance Parity**:

- API response times comparable (SQLite may be faster for small datasets)
- Pagination performance acceptable (< 100ms for 10K records)
- Frontend rendering performance (< 2s initial load)

### Testing Tools & Frameworks

**Backend**:

- **Mocha**: Test runner
- **Chai**: Assertion library
- **Supertest**: HTTP testing
- **Sinon**: Mocking (if needed)
- **c8** or **nyc**: Code coverage

**Frontend**:

- **Jest**: Test runner + assertion
- **React Testing Library**: Component testing
- **MSW**: API mocking
- **@testing-library/user-event**: User interaction simulation
- **jest-coverage**: Code coverage

**E2E**:

- **Playwright**: Cross-browser E2E testing
- Or **Cypress**: Alternative E2E framework

### CI Integration

- Run tests on every PR
- Block merge if tests fail
- Generate coverage reports
- Track coverage trends over time
- Set minimum coverage thresholds (80% backend, 75% frontend)

---

## G. CI/CD Documentation Scope

**Constraint**: Per project requirements, **no scripts (.sh, .ps1, .yml workflows) will be created**, only documentation.

### Required Documentation

#### 1. Build Pipeline Documentation

**File**: `Docs/planning/ci-cd/build-pipeline.md`

**Contents**:

- Prerequisites (Node.js version, npm/pnpm)
- Backend build steps:
  ```bash
  cd contoso-api
  npm.cmd install
  npm run build
  npm run test
  npm.cmd exec drizzle-kit generate
  npm.cmd exec drizzle-kit migrate  # Production only
  ```
- Frontend build steps:
  ```bash
  cd contoso-client
  npm.cmd install
  npm run build
  npm run test
  ```
- Artifact generation (build outputs)
- Environment variable injection

#### 2. Test Execution Documentation

**File**: `Docs/planning/ci-cd/test-execution.md`

**Contents**:

- Unit test execution
- Integration test execution (with test database)
- E2E test execution (with Playwright)
- Coverage report generation
- Test result publishing
- Quality gates (minimum coverage, no failing tests)

#### 3. Deployment Documentation

**File**: `Docs/planning/ci-cd/deployment.md`

**Contents**:

- Deployment targets (Azure App Service, AWS, Docker)
- Pre-deployment checklist
- Database migration execution
- Blue-green deployment strategy
- Health check endpoints
- Smoke tests post-deployment
- Rollback procedure

#### 4. Environment Configuration Documentation

**File**: `Docs/planning/ci-cd/environments.md`

**Contents**:

- Development environment setup
- Staging environment setup
- Production environment setup
- Environment variable catalog
- Secrets management approach
- Database configuration per environment

### Workflow Descriptions (Documentation Only)

**PR Workflow**:

1. Trigger on pull request to `main` or `develop`
2. Run linting (ESLint, Prettier)
3. Run backend tests (Mocha/Chai)
4. Run frontend tests (Jest/RTL)
5. Generate coverage reports
6. Run security scan (npm audit)
7. Build artifacts
8. Post PR comment with test results

**Main Branch Workflow**:

1. Trigger on merge to `main`
2. Run full test suite
3. Build production artifacts
4. Run E2E tests
5. Deploy to staging environment
6. Run smoke tests
7. Manual approval gate
8. Deploy to production
9. Run production smoke tests
10. Send deployment notification

**Release Workflow**:

1. Create release tag
2. Generate changelog
3. Build release artifacts
4. Create GitHub release
5. Deploy to production
6. Update documentation

---

## H. Risks & Rollback

### Top-Level Risks Summary

Full risk register available in [Risks.md](Risks.md).

#### Critical Risks (High Priority)

1. **Data Migration Integrity** (Likelihood: Medium, Impact: Critical)

   - **Risk**: Data loss or corruption during SQL Server → SQLite migration
   - **Mitigation**: Multiple backups, validation scripts, phased migration, rollback plan

2. **Concurrency Control Parity** (Likelihood: Medium, Impact: High)

- **Risk**: Department optimistic locking may behave differently (Drizzle ORM version field vs. SQL Server ROWVERSION)
- **Mitigation**: Comprehensive concurrency tests, validation in staging

3. **Performance Regression** (Likelihood: Medium, Impact: High)

   - **Risk**: SQLite or Node.js may perform worse than SQL Server/.NET for certain queries
   - **Mitigation**: Performance benchmarking, query optimization, caching strategy

4. **Authentication Security** (Likelihood: Low, Impact: Critical)

   - **Risk**: JWT implementation may have security vulnerabilities (XSS, CSRF, token leakage)
   - **Mitigation**: Security audit, httpOnly cookies, CSRF tokens, regular rotation

5. **Functional Parity Gaps** (Likelihood: Medium, Impact: High)
   - **Risk**: React app may miss subtle .NET behaviors (validation, error handling, navigation)
   - **Mitigation**: Detailed functional testing, UAT, side-by-side comparison

#### Medium Risks

6. Dependency vulnerabilities (npm ecosystem)
7. Browser compatibility (React app)
8. SQLite scaling limitations
9. State management complexity (Redux)
10. Testing coverage gaps

#### Low Risks

11. Team learning curve (TypeScript, React, Drizzle ORM)
12. Documentation drift

### Rollback Strategy

**Decision Point**: End of each phase

**Rollback Scenarios**:

1. **Phase 2-4** (Backend only deployed): Rollback backend, keep .NET app running
2. **Phase 5** (Frontend deployed, backend API available): Rollback frontend DNS, keep .NET app
3. **Phase 6+** (Both deployed): Full rollback to .NET stack

**Rollback Steps**:

1. Detect issue (monitoring alerts, error rate spike)
2. Assess severity (critical vs. minor)
3. Execute rollback decision (< 15 min decision time)
4. Restore previous deployment
5. Verify functionality
6. Restore database from backup (if needed)
7. Post-mortem analysis

**Rollback Prerequisites**:

- Keep .NET application deployable for 30 days post-cutover
- Maintain database backups (hourly for 7 days)
- Document rollback steps with screenshots
- Practice rollback in staging

---

## I. Glossary & References

### Glossary

| Term            | Definition                                                                            |
| --------------- | ------------------------------------------------------------------------------------- |
| **ADR**         | Architectural Decision Record - Document explaining why a technical decision was made |
| **DTO**         | Data Transfer Object - Object that carries data between processes                     |
| **EF Core**     | Entity Framework Core - Microsoft's ORM for .NET                                      |
| **JWT**         | JSON Web Token - Stateless authentication token standard                              |
| **ORM**         | Object-Relational Mapping - Database abstraction layer                                |
| **Drizzle ORM** | Type-safe SQL ORM for Node.js and TypeScript                                          |
| **RTL**         | React Testing Library - Testing utilities for React components                        |
| **SPA**         | Single Page Application - Client-side rendered web app                                |
| **WAL**         | Write-Ahead Logging - SQLite journaling mode for better concurrency                   |
| **Zod**         | TypeScript-first schema validation library                                            |

### References

#### Documentation

- [ContosoUniversity Tutorial (Microsoft)](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/intro)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

#### Internal Documents

- [Phases.md](Phases.md) - Detailed phase breakdown
- [Architecture.md](Architecture.md) - System architecture diagrams
- [Risks.md](Risks.md) - Comprehensive risk register
- [ADRs/ADR-0001.md](ADRs/ADR-0001.md) - Technology stack decision
- [modules/backend-contoso-api.md](modules/backend-contoso-api.md) - Backend migration plan
- [modules/frontend-react.md](modules/frontend-react.md) - Frontend migration plan
- Data layer migration plan (Drizzle ORM)
- [modules/auth-jwt.md](modules/auth-jwt.md) - Authentication migration plan
- [modules/testing-strategy.md](modules/testing-strategy.md) - Testing approach

#### Existing .NET Migration Analysis

- [Docs/migration/Overview.md](../migration/Overview.md) - Original .NET 6 → 8 migration plan
- [Docs/migration/modules/](../migration/modules/) - Per-module .NET migration documentation

### Assumptions & Constraints

**Assumptions**:

- Team has TypeScript and React experience or is willing to learn
- Production infrastructure supports Node.js and SQLite
- Current .NET app remains available during migration (parallel run)
- Database size is manageable for SQLite (< 2GB recommended)
- No real-time collaboration features required (SQLite limitation)

**Constraints**:

- **No code changes** during planning phase
- **No script generation** (.sh, .ps1, .yml workflows)
- **Exact functional parity** required (no feature changes)
- **Documentation only** deliverables
- Must work on Windows development environment

### Success Criteria

**Technical**:

- [ ] All endpoints migrated with identical behavior
- [ ] All data migrated without loss
- [ ] Test coverage >80% (backend), >75% (frontend)
- [ ] Performance within 20% of .NET baseline
- [ ] Security audit passed (JWT implementation)
- [ ] Concurrency scenarios work correctly

**Business**:

- [ ] Zero functional regressions
- [ ] User experience unchanged (UI/UX parity)
- [ ] Deployment successfully completed
- [ ] Team trained on new stack
- [ ] Documentation complete and accessible

**Process**:

- [ ] All phases completed on schedule
- [ ] Rollback tested successfully
- [ ] Post-migration monitoring in place
- [ ] Lessons learned documented

---

**Document Status**: Draft - Ready for Review  
**Next Steps**:

1. Review and approve this overview with stakeholders
2. Begin Phase 0: Governance & Tooling
3. Create detailed task breakdown in [Phases.md](Phases.md)
4. Review architecture diagrams in [Architecture.md](Architecture.md)
5. Assess and mitigate risks from [Risks.md](Risks.md)
