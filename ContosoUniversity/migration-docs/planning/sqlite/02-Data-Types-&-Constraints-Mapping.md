---
title: 'Data Types & Constraints Mapping - SQL Server to SQLite'
last_updated: '2025-12-30'
owner: 'Migration Architect'
status: 'Planning'
source_database: 'SQL Server (SchoolContext)'
target_database: 'SQLite'
schema_version: '20220226012101_RowVersion'
---

# Data Types & Constraints Mapping - SQL Server to SQLite

## Executive Summary

This document provides a comprehensive mapping of data types and constraints from the current SQL Server implementation to SQLite for the ContosoUniversity application. SQLite uses a dynamic type system with type affinities (INTEGER, REAL, TEXT, BLOB, NUMERIC), which differs significantly from SQL Server's strict typing system.

**Key Differences:**
- **Type System:** SQLite uses type affinities rather than strict types; values can be stored in columns of any type
- **Precision/Scale:** SQLite REAL and NUMERIC don't enforce precision/scale; application-level validation required
- **Identity Columns:** SQLite uses AUTOINCREMENT with INTEGER PRIMARY KEY instead of IDENTITY
- **Timestamps:** SQLite has no native datetime type; uses TEXT (ISO8601), REAL (Julian day), or INTEGER (Unix time)
- **String Types:** SQLite TEXT is UTF-8/UTF-16; no separate VARCHAR/NVARCHAR; collation handled differently
- **Money Type:** SQL Server's MONEY type must map to SQLite NUMERIC or TEXT with application-level formatting
- **Rowversion/Timestamp:** SQL Server's rowversion requires custom implementation in SQLite

**Migration Strategy:**
- Use Entity Framework Core's SQLite provider for type mapping automation
- Implement application-level validation for precision/scale constraints
- Use TEXT with ISO8601 format for datetime storage
- Implement custom concurrency token strategy for rowversion columns

---

## Table of Contents

