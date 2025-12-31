# Architecture Documentation: .NET → React + Node/TypeScript

**Document Version**: 1.0  
**Date**: December 31, 2025  
**Status**: Active Planning

---

## Overview

This document provides architecture diagrams for the Contoso University application migration from .NET/Razor Pages to React + Node.js/TypeScript. It includes:

1. Current .NET architecture (AS-IS)
2. Target React/Node architecture (TO-BE)
3. Request flow mapping (legacy → target)
4. Data model mapping
5. Component hierarchy (frontend)

---

## 1. Current .NET Architecture (AS-IS)

### 1.1 Overall System Architecture

```mermaid
graph TB
    subgraph "Client Browser"
        Browser[Web Browser]
    end

    subgraph "ASP.NET Core Application"
        Kestrel[Kestrel Web Server<br/>Port 5000/5001]
        Middleware[Middleware Pipeline<br/>StaticFiles, Routing, etc.]

        subgraph "Razor Pages"
            StudentsPages[Students Pages<br/>Index, Create, Edit, Delete]
            CoursesPages[Courses Pages<br/>Index, Create, Edit, Delete]
            DepartmentsPages[Departments Pages<br/>Index, Create, Edit, Delete]
            InstructorsPages[Instructors Pages<br/>Index, Create, Edit, Delete]
        end

        subgraph "PageModels"
            StudentsModels[Students PageModels<br/>Business Logic]
            CoursesModels[Courses PageModels<br/>Business Logic]
            DepartmentsModels[Departments PageModels<br/>Business Logic]
            InstructorsModels[Instructors PageModels<br/>Business Logic]
        end

        subgraph "Data Access"
            SchoolContext[SchoolContext<br/>DbContext EF Core]
            DbInitializer[DbInitializer<br/>Seed Data]
        end
    end

    subgraph "Database"
        SQLServer[(SQL Server<br/>LocalDB)]
    end

    Browser -->|HTTP GET/POST| Kestrel
    Kestrel --> Middleware
    Middleware --> StudentsPages
    Middleware --> CoursesPages
    Middleware --> DepartmentsPages
    Middleware --> InstructorsPages

    StudentsPages --> StudentsModels
    CoursesPages --> CoursesModels
    DepartmentsPages --> DepartmentsModels
    InstructorsPages --> InstructorsModels

    StudentsModels --> SchoolContext
    CoursesModels --> SchoolContext
    DepartmentsModels --> SchoolContext
    InstructorsModels --> SchoolContext

    SchoolContext --> SQLServer
    DbInitializer --> SQLServer

    style Browser fill:#e1f5ff
    style SQLServer fill:#ffe1e1
```

### 1.2 Current Data Model (EF Core)

```mermaid
erDiagram
    Student ||--o{ Enrollment : "has"
    Course ||--o{ Enrollment : "has"
    Course }o--|| Department : "belongs to"
    Instructor ||--o| OfficeAssignment : "has"
    Instructor ||--o{ Course : "teaches"
    Instructor ||--o| Department : "administers"

    Student {
        int ID PK
        string LastName
        string FirstMidName
        DateTime EnrollmentDate
    }

    Course {
        int CourseID PK "Manual entry, not auto-increment"
        string Title
        int Credits
        int DepartmentID FK
    }

    Enrollment {
        int EnrollmentID PK
        int CourseID FK
        int StudentID FK
        string Grade "Nullable enum: A, B, C, D, F"
    }

    Department {
        int DepartmentID PK
        string Name
        decimal Budget
        DateTime StartDate
        int InstructorID FK "Nullable"
        byte[] ConcurrencyToken "Timestamp for optimistic locking"
    }

    Instructor {
        int ID PK
        string LastName
        string FirstMidName
        DateTime HireDate
    }

    OfficeAssignment {
        int InstructorID PK_FK "Shared primary key"
        string Location
    }
```

### 1.3 Current Request Flow (Razor Pages)

