---
title: 'Data Model Catalog - ContosoUniversity'
last_updated: '2025-12-23'
owner: 'Migration Architect'
status: 'Complete'
database: 'SQL Server (SchoolContext)'
schema_version: '20220226012101_RowVersion'
---

# Data Model Catalog - ContosoUniversity

## Executive Summary

This document provides a comprehensive catalog of all data entities, schemas, relationships, and migration considerations for the ContosoUniversity application. The data model implements a normalized relational schema using Entity Framework Core 6.0.2 with SQL Server as the backend database.

**Database:** `SchoolContext-{environment-guid}` (Example: `SchoolContext-a8778b0f-1bfd-4d0f-a500-09390a0df97f`)  
**ORM:** Entity Framework Core 6.0.2  
**Provider:** Microsoft.EntityFrameworkCore.SqlServer 6.0.2  
**Migration Count:** 2 migrations  
**Entity Count:** 7 entities (6 domain entities + 1 junction table)

**Note:** Database name includes a GUID suffix that varies by environment. Production database names should follow organizational naming conventions.

---

## Table of Contents

- [Entity Overview](#entity-overview)
- [Entity Details](#entity-details)
  - [Student](#student)
  - [Instructor](#instructor)
  - [Course](#course)
  - [Enrollment](#enrollment)
  - [Department](#department)
  - [OfficeAssignment](#officeassignment)
  - [CourseInstructor (Junction Table)](#courseinstructor-junction-table)
- [Relationships & Foreign Keys](#relationships--foreign-keys)
- [Indexes](#indexes)
- [Data Volume Estimates](#data-volume-estimates)
- [Hot vs Cold Tables](#hot-vs-cold-tables)
- [PII Classification](#pii-classification)
- [Migration Considerations](#migration-considerations)
- [Schema Evolution History](#schema-evolution-history)

---

## Entity Overview

| Entity | Table Name | Primary Key | Type | Row Count (Seed) | Access Pattern |
|--------|------------|-------------|------|------------------|----------------|
| **Student** | `Student` | ID (int) | Domain | 8 | HOT - High read/write |
| **Instructor** | `Instructor` | ID (int) | Domain | 5 | HOT - High read/write |
| **Course** | `Course` | CourseID (int) | Domain | 7 | HOT - High read/write |
| **Enrollment** | `Enrollments` | EnrollmentID (int) | Transactional | 11 | HOT - Very high write |
| **Department** | `Departments` | DepartmentID (int) | Reference | 4 | WARM - Low write, moderate read |
| **OfficeAssignment** | `OfficeAssignments` | InstructorID (int, FK) | Domain | 3 | COLD - Low read/write |
| **CourseInstructor** | `CourseInstructor` | Composite PK | Junction | ~10-15 | WARM - Moderate read |

**Total Estimated Rows (Production):** TBD - Requires production database analysis  
**Current Seed Data:** 38 rows across all tables

---

## Entity Details

### Student

**Purpose:** Represents enrolled students in the university system  
**Table Name:** `Student`  
**Access Pattern:** HOT - Frequent CRUD operations for student management

#### Schema

| Column Name | Data Type | Max Length | Nullable | Default | Constraints | Database Type |
|------------|-----------|------------|----------|---------|-------------|---------------|
| **ID** | int | - | NOT NULL | IDENTITY(1,1) | Primary Key | int |
| **LastName** | string | 50 | NOT NULL | - | Required, MaxLength(50) | nvarchar(50) |
| **FirstName** | string | 50 | NOT NULL | - | Required, MaxLength(50), Column("FirstName") | nvarchar(50) |
| **EnrollmentDate** | DateTime | - | NOT NULL | - | DataType(Date) | datetime2 |

**Notes:**
- Property `FirstMidName` in C# model maps to column `FirstName` in database
- `FullName` is a computed property (not persisted) = `LastName + ", " + FirstMidName`
- Display format for EnrollmentDate: `yyyy-MM-dd`

#### Relationships

| Relationship | Type | Target Entity | Navigation Property | Cascade |
|--------------|------|---------------|---------------------|---------|
| Has many Enrollments | 1:N | Enrollment | `ICollection<Enrollment> Enrollments` | Default |

#### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| PK_Student | ID | Clustered, Primary Key | Row identification |
| *(No additional indexes)* | - | - | - |

#### PII Classification

| Field | PII Level | GDPR/FERPA | Retention Policy |
|-------|-----------|------------|------------------|
| ID | Non-PII | ✅ Student Record | Permanent (unless student record deleted) |
| LastName | **PII - High** | ✅ FERPA Protected | Permanent (unless student record deleted) |
| FirstName | **PII - High** | ✅ FERPA Protected | Permanent (unless student record deleted) |
| EnrollmentDate | **PII - Medium** | ✅ FERPA Protected | Permanent (unless student record deleted) |

**Data Protection Notes:**
- All student data is protected under FERPA (Family Educational Rights and Privacy Act)
- Requires access controls and audit logging in production
- Consider encryption at rest for compliance

---

### Instructor

**Purpose:** Represents faculty members teaching courses  
**Table Name:** `Instructor`  
**Access Pattern:** HOT - Frequent reads for course assignments, moderate writes

#### Schema

| Column Name | Data Type | Max Length | Nullable | Default | Constraints | Database Type |
|------------|-----------|------------|----------|---------|-------------|---------------|
| **ID** | int | - | NOT NULL | IDENTITY(1,1) | Primary Key | int |
| **LastName** | string | 50 | NOT NULL | - | Required, MaxLength(50) | nvarchar(50) |
| **FirstName** | string | 50 | NOT NULL | - | Required, MaxLength(50), Column("FirstName") | nvarchar(50) |
| **HireDate** | DateTime | - | NOT NULL | - | DataType(Date) | datetime2 |

**Notes:**
- Property `FirstMidName` in C# model maps to column `FirstName` in database
- `FullName` is a computed property (not persisted) = `LastName + ", " + FirstMidName`
- Display format for HireDate: `yyyy-MM-dd`

#### Relationships

| Relationship | Type | Target Entity | Navigation Property | Cascade |
|--------------|------|---------------|---------------------|---------|
| Has one OfficeAssignment | 1:0..1 | OfficeAssignment | `OfficeAssignment OfficeAssignment` | Default |
| Has many Courses (M:N) | N:M | Course | `ICollection<Course> Courses` | Cascade via junction |
| Administrator of Departments | 1:N | Department | *(No navigation property)* | Default |

#### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| PK_Instructor | ID | Clustered, Primary Key | Row identification |
| *(No additional indexes)* | - | - | - |

#### PII Classification

| Field | PII Level | GDPR/FERPA | Retention Policy |
|-------|-----------|------------|------------------|
| ID | Non-PII | ✅ Employee Record | Permanent (unless instructor record deleted) |
| LastName | **PII - High** | ✅ HR Protected | Permanent (unless instructor record deleted) |
| FirstName | **PII - High** | ✅ HR Protected | Permanent (unless instructor record deleted) |
| HireDate | **PII - Medium** | ✅ HR Protected | Permanent (unless instructor record deleted) |

---

### Course

**Purpose:** Represents courses offered by departments  
**Table Name:** `Course`  
**Access Pattern:** HOT - High read volume for enrollment and course catalogs

#### Schema

| Column Name | Data Type | Max Length | Nullable | Default | Constraints | Database Type |
|------------|-----------|------------|----------|---------|-------------|---------------|
| **CourseID** | int | - | NOT NULL | - | Primary Key, DatabaseGenerated(None) | int |
| **Title** | string | 50 | NULLABLE | - | StringLength(50, MinimumLength=3) | nvarchar(50) |
| **Credits** | int | - | NOT NULL | - | Range(0, 5) | int |
| **DepartmentID** | int | - | NOT NULL | - | Foreign Key to Department | int |

**Notes:**
- `CourseID` is **manually assigned** (not auto-generated)
- CourseID uses `DatabaseGeneratedOption.None` - application must provide IDs
- Display name for CourseID is "Number" in UI

#### Relationships

| Relationship | Type | Target Entity | Navigation Property | Cascade |
|--------------|------|---------------|---------------------|---------|
| Has many Enrollments | 1:N | Enrollment | `ICollection<Enrollment> Enrollments` | Default |
| Has many Instructors (M:N) | N:M | Instructor | `ICollection<Instructor> Instructors` | Cascade via junction |
| Belongs to Department | N:1 | Department | `Department Department` | Cascade |

#### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| PK_Course | CourseID | Clustered, Primary Key | Row identification |
| IX_Course_DepartmentID | DepartmentID | Non-clustered | Foreign key lookups |

#### PII Classification

| Field | PII Level | GDPR/FERPA | Retention Policy |
|-------|-----------|------------|------------------|
| CourseID | Non-PII | - | Permanent |
| Title | Non-PII | - | Permanent |
| Credits | Non-PII | - | Permanent |
| DepartmentID | Non-PII | - | Permanent |

---

### Enrollment

**Purpose:** Junction table linking students to courses with grade tracking  
**Table Name:** `Enrollments`  
**Access Pattern:** HOT - Very high write volume during registration and grading

#### Schema

| Column Name | Data Type | Max Length | Nullable | Default | Constraints | Database Type |
|------------|-----------|------------|----------|---------|-------------|---------------|
| **EnrollmentID** | int | - | NOT NULL | IDENTITY(1,1) | Primary Key | int |
| **CourseID** | int | - | NOT NULL | - | Foreign Key to Course | int |
| **StudentID** | int | - | NOT NULL | - | Foreign Key to Student | int |
| **Grade** | int (enum) | - | NULLABLE | - | Enum: A(0), B(1), C(2), D(3), F(4) | int |

**Notes:**
- Grade is stored as an integer enum (0-4) but displayed as letter grades
- Nullable Grade field allows enrollments without grades assigned
- Display format for null grades: "No grade"

#### Relationships

| Relationship | Type | Target Entity | Navigation Property | Cascade |
|--------------|------|---------------|---------------------|---------|
| Belongs to Course | N:1 | Course | `Course Course` | Cascade |
| Belongs to Student | N:1 | Student | `Student Student` | Cascade |

#### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| PK_Enrollments | EnrollmentID | Clustered, Primary Key | Row identification |
| IX_Enrollments_CourseID | CourseID | Non-clustered | Foreign key lookups, query by course |
| IX_Enrollments_StudentID | StudentID | Non-clustered | Foreign key lookups, query by student |

**Recommended Additional Indexes:**
- Composite index on `(StudentID, CourseID)` for unique constraint and duplicate prevention
- Index on `Grade` for reporting queries (if grade-based queries are frequent)

#### PII Classification

| Field | PII Level | GDPR/FERPA | Retention Policy |
|-------|-----------|------------|------------------|
| EnrollmentID | Non-PII | - | Permanent |
| CourseID | Non-PII | - | Permanent |
| StudentID | **PII - High** | ✅ FERPA Protected | Permanent (academic record) |
| Grade | **PII - High** | ✅ FERPA Protected | Permanent (academic record) |

**Data Protection Notes:**
- Enrollment records are educational records under FERPA
- Grades are highly sensitive PII requiring strict access controls
- Consider audit logging for all grade changes

---

### Department

**Purpose:** Represents academic departments within the university  
**Table Name:** `Departments`  
**Access Pattern:** WARM - Low write frequency, moderate read volume

#### Schema

| Column Name | Data Type | Max Length | Nullable | Default | Constraints | Database Type |
|------------|-----------|------------|----------|---------|-------------|---------------|
| **DepartmentID** | int | - | NOT NULL | IDENTITY(1,1) | Primary Key | int |
| **Name** | string | 50 | NULLABLE | - | StringLength(50, MinimumLength=3) | nvarchar(50) |
| **Budget** | decimal | - | NOT NULL | - | DataType(Currency), Column("money") | money |
| **StartDate** | DateTime | - | NOT NULL | - | DataType(Date) | datetime2 |
| **InstructorID** | int | - | NULLABLE | - | Foreign Key to Instructor | int |
| **ConcurrencyToken** | byte[] | 8 | NULLABLE | Auto | Timestamp, rowversion | rowversion |

**Notes:**
- Implements **optimistic concurrency control** via `ConcurrencyToken` (rowversion)
- Budget stored as SQL Server `money` type (precision: 19, scale: 4)
- Display format for StartDate: `yyyy-MM-dd`
- InstructorID references the department administrator

#### Relationships

| Relationship | Type | Target Entity | Navigation Property | Cascade |
|--------------|------|---------------|---------------------|---------|
| Has many Courses | 1:N | Course | `ICollection<Course> Courses` | Default |
| Has Administrator | N:0..1 | Instructor | `Instructor Administrator` | Default (no cascade) |

#### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| PK_Departments | DepartmentID | Clustered, Primary Key | Row identification |
| IX_Departments_InstructorID | InstructorID | Non-clustered | Foreign key lookups |

#### Concurrency Control

**Strategy:** Optimistic Locking  
**Token:** `ConcurrencyToken` (rowversion) - automatically updated by SQL Server on each modification  
**Behavior:** `DbUpdateConcurrencyException` thrown if token mismatch detected

**Conflict Resolution Pattern:**
```csharp
try {
    await _context.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException ex) {
    // Retrieve current database values
    // Display field-by-field comparison
    // User decides to overwrite or cancel
}
```

#### PII Classification

| Field | PII Level | GDPR/FERPA | Retention Policy |
|-------|-----------|------------|------------------|
| DepartmentID | Non-PII | - | Permanent |
| Name | Non-PII | - | Permanent |
| Budget | **Confidential** | - | Permanent (financial data) |
| StartDate | Non-PII | - | Permanent |
| InstructorID | Non-PII | - | Permanent |
| ConcurrencyToken | Technical | - | Automatic |

**Data Protection Notes:**
- Budget information may be confidential depending on institutional policy
- Not FERPA/GDPR protected but may require role-based access controls

---

### OfficeAssignment

**Purpose:** Tracks physical office locations for instructors  
**Table Name:** `OfficeAssignments`  
**Access Pattern:** COLD - Low read/write frequency

#### Schema

| Column Name | Data Type | Max Length | Nullable | Default | Constraints | Database Type |
|------------|-----------|------------|----------|---------|-------------|---------------|
| **InstructorID** | int | - | NOT NULL | - | Primary Key, Foreign Key to Instructor | int |
| **Location** | string | 50 | NULLABLE | - | StringLength(50) | nvarchar(50) |

**Notes:**
- Uses `InstructorID` as both primary key and foreign key (1:1 relationship)
- No auto-increment ID - tied to Instructor entity
- Optional relationship - not all instructors have office assignments

#### Relationships

| Relationship | Type | Target Entity | Navigation Property | Cascade |
|--------------|------|---------------|---------------------|---------|
| Belongs to Instructor | 1:1 | Instructor | `Instructor Instructor` | Cascade |

#### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| PK_OfficeAssignments | InstructorID | Clustered, Primary Key | Row identification |

#### PII Classification

| Field | PII Level | GDPR/FERPA | Retention Policy |
|-------|-----------|------------|------------------|
| InstructorID | Non-PII | - | Permanent |
| Location | Non-PII | - | Permanent |

---

### CourseInstructor (Junction Table)

**Purpose:** Many-to-many relationship between Courses and Instructors  
**Table Name:** `CourseInstructor`  
**Access Pattern:** WARM - Moderate read volume for course-instructor queries

#### Schema

| Column Name | Data Type | Max Length | Nullable | Default | Constraints | Database Type |
|------------|-----------|------------|----------|---------|-------------|---------------|
| **CoursesCourseID** | int | - | NOT NULL | - | Part of Composite PK, FK to Course | int |
| **InstructorsID** | int | - | NOT NULL | - | Part of Composite PK, FK to Instructor | int |

**Notes:**
- Auto-generated by EF Core for many-to-many relationship
- Composite primary key on `(CoursesCourseID, InstructorsID)`
- No auto-increment ID column
- No additional columns beyond foreign keys

#### Relationships

| Relationship | Type | Target Entity | Navigation Property | Cascade |
|--------------|------|---------------|---------------------|---------|
| References Course | N:1 | Course | *(No navigation)* | Cascade |
| References Instructor | N:1 | Instructor | *(No navigation)* | Cascade |

#### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| PK_CourseInstructor | (CoursesCourseID, InstructorsID) | Clustered, Primary Key | Relationship identification |
| IX_CourseInstructor_InstructorsID | InstructorsID | Non-clustered | Foreign key lookups |

#### PII Classification

| Field | PII Level | GDPR/FERPA | Retention Policy |
|-------|-----------|------------|------------------|
| CoursesCourseID | Non-PII | - | Permanent |
| InstructorsID | Non-PII | - | Permanent |

---

## Relationships & Foreign Keys

### Relationship Matrix

| From Entity | Relationship Type | To Entity | Foreign Key | Cascade Delete | Notes |
|-------------|-------------------|-----------|-------------|----------------|-------|
| Student | 1:N | Enrollment | Enrollment.StudentID → Student.ID | CASCADE | Deleting student deletes enrollments |
| Course | 1:N | Enrollment | Enrollment.CourseID → Course.CourseID | CASCADE | Deleting course deletes enrollments |
| Department | 1:N | Course | Course.DepartmentID → Department.DepartmentID | CASCADE | Deleting department deletes courses |
| Instructor | 1:0..1 | OfficeAssignment | OfficeAssignment.InstructorID → Instructor.ID | CASCADE | Deleting instructor deletes office |
| Instructor | N:0..1 | Department | Department.InstructorID → Instructor.ID | NO ACTION | Department administrator is optional |
| Course | N:M | Instructor | CourseInstructor junction table | CASCADE (both FKs) | Many-to-many via junction |

### Foreign Key Details

#### FK_Enrollments_Student_StudentID
- **Table:** Enrollments
- **Column:** StudentID
- **References:** Student(ID)
- **On Delete:** CASCADE
- **On Update:** NO ACTION (default)
- **Index:** IX_Enrollments_StudentID

#### FK_Enrollments_Course_CourseID
- **Table:** Enrollments
- **Column:** CourseID
- **References:** Course(CourseID)
- **On Delete:** CASCADE
- **On Update:** NO ACTION (default)
- **Index:** IX_Enrollments_CourseID

#### FK_Course_Departments_DepartmentID
- **Table:** Course
- **Column:** DepartmentID
- **References:** Departments(DepartmentID)
- **On Delete:** CASCADE
- **On Update:** NO ACTION (default)
- **Index:** IX_Course_DepartmentID

#### FK_Departments_Instructor_InstructorID
- **Table:** Departments
- **Column:** InstructorID
- **References:** Instructor(ID)
- **On Delete:** NO ACTION
- **On Update:** NO ACTION (default)
- **Index:** IX_Departments_InstructorID

#### FK_OfficeAssignments_Instructor_InstructorID
- **Table:** OfficeAssignments
- **Column:** InstructorID
- **References:** Instructor(ID)
- **On Delete:** CASCADE
- **On Update:** NO ACTION (default)
- **Index:** PK_OfficeAssignments (same as PK)

#### FK_CourseInstructor_Course_CoursesCourseID
- **Table:** CourseInstructor
- **Column:** CoursesCourseID
- **References:** Course(CourseID)
- **On Delete:** CASCADE
- **On Update:** NO ACTION (default)
- **Index:** PK_CourseInstructor (part of composite PK)

#### FK_CourseInstructor_Instructor_InstructorsID
- **Table:** CourseInstructor
- **Column:** InstructorsID
- **References:** Instructor(ID)
- **On Delete:** CASCADE
- **On Update:** NO ACTION (default)
- **Index:** IX_CourseInstructor_InstructorsID

### Referential Integrity Notes

**Cascade Delete Chains:**
1. **Deleting a Student:**
   - → Deletes all associated Enrollments
   - No impact on Courses

2. **Deleting a Course:**
   - → Deletes all associated Enrollments
   - → Deletes CourseInstructor assignments
   - No impact on Students or Instructors

3. **Deleting a Department:**
   - → Deletes all Courses in the department
   - → Cascades to delete all Enrollments for those courses
   - → Cascades to delete all CourseInstructor assignments
   - **⚠️ Potentially destructive - requires soft delete or safeguards**

4. **Deleting an Instructor:**
   - → Deletes associated OfficeAssignment
   - → Deletes CourseInstructor assignments
   - **⚠️ If instructor is a department administrator, FK_Departments_Instructor_InstructorID prevents deletion (NO ACTION)**
   - Workaround: Set Department.InstructorID = NULL before deleting instructor

---

## Indexes

### Index Inventory

| Table | Index Name | Columns | Type | Clustered | Unique | Purpose |
|-------|------------|---------|------|-----------|--------|---------|
| Student | PK_Student | ID | Primary Key | Yes | Yes | Row identification |
| Instructor | PK_Instructor | ID | Primary Key | Yes | Yes | Row identification |
| Course | PK_Course | CourseID | Primary Key | Yes | Yes | Row identification |
| Course | IX_Course_DepartmentID | DepartmentID | Foreign Key | No | No | Department lookups |
| Enrollment | PK_Enrollments | EnrollmentID | Primary Key | Yes | Yes | Row identification |
| Enrollment | IX_Enrollments_CourseID | CourseID | Foreign Key | No | No | Course enrollments |
| Enrollment | IX_Enrollments_StudentID | StudentID | Foreign Key | No | No | Student enrollments |
| Department | PK_Departments | DepartmentID | Primary Key | Yes | Yes | Row identification |
| Department | IX_Departments_InstructorID | InstructorID | Foreign Key | No | No | Administrator lookups |
| OfficeAssignment | PK_OfficeAssignments | InstructorID | Primary Key | Yes | Yes | Row identification |
| CourseInstructor | PK_CourseInstructor | (CoursesCourseID, InstructorsID) | Primary Key | Yes | Yes | Relationship identification |
| CourseInstructor | IX_CourseInstructor_InstructorsID | InstructorsID | Foreign Key | No | No | Instructor course lookups |

**Total Indexes:** 12 (7 primary keys + 5 foreign key indexes)

### Index Performance Notes

**Missing Indexes (Recommendations):**

1. **Enrollment (StudentID, CourseID)** - Composite unique index
   - **Purpose:** Prevent duplicate enrollments
   - **Query Pattern:** Enrollment validation
   - **DDL:** `CREATE UNIQUE INDEX UX_Enrollments_Student_Course ON Enrollments(StudentID, CourseID)`

2. **Enrollment (Grade)** - Non-clustered index
   - **Purpose:** Grade-based reporting queries
   - **Query Pattern:** Honor roll, failing students, GPA calculations
   - **DDL:** `CREATE INDEX IX_Enrollments_Grade ON Enrollments(Grade) WHERE Grade IS NOT NULL`

3. **Student (LastName, FirstName)** - Composite non-clustered index
   - **Purpose:** Name-based searches and sorting
   - **Query Pattern:** Student directory, search functionality
   - **DDL:** `CREATE INDEX IX_Student_Name ON Student(LastName, FirstName)`

4. **Instructor (LastName, FirstName)** - Composite non-clustered index
   - **Purpose:** Name-based searches and sorting
   - **Query Pattern:** Instructor directory, search functionality
   - **DDL:** `CREATE INDEX IX_Instructor_Name ON Instructor(LastName, FirstName)`

5. **Course (Title)** - Non-clustered index
   - **Purpose:** Course catalog searches
   - **Query Pattern:** Title-based filtering
   - **DDL:** `CREATE INDEX IX_Course_Title ON Course(Title)`

**Index Maintenance:**
- Rebuild indexes during low-traffic periods
- Monitor index fragmentation (SQL Server maintenance plans)
- Consider filtered indexes for large tables with selective queries

---

## Data Volume Estimates

### Current Seed Data Volumes

| Table | Seed Rows | Description |
|-------|-----------|-------------|
| Student | 8 | Sample students (Carson Alexander, Meredith Alonso, etc.) |
| Instructor | 5 | Faculty members (Kim Abercrombie, Fadi Fakhouri, etc.) |
| Course | 7 | Courses across 4 departments (Chemistry, Calculus, etc.) |
| Enrollment | 11 | Student course enrollments with grades |
| Department | 4 | Academic departments (English, Mathematics, Engineering, Economics) |
| OfficeAssignment | 3 | Office locations for 3 instructors |
| CourseInstructor | ~10-15 | Estimated based on course-instructor relationships |
| **Total** | **38-43** | Initial seed data |

### Production Volume Projections (Placeholder)

**⚠️ REQUIRES ANALYSIS:** The following are typical university system volumes. Actual values must be confirmed with stakeholders.

**Data Collection Methods:**
1. **SQL Queries for Existing Systems:**
   ```sql
   -- Get current row counts
   SELECT t.name AS TableName, p.rows AS RowCount
   FROM sys.tables t
   INNER JOIN sys.partitions p ON t.object_id = p.object_id
   WHERE p.index_id IN (0,1)
   ORDER BY p.rows DESC;
   
   -- Get table size and growth
   SELECT 
       t.name AS TableName,
       SUM(a.total_pages) * 8 / 1024 AS SizeMB,
       p.rows AS RowCount
   FROM sys.tables t
   INNER JOIN sys.indexes i ON t.object_id = i.object_id
   INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
   INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
   GROUP BY t.name, p.rows
   ORDER BY SizeMB DESC;
   ```

2. **Stakeholder Interview Questions:**
   - Current active student count and historical retention policy
   - Average courses per student per term
   - Number of academic terms per year
   - Faculty size and turnover rate
   - Historical data retention requirements

| Table | Estimated Rows (Small University) | Estimated Rows (Medium University) | Growth Rate | Notes |
|-------|-----------------------------------|-------------------------------------|-------------|-------|
| Student | 5,000 - 10,000 | 20,000 - 50,000 | +10% annually | Current + alumni if retained |
| Instructor | 200 - 500 | 1,000 - 3,000 | +5% annually | Faculty and adjuncts |
| Course | 500 - 1,000 | 2,000 - 5,000 | Stable | Course catalog |
| Enrollment | 50,000 - 100,000 | 500,000 - 1,000,000 | +10-15% annually | Historical enrollments accumulate |
| Department | 10 - 30 | 50 - 100 | Stable | Academic divisions |
| OfficeAssignment | 150 - 400 | 800 - 2,500 | +5% annually | ~80% of instructors |
| CourseInstructor | 1,000 - 2,500 | 5,000 - 15,000 | Stable | Course offerings per term |

**Data Retention Assumptions:**
- Student records: Retained indefinitely (alumni records)
- Enrollment records: Retained indefinitely (academic transcripts)
- Historical courses: Archived after 10 years (configurable)

**Storage Estimates:**
- Small University: ~500 MB - 1 GB database size
- Medium University: ~5 GB - 20 GB database size
- Average row size: ~200-500 bytes per entity (including indexes)

---

## Hot vs Cold Tables

### Table Temperature Classification

| Table | Temperature | Read Frequency | Write Frequency | Justification |
|-------|-------------|----------------|-----------------|---------------|
| **Enrollment** | 🔥 HOT | Very High | Very High | Core transactional table, updated during registration and grading periods |
| **Student** | 🔥 HOT | High | High | Frequent lookups for enrollment, profile updates, searches |
| **Course** | 🔥 HOT | High | Medium | Heavily queried for course catalogs, enrollment screens |
| **Instructor** | 🔥 HOT | High | Medium | Frequent lookups for course assignments, admin screens |
| **CourseInstructor** | 🟡 WARM | Medium | Medium | Read for schedule displays, updated during term planning |
| **Department** | 🟡 WARM | Medium | Low | Reference data, infrequent updates |
| **OfficeAssignment** | ❄️ COLD | Low | Very Low | Rarely accessed, updated only when offices change |

### Performance Optimization Strategies

#### HOT Tables (Enrollment, Student, Course, Instructor)
- **Indexing:** Comprehensive index coverage for common query patterns
- **Partitioning:** Consider table partitioning by term/year for Enrollment (large datasets)
- **Caching:** Implement application-level caching (Redis, in-memory) for Course and Instructor lookups
- **Read Replicas:** Use read replicas for reporting queries to offload primary database
- **Query Optimization:** Avoid SELECT * queries, use projection to minimize I/O
- **Connection Pooling:** Configure aggressive connection pooling (100+ connections)

#### WARM Tables (CourseInstructor, Department)
- **Indexing:** Standard foreign key indexes sufficient
- **Caching:** Application-level caching with longer TTL (5-10 minutes)
- **Monitoring:** Track slow queries, optimize as needed

#### COLD Tables (OfficeAssignment)
- **Indexing:** Primary key index sufficient
- **Archiving:** Not applicable (current data remains relevant)
- **No special optimization needed**

### Materialized Views (Denormalization Opportunities)

**Recommendation:** Consider materialized views for performance optimization

#### 1. EnrollmentSummaryByStudent
```sql
CREATE VIEW vw_EnrollmentSummaryByStudent AS
SELECT 
    s.ID AS StudentID,
    s.LastName,
    s.FirstName,
    COUNT(e.EnrollmentID) AS TotalEnrollments,
    AVG(CASE e.Grade WHEN 0 THEN 4.0 WHEN 1 THEN 3.0 WHEN 2 THEN 2.0 WHEN 3 THEN 1.0 WHEN 4 THEN 0.0 END) AS GPA
FROM Student s
LEFT JOIN Enrollment e ON s.ID = e.StudentID
GROUP BY s.ID, s.LastName, s.FirstName;
```
**Purpose:** Student dashboard, performance reports  
**Refresh Strategy:** Real-time (computed view) or cached hourly

#### 2. CourseEnrollmentCounts
```sql
CREATE VIEW vw_CourseEnrollmentCounts AS
SELECT 
    c.CourseID,
    c.Title,
    d.Name AS DepartmentName,
    COUNT(e.EnrollmentID) AS EnrollmentCount
FROM Course c
INNER JOIN Department d ON c.DepartmentID = d.DepartmentID
LEFT JOIN Enrollment e ON c.CourseID = e.CourseID
GROUP BY c.CourseID, c.Title, d.Name;
```
**Purpose:** Course capacity planning, enrollment reports  
**Refresh Strategy:** Daily or on-demand

#### 3. InstructorCourseLoad
```sql
CREATE VIEW vw_InstructorCourseLoad AS
SELECT 
    i.ID AS InstructorID,
    i.LastName,
    i.FirstName,
    COUNT(ci.CoursesCourseID) AS CourseCount,
    STRING_AGG(c.Title, ', ') AS CourseList
FROM Instructor i
LEFT JOIN CourseInstructor ci ON i.ID = ci.InstructorsID
LEFT JOIN Course c ON ci.CoursesCourseID = c.CourseID
GROUP BY i.ID, i.LastName, i.FirstName;
```
**Purpose:** Faculty workload reports  
**Refresh Strategy:** Weekly or on-demand

**Implementation Note:** SQL Server supports indexed views with `WITH SCHEMABINDING`, which function as materialized views. Indexed views physically persist the aggregated data and automatically update when base tables change. For optimal performance:
- Use `WITH SCHEMABINDING` to bind the view to the schema
- Create a unique clustered index on the view
- Consider `WITH (NOEXPAND)` hint in queries on Standard Edition
- Alternatively, use application-level caching (Redis, in-memory) for more flexibility

---

## PII Classification

### Summary Table

| Entity | Fields with PII | Classification | Regulation | Data Subject Rights |
|--------|-----------------|----------------|------------|---------------------|
| **Student** | LastName, FirstName, EnrollmentDate | PII - High | FERPA | Right to access, rectify, delete (with transcript implications) |
| **Instructor** | LastName, FirstName, HireDate | PII - High | HR/Employment Law | Right to access, rectify |
| **Enrollment** | StudentID, Grade | PII - High | FERPA | Right to access, rectify, delete (with transcript implications) |
| **Course** | *(None)* | Non-PII | - | - |
| **Department** | Budget (Confidential) | Confidential | Internal Policy | Restricted access |
| **OfficeAssignment** | *(None)* | Non-PII | - | - |
| **CourseInstructor** | *(None)* | Non-PII | - | - |

### FERPA Compliance Considerations

**Family Educational Rights and Privacy Act (FERPA) Protection:**

All personally identifiable information from education records is protected under FERPA:
- Student names (first, last)
- Enrollment dates
- Course enrollments
- Grades and academic performance
- Academic transcripts (derived from Enrollment data)

**Required Controls:**
1. **Access Control:** Role-based access to student records
2. **Audit Logging:** Log all access to student PII
3. **Consent Management:** Obtain consent for directory information disclosure
4. **Data Minimization:** Only collect necessary information
5. **Retention Policies:** Define retention periods for academic records
6. **Right to Inspect:** Students must be able to review their records
7. **Amendment Rights:** Students can request corrections to inaccurate records

**Directory Information Exception:**
- Name, enrollment dates may be disclosed without consent if designated as "directory information"
- Requires annual notification to students with opt-out option

### GDPR Considerations (if applicable)

If the university operates in EU or processes EU citizen data:

**Data Subject Rights:**
1. **Right to Access:** Provide copy of all personal data upon request
2. **Right to Rectification:** Correct inaccurate personal data
3. **Right to Erasure:** Delete personal data (conflicts with academic record retention - legal basis required)
4. **Right to Data Portability:** Provide data in machine-readable format
5. **Right to Object:** Allow objection to processing (limited applicability for education)

**Legal Basis for Processing:**
- **Contract Performance:** Student enrollment constitutes a contract
- **Legal Obligation:** Academic record retention required by accreditation
- **Legitimate Interest:** University operations and educational mission

**Data Protection Impact Assessment (DPIA):**
- Recommended for Student and Enrollment tables due to high-risk PII processing

### Recommended Data Protection Measures

#### 1. Encryption
- **At Rest:** Transparent Data Encryption (TDE) for SQL Server database
- **In Transit:** TLS 1.2+ for all database connections
- **Application Level:** Encrypted connection strings, secure key management (Azure Key Vault)

#### 2. Access Controls
- **Principle of Least Privilege:** Grant minimum necessary permissions
- **Role-Based Access Control (RBAC):**
  - `Student` role: Read own records only
  - `Instructor` role: Read enrolled students in their courses
  - `Registrar` role: Full CRUD on Student, Enrollment
  - `Administrator` role: Full access with audit logging

#### 3. Audit Logging
- **SQL Server Audit:** Enable auditing for all SELECT, INSERT, UPDATE, DELETE on Student, Enrollment
- **Application Logging:** Log user identity, action, timestamp, affected records
- **Retention:** Retain audit logs for 7 years (typical compliance requirement)

#### 4. Data Masking
- **Dynamic Data Masking:** Mask PII in non-production environments
- **Pseudonymization:** Replace real names with synthetic data for testing

#### 5. Backup Security
- **Encrypted Backups:** Encrypt all database backups
- **Secure Storage:** Store backups in access-controlled locations (Azure Blob with RBAC)
- **Retention Policy:** Define retention periods (e.g., 7 years for academic records)

---

## Migration Considerations

### Data Type Mapping & Compatibility

| C# Type | Database Type | SQL Server Type | Notes | Migration Concerns |
|---------|---------------|-----------------|-------|-------------------|
| int | int | int | 4-byte signed integer | No issues |
| string | nvarchar(n) | nvarchar(n) | Unicode variable-length | Ensure UTF-8/UTF-16 encoding consistency |
| DateTime | datetime2 | datetime2(7) | 8-byte, precision 100ns | Timezone handling required (see below) |
| decimal | money | money | Fixed-point, 19,4 precision | Rounding behavior differences vs decimal(18,2) |
| byte[] | rowversion | rowversion | 8-byte auto-incrementing | Not portable to non-SQL Server databases |
| int (enum) | int | int | Enum stored as integer | Ensure enum mappings preserved |

### Timezone Handling

**Current State:**
- All DateTime fields stored as **datetime2 without timezone information**
- Application assumes **local server timezone** (likely UTC or server local time)
- No explicit timezone conversion logic in code

**Migration Risks:**
1. **Data Loss:** Timezone information not captured
   - EnrollmentDate: Date-only field, timezone irrelevant ✅
   - HireDate: Date-only field, timezone irrelevant ✅
   - StartDate: Date-only field, timezone irrelevant ✅
   - **Low Risk:** All dates are "date-only" without time components

2. **Daylight Saving Time (DST) Issues:**
   - Not applicable for date-only fields ✅

**Recommendations:**
- **Current Design Sufficient:** Date-only fields do not require timezone handling
- **Future Enhancement:** If adding time-stamped fields (e.g., enrollment timestamp), use:
  - `datetimeoffset` type in SQL Server (includes timezone offset)
  - Store all timestamps in UTC and convert to user timezone in application layer

### Nullability Considerations

| Table | Column | Nullable | Migration Risk | Recommendation |
|-------|--------|----------|----------------|----------------|
| Student | LastName | NOT NULL | Low | Enforce required validation in application |
| Student | FirstName | NOT NULL | Low | Enforce required validation in application |
| Instructor | LastName | NOT NULL | Low | Enforce required validation in application |
| Instructor | FirstName | NOT NULL | Low | Enforce required validation in application |
| Course | Title | **NULLABLE** | Medium | Consider making NOT NULL for data integrity |
| Enrollment | Grade | **NULLABLE** | Low | Expected - allows pending grades |
| Department | Name | **NULLABLE** | Medium | Consider making NOT NULL for data integrity |
| Department | InstructorID | **NULLABLE** | Low | Expected - administrator is optional |
| OfficeAssignment | Location | **NULLABLE** | Low | Expected - location may be unassigned |

**Migration Actions:**
1. **Course.Title:** Review existing data for NULL values, backfill with placeholder ("Untitled Course"), add NOT NULL constraint
2. **Department.Name:** Review existing data for NULL values, backfill with placeholder ("Unnamed Department"), add NOT NULL constraint
3. **Add CHECK constraints** to enforce business rules (e.g., Budget >= 0)

### Character Encoding

**Current Encoding:**
- SQL Server `nvarchar`: UTF-16 encoding (2 bytes per character)
- String columns: Store international characters (Unicode support) ✅

**Migration Considerations:**
- **Unicode Support:** Maintained across migration ✅
- **Collation:** Default collation (`SQL_Latin1_General_CP1_CI_AS`)
  - CI = Case Insensitive
  - AS = Accent Sensitive
- **Migration to Non-SQL Server:**
  - PostgreSQL: Use `text` or `varchar` with UTF-8 encoding
  - MySQL: Use `varchar` with `utf8mb4` charset
  - **Action:** Test special characters (é, ñ, 中文, etc.) after migration

### Primary Key Strategy

**Current Design:**
- **Identity Columns:** Student.ID, Instructor.ID, Enrollment.EnrollmentID, Department.DepartmentID
  - Auto-increment starting at 1, increment by 1
  - SQL Server IDENTITY specification
- **Manual Assignment:** Course.CourseID (DatabaseGenerated.None)
  - Application must provide values
  - No automatic generation

**Migration Considerations:**
1. **Identity Seed Preservation:**
   - Capture current identity values before migration
   - Set identity seed after migration: `DBCC CHECKIDENT ('TableName', RESEED, <current_max_value>)`

2. **Manual CourseID Management:**
   - ⚠️ **HIGH RISK:** Application must assign unique CourseIDs (no auto-generation)
   - **Potential for ID conflicts** in distributed scenarios or multi-source imports
   - **Mitigation Strategies:**
     - Implement centralized ID assignment service or database sequence
     - Use range allocation (e.g., Department A: 1000-1999, Department B: 2000-2999)
     - Add application-level validation to check for existing CourseID before insert
     - Consider switching to IDENTITY for auto-generation if manual assignment is not required
     - Document CourseID assignment rules and ranges

3. **GUIDs vs Integer IDs:**
   - Current design uses integer IDs (space-efficient, human-readable)
   - Alternative: Use GUIDs (uuid) for distributed systems, replication
   - **Recommendation:** Keep integer IDs for simplicity unless distributed architecture required

### Concurrency Control

**Current Implementation:**
- **Department Table Only:** Uses `rowversion` (ConcurrencyToken) for optimistic locking
- **Other Tables:** No concurrency control

**Migration Considerations:**
1. **Preserve rowversion Behavior:**
   - `rowversion` is SQL Server-specific
   - **PostgreSQL Equivalent:** Use `xmin` system column or trigger-based version column
   - **MySQL Equivalent:** Use `TIMESTAMP` with `ON UPDATE CURRENT_TIMESTAMP`

2. **Expand Concurrency Control:**
   - Consider adding version columns to Student, Instructor, Course for concurrent edit scenarios
   - Alternative: Use application-level locking (pessimistic locks)

### Foreign Key Cascade Behavior

**Critical Migration Consideration:**
- Multiple cascade delete paths can cause conflicts in some databases
- **SQL Server:** Handles cascade chains correctly
- **PostgreSQL:** May require explicit triggers for complex cascades
- **MySQL:** May hit circular reference errors

**Cascade Chain Example:**
```
Department DELETE
  → Course DELETE (FK_Course_Departments_DepartmentID)
    → Enrollment DELETE (FK_Enrollments_Course_CourseID)
      ⚠️ Potential conflict if Student also deleted simultaneously
```

**Recommendations:**
1. **Soft Deletes:** Consider implementing soft delete pattern
   - Add `IsDeleted` (bit) and `DeletedAt` (datetime2) columns
   - Use filtered indexes to exclude deleted records
   - Preserves referential integrity and audit trail

2. **Delete Safeguards:**
   - Add application-level confirmation for cascade deletes
   - Log all cascaded deletions for audit trail
   - Consider two-step deletion (archive, then delete)

### Data Migration Steps

#### Pre-Migration
1. **Backup:** Full database backup with verification
2. **Audit:** Document current row counts, constraints, indexes
3. **Test Environment:** Replicate production data to test migration scripts
4. **Downtime Planning:** Schedule maintenance window

#### Migration Execution
1. **Schema Migration:**
   - Run EF Core migrations in target environment
   - Verify all tables, columns, indexes created

2. **Data Migration:**
   - Export data using BCP, SSIS, or EF Core data seeding
   - Validate row counts match source

3. **Identity Reseed:**
   - Set identity seed values to current maximum + 1

4. **Constraint Validation:**
   - Re-enable foreign key constraints
   - Validate no orphaned records

5. **Index Rebuild:**
   - Rebuild all indexes for optimal performance

#### Post-Migration
1. **Smoke Tests:**
   - Verify CRUD operations on all entities
   - Test cascade delete behavior
   - Validate concurrency control (Department edits)

2. **Performance Testing:**
   - Run query performance benchmarks
   - Validate index usage with execution plans

3. **Data Validation:**
   - Compare row counts, checksums between source and target
   - Validate PII field values preserved

4. **Rollback Plan:**
   - Keep source database backup available for 72 hours
   - Document rollback procedure (restore from backup)

### Migration Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Data Loss** | Critical | Low | Multiple backups, validation scripts, dry runs |
| **Orphaned Records** | High | Medium | Referential integrity checks, constraint validation |
| **Identity Collision** | High | Low | Reseed identities, test inserts post-migration |
| **Encoding Issues** | Medium | Medium | Test special characters, validate collation |
| **Performance Degradation** | Medium | Medium | Index optimization, query tuning, load testing |
| **Downtime Overrun** | Medium | High | Rehearse migration, parallel cutover, rollback plan |
| **PII Exposure** | Critical | Low | Encrypt backups, secure migration tools, audit access |

---

## Schema Evolution History

### Migration Timeline

| Migration ID | Date | Description | Changes |
|--------------|------|-------------|---------|
| **20220226005057_InitialCreate** | 2022-02-26 | Initial database schema | Created all 7 tables, relationships, indexes |
| **20220226012101_RowVersion** | 2022-02-26 | Add concurrency control | Added ConcurrencyToken (rowversion) to Department table |

### Migration Details

#### Migration 1: InitialCreate (20220226005057)

**Created Tables:**
1. **Instructor** (ID, LastName, FirstName, HireDate)
2. **Student** (ID, LastName, FirstName, EnrollmentDate)
3. **Departments** (DepartmentID, Name, Budget, StartDate, InstructorID)
4. **OfficeAssignments** (InstructorID, Location)
5. **Course** (CourseID, Title, Credits, DepartmentID)
6. **CourseInstructor** (CoursesCourseID, InstructorsID)
7. **Enrollments** (EnrollmentID, CourseID, StudentID, Grade)

**Created Indexes:**
- IX_Course_DepartmentID
- IX_CourseInstructor_InstructorsID
- IX_Departments_InstructorID
- IX_Enrollments_CourseID
- IX_Enrollments_StudentID

**Foreign Keys:**
- 7 foreign key constraints (see Relationships section)

**Total Schema Changes:** 7 tables created, 12 indexes (7 PK + 5 FK), 7 foreign keys

#### Migration 2: RowVersion (20220226012101)

**Schema Change:**
- Added `ConcurrencyToken` column to `Departments` table
  - Type: `rowversion`
  - Nullable: Yes
  - Purpose: Optimistic concurrency control

**Impact:**
- Enables detection of concurrent edits to department records
- Automatically managed by SQL Server (updated on every modification)
- Breaking change: Existing code must handle `DbUpdateConcurrencyException`

**Total Schema Changes:** 1 column added

### Future Migration Considerations

**Recommended Schema Enhancements:**

1. **Soft Delete Support**
   - Add `IsDeleted` (bit) and `DeletedAt` (datetime2) to all entities
   - Add filtered indexes: `WHERE IsDeleted = 0`

2. **Audit Columns**
   - Add `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy` to all entities
   - Use EF Core interceptors to auto-populate

3. **Unique Constraints**
   - Add unique constraint on `(StudentID, CourseID)` in Enrollment to prevent duplicate enrollments
   - Add unique constraint on `Name` in Department to prevent duplicate department names

4. **Check Constraints**
   - Add check constraint on `Department.Budget` to ensure >= 0
   - Add check constraint on `Course.Credits` to ensure Range(0, 5)

5. **Full-Text Search**
   - Add full-text indexes on `Student.LastName`, `Student.FirstName` for search optimization
   - Add full-text indexes on `Instructor.LastName`, `Instructor.FirstName`
   - Add full-text index on `Course.Title`

6. **Archival Strategy**
   - Create `EnrollmentHistory` table for completed enrollments (archive after graduation)
   - Partition `Enrollment` table by academic year for large datasets

### Schema Rollback Procedures

**⚠️ CRITICAL WARNING:** Always backup database before rollback operations. The order of operations is important to prevent data loss.

**Rollback Migration 2 (RowVersion):**
```bash
# Step 1: Rollback database schema FIRST
dotnet ef database update 20220226005057_InitialCreate

# Step 2: (Optional) Remove migration file from project
dotnet ef migrations remove
```

**Rollback Migration 1 (InitialCreate):**
```bash
# This command drops ALL tables and data
dotnet ef database update 0
```
**⚠️ EXTREME WARNING:** Rolling back InitialCreate drops all tables and permanently deletes all data. This operation:
- Removes all 7 tables
- Deletes all relationships and indexes
- Cannot be undone without a backup
- Should NEVER be performed in production without explicit approval and verified backup

**Best Practice Rollback Procedure:**
1. Create a full database backup: `BACKUP DATABASE [SchoolContext] TO DISK = 'backup.bak'`
2. Document current state (row counts, schema version)
3. Execute rollback in development environment first
4. Test application functionality after rollback
5. If successful, proceed with production rollback during maintenance window
6. Keep backup for 72 hours minimum after rollback

---

## ETL/ELT & Data Pipeline Notes

**Current State:**
- ❌ No ETL/ELT jobs found in repository
- ❌ No data pipeline configuration
- ❌ No backup scripts committed

**Seed Data Initialization:**
- `DbInitializer.Initialize()` method seeds initial data
- Runs on application startup if database is empty
- **Not suitable for production data loading**

**Recommended Data Pipelines:**

### 1. Student Data Import Pipeline
**Source:** Student Information System (SIS) or CSV files  
**Frequency:** Nightly during registration periods  
**Process:**
1. Extract student records from SIS
2. Transform: Validate data, normalize names, format dates
3. Load: Upsert to Student table (INSERT if new, UPDATE if existing)
4. Audit: Log import counts, errors

**Tools:** Azure Data Factory, SSIS, or custom .NET console app

### 2. Enrollment Import Pipeline
**Source:** SIS enrollment data  
**Frequency:** Hourly during registration periods  
**Process:**
1. Extract enrollment transactions
2. Validate: Check student exists, course exists, prevent duplicates
3. Load: INSERT to Enrollment table
4. Audit: Log enrollment counts, conflicts

### 3. Grade Import Pipeline
**Source:** Faculty grade submissions (CSV, web API)  
**Frequency:** End of term  
**Process:**
1. Extract grade data
2. Validate: Check enrollment exists, grade in valid range
3. Load: UPDATE Enrollment.Grade
4. Audit: Log grade changes, faculty approvals

### 4. Backup & Recovery
**Backup Schedule:**
- **Full Backup:** Daily at 2:00 AM
- **Differential Backup:** Every 6 hours
- **Transaction Log Backup:** Every 15 minutes (if using FULL recovery model)

**Retention Policy:**
- Daily backups: 30 days
- Weekly backups: 1 year
- Annual backups: 7 years (compliance)

**Backup Script (SQL Server):**
```sql
BACKUP DATABASE [SchoolContext] 
TO DISK = 'C:\Backups\SchoolContext_Full.bak' 
WITH INIT, COMPRESSION, STATS = 10;
```

---

## Summary & Recommendations

### Key Findings

✅ **Strengths:**
- Clean, normalized schema with proper relationships
- Optimistic concurrency control on critical tables (Department)
- Comprehensive foreign key constraints maintain referential integrity
- EF Core migrations provide schema version control

⚠️ **Areas for Improvement:**
1. **Missing Indexes:** Add composite indexes for Student/Instructor names, Enrollment unique constraint
2. **PII Protection:** Implement encryption, access controls, audit logging for FERPA compliance
3. **Soft Deletes:** Replace cascade deletes with soft delete pattern to preserve data integrity
4. **Audit Columns:** Add CreatedAt, UpdatedAt, CreatedBy, UpdatedBy for change tracking
5. **Data Validation:** Add check constraints for budget, credits, grade values
6. **Backup Strategy:** Implement automated backup scripts and disaster recovery plan
7. **ETL Pipelines:** Develop data import pipelines for production data loads

### Migration Readiness Assessment

| Area | Status | Notes |
|------|--------|-------|
| **Schema Documentation** | ✅ Complete | This document |
| **Data Model Complexity** | ✅ Low | Simple relational model, easy to migrate |
| **Foreign Key Complexity** | ⚠️ Medium | Multiple cascade paths require careful testing |
| **PII Handling** | ⚠️ Medium | Requires encryption, access controls |
| **Data Volume** | ✅ Low | Seed data only, production volumes TBD |
| **Timezone Handling** | ✅ No Issues | Date-only fields, no timezone concerns |
| **Encoding** | ✅ No Issues | Unicode support via nvarchar |
| **Backup/Recovery** | ❌ Not Documented | Requires production backup strategy |
| **Migration Scripts** | ✅ Ready | EF Core migrations available |

**Overall Readiness:** 🟡 **Moderate** - Ready for migration with recommended enhancements

### Next Steps

1. **Immediate Actions (Pre-Migration):**
   - [ ] Conduct production database size analysis
   - [ ] Document current row counts and growth rates
   - [ ] Implement recommended indexes (Student/Instructor name, Enrollment unique)
   - [ ] Add check constraints for data validation
   - [ ] Develop backup and recovery procedures
   - [ ] Create PII data classification matrix for compliance team

2. **Short-Term (Migration Preparation):**
   - [ ] Implement soft delete pattern
   - [ ] Add audit columns (CreatedAt, UpdatedAt)
   - [ ] Develop ETL pipelines for data import
   - [ ] Create migration runbook with rollback procedures
   - [ ] Set up test environment with production-like data volumes
   - [ ] Conduct migration dry run

3. **Long-Term (Post-Migration):**
   - [ ] Implement encryption at rest (TDE)
   - [ ] Configure application-level caching (Redis)
   - [ ] Set up database monitoring and alerting
   - [ ] Implement full-text search for name lookups
   - [ ] Consider table partitioning for Enrollment (large datasets)
   - [ ] Develop data archival strategy for historical records

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-23 | Migration Architect | Initial comprehensive data model catalog |

---

**Related Documents:**
- [00-Project-Overview.md](./00-Project-Overview.md) - Migration project overview
- [01-Architecture-Overview.md](./01-Architecture-Overview.md) - System architecture
- [Technology-Inventory.md](./Technology-Inventory.md) - Technology stack inventory
- [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md) - Compatibility analysis

---

_This document provides a complete catalog of the ContosoUniversity data model for migration planning purposes. All schema details, relationships, and migration considerations have been documented based on Entity Framework Core models, migrations, and seed data analysis._