- [Type Mapping Overview](#type-mapping-overview)
- [Entity Mappings](#entity-mappings)
  - [Student](#student)
  - [Instructor](#instructor)
  - [Course](#course)
  - [Enrollment](#enrollment)
  - [Department](#department)
  - [OfficeAssignment](#officeassignment)
  - [CourseInstructor (Junction Table)](#courseinstructor-junction-table)
- [Constraint Mapping Details](#constraint-mapping-details)
- [Collation Considerations](#collation-considerations)
- [Timezone Handling](#timezone-handling)
- [Precision and Scale Changes](#precision-and-scale-changes)
- [Migration Risks and Mitigation](#migration-risks-and-mitigation)

---

## Type Mapping Overview

### General Type Mappings

| SQL Server Type | SQLite Type | Type Affinity | Notes |
|----------------|-------------|---------------|-------|
| `int` | `INTEGER` | INTEGER | Direct mapping |
| `nvarchar(n)` | `TEXT` | TEXT | No length enforcement in SQLite; use CHECK constraint or app validation |
| `varchar(n)` | `TEXT` | TEXT | Same as nvarchar; SQLite TEXT is always UTF-8/UTF-16 |
| `datetime2` | `TEXT` | TEXT | Store as ISO8601 string: 'YYYY-MM-DD HH:MM:SS.SSS' |
| `money` | `TEXT` | NUMERIC | Store as TEXT to preserve exact decimal representation, or NUMERIC with rounding awareness |
| `decimal(p,s)` | `TEXT` or `NUMERIC` | NUMERIC | SQLite doesn't enforce precision/scale; TEXT preferred for exact values |
| `rowversion` / `timestamp` | `TEXT` or `BLOB` | BLOB | Requires custom implementation; use GUID or timestamp string |
| `byte[]` (general) | `BLOB` | BLOB | Direct mapping |

### Constraint Mappings

| SQL Server Constraint | SQLite Equivalent | Notes |
|-----------------------|-------------------|-------|
| `PRIMARY KEY` | `PRIMARY KEY` | Direct mapping |
| `IDENTITY(1,1)` | `AUTOINCREMENT` with `INTEGER PRIMARY KEY` | SQLite auto-increments INTEGER PRIMARY KEY by default |
| `FOREIGN KEY` | `FOREIGN KEY` | Must enable with `PRAGMA foreign_keys = ON` |
| `NOT NULL` | `NOT NULL` | Direct mapping |
| `UNIQUE` | `UNIQUE` | Direct mapping |
| `CHECK` | `CHECK` | Direct mapping |
| `DEFAULT` | `DEFAULT` | Direct mapping |

---

## Entity Mappings

### Student

**Table Name:** `Student`  
**Purpose:** Represents enrolled students in the university system

| Column | Current Type (SQL Server) | SQLite Type | Constraint Notes | Migration Notes |
|--------|---------------------------|-------------|------------------|-----------------|
| **ID** | `int` IDENTITY(1,1) | `INTEGER` PRIMARY KEY AUTOINCREMENT | Primary Key, Auto-increment | SQLite will auto-generate sequential integers. No explicit AUTOINCREMENT needed unless avoiding reuse of deleted IDs is critical. |
| **LastName** | `nvarchar(50)` NOT NULL | `TEXT` NOT NULL | Required, MaxLength(50) | Add CHECK constraint: `CHECK(length(LastName) <= 50)` to enforce length limit. |
| **FirstName** | `nvarchar(50)` NOT NULL | `TEXT` NOT NULL | Required, MaxLength(50), Column mapping | Column name is "FirstName" in DB, maps to "FirstMidName" in model. Add CHECK: `CHECK(length(FirstName) <= 50)`. |
| **EnrollmentDate** | `datetime2` NOT NULL | `TEXT` NOT NULL | Date type, Display format 'yyyy-MM-dd' | Store as ISO8601 TEXT: 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DD'. EF Core will handle conversion. No timezone info stored (see Timezone section). |

**Indexes:**
- Primary Key: `PK_Student` on `ID` (clustered in SQL Server, no clustering concept in SQLite)

**Foreign Keys:**
- None (parent table in relationships)

**Relationships:**
- One-to-Many with `Enrollment` table

**Migration Notes:**
- STRING LENGTH: SQLite doesn't enforce `nvarchar(50)` length limits. Add CHECK constraints or rely on EF Core validation.
- DATETIME: Use TEXT with ISO8601 format. EF Core's SQLite provider handles this automatically.
- IDENTITY: Use INTEGER PRIMARY KEY AUTOINCREMENT if avoiding ID reuse is important; otherwise, INTEGER PRIMARY KEY alone suffices.

---

### Instructor

**Table Name:** `Instructor`  
**Purpose:** Represents instructors/faculty members

| Column | Current Type (SQL Server) | SQLite Type | Constraint Notes | Migration Notes |
|--------|---------------------------|-------------|------------------|-----------------|
| **ID** | `int` IDENTITY(1,1) | `INTEGER` PRIMARY KEY AUTOINCREMENT | Primary Key, Auto-increment | Standard auto-increment mapping. |
| **LastName** | `nvarchar(50)` NOT NULL | `TEXT` NOT NULL | Required, MaxLength(50) | Add CHECK: `CHECK(length(LastName) <= 50)`. |
| **FirstName** | `nvarchar(50)` NOT NULL | `TEXT` NOT NULL | Required, MaxLength(50), Column mapping | Column name "FirstName" maps to "FirstMidName" property. Add CHECK: `CHECK(length(FirstName) <= 50)`. |
| **HireDate** | `datetime2` NOT NULL | `TEXT` NOT NULL | Date type, Display format 'yyyy-MM-dd' | Store as ISO8601 TEXT. No timezone (application assumes local or UTC consistently). |

**Indexes:**
- Primary Key: `PK_Instructor` on `ID`

**Foreign Keys:**
- None (parent table in relationships)

**Relationships:**
- One-to-One with `OfficeAssignment`
- Many-to-Many with `Course` (via `CourseInstructor` junction table)
- One-to-Many with `Department` (as Administrator)

**Migration Notes:**
- Same string length and datetime considerations as Student entity.
- Ensure foreign key relationships are preserved during migration.

---

### Course

**Table Name:** `Course`  
**Purpose:** Represents academic courses offered by the university

| Column | Current Type (SQL Server) | SQLite Type | Constraint Notes | Migration Notes |
|--------|---------------------------|-------------|------------------|-----------------|
| **CourseID** | `int` (no IDENTITY) | `INTEGER` PRIMARY KEY | Primary Key, NOT auto-generated | Value is manually assigned (DatabaseGeneratedOption.None). No AUTOINCREMENT. |
| **Title** | `nvarchar(50)` NULL | `TEXT` NULL | MaxLength(50), MinimumLength(3) | Optional field. Add CHECK: `CHECK(Title IS NULL OR (length(Title) >= 3 AND length(Title) <= 50))`. |
| **Credits** | `int` NOT NULL | `INTEGER` NOT NULL | Range(0, 5) | Add CHECK: `CHECK(Credits >= 0 AND Credits <= 5)` to enforce range constraint. |
| **DepartmentID** | `int` NOT NULL | `INTEGER` NOT NULL | Foreign Key to Department | Ensure FK constraint exists: `FOREIGN KEY(DepartmentID) REFERENCES Departments(DepartmentID) ON DELETE CASCADE`. |

**Indexes:**
- Primary Key: `PK_Course` on `CourseID`
- Foreign Key Index: `IX_Course_DepartmentID` on `DepartmentID`

**Foreign Keys:**
- `FK_Course_Departments_DepartmentID`: References `Departments.DepartmentID` with CASCADE delete

**Relationships:**
- Many-to-One with `Department`
- One-to-Many with `Enrollment`
- Many-to-Many with `Instructor` (via `CourseInstructor`)

**Migration Notes:**
- MANUAL PK: CourseID is not auto-generated. Ensure application code or migration scripts populate this field.
- CHECK CONSTRAINTS: Implement Credits range and Title length checks in SQLite.
- NULLABLE TITLE: SQLite handles NULL gracefully; ensure application logic accounts for optional Title.

---

### Enrollment

**Table Name:** `Enrollments`  
**Purpose:** Represents student enrollments in courses

| Column | Current Type (SQL Server) | SQLite Type | Constraint Notes | Migration Notes |
|--------|---------------------------|-------------|------------------|-----------------|
| **EnrollmentID** | `int` IDENTITY(1,1) | `INTEGER` PRIMARY KEY AUTOINCREMENT | Primary Key, Auto-increment | Standard auto-increment mapping. |
| **CourseID** | `int` NOT NULL | `INTEGER` NOT NULL | Foreign Key to Course | FK constraint: `FOREIGN KEY(CourseID) REFERENCES Course(CourseID) ON DELETE CASCADE`. |
| **StudentID** | `int` NOT NULL | `INTEGER` NOT NULL | Foreign Key to Student | FK constraint: `FOREIGN KEY(StudentID) REFERENCES Student(ID) ON DELETE CASCADE`. |
| **Grade** | `int` NULL | `INTEGER` NULL | Enum (0=A, 1=B, 2=C, 3=D, 4=F), Nullable | Store enum as integer. NULL indicates "No grade". Consider CHECK: `CHECK(Grade IS NULL OR (Grade >= 0 AND Grade <= 4))`. |

**Indexes:**
- Primary Key: `PK_Enrollments` on `EnrollmentID`
- Foreign Key Index: `IX_Enrollments_CourseID` on `CourseID`
- Foreign Key Index: `IX_Enrollments_StudentID` on `StudentID`

**Foreign Keys:**
- `FK_Enrollments_Course_CourseID`: References `Course.CourseID` with CASCADE delete
- `FK_Enrollments_Student_StudentID`: References `Student.ID` with CASCADE delete

**Relationships:**
- Many-to-One with `Course`
- Many-to-One with `Student`

**Migration Notes:**
- ENUM STORAGE: SQLite stores enum as INTEGER. EF Core handles conversion between C# enum and integer.
- NULLABLE GRADE: NULL is valid and indicates no grade assigned yet.
- CASCADE DELETE: Both foreign keys have CASCADE delete; ensure this behavior is acceptable (deleting student or course will delete enrollments).

---

### Department

**Table Name:** `Departments`  
**Purpose:** Represents academic departments within the university

| Column | Current Type (SQL Server) | SQLite Type | Constraint Notes | Migration Notes |
|--------|---------------------------|-------------|------------------|-----------------|
| **DepartmentID** | `int` IDENTITY(1,1) | `INTEGER` PRIMARY KEY AUTOINCREMENT | Primary Key, Auto-increment | Standard auto-increment mapping. |
| **Name** | `nvarchar(50)` NULL | `TEXT` NULL | MaxLength(50), MinimumLength(3) | Optional field. Add CHECK: `CHECK(Name IS NULL OR (length(Name) >= 3 AND length(Name) <= 50))`. |
| **Budget** | `money` NOT NULL | `TEXT` NOT NULL | Currency type, Column type "money" | **CRITICAL**: SQL Server money has fixed precision. Use TEXT to store exact decimal string (e.g., "123456.78") or NUMERIC with awareness of potential rounding. EF Core may map to NUMERIC; validate precision requirements. |
| **StartDate** | `datetime2` NOT NULL | `TEXT` NOT NULL | Date type, Display format 'yyyy-MM-dd' | Store as ISO8601 TEXT. |
| **InstructorID** | `int` NULL | `INTEGER` NULL | Foreign Key to Instructor (optional administrator) | FK constraint: `FOREIGN KEY(InstructorID) REFERENCES Instructor(ID) ON DELETE SET NULL` (no cascade). |
| **ConcurrencyToken** | `rowversion` (byte[]) NULL | `TEXT` or `BLOB` NULL | Concurrency token, auto-updated on SQL Server | **CRITICAL**: SQL Server rowversion is auto-generated binary timestamp. SQLite has no equivalent. Options: (1) Use TEXT to store GUID generated by app; (2) Use BLOB for binary data; (3) Use INTEGER for Unix timestamp. EF Core may use a different concurrency mechanism (e.g., timestamp column with manual updates). |

**Indexes:**
- Primary Key: `PK_Departments` on `DepartmentID`
- Foreign Key Index: `IX_Departments_InstructorID` on `InstructorID`

**Foreign Keys:**
- `FK_Departments_Instructor_InstructorID`: References `Instructor.ID` with NO ACTION (nullable, optional administrator)

**Relationships:**
- Many-to-One with `Instructor` (as Administrator, optional)
- One-to-Many with `Course`

**Migration Notes:**
- **MONEY TYPE**: SQL Server money is a fixed-point type (4 decimal places). SQLite has no money type. Options:
  - Store as TEXT: "123456.7890" (exact representation)
  - Store as NUMERIC: May round; test for acceptable precision loss
  - Recommend TEXT for critical financial data to avoid rounding errors
- **ROWVERSION/CONCURRENCY**: This is the most complex mapping:
  - SQL Server rowversion auto-increments on every update
  - SQLite requires manual concurrency token management
  - EF Core's SQLite provider may use a GUID or timestamp column with `[Timestamp]` attribute
  - Test concurrency conflict detection thoroughly after migration
  - Consider using a `LastModified` datetime column or GUID column updated via trigger or app code
- **NULLABLE INSTRUCTOR**: InstructorID is optional (departments may not have an administrator assigned yet)

---

### OfficeAssignment

**Table Name:** `OfficeAssignments`  
**Purpose:** Represents office location assignments for instructors (one-to-one relationship)

| Column | Current Type (SQL Server) | SQLite Type | Constraint Notes | Migration Notes |
|--------|---------------------------|-------------|------------------|-----------------|
| **InstructorID** | `int` NOT NULL | `INTEGER` PRIMARY KEY | Primary Key, Foreign Key to Instructor | This is both PK and FK. FK constraint: `FOREIGN KEY(InstructorID) REFERENCES Instructor(ID) ON DELETE CASCADE`. No AUTOINCREMENT (uses Instructor's ID). |
| **Location** | `nvarchar(50)` NULL | `TEXT` NULL | MaxLength(50) | Optional field. Add CHECK: `CHECK(Location IS NULL OR length(Location) <= 50)`. |

**Indexes:**
- Primary Key: `PK_OfficeAssignments` on `InstructorID`

**Foreign Keys:**
- `FK_OfficeAssignments_Instructor_InstructorID`: References `Instructor.ID` with CASCADE delete

**Relationships:**
- One-to-One with `Instructor` (InstructorID is both PK and FK)

**Migration Notes:**
- **SHARED PRIMARY/FOREIGN KEY**: InstructorID serves as both PK and FK, enforcing the one-to-one relationship.
- **CASCADE DELETE**: Deleting an instructor will delete their office assignment.
- **OPTIONAL LOCATION**: Location can be NULL (instructor may not have an assigned office yet).

---

### CourseInstructor (Junction Table)

**Table Name:** `CourseInstructor`  
**Purpose:** Junction table for many-to-many relationship between Course and Instructor

| Column | Current Type (SQL Server) | SQLite Type | Constraint Notes | Migration Notes |
|--------|---------------------------|-------------|------------------|-----------------|
| **CoursesCourseID** | `int` NOT NULL | `INTEGER` NOT NULL | Part of composite PK, FK to Course | FK constraint: `FOREIGN KEY(CoursesCourseID) REFERENCES Course(CourseID) ON DELETE CASCADE`. |
| **InstructorsID** | `int` NOT NULL | `INTEGER` NOT NULL | Part of composite PK, FK to Instructor | FK constraint: `FOREIGN KEY(InstructorsID) REFERENCES Instructor(ID) ON DELETE CASCADE`. |

**Indexes:**
- Primary Key: `PK_CourseInstructor` on `(CoursesCourseID, InstructorsID)` (composite)
- Foreign Key Index: `IX_CourseInstructor_InstructorsID` on `InstructorsID`

**Foreign Keys:**
- `FK_CourseInstructor_Course_CoursesCourseID`: References `Course.CourseID` with CASCADE delete
- `FK_CourseInstructor_Instructor_InstructorsID`: References `Instructor.ID` with CASCADE delete

**Relationships:**
- Many-to-Many junction: Links courses to instructors

**Migration Notes:**
- **COMPOSITE PRIMARY KEY**: SQLite supports composite primary keys. Define as `PRIMARY KEY(CoursesCourseID, InstructorsID)`.
- **CASCADE DELETE**: Deleting a course or instructor will remove corresponding entries in this junction table.
- **COLUMN NAMES**: EF Core generates these column names based on navigation property names; ensure consistency during migration.

---

## Constraint Mapping Details

### Primary Key Constraints

**SQL Server Behavior:**
- Clustered or non-clustered indexes
- Auto-generates unique constraint
- Supports composite keys

**SQLite Mapping:**
- No clustered vs non-clustered distinction (SQLite always uses B-trees)
- Primary keys are automatically unique
- Composite keys supported: `PRIMARY KEY(col1, col2)`
- `INTEGER PRIMARY KEY` is special: auto-generates rowid if no value provided

**Migration Notes:**
- Remove SQL Server-specific index hints (clustered/non-clustered)
- Use `AUTOINCREMENT` with `INTEGER PRIMARY KEY` for identity columns if avoiding ID reuse is important

### Foreign Key Constraints

**SQL Server Behavior:**
- Enforced by default
- Supports CASCADE, SET NULL, SET DEFAULT, NO ACTION

**SQLite Mapping:**
- Must enable with `PRAGMA foreign_keys = ON` (disabled by default!)
- Supports same referential actions: CASCADE, SET NULL, SET DEFAULT, NO ACTION
- EF Core SQLite provider enables foreign keys automatically

**Migration Notes:**
- Ensure `PRAGMA foreign_keys = ON` is set in SQLite connection string or initialization
- Test cascade delete behavior thoroughly
- Verify referential integrity during data migration

### Unique Constraints

**SQL Server Behavior:**
- Explicit UNIQUE constraint or unique index

**SQLite Mapping:**
- Same syntax: `UNIQUE(column)` or `CREATE UNIQUE INDEX`
- Can be inline or table-level constraint

**Migration Notes:**
- Direct mapping, no special considerations

### Check Constraints

**SQL Server Behavior:**
- Enforced at row insert/update
- Supports complex expressions

**SQLite Mapping:**
- Same syntax and behavior
- Supports complex expressions
- Added in SQLite 3.3.0+ (well-established feature)

**Migration Notes:**
- Add CHECK constraints for:
  - String length limits (e.g., `CHECK(length(LastName) <= 50)`)
  - Numeric ranges (e.g., `CHECK(Credits >= 0 AND Credits <= 5)`)
  - Enum value ranges (e.g., `CHECK(Grade IS NULL OR Grade BETWEEN 0 AND 4)`)
- SQLite doesn't enforce nvarchar(n) lengths; CHECK constraints are essential

### NOT NULL Constraints

**SQL Server Behavior:**
- Enforced at column level

**SQLite Mapping:**
- Same syntax: `NOT NULL`
- Enforced identically

**Migration Notes:**
- Direct mapping, no special considerations

### Default Constraints

**SQL Server Behavior:**
- Can use scalar expressions, functions like GETDATE()

**SQLite Mapping:**
- Supports scalar expressions
- Limited built-in functions: CURRENT_TIME, CURRENT_DATE, CURRENT_TIMESTAMP
- No direct equivalent to GETDATE(); use `DEFAULT CURRENT_TIMESTAMP`

**Migration Notes:**
- Replace SQL Server-specific functions:
  - `GETDATE()` → `CURRENT_TIMESTAMP`
  - `NEWID()` → Application-generated GUID (no native GUID function)

---

## Collation Considerations

### SQL Server Collation

**Current Behavior:**
- Uses `SQL_Latin1_General_CP1_CI_AS` or similar (case-insensitive, accent-sensitive typically)
- `nvarchar` uses Unicode (UCS-2/UTF-16)
- Collation affects sorting and comparison

**Example:**
```sql
-- SQL Server: Case-insensitive by default
SELECT * FROM Student WHERE LastName = 'smith' -- matches 'Smith'
```

### SQLite Collation

**Default Behavior:**
- Default collation is `BINARY` (case-sensitive byte comparison)
- Built-in collations: BINARY, NOCASE (case-insensitive for ASCII A-Z only), RTRIM
- TEXT is stored as UTF-8 or UTF-16

**Example:**
```sql
-- SQLite: Case-sensitive by default
SELECT * FROM Student WHERE LastName = 'smith' -- does NOT match 'Smith'

-- Use NOCASE for case-insensitive
SELECT * FROM Student WHERE LastName = 'smith' COLLATE NOCASE -- matches 'Smith'
```

### Migration Strategy

**Options:**

1. **Use NOCASE Collation:**
   ```sql
   CREATE TABLE Student (
       LastName TEXT COLLATE NOCASE NOT NULL
   );
   ```
   - Pros: Simple, built-in
   - Cons: ASCII-only (doesn't handle international characters like 'ñ' vs 'Ñ')

2. **Application-Level Case Handling:**
   - Store data in a consistent case (e.g., proper case)
   - Use UPPER() or LOWER() functions in queries:
     ```sql
     SELECT * FROM Student WHERE UPPER(LastName) = 'SMITH'
     ```
   - Pros: Works for all Unicode characters
   - Cons: Cannot use indexes for case-insensitive searches (performance impact)

3. **Custom Collation (Advanced):**
   - Define custom collation functions in SQLite
   - Requires application code (C, Python, etc.)
   - Pros: Full Unicode support, customizable
   - Cons: Complex to implement

**Recommendation:**
- Use NOCASE collation for ASCII columns (LastName, FirstName, Title, Name, Location)
- Test with international characters to ensure acceptable behavior
- Add indexes on collated columns for performance
- Document any case-sensitivity changes for application code

**EF Core Handling:**
- EF Core SQLite provider uses NOCASE collation for string columns by default (verify in generated migrations)
- Override in model configuration if needed:
  ```csharp
  modelBuilder.Entity<Student>()
      .Property(s => s.LastName)
      .UseCollation("NOCASE");
  ```

---

## Timezone Handling

### SQL Server Behavior

**Current Implementation:**
- Uses `datetime2` type (no timezone info)
- Stores date/time as-is (assumed to be application/database server's local time or UTC by convention)
- No automatic timezone conversion
- Application must handle timezone logic

**Example:**
```csharp
// C# model
public DateTime EnrollmentDate { get; set; } // No timezone info

// Migration
EnrollmentDate = table.Column<DateTime>(type: "datetime2", nullable: false)
```

### SQLite Behavior

**Storage Options:**
1. **TEXT (ISO8601):** 'YYYY-MM-DD HH:MM:SS.SSS' or 'YYYY-MM-DD HH:MM:SS.SSS+00:00' (with timezone)
2. **REAL:** Julian day number (floating-point)
3. **INTEGER:** Unix timestamp (seconds since 1970-01-01 00:00:00 UTC)

**Functions:**
- `date()`, `time()`, `datetime()`, `julianday()`, `strftime()`
- Support modifiers: 'utc', 'localtime', '+N hours', etc.

**Example:**
```sql
-- Store current UTC time as TEXT
INSERT INTO Student (EnrollmentDate) VALUES (datetime('now', 'utc'));

-- Store as Unix timestamp (INTEGER)
INSERT INTO Student (EnrollmentDate) VALUES (strftime('%s', 'now'));
```

### Migration Strategy

**Chosen Approach: TEXT with ISO8601 Format**

**Rationale:**
- EF Core SQLite provider uses TEXT with ISO8601 format by default
- Human-readable in database
- Easy to query and sort
- Compatible with SQLite date/time functions

**Storage Format:**
- `YYYY-MM-DD HH:MM:SS.SSS` (no timezone suffix)
- Store as UTC and convert in application layer (current practice)

**Implementation:**
```csharp
// EF Core handles conversion automatically
public DateTime EnrollmentDate { get; set; } // Stored as TEXT in SQLite

// SQLite column type
EnrollmentDate TEXT NOT NULL
```

**Migration Notes:**
- **NO TIMEZONE STORED:** Current SQL Server implementation doesn't store timezone; SQLite migration maintains this behavior
- **APPLICATION RESPONSIBILITY:** Application must:
  - Convert to UTC before saving (if not already)
  - Convert to user's timezone when displaying
  - Ensure consistent timezone handling across layers
- **EXISTING DATA:** When migrating data:
  ```sql
  -- SQL Server datetime2 to SQLite TEXT
  SELECT datetime(EnrollmentDate, 'utc') FROM Student_SqlServer
  ```
- **QUERIES:** Use SQLite date/time functions for filtering:
  ```sql
  -- Get students enrolled in 2025
  SELECT * FROM Student WHERE date(EnrollmentDate) >= '2025-01-01' AND date(EnrollmentDate) < '2026-01-01'
  ```

**Testing Checklist:**
- [ ] Verify dates are stored in consistent format (UTC vs local)
- [ ] Test date comparisons and range queries
- [ ] Test sorting by date columns
- [ ] Verify application displays dates in correct timezone
- [ ] Test daylight saving time transitions (if applicable)

---

## Precision and Scale Changes

### Numeric Types

#### SQL Server: int

**Current:**
- 4-byte signed integer
- Range: -2,147,483,648 to 2,147,483,647

**SQLite:**
- INTEGER type (variable storage)
- Range: -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 (8-byte signed)
- Uses 0, 1, 2, 3, 4, 6, or 8 bytes depending on value magnitude

**Impact:**
- SQLite INTEGER has wider range (8 bytes vs 4 bytes)
- No precision loss
- Storage may be more efficient for small values
- **No migration issues**

#### SQL Server: money

**Current:**
- Fixed-point: 4 decimal places
- Range: -922,337,203,685,477.5808 to 922,337,203,685,477.5807
- Exact storage (no rounding for decimal values)

**SQLite Options:**

**Option 1: TEXT (Recommended for exact values)**
```sql
Budget TEXT NOT NULL CHECK(Budget GLOB '[0-9]*.[0-9][0-9][0-9][0-9]')
```
- Store as string: "123456.7890"
- Pros: Exact representation, no rounding
- Cons: Requires string parsing for calculations; must format properly

**Option 2: NUMERIC**
```sql
Budget NUMERIC NOT NULL
```
- SQLite stores as INTEGER or REAL depending on value
- Pros: Can perform calculations directly
- Cons: May lose precision (REAL is float64, 15-17 significant digits)

**Option 3: INTEGER (store as cents)**
```sql
Budget INTEGER NOT NULL -- Store in cents/pennies
```
- Store 123456.7890 as 12345679 (cents)
- Pros: Exact representation, efficient storage
- Cons: Requires conversion in application layer

**Recommendation:**
- Use **NUMERIC** for Budget column if financial precision requirements are not extreme
- EF Core SQLite provider maps decimal to NUMERIC by default
- Add CHECK constraint to enforce range if needed
- **CRITICAL:** Test calculations thoroughly; consider using TEXT if rounding is unacceptable

**EF Core Mapping:**
```csharp
// C# model
[Column(TypeName = "money")] // SQL Server
public decimal Budget { get; set; }

// SQLite migration (EF Core generates)
Budget NUMERIC NOT NULL -- or TEXT depending on configuration
```

**Testing:**
- [ ] Insert values with 4 decimal places
- [ ] Verify no precision loss in storage
- [ ] Test arithmetic operations (SUM, AVG)
- [ ] Test range boundaries

#### SQL Server: nvarchar(n)

**Current:**
- Variable-length Unicode string
- Max length enforced by SQL Server

**SQLite:**
- TEXT type (no max length enforced)
- CHECK constraint required to enforce length

**Migration:**
```sql
-- SQL Server
LastName nvarchar(50) NOT NULL

-- SQLite (without CHECK)
LastName TEXT NOT NULL -- No length enforcement!

-- SQLite (with CHECK, recommended)
LastName TEXT NOT NULL CHECK(length(LastName) <= 50)
```

**Impact:**
- SQLite doesn't enforce length without CHECK constraint
- Must add CHECK constraints or rely on EF Core validation
- Consider performance impact of CHECK constraints on large tables

**EF Core Handling:**
- EF Core generates CHECK constraints for [MaxLength] attributes in migrations (verify in generated code)
- Example:
  ```csharp
  [StringLength(50)]
  public string LastName { get; set; }
  
  // EF Core SQLite migration may generate:
  // LastName TEXT NOT NULL CHECK(length(LastName) <= 50)
  ```

### Enum Storage

**SQL Server:**
- Grade enum stored as `int`
- Values: 0=A, 1=B, 2=C, 3=D, 4=F

**SQLite:**
- Stored as INTEGER (same numeric values)
- No difference in storage or precision

**Migration:**
- No changes needed
- CHECK constraint recommended: `CHECK(Grade IS NULL OR (Grade >= 0 AND Grade <= 4))`

### Rowversion/Timestamp

**SQL Server:**
- `rowversion` (formerly `timestamp`) is a unique binary value
- Auto-generated and auto-incremented on every UPDATE
- Used for optimistic concurrency control
- 8 bytes

**SQLite:**
- No native equivalent
- Must implement custom concurrency token

**Options:**

**Option 1: GUID/UUID (Recommended)**
```sql
ConcurrencyToken TEXT -- Store GUID as TEXT
```
- Generate new GUID on every update (application-level trigger or EF Core)
- EF Core can handle this with `[Timestamp]` attribute
- Example: '550e8400-e29b-41d4-a716-446655440000'

**Option 2: Unix Timestamp**
```sql
ConcurrencyToken INTEGER -- Store Unix timestamp
```
- Update with `strftime('%s', 'now')` on every update
- Less unique than GUID (multiple updates in same second may collide)

**Option 3: Incrementing Integer**
```sql
ConcurrencyToken INTEGER DEFAULT 0
```
- Increment on every update
- Requires application-level management or trigger

**Option 4: Datetime String**
```sql
ConcurrencyToken TEXT -- Store ISO8601 datetime
```
- Update with `datetime('now')` on every update
- Same collision risk as Unix timestamp

**EF Core Handling:**
```csharp
[Timestamp]
public byte[] ConcurrencyToken { get; set; }

// EF Core SQLite provider may map to:
// ConcurrencyToken TEXT or BLOB
```

**Migration Strategy:**
- Use EF Core's built-in concurrency handling for SQLite
- EF Core will generate appropriate concurrency checks
- **CRITICAL:** Test concurrency scenarios:
  1. Two users update same row simultaneously
  2. Verify DbUpdateConcurrencyException is thrown
  3. Verify conflict resolution logic works

**Data Migration:**
- Cannot preserve SQL Server rowversion values (they're SQL Server-specific)
- Generate new concurrency tokens during migration:
  ```csharp
  // Pseudo-code for data migration
  foreach (var department in departments)
  {
      department.ConcurrencyToken = Guid.NewGuid().ToByteArray(); // or ToString() for TEXT
  }
  ```

---

## Migration Risks and Mitigation

### High-Risk Areas

#### 1. Money/Decimal Precision Loss

**Risk:** SQLite NUMERIC uses floating-point internally, may lose precision for decimal values

**Mitigation:**
- Use TEXT storage for critical financial data (Budget column)
- Thoroughly test calculations with representative data
- Add unit tests comparing SQL Server and SQLite results
- Consider storing as INTEGER (cents) for guaranteed precision

**Validation:**
```csharp
// Test case
decimal sqlServerValue = 123456.7890m;
// Store in SQLite, retrieve, compare
Assert.AreEqual(sqlServerValue, sqliteValue);
```

#### 2. Rowversion Concurrency

**Risk:** SQLite has no automatic rowversion equivalent; concurrency control may fail

**Mitigation:**
- Use EF Core's concurrency token implementation for SQLite
- Test optimistic concurrency scenarios extensively
- Consider alternative strategies:
  - Use last-modified timestamp
  - Use row versioning (manual integer increment)
  - Implement application-level locking

**Testing:**
- Create test scenarios with concurrent updates
- Verify DbUpdateConcurrencyException is thrown appropriately
- Test conflict resolution workflows

#### 3. Foreign Key Enforcement

**Risk:** SQLite foreign keys are disabled by default

**Mitigation:**
- Ensure `PRAGMA foreign_keys = ON` in connection string
- EF Core enables this automatically, but verify
- Test cascade deletes and referential integrity
- Add integration tests for FK violations

**Verification:**
```csharp
// Connection string
"Data Source=school.db;Foreign Keys=True"

// Or in OnConfiguring
optionsBuilder.UseSqlite("Data Source=school.db",
    options => options.EnableForeignKeyConstraints());
```

#### 4. Case-Sensitive Collation

**Risk:** SQLite default collation is case-sensitive; queries may not match expected results

**Mitigation:**
- Use NOCASE collation for string columns
- Update queries to use COLLATE NOCASE or UPPER()/LOWER()
- Test search functionality with various case combinations
- Document collation behavior for developers

**Testing:**
- Test search with different case inputs
- Verify sorting behavior matches SQL Server

#### 5. String Length Enforcement

**Risk:** SQLite doesn't enforce nvarchar(n) lengths; data may violate constraints

**Mitigation:**
- Add CHECK constraints for all string length limits
- Rely on EF Core validation (but CHECK is safer for data integrity)
- Migrate existing data validation logic
- Test with edge cases (exactly max length, over max length)

**Verification:**
```sql
-- Verify CHECK constraints exist
SELECT sql FROM sqlite_master WHERE type='table' AND name='Student';
-- Should show: CHECK(length(LastName) <= 50)
```

#### 6. Datetime Timezone Consistency

**Risk:** Inconsistent timezone handling may cause date/time bugs

**Mitigation:**
- Document timezone strategy (store as UTC, convert in app)
- Use EF Core's datetime conversion features
- Add integration tests for datetime operations
- Audit all datetime usage in application code

**Guidelines:**
- Always store as UTC
- Convert to local time only for display
- Use `DateTime.UtcNow` instead of `DateTime.Now`
- Be explicit: `DateTimeKind.Utc`

#### 7. Identity Column Behavior

**Risk:** SQLite AUTOINCREMENT behaves slightly differently than SQL Server IDENTITY

**Mitigation:**
- Understand difference: SQLite reuses deleted IDs by default (without AUTOINCREMENT keyword)
- Use AUTOINCREMENT explicitly if ID reuse is unacceptable
- Test ID generation with inserts and deletes
- Document any behavior changes

**Differences:**
```sql
-- SQL Server IDENTITY: Never reuses IDs
ID int IDENTITY(1,1)

-- SQLite (no AUTOINCREMENT): May reuse IDs after DELETE
ID INTEGER PRIMARY KEY

-- SQLite (with AUTOINCREMENT): Never reuses IDs
ID INTEGER PRIMARY KEY AUTOINCREMENT
```

### Medium-Risk Areas

- **Check Constraint Validation:** SQLite check constraints have different error messages; update error handling
- **Index Performance:** SQLite indexes may perform differently; re-evaluate index strategy
- **Transaction Isolation:** SQLite's default isolation is SERIALIZABLE; may affect concurrency

### Low-Risk Areas

- **Basic CRUD Operations:** Should work identically
- **Primary Key Constraints:** Direct mapping
- **NOT NULL Constraints:** Direct mapping
- **Basic Foreign Keys:** Work the same (when enabled)

---

## Testing Strategy

### Pre-Migration Testing

1. **Schema Validation:**
   - [ ] Compare SQL Server and SQLite schemas
   - [ ] Verify all constraints are present
   - [ ] Check index definitions

2. **Data Type Testing:**
   - [ ] Test each data type with min/max values
   - [ ] Test NULL handling
   - [ ] Test decimal precision (Budget column)

3. **Constraint Testing:**
   - [ ] Test PRIMARY KEY uniqueness
   - [ ] Test FOREIGN KEY enforcement
   - [ ] Test CHECK constraints (string length, numeric range)
   - [ ] Test NOT NULL constraints

### Post-Migration Testing

1. **Functional Testing:**
   - [ ] Test all CRUD operations
   - [ ] Test relationships (1:1, 1:N, N:M)
   - [ ] Test cascade deletes
   - [ ] Test queries with JOINs

2. **Concurrency Testing:**
   - [ ] Test concurrent updates to same row
   - [ ] Verify concurrency exceptions are thrown
   - [ ] Test conflict resolution

3. **Performance Testing:**
   - [ ] Compare query performance
   - [ ] Test with production-size datasets
   - [ ] Identify slow queries

4. **Edge Case Testing:**
   - [ ] Test with international characters (Unicode)
   - [ ] Test case-sensitive searches
   - [ ] Test datetime boundary conditions
   - [ ] Test decimal precision boundaries

---

## Migration Checklist

### Schema Migration

- [ ] Create SQLite database schema from EF Core migrations
- [ ] Verify all tables exist
- [ ] Verify all columns have correct types
- [ ] Verify all PRIMARY KEY constraints
- [ ] Verify all FOREIGN KEY constraints
- [ ] Verify all UNIQUE constraints
- [ ] Verify all CHECK constraints (especially string lengths)
- [ ] Verify all NOT NULL constraints
- [ ] Verify all indexes

### Data Migration

- [ ] Export data from SQL Server
- [ ] Transform data types:
  - [ ] Convert datetime2 to ISO8601 TEXT
  - [ ] Convert money to NUMERIC or TEXT
  - [ ] Convert rowversion to GUID or timestamp
- [ ] Import data to SQLite
- [ ] Verify row counts match
- [ ] Verify data integrity (foreign keys)
- [ ] Validate sample records

### Application Updates

- [ ] Update connection string
- [ ] Enable foreign keys in SQLite connection
- [ ] Update any SQL Server-specific queries
- [ ] Update concurrency handling code (if needed)
- [ ] Update datetime handling (if needed)
- [ ] Update error handling for SQLite-specific errors

### Testing

- [ ] Run all unit tests
- [ ] Run all integration tests
- [ ] Perform manual smoke testing
- [ ] Test concurrency scenarios
- [ ] Test performance with realistic data volume

---

## References

### SQLite Documentation

- **Data Types:** https://www.sqlite.org/datatype3.html
- **Foreign Keys:** https://www.sqlite.org/foreignkeys.html
- **Check Constraints:** https://www.sqlite.org/lang_createtable.html#check_constraints
- **Date/Time Functions:** https://www.sqlite.org/lang_datefunc.html
- **Collation:** https://www.sqlite.org/datatype3.html#collation

### Entity Framework Core

- **SQLite Provider:** https://docs.microsoft.com/en-us/ef/core/providers/sqlite/
- **SQLite Limitations:** https://docs.microsoft.com/en-us/ef/core/providers/sqlite/limitations
- **Migrations:** https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/

### ContosoUniversity

- **Current Schema:** See `Migrations/SchoolContextModelSnapshot.cs`
- **Data Model Catalog:** See `migration-docs/Data-Model-Catalog.md`

---

## Conclusion

This document provides a comprehensive mapping of all data types and constraints from SQL Server to SQLite for the ContosoUniversity application. The main areas requiring attention are:

1. **Decimal/Money precision** (Budget column)
2. **Rowversion concurrency** (ConcurrencyToken column)
3. **String length enforcement** (all nvarchar columns)
4. **Collation differences** (case sensitivity)
5. **Foreign key enablement** (must be explicitly enabled)

Following the mitigation strategies and testing checklist outlined in this document will ensure a successful migration with minimal data integrity risks.

**Next Steps:**
1. Review this document with the development team
2. Create detailed data migration scripts
3. Set up SQLite test environment
4. Execute migration in test environment
5. Perform comprehensive testing
6. Plan production migration cutover

---

**Document Metadata**
- **Created:** 2025-12-30
- **Last Updated:** 2025-12-30
- **Author:** Migration Architect
- **Status:** Planning - Awaiting Review
- **Related Documents:**
  - Data-Model-Catalog.md
  - Data-Migration-Runbook.md
  - Technology-Inventory.md