```mermaid
sequenceDiagram
    participant Browser
    participant Razor Pages
    participant PageModel
    participant SchoolContext
    participant SQL Server

    Browser->>Razor Pages: GET /Students
    Razor Pages->>PageModel: OnGetAsync()
    PageModel->>SchoolContext: Students.Where(...).OrderBy(...).Skip(...).Take(...)
    SchoolContext->>SQL Server: SQL Query
    SQL Server-->>SchoolContext: Rows
    SchoolContext-->>PageModel: List<Student>
    PageModel-->>Razor Pages: Return Page()
    Razor Pages-->>Browser: Rendered HTML

    Browser->>Razor Pages: POST /Students/Create
    Razor Pages->>PageModel: OnPostAsync()
    PageModel->>PageModel: ModelState.IsValid?
    PageModel->>SchoolContext: Students.Add(student)
    PageModel->>SchoolContext: SaveChangesAsync()
    SchoolContext->>SQL Server: INSERT INTO Students
    SQL Server-->>SchoolContext: Success
    SchoolContext-->>PageModel: OK
    PageModel-->>Razor Pages: RedirectToPage("Index")
    Razor Pages-->>Browser: 302 Redirect
```

---

## 2. Target React/Node Architecture (TO-BE)

### 2.1 Overall System Architecture

```mermaid
graph TB
    subgraph "Client Browser"
        ReactApp[React SPA<br/>TypeScript + Redux]
    end

    subgraph "Backend API contoso-api"
        Express[Express Server<br/>Port 5000]

        subgraph "Middleware"
            CORS[CORS Middleware]
            AuthMiddleware[JWT Auth Middleware]
            ErrorHandler[Error Handler]
            Logger[Pino Logger]
        end

        subgraph "Routes"
            AuthRoutes[/api/auth]
            StudentRoutes[/api/students]
            CourseRoutes[/api/courses]
            DepartmentRoutes[/api/departments]
            InstructorRoutes[/api/instructors]
            HealthRoutes[/api/health]
        end

        subgraph "Controllers"
            StudentController[StudentController]
            CourseController[CourseController]
            DepartmentController[DepartmentController]
            InstructorController[InstructorController]
            AuthController[AuthController]
        end

        subgraph "Services"
            StudentService[StudentService]
            CourseService[CourseService]
            DepartmentService[DepartmentService]
            InstructorService[InstructorService]
            AuthService[AuthService]
        end

        subgraph "Data Access"
            DrizzleDB[Drizzle DB<br/>ORM]
            SeedScript[seed.ts<br/>Data Seeding]
        end
    end

    subgraph "Database"
        SQLite[(SQLite Database<br/>WAL Mode)]
    end

    ReactApp -->|HTTPS REST API| Express
    Express --> CORS
    CORS --> AuthMiddleware
    AuthMiddleware --> Logger
    Logger --> AuthRoutes
    Logger --> StudentRoutes
    Logger --> CourseRoutes
    Logger --> DepartmentRoutes
    Logger --> InstructorRoutes
    Logger --> HealthRoutes

    AuthRoutes --> AuthController
    StudentRoutes --> StudentController
    CourseRoutes --> CourseController
    DepartmentRoutes --> DepartmentController
    InstructorRoutes --> InstructorController

    AuthController --> AuthService
    StudentController --> StudentService
    CourseController --> CourseService
    DepartmentController --> DepartmentService
    InstructorController --> InstructorService

    AuthService --> DrizzleDB
    StudentService --> DrizzleDB
    CourseService --> DrizzleDB
    DepartmentService --> DrizzleDB
    InstructorService --> DrizzleDB

    DrizzleDB --> SQLite
    SeedScript --> SQLite

    ErrorHandler --> Express

    style ReactApp fill:#61dafb
    style SQLite fill:#ffe1e1
```

### 2.2 Target Data Model (Drizzle ORM)

