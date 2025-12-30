---
title: 'SQLite Migration Cutover & Rollback Runbook - ContosoUniversity'
last_updated: '2025-12-30'
owner: 'Database Migration Team'
status: 'Ready for Review'
migration_type: 'SQL Server to SQLite Database Migration'
database_source: 'SQL Server (LocalDB/Azure SQL)'
database_target: 'SQLite'
---

# SQLite Migration Cutover & Rollback Runbook - ContosoUniversity

## Executive Summary

This runbook provides comprehensive procedures for migrating the ContosoUniversity database from SQL Server to SQLite, including detailed cutover steps, validation procedures, and rollback strategies. SQLite offers a lightweight, file-based database solution suitable for development, testing, and smaller deployment scenarios.

**Migration Scope:** Complete database migration from SQL Server to SQLite  
**Estimated Duration:** 1-2 hours (depending on data volume)  
**Downtime Required:** Yes (30-60 minutes maintenance window)  
**Data Volume:** Small to Medium (< 100,000 records)  
**Risk Level:** Low-Medium - Simplified architecture reduces complexity

**Key Benefits of SQLite Migration:**
- Zero server administration required
- Single-file database (easy backup and portability)
- Reduced infrastructure costs
- Simplified development environment setup
- Cross-platform compatibility

**Important Considerations:**
- SQLite has limited concurrent write capabilities
- Best suited for read-heavy workloads or single-user scenarios
- Not recommended for high-traffic production environments
- Some SQL Server features (stored procedures, triggers) not available

---

## Table of Contents

