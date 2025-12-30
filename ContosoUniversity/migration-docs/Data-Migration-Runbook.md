---
title: 'Data Migration Runbook - ContosoUniversity'
last_updated: '2025-12-30'
owner: 'Data Migration Team'
status: 'Ready for Review'
database: 'SQL Server (SchoolContext)'
migration_type: 'Database Migration & Data Transfer'
---

# Data Migration Runbook - ContosoUniversity

## Executive Summary

This runbook provides a comprehensive, step-by-step guide for migrating the ContosoUniversity database from the source environment to the target environment. It defines cutover procedures, validation strategies, reconciliation methods, rollback plans, and required tooling for a successful data migration with zero data loss.

**Migration Scope:** Complete database migration including schema, data, indexes, and constraints  
**Estimated Duration:** 2-4 hours (depending on data volume)  
**Downtime Required:** Yes (1-2 hours maintenance window)  
**Data Volume:** TBD - See [Data Model Catalog](./Data-Model-Catalog.md) for estimates  
**Risk Level:** Medium - Multiple cascade relationships require careful sequencing

---

## Table of Contents

- [Migration Overview](#migration-overview)
- [Prerequisites & Dependencies](#prerequisites--dependencies)
- [Pre-Migration Phase](#pre-migration-phase)
- [Migration Execution Phase](#migration-execution-phase)
- [Post-Migration Phase](#post-migration-phase)
- [Rollback Procedures](#rollback-procedures)
- [Tooling & Scripts](#tooling--scripts)
- [Dataset Sampling & Verification](#dataset-sampling--verification)
- [Communication Plan](#communication-plan)
- [Troubleshooting Guide](#troubleshooting-guide)

---

## Migration Overview

### Migration Strategy

**Approach:** Big Bang Migration with Read/Write Freeze  
**Method:** Schema-first, then data transfer with validation  
**Consistency:** ACID transaction boundaries with validation checksums

### Key Principles

1. **Zero Data Loss**: All data must be preserved with validation
2. **Referential Integrity**: Maintain all foreign key relationships
3. **Minimal Downtime**: Optimize for fastest safe migration
4. **Rollback Capability**: Always maintain ability to revert
5. **Validation First**: Verify before declaring success

### Migration Phases Timeline

| Phase | Duration | Activities | Rollback Point |
|-------|----------|------------|----------------|
| **Pre-Migration** | 30 min | Backups, validation, freeze | Yes - No changes made |
| **Execution** | 60-90 min | Schema & data transfer | Yes - Until commit |
| **Validation** | 30-45 min | Reconciliation, testing | Yes - Can rollback |
| **Go-Live** | 15 min | Unfreeze, monitor | Limited - Rollback complex |

**Total Estimated Time:** 2.5 - 3 hours

---

## Prerequisites & Dependencies

### Required Access & Permissions

**Source Database:**
- [ ] `db_datareader` role on source SchoolContext database
- [ ] `VIEW DEFINITION` permission for schema export
- [ ] Access to database server (network connectivity)

**Target Database:**
- [ ] `db_owner` role on target database
- [ ] Permission to create/drop tables, indexes, constraints
- [ ] Permission to bulk insert data

**Application:**
- [ ] Administrative access to stop/start application services
- [ ] Access to application configuration files
- [ ] Permission to modify connection strings

### Software Requirements

| Tool | Version | Purpose | Installation Link |
|------|---------|---------|-------------------|
| **SQL Server Management Studio (SSMS)** | 18.0+ | Database management and migration | [Download](https://aka.ms/ssmsfullsetup) |
| **SQL Server Data Tools (SSDT)** | Latest | Schema comparison | [Download](https://docs.microsoft.com/sql/ssdt) |
| **.NET SDK** | 6.0+ | Run EF Core migrations | [Download](https://dotnet.microsoft.com/download) |
| **BCP Utility** | Built-in | Bulk data export/import | Included with SQL Server |
| **PowerShell** | 5.1+ or 7+ | Automation scripts | [Download](https://aka.ms/powershell) |

### Network & Infrastructure

- [ ] VPN/network access to source and target databases
- [ ] Firewall rules allowing SQL Server port (default 1433)
- [ ] Sufficient disk space on target server (2x source database size)
- [ ] Backup storage location accessible from both environments

### Documentation References

- [Data Model Catalog](./Data-Model-Catalog.md) - Complete schema and relationship documentation
- [Architecture Overview](./01-Architecture-Overview.md) - System architecture and deployment
- [Project Overview](./00-Project-Overview.md) - Migration project context

---

## Pre-Migration Phase

### Pre-Checks

Execute these validation checks **24 hours before** the migration window.

#### 1. Source Database Health Check

```sql
-- Check database status
SELECT 
    name AS DatabaseName,
    state_desc AS State,
    recovery_model_desc AS RecoveryModel,
    compatibility_level AS CompatLevel
FROM sys.databases
WHERE name LIKE '%SchoolContext%';

-- Check for corruption
DBCC CHECKDB('SchoolContext') WITH NO_INFOMSGS, ALL_ERRORMSGS;

-- Verify no blocking locks
SELECT 
    session_id,
    blocking_session_id,
    wait_type,
    wait_time,
    wait_resource
FROM sys.dm_exec_requests
WHERE blocking_session_id <> 0;
```

**Expected Result:** Database state = ONLINE, no corruption errors, no blocking locks

#### 2. Current Data Volume Assessment

```sql
-- Get row counts for all tables
SELECT 
    t.name AS TableName,
    SUM(p.rows) AS RowCount
FROM sys.tables t
INNER JOIN sys.partitions p ON t.object_id = p.object_id
WHERE p.index_id IN (0,1)
GROUP BY t.name
ORDER BY SUM(p.rows) DESC;

-- Get database size
EXEC sp_spaceused;

-- Get table sizes
EXEC sp_MSforeachtable @command1="EXEC sp_spaceused '?'";
```

**Action:** Document row counts and sizes in the [Dataset Baseline Table](#dataset-baseline) below.

#### 3. Referential Integrity Validation

```sql
-- Check for orphaned records (example for Enrollments)
SELECT COUNT(*) AS OrphanedEnrollments
FROM Enrollments e
LEFT JOIN Student s ON e.StudentID = s.ID
WHERE s.ID IS NULL;

SELECT COUNT(*) AS OrphanedEnrollments
FROM Enrollments e
LEFT JOIN Course c ON e.CourseID = c.CourseID
WHERE c.CourseID IS NULL;

-- Verify all foreign keys are enabled
SELECT 
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    fk.is_disabled AS IsDisabled
FROM sys.foreign_keys fk
WHERE fk.is_disabled = 1;
```

**Expected Result:** Zero orphaned records, all foreign keys enabled

#### 4. Application Connectivity Test

```bash
# Test database connection from application server
dotnet ef database update --project ./ContosoUniversity --connection "YOUR_CONNECTION_STRING"

# Verify application can read data
curl -I http://localhost:5000/Students
```

**Expected Result:** HTTP 200 OK, no connection errors

#### 5. Backup Verification

```sql
-- Check last successful backup
SELECT 
    database_name,
    backup_start_date,
    backup_finish_date,
    backup_size / 1024 / 1024 AS BackupSizeMB,
    compressed_backup_size / 1024 / 1024 AS CompressedSizeMB,
    type AS BackupType
FROM msdb.dbo.backupset
WHERE database_name LIKE '%SchoolContext%'
ORDER BY backup_finish_date DESC;
```

**Expected Result:** Recent full backup within last 24 hours

---

### Environment Preparation

#### 1. Target Database Creation

```sql
-- Create target database with appropriate settings
CREATE DATABASE [SchoolContext_Target]
ON PRIMARY 
(
    NAME = N'SchoolContext_Target',
    FILENAME = N'C:\SQLData\SchoolContext_Target.mdf',
    SIZE = 100MB,
    FILEGROWTH = 50MB
)
LOG ON 
(
    NAME = N'SchoolContext_Target_log',
    FILENAME = N'C:\SQLData\SchoolContext_Target_log.ldf',
    SIZE = 50MB,
    FILEGROWTH = 25MB
);

-- Set recovery model to SIMPLE for faster bulk operations
ALTER DATABASE [SchoolContext_Target] SET RECOVERY SIMPLE;

-- Set compatibility level to match source
ALTER DATABASE [SchoolContext_Target] SET COMPATIBILITY_LEVEL = 150;
```

#### 2. Application Freeze (Read-Only Mode)

**Timeline:** Start of migration window

**Option A: Application-Level Freeze** (Preferred)
```bash
# Stop the application service
systemctl stop contoso-university.service  # Linux
# OR
Stop-Service -Name "ContosoUniversity"  # Windows
```

**Option B: Database-Level Read-Only**
```sql
-- Set database to read-only mode
ALTER DATABASE [SchoolContext] SET READ_ONLY WITH ROLLBACK IMMEDIATE;
```

**Option C: Application Maintenance Page**
- Deploy maintenance page to application
- Redirect all traffic to maintenance mode
- Block write operations via middleware

**Verification:**
```sql
-- Verify no active connections writing data
SELECT 
    session_id,
    login_name,
    program_name,
    status,
    last_request_start_time
FROM sys.dm_exec_sessions
WHERE database_id = DB_ID('SchoolContext')
AND is_user_process = 1;
```

#### 3. Communication Notifications

**T-24 hours:**
- [ ] Email all stakeholders about upcoming maintenance
- [ ] Post notification on application homepage
- [ ] Update status page

**T-1 hour:**
- [ ] Final reminder email
- [ ] Begin maintenance mode countdown

**T-0 (Start):**
- [ ] Enable maintenance page
- [ ] Send "Migration in Progress" notification

---

### Backup Procedures

#### 1. Full Source Database Backup

```sql
-- Full backup with compression
BACKUP DATABASE [SchoolContext]
TO DISK = 'C:\Backups\SchoolContext_PreMigration_20251230.bak'
WITH 
    COMPRESSION,
    CHECKSUM,
    STATS = 10,
    DESCRIPTION = 'Pre-migration full backup for cutover';

-- Verify backup integrity
RESTORE VERIFYONLY 
FROM DISK = 'C:\Backups\SchoolContext_PreMigration_20251230.bak'
WITH CHECKSUM;
```

**Backup Location:** Store in secure, accessible location  
**Retention:** Keep for 7 days post-migration  
**Size:** Approximately 50-500 MB (varies by data volume)

#### 2. Export Database Schema

```bash
# Using SQL Server Data Tools (SSDT)
# Export schema to DACPAC file
sqlpackage.exe /Action:Extract \
    /SourceServerName:localhost \
    /SourceDatabaseName:SchoolContext \
    /TargetFile:SchoolContext_Schema.dacpac

# Alternative: Script out schema using SSMS
# Tools > Generate Scripts > Select all objects > Save to file
```

#### 3. Configuration Backup

```bash
# Backup application configuration
cp appsettings.json appsettings.json.backup
cp appsettings.Production.json appsettings.Production.json.backup

# Backup connection strings
# Document current connection string for rollback
```

---

## Migration Execution Phase

### Table Sequencing Strategy

**Migration Order:** Based on foreign key dependencies (bottom-up approach)

The table migration sequence must respect referential integrity constraints. Tables with no dependencies are migrated first, followed by tables that reference them.

#### Dependency Graph

```
Level 0 (No Dependencies):
  ├── Instructor
  └── Student

Level 1 (Depends on Level 0):
  ├── Department (depends on Instructor for Administrator)
  └── OfficeAssignment (depends on Instructor, 1:1 relationship)

Level 2 (Depends on Level 1):
  └── Course (depends on Department)

Level 3 (Depends on Level 2):
  ├── Enrollment (depends on Student + Course)
  └── CourseInstructor (depends on Course + Instructor)
```

#### Migration Sequence Table

| Order | Table | Rows (Est.) | Dependencies | Strategy | Notes |
|-------|-------|-------------|--------------|----------|-------|
| **1** | Instructor | 5-500 | None | Direct copy | No FK dependencies |
| **2** | Student | 8-10,000 | None | Direct copy | No FK dependencies |
| **3** | OfficeAssignment | 3-400 | Instructor (FK) | Direct copy | 1:1 with Instructor |
| **4** | Department | 4-100 | Instructor (FK, nullable) | Direct copy | Administrator reference |
| **5** | Course | 7-5,000 | Department (FK) | Direct copy | Manual CourseID assignment |
| **6** | Enrollment | 11-1M | Student + Course (FK) | Batched copy | Largest table, high volume |
| **7** | CourseInstructor | 10-15,000 | Course + Instructor (FK) | Direct copy | Many-to-many junction |

**Critical Notes:**
- **Department** has nullable InstructorID (administrator), so it can be inserted after Instructor
- **Enrollment** is the largest table and should use batched inserts
- **CourseInstructor** must be last due to composite foreign keys
- Identity seed values must be preserved for auto-increment columns

---

### Schema Migration

#### Step 1: Run EF Core Migrations on Target

```bash
# Set connection string to target database
export ConnectionStrings__DefaultConnection="Server=TARGET_SERVER;Database=SchoolContext_Target;Trusted_Connection=True;MultipleActiveResultSets=true"

# Navigate to project directory
cd /path/to/ContosoUniversity

# Apply all migrations to target database
dotnet ef database update --project ./ContosoUniversity.csproj

# Verify migration success
dotnet ef migrations list --project ./ContosoUniversity.csproj
```

**Expected Result:** All tables, indexes, and constraints created on target database

#### Step 2: Verify Schema Parity

```sql
-- Compare table counts
SELECT COUNT(*) AS TableCount FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE';

-- Compare column counts
SELECT 
    TABLE_NAME,
    COUNT(*) AS ColumnCount
FROM INFORMATION_SCHEMA.COLUMNS
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;

-- Compare foreign keys
SELECT 
    OBJECT_NAME(parent_object_id) AS TableName,
    COUNT(*) AS FKCount
FROM sys.foreign_keys
GROUP BY parent_object_id
ORDER BY TableName;
```

**Action:** Document any discrepancies and resolve before proceeding

#### Step 3: Disable Constraints for Data Load

```sql
-- Disable all foreign key constraints (for faster insert)
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT ALL";

-- Disable all triggers (if any)
EXEC sp_MSforeachtable "ALTER TABLE ? DISABLE TRIGGER ALL";
```

**Warning:** Constraints will be re-enabled after data validation

---

### Data Migration

#### Step 1: Export Data from Source

**Method A: BCP (Bulk Copy Program)** - Recommended for large datasets

```bash
# Export each table to native format (fastest)
# Replace YOUR_SERVER, YOUR_DATABASE with actual values

# Instructor
bcp "SchoolContext.dbo.Instructor" out "Instructor.dat" \
    -S YOUR_SERVER -T -n -q

# Student
bcp "SchoolContext.dbo.Student" out "Student.dat" \
    -S YOUR_SERVER -T -n -q

# OfficeAssignment
bcp "SchoolContext.dbo.OfficeAssignments" out "OfficeAssignments.dat" \
    -S YOUR_SERVER -T -n -q

# Department
bcp "SchoolContext.dbo.Departments" out "Departments.dat" \
    -S YOUR_SERVER -T -n -q

# Course
bcp "SchoolContext.dbo.Course" out "Course.dat" \
    -S YOUR_SERVER -T -n -q

# Enrollment (use batched export for large tables)
bcp "SchoolContext.dbo.Enrollments" out "Enrollments.dat" \
    -S YOUR_SERVER -T -n -q -b 10000

# CourseInstructor
bcp "SchoolContext.dbo.CourseInstructor" out "CourseInstructor.dat" \
    -S YOUR_SERVER -T -n -q
```

**Method B: SQL Server Import/Export Wizard** - For smaller datasets
- Right-click database > Tasks > Export Data
- Select target database
- Map tables one-by-one

**Method C: PowerShell Script** - For automated pipeline

```powershell
# Export to CSV for human-readable backup
$tables = @('Instructor', 'Student', 'OfficeAssignments', 'Departments', 'Course', 'Enrollments', 'CourseInstructor')
$sourceServer = "SOURCE_SERVER"
$sourceDb = "SchoolContext"
$outputPath = "C:\Migration\Export"

foreach ($table in $tables) {
    $query = "SELECT * FROM $table"
    Invoke-Sqlcmd -ServerInstance $sourceServer -Database $sourceDb -Query $query |
        Export-Csv -Path "$outputPath\$table.csv" -NoTypeInformation
    Write-Host "Exported $table"
}
```

#### Step 2: Import Data to Target

**Using BCP (matches Method A):**

```bash
# Import in dependency order
# Target server: TARGET_SERVER

# 1. Instructor (no dependencies)
bcp "SchoolContext_Target.dbo.Instructor" in "Instructor.dat" \
    -S TARGET_SERVER -T -n -q -h "TABLOCK" -b 1000

# 2. Student (no dependencies)
bcp "SchoolContext_Target.dbo.Student" in "Student.dat" \
    -S TARGET_SERVER -T -n -q -h "TABLOCK" -b 1000

# 3. OfficeAssignment
bcp "SchoolContext_Target.dbo.OfficeAssignments" in "OfficeAssignments.dat" \
    -S TARGET_SERVER -T -n -q -h "TABLOCK" -b 1000

# 4. Department
bcp "SchoolContext_Target.dbo.Departments" in "Departments.dat" \
    -S TARGET_SERVER -T -n -q -h "TABLOCK" -b 1000

# 5. Course
bcp "SchoolContext_Target.dbo.Course" in "Course.dat" \
    -S TARGET_SERVER -T -n -q -h "TABLOCK" -b 1000

# 6. Enrollment (large table, use smaller batches)
bcp "SchoolContext_Target.dbo.Enrollments" in "Enrollments.dat" \
    -S TARGET_SERVER -T -n -q -h "TABLOCK" -b 5000

# 7. CourseInstructor
bcp "SchoolContext_Target.dbo.CourseInstructor" in "CourseInstructor.dat" \
    -S TARGET_SERVER -T -n -q -h "TABLOCK" -b 1000
```

**Options Explained:**
- `-n`: Native format (binary, fastest)
- `-q`: Quoted identifiers
- `-h "TABLOCK"`: Table lock for faster bulk insert
- `-b 5000`: Batch size (rows per transaction)

#### Step 3: Verify Data Transfer Counts

```sql
-- Run on TARGET database
SELECT 'Instructor' AS TableName, COUNT(*) AS RowCount FROM Instructor
UNION ALL
SELECT 'Student', COUNT(*) FROM Student
UNION ALL
SELECT 'OfficeAssignments', COUNT(*) FROM OfficeAssignments
UNION ALL
SELECT 'Departments', COUNT(*) FROM Departments
UNION ALL
SELECT 'Course', COUNT(*) FROM Course
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM Enrollments
UNION ALL
SELECT 'CourseInstructor', COUNT(*) FROM CourseInstructor
ORDER BY TableName;
```

**Action:** Compare row counts with [Dataset Baseline Table](#dataset-baseline) from pre-checks

#### Step 4: Reseed Identity Columns

**Critical:** Set identity seed values to match source database

```sql
-- Check current identity values on SOURCE database
SELECT 
    OBJECT_NAME(object_id) AS TableName,
    name AS ColumnName,
    last_value AS CurrentIdentityValue
FROM sys.identity_columns
WHERE OBJECT_NAME(object_id) IN ('Student', 'Instructor', 'Enrollments', 'Departments');

-- Reseed identity columns on TARGET database
-- Replace <current_max_value> with values from source

DBCC CHECKIDENT ('Student', RESEED, <current_max_value>);
DBCC CHECKIDENT ('Instructor', RESEED, <current_max_value>);
DBCC CHECKIDENT ('Enrollments', RESEED, <current_max_value>);
DBCC CHECKIDENT ('Departments', RESEED, <current_max_value>);

-- Verify reseeded values
DBCC CHECKIDENT ('Student', NORESEED);
DBCC CHECKIDENT ('Instructor', NORESEED);
DBCC CHECKIDENT ('Enrollments', NORESEED);
DBCC CHECKIDENT ('Departments', NORESEED);
```

---

### Index & Constraint Recreation

#### Step 1: Enable Foreign Key Constraints

```sql
-- Re-enable all foreign key constraints
EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL";

-- Verify constraints are trusted (no violations)
SELECT 
    OBJECT_NAME(parent_object_id) AS TableName,
    name AS ConstraintName,
    is_disabled,
    is_not_trusted
FROM sys.foreign_keys
WHERE is_not_trusted = 1 OR is_disabled = 1;
```

**Expected Result:** All constraints enabled and trusted (no rows returned)

**If Violations Found:**
```sql
-- Identify orphaned records
-- Example for Enrollments:
SELECT e.*
FROM Enrollments e
LEFT JOIN Student s ON e.StudentID = s.ID
WHERE s.ID IS NULL;

SELECT e.*
FROM Enrollments e
LEFT JOIN Course c ON e.CourseID = c.CourseID
WHERE c.CourseID IS NULL;
```

**Action:** Resolve any data integrity issues before proceeding

#### Step 2: Rebuild Indexes

```sql
-- Rebuild all indexes for optimal performance
EXEC sp_MSforeachtable 'ALTER INDEX ALL ON ? REBUILD WITH (ONLINE = OFF, FILLFACTOR = 90)';

-- Update statistics
EXEC sp_MSforeachtable 'UPDATE STATISTICS ? WITH FULLSCAN';
```

**Duration:** 5-15 minutes depending on data volume

#### Step 3: Verify Index Health

```sql
-- Check index fragmentation
SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.index_type_desc,
    ips.avg_fragmentation_in_percent,
    ips.page_count
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'SAMPLED') ips
INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 10
ORDER BY ips.avg_fragmentation_in_percent DESC;
```

**Expected Result:** Fragmentation < 10% for all indexes

---

## Post-Migration Phase

### Data Validation

#### 1. Row Count Reconciliation

```sql
-- Compare source and target row counts
-- Run this query on BOTH source and target databases
SELECT 'SOURCE/TARGET' AS Environment,
    (SELECT COUNT(*) FROM Instructor) AS Instructor,
    (SELECT COUNT(*) FROM Student) AS Student,
    (SELECT COUNT(*) FROM OfficeAssignments) AS OfficeAssignments,
    (SELECT COUNT(*) FROM Departments) AS Departments,
    (SELECT COUNT(*) FROM Course) AS Course,
    (SELECT COUNT(*) FROM Enrollments) AS Enrollments,
    (SELECT COUNT(*) FROM CourseInstructor) AS CourseInstructor;
```

**Acceptance Criteria:** Row counts must match exactly (100% parity)

#### 2. Data Sampling Validation

**Sample random records to verify data integrity:**

```sql
-- Sample 10 random students
SELECT TOP 10 * FROM Student ORDER BY NEWID();

-- Sample 10 random enrollments with joins
SELECT TOP 10 
    e.EnrollmentID,
    s.LastName + ', ' + s.FirstName AS StudentName,
    c.Title AS CourseName,
    e.Grade
FROM Enrollments e
INNER JOIN Student s ON e.StudentID = s.ID
INNER JOIN Course c ON e.CourseID = c.CourseID
ORDER BY NEWID();

-- Verify Department relationships
SELECT 
    d.Name AS DepartmentName,
    i.LastName + ', ' + i.FirstName AS Administrator,
    COUNT(c.CourseID) AS CourseCount
FROM Departments d
LEFT JOIN Instructor i ON d.InstructorID = i.ID
LEFT JOIN Course c ON d.DepartmentID = c.DepartmentID
GROUP BY d.Name, i.LastName, i.FirstName;
```

**Action:** Manually compare 10-20 sample records between source and target

#### 3. Referential Integrity Validation

```sql
-- Verify no orphaned records (same as pre-check)
-- Should return 0 for all queries

SELECT 'Orphaned Enrollments (Student)' AS CheckType, COUNT(*) AS Count
FROM Enrollments e
LEFT JOIN Student s ON e.StudentID = s.ID
WHERE s.ID IS NULL
UNION ALL
SELECT 'Orphaned Enrollments (Course)', COUNT(*)
FROM Enrollments e
LEFT JOIN Course c ON e.CourseID = c.CourseID
WHERE c.CourseID IS NULL
UNION ALL
SELECT 'Orphaned Courses (Department)', COUNT(*)
FROM Course c
LEFT JOIN Departments d ON c.DepartmentID = d.DepartmentID
WHERE d.DepartmentID IS NULL
UNION ALL
SELECT 'Orphaned OfficeAssignments (Instructor)', COUNT(*)
FROM OfficeAssignments oa
LEFT JOIN Instructor i ON oa.InstructorID = i.ID
WHERE i.ID IS NULL
UNION ALL
SELECT 'Orphaned CourseInstructor (Course)', COUNT(*)
FROM CourseInstructor ci
LEFT JOIN Course c ON ci.CoursesCourseID = c.CourseID
WHERE c.CourseID IS NULL
UNION ALL
SELECT 'Orphaned CourseInstructor (Instructor)', COUNT(*)
FROM CourseInstructor ci
LEFT JOIN Instructor i ON ci.InstructorsID = i.ID
WHERE i.ID IS NULL;
```

**Expected Result:** All counts = 0

#### 4. Checksum Validation (Optional - for critical data)

```sql
-- Generate checksums for critical tables
-- Example for Student table
SELECT 
    'Student' AS TableName,
    CHECKSUM_AGG(CHECKSUM(*)) AS TableChecksum
FROM Student;

-- Run same query on source and target, compare checksums
```

**Note:** Checksums may differ if rowversion columns exist (Department.ConcurrencyToken)

---

### Reconciliation

#### 1. Business Logic Validation

**Enrollment Counts Per Student:**
```sql
-- Verify enrollment counts match expectations
SELECT 
    s.ID,
    s.LastName,
    s.FirstName,
    COUNT(e.EnrollmentID) AS EnrollmentCount
FROM Student s
LEFT JOIN Enrollments e ON s.ID = e.StudentID
GROUP BY s.ID, s.LastName, s.FirstName
HAVING COUNT(e.EnrollmentID) > 10  -- Flag students with unusual enrollment counts
ORDER BY EnrollmentCount DESC;
```

**Course Capacity Validation:**
```sql
-- Ensure courses have reasonable enrollment numbers
SELECT 
    c.CourseID,
    c.Title,
    COUNT(e.EnrollmentID) AS EnrollmentCount,
    COUNT(DISTINCT ci.InstructorsID) AS InstructorCount
FROM Course c
LEFT JOIN Enrollments e ON c.CourseID = e.CourseID
LEFT JOIN CourseInstructor ci ON c.CourseID = ci.CoursesCourseID
GROUP BY c.CourseID, c.Title
ORDER BY EnrollmentCount DESC;
```

**Department Budget Totals:**
```sql
-- Verify department budget values migrated correctly
SELECT 
    Name,
    Budget,
    StartDate,
    (SELECT LastName + ', ' + FirstName FROM Instructor WHERE ID = InstructorID) AS Administrator
FROM Departments
ORDER BY Budget DESC;
```

#### 2. Special Character & Encoding Validation

```sql
-- Verify special characters in names (é, ñ, etc.)
SELECT * FROM Student WHERE LastName LIKE '%[^a-zA-Z ]%' OR FirstName LIKE '%[^a-zA-Z ]%';
SELECT * FROM Instructor WHERE LastName LIKE '%[^a-zA-Z ]%' OR FirstName LIKE '%[^a-zA-Z ]%';

-- Verify no encoding corruption
SELECT * FROM Course WHERE Title LIKE '%?%' OR Title LIKE '%�%';
```

**Expected Result:** Special characters should render correctly, no � symbols

#### 3. Date Field Validation

```sql
-- Verify date ranges are reasonable
SELECT 
    'Student EnrollmentDate' AS FieldName,
    MIN(EnrollmentDate) AS MinDate,
    MAX(EnrollmentDate) AS MaxDate,
    COUNT(*) AS RecordCount
FROM Student
UNION ALL
SELECT 
    'Instructor HireDate',
    MIN(HireDate),
    MAX(HireDate),
    COUNT(*)
FROM Instructor
UNION ALL
SELECT 
    'Department StartDate',
    MIN(StartDate),
    MAX(StartDate),
    COUNT(*)
FROM Departments;
```

**Expected Result:** Dates within reasonable ranges (no year 1900 or future dates)

---

### Performance Verification

#### 1. Query Performance Baseline

```sql
-- Turn on execution statistics
SET STATISTICS TIME ON;
SET STATISTICS IO ON;

-- Test query 1: Student list with pagination
SELECT * FROM Student
ORDER BY LastName, FirstName
OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;

-- Test query 2: Enrollments with joins
SELECT 
    s.LastName + ', ' + s.FirstName AS StudentName,
    c.Title AS CourseName,
    e.Grade
FROM Enrollments e
INNER JOIN Student s ON e.StudentID = s.ID
INNER JOIN Course c ON e.CourseID = c.CourseID
WHERE s.ID = 1;

-- Test query 3: Department with courses
SELECT 
    d.Name AS DepartmentName,
    COUNT(c.CourseID) AS CourseCount
FROM Departments d
LEFT JOIN Course c ON d.DepartmentID = c.DepartmentID
GROUP BY d.Name;

SET STATISTICS TIME OFF;
SET STATISTICS IO OFF;
```

**Acceptance Criteria:**
- Query 1: < 50ms
- Query 2: < 100ms
- Query 3: < 200ms

**If Performance Issues:**
- Check index fragmentation
- Rebuild indexes
- Update statistics
- Review execution plans

#### 2. Index Usage Validation

```sql
-- Check if indexes are being used
SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks,
    s.user_scans,
    s.user_lookups,
    s.user_updates
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE database_id = DB_ID()
ORDER BY s.user_seeks + s.user_scans + s.user_lookups DESC;
```

**Expected Result:** Primary keys and foreign key indexes showing usage

#### 3. Application Smoke Tests

**Start the application pointing to target database:**

```bash
# Update connection string in appsettings.json
# Set ConnectionStrings:DefaultConnection to target database

# Start application
dotnet run --project ./ContosoUniversity.csproj

# OR start as service
systemctl start contoso-university.service
```

**Manual Tests:**
- [ ] Navigate to /Students - verify list loads
- [ ] Click on a student - verify details page loads
- [ ] Navigate to /Courses - verify list loads
- [ ] Navigate to /Instructors - verify list loads
- [ ] Test pagination on Students page
- [ ] Test search functionality (if exists)
- [ ] Verify no application errors in logs

**Expected Result:** All pages load within 2 seconds, no errors


---

## Rollback Procedures

### Rollback Decision Matrix

| Scenario | When to Rollback | Rollback Method |
|----------|------------------|-----------------|
| **Pre-checks fail** | Any validation error | No rollback needed - migration not started |
| **Schema migration fails** | Tables not created correctly | Drop target database, restore source |
| **Data transfer incomplete** | Row counts don't match | Restore source, retry transfer |
| **Referential integrity violations** | Orphaned records found | Restore source, fix data issues |
| **Performance degradation** | Query times > 2x baseline | Restore source, investigate indexes |
| **Application errors** | Critical functionality broken | Immediate rollback to source |

### Rollback Procedure

#### Step 1: Assess Rollback Scope

**Decision Point:** Can we fix forward or must we rollback?

**Fix Forward Scenarios:**
- Minor data discrepancies (can update target)
- Missing indexes (can recreate)
- Performance issues (can optimize)

**Must Rollback Scenarios:**
- Massive data loss (>1% of records)
- Corrupted data
- Critical application failures
- Time overrun (exceeded maintenance window)

#### Step 2: Execute Rollback

**Option A: Restore Source Database (if target already in use)**

```sql
-- Stop all connections to source database
ALTER DATABASE [SchoolContext] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;

-- Restore from backup
RESTORE DATABASE [SchoolContext]
FROM DISK = 'C:\Backups\SchoolContext_PreMigration_20251230.bak'
WITH REPLACE,
    RECOVERY,
    STATS = 10;

-- Set database to multi-user mode
ALTER DATABASE [SchoolContext] SET MULTI_USER;
```

**Option B: Revert Application Connection String**

```bash
# Restore backed up configuration
cp appsettings.json.backup appsettings.json

# Restart application pointing to source database
systemctl restart contoso-university.service
```

**Option C: Abort Before Cutover**

If migration not yet completed and source database still available:
- Drop target database
- Remove maintenance page
- Resume normal operations on source

#### Step 3: Verify Rollback Success

```sql
-- Verify source database online
SELECT 
    name,
    state_desc,
    user_access_desc
FROM sys.databases
WHERE name = 'SchoolContext';

-- Test sample queries
SELECT COUNT(*) FROM Student;
SELECT COUNT(*) FROM Enrollments;

-- Verify application connectivity
```

**Action:** Test application end-to-end on source database

#### Step 4: Communicate Rollback

- [ ] Notify all stakeholders of rollback
- [ ] Update status page
- [ ] Document rollback reason
- [ ] Schedule post-mortem meeting

---

## Tooling & Scripts

### Required Scripts

#### 1. Row Count Comparison Script

**PowerShell Script:** `Compare-RowCounts.ps1`

```powershell
param(
    [string]$SourceServer,
    [string]$SourceDatabase,
    [string]$TargetServer,
    [string]$TargetDatabase
)

$query = @"
SELECT 
    'Instructor' AS TableName, COUNT(*) AS RowCount FROM Instructor
UNION ALL SELECT 'Student', COUNT(*) FROM Student
UNION ALL SELECT 'OfficeAssignments', COUNT(*) FROM OfficeAssignments
UNION ALL SELECT 'Departments', COUNT(*) FROM Departments
UNION ALL SELECT 'Course', COUNT(*) FROM Course
UNION ALL SELECT 'Enrollments', COUNT(*) FROM Enrollments
UNION ALL SELECT 'CourseInstructor', COUNT(*) FROM CourseInstructor
ORDER BY TableName
"@

Write-Host "Source Database Counts:" -ForegroundColor Cyan
$sourceCounts = Invoke-Sqlcmd -ServerInstance $SourceServer -Database $SourceDatabase -Query $query
$sourceCounts | Format-Table

Write-Host "Target Database Counts:" -ForegroundColor Cyan
$targetCounts = Invoke-Sqlcmd -ServerInstance $TargetServer -Database $TargetDatabase -Query $query
$targetCounts | Format-Table

Write-Host "Comparison:" -ForegroundColor Yellow
for ($i = 0; $i -lt $sourceCounts.Count; $i++) {
    $table = $sourceCounts[$i].TableName
    $sourceCount = $sourceCounts[$i].RowCount
    $targetCount = $targetCounts[$i].RowCount
    $match = if ($sourceCount -eq $targetCount) { "MATCH" } else { "MISMATCH" }
    $color = if ($match -eq "MATCH") { "Green" } else { "Red" }
    
    Write-Host "$table : Source=$sourceCount, Target=$targetCount - $match" -ForegroundColor $color
}
```

**Usage:**
```powershell
.\Compare-RowCounts.ps1 `
    -SourceServer "localhost" `
    -SourceDatabase "SchoolContext" `
    -TargetServer "targetserver" `
    -TargetDatabase "SchoolContext_Target"
```

#### 2. Referential Integrity Check Script

**SQL Script:** `Check-ReferentialIntegrity.sql`

```sql
-- Save as a .sql file and execute on target database
PRINT 'Checking Referential Integrity...';
PRINT '';

-- Check 1: Orphaned Enrollments (Student)
DECLARE @OrphanedEnrollmentsStudent INT;
SELECT @OrphanedEnrollmentsStudent = COUNT(*)
FROM Enrollments e
LEFT JOIN Student s ON e.StudentID = s.ID
WHERE s.ID IS NULL;
PRINT 'Orphaned Enrollments (Student FK): ' + CAST(@OrphanedEnrollmentsStudent AS VARCHAR);

-- Check 2: Orphaned Enrollments (Course)
DECLARE @OrphanedEnrollmentsCourse INT;
SELECT @OrphanedEnrollmentsCourse = COUNT(*)
FROM Enrollments e
LEFT JOIN Course c ON e.CourseID = c.CourseID
WHERE c.CourseID IS NULL;
PRINT 'Orphaned Enrollments (Course FK): ' + CAST(@OrphanedEnrollmentsCourse AS VARCHAR);

-- Check 3: Orphaned Courses
DECLARE @OrphanedCourses INT;
SELECT @OrphanedCourses = COUNT(*)
FROM Course c
LEFT JOIN Departments d ON c.DepartmentID = d.DepartmentID
WHERE d.DepartmentID IS NULL;
PRINT 'Orphaned Courses (Department FK): ' + CAST(@OrphanedCourses AS VARCHAR);

-- Check 4: Orphaned OfficeAssignments
DECLARE @OrphanedOffices INT;
SELECT @OrphanedOffices = COUNT(*)
FROM OfficeAssignments oa
LEFT JOIN Instructor i ON oa.InstructorID = i.ID
WHERE i.ID IS NULL;
PRINT 'Orphaned OfficeAssignments (Instructor FK): ' + CAST(@OrphanedOffices AS VARCHAR);

-- Check 5: Orphaned CourseInstructor (Course)
DECLARE @OrphanedCICourse INT;
SELECT @OrphanedCICourse = COUNT(*)
FROM CourseInstructor ci
LEFT JOIN Course c ON ci.CoursesCourseID = c.CourseID
WHERE c.CourseID IS NULL;
PRINT 'Orphaned CourseInstructor (Course FK): ' + CAST(@OrphanedCICourse AS VARCHAR);

-- Check 6: Orphaned CourseInstructor (Instructor)
DECLARE @OrphanedCIInstructor INT;
SELECT @OrphanedCIInstructor = COUNT(*)
FROM CourseInstructor ci
LEFT JOIN Instructor i ON ci.InstructorsID = i.ID
WHERE i.ID IS NULL;
PRINT 'Orphaned CourseInstructor (Instructor FK): ' + CAST(@OrphanedCIInstructor AS VARCHAR);

PRINT '';
DECLARE @TotalOrphans INT = 
    @OrphanedEnrollmentsStudent + @OrphanedEnrollmentsCourse + 
    @OrphanedCourses + @OrphanedOffices + 
    @OrphanedCICourse + @OrphanedCIInstructor;

IF @TotalOrphans = 0
    PRINT '✓ PASSED: No referential integrity violations found.';
ELSE
    PRINT '✗ FAILED: ' + CAST(@TotalOrphans AS VARCHAR) + ' referential integrity violations found!';
```

---

## Dataset Sampling & Verification

### Dataset Baseline

**Document row counts from source database before migration:**

| Table | Source Row Count | Target Row Count | Match | Notes |
|-------|------------------|------------------|-------|-------|
| Instructor | | | | |
| Student | | | | |
| OfficeAssignments | | | | |
| Departments | | | | |
| Course | | | | |
| Enrollments | | | | |
| CourseInstructor | | | | |
| **TOTAL** | | | | |

**Capture Date:** _____________  
**Captured By:** _____________  

### Sample Records for Manual Verification

**Select 5-10 critical records to verify manually:**

**Student Samples:**
| ID | LastName | FirstName | EnrollmentDate | Source✓ | Target✓ |
|----|----------|-----------|----------------|---------|---------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

**Enrollment Samples:**
| EnrollmentID | StudentID | CourseID | Grade | Source✓ | Target✓ |
|--------------|-----------|----------|-------|---------|---------|
| | | | | | |
| | | | | | |

**Department Samples:**
| DepartmentID | Name | Budget | InstructorID | Source✓ | Target✓ |
|--------------|------|--------|--------------|---------|---------|
| | | | | | |
| | | | | | |

**Action:** Fill in this table during validation phase

### Data Integrity Checksums

**Capture checksums for validation:**

| Table | Source Checksum | Target Checksum | Match |
|-------|-----------------|-----------------|-------|
| Student | | | |
| Instructor | | | |
| Course | | | |
| Enrollment | | | |

**Note:** Use `CHECKSUM_AGG(CHECKSUM(*))` query from validation section

---

## Communication Plan

### Stakeholder Matrix

| Stakeholder Group | Contact | Notification Type | Frequency |
|-------------------|---------|-------------------|-----------|
| **Product Owner** | TBD | Email + Status Page | T-24h, Start, Hourly, Complete |
| **Dev Team** | TBD | Slack Channel | Real-time updates |
| **QA Team** | TBD | Email + Slack | T-1h, Complete |
| **SRE/Operations** | TBD | PagerDuty + Slack | Real-time updates |
| **End Users** | All Users | In-App Banner | T-24h, Start, Complete |
| **Executive Sponsor** | TBD | Email Summary | T-24h, Complete |

### Communication Templates

#### T-24 Hours Notification

**Subject:** [SCHEDULED] Database Migration - ContosoUniversity - [DATE] [TIME]

**Body:**
```
Dear ContosoUniversity Users,

We will be performing scheduled database maintenance on [DATE] from [START TIME] to [END TIME].

During this time:
- The application will be unavailable (maintenance mode)
- All data will be preserved
- No action is required from users

Expected downtime: 2-3 hours

Thank you for your patience.

- Migration Team
```

#### Migration Complete Notification

**Subject:** [COMPLETE] Database Migration - Success

**Body:**
```
The ContosoUniversity database migration has been completed successfully.

Summary:
- Start time: [TIME]
- End time: [TIME]
- Total duration: [DURATION]
- Records migrated: [COUNT]
- Validation: PASSED

The application is now available.

Thank you for your patience.
```

---

## Troubleshooting Guide

### Common Issues & Resolutions

#### Issue 1: BCP Export/Import Fails

**Symptoms:**
- "Error = [Microsoft][SQL Server Native Client 11.0]Invalid character value for cast specification"

**Resolution:**
```bash
# Use character format instead of native format
bcp "SchoolContext.dbo.Student" out "Student.dat" \
    -S SERVER -T -c -q  # Changed -n to -c
```

#### Issue 2: Foreign Key Constraint Violations

**Symptoms:**
- "The INSERT statement conflicted with the FOREIGN KEY constraint"

**Resolution:**
```sql
-- Temporarily disable constraints
ALTER TABLE Enrollments NOCHECK CONSTRAINT ALL;

-- Import data
-- [Run BCP import]

-- Re-enable with check
ALTER TABLE Enrollments WITH CHECK CHECK CONSTRAINT ALL;
```

#### Issue 3: Identity Seed Out of Sync

**Symptoms:**
- "Cannot insert duplicate key row in object 'Student'"

**Resolution:**
```sql
-- Get max value from table
SELECT MAX(ID) FROM Student;

-- Reseed to max value
DBCC CHECKIDENT ('Student', RESEED, <max_value>);

-- Verify
DBCC CHECKIDENT ('Student', NORESEED);
```

#### Issue 4: Row Counts Don't Match

**Symptoms:**
- Target database has fewer rows than source

**Resolution:**
```sql
-- Identify missing records
SELECT s.*
FROM [SourceServer].[SchoolContext].dbo.Student s
LEFT JOIN [TargetServer].[SchoolContext_Target].dbo.Student t ON s.ID = t.ID
WHERE t.ID IS NULL;

-- Re-import missing records
```

#### Issue 5: Performance Degradation Post-Migration

**Symptoms:**
- Queries taking 2x-10x longer than baseline

**Resolution:**
```sql
-- Update statistics
EXEC sp_MSforeachtable 'UPDATE STATISTICS ? WITH FULLSCAN';

-- Rebuild indexes
EXEC sp_MSforeachtable 'ALTER INDEX ALL ON ? REBUILD';

-- Clear query plan cache
DBCC FREEPROCCACHE;
```

---

## Appendix

### A. Reference Documentation

- **Data Model Catalog:** [Data-Model-Catalog.md](./Data-Model-Catalog.md)
- **Architecture Overview:** [01-Architecture-Overview.md](./01-Architecture-Overview.md)
- **Project Overview:** [00-Project-Overview.md](./00-Project-Overview.md)
- **Technology Inventory:** [Technology-Inventory.md](./Technology-Inventory.md)

### B. Migration Checklist

**Pre-Migration (T-24 hours):**
- [ ] Run all pre-checks and document results
- [ ] Verify backup integrity
- [ ] Notify stakeholders (T-24 hours notice)
- [ ] Prepare target environment
- [ ] Test all scripts in non-production

**Pre-Migration (T-1 hour):**
- [ ] Send final reminder notification
- [ ] Verify no critical transactions in flight
- [ ] Confirm rollback plan ready

**Migration Start (T-0):**
- [ ] Enable maintenance mode
- [ ] Freeze source database (read-only)
- [ ] Take final backup
- [ ] Begin schema migration

**Migration Execution:**
- [ ] Create target database
- [ ] Run EF Core migrations
- [ ] Verify schema created
- [ ] Disable constraints
- [ ] Export data from source
- [ ] Import data to target (in dependency order)
- [ ] Reseed identity columns
- [ ] Re-enable constraints
- [ ] Rebuild indexes

**Validation:**
- [ ] Compare row counts (must match 100%)
- [ ] Sample 10-20 records manually
- [ ] Run referential integrity checks
- [ ] Verify no orphaned records
- [ ] Test application connectivity
- [ ] Run performance baseline queries
- [ ] Execute smoke tests

**Go-Live:**
- [ ] Update application connection string
- [ ] Restart application
- [ ] Disable maintenance mode
- [ ] Monitor application logs (first 30 min)
- [ ] Send completion notification

**Post-Migration (T+1 hour):**
- [ ] Monitor performance metrics
- [ ] Review error logs
- [ ] Verify no user-reported issues

**Post-Migration (T+24 hours):**
- [ ] Final validation and sign-off
- [ ] Archive migration scripts and logs
- [ ] Document lessons learned
- [ ] Schedule post-mortem

### C. Success Criteria Summary

**Data Integrity:**
- ✅ 100% row count match between source and target
- ✅ Zero orphaned records
- ✅ Zero foreign key violations
- ✅ Sample records match between source and target

**Performance:**
- ✅ Query response times within 2x baseline
- ✅ No index fragmentation > 10%
- ✅ Application page load times < 2 seconds

**Operational:**
- ✅ Downtime within maintenance window (< 3 hours)
- ✅ Zero data loss
- ✅ Rollback capability maintained until sign-off
- ✅ All stakeholders notified at key milestones

**Application:**
- ✅ All CRUD operations functional
- ✅ No error logs in first hour post-migration
- ✅ User acceptance testing passed

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Data Migration Team | Initial comprehensive runbook |

---

**Sign-Off:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Migration Lead | | | |
| Database Administrator | | | |
| Application Owner | | | |
| Technical Architect | | | |

---

_This runbook must be reviewed and approved by all stakeholders before executing the migration. Any deviations from this plan must be documented and approved by the Migration Lead._