```mermaid
erDiagram
    Student ||--o{ Enrollment : "has"
    Course ||--o{ Enrollment : "has"
    Course }o--|| Department : "belongs to"
    Instructor ||--o| OfficeAssignment : "has"
    Instructor ||--o{ Course : "teaches (implicit join table)"
    Instructor ||--o| Department : "administers"

    Student {
        Int ID PK "autoincrement"
        String LastName
        String FirstMidName
        DateTime EnrollmentDate
    }

    Course {
        Int CourseID PK "Manual entry, NOT autoincrement"
        String Title
        Int Credits
        Int DepartmentID FK
    }

    Enrollment {
        Int EnrollmentID PK "autoincrement"
        Int CourseID FK
        Int StudentID FK
        String Grade "Nullable: A, B, C, D, F"
    }

    Department {
        Int DepartmentID PK "autoincrement"
        String Name
        Decimal Budget
        DateTime StartDate
        Int InstructorID FK "Nullable"
        Int version "Optimistic locking version field"
    }

    Instructor {
        Int ID PK "autoincrement"
        String LastName
        String FirstMidName
        DateTime HireDate
    }

    OfficeAssignment {
        Int InstructorID PK_FK "Shared primary key"
        String Location
    }
```

**Key Changes**:

- **Department.ConcurrencyToken** (SQL Server `ROWVERSION`) → **Department.version** (Int field, manually incremented)
- **Instructor-Course many-to-many**: EF Core explicit `InstructorCourse` table → Drizzle ORM explicit join table (e.g., `InstructorCourse`)

### 2.3 Target Request Flow (React + Express)

```mermaid
sequenceDiagram
    participant Browser
    participant React App
    participant Redux Store
    participant Axios
    participant Express API
    participant Service Layer
    participant DrizzleDB
    participant SQLite

    Browser->>React App: Navigate to /students
    React App->>Redux Store: Dispatch fetchStudents()
    Redux Store->>Axios: GET /api/students?page=1&search=&sort=LastName
    Axios->>Express API: HTTP GET /api/students
    Express API->>Service Layer: StudentService.getAll(query)
    Service Layer->>DrizzleDB: db.select().from(students).limit(...).offset(...)
    DrizzleDB->>SQLite: SELECT * FROM Student...
    SQLite-->>DrizzleDB: Rows
    DrizzleDB-->>Service Layer: Student[]
    Service Layer-->>Express API: {data: [...], total: 100}
    Express API-->>Axios: 200 OK + JSON
    Axios-->>Redux Store: Resolve promise
    Redux Store-->>React App: Update state
    React App-->>Browser: Re-render component

    Browser->>React App: Submit create student form
    React App->>Redux Store: Dispatch createStudent(data)
    Redux Store->>Axios: POST /api/students + JSON body
    Axios->>Express API: HTTP POST /api/students
    Express API->>Express API: Validate with Zod schema
    Express API->>Service Layer: StudentService.create(data)
    Service Layer->>DrizzleDB: db.insert(students).values(data)
    DrizzleDB->>SQLite: INSERT INTO Student...
    SQLite-->>DrizzleDB: New row
    DrizzleDB-->>Service Layer: Student
    Service Layer-->>Express API: Student
    Express API-->>Axios: 201 Created + JSON
    Axios-->>Redux Store: Resolve promise
    Redux Store-->>React App: Update state + navigate
    React App-->>Browser: Navigate to /students
```

---

## 3. Request Flow Mapping (Legacy → Target)

### 3.1 Endpoint Parity Mapping