- [Migration Strategy](#migration-strategy)
- [Prerequisites & Dependencies](#prerequisites--dependencies)
- [Pre-Migration Phase](#pre-migration-phase)
- [Cutover Procedures](#cutover-procedures)
- [Post-Cutover Validation](#post-cutover-validation)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Dataset Verification](#dataset-verification)
- [Communication Plan](#communication-plan)

---

## Migration Strategy

### Approach

**Migration Method:** Export-Transform-Import with Schema Recreation

**Strategy Overview:**
1. **Export:** Extract data from SQL Server using Entity Framework or SQL tools
2. **Transform:** Convert data types and adapt schema for SQLite compatibility
3. **Import:** Load data into SQLite with proper constraints and indexes
4. **Validate:** Verify data integrity and application functionality
5. **Cutover:** Switch application to SQLite connection
6. **Monitor:** Observe application behavior post-migration

### Key Principles

1. **Zero Data Loss**: All data preserved with validation checksums
2. **Referential Integrity**: Maintain all foreign key relationships
3. **Minimal Downtime**: Optimize for fastest safe migration
4. **Rollback Capability**: Always maintain ability to revert to SQL Server
5. **Validation First**: Verify before declaring success

### Migration Timeline

| Phase | Duration | Activities | Rollback Point |
|-------|----------|------------|----------------|
| **Pre-Migration** | 20 min | Backups, validation, freeze | Yes - No changes made |
| **Cutover** | 30-40 min | Schema creation, data transfer | Yes - Until commit |
| **Validation** | 20-30 min | Data verification, testing | Yes - Can rollback |
| **Go-Live** | 10 min | Connection switch, monitor | Limited - Rollback available |

**Total Estimated Time:** 1.5 - 2 hours

---

## Prerequisites & Dependencies

### Required Tools & Software

| Tool | Version | Purpose | Installation |
|------|---------|---------|-------------|
| **.NET SDK** | 6.0+ | Run EF Core migrations | [Download](https://dotnet.microsoft.com/download) |
| **Entity Framework Core** | 6.0.2+ | Database operations | `dotnet tool install --global dotnet-ef` |
| **SQLite Browser** | 3.12+ | Database inspection (optional) | [Download](https://sqlitebrowser.org/) |
| **PowerShell** | 5.1+ or 7+ | Automation scripts | [Download](https://aka.ms/powershell) |
| **Microsoft.EntityFrameworkCore.Sqlite** | 6.0.2+ | EF Core SQLite provider | NuGet package |

### Required Permissions

**Source Database (SQL Server):**
- [ ] `db_datareader` role on source SchoolContext database
- [ ] `VIEW DEFINITION` permission for schema export
- [ ] Access to database server (network connectivity)

**Application:**
- [ ] Administrative access to stop/start application services
- [ ] Access to application configuration files (appsettings.json)
- [ ] Permission to modify connection strings
- [ ] File system write access for SQLite database file

### File System Requirements

- [ ] Minimum 500 MB free disk space for SQLite database and backups
- [ ] Write permissions to application data directory
- [ ] Backup location accessible from application server
- [ ] Sufficient IOPS for SQLite read/write operations

### Documentation References

- [Data Model Catalog](./Data-Model-Catalog.md) - Complete schema documentation
- [Data Migration Runbook](./Data-Migration-Runbook.md) - General migration guidance
- [Operational Runbook](./Operational-Runbook.md) - Deployment and operations

---

## Pre-Migration Phase

### Pre-Checks (24 Hours Before Migration)

#### 1. Source Database Health Check

Execute these validations on the source SQL Server database:

```sql
-- Check database status
SELECT 
    name AS DatabaseName,
    state_desc AS State,
    compatibility_level AS CompatLevel,
    user_access_desc AS AccessMode
FROM sys.databases
WHERE name LIKE '%SchoolContext%';

-- Verify row counts
SELECT 'Instructor' AS TableName, COUNT(*) AS RowCount FROM Instructor
UNION ALL SELECT 'Student', COUNT(*) FROM Student
UNION ALL SELECT 'OfficeAssignments', COUNT(*) FROM OfficeAssignments
UNION ALL SELECT 'Departments', COUNT(*) FROM Departments
UNION ALL SELECT 'Course', COUNT(*) FROM Course
UNION ALL SELECT 'Enrollments', COUNT(*) FROM Enrollments
UNION ALL SELECT 'CourseInstructor', COUNT(*) FROM CourseInstructor
ORDER BY TableName;
```

**Expected Result:** Database state = ONLINE, all tables present with data

#### 2. Referential Integrity Validation

```sql
-- Check for orphaned records in Enrollments
SELECT COUNT(*) AS OrphanedEnrollments
FROM Enrollments e
LEFT JOIN Student s ON e.StudentID = s.ID
WHERE s.ID IS NULL;

SELECT COUNT(*) AS OrphanedEnrollments
FROM Enrollments e
LEFT JOIN Course c ON e.CourseID = c.CourseID
WHERE c.CourseID IS NULL;

-- Check for orphaned records in CourseInstructor
SELECT COUNT(*) AS OrphanedCourseInstructor
FROM CourseInstructor ci
LEFT JOIN Course c ON ci.CoursesCourseID = c.CourseID
WHERE c.CourseID IS NULL;

SELECT COUNT(*) AS OrphanedCourseInstructor
FROM CourseInstructor ci
LEFT JOIN Instructor i ON ci.InstructorsID = i.ID
WHERE i.ID IS NULL;
```

**Expected Result:** Zero orphaned records for all queries

**Action:** Document row counts in the [Dataset Baseline Table](#dataset-baseline) below.

#### 3. Application Connectivity Test

```bash
# Test current database connection
cd /path/to/ContosoUniversity
dotnet ef database update --project ./ContosoUniversity.csproj

# Verify application starts successfully
dotnet run --project ./ContosoUniversity.csproj
```

**Expected Result:** Application starts without errors, database connection successful

#### 4. Backup Current Database

**SQL Server Backup:**
```sql
-- Full backup with compression
BACKUP DATABASE [SchoolContext]
TO DISK = 'C:\Backups\SchoolContext_PreSQLiteMigration_20251230.bak'
WITH 
    COMPRESSION,
    CHECKSUM,
    STATS = 10,
    DESCRIPTION = 'Pre-SQLite migration backup';

-- Verify backup integrity
RESTORE VERIFYONLY 
FROM DISK = 'C:\Backups\SchoolContext_PreSQLiteMigration_20251230.bak'
WITH CHECKSUM;
```

**Alternative: Script Data Export**
```bash
# Export data using BCP or PowerShell
# See Data Export section below
```

---

### Environment Preparation

#### 1. Install SQLite EF Core Provider

Update `ContosoUniversity.csproj` to include SQLite provider:

```xml
<ItemGroup>
  <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="6.0.2" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="6.0.2" />
</ItemGroup>
```

**Install packages:**
```bash
cd ContosoUniversity/ContosoUniversity
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet restore
```

#### 2. Update DbContext Configuration

Modify `Data/SchoolContext.cs` to support SQLite:

```csharp
public class SchoolContext : DbContext
{
    public SchoolContext(DbContextOptions<SchoolContext> options)
        : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // SQLite-specific configuration
        if (optionsBuilder.IsConfigured)
        {
            if (Database.IsSqlite())
            {
                // Enable foreign keys in SQLite (required for referential integrity)
                optionsBuilder.UseSqlite("Data Source=school.db")
                    .EnableSensitiveDataLogging()
                    .EnableDetailedErrors();
            }
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // SQLite-specific adjustments
        if (Database.IsSqlite())
        {
            // SQLite doesn't support decimal, use REAL instead
            foreach (var property in modelBuilder.Model.GetEntityTypes()
                .SelectMany(t => t.GetProperties())
                .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetColumnType("REAL");
            }
        }

        // Existing model configuration...
    }
}
```

#### 3. Create SQLite Connection String

Update `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "SchoolContext_SqlServer": "Server=(localdb)\\mssqllocaldb;Database=SchoolContext;Trusted_Connection=True;MultipleActiveResultSets=true",
    "SchoolContext": "Data Source=Data/school.db"
  }
}
```

**Important:** Keep both connection strings during migration for easy rollback.

#### 4. Backup Application Configuration

```bash
# Backup current configuration
cp appsettings.json appsettings.json.backup
cp appsettings.Production.json appsettings.Production.json.backup 2>/dev/null || true
cp appsettings.Development.json appsettings.Development.json.backup 2>/dev/null || true

# Backup Program.cs (connection string configuration)
cp Program.cs Program.cs.backup
```

#### 5. Application Freeze (Maintenance Mode)

**Option A: Stop Application Service**
```bash
# Linux
sudo systemctl stop contoso-university.service

# Windows
Stop-Service -Name "ContosoUniversity"

# Or terminate process
pkill -f "dotnet.*ContosoUniversity"
```

**Option B: Enable Maintenance Page**
- Deploy maintenance page to application
- Redirect all traffic to maintenance mode
- Block write operations via middleware

**Verification:**
```bash
# Check application is not running
curl -I http://localhost:5000 || echo "Application stopped successfully"
```

---

## Cutover Procedures

### Phase 1: Schema Creation in SQLite

#### Step 1: Generate SQLite Migration

```bash
cd ContosoUniversity/ContosoUniversity

# Remove existing migrations (optional, if starting fresh)
# rm -rf Migrations/

# Create new SQLite-compatible migration
dotnet ef migrations add InitialSQLiteMigration \
    --context SchoolContext \
    --output-dir Migrations

# Review generated migration
cat Migrations/*_InitialSQLiteMigration.cs
```

**Review Checklist:**
- [ ] All tables defined (Instructor, Student, Department, Course, Enrollment, etc.)
- [ ] Foreign keys configured with proper cascade rules
- [ ] Indexes created on foreign key columns
- [ ] Data types compatible with SQLite (no DECIMAL, use REAL instead)

#### Step 2: Create SQLite Database with Schema

```bash
# Update connection string to point to SQLite
export ConnectionStrings__SchoolContext="Data Source=Data/school.db"

# Create Data directory if it doesn't exist
mkdir -p Data

# Apply migrations to create schema
dotnet ef database update \
    --project ./ContosoUniversity.csproj \
    --context SchoolContext

# Verify database created
ls -lh Data/school.db
```

**Expected Result:** `school.db` file created in Data directory, size ~100-200 KB (empty schema)

#### Step 3: Enable Foreign Key Constraints

SQLite requires explicit enabling of foreign key constraints:

```bash
# Connect to SQLite database and enable foreign keys
sqlite3 Data/school.db "PRAGMA foreign_keys = ON;"

# Verify foreign keys are enabled
sqlite3 Data/school.db "PRAGMA foreign_keys;"
# Expected output: 1
```

**Important:** Add to application startup code in `Program.cs`:

```csharp
// After building the app
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SchoolContext>();
    
    // Enable foreign keys for SQLite
    if (context.Database.IsSqlite())
    {
        context.Database.ExecuteSqlRaw("PRAGMA foreign_keys = ON;");
    }
    
    // Apply migrations
    context.Database.Migrate();
}
```

---

### Phase 2: Data Export from SQL Server

#### Method 1: Entity Framework Export (Recommended)

Create a migration utility script `MigrationHelper.cs`:

```csharp
public static class MigrationHelper
{
    public static async Task ExportToJson(SchoolContext sourceContext, string outputPath)
    {
        var data = new
        {
            Instructors = await sourceContext.Instructors.ToListAsync(),
            Students = await sourceContext.Students.ToListAsync(),
            Departments = await sourceContext.Departments.ToListAsync(),
            OfficeAssignments = await sourceContext.OfficeAssignments.ToListAsync(),
            Courses = await sourceContext.Courses.ToListAsync(),
            Enrollments = await sourceContext.Enrollments.ToListAsync(),
            CourseInstructors = await sourceContext.CourseInstructors.ToListAsync()
        };

        var json = JsonSerializer.Serialize(data, new JsonSerializerOptions 
        { 
            WriteIndented = true 
        });
        
        await File.WriteAllTextAsync(outputPath, json);
    }
}
```

**Execute export:**
```bash
dotnet run -- export-data --output Data/export.json
```

#### Method 2: BCP Export (Alternative)

```bash
# Export each table to CSV format
bcp "SchoolContext.dbo.Instructor" out "instructor.csv" \
    -S localhost -T -c -t "," -r "\n"

bcp "SchoolContext.dbo.Student" out "student.csv" \
    -S localhost -T -c -t "," -r "\n"

bcp "SchoolContext.dbo.Departments" out "departments.csv" \
    -S localhost -T -c -t "," -r "\n"

bcp "SchoolContext.dbo.OfficeAssignments" out "officeassignments.csv" \
    -S localhost -T -c -t "," -r "\n"

bcp "SchoolContext.dbo.Course" out "course.csv" \
    -S localhost -T -c -t "," -r "\n"

bcp "SchoolContext.dbo.Enrollments" out "enrollments.csv" \
    -S localhost -T -c -t "," -r "\n"

bcp "SchoolContext.dbo.CourseInstructor" out "courseinstructor.csv" \
    -S localhost -T -c -t "," -r "\n"
```

---

### Phase 3: Data Import to SQLite

#### Step 1: Import Data (Entity Framework Approach)

Create import method in `MigrationHelper.cs`:

```csharp
public static async Task ImportFromJson(SchoolContext targetContext, string inputPath)
{
    var json = await File.ReadAllTextAsync(inputPath);
    var data = JsonSerializer.Deserialize<ExportData>(json);

    // Disable change tracking for performance
    targetContext.ChangeTracker.AutoDetectChangesEnabled = false;

    // Import in dependency order
    await ImportInstructors(targetContext, data.Instructors);
    await ImportStudents(targetContext, data.Students);
    await ImportOfficeAssignments(targetContext, data.OfficeAssignments);
    await ImportDepartments(targetContext, data.Departments);
    await ImportCourses(targetContext, data.Courses);
    await ImportEnrollments(targetContext, data.Enrollments);
    await ImportCourseInstructors(targetContext, data.CourseInstructors);

    // Re-enable change tracking
    targetContext.ChangeTracker.AutoDetectChangesEnabled = true;
}

private static async Task ImportInstructors(SchoolContext context, List<Instructor> instructors)
{
    foreach (var instructor in instructors)
    {
        // Detach to avoid tracking issues
        context.Entry(instructor).State = EntityState.Added;
    }
    await context.SaveChangesAsync();
}

// Similar methods for other entities...
```

**Execute import:**
```bash
dotnet run -- import-data --input Data/export.json --connection "Data Source=Data/school.db"
```

#### Step 2: Import Data (SQLite Command-Line Approach)

```bash
# Import CSV files into SQLite
sqlite3 Data/school.db <<EOF
.mode csv
.import instructor.csv Instructor
.import student.csv Student
.import officeassignments.csv OfficeAssignments
.import departments.csv Departments
.import course.csv Course
.import enrollments.csv Enrollments
.import courseinstructor.csv CourseInstructor
EOF
```

**Note:** CSV import requires properly formatted files with headers matching column names.

#### Step 3: Verify Row Counts

```bash
# Check row counts in SQLite
sqlite3 Data/school.db <<EOF
SELECT 'Instructor' AS TableName, COUNT(*) AS RowCount FROM Instructor
UNION ALL SELECT 'Student', COUNT(*) FROM Student
UNION ALL SELECT 'OfficeAssignments', COUNT(*) FROM OfficeAssignments
UNION ALL SELECT 'Departments', COUNT(*) FROM Departments
UNION ALL SELECT 'Course', COUNT(*) FROM Course
UNION ALL SELECT 'Enrollments', COUNT(*) FROM Enrollments
UNION ALL SELECT 'CourseInstructor', COUNT(*) FROM CourseInstructor
ORDER BY TableName;
EOF
```

**Action:** Compare with baseline row counts from pre-checks.

---

### Phase 4: Application Configuration Update

#### Step 1: Update Program.cs for SQLite

Modify `Program.cs` to use SQLite:

```csharp
// Add services to the container
builder.Services.AddRazorPages();

// Configure DbContext for SQLite
builder.Services.AddDbContext<SchoolContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("SchoolContext");
    options.UseSqlite(connectionString);
});

// Rest of configuration...

// After app is built, ensure foreign keys are enabled
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SchoolContext>();
    
    // Enable foreign keys for SQLite
    context.Database.ExecuteSqlRaw("PRAGMA foreign_keys = ON;");
    
    // Apply migrations
    context.Database.Migrate();
    
    // Initialize database with seed data if empty
    DbInitializer.Initialize(context);
}
```

#### Step 2: Update Connection String Configuration

Ensure `appsettings.json` has SQLite connection string:

```json
{
  "ConnectionStrings": {
    "SchoolContext": "Data Source=Data/school.db;Cache=Shared"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
```

**Connection String Options:**
- `Data Source=Data/school.db`: Database file path (relative or absolute)
- `Cache=Shared`: Enable shared cache mode (better for concurrent reads)
- `Mode=ReadWriteCreate`: File mode (default, can be ReadWrite or ReadOnly)
- `Foreign Keys=True`: Enable foreign key constraints

#### Step 3: Build and Test Application

```bash
# Clean and rebuild
dotnet clean
dotnet build --configuration Release

# Test application startup
dotnet run --project ContosoUniversity.csproj
```

**Expected Output:**
```
info: Microsoft.Hosting.Lifetime[0]
      Now listening on: https://localhost:5001
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

---

## Post-Cutover Validation

### Validation Checklist

Execute these tests immediately after cutover:

#### 1. Database Connectivity Test

```bash
# Test database connection from application
dotnet ef database update --project ./ContosoUniversity.csproj

# Query database directly
sqlite3 Data/school.db "SELECT COUNT(*) FROM Student;"
```

**Expected Result:** Connection successful, row count matches source database

#### 2. Row Count Reconciliation

Compare row counts between source SQL Server and target SQLite:

**SQL Server:**
```sql
SELECT 'Instructor' AS TableName, COUNT(*) AS RowCount FROM Instructor
UNION ALL SELECT 'Student', COUNT(*) FROM Student
UNION ALL SELECT 'OfficeAssignments', COUNT(*) FROM OfficeAssignments
UNION ALL SELECT 'Departments', COUNT(*) FROM Departments
UNION ALL SELECT 'Course', COUNT(*) FROM Course
UNION ALL SELECT 'Enrollments', COUNT(*) FROM Enrollments
UNION ALL SELECT 'CourseInstructor', COUNT(*) FROM CourseInstructor;
```

**SQLite:**
```bash
sqlite3 Data/school.db <<EOF
SELECT 'Instructor' AS TableName, COUNT(*) AS RowCount FROM Instructor
UNION ALL SELECT 'Student', COUNT(*) FROM Student
UNION ALL SELECT 'OfficeAssignments', COUNT(*) FROM OfficeAssignments
UNION ALL SELECT 'Departments', COUNT(*) FROM Departments
UNION ALL SELECT 'Course', COUNT(*) FROM Course
UNION ALL SELECT 'Enrollments', COUNT(*) FROM Enrollments
UNION ALL SELECT 'CourseInstructor', COUNT(*) FROM CourseInstructor;
EOF
```

**Acceptance Criteria:** 100% row count match for all tables

#### 3. Referential Integrity Validation

```bash
sqlite3 Data/school.db <<EOF
-- Check for orphaned Enrollments (Student)
SELECT COUNT(*) AS OrphanedEnrollments
FROM Enrollments e
LEFT JOIN Student s ON e.StudentID = s.ID
WHERE s.ID IS NULL;

-- Check for orphaned Enrollments (Course)
SELECT COUNT(*) AS OrphanedEnrollments
FROM Enrollments e
LEFT JOIN Course c ON e.CourseID = c.CourseID
WHERE c.CourseID IS NULL;

-- Check for orphaned CourseInstructor (Course)
SELECT COUNT(*) AS OrphanedCourseInstructor
FROM CourseInstructor ci
LEFT JOIN Course c ON ci.CoursesCourseID = c.CourseID
WHERE c.CourseID IS NULL;

-- Check for orphaned CourseInstructor (Instructor)
SELECT COUNT(*) AS OrphanedCourseInstructor
FROM CourseInstructor ci
LEFT JOIN Instructor i ON ci.InstructorsID = i.ID
WHERE i.ID IS NULL;
EOF
```

**Expected Result:** All counts = 0 (no orphaned records)

#### 4. Sample Data Verification

Manually compare sample records:

```bash
# SQL Server
sqlcmd -Q "SELECT TOP 5 * FROM Student ORDER BY ID"

# SQLite
sqlite3 Data/school.db "SELECT * FROM Student ORDER BY ID LIMIT 5;"
```

**Action:** Verify names, dates, and IDs match exactly

#### 5. Application Smoke Tests

Start the application and test key functionality:

```bash
# Start application
dotnet run --project ContosoUniversity.csproj &
sleep 5

# Test endpoints
curl -I http://localhost:5000/Students
curl -I http://localhost:5000/Courses
curl -I http://localhost:5000/Instructors
curl -I http://localhost:5000/Departments
```

**Manual Tests:**
- [ ] Navigate to /Students - verify list loads with pagination
- [ ] Click on a student - verify details page loads
- [ ] Navigate to /Courses - verify list loads
- [ ] Navigate to /Instructors - verify list loads with office assignments
- [ ] Navigate to /Departments - verify list loads with administrators
- [ ] Test create student functionality
- [ ] Test edit student functionality
- [ ] Test delete student functionality (with orphan check)
- [ ] Test enrollment creation
- [ ] Verify no application errors in console logs

**Expected Result:** All pages load within 2 seconds, no errors

#### 6. Foreign Key Constraint Validation

Test that foreign key constraints are enforced:

```bash
sqlite3 Data/school.db <<EOF
-- Try to insert enrollment with invalid StudentID (should fail)
INSERT INTO Enrollments (StudentID, CourseID, Grade)
VALUES (999999, 1, 'A');
EOF
```

**Expected Result:** Error message "FOREIGN KEY constraint failed"

#### 7. Concurrent Access Test (SQLite Limitation)

```bash
# Test multiple concurrent reads (should work)
for i in {1..5}; do
    sqlite3 Data/school.db "SELECT COUNT(*) FROM Student;" &
done
wait

# Test concurrent write (may cause locking issues)
# This is expected behavior with SQLite
```

**Expected Behavior:** Reads work concurrently, writes may block each other

---

## Rollback Procedures

### Rollback Decision Matrix

| Scenario | When to Rollback | Rollback Method |
|----------|------------------|-----------------|
| **Row counts don't match** | Any discrepancy > 0 | Restore SQL Server connection |
| **Referential integrity violations** | Orphaned records found | Restore SQL Server connection |
| **Application errors** | Critical functionality broken | Restore SQL Server connection |
| **Performance degradation** | Response times > 5x baseline | Restore SQL Server connection |
| **Data corruption** | Invalid data detected | Restore SQL Server database backup |

### Rollback Procedure

#### Option 1: Connection String Rollback (Fast - 2-5 minutes)

**Use Case:** SQLite database has issues, need to revert to SQL Server immediately.

**Steps:**

1. **Stop Application:**
   ```bash
   # Linux
   sudo systemctl stop contoso-university.service
   
   # Or kill process
   pkill -f "dotnet.*ContosoUniversity"
   ```

2. **Restore SQL Server Connection String:**
   ```bash
   # Restore backed up configuration
   cp appsettings.json.backup appsettings.json
   cp Program.cs.backup Program.cs
   ```

   **Or manually update `appsettings.json`:**
   ```json
   {
     "ConnectionStrings": {
       "SchoolContext": "Server=(localdb)\\mssqllocaldb;Database=SchoolContext;Trusted_Connection=True;MultipleActiveResultSets=true"
     }
   }
   ```

3. **Update Program.cs to Use SQL Server:**
   ```csharp
   builder.Services.AddDbContext<SchoolContext>(options =>
   {
       var connectionString = builder.Configuration.GetConnectionString("SchoolContext");
       options.UseSqlServer(connectionString);
   });
   ```

4. **Rebuild Application:**
   ```bash
   dotnet clean
   dotnet build --configuration Release
   ```

5. **Start Application:**
   ```bash
   dotnet run --project ContosoUniversity.csproj &
   
   # Or start service
   sudo systemctl start contoso-university.service
   ```

6. **Validate Rollback:**
   ```bash
   # Test application
   curl -I http://localhost:5000/Students
   
   # Check logs for errors
   dotnet ef database update --project ./ContosoUniversity.csproj
   ```

**Duration:** 2-5 minutes  
**Data Loss:** None (if SQL Server database unchanged)

---

#### Option 2: Database Restore Rollback (If SQL Server Data Modified)

**Use Case:** SQL Server database was modified or deleted during migration.

**Steps:**

1. **Stop Application** (same as Option 1)

2. **Restore SQL Server Database from Backup:**
   ```sql
   USE master;
   GO

   -- Set database to single-user mode
   ALTER DATABASE [SchoolContext] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
   GO

   -- Restore database
   RESTORE DATABASE [SchoolContext]
   FROM DISK = 'C:\Backups\SchoolContext_PreSQLiteMigration_20251230.bak'
   WITH REPLACE, RECOVERY;
   GO

   -- Set back to multi-user mode
   ALTER DATABASE [SchoolContext] SET MULTI_USER;
   GO
   ```

3. **Verify Database Restored:**
   ```sql
   -- Check row counts
   SELECT 'Instructor' AS TableName, COUNT(*) AS RowCount FROM Instructor
   UNION ALL SELECT 'Student', COUNT(*) FROM Student
   UNION ALL SELECT 'Course', COUNT(*) FROM Course;
   ```

4. **Restore Application Configuration** (same as Option 1, steps 2-6)

**Duration:** 15-30 minutes (depends on database size)  
**Data Loss:** Data changes made after backup (if any)

---

#### Option 3: Emergency Rollback (Complete)

**Use Case:** Critical production issue requiring immediate full rollback.

**Steps:**

1. **Enable Maintenance Mode:**
   ```bash
   # Stop application immediately
   sudo systemctl stop contoso-university.service
   pkill -f "dotnet.*ContosoUniversity"
   ```

2. **Restore Database** (if needed - Option 2)

3. **Restore Application Configuration:**
   ```bash
   # Restore all backed up files
   cp appsettings.json.backup appsettings.json
   cp appsettings.Production.json.backup appsettings.Production.json
   cp Program.cs.backup Program.cs
   ```

4. **Rebuild and Start:**
   ```bash
   dotnet clean
   dotnet build --configuration Release
   dotnet run --project ContosoUniversity.csproj
   ```

5. **Validate System Health:**
   ```bash
   # Test all endpoints
   curl -I http://localhost:5000/Students
   curl -I http://localhost:5000/Courses
   curl -I http://localhost:5000/Instructors
   ```

6. **Monitor for 15 Minutes:**
   - Check application logs for errors
   - Verify database queries executing successfully
   - Test key user workflows manually

**Duration:** 5-10 minutes (application only) or 15-30 minutes (with database restore)

---

### Post-Rollback Actions

After successful rollback:

- [ ] Document rollback reason and time
- [ ] Notify stakeholders of rollback
- [ ] Create incident report
- [ ] Schedule post-mortem meeting
- [ ] Identify root cause of migration failure
- [ ] Plan remediation and re-migration strategy
- [ ] Update runbook with lessons learned

---

## Troubleshooting Guide

### Common Issues & Resolutions

#### Issue 1: Foreign Key Constraint Violations

**Symptoms:**
- "FOREIGN KEY constraint failed" error during data import
- Application throws exceptions on insert/update operations

**Possible Causes:**
- Foreign keys not enabled in SQLite (`PRAGMA foreign_keys = OFF`)
- Data imported in wrong order (parent records missing)
- Orphaned records in source database

**Resolution:**

1. **Enable Foreign Keys:**
   ```bash
   sqlite3 Data/school.db "PRAGMA foreign_keys = ON;"
   ```

2. **Check Foreign Key Status:**
   ```bash
   sqlite3 Data/school.db "PRAGMA foreign_keys;"
   # Should return: 1
   ```

3. **Temporarily Disable Foreign Keys for Import:**
   ```bash
   sqlite3 Data/school.db <<EOF
   PRAGMA foreign_keys = OFF;
   -- Import data here
   PRAGMA foreign_keys = ON;
   EOF
   ```

4. **Validate Data After Re-enabling:**
   ```bash
   sqlite3 Data/school.db "PRAGMA foreign_key_check;"
   # Should return empty (no violations)
   ```

---

#### Issue 2: SQLite Database Locked

**Symptoms:**
- "database is locked" error
- Application hangs on database operations
- Timeout exceptions

**Possible Causes:**
- Another process has write lock on database
- Long-running transaction not committed
- Concurrent write operations

**Resolution:**

1. **Check for Open Connections:**
   ```bash
   # Find processes accessing database
   lsof Data/school.db
   # Or on Windows
   handle Data/school.db
   ```

2. **Close SQLite Browser/Tools:**
   - Close DB Browser for SQLite if open
   - Close any other tools accessing the database

3. **Restart Application:**
   ```bash
   pkill -f "dotnet.*ContosoUniversity"
   dotnet run --project ContosoUniversity.csproj
   ```

4. **Enable WAL Mode (Better Concurrency):**
   ```bash
   sqlite3 Data/school.db "PRAGMA journal_mode=WAL;"
   ```
   
   **Note:** WAL (Write-Ahead Logging) mode allows concurrent reads during writes.

---

#### Issue 3: Decimal/Money Type Conversion Issues

**Symptoms:**
- Budget values incorrect or rounded
- Precision loss in decimal fields
- Department budgets show as integers

**Possible Cause:**
- SQLite doesn't support DECIMAL type natively
- Data stored as REAL (floating-point) instead of exact decimal

**Resolution:**

1. **Update Model Configuration:**
   ```csharp
   protected override void OnModelCreating(ModelBuilder modelBuilder)
   {
       if (Database.IsSqlite())
       {
           // Convert decimal to string for exact precision
           modelBuilder.Entity<Department>()
               .Property(d => d.Budget)
               .HasConversion(
                   v => v.ToString(),
                   v => decimal.Parse(v))
               .HasColumnType("TEXT");
       }
   }
   ```

2. **Alternative: Store as INTEGER (cents):**
   ```csharp
   .Property(d => d.Budget)
       .HasConversion(
           v => (long)(v * 100),  // Convert to cents
           v => v / 100m)         // Convert back to decimal
       .HasColumnType("INTEGER");
   ```

3. **Re-export and Import Data** with correct conversion.

---

#### Issue 4: Row Count Mismatch

**Symptoms:**
- SQLite database has fewer rows than SQL Server
- Some records missing after migration

**Possible Causes:**
- Data export incomplete
- Import errors not detected
- Transaction rollback during import

**Resolution:**

1. **Identify Missing Records:**
   ```sql
   -- SQL Server: Get IDs
   SELECT ID FROM Student ORDER BY ID;
   
   -- SQLite: Get IDs
   sqlite3 Data/school.db "SELECT ID FROM Student ORDER BY ID;"
   
   -- Compare outputs (use diff tool)
   ```

2. **Re-import Missing Records:**
   ```bash
   # Re-export from SQL Server
   bcp "SchoolContext.dbo.Student" out "student_full.csv" -S localhost -T -c
   
   # Delete SQLite database and re-import
   rm Data/school.db
   dotnet ef database update --project ./ContosoUniversity.csproj
   # Import data again
   ```

3. **Verify Transaction Commit:**
   Ensure `SaveChangesAsync()` is called after all imports.

---

#### Issue 5: Performance Degradation

**Symptoms:**
- Queries slower than SQL Server
- Page load times > 5 seconds
- Timeout errors

**Possible Causes:**
- Missing indexes
- SQLite not optimized for concurrent writes
- Large result sets without pagination

**Resolution:**

1. **Add Indexes:**
   ```bash
   sqlite3 Data/school.db <<EOF
   CREATE INDEX IF NOT EXISTS IX_Enrollments_StudentID ON Enrollments(StudentID);
   CREATE INDEX IF NOT EXISTS IX_Enrollments_CourseID ON Enrollments(CourseID);
   CREATE INDEX IF NOT EXISTS IX_Course_DepartmentID ON Course(DepartmentID);
   CREATE INDEX IF NOT EXISTS IX_CourseInstructor_CoursesCourseID ON CourseInstructor(CoursesCourseID);
   CREATE INDEX IF NOT EXISTS IX_CourseInstructor_InstructorsID ON CourseInstructor(InstructorsID);
   EOF
   ```

2. **Enable WAL Mode:**
   ```bash
   sqlite3 Data/school.db "PRAGMA journal_mode=WAL;"
   ```

3. **Optimize Database:**
   ```bash
   sqlite3 Data/school.db <<EOF
   VACUUM;
   ANALYZE;
   EOF
   ```

4. **Check Query Plans:**
   ```bash
   sqlite3 Data/school.db "EXPLAIN QUERY PLAN SELECT * FROM Enrollments WHERE StudentID = 1;"
   ```

---

#### Issue 6: DateTime Format Incompatibility

**Symptoms:**
- Date values incorrect or null
- "String was not recognized as a valid DateTime" errors

**Possible Cause:**
- SQL Server datetime format differs from SQLite
- Timezone issues

**Resolution:**

1. **Use ISO 8601 Format:**
   ```csharp
   protected override void OnModelCreating(ModelBuilder modelBuilder)
   {
       if (Database.IsSqlite())
       {
           // Store dates as TEXT in ISO 8601 format
           modelBuilder.Entity<Student>()
               .Property(s => s.EnrollmentDate)
               .HasConversion(
                   v => v.ToString("o"),  // ISO 8601
                   v => DateTime.Parse(v));
       }
   }
   ```

2. **Update Existing Data:**
   ```bash
   sqlite3 Data/school.db <<EOF
   -- Convert existing dates to ISO 8601 format
   UPDATE Student SET EnrollmentDate = datetime(EnrollmentDate);
   UPDATE Instructor SET HireDate = datetime(HireDate);
   EOF
   ```

---

## Dataset Verification

### Dataset Baseline

**Document row counts before and after migration:**

| Table | Source (SQL Server) | Target (SQLite) | Match | Notes |
|-------|---------------------|-----------------|-------|-------|
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

---

### Sample Records Verification

**Select 5-10 critical records to verify manually:**

**Student Samples:**
| ID | LastName | FirstName | EnrollmentDate | Source✓ | Target✓ |
|----|----------|-----------|----------------|---------|---------|
| 1 | | | | | |
| 2 | | | | | |
| 5 | | | | | |

**Department Samples:**
| DepartmentID | Name | Budget | InstructorID | Source✓ | Target✓ |
|--------------|------|--------|--------------|---------|---------|
| 1 | | | | | |
| 2 | | | | | |

**Action:** Fill in during validation phase and verify all fields match exactly.

---

### Checksum Validation (Optional)

For critical data validation:

**SQL Server:**
```sql
SELECT 
    'Student' AS TableName,
    CHECKSUM_AGG(CHECKSUM(*)) AS TableChecksum
FROM Student;
```

**SQLite:**
```bash
# SQLite doesn't have CHECKSUM_AGG, use row count and hash instead
sqlite3 Data/school.db "SELECT COUNT(*), GROUP_CONCAT(ID) FROM Student;"
```

**Note:** Exact checksum comparison between SQL Server and SQLite is not reliable due to different internal representations. Use row counts and sample data verification instead.

---

## Communication Plan

### Stakeholder Notifications

**T-24 Hours (Before Migration):**
- [ ] Email all stakeholders about upcoming SQLite migration
- [ ] Post notification on application homepage (if applicable)
- [ ] Notify development team via Slack/Teams
- [ ] Update status page

**T-1 Hour (Before Maintenance Window):**
- [ ] Send final reminder email
- [ ] Enable maintenance mode countdown
- [ ] Confirm rollback plan ready

**T-0 (Migration Start):**
- [ ] Enable maintenance page
- [ ] Send "Migration in Progress" notification
- [ ] Begin migration procedures

**T+End (Migration Complete):**
- [ ] Send "Migration Complete" notification
- [ ] Disable maintenance mode
- [ ] Announce application availability
- [ ] Monitor for issues (first 2 hours)

**T+24 Hours (Post-Migration):**
- [ ] Send summary report to stakeholders
- [ ] Document lessons learned
- [ ] Archive migration logs and backups

---

### Communication Templates

#### Migration Start Notification

**Subject:** [IN PROGRESS] SQLite Database Migration - ContosoUniversity

**Body:**
```
The ContosoUniversity SQLite database migration has started.

Start Time: [TIME]
Expected Duration: 1-2 hours
Expected Completion: [TIME]

The application is currently in maintenance mode.

Updates will be provided every 30 minutes.

- Migration Team
```

#### Migration Complete Notification

**Subject:** [COMPLETE] SQLite Database Migration - Success

**Body:**
```
The ContosoUniversity SQLite database migration has been completed successfully.

Migration Summary:
- Start Time: [TIME]
- End Time: [TIME]
- Duration: [MINUTES] minutes
- Records Migrated: [COUNT]
- Validation: PASSED
- Rollback: Not Required

The application is now available with SQLite database.

Performance metrics and monitoring will continue for the next 24 hours.

Thank you for your patience.

- Migration Team
```

---

## Success Criteria

### Data Integrity

- ✅ 100% row count match between source and target
- ✅ Zero orphaned records (referential integrity verified)
- ✅ Sample records match exactly between source and target
- ✅ Foreign key constraints enforced in SQLite

### Performance

- ✅ Query response times within 2x baseline (SQLite is generally faster for reads)
- ✅ Application page load times < 2 seconds
- ✅ No timeout errors during normal operations

### Operational

- ✅ Migration completed within maintenance window (< 2 hours)
- ✅ Zero data loss
- ✅ Rollback capability tested and available
- ✅ All stakeholders notified at key milestones

### Application

- ✅ All CRUD operations functional
- ✅ No error logs in first hour post-migration
- ✅ User acceptance testing passed
- ✅ Concurrent read operations work correctly

---

## Appendix

### Useful SQLite Commands

```bash
# Connect to database
sqlite3 Data/school.db

# Show all tables
.tables

# Show schema for a table
.schema Student

# Show indexes
.indexes

# Enable headers and column mode
.headers on
.mode column

# Export table to CSV
.mode csv
.output student_export.csv
SELECT * FROM Student;
.output stdout

# Import CSV to table
.mode csv
.import student_import.csv Student

# Show database file info
.dbinfo

# Enable foreign keys
PRAGMA foreign_keys = ON;

# Check foreign key constraints
PRAGMA foreign_key_check;

# Vacuum database (reclaim space)
VACUUM;

# Analyze database (update query optimizer statistics)
ANALYZE;

# Enable WAL mode for better concurrency
PRAGMA journal_mode=WAL;

# Show current journal mode
PRAGMA journal_mode;

# Quit SQLite
.quit
```

---

### SQLite Limitations & Considerations

**Concurrency:**
- SQLite supports multiple concurrent readers
- Only one writer at a time (database locked during writes)
- Use WAL mode for better concurrent read performance

**Data Types:**
- No native DECIMAL type (use REAL, TEXT, or INTEGER with conversion)
- DateTime stored as TEXT, REAL, or INTEGER
- Type affinity: SQLite converts types dynamically

**Size Limits:**
- Maximum database size: 281 TB (theoretical)
- Maximum row size: ~1 GB
- Recommended maximum database size: < 1 TB for best performance

**Not Supported:**
- Stored procedures
- User-defined functions (unless added via extension)
- RIGHT OUTER JOIN (use LEFT OUTER JOIN with reversed tables)
- Full outer join
- Some ALTER TABLE operations (use recreate table approach)

**Best Use Cases:**
- Development and testing environments
- Single-user applications
- Embedded applications
- Read-heavy workloads
- Small to medium databases (< 100 GB)

**Not Recommended For:**
- High-concurrency write scenarios
- Applications with > 100 concurrent connections
- Enterprise-scale applications
- Applications requiring stored procedures

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Database Migration Team | Initial SQLite migration runbook |

---

**Sign-Off:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Migration Lead | | | |
| Database Administrator | | | |
| Application Owner | | | |
| Technical Architect | | | |

---

_This runbook must be reviewed and approved by all stakeholders before executing the SQLite migration. Any deviations from this plan must be documented and approved by the Migration Lead._
