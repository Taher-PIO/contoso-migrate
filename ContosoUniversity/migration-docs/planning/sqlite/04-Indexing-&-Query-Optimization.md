# Indexing & Query Optimization - SQLite Migration

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Author:** Performance Engineering Team  
**Migration Context:** SQL Server → SQLite

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Scope and Methodology](#scope-and-methodology)
- [Current Index Analysis](#current-index-analysis)
- [Top Query Identification](#top-query-identification)
- [Index Recommendations](#index-recommendations)
- [Compound vs Covering Indexes](#compound-vs-covering-indexes)
- [Partial Index Opportunities](#partial-index-opportunities)
- [EXPLAIN Query Plan Usage](#explain-query-plan-usage)
- [Slow Query Remediation](#slow-query-remediation)
- [Index Maintenance Guidelines](#index-maintenance-guidelines)
- [Performance Validation](#performance-validation)

---

## Executive Summary

This document provides comprehensive indexing and query optimization recommendations for the Contoso University application migration from SQL Server to SQLite. The analysis is based on:

- **Performance Profile endpoints** - Identifies hotspot queries and performance characteristics
- **Query log analysis** - Top 10 queries ranked by execution frequency and time
- **Data Model Catalog** - Current index inventory and relationship patterns
- **Application code inspection** - EF Core query patterns and N+1 problems

**Key Findings:**

| Metric | Value | Status |
|--------|-------|--------|
| **Total Current Indexes** | 12 | ⚠️ Inadequate |
| **Missing Critical Indexes** | 8 | ❌ High Priority |
| **Slow Query Hotspots** | 3 | ❌ Requires Optimization |
| **N+1 Query Problems** | 2 | ❌ Code-level fixes needed |
| **Estimated Performance Gain** | 40-70% | ✅ High Impact |

**Critical Action Items:**
1. Add compound indexes for search and sort operations (Students, Instructors)
2. Create covering indexes for pagination queries
3. Optimize Instructor Index page with split queries (code change)
4. Implement partial indexes for nullable columns (SQLite-specific)
5. Add indexes for foreign key traversal patterns

---

## Scope and Methodology

### Data Sources

**1. Performance Profile Analysis**
- Source: `/ContosoUniversity/migration-docs/Performance-Profile.md`
- Endpoint performance metrics (p50, p95, p99 latencies)
- Database query complexity estimates
- Identified hotspots: Instructors page, About page, Departments concurrency

**2. Application Code Review**
- Razor Page code-behind files (`*.cshtml.cs`)
- EF Core query patterns
- Lazy loading and eager loading usage
- Pagination implementations

**3. Data Model Catalog**
- Source: `/ContosoUniversity/migration-docs/Data-Model-Catalog.md`
- Existing index inventory (12 indexes total)
- Foreign key relationships
- Table access patterns (HOT/WARM/COLD)

### Performance Testing Approach

**Step 1: Baseline Establishment**
```bash
# Execute baseline query performance tests
sqlite3 school.db < baseline_queries.sql
```

**Step 2: EXPLAIN Analysis**
```sql
-- For each top query
EXPLAIN QUERY PLAN
SELECT s.ID, s.LastName, s.FirstMidName, s.EnrollmentDate
FROM Student s
WHERE s.LastName LIKE '%smith%'
ORDER BY s.LastName, s.FirstMidName
LIMIT 10 OFFSET 0;
```

**Step 3: Index Implementation**
```sql
-- Add recommended indexes
CREATE INDEX idx_student_name ON Student(LastName, FirstMidName);
```

**Step 4: Performance Validation**
```bash
# Re-run queries and compare execution times
# Target: 40-70% latency reduction
```

---

## Current Index Analysis

### Existing Index Inventory (SQL Server Baseline)

| Table | Index Name | Columns | Type | Clustered | Purpose | SQLite Equivalent |
|-------|------------|---------|------|-----------|---------|-------------------|
| Student | PK_Student | ID | Primary Key | Yes | Row identification | PRIMARY KEY (auto-indexed) |
| Student | *(none)* | - | - | - | **MISSING** name search | ❌ Need to add |
| Instructor | PK_Instructor | ID | Primary Key | Yes | Row identification | PRIMARY KEY (auto-indexed) |
| Instructor | *(none)* | - | - | - | **MISSING** name search | ❌ Need to add |
| Course | PK_Course | CourseID | Primary Key | Yes | Row identification | PRIMARY KEY (auto-indexed) |
| Course | IX_Course_DepartmentID | DepartmentID | Foreign Key | No | Department lookups | ✅ Keep |
| Course | *(none)* | Title | - | - | **MISSING** title search | ❌ Need to add |
| Enrollment | PK_Enrollments | EnrollmentID | Primary Key | Yes | Row identification | PRIMARY KEY (auto-indexed) |
| Enrollment | IX_Enrollments_CourseID | CourseID | Foreign Key | No | Course enrollments | ✅ Keep |
| Enrollment | IX_Enrollments_StudentID | StudentID | Foreign Key | No | Student enrollments | ✅ Keep |
| Enrollment | *(none)* | Grade | - | - | **MISSING** grade filtering | ⚠️ Optional |
| Department | PK_Departments | DepartmentID | Primary Key | Yes | Row identification | PRIMARY KEY (auto-indexed) |
| Department | IX_Departments_InstructorID | InstructorID | Foreign Key | No | Administrator lookups | ✅ Keep |
| OfficeAssignment | PK_OfficeAssignments | InstructorID | Primary Key | Yes | Row identification | PRIMARY KEY (auto-indexed) |
| CourseInstructor | PK_CourseInstructor | (CoursesCourseID, InstructorsID) | Primary Key | Yes | Relationship identification | PRIMARY KEY (auto-indexed) |
| CourseInstructor | IX_CourseInstructor_InstructorsID | InstructorsID | Foreign Key | No | Instructor course lookups | ✅ Keep |

**Gap Analysis:**
- ✅ **Adequate:** Primary keys and foreign key indexes (7 indexes)
- ❌ **Missing:** Search and sort indexes for text columns (5+ indexes needed)
- ⚠️ **Optional:** Partial indexes for nullable columns (3 indexes)

### SQLite-Specific Considerations

**Differences from SQL Server:**

1. **No Clustered Indexes**
   - SQLite uses rowid as implicit clustering
   - PRIMARY KEY can use rowid or explicit column
   - Impact: No index organization choice, but simpler index model

2. **Automatic Index on PRIMARY KEY and UNIQUE**
   - Explicit `CREATE INDEX` not needed for PK
   - UNIQUE constraints auto-create indexes

3. **No Included Columns**
   - SQL Server: `CREATE INDEX ... INCLUDE (...)`
   - SQLite: Must include columns in index key
   - Impact: Covering indexes require all columns in index definition

4. **Partial Indexes (Advantage)**
   - SQLite: `CREATE INDEX ... WHERE condition`
   - SQL Server: Filtered indexes (similar feature)
   - Impact: Excellent for nullable columns and selective queries

5. **Expression Indexes**
   - SQLite: `CREATE INDEX idx ON table(LOWER(column))`
   - Useful for case-insensitive searches

---

## Top Query Identification

### Performance Hotspots (from Performance Profile)

Based on endpoint analysis and code inspection, the following queries are identified as top candidates for optimization:

| Rank | Query Pattern | Endpoint | Est. Latency (p95) | Frequency | Database Queries | Priority |
|------|---------------|----------|-------------------|-----------|------------------|----------|
| 1 | **Instructor list with eager loading** | `/Instructors` | 800ms | Medium | 10-20 (N+1) | 🔴 CRITICAL |
| 2 | **Student search with pagination** | `/Students?search=...` | 250ms | High | 2 | 🟡 HIGH |
| 3 | **Student statistics (GROUP BY)** | `/About` | 450ms | Low | 1 complex | 🟡 HIGH |
| 4 | **Course list with departments** | `/Courses` | 300ms | Medium | 2 | 🟢 MEDIUM |
| 5 | **Department edit with concurrency** | `/Departments/Edit/{id}` POST | 400ms | Medium | 3-4 | 🟢 MEDIUM |
| 6 | **Student details with enrollments** | `/Students/Details/{id}` | 200ms | High | 2-3 | 🟢 LOW |
| 7 | **Enrollment by course** | Instructor drill-down | 500ms | Low | 5+ (loop) | 🔴 CRITICAL |
| 8 | **Instructor course assignments** | `/Instructors` (with courseID) | 1000ms | Low | 10+ (nested) | 🔴 CRITICAL |
| 9 | **Department list** | `/Departments` | 200ms | High | 1-2 | 🟢 LOW |
| 10 | **Course details** | `/Courses/Details/{id}` | 200ms | High | 2-3 | 🟢 LOW |

### Query Details

#### Query #1: Instructor Index with Eager Loading (CRITICAL)

**Location:** `Pages/Instructors/Index.cshtml.cs:25-52`

**EF Core Query:**
```csharp
InstructorData.Instructors = await _context.Instructors
    .Include(i => i.OfficeAssignment)
    .Include(i => i.Courses)
        .ThenInclude(c => c.Department)
    .OrderBy(i => i.LastName)
    .ToListAsync();
```

**Generated SQL (Conceptual):**
```sql
-- Main query
SELECT i.ID, i.LastName, i.FirstName, i.HireDate,
       oa.InstructorID, oa.Location,
       c.CourseID, c.Title, c.Credits, c.DepartmentID,
       d.DepartmentID, d.Name, d.Budget
FROM Instructor i
LEFT JOIN OfficeAssignment oa ON i.ID = oa.InstructorID
LEFT JOIN CourseInstructor ci ON i.ID = ci.InstructorsID
LEFT JOIN Course c ON ci.CoursesCourseID = c.CourseID
LEFT JOIN Department d ON c.DepartmentID = d.DepartmentID
ORDER BY i.LastName;
```

**Performance Issues:**
- Cartesian product with multiple LEFT JOINs
- No index on `Instructor(LastName)` for ORDER BY
- Additional lazy loads for enrollment data (N+1 in loop)

**Current Plan (without indexes):**
```
QUERY PLAN
|--SCAN TABLE Instructor AS i
|--SEARCH TABLE OfficeAssignment AS oa USING PRIMARY KEY
|--SEARCH TABLE CourseInstructor AS ci USING INDEX IX_CourseInstructor_InstructorsID
|--SEARCH TABLE Course AS c USING PRIMARY KEY
`--SEARCH TABLE Department AS d USING PRIMARY KEY
```

#### Query #2: Student Search with Pagination (HIGH)

**Location:** `Pages/Students/Index.cshtml.cs:43-68`

**EF Core Query:**
```csharp
IQueryable<Student> studentsIQ = from s in _context.Students
                                 select s;
if (!String.IsNullOrEmpty(searchString))
{
    studentsIQ = studentsIQ.Where(s => s.LastName.Contains(searchString)
                           || s.FirstMidName.Contains(searchString));
}
studentsIQ = studentsIQ.OrderBy(s => s.LastName);
Students = await PaginatedList<Student>.CreateAsync(
    studentsIQ.AsNoTracking(), pageIndex ?? 1, pageSize);
```

**Generated SQL (Conceptual):**
```sql
SELECT s.ID, s.LastName, s.FirstMidName, s.EnrollmentDate
FROM Student s
WHERE s.LastName LIKE '%search%' OR s.FirstMidName LIKE '%search%'
ORDER BY s.LastName
LIMIT 10 OFFSET 0;
```

**Performance Issues:**
- Full table scan for LIKE '%...%' (leading wildcard)
- No index on `Student(LastName, FirstMidName)` for sort and search
- OFFSET-based pagination without covering index

**Current Plan (without indexes):**
```
QUERY PLAN
|--SCAN TABLE Student AS s
`--USE TEMP B-TREE FOR ORDER BY
```

#### Query #3: Student Enrollment Statistics (HIGH)

**Location:** `Pages/About.cshtml.cs:21-30`

**EF Core Query:**
```csharp
IQueryable<EnrollmentDateGroup> data =
    from student in _context.Students
    group student by student.EnrollmentDate into dateGroup
    select new EnrollmentDateGroup()
    {
        EnrollmentDate = dateGroup.Key,
        StudentCount = dateGroup.Count()
    };
Students = await data.AsNoTracking().ToListAsync();
```

**Generated SQL:**
```sql
SELECT s.EnrollmentDate, COUNT(*) AS StudentCount
FROM Student s
GROUP BY s.EnrollmentDate
ORDER BY s.EnrollmentDate;
```

**Performance Issues:**
- Full table scan for aggregation
- No index on `Student(EnrollmentDate)` for GROUP BY
- Small table mitigates issue, but scales poorly

**Current Plan (without indexes):**
```
QUERY PLAN
|--SCAN TABLE Student AS s
`--USE TEMP B-TREE FOR GROUP BY
```

#### Query #4: Course List with Departments (MEDIUM)

**Location:** `Pages/Courses/Index.cshtml.cs:21-24`

**EF Core Query:**
```csharp
Courses = await _context.Courses
    .Include(c => c.Department)
    .AsNoTracking()
    .ToListAsync();
```

**Generated SQL:**
```sql
SELECT c.CourseID, c.Title, c.Credits, c.DepartmentID,
       d.DepartmentID, d.Name, d.Budget, d.StartDate
FROM Course c
INNER JOIN Department d ON c.DepartmentID = d.DepartmentID;
```

**Current Plan (with existing FK index):**
```
QUERY PLAN
|--SCAN TABLE Course AS c
`--SEARCH TABLE Department AS d USING PRIMARY KEY
```

**Status:** ✅ Already optimized with `IX_Course_DepartmentID`

---

## Index Recommendations

### Summary Table

| Query | Current Plan | Proposed Index | Expected Impact | Validation Steps |
|-------|-------------|----------------|-----------------|------------------|
| **Instructor list (ORDER BY)** | SCAN Instructor + USE TEMP B-TREE | `CREATE INDEX idx_instructor_name ON Instructor(LastName, FirstMidName)` | 50-70% latency reduction | EXPLAIN shows index seek, measure p95 latency |
| **Student search + pagination** | SCAN Student + USE TEMP B-TREE | `CREATE INDEX idx_student_name ON Student(LastName, FirstMidName, ID)` (covering) | 60-80% latency reduction | EXPLAIN shows covering index, no temp sort |
| **Student statistics (GROUP BY)** | SCAN Student + USE TEMP B-TREE | `CREATE INDEX idx_student_enrollment_date ON Student(EnrollmentDate)` | 30-50% latency reduction | EXPLAIN shows index scan for GROUP BY |
| **Enrollment by student (JOIN)** | Already indexed | ✅ No change | - | Verify FK index `IX_Enrollments_StudentID` exists |
| **Enrollment by course (JOIN)** | Already indexed | ✅ No change | - | Verify FK index `IX_Enrollments_CourseID` exists |
| **Course by department (JOIN)** | Already indexed | ✅ No change | - | Verify FK index `IX_Course_DepartmentID` exists |
| **Enrollment drill-down (loop)** | Multiple SEARCHs (N+1) | ⚠️ Code-level fix: use `.AsSplitQuery()` or single query with projection | 80-90% latency reduction | Reduce DB queries from 10+ to 1-2 |
| **Student details + enrollments** | SEARCH Student + SCAN Enrollments | `CREATE INDEX idx_enrollment_student_course ON Enrollment(StudentID, CourseID)` (composite) | 20-40% latency reduction | EXPLAIN shows index seek on composite |
| **Grade filtering (optional)** | SCAN Enrollment + filter | `CREATE INDEX idx_enrollment_grade ON Enrollment(Grade) WHERE Grade IS NOT NULL` (partial) | 40-60% for grade queries | EXPLAIN shows partial index usage |
| **Instructor course assignments** | Indexed via junction | ✅ No change | - | Verify `IX_CourseInstructor_InstructorsID` exists |

### Detailed Recommendations

#### Recommendation #1: Student Name Index (Covering)

**Priority:** 🔴 CRITICAL

**DDL:**
```sql
CREATE INDEX idx_student_name ON Student(LastName, FirstMidName, ID);
```

**Rationale:**
- **Workload:** Student search page (high traffic endpoint)
- **Query pattern:** `WHERE LastName LIKE '%...' OR FirstMidName LIKE '%...' ORDER BY LastName LIMIT ... OFFSET ...`
- **Covering index:** Includes `ID` to avoid table lookup
- **Impact:** Eliminates temp B-tree sort, enables index-only scan

**Before (EXPLAIN):**
```
QUERY PLAN
|--SCAN TABLE Student AS s
`--USE TEMP B-TREE FOR ORDER BY
```

**After (EXPLAIN):**
```
QUERY PLAN
`--SCAN INDEX idx_student_name
```

**Validation:**
```sql
-- Test query
EXPLAIN QUERY PLAN
SELECT ID, LastName, FirstMidName, EnrollmentDate
FROM Student
WHERE LastName LIKE 'A%'
ORDER BY LastName, FirstMidName
LIMIT 10 OFFSET 0;

-- Expected: Index scan on idx_student_name
-- Measure: Run query 100 times, calculate avg latency
-- Target: < 50ms p95 (down from ~250ms)
```

#### Recommendation #2: Instructor Name Index

**Priority:** 🔴 CRITICAL

**DDL:**
```sql
CREATE INDEX idx_instructor_name ON Instructor(LastName, FirstMidName);
```

**Rationale:**
- **Workload:** Instructor list page (medium traffic, complex joins)
- **Query pattern:** `ORDER BY i.LastName` on instructor list
- **Impact:** Eliminates sort step, improves overall query plan

**Validation:**
```sql
EXPLAIN QUERY PLAN
SELECT i.ID, i.LastName, i.FirstMidName, i.HireDate
FROM Instructor i
ORDER BY i.LastName;

-- Expected: Scan idx_instructor_name (no USE TEMP B-TREE)
-- Target: < 200ms p95 (down from ~800ms combined with code fixes)
```

#### Recommendation #3: Student EnrollmentDate Index

**Priority:** 🟡 HIGH

**DDL:**
```sql
CREATE INDEX idx_student_enrollment_date ON Student(EnrollmentDate);
```

**Rationale:**
- **Workload:** About page statistics (low traffic but slow)
- **Query pattern:** `GROUP BY EnrollmentDate`
- **Impact:** Faster aggregation, no temp B-tree for GROUP BY

**Validation:**
```sql
EXPLAIN QUERY PLAN
SELECT EnrollmentDate, COUNT(*) AS StudentCount
FROM Student
GROUP BY EnrollmentDate;

-- Expected: Scan idx_student_enrollment_date
-- Target: < 150ms p95 (down from ~450ms)
```

#### Recommendation #4: Enrollment Composite Index

**Priority:** 🟢 MEDIUM

**DDL:**
```sql
CREATE INDEX idx_enrollment_student_course ON Enrollment(StudentID, CourseID, Grade);
```

**Rationale:**
- **Workload:** Student details page (high traffic)
- **Query pattern:** `WHERE StudentID = ? ORDER BY CourseID`
- **Covering index:** Includes `Grade` to show enrollment results
- **Impact:** Index-only scan for enrollment lookups

**Validation:**
```sql
EXPLAIN QUERY PLAN
SELECT EnrollmentID, StudentID, CourseID, Grade
FROM Enrollment
WHERE StudentID = 1
ORDER BY CourseID;

-- Expected: Scan idx_enrollment_student_course
-- Target: < 50ms p95 (down from ~80ms)
```

#### Recommendation #5: Course Title Index

**Priority:** 🟢 LOW (future-proofing)

**DDL:**
```sql
CREATE INDEX idx_course_title ON Course(Title);
```

**Rationale:**
- **Workload:** Future course search functionality
- **Query pattern:** `WHERE Title LIKE '%...'`
- **Impact:** Enables prefix search optimization

**Validation:**
```sql
EXPLAIN QUERY PLAN
SELECT CourseID, Title, Credits
FROM Course
WHERE Title LIKE 'Calc%';

-- Expected: Range scan on idx_course_title
```

#### Recommendation #6: Enrollment Grade Partial Index (SQLite-specific)

**Priority:** 🟢 LOW (optional)

**DDL:**
```sql
CREATE INDEX idx_enrollment_grade ON Enrollment(Grade) 
WHERE Grade IS NOT NULL;
```

**Rationale:**
- **Workload:** Grade reports, honor roll queries
- **Query pattern:** `WHERE Grade IN ('A', 'B', 'C', 'D', 'F')`
- **Partial index:** Only indexes non-NULL grades (smaller index)
- **Impact:** Faster filtering for graded enrollments

**Validation:**
```sql
EXPLAIN QUERY PLAN
SELECT e.EnrollmentID, s.LastName, c.Title, e.Grade
FROM Enrollment e
JOIN Student s ON e.StudentID = s.ID
JOIN Course c ON e.CourseID = c.CourseID
WHERE e.Grade = 'A';

-- Expected: Search idx_enrollment_grade
```

---

## Compound vs Covering Indexes

### Compound Indexes

**Definition:** Index on multiple columns, order matters.

**Use Cases:**
1. **Multi-column WHERE clauses**
   ```sql
   CREATE INDEX idx_enrollment_lookup ON Enrollment(StudentID, CourseID);
   -- Optimizes: WHERE StudentID = ? AND CourseID = ?
   ```

2. **WHERE + ORDER BY**
   ```sql
   CREATE INDEX idx_student_name ON Student(LastName, FirstMidName);
   -- Optimizes: WHERE LastName = ? ORDER BY FirstMidName
   ```

3. **Foreign key + sort column**
   ```sql
   CREATE INDEX idx_course_dept_title ON Course(DepartmentID, Title);
   -- Optimizes: WHERE DepartmentID = ? ORDER BY Title
   ```

**Column Ordering Rules:**
- Most selective column first (best for range scans)
- Equality columns before range columns
- Sort columns last

**Example: Student Search**

**Bad (wrong order):**
```sql
CREATE INDEX idx_student_bad ON Student(FirstMidName, LastName);
-- Inefficient for: WHERE LastName = 'Smith' ORDER BY LastName
```

**Good:**
```sql
CREATE INDEX idx_student_good ON Student(LastName, FirstMidName);
-- Efficient for: WHERE LastName LIKE 'Smith%' ORDER BY LastName, FirstMidName
```

### Covering Indexes

**Definition:** Index includes all columns needed by query (no table lookup required).

**Advantages:**
- Eliminates table row fetch (index-only scan)
- Reduces I/O significantly
- Critical for pagination queries

**Example: Student Pagination**

**Non-covering:**
```sql
CREATE INDEX idx_student_name ON Student(LastName, FirstMidName);

SELECT ID, LastName, FirstMidName, EnrollmentDate
FROM Student
ORDER BY LastName, FirstMidName
LIMIT 10 OFFSET 0;

-- Query plan includes table lookup for ID and EnrollmentDate
```

**Covering:**
```sql
CREATE INDEX idx_student_name_covering ON Student(LastName, FirstMidName, ID, EnrollmentDate);

SELECT ID, LastName, FirstMidName, EnrollmentDate
FROM Student
ORDER BY LastName, FirstMidName
LIMIT 10 OFFSET 0;

-- Query plan: index-only scan (no table access)
```

**Trade-offs:**
- ✅ **Pro:** Faster queries, lower I/O
- ❌ **Con:** Larger index size (more storage, slower writes)
- ⚖️ **Decision:** Use for high-traffic read queries, avoid for high-write tables

### Recommended Covering Indexes for Contoso University

| Table | Covering Index | Query Pattern | Justification |
|-------|----------------|---------------|---------------|
| Student | `(LastName, FirstMidName, ID)` | Pagination, search | High traffic, read-heavy |
| Instructor | `(LastName, FirstMidName, ID)` | Instructor list | Medium traffic, complex joins |
| Enrollment | `(StudentID, CourseID, Grade)` | Student transcript | High traffic, specific columns |
| Course | `(DepartmentID, Title, CourseID)` | Course catalog | Medium traffic, filtered lists |

**Implementation Priority:**
1. Student (highest traffic)
2. Enrollment (transaction-heavy but read-dominant)
3. Instructor (complex query optimization)
4. Course (lower priority, stable data)

---

## Partial Index Opportunities

### SQLite Partial Indexes

**Feature:** SQLite supports partial indexes with `WHERE` clause (similar to SQL Server filtered indexes).

**Syntax:**
```sql
CREATE INDEX index_name ON table(column) WHERE condition;
```

**Advantages:**
1. **Smaller index size** - Only indexes subset of rows
2. **Faster writes** - Fewer index updates
3. **Better for nullable columns** - Exclude NULL values
4. **Query selectivity** - Optimizes specific query patterns

### Recommended Partial Indexes

#### 1. Enrollment Grade (Non-NULL Only)

**DDL:**
```sql
CREATE INDEX idx_enrollment_grade_notnull ON Enrollment(Grade) 
WHERE Grade IS NOT NULL;
```

**Use Case:**
- Grade reports (exclude in-progress enrollments)
- Honor roll queries (`WHERE Grade IN ('A', 'B')`)
- Failing student reports (`WHERE Grade = 'F'`)

**Statistics:**
- Assumption: 70% of enrollments have grades (30% in-progress)
- Index size reduction: ~30% smaller than full index
- Write performance: 30% faster updates (fewer index entries)

**Query Optimization:**
```sql
-- Before (full table scan or full index scan)
SELECT s.LastName, c.Title, e.Grade
FROM Enrollment e
JOIN Student s ON e.StudentID = s.ID
JOIN Course c ON e.CourseID = c.CourseID
WHERE e.Grade = 'A';

-- After (partial index seek)
EXPLAIN QUERY PLAN
-- Expected: SEARCH TABLE Enrollment USING INDEX idx_enrollment_grade_notnull (Grade=?)
```

#### 2. Office Assignment (Non-NULL Location)

**DDL:**
```sql
CREATE INDEX idx_office_location ON OfficeAssignment(Location) 
WHERE Location IS NOT NULL;
```

**Use Case:**
- Office directory lookups
- Exclude instructors without assigned offices

**Statistics:**
- Seed data: 3 out of 5 instructors have offices
- Index size: 40% smaller than full index

**Note:** Low priority due to COLD table (low query frequency)

#### 3. Department Administrator (Non-NULL InstructorID)

**DDL:**
```sql
CREATE INDEX idx_department_admin ON Department(InstructorID) 
WHERE InstructorID IS NOT NULL;
```

**Use Case:**
- Administrator assignment reports
- Exclude departments without assigned administrators

**Status:** ⚠️ **Already has FK index** `IX_Departments_InstructorID`
**Recommendation:** Monitor query patterns; add if NULL filtering is common

### Partial Index Decision Matrix

| Table | Column | NULL Ratio | Query Frequency | Recommendation | Priority |
|-------|--------|------------|-----------------|----------------|----------|
| Enrollment | Grade | ~30% | High | ✅ **Implement** | 🟡 HIGH |
| OfficeAssignment | Location | ~40% | Low | ⚠️ Optional | 🟢 LOW |
| Department | InstructorID | ~10% | Low | ❌ Skip (FK index sufficient) | - |
| Course | DepartmentID | 0% | High | ❌ Skip (no NULLs) | - |
| Student | EnrollmentDate | 0% | Medium | ❌ Skip (no NULLs) | - |

---

## EXPLAIN Query Plan Usage

### SQLite EXPLAIN Syntax

**Basic Usage:**
```sql
EXPLAIN QUERY PLAN
SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT ...;
```

**Output Format:**
```
QUERY PLAN
|--SCAN TABLE table_name
|--SEARCH TABLE table_name USING INDEX index_name
|--USE TEMP B-TREE FOR ORDER BY
`--USE TEMP B-TREE FOR GROUP BY
```

### Interpreting Query Plans

#### 1. Table Access Methods

| Operation | Meaning | Performance | Action |
|-----------|---------|-------------|--------|
| `SCAN TABLE` | Full table scan | ❌ Slow (O(n)) | Add index if frequent |
| `SEARCH TABLE USING INDEX` | Index seek | ✅ Fast (O(log n)) | Optimal |
| `SEARCH TABLE USING PRIMARY KEY` | Primary key lookup | ✅ Very fast | Optimal |
| `SCAN INDEX` | Full index scan | ⚠️ Acceptable | Better than table scan |

#### 2. Temporary Structures

| Operation | Meaning | Performance | Action |
|-----------|---------|-------------|--------|
| `USE TEMP B-TREE FOR ORDER BY` | Sort in memory | ❌ Slow | Add index on ORDER BY columns |
| `USE TEMP B-TREE FOR GROUP BY` | Group in memory | ⚠️ Acceptable | Add index on GROUP BY columns |
| `USE TEMP B-TREE FOR DISTINCT` | Deduplicate in memory | ⚠️ Acceptable | Consider index or LIMIT |

#### 3. Join Algorithms

| Operation | Meaning | Performance |
|-----------|---------|-------------|
| `SCAN TABLE t1` + `SEARCH TABLE t2 USING INDEX` | Nested loop with index | ✅ Good |
| `SCAN TABLE t1` + `SCAN TABLE t2` | Nested loop without index | ❌ Bad |

### EXPLAIN Examples

#### Example 1: Student Search (Before Index)

```sql
EXPLAIN QUERY PLAN
SELECT ID, LastName, FirstMidName, EnrollmentDate
FROM Student
WHERE LastName LIKE 'A%'
ORDER BY LastName, FirstMidName
LIMIT 10 OFFSET 0;
```

**Output:**
```
QUERY PLAN
|--SCAN TABLE Student AS s
`--USE TEMP B-TREE FOR ORDER BY
```

**Analysis:**
- ❌ **SCAN TABLE**: Full table scan (no index on LastName)
- ❌ **USE TEMP B-TREE**: Sort in memory (no index on ORDER BY)
- **Cost:** O(n log n) where n = total rows
- **Recommendation:** Add `idx_student_name` index

#### Example 2: Student Search (After Index)

```sql
-- After: CREATE INDEX idx_student_name ON Student(LastName, FirstMidName, ID);

EXPLAIN QUERY PLAN
SELECT ID, LastName, FirstMidName, EnrollmentDate
FROM Student
WHERE LastName LIKE 'A%'
ORDER BY LastName, FirstMidName
LIMIT 10 OFFSET 0;
```

**Output:**
```
QUERY PLAN
|--SCAN INDEX idx_student_name
`--SEARCH TABLE Student USING PRIMARY KEY
```

**Analysis:**
- ✅ **SCAN INDEX**: Uses idx_student_name for ORDER BY
- ⚠️ **SEARCH TABLE**: Still fetches EnrollmentDate from table
- **Cost:** O(k log n) where k = result set size
- **Improvement:** 60-80% faster than before

#### Example 3: Student Search (Covering Index)

```sql
-- After: CREATE INDEX idx_student_covering ON Student(LastName, FirstMidName, ID, EnrollmentDate);

EXPLAIN QUERY PLAN
SELECT ID, LastName, FirstMidName, EnrollmentDate
FROM Student
WHERE LastName LIKE 'A%'
ORDER BY LastName, FirstMidName
LIMIT 10 OFFSET 0;
```

**Output:**
```
QUERY PLAN
`--SCAN INDEX idx_student_covering
```

**Analysis:**
- ✅ **SCAN INDEX ONLY**: No table access (covering index)
- **Cost:** O(k) where k = result set size
- **Improvement:** 80-90% faster than original

#### Example 4: Instructor Join (Before Optimization)

```sql
EXPLAIN QUERY PLAN
SELECT i.ID, i.LastName, oa.Location, c.Title, d.Name
FROM Instructor i
LEFT JOIN OfficeAssignment oa ON i.ID = oa.InstructorID
LEFT JOIN CourseInstructor ci ON i.ID = ci.InstructorsID
LEFT JOIN Course c ON ci.CoursesCourseID = c.CourseID
LEFT JOIN Department d ON c.DepartmentID = d.DepartmentID
ORDER BY i.LastName;
```

**Output:**
```
QUERY PLAN
|--SCAN TABLE Instructor AS i
|--SEARCH TABLE OfficeAssignment AS oa USING PRIMARY KEY
|--SEARCH TABLE CourseInstructor AS ci USING INDEX IX_CourseInstructor_InstructorsID
|--SEARCH TABLE Course AS c USING PRIMARY KEY
|--SEARCH TABLE Department AS d USING PRIMARY KEY
`--USE TEMP B-TREE FOR ORDER BY
```

**Analysis:**
- ❌ **USE TEMP B-TREE**: Sort required on Instructor.LastName
- ✅ **Joins optimized**: All joins use indexes
- **Recommendation:** Add `idx_instructor_name` to eliminate sort

### EXPLAIN Best Practices

**1. Always EXPLAIN before optimization**
```bash
# Save baseline query plan
sqlite3 school.db <<EOF > baseline_plan.txt
EXPLAIN QUERY PLAN
SELECT ... FROM ... WHERE ...;
EOF
```

**2. Compare before/after plans**
```bash
# After adding index
sqlite3 school.db <<EOF > optimized_plan.txt
EXPLAIN QUERY PLAN
SELECT ... FROM ... WHERE ...;
EOF

diff baseline_plan.txt optimized_plan.txt
```

**3. Red flags to watch for**
- `SCAN TABLE` on large tables (> 1000 rows)
- `USE TEMP B-TREE` on frequent queries
- Multiple `SCAN TABLE` in joins (cartesian products)

**4. Acceptable patterns**
- `SEARCH TABLE USING INDEX` (optimal)
- `SCAN TABLE` on small tables (< 100 rows)
- `USE TEMP B-TREE` on infrequent queries

---

## Slow Query Remediation

### Three-Tier Remediation Strategy

**Tier 1: Database Indexes** (This Document)
- Add missing indexes
- Optimize existing indexes
- Use partial indexes for selective queries

**Tier 2: Query Optimization** (Code Changes)
- Eliminate N+1 queries
- Use projections instead of full entity loads
- Apply `.AsNoTracking()` for read-only queries
- Use `.AsSplitQuery()` for complex joins

**Tier 3: Architecture Changes** (Out of Scope)
- Caching layer (Redis, in-memory)
- Query result caching
- Materialized views
- Denormalization

### Critical Hotspots Remediation

#### Hotspot #1: Instructor Index Page (⚠️ CRITICAL)

**Problem:**
- N+1 queries: Load instructors, then loop through enrollments
- Multiple lazy loads in loop
- Est. latency: 800-1500ms p95

**Current Code (Problematic):**
```csharp
// Step 1: Load all instructors with related data
InstructorData.Instructors = await _context.Instructors
    .Include(i => i.OfficeAssignment)
    .Include(i => i.Courses).ThenInclude(c => c.Department)
    .OrderBy(i => i.LastName)
    .ToListAsync();

// Step 2: If course selected, load enrollments (N+1 loop!)
if (courseID != null)
{
    var selectedCourse = InstructorData.Courses
        .Where(x => x.CourseID == courseID).Single();
    
    // Query 1: Load enrollments for course
    await _context.Entry(selectedCourse).Collection(x => x.Enrollments).LoadAsync();
    
    // Query 2-N: Load student for EACH enrollment (N+1!)
    foreach (Enrollment enrollment in selectedCourse.Enrollments)
    {
        await _context.Entry(enrollment).Reference(x => x.Student).LoadAsync();
    }
    InstructorData.Enrollments = selectedCourse.Enrollments;
}
```

**Solution 1: Add Index (Tier 1)**
```sql
CREATE INDEX idx_instructor_name ON Instructor(LastName, FirstMidName);
```
**Impact:** 30-40% improvement (eliminates temp sort)

**Solution 2: Fix N+1 with Single Query (Tier 2)**
```csharp
// Load instructors with all related data in one query
InstructorData.Instructors = await _context.Instructors
    .Include(i => i.OfficeAssignment)
    .Include(i => i.Courses).ThenInclude(c => c.Department)
    .Include(i => i.Courses).ThenInclude(c => c.Enrollments).ThenInclude(e => e.Student)
    .AsNoTracking()
    .AsSplitQuery()  // Prevents cartesian explosion
    .OrderBy(i => i.LastName)
    .ToListAsync();

// No additional queries needed!
if (courseID != null)
{
    CourseID = courseID.Value;
    var selectedCourse = InstructorData.Instructors
        .SelectMany(i => i.Courses)
        .Where(x => x.CourseID == courseID)
        .Single();
    InstructorData.Enrollments = selectedCourse.Enrollments;
}
```
**Impact:** 70-90% improvement (reduces 10+ queries to 2-3 queries)

**Validation:**
```bash
# Before: 10-20 queries per page load
# After: 2-3 queries per page load

# Measure with logging
dotnet run --configuration Release
# Navigate to /Instructors?id=1&courseID=1050
# Check SQL logs for query count
```

#### Hotspot #2: Student Search Performance

**Problem:**
- Full table scan with wildcard search
- No index on name columns
- Est. latency: 250ms p95

**Solution 1: Add Covering Index (Tier 1)**
```sql
CREATE INDEX idx_student_name_covering ON Student(LastName, FirstMidName, ID, EnrollmentDate);
```

**Solution 2: Optimize Search (Tier 2 - Optional)**
```csharp
// Current: LIKE '%search%' (both leading and trailing wildcards)
studentsIQ = studentsIQ.Where(s => s.LastName.Contains(searchString)
                       || s.FirstMidName.Contains(searchString));

// Optimized: LIKE 'search%' (trailing wildcard only, can use index)
studentsIQ = studentsIQ.Where(s => s.LastName.StartsWith(searchString)
                       || s.FirstMidName.StartsWith(searchString)
                       || s.LastName.Contains(searchString)
                       || s.FirstMidName.Contains(searchString));
```

**Note:** SQLite can use index for `LIKE 'prefix%'` but not `LIKE '%suffix%'`

**Impact:** 60-80% improvement with index alone

#### Hotspot #3: About Page Statistics

**Problem:**
- GROUP BY without index
- Full table scan
- Est. latency: 450ms p95

**Solution: Add Index (Tier 1)**
```sql
CREATE INDEX idx_student_enrollment_date ON Student(EnrollmentDate);
```

**Impact:** 30-50% improvement

**Code Status:** ✅ Already using `.AsNoTracking()` (optimal)

### Query Optimization Checklist

**For Every Slow Query:**

- [ ] Run EXPLAIN QUERY PLAN before optimization
- [ ] Identify table scans and temp structures
- [ ] Add appropriate indexes (see recommendations)
- [ ] Re-run EXPLAIN QUERY PLAN after index
- [ ] Measure query latency (before/after)
- [ ] Check for N+1 patterns in code
- [ ] Apply `.AsNoTracking()` for read-only queries
- [ ] Consider `.AsSplitQuery()` for complex joins
- [ ] Validate with production-like data volume
- [ ] Document changes and validation results

---

## Index Maintenance Guidelines

### SQLite Index Characteristics

**Automatic Maintenance:**
- ✅ Indexes auto-update on INSERT/UPDATE/DELETE
- ✅ No explicit REINDEX needed (unlike SQL Server)
- ✅ VACUUM reclaims space and optimizes indexes

**Manual Maintenance (Rare):**
```sql
-- Rebuild all indexes (rarely needed)
REINDEX;

-- Rebuild specific index
REINDEX idx_student_name;

-- Reclaim space and optimize database
VACUUM;
```

### When to Run VACUUM

**Triggers:**
1. After bulk DELETE operations (> 10% of table)
2. After DROP INDEX statements
3. When database file size is much larger than data size
4. Quarterly maintenance window (recommended)

**Syntax:**
```bash
sqlite3 school.db "VACUUM;"
```

**Impact:**
- Rebuilds database file
- Reclaims unused space
- Optimizes page layout
- ⚠️ Requires 2x database size in temp space
- ⚠️ Locks entire database during operation

### Index Size Monitoring

**Query to Check Index Sizes:**
```sql
SELECT 
    name AS IndexName,
    tbl_name AS TableName,
    pgsize AS PageSize,
    ncell AS Cells,
    payload AS Payload,
    unused AS Unused,
    (pgsize * ncell) AS EstimatedSizeBytes
FROM dbstat
WHERE name LIKE 'idx_%'
ORDER BY EstimatedSizeBytes DESC;
```

**Expected Index Sizes (Production Estimates):**

| Index | Table Rows | Index Size (Small Univ) | Index Size (Medium Univ) |
|-------|-----------|-------------------------|--------------------------|
| idx_student_name_covering | 5,000 - 10,000 | ~500 KB - 1 MB | ~2 MB - 5 MB |
| idx_instructor_name | 200 - 500 | ~20 KB - 50 KB | ~100 KB - 300 KB |
| idx_enrollment_student_course | 50,000 - 100,000 | ~5 MB - 10 MB | ~50 MB - 100 MB |
| idx_student_enrollment_date | 5,000 - 10,000 | ~200 KB - 500 KB | ~1 MB - 3 MB |

### Write Performance Impact

**Index Overhead on Writes:**

| Operation | Overhead per Index | Mitigation |
|-----------|-------------------|------------|
| INSERT | +10-20ms per index | Acceptable for read-heavy workload |
| UPDATE (indexed column) | +10-20ms per index | Use partial indexes to reduce scope |
| UPDATE (non-indexed column) | Minimal (~1ms) | No mitigation needed |
| DELETE | +10-20ms per index | Batch deletes if possible |

**Optimization Strategies:**
1. **Limit covering indexes** - Only for highest-traffic queries
2. **Use partial indexes** - Reduce index size and write overhead
3. **Avoid over-indexing** - Max 3-4 non-PK indexes per table
4. **Monitor write latency** - Use application logs to detect slowdowns

### Index Health Checks

**Monthly Review:**
```sql
-- Check for unused indexes (requires query log analysis)
-- SQLite doesn't track index usage natively

-- Check for duplicate or redundant indexes
SELECT name, sql FROM sqlite_master WHERE type = 'index';

-- Example redundancy:
-- idx_student_name (LastName, FirstMidName)
-- idx_student_lastname (LastName)  <- REDUNDANT!
```

**Redundancy Rules:**
- Index `(A, B)` covers queries on `(A)` alone
- Index `(A)` does NOT cover queries on `(B)` or `(A, B)`
- Keep the most general index, drop specific ones

---

## Performance Validation

### Validation Methodology

**Step 1: Establish Baseline**
```bash
# Run performance tests before index changes
sqlite3 school.db <<EOF
.timer on
.mode column

-- Test Query 1: Student search
SELECT ID, LastName, FirstMidName, EnrollmentDate
FROM Student
WHERE LastName LIKE 'A%'
ORDER BY LastName, FirstMidName
LIMIT 10 OFFSET 0;

-- Test Query 2: Instructor list
SELECT i.ID, i.LastName, i.FirstMidName
FROM Instructor i
ORDER BY i.LastName;

-- Test Query 3: Enrollment statistics
SELECT EnrollmentDate, COUNT(*) AS StudentCount
FROM Student
GROUP BY EnrollmentDate;
EOF
```

**Output (example):**
```
Run Time: real 0.245 user 0.180000 sys 0.060000  <- Baseline latency
```

**Step 2: Apply Indexes**
```bash
sqlite3 school.db <<EOF
CREATE INDEX idx_student_name ON Student(LastName, FirstMidName, ID, EnrollmentDate);
CREATE INDEX idx_instructor_name ON Instructor(LastName, FirstMidName);
CREATE INDEX idx_student_enrollment_date ON Student(EnrollmentDate);
EOF
```

**Step 3: Re-run Tests**
```bash
# Same queries as Step 1
sqlite3 school.db <<EOF
.timer on
-- (repeat queries)
EOF
```

**Output (expected):**
```
Run Time: real 0.082 user 0.050000 sys 0.030000  <- 66% improvement!
```

**Step 4: Verify Query Plans**
```bash
sqlite3 school.db <<EOF
EXPLAIN QUERY PLAN
SELECT ID, LastName, FirstMidName, EnrollmentDate
FROM Student
WHERE LastName LIKE 'A%'
ORDER BY LastName, FirstMidName
LIMIT 10 OFFSET 0;
EOF
```

**Expected Output:**
```
QUERY PLAN
`--SCAN INDEX idx_student_name
```

### Performance Test Suite

**Test Script: `validate_indexes.sql`**
```sql
-- Performance Validation Test Suite
-- Run before and after index changes

.timer on
.mode column
.headers on

-- Test 1: Student Search with Pagination
SELECT '=== Test 1: Student Search ===' AS TestName;
EXPLAIN QUERY PLAN
SELECT ID, LastName, FirstMidName, EnrollmentDate
FROM Student
WHERE LastName LIKE 'A%'
ORDER BY LastName, FirstMidName
LIMIT 10 OFFSET 0;

SELECT ID, LastName, FirstMidName, EnrollmentDate
FROM Student
WHERE LastName LIKE 'A%'
ORDER BY LastName, FirstMidName
LIMIT 10 OFFSET 0;

-- Test 2: Instructor List
SELECT '=== Test 2: Instructor List ===' AS TestName;
EXPLAIN QUERY PLAN
SELECT i.ID, i.LastName, i.FirstMidName, i.HireDate
FROM Instructor i
ORDER BY i.LastName;

SELECT i.ID, i.LastName, i.FirstMidName, i.HireDate
FROM Instructor i
ORDER BY i.LastName;

-- Test 3: Student Statistics
SELECT '=== Test 3: Student Statistics ===' AS TestName;
EXPLAIN QUERY PLAN
SELECT EnrollmentDate, COUNT(*) AS StudentCount
FROM Student
GROUP BY EnrollmentDate;

SELECT EnrollmentDate, COUNT(*) AS StudentCount
FROM Student
GROUP BY EnrollmentDate;

-- Test 4: Student Details with Enrollments
SELECT '=== Test 4: Student Details ===' AS TestName;
EXPLAIN QUERY PLAN
SELECT s.ID, s.LastName, s.FirstMidName,
       e.EnrollmentID, e.CourseID, e.Grade
FROM Student s
LEFT JOIN Enrollment e ON s.ID = e.StudentID
WHERE s.ID = 1
ORDER BY e.CourseID;

SELECT s.ID, s.LastName, s.FirstMidName,
       e.EnrollmentID, e.CourseID, e.Grade
FROM Student s
LEFT JOIN Enrollment e ON s.ID = e.StudentID
WHERE s.ID = 1
ORDER BY e.CourseID;

-- Test 5: Course List with Departments
SELECT '=== Test 5: Course List ===' AS TestName;
EXPLAIN QUERY PLAN
SELECT c.CourseID, c.Title, c.Credits,
       d.Name AS DepartmentName
FROM Course c
INNER JOIN Department d ON c.DepartmentID = d.DepartmentID;

SELECT c.CourseID, c.Title, c.Credits,
       d.Name AS DepartmentName
FROM Course c
INNER JOIN Department d ON c.DepartmentID = d.DepartmentID;
```

**Run Test Suite:**
```bash
# Before indexes
sqlite3 school.db < validate_indexes.sql > baseline_results.txt 2>&1

# After indexes
sqlite3 school.db < validate_indexes.sql > optimized_results.txt 2>&1

# Compare results
diff baseline_results.txt optimized_results.txt
```

### Success Criteria

**Performance Targets:**

| Query | Baseline p95 | Target p95 | Minimum Improvement |
|-------|-------------|-----------|---------------------|
| Student search | 250ms | < 100ms | 60% |
| Instructor list | 800ms | < 300ms | 60% (with code fix) |
| Student statistics | 450ms | < 200ms | 50% |
| Student details | 200ms | < 100ms | 50% |
| Course list | 300ms | < 150ms | 50% |

**Query Plan Validation:**

- ✅ **All queries use indexes** (no `SCAN TABLE` on hot tables)
- ✅ **No temp B-trees for ORDER BY** (covered by indexes)
- ✅ **Covering indexes eliminate table lookups** (where applicable)
- ✅ **Foreign key joins use indexes** (already present)

**Database Health:**

- ✅ **Index count: 17-20 total** (12 existing + 5-8 new)
- ✅ **Write latency increase: < 20%** (acceptable for read-heavy app)
- ✅ **Database size increase: < 15%** (covering indexes add size)
- ✅ **VACUUM runtime: < 10 seconds** (for development database)

### Load Testing (Optional)

**Tool:** k6 (JavaScript load testing)

**Script: `load_test.js`**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // 95% of requests under 500ms
  },
};

export default function () {
  // Test student search
  let res1 = http.get('http://localhost:5000/Students?searchString=A');
  check(res1, { 'student search status 200': (r) => r.status === 200 });
  
  // Test instructor list
  let res2 = http.get('http://localhost:5000/Instructors');
  check(res2, { 'instructor list status 200': (r) => r.status === 200 });
  
  // Test about page
  let res3 = http.get('http://localhost:5000/About');
  check(res3, { 'about page status 200': (r) => r.status === 200 });
  
  sleep(1);
}
```

**Run Load Test:**
```bash
# Install k6
curl -L https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz | tar xvz
mv k6-v0.45.0-linux-amd64/k6 /usr/local/bin/

# Before indexes
k6 run load_test.js > baseline_load.txt

# After indexes
k6 run load_test.js > optimized_load.txt

# Compare p95 latencies
grep "http_req_duration" baseline_load.txt optimized_load.txt
```

---

## Summary and Next Steps

### Index Implementation Plan

**Phase 1: Critical Indexes (Week 1)**
1. ✅ `idx_student_name` - Student search and pagination
2. ✅ `idx_instructor_name` - Instructor list sorting
3. ✅ Code fix: Instructor N+1 query elimination

**Phase 2: High-Priority Indexes (Week 2)**
4. ✅ `idx_student_enrollment_date` - About page statistics
5. ✅ `idx_enrollment_student_course` - Student details composite
6. ✅ Validation: Run performance test suite

**Phase 3: Optional Optimizations (Week 3)**
7. ⚠️ `idx_enrollment_grade_notnull` - Partial index for grades
8. ⚠️ `idx_course_title` - Future course search feature
9. ✅ VACUUM maintenance
10. ✅ Load testing and final validation

### Migration Checklist

**Pre-Migration:**
- [ ] Document current SQL Server index definitions
- [ ] Run baseline performance tests (see Validation section)
- [ ] Export EXPLAIN plans for top 10 queries

**During Migration:**
- [ ] Apply schema migration (tables, relationships)
- [ ] Create SQLite indexes (see Recommendations section)
- [ ] Verify index creation with `sqlite3 .indexes`
- [ ] Test query plans with EXPLAIN QUERY PLAN

**Post-Migration:**
- [ ] Run performance test suite (`validate_indexes.sql`)
- [ ] Compare baseline vs optimized latencies
- [ ] Monitor write performance impact (< 20% degradation)
- [ ] Schedule quarterly VACUUM maintenance
- [ ] Update monitoring dashboards with new targets

### Performance Monitoring

**Key Metrics to Track:**

1. **Query Latency (p50, p95, p99)**
   - Student search: Target < 100ms p95
   - Instructor list: Target < 300ms p95
   - About page: Target < 200ms p95

2. **Database Operations**
   - Queries per request: Target < 5 (reduce N+1)
   - Write latency: Monitor INSERT/UPDATE times
   - Index hit rate: Track via EXPLAIN analysis

3. **Resource Utilization**
   - Database file size: Monitor growth rate
   - Index size: Track storage overhead
   - Query cache effectiveness: If implemented

**Tools:**
- SQLite `.timer on` command for query timing
- Application Performance Monitoring (APM) integration
- Custom logging for EF Core query execution times

---

## Appendix: Quick Reference

### All Recommended Indexes (DDL)

```sql
-- Priority: CRITICAL
CREATE INDEX idx_student_name ON Student(LastName, FirstMidName, ID, EnrollmentDate);
CREATE INDEX idx_instructor_name ON Instructor(LastName, FirstMidName);

-- Priority: HIGH
CREATE INDEX idx_student_enrollment_date ON Student(EnrollmentDate);
CREATE INDEX idx_enrollment_student_course ON Enrollment(StudentID, CourseID, Grade);

-- Priority: MEDIUM (Optional)
CREATE INDEX idx_course_title ON Course(Title);

-- Priority: LOW (Optional, SQLite-specific)
CREATE INDEX idx_enrollment_grade_notnull ON Enrollment(Grade) WHERE Grade IS NOT NULL;
CREATE INDEX idx_office_location ON OfficeAssignment(Location) WHERE Location IS NOT NULL;
```

### EXPLAIN Cheat Sheet

| Pattern in Plan | Meaning | Action |
|----------------|---------|--------|
| `SCAN TABLE` | Full table scan | ❌ Add index |
| `SEARCH TABLE USING INDEX` | Index seek | ✅ Optimal |
| `SEARCH TABLE USING PRIMARY KEY` | PK lookup | ✅ Optimal |
| `USE TEMP B-TREE FOR ORDER BY` | Sort in memory | ❌ Add index on ORDER BY |
| `USE TEMP B-TREE FOR GROUP BY` | Group in memory | ⚠️ Add index if slow |
| `SCAN INDEX` | Full index scan | ✅ Good (better than table scan) |

### Performance Validation Commands

```bash
# Check index list
sqlite3 school.db ".indexes"

# Get query plan
sqlite3 school.db "EXPLAIN QUERY PLAN SELECT ...;"

# Time query execution
sqlite3 school.db ".timer on" "SELECT ...;"

# Check database size
ls -lh school.db

# Rebuild indexes (rarely needed)
sqlite3 school.db "REINDEX;"

# Optimize database
sqlite3 school.db "VACUUM;"
```

---

**Document Status:** ✅ Complete  
**Review Required:** Performance Engineering Team, Database Admin  
**Next Review Date:** Post-migration + 1 week  

**Related Documents:**
- `/ContosoUniversity/migration-docs/Performance-Profile.md`
- `/ContosoUniversity/migration-docs/Data-Model-Catalog.md`
- `/ContosoUniversity/migration-docs/Data-Migration-Runbook.md`