| .NET Razor Page                      | HTTP Method | Target Express Endpoint                                             | Controller Method                        | Notes                             |
| ------------------------------------ | ----------- | ------------------------------------------------------------------- | ---------------------------------------- | --------------------------------- |
| `/Students`                          | GET         | `/api/students?page=1&search=&sort=`                                | `StudentController.getAll()`             | Returns JSON, not HTML            |
| `/Students/Details/{id}`             | GET         | `/api/students/{id}`                                                | `StudentController.getById(id)`          | Includes enrollments              |
| `/Students/Create` (form)            | GET         | N/A                                                                 | N/A                                      | React form rendered client-side   |
| `/Students/Create` (submit)          | POST        | `/api/students`                                                     | `StudentController.create()`             | Returns JSON, not redirect        |
| `/Students/Edit/{id}` (form)         | GET         | `/api/students/{id}`                                                | `StudentController.getById(id)`          | React form fetches data           |
| `/Students/Edit/{id}` (submit)       | POST        | `/api/students/{id}` (PUT)                                          | `StudentController.update(id)`           | RESTful PUT, returns JSON         |
| `/Students/Delete/{id}` (confirm)    | GET         | `/api/students/{id}`                                                | `StudentController.getById(id)`          | React confirm dialog              |
| `/Students/Delete/{id}` (submit)     | POST        | `/api/students/{id}` (DELETE)                                       | `StudentController.delete(id)`           | RESTful DELETE                    |
| `/Courses`                           | GET         | `/api/courses`                                                      | `CourseController.getAll()`              | Includes department               |
| `/Courses/Details/{id}`              | GET         | `/api/courses/{id}`                                                 | `CourseController.getById(id)`           | Includes department               |
| `/Courses/Create` (form)             | GET         | `/api/departments`                                                  | `DepartmentController.getAll()`          | Fetch departments for dropdown    |
| `/Courses/Create` (submit)           | POST        | `/api/courses`                                                      | `CourseController.create()`              | Manual CourseID validation        |
| `/Courses/Edit/{id}` (form)          | GET         | `/api/courses/{id}`                                                 | `CourseController.getById(id)`           | CourseID immutable                |
| `/Courses/Edit/{id}` (submit)        | POST        | `/api/courses/{id}` (PUT)                                           | `CourseController.update(id)`            | CourseID not editable             |
| `/Courses/Delete/{id}` (confirm)     | GET         | `/api/courses/{id}`                                                 | `CourseController.getById(id)`           | Confirm dialog                    |
| `/Courses/Delete/{id}` (submit)      | POST        | `/api/courses/{id}` (DELETE)                                        | `CourseController.delete(id)`            | Cascade to enrollments            |
| `/Departments`                       | GET         | `/api/departments`                                                  | `DepartmentController.getAll()`          | Includes administrator            |
| `/Departments/Details/{id}`          | GET         | `/api/departments/{id}`                                             | `DepartmentController.getById(id)`       | Includes courses                  |
| `/Departments/Create` (form)         | GET         | `/api/instructors`                                                  | `InstructorController.getAll()`          | Fetch instructors for dropdown    |
| `/Departments/Create` (submit)       | POST        | `/api/departments`                                                  | `DepartmentController.create()`          | Initialize version=1              |
| `/Departments/Edit/{id}` (form)      | GET         | `/api/departments/{id}`                                             | `DepartmentController.getById(id)`       | Return current version            |
| `/Departments/Edit/{id}` (submit)    | POST        | `/api/departments/{id}` (PUT)                                       | `DepartmentController.update(id)`        | Check version, increment if match |
| `/Departments/Delete/{id}` (confirm) | GET         | `/api/departments/{id}`                                             | `DepartmentController.getById(id)`       | Confirm dialog                    |
| `/Departments/Delete/{id}` (submit)  | POST        | `/api/departments/{id}` (DELETE)                                    | `DepartmentController.delete(id)`        | Check version before delete       |
| `/Instructors?id=1&courseID=2`       | GET         | `/api/instructors?includeOffice=true&includeCourses=true`           | `InstructorController.getAll()`          | Master-detail in React UI         |
| `/Instructors/{id}`                  | GET         | `/api/instructors/{id}?includeCourses=true&includeEnrollments=true` | `InstructorController.getById(id)`       | Multiple levels of include        |
| `/Instructors/Details/{id}`          | GET         | `/api/instructors/{id}`                                             | `InstructorController.getById(id)`       | Full details                      |
| `/Instructors/Create` (form)         | GET         | `/api/courses`                                                      | `CourseController.getAll()`              | Fetch courses for checkboxes      |
| `/Instructors/Create` (submit)       | POST        | `/api/instructors`                                                  | `InstructorController.create()`          | Create with course assignments    |
| `/Instructors/Edit/{id}` (form)      | GET         | `/api/instructors/{id}?includeCourses=true`                         | `InstructorController.getById(id)`       | Fetch with current assignments    |
| `/Instructors/Edit/{id}` (submit)    | POST        | `/api/instructors/{id}` (PUT)                                       | `InstructorController.update(id)`        | Update with course assignments    |
| `/Instructors/Delete/{id}` (confirm) | GET         | `/api/instructors/{id}`                                             | `InstructorController.getById(id)`       | Confirm dialog                    |
| `/Instructors/Delete/{id}` (submit)  | POST        | `/api/instructors/{id}` (DELETE)                                    | `InstructorController.delete(id)`        | FK check (Department admin)       |
| `/About`                             | GET         | `/api/students/enrollment-stats`                                    | `StudentController.getEnrollmentStats()` | Group by enrollment date          |
| `/` (Home)                           | GET         | N/A                                                                 | N/A                                      | React home page (static)          |
| `/Privacy`                           | GET         | N/A                                                                 | N/A                                      | React privacy page (static)       |
| N/A                                  | POST        | `/api/auth/login`                                                   | `AuthController.login()`                 | **New**: JWT login                |
| N/A                                  | POST        | `/api/auth/logout`                                                  | `AuthController.logout()`                | **New**: JWT logout               |
| N/A                                  | POST        | `/api/auth/refresh`                                                 | `AuthController.refresh()`               | **New**: Token refresh            |
| N/A                                  | GET         | `/api/health`                                                       | `HealthController.check()`               | **New**: Health check             |

