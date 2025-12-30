# Architecture Overview - Contoso University

**Document Version:** 1.0  
**Date:** 2025-12-22  
**Author:** Senior Systems Engineer  

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [C4 Level 1: System Context](#c4-level-1-system-context)
- [C4 Level 2: Container View](#c4-level-2-container-view)
- [Data Architecture](#data-architecture)
- [Deployment Topology](#deployment-topology)
- [Transaction Boundaries & Consistency](#transaction-boundaries--consistency)
- [Error Handling Strategy](#error-handling-strategy)
- [Technology Stack](#technology-stack)
- [Diagrams & References](#diagrams--references)

---

## Executive Summary

Contoso University is a **monolithic ASP.NET Core 6.0 web application** implementing a university management system. The application follows a traditional three-tier architecture pattern with presentation (Razor Pages), business logic (page models), and data access (Entity Framework Core) layers tightly integrated within a single deployable unit.

**Architecture Pattern:** Monolith  
**Application Type:** Server-rendered web application  
**Data Consistency Model:** Strong consistency (ACID transactions via SQL Server)  
**Deployment Model:** Single-process IIS or Kestrel web server

---

## C4 Level 1: System Context

### System Context Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         System Context                               │
│                                                                       │
│                                                                       │
│  ┌──────────────┐                                 ┌────────────────┐ │
│  │              │      HTTPS/Browser              │                │ │
│  │  End Users   │────────────────────────────────▶│   Contoso      │ │
│  │  (Faculty,   │                                 │   University   │ │
│  │  Students,   │◀────────────────────────────────│   Web App      │ │
│  │  Admin)      │      HTML/CSS/JS                │                │ │
│  │              │                                 │                │ │
│  └──────────────┘                                 └────────┬───────┘ │
│                                                             │         │
│                                                             │ SQL/TDS │
│                                                             │         │
│                                                    ┌────────▼───────┐ │
│                                                    │                │ │
│                                                    │  SQL Server    │ │
│                                                    │  LocalDB       │ │
│                                                    │  (SchoolContext│ │
│                                                    │   Database)    │ │
│                                                    │                │ │
│                                                    └────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### External Actors

| Actor | Type | Description | Interface |
|-------|------|-------------|-----------|
| **End Users** | Human | Faculty, students, administrators accessing the system via web browser | HTTPS (Web UI) |
| **SQL Server** | External System | Relational database storing all application data | TDS Protocol (TCP/IP) |

### System Boundaries

**Contoso University System** is a single monolithic web application that:
- Manages student enrollment records
- Tracks course offerings and department information
- Maintains instructor assignments and office locations
- Provides CRUD operations for all entities
- Implements pagination, sorting, and search functionality

**No external integrations** with authentication providers, payment systems, or third-party APIs are currently implemented.

---

## C4 Level 2: Container View

### Container Diagram (ASCII)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Contoso University Application Container                   │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                        Web Application Container                        │  │
│  │                    (ASP.NET Core 6.0 / Kestrel)                         │  │
│  │                                                                          │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Presentation Layer (Razor Pages)                                │  │  │
│  │  │  ─────────────────────────────────────────                        │  │  │
│  │  │  • /Pages/Students/   - Student management UI                    │  │  │
│  │  │  • /Pages/Courses/    - Course management UI                     │  │  │
│  │  │  • /Pages/Instructors/- Instructor management UI                 │  │  │
│  │  │  • /Pages/Departments/- Department management UI                 │  │  │
│  │  │  • /Pages/About       - Student statistics                       │  │  │
│  │  │  • /wwwroot/          - Static assets (CSS, JS, images)          │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                  │                                       │  │
│  │                                  ▼                                       │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Application Layer (Page Models)                                 │  │  │
│  │  │  ────────────────────────────────                                │  │  │
│  │  │  • IndexModel, CreateModel, EditModel, DeleteModel, DetailsModel│  │  │
│  │  │  • Validation logic (ModelState)                                 │  │  │
│  │  │  • Query orchestration (sorting, filtering, pagination)          │  │  │
│  │  │  • Concurrency conflict resolution (optimistic locking)          │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                  │                                       │  │
│  │                                  ▼                                       │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Data Access Layer (Entity Framework Core)                       │  │  │
│  │  │  ──────────────────────────────────────────                      │  │  │
│  │  │  • SchoolContext (DbContext)                                     │  │  │
│  │  │  • DbSet<Student>, DbSet<Course>, DbSet<Enrollment>              │  │  │
│  │  │  • DbSet<Instructor>, DbSet<Department>, DbSet<OfficeAssignment> │  │  │
│  │  │  • DbInitializer (seed data)                                     │  │  │
│  │  │  • EF Core Migrations                                            │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                  │                                       │  │
│  └──────────────────────────────────┼───────────────────────────────────────┘  │
│                                     │ SQL Queries/Commands                    │
│                                     │ (ADO.NET / TDS Protocol)                │
└─────────────────────────────────────┼───────────────────────────────────────────┘
                                      ▼
                         ┌────────────────────────────┐
                         │   SQL Server LocalDB       │
                         │   ─────────────────────    │
                         │   Database: SchoolContext  │
                         │                            │
                         │   Tables:                  │
                         │   • Student                │
                         │   • Course                 │
                         │   • Enrollment             │
                         │   • Instructor             │
                         │   • Department             │
                         │   • OfficeAssignment       │
                         │   • CourseInstructor       │
                         │     (many-to-many join)    │
                         └────────────────────────────┘
```

### Container Inventory

| Container | Technology | Purpose | Deployment |
|-----------|-----------|---------|------------|
| **Web Application** | ASP.NET Core 6.0, Razor Pages, EF Core 6.0.2 | Monolithic web application serving all business logic and UI | Single process (IIS/Kestrel) |
| **SQL Server Database** | SQL Server LocalDB (dev), SQL Server (prod) | Persistent data storage | Separate database server process |

### Key Components Within Web Application Container

#### 1. Presentation Layer Components
- **Razor Pages (.cshtml):** Server-rendered HTML with Razor syntax
- **Page Models (.cshtml.cs):** Code-behind classes inheriting from `PageModel`
- **Static Files:** CSS, JavaScript, images served from `/wwwroot`

#### 2. Business Logic Components
- **Student Management:** CRUD operations, search, sorting, pagination
- **Course Management:** Course-instructor many-to-many relationships
- **Instructor Management:** Office assignments, course assignments
- **Department Management:** Optimistic concurrency control with `ConcurrencyToken`
- **Enrollment Tracking:** Student-course relationships with grades

#### 3. Data Access Components
- **SchoolContext:** Single `DbContext` managing all entities
- **Entity Models:** Student, Course, Enrollment, Instructor, Department, OfficeAssignment
- **DbInitializer:** Seed data generator for development/testing
- **Migrations:** EF Core database schema versioning

#### 4. Cross-Cutting Concerns
- **Configuration:** appsettings.json, environment-specific settings
- **Logging:** ASP.NET Core built-in logging (console, debug)
- **Error Handling:** 
  - Development: Developer exception page
  - Production: Generic error page (`/Error`)
- **Validation:** Data annotations, ModelState validation

---

## Data Architecture

### Data Model Overview

The application implements a **relational data model** with the following entities:

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Student    │         │  Enrollment  │         │   Course    │
│─────────────│         │──────────────│         │─────────────│
│ ID (PK)     │────────▶│ EnrollmentID │◀────────│ CourseID(PK)│
│ LastName    │  1:N    │ StudentID(FK)│  N:1    │ Title       │
│ FirstMidName│         │ CourseID(FK) │         │ Credits     │
│EnrollmentDt │         │ Grade        │         │DepartmentID │
└─────────────┘         └──────────────┘         └──────┬──────┘
                                                         │ N:1
                                                         ▼
                        ┌──────────────┐         ┌──────────────┐
                        │ Instructor   │         │ Department   │
                        │──────────────│         │──────────────│
                        │ ID (PK)      │────────▶│ DepartmentID │
                        │ LastName     │  0:N    │ Name         │
                        │ FirstMidName │         │ Budget       │
                        │ HireDate     │         │ StartDate    │
                        └──────┬───────┘         │ InstructorID │
                               │                 │ConcurrencyTkn│
                               │ 1:1             └──────────────┘
                               ▼
                        ┌──────────────┐
                        │OfficeAssgmt  │
                        │──────────────│
                        │ InstructorID │
                        │ Location     │
                        └──────────────┘

        ┌──────────────────────────────────┐
        │  CourseInstructor (Many-to-Many) │
        │──────────────────────────────────│
        │  CoursesCourseID                 │
        │  InstructorsID                   │
        └──────────────────────────────────┘
```

### Entity Relationships

| Relationship | Type | Description | Cascade Behavior |
|--------------|------|-------------|------------------|
| Student → Enrollment | 1:N | A student can have multiple enrollments | Not specified (default) |
| Course → Enrollment | 1:N | A course can have multiple enrollments | Not specified (default) |
| Department → Course | 1:N | A department offers multiple courses | Not specified (default) |
| Instructor → OfficeAssignment | 1:1 | An instructor may have one office | Not specified (default) |
| Course ↔ Instructor | M:N | Courses taught by multiple instructors | Configured via Fluent API |
| Department → Instructor | N:1 | Department has one administrator | Not specified (default) |

### Data Storage Details

**Database:** `SchoolContext-a8778b0f-1bfd-4d0f-a500-09390a0df97f`  
**Connection String:** Uses SQL Server LocalDB with Trusted Connection  
**Schema Management:** EF Core Migrations (automatic migration on startup)  
**Seed Data:** `DbInitializer.Initialize()` runs on application startup  

---

## Deployment Topology

### Current Environment

```
┌───────────────────────────────────────────────────────┐
│              Development Environment                  │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │   Developer Workstation                     │    │
│  │                                              │    │
│  │   ┌──────────────────────────────────┐      │    │
│  │   │  Kestrel Web Server              │      │    │
│  │   │  (localhost:5000/5001)           │      │    │
│  │   │  ───────────────────────          │      │    │
│  │   │  • ASP.NET Core 6.0 Runtime      │      │    │
│  │   │  • ContosoUniversity.dll         │      │    │
│  │   │  • appsettings.Development.json  │      │    │
│  │   └─────────────┬────────────────────┘      │    │
│  │                 │ Local connection          │    │
│  │                 ▼                            │    │
│  │   ┌──────────────────────────────────┐      │    │
│  │   │  SQL Server LocalDB              │      │    │
│  │   │  (localdb)\mssqllocaldb          │      │    │
│  │   │  ───────────────────────          │      │    │
│  │   │  • Runs in user context          │      │    │
│  │   │  • Auto-start on first access    │      │    │
│  │   │  • .mdf file in user directory   │      │    │
│  │   └──────────────────────────────────┘      │    │
│  └─────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

### Production Topology (Typical)

**Note:** No production deployment artifacts found in repository. Below is typical deployment pattern for ASP.NET Core applications.

```
┌────────────────────────────────────────────────────────────┐
│                 Production Environment                     │
│                                                            │
│  ┌────────────────────┐         ┌────────────────────┐    │
│  │  Load Balancer     │         │   Web Server(s)    │    │
│  │  (Optional)        │────────▶│   ─────────────    │    │
│  │  ─────────────     │         │   • IIS/Kestrel    │    │
│  │  • TLS Termination │         │   • App Pool       │    │
│  │  • Health checks   │         │   • .NET 6 Runtime │    │
│  └────────────────────┘         └─────────┬──────────┘    │
│                                            │               │
│                                            │ TCP/IP        │
│                                            ▼               │
│                              ┌─────────────────────────┐   │
│                              │  SQL Server Instance    │   │
│                              │  ──────────────────     │   │
│                              │  • HA Configuration     │   │
│                              │  • Backup/Recovery      │   │
│                              │  • Connection Pooling   │   │
│                              └─────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Deployment Artifacts

**Build Output:**
- `ContosoUniversity.dll` (main assembly)
- `appsettings.json` (configuration)
- `appsettings.Production.json` (production overrides - not present)
- `/wwwroot/` (static content)
- Dependencies (EF Core, ASP.NET Core libraries)

**Infrastructure as Code:**
- ❌ No Docker Compose files found
- ❌ No Kubernetes manifests found
- ❌ No Terraform/ARM templates found
- ❌ No Helm charts found

**Configuration Management:**
- Environment variables (not documented)
- `appsettings.{Environment}.json` files
- Connection strings in configuration

---

## Transaction Boundaries & Consistency

### Consistency Model

**Strong Consistency (ACID)**  
All operations use SQL Server ACID transactions through Entity Framework Core.

### Transaction Scope

Each HTTP request operates within an **implicit transaction boundary**:

```
HTTP Request → Page Handler Method → DbContext Operations → SaveChangesAsync() → Transaction Commit
```

**Key Transaction Patterns:**

#### 1. Standard CRUD Operations
```csharp
// Single entity transaction
public async Task<IActionResult> OnPostAsync()
{
    _context.Students.Add(Student);
    await _context.SaveChangesAsync();  // Single transaction
    return RedirectToPage("./Index");
}
```

**Transaction Boundary:** Single `SaveChangesAsync()` call  
**Consistency:** Strong (ACID)  
**Isolation Level:** Default (Read Committed)

#### 2. Optimistic Concurrency Control (Department Edits)
```csharp
// Concurrency token checked during update
_context.Entry(departmentToUpdate)
    .Property(d => d.ConcurrencyToken)
    .OriginalValue = Department.ConcurrencyToken;
await _context.SaveChangesAsync();  // Throws DbUpdateConcurrencyException if modified
```

**Transaction Boundary:** Single `SaveChangesAsync()` with concurrency check  
**Consistency:** Strong with optimistic locking  
**Conflict Resolution:** User intervention required (UI feedback)

#### 3. Seed Data Initialization
```csharp
// Multiple entities inserted in single transaction
context.AddRange(officeAssignments);
context.AddRange(enrollments);
context.SaveChanges();  // Atomic insert of all seed data
```

**Transaction Boundary:** Single `SaveChanges()` call  
**Consistency:** Strong (all-or-nothing)

### Error Recovery

**Database-Level:**
- Automatic rollback on exception
- No explicit transaction management required
- EF Core handles transaction lifecycle

**Application-Level:**
- ModelState validation prevents invalid data submission
- Exception handling redirects to error page
- Development environment shows detailed exception page

### No Distributed Transactions

- **Single database** = No distributed transaction coordinator needed
- **No message queues** = No compensation logic required
- **No sagas** = Simple transaction model sufficient

---

## Error Handling Strategy

### Exception Handling Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    Exception Handling Flow                      │
└─────────────────────────────────────────────────────────────────┘

    User Request
         │
         ▼
    ┌─────────────────────────┐
    │  ASP.NET Core Pipeline  │
    └────────┬────────────────┘
             │
             ▼
    ┌─────────────────────────┐      ┌──────────────────────┐
    │  Page Handler Execution │─────▶│  Exception Thrown?   │
    └─────────────────────────┘      └──────┬───────────────┘
                                             │
                                             ▼
                                ┌────────────────────────────┐
                                │   Development Environment? │
                                └────┬──────────────┬────────┘
                                     │ Yes          │ No
                                     ▼              ▼
                        ┌───────────────────┐  ┌──────────────┐
                        │ Developer         │  │ Generic      │
                        │ Exception Page    │  │ Error Page   │
                        │ (Full stack trace)│  │ (/Error)     │
                        └───────────────────┘  └──────────────┘
```

### Error Handling Configuration

**Program.cs Configuration:**
```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}
else
{
    app.UseDeveloperExceptionPage();
    app.UseMigrationsEndPoint();  // EF Core migration errors
}
```

### Error Categories & Handling

| Error Type | Handling Strategy | User Experience | Recovery |
|------------|------------------|-----------------|----------|
| **Validation Errors** | ModelState.AddModelError() | Inline field errors | User corrects input |
| **Concurrency Conflicts** | Catch DbUpdateConcurrencyException | Show current vs. submitted values | User re-submits or cancels |
| **Database Connection** | Default exception handler | Generic error page (prod) | Retry request |
| **Not Found (404)** | Return NotFound() | HTTP 404 response | User navigation |
| **Unhandled Exceptions** | Global exception middleware | Error page with Request ID | Contact support |

### Specific Error Handling: Concurrency Conflicts

Department edits implement **detailed concurrency conflict resolution**:

```csharp
catch (DbUpdateConcurrencyException ex)
{
    var exceptionEntry = ex.Entries.Single();
    var databaseEntry = exceptionEntry.GetDatabaseValues();
    
    if (databaseEntry == null)
    {
        ModelState.AddModelError(string.Empty, 
            "Unable to save. The department was deleted by another user.");
    }
    else
    {
        var dbValues = (Department)databaseEntry.ToObject();
        // Display field-by-field comparison
        // User decides whether to overwrite
    }
}
```

**Recovery Action:** User reviews conflicts and re-submits

### Logging

**Current Logging:**
- ASP.NET Core default logging to console/debug output
- Log levels configured in appsettings.json
- No structured logging or external logging service

**Configuration:**
```json
"Logging": {
  "LogLevel": {
    "Default": "Information",
    "Microsoft.AspNetCore": "Warning"
  }
}
```

---

## Technology Stack

### Application Platform
| Component | Version | Purpose |
|-----------|---------|---------|
| **.NET** | 6.0 | Runtime platform |
| **ASP.NET Core** | 6.0 | Web framework |
| **C#** | 10.0 | Programming language |
| **Razor Pages** | 6.0 | UI framework |

### Data Access
| Component | Version | Purpose |
|-----------|---------|---------|
| **Entity Framework Core** | 6.0.2 | ORM and data access |
| **EF Core SQL Server Provider** | 6.0.2 | Database driver |
| **EF Core Tools** | 6.0.2 | Migrations and scaffolding |
| **SQL Server LocalDB** | 2019 | Development database |

### Development Tools
| Component | Version | Purpose |
|-----------|---------|---------|
| **Visual Studio Code Generation** | 6.0.2 | Scaffolding tool |
| **EF Core Diagnostics** | 6.0.2 | Database error page |

### Frontend
| Component | Purpose |
|-----------|---------|
| **HTML5** | Markup |
| **CSS3** | Styling (Bootstrap assumed but not verified) |
| **JavaScript** | Client-side interactivity (minimal) |

### Build & Deployment
| Component | Purpose |
|-----------|---------|
| **MSBuild** | Build system |
| **.NET CLI** | Command-line tooling |
| **NuGet** | Package management |

---

## Diagrams & References

### Diagram Locations

**Current Status:**
- ❌ No architecture diagrams found in repository
- ❌ No sequence diagrams found
- ❌ No ER diagrams found

**Recommended Diagram Creation:**

Create the following diagrams in `/migration-docs/diagrams/`:

1. **Context Diagram** (`context-diagram.png`)
   - System actors and boundaries
   - External dependencies

2. **Container Diagram** (`container-diagram.png`)
   - Detailed C4 Level 2 view
   - Technology choices annotated

3. **Entity Relationship Diagram** (`er-diagram.png`)
   - Database schema with relationships
   - Cardinality and constraints

4. **Deployment Diagram** (`deployment-diagram.png`)
   - Server topology
   - Network zones and protocols

5. **Sequence Diagrams** (`sequence-*.png`)
   - Student enrollment flow
   - Department edit with concurrency handling
   - Instructor course assignment

### Related Documentation

| Document | Purpose | Status |
|----------|---------|--------|
| `README.md` | Project overview | ✅ Exists (minimal) |
| `02-Data-Model.md` | Detailed data model documentation | 📝 To be created |
| `03-API-Inventory.md` | Endpoint catalog | 📝 To be created |
| `04-Dependencies.md` | Dependency analysis | 📝 To be created |
| `05-Security-Review.md` | Security posture | 📝 To be created |

### External References

- [ASP.NET Core 6.0 Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core 6.0 Documentation](https://docs.microsoft.com/en-us/ef/core/)
- [C4 Model for Software Architecture](https://c4model.com/)
- [Razor Pages Tutorial (Microsoft)](https://docs.microsoft.com/en-us/aspnet/core/tutorials/razor-pages/)

---

## Key Findings & Recommendations

### Strengths
✅ Simple, understandable architecture  
✅ Strong consistency model appropriate for educational domain  
✅ Proper use of EF Core migrations for schema versioning  
✅ Optimistic concurrency control on critical entities (Department)  

### Architectural Concerns
⚠️ **No authentication/authorization** - All data publicly accessible  
⚠️ **No API layer** - Tight coupling to Razor Pages UI  
⚠️ **No caching strategy** - All requests hit database  
⚠️ **No horizontal scalability** - Session state would break in multi-instance deployment  
⚠️ **No observability** - Minimal logging, no metrics, no distributed tracing  

### Migration Considerations
🔄 **Cloud Migration:** Application is cloud-ready but would benefit from:
   - Externalized configuration (Azure App Configuration, AWS Systems Manager)
   - Managed database (Azure SQL Database, AWS RDS)
   - Application Insights / CloudWatch integration
   - Identity provider integration (Azure AD, AWS Cognito)

🔄 **Microservices Potential:** Could be decomposed into:
   - Student Service
   - Course/Department Service  
   - Enrollment Service
   - Instructor Service
   - **However, complexity may not justify decomposition for this domain**

---

**Document Status:** ✅ Complete  
**Next Steps:** Proceed to Data Model documentation (02-Data-Model.md)
