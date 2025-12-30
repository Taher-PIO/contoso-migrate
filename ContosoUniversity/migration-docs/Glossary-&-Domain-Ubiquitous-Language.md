---
title: 'Glossary & Domain Ubiquitous Language - ContosoUniversity'
last_updated: '2025-12-30'
owner: 'Migration Architect'
status: 'Complete'
purpose: 'Domain terminology, acronyms, and ubiquitous language for consistent communication'
---

# Glossary & Domain Ubiquitous Language

## Purpose

This glossary provides a comprehensive catalog of domain terms, technical acronyms, and ubiquitous language used across the ContosoUniversity application and migration project. It serves as the single source of truth for terminology to ensure consistent communication across all stakeholders.

**Document Scope:**
- Domain entities and business concepts
- Technical architecture patterns and components
- Development and deployment terminology
- Compliance and data protection terms
- Migration-specific vocabulary

---

## Table of Contents

- [Domain Entities & Business Terms](#domain-entities--business-terms)
- [Technical Architecture Terms](#technical-architecture-terms)
- [Data & Database Terms](#data--database-terms)
- [Development & Build Terms](#development--build-terms)
- [Security & Compliance Terms](#security--compliance-terms)
- [Migration-Specific Terms](#migration-specific-terms)
- [Acronyms & Abbreviations](#acronyms--abbreviations)

---

## Domain Entities & Business Terms

### Administrator
**Definition:** An instructor designated as the leader of a department, responsible for departmental oversight and budget management.  
**Context:** Department bounded context  
**Related Entities:** Department, Instructor  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#department), Department.InstructorID field

### Course
**Definition:** An academic course offering with a unique course number, title, and credit value, associated with a specific department and taught by one or more instructors.  
**Context:** Academic catalog bounded context  
**Attributes:** CourseID (manually assigned), Title, Credits (0-5)  
**Relationships:** Belongs to Department, has many Enrollments, taught by many Instructors  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#course), Models/Course.cs

### Credits
**Definition:** The academic credit value assigned to a course, representing the amount of instructional time and effort required, constrained to a range of 0 to 5 credits.  
**Context:** Academic catalog bounded context  
**Business Rule:** Must be between 0 and 5 (inclusive)  
**Source:** Models/Course.cs, Range(0, 5) validation

### Department
**Definition:** An academic organizational unit within the university that manages courses, faculty, and budget resources.  
**Context:** Organizational bounded context  
**Key Attributes:** Name, Budget, StartDate, Administrator (optional Instructor reference)  
**Concurrency Control:** Uses optimistic locking via ConcurrencyToken  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#department), Models/Department.cs

### Enrollment
**Definition:** The registration of a student in a specific course, tracking the relationship between student and course with an optional grade assignment.  
**Context:** Student records bounded context  
**Lifecycle:** Created during registration, updated when grades are assigned  
**Attributes:** StudentID, CourseID, Grade (nullable)  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#enrollment), Models/Enrollment.cs

### Enrollment Date
**Definition:** The date when a student officially enrolled in the university system (not individual course enrollment dates).  
**Context:** Student records bounded context  
**Format:** Date-only field (yyyy-MM-dd), no timezone information  
**Source:** Models/Student.cs, EnrollmentDate property

### Faculty
**Synonym for:** Instructor  
**Definition:** Academic staff members who teach courses at the university.  
**Note:** The codebase uses "Instructor" as the canonical term  
**Source:** Common usage in documentation

### Grade
**Definition:** An academic performance indicator assigned to a student's enrollment in a course, represented as a letter grade (A, B, C, D, F) or null for pending/incomplete.  
**Context:** Student records bounded context  
**Enumeration Values:** A=0, B=1, C=2, D=3, F=4  
**Display:** Letter grades (A-F) or "No grade" when null  
**PII Classification:** FERPA protected  
**Source:** Models/Enrollment.cs, Grade enum

### Instructor
**Definition:** A faculty member who teaches courses, may have an office assignment, and can serve as a department administrator.  
**Context:** Faculty management bounded context  
**Attributes:** LastName, FirstMidName (stored as FirstName), HireDate, optional OfficeAssignment  
**Relationships:** Has one optional OfficeAssignment, teaches many Courses, may administer one Department  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#instructor), Models/Instructor.cs

### Office Assignment
**Definition:** The physical office location assigned to an instructor within the university facilities.  
**Context:** Facilities management bounded context  
**Relationship:** 1:1 with Instructor (optional, not all instructors have offices)  
**Attributes:** InstructorID (PK/FK), Location  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#officeassignment), Models/OfficeAssignment.cs

### Student
**Definition:** An individual enrolled in the university who can register for courses and receive grades.  
**Context:** Student records bounded context  
**Attributes:** LastName, FirstMidName, EnrollmentDate, computed FullName property  
**Relationships:** Has many Enrollments  
**PII Classification:** FERPA protected (all fields)  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#student), Models/Student.cs

### Student Statistics
**Definition:** Aggregated enrollment data grouped by enrollment date, showing the number of students enrolled on each date.  
**Context:** Reporting bounded context  
**Usage:** Displayed on About page  
**Source:** Pages/About.cshtml.cs, EnrollmentDateGroup view model

---

## Technical Architecture Terms

### ASP.NET Core Identity
**Definition:** Microsoft's authentication and authorization framework for ASP.NET Core applications, providing user management, role-based access control, and security features.  
**Status:** Not currently implemented, planned for migration  
**Recommendation:** Add for production security  
**Source:** [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md), [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md#authentication--authorization)

### Bounded Context
**Definition:** An explicit boundary within a domain model where a particular domain model is defined and applicable. Each bounded context has its own ubiquitous language.  
**Usage:** This glossary organizes terms by bounded contexts (Student records, Academic catalog, Faculty management, etc.)  
**Pattern:** Domain-Driven Design (DDD) concept  
**Source:** Domain-Driven Design principles applied to ContosoUniversity

### Cascade Delete
**Definition:** Database referential integrity behavior where deleting a parent record automatically deletes all dependent child records.  
**Implementation:** Configured via EF Core foreign key relationships  
**Example:** Deleting a Department cascades to delete all Courses in that department, which cascades to delete all Enrollments  
**Warning:** Potentially destructive, requires safeguards or soft delete pattern  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#relationships--foreign-keys)

### Circuit Breaker
**Definition:** Resilience pattern that prevents cascading failures by temporarily blocking calls to a failing service and allowing it to recover.  
**Status:** Not implemented in current system  
**Recommendation:** Add for production resilience  
**Library:** Polly (for .NET)  
**Source:** [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md#outbound-dependencies)

### CodeQL
**Definition:** GitHub's semantic code analysis engine used for security vulnerability detection and code quality analysis.  
**Usage:** CI/CD pipeline includes CodeQL scanning for C# and JavaScript  
**Source:** .github/workflows, [Technology-Inventory.md](./Technology-Inventory.md)

### Connection Pooling
**Definition:** Performance optimization technique that reuses database connections instead of creating new connections for each request.  
**Implementation:** Enabled by default in both ASP.NET Core and Node.js applications  
**Configuration:** Node.js max pool size = 10 connections  
**Source:** [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md#outbound-dependencies)

### DbContext
**Definition:** Entity Framework Core's primary class for interacting with a database, managing entity instances, change tracking, and database operations.  
**Implementation:** SchoolContext class  
**Lifetime:** Scoped per HTTP request in ASP.NET Core  
**Source:** Data/SchoolContext.cs, [01-Architecture-Overview.md](./01-Architecture-Overview.md)

### DbInitializer
**Definition:** Static class responsible for initializing the database schema and seeding sample data on application startup.  
**Behavior:** Only seeds data if database is empty  
**Warning:** Synchronous operation blocks application startup  
**Recommendation:** Refactor to async for production  
**Source:** Data/DbInitializer.cs, [Data-Model-Catalog.md](./Data-Model-Catalog.md#schema-evolution-history)

### Eager Loading
**Definition:** EF Core query optimization technique that loads related entities in a single database query using .Include() and .ThenInclude().  
**Purpose:** Prevents N+1 query problem  
**Alternative:** Lazy loading, explicit loading  
**Source:** [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md#sla--performance-targets)

### Health Check
**Definition:** Monitoring endpoint that verifies application and dependency (database) availability and responsiveness.  
**Endpoints:** 
- Node.js API: `/api/health` (returns JSON with database connectivity status)
- ASP.NET Core: Recommended to add `/health` endpoint  
**Source:** contoso-api/src/routes/health.ts, [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md#nodejs-express-api)

### Kestrel
**Definition:** Cross-platform, open-source web server for ASP.NET Core applications.  
**Usage:** Development server (localhost:5000/5001), can be used behind IIS or reverse proxy in production  
**Source:** [01-Architecture-Overview.md](./01-Architecture-Overview.md#deployment-topology)

### LocalDB
**Definition:** Lightweight SQL Server Express edition designed for development, runs in user context without requiring SQL Server service.  
**Connection:** (localdb)\mssqllocaldb  
**Usage:** Development only, not suitable for production  
**Replacement:** SQL Server 2022 or Azure SQL for production  
**Source:** appsettings.json, [Data-Model-Catalog.md](./Data-Model-Catalog.md)

### Middleware
**Definition:** Components in the ASP.NET Core request processing pipeline that handle requests and responses.  
**Examples:** Exception handling, HTTPS redirection, HSTS, routing  
**Configuration:** Program.cs using app.Use*() methods  
**Source:** [01-Architecture-Overview.md](./01-Architecture-Overview.md)

### Migration (EF Core)
**Definition:** Version-controlled database schema changes managed by Entity Framework Core, allowing incremental schema evolution.  
**Current Migrations:** 
1. 20220226005057_InitialCreate - Initial schema
2. 20220226012101_RowVersion - Added concurrency token to Department  
**Command:** `dotnet ef migrations add <name>`  
**Source:** Migrations/ folder, [Data-Model-Catalog.md](./Data-Model-Catalog.md#schema-evolution-history)

### Monolith / Monolithic Architecture
**Definition:** Application architecture pattern where all components (UI, business logic, data access) are deployed as a single unit.  
**ContosoUniversity Status:** Current architecture (ASP.NET Core Razor Pages monolith)  
**Trade-offs:** Simple deployment but limited scalability  
**Alternatives:** Microservices, modular monolith  
**Source:** [01-Architecture-Overview.md](./01-Architecture-Overview.md#executive-summary)

### N+1 Query Problem
**Definition:** Performance anti-pattern where a query loads N parent entities, then executes one additional query per parent to load related child entities (N+1 total queries).  
**Solution:** Use eager loading with .Include() or projection  
**Source:** [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md#sla--performance-targets)

### Optimistic Concurrency Control
**Definition:** Concurrency control strategy that allows multiple users to read a record simultaneously and detects conflicts only when updates occur.  
**Implementation:** Department entity uses ConcurrencyToken (rowversion)  
**Behavior:** Throws DbUpdateConcurrencyException if another user modified the record  
**User Experience:** Shows current vs. submitted values, user chooses to overwrite or cancel  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#department), Pages/Departments/Edit.cshtml.cs

### PageModel
**Definition:** Base class for Razor Pages code-behind classes, handling HTTP requests and page logic.  
**Examples:** IndexModel, CreateModel, EditModel, DeleteModel, DetailsModel  
**Pattern:** Model-View-Controller (MVC) variant  
**Source:** Pages/**/*.cshtml.cs files

### PaginatedList
**Definition:** Custom generic collection class that provides server-side pagination for query results.  
**Properties:** PageIndex, TotalPages, HasPreviousPage, HasNextPage  
**Implementation:** Uses Skip() and Take() LINQ methods  
**Configuration:** Page size set in appsettings.json (default: 3 for demo purposes)  
**Source:** PaginatedList.cs, [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md#pagination-conventions)

### Razor Pages
**Definition:** ASP.NET Core framework for building server-rendered web UI with page-based routing and code-behind model.  
**Routing Convention:** /Pages/{Area}/{Action}.cshtml → /{Area}/{Action} URL  
**Alternative:** MVC Controllers, Blazor  
**Source:** [01-Architecture-Overview.md](./01-Architecture-Overview.md), all Pages/ files

### SchoolContext
**Definition:** The application's DbContext implementation, managing all entity sets and database configuration.  
**DbSets:** Students, Instructors, Courses, Enrollments, Departments, OfficeAssignments  
**Database Name:** SchoolContext-{guid}  
**Source:** Data/SchoolContext.cs

### Seed Data
**Definition:** Initial sample data inserted into the database for development and testing purposes.  
**Entities Seeded:** 8 students, 5 instructors, 7 courses, 4 departments, 11 enrollments, 3 office assignments  
**Trigger:** DbInitializer.Initialize() runs on application startup if database is empty  
**Source:** Data/DbInitializer.cs, [Data-Model-Catalog.md](./Data-Model-Catalog.md#data-volume-estimates)

### Soft Delete
**Definition:** Data deletion strategy that marks records as deleted (IsDeleted flag) instead of physically removing them from the database.  
**Status:** Not implemented (recommended enhancement)  
**Benefits:** Preserves data integrity, audit trail, enables recovery  
**Implementation:** Add IsDeleted (bit) and DeletedAt (datetime2) columns  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#migration-considerations)

### TDS (Tabular Data Stream)
**Definition:** Protocol used by SQL Server and Azure SQL for client-server communication over TCP/IP.  
**Port:** Default 1433 (TCP)  
**Usage:** Both ASP.NET Core and Node.js applications use TDS to connect to database  
**Source:** [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md#outbound-dependencies)

---

## Data & Database Terms

### ACID Transactions
**Definition:** Database transaction properties ensuring Atomicity, Consistency, Isolation, and Durability.  
**ContosoUniversity Implementation:** All database operations use SQL Server ACID transactions via EF Core SaveChangesAsync()  
**Isolation Level:** Read Committed (default)  
**Source:** [01-Architecture-Overview.md](./01-Architecture-Overview.md#transaction-boundaries--consistency)

### Composite Primary Key
**Definition:** Primary key consisting of two or more columns, uniquely identifying a row by the combination of values.  
**Example:** CourseInstructor table uses (CoursesCourseID, InstructorsID) composite key  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#courseinstructor-junction-table)

### ConcurrencyToken
**Definition:** Database column that stores a version marker (rowversion in SQL Server) to detect concurrent modifications to a record.  
**Type:** byte[] in C#, rowversion in SQL Server (8-byte auto-incrementing value)  
**Usage:** Department.ConcurrencyToken field  
**Behavior:** Automatically updated by SQL Server on each row modification  
**Source:** Models/Department.cs, [Data-Model-Catalog.md](./Data-Model-Catalog.md#department)

### Foreign Key (FK)
**Definition:** Database constraint that establishes a relationship between two tables by referencing the primary key of another table.  
**Examples:** 
- Enrollment.StudentID → Student.ID
- Enrollment.CourseID → Course.CourseID
- Course.DepartmentID → Department.DepartmentID  
**Naming Convention:** FK_{ChildTable}_{ParentTable}_{ColumnName}  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#relationships--foreign-keys)

### Hot Table
**Definition:** Database table with very high read and/or write frequency requiring optimization for performance.  
**ContosoUniversity Hot Tables:** Enrollment, Student, Course, Instructor  
**Optimizations:** Comprehensive indexing, caching, connection pooling, read replicas  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#hot-vs-cold-tables)

### IDENTITY Column
**Definition:** SQL Server column property that auto-generates sequential numeric values for new rows.  
**Configuration:** IDENTITY(seed, increment) - typically IDENTITY(1,1)  
**ContosoUniversity Usage:** Student.ID, Instructor.ID, Enrollment.EnrollmentID, Department.DepartmentID  
**Exception:** Course.CourseID uses DatabaseGenerated(None) - values must be manually assigned  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#primary-key-strategy)

### Junction Table
**Definition:** Database table that implements a many-to-many relationship by storing foreign keys to both related tables.  
**Example:** CourseInstructor table links Course and Instructor entities  
**Characteristics:** Composite primary key, no additional columns beyond foreign keys  
**Auto-Generated:** Created by EF Core for many-to-many relationships  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#courseinstructor-junction-table)

### Materialized View
**Definition:** Database view where query results are physically stored and periodically refreshed, improving query performance.  
**Status:** Not implemented in current system  
**Recommendations:** EnrollmentSummaryByStudent, CourseEnrollmentCounts, InstructorCourseLoad  
**SQL Server Equivalent:** Indexed views with SCHEMABINDING  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#hot-vs-cold-tables)

### Navigation Property
**Definition:** EF Core property on an entity that references related entities, enabling object graph traversal.  
**Types:** 
- Reference navigation (single entity): Student.Enrollments → ICollection<Enrollment>
- Collection navigation (multiple entities): Enrollment.Student → Student  
**Loading Strategies:** Eager (Include), Lazy, Explicit  
**Source:** All Models/*.cs files

### Normalization
**Definition:** Database design process that organizes data to reduce redundancy and improve data integrity by separating data into related tables.  
**ContosoUniversity Schema:** Fully normalized (3NF or higher)  
**Example:** Student name stored once in Student table, referenced by Enrollment.StudentID  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md)

### Primary Key (PK)
**Definition:** Database constraint that uniquely identifies each row in a table, ensuring no duplicate values.  
**ContosoUniversity PKs:**
- Single column: Student.ID, Instructor.ID, Course.CourseID
- Composite: CourseInstructor(CoursesCourseID, InstructorsID)
- PK as FK: OfficeAssignment.InstructorID  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md)

### Referential Integrity
**Definition:** Database constraint ensuring foreign key values always reference existing primary key values in the parent table.  
**Enforcement:** SQL Server foreign key constraints  
**Cascade Behavior:** Configurable (CASCADE, NO ACTION, SET NULL, SET DEFAULT)  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#relationships--foreign-keys)

### Rowversion
**Synonym for:** ConcurrencyToken (SQL Server specific type)  
**Definition:** SQL Server data type that generates a unique binary number within a database, automatically incremented on updates.  
**Size:** 8 bytes  
**Portability:** SQL Server specific, requires alternative implementation (timestamp, xmin) in other databases  
**Source:** Migrations/20220226012101_RowVersion.cs

### Table Temperature
**Definition:** Classification of database tables based on access patterns (read/write frequency) for optimization purposes.  
**Categories:**
- 🔥 **Hot:** Very high read/write (Enrollment, Student, Course, Instructor)
- 🟡 **Warm:** Moderate access (Department, CourseInstructor)
- ❄️ **Cold:** Low access (OfficeAssignment)  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#hot-vs-cold-tables)

---

## Development & Build Terms

### .NET CLI
**Definition:** Cross-platform command-line interface for .NET development, providing tools for building, testing, and publishing applications.  
**Common Commands:** dotnet build, dotnet run, dotnet test, dotnet publish, dotnet ef migrations add  
**Source:** [Technology-Inventory.md](./Technology-Inventory.md)

### .NET LTS (Long-Term Support)
**Definition:** .NET release with extended support (3 years) for production applications requiring stability.  
**Current:** .NET 6 LTS (EOL: November 2024 - expired)  
**Recommended Target:** .NET 8 LTS (EOL: November 2026)  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md), [Technology-Inventory.md](./Technology-Inventory.md)

### Azure App Service
**Definition:** Microsoft Azure's fully managed Platform-as-a-Service (PaaS) for hosting web applications without managing infrastructure.  
**Usage:** Target production hosting platform (deployment slots: staging/prod)  
**Alternative:** Container platforms (Azure Container Apps, Kubernetes)  
**Source:** [Technology-Inventory.md](./Technology-Inventory.md), CI/CD workflows

### BCP (Bulk Copy Program)
**Definition:** SQL Server command-line utility for high-performance data import/export operations.  
**Usage:** Recommended for data migration tasks  
**Alternative:** SSIS, EF Core data seeding  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#data-migration-steps)

### CI/CD (Continuous Integration / Continuous Deployment)
**Definition:** Automated software development practices for building, testing, and deploying code changes.  
**Implementation:** GitHub Actions workflows for build, test, CodeQL scanning, and Azure deployment  
**Workflows:** .NET build, CodeQL analysis, Azure Web App deployment  
**Source:** .github/workflows/, [Technology-Inventory.md](./Technology-Inventory.md)

### Dependency Injection (DI)
**Definition:** Design pattern where object dependencies are provided externally rather than created internally, improving testability and modularity.  
**ASP.NET Core:** Built-in DI container configured in Program.cs using builder.Services  
**Lifetime Scopes:** Singleton, Scoped (per request), Transient  
**Example:** SchoolContext registered as scoped service  
**Source:** Program.cs, [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md)

### Docker
**Definition:** Containerization platform for packaging applications with dependencies into portable, isolated containers.  
**Status:** Not currently used in ContosoUniversity  
**Recommendation:** Create Dockerfile for containerized deployment  
**Target Image:** mcr.microsoft.com/dotnet/aspnet:8.0  
**Source:** [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md)

### GitHub Actions
**Definition:** GitHub's CI/CD automation service that runs workflows on code events (push, pull request, schedule).  
**ContosoUniversity Workflows:** Build and test .NET app, CodeQL security scanning, Azure deployment  
**Runners:** ubuntu-latest (GitHub-hosted)  
**Source:** .github/workflows/, [Technology-Inventory.md](./Technology-Inventory.md)

### MSBuild
**Definition:** Microsoft's build platform for compiling .NET projects and solutions.  
**Usage:** Invoked by `dotnet build` command  
**Project Files:** .csproj (C# project), .sln (solution)  
**Source:** ContosoUniversity.csproj, [Technology-Inventory.md](./Technology-Inventory.md)

### NuGet
**Definition:** Package manager for .NET, providing access to thousands of reusable libraries and tools.  
**Key Packages:** 
- Microsoft.EntityFrameworkCore.SqlServer 6.0.2
- Microsoft.AspNetCore.Diagnostics.EntityFrameworkCore 6.0.2
- Microsoft.EntityFrameworkCore.Tools 6.0.2  
**Source:** ContosoUniversity.csproj, [Technology-Inventory.md](./Technology-Inventory.md)

### SBOM (Software Bill of Materials)
**Definition:** Inventory of all software components, libraries, and dependencies used in an application, including versions and licenses.  
**Status:** Not generated in current project  
**Recommendation:** Use `dotnet list package --include-transitive` or SBOM tooling  
**Source:** [Technology-Inventory.md](./Technology-Inventory.md)

### TypeScript
**Definition:** Superset of JavaScript that adds static typing and compile-time type checking.  
**Usage:** Node.js Express API implementation (contoso-api/)  
**Compilation:** TypeScript → JavaScript via tsc compiler  
**Configuration:** tsconfig.json  
**Source:** contoso-api/tsconfig.json

---

## Security & Compliance Terms

### Data Encryption at Rest
**Definition:** Encrypting data stored on disk to protect against unauthorized access if storage media is compromised.  
**Recommendation:** Enable SQL Server Transparent Data Encryption (TDE)  
**Status:** Not implemented in development LocalDB  
**Required For:** Production deployment, FERPA/GDPR compliance  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#recommended-data-protection-measures)

### Data Encryption in Transit
**Definition:** Encrypting data transmitted between client and server to prevent interception.  
**Implementation:** TLS 1.2+ for HTTPS connections  
**SQL Server:** Set encrypt=true in connection string for production  
**Status:** Development uses encrypt=false with LocalDB (acceptable), must change for production  
**Source:** [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md#outbound-dependencies)

### FERPA (Family Educational Rights and Privacy Act)
**Definition:** U.S. federal law protecting the privacy of student education records.  
**Protected Data:** Student names, enrollment dates, grades, enrollments, academic transcripts  
**Requirements:** Access controls, audit logging, consent management, right to inspect/amend  
**Entities Affected:** Student, Enrollment (StudentID, Grade fields)  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#pii-classification)

### GDPR (General Data Protection Regulation)
**Definition:** European Union regulation governing data protection and privacy for individuals.  
**Applicability:** Required if processing EU citizen data  
**Data Subject Rights:** Access, rectification, erasure, portability, objection  
**Legal Basis:** Contract performance, legal obligation, legitimate interest  
**Conflict:** Right to erasure conflicts with academic record retention requirements  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#gdpr-considerations-if-applicable)

### HSTS (HTTP Strict Transport Security)
**Definition:** Security header that forces browsers to use HTTPS connections exclusively, preventing protocol downgrade attacks.  
**ASP.NET Core:** Configured via app.UseHsts() in production  
**Header:** Strict-Transport-Security: max-age=31536000  
**Source:** Program.cs, [01-Architecture-Overview.md](./01-Architecture-Overview.md)

### OWASP Top 10
**Definition:** List of the ten most critical web application security risks published by the Open Web Application Security Project.  
**ContosoUniversity Status:** No authentication (A07:2021 - Authentication Failures), public data exposure  
**Compliance Goal:** Follow OWASP mitigation strategies in migration  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#constraints--considerations)

### PII (Personally Identifiable Information)
**Definition:** Any data that can identify a specific individual, requiring special protection and compliance with privacy regulations.  
**ContosoUniversity PII Fields:**
- **High:** Student names, instructor names, enrollment dates, grades
- **Medium:** Hire dates
- **Confidential:** Department budgets (not PII but sensitive)  
**Classification Table:** See [Data-Model-Catalog.md](./Data-Model-Catalog.md#pii-classification)  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#pii-classification)

### RBAC (Role-Based Access Control)
**Definition:** Access control method that restricts system access based on user roles rather than individual identities.  
**Status:** Not implemented in current system  
**Planned Roles:** Student, Instructor, Registrar, Administrator  
**Example Policies:** AdminOnly, InstructorOrAdmin  
**Source:** [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md#authentication--authorization)

### TLS (Transport Layer Security)
**Definition:** Cryptographic protocol for secure communication over networks, successor to SSL.  
**Version:** TLS 1.2+ required for production  
**Usage:** HTTPS connections, SQL Server connections (encrypt=true)  
**Certificate Management:** Azure App Service provides free SSL certificates  
**Source:** [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md#outbound-dependencies)

---

## Migration-Specific Terms

### Blue-Green Deployment
**Definition:** Deployment strategy where two identical production environments (blue and green) exist, allowing zero-downtime releases by switching traffic between environments.  
**Azure Implementation:** App Service deployment slots (staging → production swap)  
**Benefit:** Instant rollback capability  
**Recommendation:** Use for production deployment  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#risk-register-top-5)

### Breaking Change
**Definition:** Modification to API, database schema, or behavior that causes existing functionality or integrations to fail.  
**Examples:** Removing endpoints, changing route patterns, modifying column types  
**Mitigation:** Versioning, feature flags, phased rollout, comprehensive testing  
**Constraint:** Minimize breaking changes during migration  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#constraints--considerations)

### Compatibility Gap
**Definition:** Difference between current technology stack and target stack that requires code changes, refactoring, or architectural adjustments.  
**Analysis:** See [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md)  
**Key Gaps:** .NET 6 → 8 upgrade, authentication implementation, observability enhancements  
**Source:** [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md)

### Data Migration
**Definition:** Process of transferring data from source database to target database, including schema migration, data validation, and integrity checks.  
**Steps:** Backup, schema migration, data export/import, identity reseed, constraint validation, index rebuild  
**Tools:** EF Core migrations, BCP, SSIS  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#data-migration-steps)

### Dry Run
**Definition:** Rehearsal of migration or deployment process in a non-production environment to identify issues before production execution.  
**Purpose:** Validate scripts, measure downtime, test rollback procedures  
**Environments:** Development, test, staging  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#phase-4-production-preparation-weeks-12-13)

### Feature Flag
**Definition:** Technique for toggling features on/off at runtime without code changes, enabling gradual rollouts and A/B testing.  
**Usage:** Recommended for phased migration of new features  
**Implementation:** Configuration-based boolean switches  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#risk-register-top-5)

### Go/No-Go Decision
**Definition:** Critical decision point before production deployment where stakeholders assess readiness and approve (go) or delay (no-go) the release.  
**Criteria:** All tests passing, UAT sign-off, performance targets met, zero critical bugs, rollback plan tested  
**Timing:** Phase 4 (Production Preparation)  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#phase-4-production-preparation-weeks-12-13)

### Hypercare
**Definition:** Post-deployment period of intensive monitoring and support to quickly address any issues in production.  
**Duration:** Typically 48-72 hours after deployment  
**Activities:** Performance monitoring, user support, incident response, stakeholder communication  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#phase-5-production-deployment--validation-week-14)

### IaC (Infrastructure as Code)
**Definition:** Practice of managing infrastructure configuration through code files rather than manual configuration.  
**Status:** Not implemented in current project  
**Tools:** Terraform (cloud-agnostic), Bicep (Azure-specific), ARM templates  
**Benefit:** Repeatable, version-controlled infrastructure deployments  
**Source:** [01-Architecture-Overview.md](./01-Architecture-Overview.md#deployment-topology), [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md)

### Migration Playbook
**Definition:** Comprehensive document detailing step-by-step procedures, scripts, and decision trees for executing the migration.  
**Contents:** Task breakdown, dependencies, timing, responsible parties, rollback procedures  
**Status:** To be created in Phase 0  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#phase-0-discovery--planning-weeks-1-2)

### Phased Migration
**Definition:** Migration strategy that breaks the project into sequential phases with defined deliverables and milestones.  
**ContosoUniversity Phases:**
- Phase 0: Discovery & Planning
- Phase 1: Foundation Setup
- Phase 2: Core Migration
- Phase 3: Integration & Testing
- Phase 4: Production Preparation
- Phase 5: Production Deployment
- Phase 6: Optimization & Decommission  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#phased-migration-timeline)

### RACI Matrix
**Definition:** Responsibility assignment matrix defining who is Responsible, Accountable, Consulted, and Informed for each task.  
**Purpose:** Clarifies roles and decision-making authority  
**ContosoUniversity Roles:** Product Owner, Tech Lead, Dev Team, QA, Security, SRE/DevOps, Data Engineer  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#roles--responsibilities-raci)

### Rollback Plan
**Definition:** Documented procedures for reverting to the previous system state if migration or deployment fails.  
**Components:** Database restore scripts, code version rollback, configuration rollback, communication plan  
**Testing:** Must be tested in dry run before production deployment  
**Retention:** Keep backups for 72 hours minimum after deployment  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md), [Data-Model-Catalog.md](./Data-Model-Catalog.md#schema-rollback-procedures)

### Runbook
**Definition:** Operational guide documenting step-by-step procedures for deployment, troubleshooting, and maintenance tasks.  
**Examples:** Deployment runbook, incident response runbook, database maintenance runbook  
**Owner:** SRE/DevOps (Responsible/Accountable)  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#roles--responsibilities-raci)

### Smoke Test
**Definition:** Quick, basic tests performed immediately after deployment to verify critical functionality works.  
**ContosoUniversity Tests:** CRUD operations on all entities, cascade delete behavior, concurrency control  
**Timing:** First validation step after production deployment  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#data-migration-steps)

### Technical Debt
**Definition:** Implied cost of future rework caused by choosing quick/easy solutions instead of better approaches that take longer.  
**Examples:** Missing authentication, no caching, synchronous seed data, missing indexes  
**Goal:** Reduce technical debt during migration  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#business-objectives)

### UAT (User Acceptance Testing)
**Definition:** Final testing phase where end users validate that the system meets business requirements and is ready for production.  
**Timing:** Phase 3 (Integration & Testing)  
**Sign-off Required:** Product Owner approval before proceeding to production preparation  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#phase-3-integration--testing-weeks-9-11)

---

## Acronyms & Abbreviations

### API
**Full Form:** Application Programming Interface  
**Definition:** Set of rules and protocols for building and interacting with software applications  
**ContosoUniversity Usage:** Node.js Express API provides health check endpoint; REST API endpoints recommended for future

### APM
**Full Form:** Application Performance Monitoring  
**Definition:** Real-time monitoring of application performance metrics (response times, error rates, throughput)  
**Status:** Not implemented  
**Recommendation:** Add Application Insights or OpenTelemetry

### CRUD
**Full Form:** Create, Read, Update, Delete  
**Definition:** Four basic operations for persistent storage  
**ContosoUniversity:** All entities support full CRUD operations via Razor Pages

### DDD
**Full Form:** Domain-Driven Design  
**Definition:** Software design approach focusing on modeling complex business domains with ubiquitous language and bounded contexts  
**Application:** This glossary uses DDD concepts (bounded contexts, ubiquitous language)

### DTD
**Alternate:** Data Transfer Object (DTO)  
**Definition:** Object that carries data between processes, often used to shape API responses  
**Status:** Not implemented in current system

### EF Core
**Full Form:** Entity Framework Core  
**Definition:** Microsoft's object-relational mapper (ORM) for .NET, providing data access abstraction  
**Version:** 6.0.2 (current), target: 8.0.x  
**Source:** [Technology-Inventory.md](./Technology-Inventory.md)

### EOL
**Full Form:** End of Life  
**Definition:** Date when a software product no longer receives updates or support  
**Critical:** .NET 6 EOL = November 12, 2024 (expired)  
**Source:** [Technology-Inventory.md](./Technology-Inventory.md)

### FK
**Full Form:** Foreign Key  
**Definition:** Database constraint referencing primary key in another table  
**See:** [Foreign Key](#foreign-key-fk) definition above

### GPA
**Full Form:** Grade Point Average  
**Definition:** Calculated average of student grades (A=4.0, B=3.0, C=2.0, D=1.0, F=0.0)  
**Status:** Not stored in database, can be calculated from Enrollment.Grade values  
**Materialized View:** EnrollmentSummaryByStudent could include GPA calculation

### HTTP
**Full Form:** Hypertext Transfer Protocol  
**Definition:** Application protocol for distributed hypermedia information systems  
**Usage:** All web communication (GET, POST methods)

### HTTPS
**Full Form:** HTTP Secure  
**Definition:** HTTP over TLS/SSL encryption  
**Requirement:** All production communication must use HTTPS

### IIS
**Full Form:** Internet Information Services  
**Definition:** Microsoft's web server for Windows Server  
**Usage:** Alternative to Kestrel for production hosting on Windows  
**Source:** [01-Architecture-Overview.md](./01-Architecture-Overview.md)

### JSON
**Full Form:** JavaScript Object Notation  
**Definition:** Lightweight data interchange format  
**Usage:** Node.js API responses, configuration files (appsettings.json)

### JWT
**Full Form:** JSON Web Token  
**Definition:** Compact, URL-safe token for securely transmitting information between parties  
**Recommendation:** Use for API authentication  
**Source:** [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md#authentication--authorization)

### LTS
**Full Form:** Long-Term Support  
**Definition:** Software version with extended support period (3 years for .NET)  
**Current:** .NET 6 LTS (expired)  
**Target:** .NET 8 LTS (supported until November 2026)

### MFA / 2FA
**Full Form:** Multi-Factor Authentication / Two-Factor Authentication  
**Definition:** Security method requiring multiple forms of verification  
**Status:** Not implemented  
**Recommendation:** Enable for administrator accounts

### MVC
**Full Form:** Model-View-Controller  
**Definition:** Architectural pattern separating concerns into models, views, and controllers  
**Razor Pages:** Variant of MVC pattern (PageModel = Controller + View Model)

### OIDC
**Full Form:** OpenID Connect  
**Definition:** Authentication protocol built on OAuth 2.0  
**Recommendation:** Consider for external authentication provider integration  
**Example:** Azure AD, Auth0

### ORM
**Full Form:** Object-Relational Mapper  
**Definition:** Programming technique for converting data between incompatible type systems (objects ↔ relational tables)  
**ContosoUniversity:** Entity Framework Core 6.0.2

### PaaS
**Full Form:** Platform as a Service  
**Definition:** Cloud computing service providing platform for application deployment without infrastructure management  
**Example:** Azure App Service  
**Source:** [Technology-Inventory.md](./Technology-Inventory.md)

### PK
**Full Form:** Primary Key  
**Definition:** Unique identifier for each row in a database table  
**See:** [Primary Key](#primary-key-pk) definition above

### REST
**Full Form:** Representational State Transfer  
**Definition:** Architectural style for designing networked applications using HTTP methods  
**Status:** Node.js API uses RESTful conventions; ASP.NET Core uses Razor Pages (not REST)

### SBOM
**Full Form:** Software Bill of Materials  
**See:** [SBOM](#sbom-software-bill-of-materials) definition above

### SDK
**Full Form:** Software Development Kit  
**Definition:** Collection of tools and libraries for developing applications  
**ContosoUniversity:** .NET SDK 6.0.x  
**Source:** [Technology-Inventory.md](./Technology-Inventory.md)

### SLA
**Full Form:** Service Level Agreement  
**Definition:** Commitment between service provider and customer defining expected performance levels  
**ContosoUniversity Status:** No formal SLAs defined; estimated targets documented  
**Source:** [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md#sla--performance-targets)

### SQL
**Full Form:** Structured Query Language  
**Definition:** Standard language for managing relational databases  
**ContosoUniversity:** SQL Server LocalDB (dev), SQL Server 2022 or Azure SQL (target)

### SRE
**Full Form:** Site Reliability Engineering  
**Definition:** Discipline applying software engineering principles to infrastructure and operations  
**Role:** Responsible for deployment, monitoring, infrastructure  
**Source:** [00-Project-Overview.md](./00-Project-Overview.md#roles--responsibilities-raci)

### SSIS
**Full Form:** SQL Server Integration Services  
**Definition:** Microsoft's ETL platform for data integration and workflow applications  
**Usage:** Recommended for data migration tasks  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#etlelt--data-pipeline-notes)

### TDD
**Full Form:** Test-Driven Development  
**Definition:** Software development practice where tests are written before implementation code  
**Status:** Minimal testing in current system  
**Recommendation:** Adopt for migration project

### TDE
**Full Form:** Transparent Data Encryption  
**Definition:** SQL Server feature that encrypts database files at rest without application changes  
**Status:** Not enabled in development  
**Requirement:** Enable for production database  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#recommended-data-protection-measures)

### TTL
**Full Form:** Time to Live  
**Definition:** Duration for which cached data remains valid before refresh  
**Usage:** Recommended for caching strategy (e.g., 5-10 minutes for warm tables)  
**Source:** [Data-Model-Catalog.md](./Data-Model-Catalog.md#hot-vs-cold-tables)

### UI
**Full Form:** User Interface  
**Definition:** Visual elements and interactions through which users interact with application  
**ContosoUniversity:** Razor Pages with Bootstrap (server-rendered HTML)

### URL
**Full Form:** Uniform Resource Locator  
**Definition:** Web address identifying location of a resource  
**Routing:** Convention-based in Razor Pages (/Pages/Students/Index.cshtml → /Students)

### UX
**Full Form:** User Experience  
**Definition:** Overall experience and satisfaction when using application  
**Constraint:** Maintain existing UX during migration (no major redesign)

---

## Document History

| Version | Date       | Author              | Changes                                      |
| ------- | ---------- | ------------------- | -------------------------------------------- |
| 1.0     | 2025-12-30 | Migration Architect | Initial glossary compiled from all documentation and code |

---

## Usage Guidelines

### For Developers
- Use this glossary when writing code comments and documentation
- Follow naming conventions established in canonical entities
- Reference defined terms in pull request descriptions

### For Stakeholders
- Use ubiquitous language from relevant bounded contexts in requirements and discussions
- Refer to this document when clarifying terminology ambiguities
- Suggest additions for missing or unclear terms

### For Technical Writers
- Link to canonical sources when documenting features
- Maintain consistency with definitions in this glossary
- Update glossary when introducing new domain concepts

---

## Contributing

To add or update terms:

1. Identify the appropriate category (Domain, Technical, Data, Development, Security, Migration)
2. Add alphabetically within category
3. Include: Definition, Context/Usage, Related terms, Source references
4. Link to canonical documentation sources
5. Update document version and history

---

_This glossary serves as the definitive reference for ContosoUniversity domain terminology. All team members should consult and contribute to this living document to maintain consistent communication throughout the migration project._