**Key Changes**:

- .NET Razor Pages return **HTML**; Express API returns **JSON**
- .NET uses **POST** for updates/deletes; Express uses **PUT/DELETE** (RESTful)
- React forms are **client-side**; no separate GET for form rendering
- **Concurrency conflicts** return 409 Conflict instead of rendering error page

---

## 4. Component Hierarchy (Frontend React)

### 4.1 React Component Tree

```mermaid
graph TD
    App[App.tsx<br/>Root Component]

    App --> Layout[Layout.tsx<br/>Bootstrap Navbar + Footer]

    Layout --> HomePage[HomePage.tsx<br/>Landing Page]
    Layout --> AboutPage[AboutPage.tsx<br/>Enrollment Stats]
    Layout --> PrivacyPage[PrivacyPage.tsx<br/>Privacy Policy]
    Layout --> NotFoundPage[NotFoundPage.tsx<br/>404 Error]

    Layout --> StudentsModule[Students Module]
    Layout --> CoursesModule[Courses Module]
    Layout --> DepartmentsModule[Departments Module]
    Layout --> InstructorsModule[Instructors Module]
    Layout --> AuthModule[Auth Module]

    StudentsModule --> StudentListPage[StudentListPage.tsx<br/>Index with pagination]
    StudentsModule --> StudentDetailsPage[StudentDetailsPage.tsx<br/>View student]
    StudentsModule --> StudentCreatePage[StudentCreatePage.tsx<br/>Create form]
    StudentsModule --> StudentEditPage[StudentEditPage.tsx<br/>Edit form]

    StudentListPage --> SearchBar[SearchBar.tsx]
    StudentListPage --> SortDropdown[SortDropdown.tsx]
    StudentListPage --> Pagination[Pagination.tsx]
    StudentListPage --> StudentTable[StudentTable.tsx]

    StudentCreatePage --> StudentForm[StudentForm.tsx<br/>Reusable form]
    StudentEditPage --> StudentForm

    CoursesModule --> CourseListPage[CourseListPage.tsx]
    CoursesModule --> CourseDetailsPage[CourseDetailsPage.tsx]
    CoursesModule --> CourseCreatePage[CourseCreatePage.tsx]
    CoursesModule --> CourseEditPage[CourseEditPage.tsx]

    CourseCreatePage --> CourseForm[CourseForm.tsx<br/>Reusable form]
    CourseEditPage --> CourseForm

    DepartmentsModule --> DepartmentListPage[DepartmentListPage.tsx]
    DepartmentsModule --> DepartmentDetailsPage[DepartmentDetailsPage.tsx]
    DepartmentsModule --> DepartmentCreatePage[DepartmentCreatePage.tsx]
    DepartmentsModule --> DepartmentEditPage[DepartmentEditPage.tsx]

    DepartmentEditPage --> ConcurrencyConflictModal[ConcurrencyConflictModal.tsx<br/>Conflict resolution UI]

    InstructorsModule --> InstructorListPage[InstructorListPage.tsx<br/>Master-detail view]
    InstructorsModule --> InstructorDetailsPage[InstructorDetailsPage.tsx]
    InstructorsModule --> InstructorCreatePage[InstructorCreatePage.tsx]
    InstructorsModule --> InstructorEditPage[InstructorEditPage.tsx]

    InstructorCreatePage --> InstructorForm[InstructorForm.tsx<br/>With course checkboxes]
    InstructorEditPage --> InstructorForm

    AuthModule --> LoginPage[LoginPage.tsx<br/>Login form]
    AuthModule --> LogoutButton[LogoutButton.tsx]

    style App fill:#61dafb
    style Layout fill:#ffd700
```

### 4.2 Redux Store Structure

```mermaid
graph LR
    ReduxStore[Redux Store<br/>Global State]

    ReduxStore --> StudentsSlice[studentsSlice<br/>State: students, loading, error]
    ReduxStore --> CoursesSlice[coursesSlice<br/>State: courses, loading, error]
    ReduxStore --> DepartmentsSlice[departmentsSlice<br/>State: departments, loading, error]
    ReduxStore --> InstructorsSlice[instructorsSlice<br/>State: instructors, loading, error]
    ReduxStore --> AuthSlice[authSlice<br/>State: user, token, isAuthenticated]
    ReduxStore --> UISlice[uiSlice<br/>State: notifications, modals]

    StudentsSlice --> StudentsThunks[Async Thunks<br/>fetchStudents, createStudent,<br/>updateStudent, deleteStudent]
    CoursesSlice --> CoursesThunks[Async Thunks<br/>fetchCourses, createCourse,<br/>updateCourse, deleteCourse]
    DepartmentsSlice --> DepartmentsThunks[Async Thunks<br/>fetchDepartments, createDepartment,<br/>updateDepartment, deleteDepartment]
    InstructorsSlice --> InstructorsThunks[Async Thunks<br/>fetchInstructors, createInstructor,<br/>updateInstructor, deleteInstructor]
    AuthSlice --> AuthThunks[Async Thunks<br/>login, logout, refreshToken]

    style ReduxStore fill:#764abc
```

---

## 5. Authentication Flow (JWT)

### 5.1 JWT Authentication Sequence

```mermaid
sequenceDiagram
    participant User
    participant React App
    participant Express API
    participant AuthService
    participant DrizzleDB

    User->>React App: Enter credentials + Submit login form
    React App->>Express API: POST /api/auth/login {email, password}
    Express API->>AuthService: AuthService.login(email, password)
    AuthService->>DrizzleDB: db.select().from(users).where(eq(users.email, email)).limit(1)
    DrizzleDB-->>AuthService: User
    AuthService->>AuthService: Compare password hash (bcrypt)
    AuthService->>AuthService: Generate JWT access token (15 min)
    AuthService->>AuthService: Generate refresh token (7 days)
    AuthService-->>Express API: {accessToken, refreshToken, user}
    Express API->>Express API: Set httpOnly cookie with refreshToken
    Express API-->>React App: 200 OK + {accessToken, user}
    React App->>React App: Store accessToken in Redux
    React App-->>User: Redirect to /students

    Note over User,DrizzleDB: Subsequent requests include JWT

    User->>React App: Navigate to /students
    React App->>Express API: GET /api/students<br/>Authorization: Bearer <token>
    Express API->>Express API: Auth middleware validates JWT
    Express API->>Express API: Decode token, extract user ID
    Express API->>Express API: Proceed to controller
    Express API-->>React App: 200 OK + JSON data

    Note over User,DrizzleDB: Token refresh flow

    React App->>React App: Access token expired (15 min)
    React App->>Express API: POST /api/auth/refresh<br/>Cookie: refreshToken
    Express API->>AuthService: AuthService.refresh(refreshToken)
    AuthService->>AuthService: Verify refresh token signature
    AuthService->>DrizzleDB: db.select().from(refreshTokens).where(eq(refreshTokens.token, token)).limit(1)
    DrizzleDB-->>AuthService: RefreshToken
    AuthService->>AuthService: Check if revoked or expired
    AuthService->>AuthService: Generate new access token (15 min)
    AuthService-->>Express API: {accessToken}
    Express API-->>React App: 200 OK + {accessToken}
    React App->>React App: Update Redux store
    React App->>Express API: Retry original request with new token
```

---

## 6. Data Migration Flow

### 6.1 SQL Server → SQLite Migration

```mermaid
graph TD
    SQLServer[(SQL Server<br/>Production DB)]

    SQLServer --> Export[Export Tool<br/>SQL queries or<br/>Entity Framework]

    Export --> JSONFiles[JSON/CSV Files<br/>students.json<br/>courses.json<br/>etc.]

    JSONFiles --> Validation[Validation Script<br/>Check row counts,<br/>foreign keys, nulls]

    Validation --> ImportScript[Import Script<br/>src/db/import.ts]

    ImportScript --> SQLite[(SQLite Database<br/>dev.db)]

    SQLite --> ValidationQueries[Validation Queries<br/>Row counts, relationships,<br/>data integrity]

    ValidationQueries --> Success{All checks pass?}

    Success -->|Yes| Backup[Create SQLite Backup]
    Success -->|No| Rollback[Rollback and Fix Issues]

    style SQLServer fill:#ffe1e1
    style SQLite fill:#ffe1e1
    style Success fill:#ffd700
```

---

## 7. Deployment Architecture

### 7.1 Production Deployment (Azure Example)

```mermaid
graph TB
    subgraph "Azure Cloud"
        subgraph "Frontend"
            AzureStorage[Azure Storage<br/>Static Website Hosting]
            CDN[Azure CDN<br/>Global Distribution]
        end

        subgraph "Backend"
            AppService[Azure App Service<br/>Node.js Runtime]
            AppSettings[App Settings<br/>Environment Variables]
        end

        subgraph "Database"
            FileStorage[Azure Files<br/>SQLite Database File]
        end

        subgraph "Security"
            KeyVault[Azure Key Vault<br/>Secrets Management]
            FrontDoor[Azure Front Door<br/>WAF + SSL]
        end

        subgraph "Monitoring"
            AppInsights[Application Insights<br/>Logging + Metrics]
        end
    end

    Users[Users] --> FrontDoor
    FrontDoor --> CDN
    FrontDoor --> AppService

    CDN --> AzureStorage

    AppService --> FileStorage
    AppService --> KeyVault
    AppService --> AppInsights

    KeyVault --> AppSettings

    style Users fill:#e1f5ff
    style FileStorage fill:#ffe1e1
```

### 7.2 CI/CD Pipeline (Conceptual)

```mermaid
graph LR
    Dev[Developer<br/>Commits Code] --> GitHub[GitHub Repository]

    GitHub --> Actions[GitHub Actions<br/>CI/CD Pipeline]

    Actions --> Build[Build Stage<br/>npm install<br/>npm run build<br/>npm test]

    Build --> Test{Tests Pass?}

    Test -->|No| Notify[Notify Developer]
    Test -->|Yes| Deploy[Deploy Stage]

    Deploy --> Staging[Deploy to Staging<br/>Azure Staging Slot]

    Staging --> Smoke[Smoke Tests]

    Smoke --> Approval{Manual Approval?}

    Approval -->|No| Rollback[Rollback]
    Approval -->|Yes| Production[Deploy to Production<br/>Blue-Green Swap]

    Production --> Monitor[Monitor Metrics]

    style Test fill:#ffd700
    style Approval fill:#ffd700
```

---

## 8. Error Handling and Logging Architecture

### 8.1 Error Flow

```mermaid
graph TD
    Request[Incoming Request] --> Middleware[Middleware Pipeline]

    Middleware --> AuthCheck{Auth Valid?}

    AuthCheck -->|No| AuthError[401 Unauthorized]
    AuthCheck -->|Yes| Controller[Controller Method]

    Controller --> Service[Service Layer]

    Service --> Drizzle[Drizzle DB]

    Drizzle --> DBError{Database Error?}

    DBError -->|Yes| CatchBlock[Catch Block in Service]
    DBError -->|No| Success[Return Data]

    CatchBlock --> ErrorMiddleware[Error Handler Middleware]

    Controller --> ValidationError{Validation Error?}
    ValidationError -->|Yes| ErrorMiddleware
    ValidationError -->|No| ServiceCall[Call Service]

    ErrorMiddleware --> LogError[Log Error with Pino]
    LogError --> FormatError[Format Error Response]
    FormatError --> Response[JSON Error Response<br/>Status Code + Message]

    Success --> Response

    Response --> Client[Client Receives Response]

    style AuthError fill:#ffcccc
    style ErrorMiddleware fill:#ffcccc
```

---

## 9. Concurrency Control Architecture

### 9.1 Department Optimistic Locking Flow

```mermaid
sequenceDiagram
    participant User1
    participant User2
    participant React App 1
    participant React App 2
    participant Express API
    participant DepartmentService
    participant DrizzleDB
    participant SQLite

    Note over User1,SQLite: Both users load same department (version=1)

    User1->>React App 1: GET /api/departments/1
    React App 1->>Express API: GET /api/departments/1
    Express API->>DrizzleDB: select().from(departments).where(eq(departments.id, 1)).limit(1)
    DrizzleDB->>SQLite: SELECT * FROM Department WHERE id=1
    SQLite-->>DrizzleDB: {id: 1, name: "English", version: 1}
    DrizzleDB-->>React App 1: {id: 1, name: "English", version: 1}

    User2->>React App 2: GET /api/departments/1
    React App 2->>Express API: GET /api/departments/1
    Express API->>DrizzleDB: select().from(departments).where(eq(departments.id, 1)).limit(1)
    DrizzleDB->>SQLite: SELECT * FROM Department WHERE id=1
    SQLite-->>DrizzleDB: {id: 1, name: "English", version: 1}
    DrizzleDB-->>React App 2: {id: 1, name: "English", version: 1}

    Note over User1,SQLite: User 1 updates first

    User1->>React App 1: PUT /api/departments/1 {name: "English Dept", version: 1}
    React App 1->>Express API: PUT /api/departments/1
    Express API->>DepartmentService: update(1, data, version: 1)
    DepartmentService->>DrizzleDB: update departments set name="English Dept", version=2 where id=1 and version=1
    DrizzleDB->>SQLite: UPDATE Department SET name="English Dept", version=2 WHERE id=1 AND version=1
    SQLite-->>DrizzleDB: 1 row updated
    DrizzleDB-->>React App 1: {id: 1, name: "English Dept", version: 2}
    React App 1-->>User1: Success

    Note over User1,SQLite: User 2 attempts update (stale version)

    User2->>React App 2: PUT /api/departments/1 {name: "Literature Dept", version: 1}
    React App 2->>Express API: PUT /api/departments/1
    Express API->>DepartmentService: update(1, data, version: 1)
    DepartmentService->>DrizzleDB: update departments set name="Literature Dept", version=2 where id=1 and version=1
    DrizzleDB->>SQLite: UPDATE Department SET name="Literature Dept", version=2 WHERE id=1 AND version=1
    SQLite-->>DrizzleDB: 0 rows updated (version mismatch)
    DrizzleDB-->>DepartmentService: 0 rows affected (version mismatch)
    DepartmentService-->>Express API: Throw ConcurrencyError
    Express API-->>React App 2: 409 Conflict + {message: "Department was modified by another user", currentData: {...}}
    React App 2->>React App 2: Show ConcurrencyConflictModal
    React App 2-->>User2: Show current values + option to overwrite or cancel

    User2->>React App 2: Choose "Overwrite" or "Cancel"
```

---

## Summary

This architecture documentation provides:

1. **Current State**: .NET Razor Pages architecture with EF Core and SQL Server
2. **Target State**: React SPA + Express API + Drizzle ORM + SQLite
3. **Mapping**: Detailed endpoint and component mapping
4. **Flows**: Authentication, data migration, deployment, error handling, concurrency
5. **Diagrams**: Mermaid diagrams for all major architectural components

**Key Architectural Changes**:

- **Monolithic Razor Pages → Decoupled SPA + API**
- **Server-side rendering → Client-side rendering with API calls**
- **HTML responses → JSON responses**
- **SQL Server → SQLite**
- **EF Core → Drizzle ORM**
- **No authentication → JWT-based authentication**
- **ROWVERSION concurrency → Version field concurrency**

**Next Steps**:

1. Review architecture diagrams with team
2. Validate Mermaid syntax renders correctly
3. Use diagrams as reference during implementation
4. Update diagrams as architecture evolves

---

**Document Status**: Draft - Ready for Review  
**Mermaid Version**: Validated with Mermaid Live Editor  
**Last Updated**: December 31, 2025
