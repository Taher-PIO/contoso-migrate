---
title: 'SQLite Database Migration Plan - ContosoUniversity'
last_updated: '2025-12-30'
owner: 'Database Migration Lead'
status: 'Draft'
database_source: 'SQL Server (SchoolContext)'
database_target: 'SQLite'
migration_type: 'Database Engine Migration'
---

# SQLite Database Migration Plan - ContosoUniversity

## Executive Summary

This document defines the comprehensive migration plan for transitioning the ContosoUniversity application database from SQL Server to SQLite. The migration involves converting the database engine while maintaining data integrity, application functionality, and operational reliability.

**Migration Overview:**
- **Source:** SQL Server LocalDB (SchoolContext-{guid})
- **Target:** SQLite 3.x
- **Scope:** 7 tables, 38+ seed rows, 2 EF Core migrations, all relationships and constraints
- **Estimated Duration:** 4-6 weeks (planning through production cutover)
- **Risk Level:** Medium - Engine conversion with data type mappings and cascade behavior differences

**Key Success Metrics:**
- Zero data loss during migration
- 100% referential integrity maintained
- Application functionality parity (all features work identically)
- Performance within ±15% of baseline metrics
- Rollback capability at all phases

---

## Table of Contents

- [Migration Scope](#migration-scope)
- [Objectives & Success Criteria](#objectives--success-criteria)
- [Migration Phases & Timeline](#migration-phases--timeline)
- [RACI Matrix](#raci-matrix)
- [Risk Assessment & Mitigations](#risk-assessment--mitigations)
- [Validation Gates & Checkpoints](#validation-gates--checkpoints)
- [Dependencies & Prerequisites](#dependencies--prerequisites)
- [Go/No-Go Decision Framework](#gono-go-decision-framework)

---

## Migration Scope

### Database Objects in Scope

#### Tables (7 Total)

| Table Name | Row Count (Seed) | Estimated Prod | Migration Priority | Complexity |
|------------|------------------|----------------|-------------------|------------|
| **Student** | 8 | TBD | HIGH | Medium - PII data |
| **Instructor** | 5 | TBD | HIGH | Medium - PII data |
| **Course** | 7 | TBD | HIGH | Low |
| **Enrollment** | 11 | TBD | HIGH | Medium - Transactional |
| **Department** | 4 | TBD | MEDIUM | Medium - RowVersion |
| **OfficeAssignment** | 3 | TBD | LOW | Low |
| **CourseInstructor** | ~10-15 | TBD | HIGH | Medium - Junction table |

**Total Tables:** 7  
**Total Seed Rows:** ~38  
**Production Row Estimate:** Requires analysis

#### Schema Elements

| Element Type | Count | Notes |
|--------------|-------|-------|
| **Primary Keys** | 7 | All INT identity columns (except OfficeAssignment) |
| **Foreign Keys** | 7 | Includes cascade delete chains |
| **Indexes** | 10+ | Includes PK clustered indexes + FK indexes |
| **Unique Constraints** | 1 | OfficeAssignment.Location (if exists) |
| **Default Values** | 7 | IDENTITY columns (1,1) |
| **Check Constraints** | 0 | None defined |
| **Computed Columns** | 0 | FullName is app-level only |

#### Data Types Requiring Mapping

| SQL Server Type | SQLite Type | Compatibility | Notes |
|-----------------|-------------|---------------|-------|
| `int` (PK/FK) | `INTEGER` | ✅ Direct | SQLite AUTOINCREMENT for identity |
| `nvarchar(50)` | `TEXT` | ✅ Direct | No length enforcement in SQLite |
| `nvarchar(max)` | `TEXT` | ✅ Direct | Unlimited length |
| `datetime2` | `TEXT` (ISO8601) | ⚠️ Conversion | EF Core handles via provider |
| `rowversion` / `timestamp` | `BLOB` or `TEXT` | ⚠️ Manual | Requires custom handling |
| `decimal(18,2)` | `REAL` or `TEXT` | ⚠️ Precision | SQLite has limited decimal precision |

#### Views

| View Name | Status | Migration Action |
|-----------|--------|------------------|
| *(None defined)* | N/A | No action required |

#### Stored Procedures / Functions

| Object Name | Status | Migration Action |
|-------------|--------|------------------|
| *(None defined)* | N/A | No action required |

#### Triggers

| Trigger Name | Table | Purpose | Migration Action |
|--------------|-------|---------|------------------|
| *(None defined)* | N/A | N/A | No action required |

### Out of Scope

- SQL Server Agent jobs (none exist)
- Full-text search indexes (none exist)
- Partitioning schemes (not applicable)
- Database encryption (TDE) - not in use
- SQL Server-specific features (CLR, XML columns, etc.)
- Cross-database queries (none exist)
- Linked servers (none exist)

### Data Migration Scope

**Approach:** Schema-first migration with full data transfer

- **Historical Data:** All data in scope (no archival)
- **PII Data:** Student and Instructor names (FirstName, LastName) - requires security controls
- **Transactional Data:** All Enrollment records
- **Reference Data:** All Department and Course data
- **Binary Data:** RowVersion in Department table requires special handling

---

## Objectives & Success Criteria

### Primary Objectives

1. **Zero Data Loss**
   - Migrate 100% of data from SQL Server to SQLite
   - Maintain all referential integrity constraints
   - Preserve data accuracy and completeness

2. **Application Compatibility**
   - All application features function identically post-migration
   - No user-facing functional regressions
   - Maintain EF Core compatibility with SQLite provider

3. **Performance Parity**
   - Page load times within ±15% of SQL Server baseline
   - Query performance within acceptable range (SQLite typically faster for small datasets)
   - No degradation in user experience

4. **Operational Reliability**
   - Successful rollback capability at each phase gate
   - Comprehensive validation and testing
   - Documented procedures for ongoing operations

### Measurable Success Criteria

| Category | Metric | Target | Measurement Method |
|----------|--------|--------|-------------------|
| **Data Integrity** | Row count parity | 100% | `SELECT COUNT(*)` comparison per table |
| **Data Integrity** | Checksum validation | 100% match | Hash comparison of critical columns |
| **Data Integrity** | Foreign key validation | 0 orphaned records | Referential integrity queries |
| **Functional Testing** | Test case pass rate | 100% | Automated + manual test suite |
| **Performance** | Page load time (simple) | 50-120ms (P95) | Application instrumentation |
| **Performance** | Page load time (complex) | 250-460ms (P95) | Application instrumentation |
| **Performance** | CRUD operations | Within ±15% baseline | Load testing results |
| **Availability** | Planned downtime | < 2 hours | Migration execution window |
| **Rollback** | Rollback execution time | < 30 minutes | Timed rehearsal |

### Non-Functional Requirements

- **Security:** Maintain PII protection controls during migration
- **Compliance:** Preserve FERPA compliance posture (if applicable)
- **Auditability:** Full migration log with timestamps and validation results
- **Documentation:** Complete runbook and lessons learned

---

## Migration Phases & Timeline

### Phase 1: Planning & Preparation (Week 1-2)

**Duration:** 2 weeks  
**Owner:** Database Migration Lead

#### Activities

- [x] Define migration scope and objectives
- [ ] Analyze production data volumes (if available)
- [ ] Document SQL Server → SQLite type mappings
- [ ] Identify SQLite provider limitations and workarounds
- [ ] Create migration architecture diagram
- [ ] Define rollback procedures
- [ ] Establish communication plan

#### Deliverables

- Migration plan document (this document)
- Technical design document for EF Core provider swap
- Risk register with mitigations
- Communication plan and stakeholder notification templates

#### Checkpoint: Planning Complete

**Exit Criteria:**
- [ ] Migration plan approved by stakeholders
- [ ] Risks identified with mitigation strategies
- [ ] All roles assigned (RACI complete)
- [ ] Technical feasibility validated

**Go/No-Go Decision Point:** End of Week 2

---

### Phase 2: Development & Schema Migration (Week 3-4)

**Duration:** 2 weeks  
**Owner:** Application Development Team

#### Activities

**Week 3:**
- [ ] Install SQLite EF Core provider (`Microsoft.EntityFrameworkCore.Sqlite`)
- [ ] Create SQLite-compatible connection string configuration
- [ ] Update `DbContextOptions` to use SQLite provider
- [ ] Generate new SQLite migration from existing models
- [ ] Test migration on local development environment
- [ ] Validate schema creation (tables, indexes, FKs)

**Week 4:**
- [ ] Address data type incompatibilities (rowversion → timestamp)
- [ ] Implement custom value converters if needed
- [ ] Test cascade delete behavior in SQLite
- [ ] Create schema comparison script (SQL Server vs SQLite)
- [ ] Document provider-specific differences
- [ ] Update application configuration for multi-provider support

#### Deliverables

- SQLite EF Core migration scripts
- Updated `SchoolContext` configuration
- Schema validation scripts
- Provider differences documentation

#### Checkpoint: Schema Migration Complete

**Exit Criteria:**
- [ ] SQLite schema matches SQL Server logical structure
- [ ] All tables, indexes, and constraints created successfully
- [ ] EF Core migrations apply cleanly to SQLite
- [ ] Schema validation passes 100%

**Go/No-Go Decision Point:** End of Week 4

---

### Phase 3: Data Migration & Validation (Week 5)

**Duration:** 1 week  
**Owner:** Database Migration Lead + QA Team

#### Activities

**Day 1-2: Data Export & Import**
- [ ] Backup source SQL Server database
- [ ] Export data from SQL Server (CSV or JSON format)
- [ ] Transform data for SQLite compatibility
- [ ] Import data into SQLite database
- [ ] Verify row counts per table

**Day 3-4: Data Validation**
- [ ] Execute row count comparison queries
- [ ] Validate referential integrity (FK relationships)
- [ ] Run checksum validation on critical fields
- [ ] Test cascade delete behavior with sample data
- [ ] Validate date/time format conversions
- [ ] Check NULL/NOT NULL constraints

**Day 5: Reconciliation**
- [ ] Document any data transformation issues
- [ ] Re-run failed imports with corrections
- [ ] Final validation sweep
- [ ] Sign-off on data migration accuracy

#### Deliverables

- Data export/import scripts
- Data validation report
- Reconciliation documentation
- SQLite database with migrated data

#### Checkpoint: Data Migration Validated

**Exit Criteria:**
- [ ] 100% row count parity across all tables
- [ ] Zero orphaned foreign key records
- [ ] All validation queries pass
- [ ] Data transformation issues resolved

**Go/No-Go Decision Point:** End of Week 5

---

### Phase 4: Application Testing (Week 5-6)

**Duration:** 1.5 weeks (overlaps with Phase 3)  
**Owner:** QA Team + Application Development Team

#### Activities

**Functional Testing:**
- [ ] Execute full regression test suite
- [ ] Test all CRUD operations (Create, Read, Update, Delete)
- [ ] Test pagination, sorting, filtering
- [ ] Test search functionality
- [ ] Validate cascade delete operations (delete Student → Enrollments deleted)
- [ ] Test concurrency scenarios (RowVersion optimistic locking)
- [ ] Verify error handling for constraint violations

**Performance Testing:**
- [ ] Baseline performance metrics on SQL Server (if not already documented)
- [ ] Execute same test suite on SQLite
- [ ] Compare page load times (P50, P95, P99)
- [ ] Compare query execution times
- [ ] Identify any performance regressions > 15%
- [ ] Optimize queries if needed

**Integration Testing:**
- [ ] Test application startup and configuration loading
- [ ] Test connection pooling behavior
- [ ] Test transaction boundaries
- [ ] Verify logging and error handling

#### Deliverables

- Test execution report
- Performance comparison report
- Bug tracker with issues and resolutions
- Regression test sign-off

#### Checkpoint: Application Testing Complete

**Exit Criteria:**
- [ ] 100% test case pass rate (or documented exceptions)
- [ ] No critical or high-severity bugs
- [ ] Performance within acceptable thresholds
- [ ] Stakeholder acceptance of test results

**Go/No-Go Decision Point:** End of Week 6

---

### Phase 5: Production Cutover (Week 6 - TBD)

**Duration:** 4 hours (execution window)  
**Owner:** DevOps Team + Database Migration Lead

#### Pre-Cutover Activities (Day Before)

- [ ] Final stakeholder notification (24-hour notice)
- [ ] Backup current production SQL Server database
- [ ] Prepare SQLite database with migrated data
- [ ] Stage application binaries with SQLite provider
- [ ] Validate rollback procedure readiness
- [ ] Confirm maintenance window with stakeholders

#### Cutover Execution (Maintenance Window)

**Hour 1: Application Freeze & Backup**
- [ ] T-60min: Stop application or enable read-only mode
- [ ] T-45min: Create final SQL Server backup
- [ ] T-30min: Export any production data created since test migration
- [ ] T-15min: Incremental data sync to SQLite database

**Hour 2: Deployment**
- [ ] T-0min: Deploy application with SQLite provider
- [ ] T+10min: Apply database migrations (if any pending)
- [ ] T+15min: Update connection strings to point to SQLite
- [ ] T+20min: Restart application services

**Hour 3: Validation**
- [ ] T+30min: Smoke test critical user journeys
- [ ] T+40min: Validate data integrity queries
- [ ] T+50min: Check application logs for errors
- [ ] T+60min: Performance spot checks

**Hour 4: Go-Live or Rollback Decision**
- [ ] T+90min: Final validation sign-off
- [ ] T+100min: Enable full application access
- [ ] T+110min: Monitor initial user traffic
- [ ] T+120min: Declare migration success or initiate rollback

#### Post-Cutover Activities

- [ ] Monitor application for 24 hours
- [ ] Validate no unexpected errors
- [ ] Collect user feedback
- [ ] Archive SQL Server backup (retain for 30 days)

#### Deliverables

- Cutover checklist (completed)
- Production validation report
- Incident log (if any issues)
- Go-live sign-off

#### Checkpoint: Production Cutover Complete

**Exit Criteria:**
- [ ] Application operational on SQLite
- [ ] All smoke tests pass
- [ ] No critical errors in logs
- [ ] User access restored
- [ ] Monitoring shows healthy metrics

**Go/No-Go Decision Point:** T+90min in cutover window

---

### Phase 6: Hypercare & Optimization (Week 7-8)

**Duration:** 2 weeks  
**Owner:** DevOps Team + Application Support

#### Activities

**Week 7: Hypercare**
- [ ] 24/7 monitoring and support
- [ ] Rapid response to any issues
- [ ] Daily health checks and validation
- [ ] User feedback collection
- [ ] Performance monitoring and tuning

**Week 8: Optimization**
- [ ] Analyze performance metrics
- [ ] Optimize slow queries (if any)
- [ ] Add indexes if needed
- [ ] Tune SQLite configuration (PRAGMA settings)
- [ ] Update documentation based on learnings

#### Deliverables

- Hypercare incident log
- Performance tuning report
- Optimization recommendations
- Lessons learned document
- Final migration closure report

#### Checkpoint: Migration Closure

**Exit Criteria:**
- [ ] 2 weeks of stable operations
- [ ] No outstanding critical issues
- [ ] Performance meets targets
- [ ] Documentation complete
- [ ] SQL Server decommission plan approved

**Final Sign-Off:** End of Week 8

---

## RACI Matrix

**RACI Legend:**
- **R** = Responsible (does the work)
- **A** = Accountable (decision maker)
- **C** = Consulted (provides input)
- **I** = Informed (kept in the loop)

| Activity | DB Migration Lead | App Dev Team | QA Team | DevOps | Stakeholders | DBA |
|----------|------------------|--------------|---------|--------|--------------|-----|
| **Planning & Preparation** | | | | | | |
| Define migration scope | R/A | C | C | C | I | C |
| Risk assessment | R/A | C | C | C | I | C |
| Create migration plan | R/A | C | C | C | I | C |
| Approve migration plan | I | I | I | I | A | C |
| **Development & Schema Migration** | | | | | | |
| Install SQLite provider | C | R/A | I | C | I | - |
| Update DbContext configuration | C | R/A | I | C | I | - |
| Generate SQLite migrations | C | R/A | I | C | I | - |
| Schema validation | R/A | R | C | I | I | C |
| **Data Migration & Validation** | | | | | | |
| Data export from SQL Server | R/A | C | C | C | I | C |
| Data import to SQLite | R/A | C | C | C | I | - |
| Data validation & reconciliation | R/A | C | R | I | I | C |
| Sign-off on data accuracy | A | I | R | I | I | C |
| **Application Testing** | | | | | | |
| Functional testing | C | R | R/A | I | I | - |
| Performance testing | C | C | R/A | C | I | - |
| Integration testing | C | R | R/A | C | I | - |
| Test results approval | I | C | A | I | A | - |
| **Production Cutover** | | | | | | |
| Cutover planning | R/A | C | C | R | I | C |
| Application deployment | C | R | I | R/A | I | - |
| Database switchover | R/A | C | I | R | I | - |
| Production validation | R/A | R | R | R | I | C |
| Go-live decision | C | C | C | A | A | C |
| **Hypercare & Optimization** | | | | | | |
| Post-migration monitoring | C | C | C | R/A | I | - |
| Issue resolution | C | R | C | R/A | I | - |
| Performance optimization | R | R/A | C | C | I | - |
| Final migration sign-off | I | I | I | I | A | I |

### Key Roles & Responsibilities

**Database Migration Lead**
- Overall migration planning and coordination
- Risk management and mitigation
- Data migration execution and validation
- Stakeholder communication

**Application Development Team**
- EF Core provider configuration changes
- Schema migration generation and testing
- Application code compatibility
- Performance optimization

**QA Team**
- Test plan development and execution
- Functional and regression testing
- Data validation and reconciliation
- Test results reporting

**DevOps Team**
- Infrastructure preparation
- Deployment automation
- Production cutover execution
- Post-migration monitoring

**Stakeholders (Product Owner, Management)**
- Migration approval decisions
- Go/No-Go decisions at phase gates
- Budget and resource allocation
- User communication

**DBA (Database Administrator)**
- SQL Server backup and export
- Performance tuning consultation
- Database-level validation
- Rollback assistance if needed

---

## Risk Assessment & Mitigations

### High-Priority Risks

#### Risk 1: Data Type Incompatibilities

**Risk Level:** 🔴 HIGH  
**Impact:** Data loss or corruption during migration  
**Probability:** Medium (known issue with rowversion/timestamp)

**Description:**
SQL Server's `rowversion` (timestamp) data type used in the Department table has no direct SQLite equivalent. SQLite's type affinity system may not preserve the concurrency token semantics required for optimistic concurrency control.

**Mitigation:**
- Implement custom value converter in EF Core to handle rowversion as BLOB or TEXT
- Test optimistic concurrency scenarios thoroughly in SQLite
- Consider alternative concurrency strategy (e.g., LastModified timestamp)
- Document workaround in application code

**Contingency:**
- Remove optimistic concurrency if not critical
- Implement application-level locking

**Owner:** Application Development Team  
**Status:** Requires investigation in Phase 2

---

#### Risk 2: Cascade Delete Behavior Differences

**Risk Level:** 🔴 HIGH  
**Impact:** Orphaned records or unexpected delete failures  
**Probability:** Medium

**Description:**
SQLite requires `PRAGMA foreign_keys = ON` to enforce foreign key constraints. Cascade delete behavior may differ from SQL Server if not configured correctly.

**Mitigation:**
- Enable foreign keys pragma in SQLite connection configuration
- Test all cascade delete scenarios in development
- Validate referential integrity post-migration
- Document expected cascade behavior per relationship

**Contingency:**
- Implement application-level cascade logic if SQLite behavior differs
- Add defensive checks before deletes

**Owner:** Application Development Team  
**Status:** Testing required in Phase 2

---

#### Risk 3: Performance Degradation

**Risk Level:** 🟡 MEDIUM  
**Impact:** Slower application response times, poor user experience  
**Probability:** Low (SQLite typically faster for small datasets)

**Description:**
Complex queries with multiple joins (e.g., Instructor details page) may perform differently on SQLite vs. SQL Server, especially as data volume grows.

**Mitigation:**
- Baseline current SQL Server performance metrics
- Performance test with realistic data volumes
- Add indexes to SQLite if query plans show table scans
- Optimize EF Core query generation
- Tune SQLite PRAGMA settings (cache_size, journal_mode)

**Contingency:**
- Add database indexes
- Optimize LINQ queries
- Implement caching layer

**Owner:** Application Development Team + QA Team  
**Status:** Testing required in Phase 4

---

#### Risk 4: Data Migration Errors

**Risk Level:** 🟡 MEDIUM  
**Impact:** Incomplete or inaccurate data in SQLite  
**Probability:** Medium

**Description:**
Data export/import process may fail due to encoding issues, data format mismatches, or constraint violations during bulk insert.

**Mitigation:**
- Use proven export/import tools (e.g., EF Core data seeding, CSV with validation)
- Implement row-by-row validation during import
- Create comprehensive data validation queries
- Test migration process multiple times in non-production
- Maintain detailed error logs

**Contingency:**
- Re-run import with error handling
- Manual data fixes if needed
- Rollback to SQL Server if too many errors

**Owner:** Database Migration Lead  
**Status:** Procedures defined in Phase 3

---

#### Risk 5: Rollback Complexity

**Risk Level:** 🟡 MEDIUM  
**Impact:** Extended downtime if rollback required  
**Probability:** Low

**Description:**
If critical issues are discovered post-cutover, rolling back to SQL Server requires restoring backup, reverting application binaries, and potentially losing new transactions.

**Mitigation:**
- Maintain SQL Server backup for 30 days post-migration
- Implement read-only mode during validation window
- Practice rollback procedure in test environment
- Define clear rollback trigger criteria
- Keep rollback runbook accessible

**Contingency:**
- Execute rollback procedure
- Investigate root cause
- Reschedule migration after fixes

**Owner:** DevOps Team + Database Migration Lead  
**Status:** Rollback procedure documented (see below)

---

### Medium-Priority Risks

#### Risk 6: EF Core Provider Bugs

**Risk Level:** 🟡 MEDIUM  
**Impact:** Application errors or unexpected behavior  
**Probability:** Low

**Description:**
The SQLite EF Core provider may have bugs or limitations not present in the SQL Server provider.

**Mitigation:**
- Use stable, well-tested provider version
- Review provider release notes and known issues
- Test all EF Core features used by application
- Have workarounds for known provider limitations

**Owner:** Application Development Team

---

#### Risk 7: DateTime Handling Differences

**Risk Level:** 🟡 MEDIUM  
**Impact:** Date/time format errors or timezone issues  
**Probability:** Medium

**Description:**
SQLite stores dates as TEXT, INTEGER, or REAL. EF Core provider converts to/from .NET DateTime, but timezone handling may differ from SQL Server.

**Mitigation:**
- Test all date/time queries and comparisons
- Use UTC dates consistently
- Validate date format conversions
- Test date range queries and sorting

**Owner:** Application Development Team

---

### Low-Priority Risks

#### Risk 8: Insufficient Testing

**Risk Level:** 🟢 LOW  
**Impact:** Undiscovered bugs in production  
**Probability:** Low (comprehensive test plan in place)

**Mitigation:**
- Execute complete regression test suite
- Include manual exploratory testing
- Test with production-like data volumes
- Stakeholder UAT before production cutover

**Owner:** QA Team

---

#### Risk 9: Documentation Gaps

**Risk Level:** 🟢 LOW  
**Impact:** Operational difficulties post-migration  
**Probability:** Low

**Mitigation:**
- Maintain detailed migration documentation
- Update operational runbooks
- Document SQLite-specific configurations
- Conduct knowledge transfer sessions

**Owner:** Database Migration Lead

---

### Risk Register Summary

| Risk ID | Risk | Level | Mitigation Status | Owner |
|---------|------|-------|-------------------|-------|
| R1 | Data type incompatibilities | HIGH | Planned | App Dev |
| R2 | Cascade delete behavior | HIGH | Planned | App Dev |
| R3 | Performance degradation | MEDIUM | Planned | App Dev + QA |
| R4 | Data migration errors | MEDIUM | Planned | DB Lead |
| R5 | Rollback complexity | MEDIUM | Planned | DevOps |
| R6 | EF Core provider bugs | MEDIUM | Monitored | App Dev |
| R7 | DateTime handling | MEDIUM | Planned | App Dev |
| R8 | Insufficient testing | LOW | Planned | QA |
| R9 | Documentation gaps | LOW | Planned | DB Lead |

---

## Validation Gates & Checkpoints

### Checkpoint 1: Planning Complete (End of Phase 1)

**Validation Activities:**
- [ ] Migration plan peer review completed
- [ ] Stakeholder approval obtained
- [ ] All RACI roles assigned and accepted
- [ ] Risk register reviewed and approved
- [ ] Communication plan socialized

**Validation Queries:** N/A (planning phase)

**Success Criteria:**
- All checkboxes above completed
- Zero unmitigated high-priority risks
- Technical feasibility confirmed

**Go/No-Go Decision:** Approve to proceed to Phase 2 or address gaps

---

### Checkpoint 2: Schema Migration Complete (End of Phase 2)

**Validation Activities:**
- [ ] SQLite database created with all tables
- [ ] All indexes and constraints applied
- [ ] EF Core migrations run successfully
- [ ] Schema comparison shows logical parity

**Validation Queries:**

```sql
-- SQLite: List all tables
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- Expected: Course, CourseInstructor, Departments, Enrollments, Instructor, 
--           OfficeAssignments, Student, __EFMigrationsHistory

-- SQLite: List all indexes
SELECT name, tbl_name FROM sqlite_master WHERE type='index' ORDER BY tbl_name;

-- SQLite: Check foreign keys are enabled
PRAGMA foreign_keys;
-- Expected: 1 (enabled)

-- SQLite: List foreign keys per table
PRAGMA foreign_key_list(Enrollments);
PRAGMA foreign_key_list(Course);
PRAGMA foreign_key_list(Departments);
PRAGMA foreign_key_list(OfficeAssignments);
PRAGMA foreign_key_list(CourseInstructor);
```

**Success Criteria:**
- 7 application tables + 1 migrations history table exist
- All foreign keys defined and enabled
- All indexes created
- No schema generation errors

**Go/No-Go Decision:** Schema validated → Proceed to Phase 3

---

### Checkpoint 3: Data Migration Validated (End of Phase 3)

**Validation Activities:**
- [ ] Row count comparison (SQL Server vs SQLite)
- [ ] Referential integrity validation (no orphaned records)
- [ ] Sample data spot checks (random rows match exactly)
- [ ] Date/time format validation
- [ ] NULL value validation

**Validation Queries:**

```sql
-- Row count comparison (run on both SQL Server and SQLite)
SELECT 'Student' AS TableName, COUNT(*) AS RowCount FROM Student
UNION ALL
SELECT 'Instructor', COUNT(*) FROM Instructor
UNION ALL
SELECT 'Course', COUNT(*) FROM Course
UNION ALL
SELECT 'Enrollment', COUNT(*) FROM Enrollments
UNION ALL
SELECT 'Department', COUNT(*) FROM Departments
UNION ALL
SELECT 'OfficeAssignment', COUNT(*) FROM OfficeAssignments
UNION ALL
SELECT 'CourseInstructor', COUNT(*) FROM CourseInstructor;

-- Referential integrity check: Enrollments with invalid StudentID
SELECT e.EnrollmentID, e.StudentID 
FROM Enrollments e 
LEFT JOIN Student s ON e.StudentID = s.ID 
WHERE s.ID IS NULL;
-- Expected: 0 rows

-- Referential integrity check: Enrollments with invalid CourseID
SELECT e.EnrollmentID, e.CourseID 
FROM Enrollments e 
LEFT JOIN Course c ON e.CourseID = c.CourseID 
WHERE c.CourseID IS NULL;
-- Expected: 0 rows

-- Referential integrity check: Courses with invalid DepartmentID
SELECT c.CourseID, c.DepartmentID 
FROM Course c 
LEFT JOIN Departments d ON c.DepartmentID = d.DepartmentID 
WHERE d.DepartmentID IS NULL;
-- Expected: 0 rows

-- Referential integrity check: CourseInstructor with invalid IDs
SELECT ci.CoursesCourseID, ci.InstructorsID
FROM CourseInstructor ci
LEFT JOIN Course c ON ci.CoursesCourseID = c.CourseID
LEFT JOIN Instructor i ON ci.InstructorsID = i.ID
WHERE c.CourseID IS NULL OR i.ID IS NULL;
-- Expected: 0 rows

-- Sample data validation: Check a specific student
SELECT * FROM Student WHERE ID = 1;
-- Compare values with SQL Server

-- Date format validation
SELECT ID, LastName, EnrollmentDate FROM Student ORDER BY ID;
-- Verify dates display correctly
```

**Data Reconciliation Checklist:**
- [ ] All tables have matching row counts
- [ ] 0 orphaned foreign key records
- [ ] Sample spot checks pass (minimum 10 records per table)
- [ ] PII data migrated correctly (FirstName, LastName)
- [ ] Dates in correct format (ISO 8601: YYYY-MM-DD)

**Success Criteria:**
- 100% row count parity
- Zero referential integrity violations
- Spot check accuracy: 100%

**Go/No-Go Decision:** Data validated → Proceed to Phase 4

---

### Checkpoint 4: Application Testing Complete (End of Phase 4)

**Validation Activities:**

**Functional Testing:**
- [ ] View Students list (pagination, sorting)
- [ ] Create new Student
- [ ] Edit existing Student
- [ ] Delete Student (verify cascade: Enrollments deleted)
- [ ] View Instructors list
- [ ] View Instructor details (with courses and office assignment)
- [ ] Create/Edit/Delete Instructor
- [ ] View Courses list
- [ ] Create/Edit/Delete Course
- [ ] View Departments list
- [ ] Edit Department (test optimistic concurrency with RowVersion)
- [ ] Create Enrollment
- [ ] Delete Enrollment
- [ ] Search functionality
- [ ] Filter functionality
- [ ] Sort by different columns

**Cascade Delete Testing:**
- [ ] Delete Student → Verify Enrollments deleted
- [ ] Delete Course → Verify Enrollments deleted
- [ ] Delete Instructor → Verify OfficeAssignment deleted
- [ ] Delete Department → Verify Courses (and cascaded Enrollments) deleted

**Performance Testing:**
- [ ] Page load time: Students list
- [ ] Page load time: Instructor details (complex query with joins)
- [ ] CRUD operation latency
- [ ] Search/filter performance

**Validation Queries:**

```sql
-- Verify cascade delete: Create test student with enrollments, then delete
-- Step 1: Count enrollments for student ID 999 (test student)
SELECT COUNT(*) FROM Enrollments WHERE StudentID = 999;
-- Step 2: Delete student via application
-- Step 3: Verify enrollments deleted
SELECT COUNT(*) FROM Enrollments WHERE StudentID = 999;
-- Expected: 0
```

**Success Criteria:**
- Test pass rate: 100% (or documented exceptions)
- No critical or high-severity bugs
- Performance within baseline ±15%
- All cascade deletes work correctly

**Go/No-Go Decision:** All tests pass → Proceed to Phase 5 (Production)

---

### Checkpoint 5: Production Cutover Complete (End of Phase 5)

**Validation Activities:**
- [ ] Application starts successfully on SQLite
- [ ] Smoke tests pass (critical user journeys)
- [ ] No errors in application logs
- [ ] Database connection healthy
- [ ] Row count validation in production

**Validation Queries:**

```sql
-- Production smoke test queries
SELECT COUNT(*) FROM Student;
SELECT COUNT(*) FROM Instructor;
SELECT COUNT(*) FROM Course;
SELECT COUNT(*) FROM Enrollments;
SELECT COUNT(*) FROM Departments;
SELECT COUNT(*) FROM OfficeAssignments;
SELECT COUNT(*) FROM CourseInstructor;

-- Verify foreign keys enabled
PRAGMA foreign_keys;
-- Expected: 1

-- Check for any orphaned records
SELECT e.EnrollmentID FROM Enrollments e 
LEFT JOIN Student s ON e.StudentID = s.ID 
WHERE s.ID IS NULL;
-- Expected: 0 rows
```

**Smoke Test Scenarios:**
1. Access home page
2. View Students list
3. View a Student detail page
4. View Instructors list
5. View an Instructor detail page (complex query)
6. Perform a search

**Success Criteria:**
- Application accessible
- All smoke tests pass
- No errors in logs for first 30 minutes
- Data integrity validated

**Go/No-Go Decision:** Production validated → Declare success or rollback

---

### Checkpoint 6: Migration Closure (End of Phase 6)

**Validation Activities:**
- [ ] 2 weeks of stable operations
- [ ] No critical incidents related to migration
- [ ] Performance metrics within targets
- [ ] User feedback collected and addressed
- [ ] Documentation complete

**Success Criteria:**
- Zero outstanding critical issues
- Performance meets success criteria
- Lessons learned documented
- Stakeholder sign-off obtained

**Final Decision:** Close migration project → Decommission SQL Server

---

## Dependencies & Prerequisites

### Technical Dependencies

**Software Requirements:**
- [ ] .NET 6.0 SDK installed
- [ ] SQLite 3.x installed (or embedded in application)
- [ ] EF Core 6.0.2 or compatible version
- [ ] `Microsoft.EntityFrameworkCore.Sqlite` NuGet package
- [ ] Visual Studio 2022 or VS Code with C# extension

**Database Access:**
- [ ] Read access to source SQL Server database
- [ ] Backup and export permissions on SQL Server
- [ ] Write access to target SQLite file location
- [ ] File system permissions for SQLite database file

### Data Dependencies

**Source Data Requirements:**
- [ ] SQL Server database accessible and backed up
- [ ] Current schema documented (see Data Model Catalog)
- [ ] Data volume estimates for production (if migrating production)
- [ ] PII data handling procedures in place

**Data Volume Estimates:**
- Current seed data: 38 rows
- Production estimates: TBD (requires analysis if migrating production database)

### Infrastructure Dependencies

**Development Environment:**
- [ ] Local development environment with SQL Server LocalDB
- [ ] Local SQLite database for testing
- [ ] Source control access (Git repository)

**Production Environment (if applicable):**
- [ ] Production server access
- [ ] Deployment automation configured
- [ ] Backup and recovery procedures in place
- [ ] Monitoring and alerting configured

### Team Dependencies

**Required Roles:**
- [ ] Database Migration Lead assigned
- [ ] Application Development Team available
- [ ] QA Team available for testing
- [ ] DevOps Team available for deployment
- [ ] Stakeholders available for approvals

**Training & Knowledge:**
- [ ] Team familiar with EF Core migrations
- [ ] Team familiar with SQLite limitations and best practices
- [ ] Rollback procedure training completed

---

## Go/No-Go Decision Framework

### Decision Gates

Each phase concludes with a Go/No-Go decision gate. The decision is made by the Accountable stakeholder (per RACI) based on checkpoint validation results.

### Decision Criteria

**GO Criteria (Proceed to Next Phase):**
- ✅ All checkpoint exit criteria met
- ✅ No unresolved HIGH or CRITICAL issues
- ✅ Validation queries pass 100%
- ✅ Stakeholder approval obtained
- ✅ Resources available for next phase

**NO-GO Criteria (Do Not Proceed):**
- ❌ Any checkpoint exit criteria failed
- ❌ Unresolved HIGH or CRITICAL issues exist
- ❌ Validation failures > 5%
- ❌ Risk level exceeds acceptable threshold
- ❌ Resources unavailable

### Decision Gate Schedule

| Gate | Phase | Decision Maker | Timeline |
|------|-------|----------------|----------|
| **Gate 1** | Planning Complete | Stakeholders | End of Week 2 |
| **Gate 2** | Schema Migration Complete | App Dev Lead | End of Week 4 |
| **Gate 3** | Data Validated | DB Migration Lead | End of Week 5 |
| **Gate 4** | Testing Complete | QA Lead + Stakeholders | End of Week 6 |
| **Gate 5** | Production Go-Live | DevOps + Stakeholders | T+90min in cutover |
| **Gate 6** | Migration Closure | Stakeholders | End of Week 8 |

### Escalation Path

If a NO-GO decision is made:
1. **Document Issues:** Capture all issues preventing GO decision
2. **Root Cause Analysis:** Determine root cause of failures
3. **Mitigation Plan:** Create plan to address issues
4. **Revised Timeline:** Update project timeline
5. **Re-Assess:** Schedule follow-up decision gate
6. **Stakeholder Communication:** Notify all stakeholders of delay

### Rollback Decision Criteria

**Rollback Triggers (During/After Cutover):**
- Critical application functionality broken
- Data corruption detected
- Performance degradation > 30%
- Unrecoverable errors in production
- Security vulnerability introduced

**Rollback Decision Maker:** DevOps Team Lead + Database Migration Lead (with stakeholder notification)

**Rollback Time Limit:** Decision must be made within 90 minutes of cutover start

---

## Appendix: Rollback Procedure

### Pre-Rollback Checklist

- [ ] Verify SQL Server backup is available and valid
- [ ] Notify all stakeholders of rollback decision
- [ ] Document reason for rollback
- [ ] Prepare to revert application binaries

### Rollback Steps

**Step 1: Stop Application (T+0min)**
- Stop application services immediately
- Display maintenance page to users

**Step 2: Revert Application (T+5min)**
- Deploy previous application version (with SQL Server provider)
- Revert connection strings to SQL Server
- Restart application services

**Step 3: Restore SQL Server Database (T+10min)**
- Restore SQL Server backup from pre-migration
- Verify database integrity
- Test database connection

**Step 4: Validation (T+20min)**
- Run smoke tests on SQL Server
- Verify data integrity
- Check application logs

**Step 5: Go-Live (T+30min)**
- Remove maintenance page
- Monitor application
- Notify stakeholders of rollback completion

**Expected Rollback Duration:** 30 minutes

### Post-Rollback Activities

- [ ] Root cause analysis of migration failure
- [ ] Update risk register with lessons learned
- [ ] Revise migration plan to address issues
- [ ] Schedule retrospective with team
- [ ] Plan remediation and rescheduling

---

## Appendix: SQLite Configuration Best Practices

### Recommended PRAGMA Settings

```sql
-- Enable foreign key constraints (CRITICAL)
PRAGMA foreign_keys = ON;

-- Set journal mode to WAL for better concurrency
PRAGMA journal_mode = WAL;

-- Increase cache size for better performance (default is -2000 = 2MB)
PRAGMA cache_size = -64000; -- 64MB

-- Synchronous mode (FULL for safety, NORMAL for performance)
PRAGMA synchronous = NORMAL;

-- Temp store in memory for faster temp table operations
PRAGMA temp_store = MEMORY;
```

### EF Core Configuration

```csharp
// In Startup.cs or Program.cs
services.AddDbContext<SchoolContext>(options =>
    options.UseSqlite(connectionString, sqliteOptions =>
    {
        sqliteOptions.CommandTimeout(60); // 60 second timeout
    }));

// In SchoolContext.cs
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    if (optionsBuilder.IsConfigured)
    {
        return;
    }
    
    var connectionString = "Data Source=ContosoUniversity.db";
    optionsBuilder.UseSqlite(connectionString, options =>
    {
        options.MigrationsAssembly("ContosoUniversity");
    });
}

// Execute PRAGMAs on connection open
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    
    // Note: PRAGMA commands should be executed at connection level
    // Implement in a connection interceptor or at application startup
}
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Database Migration Lead | Initial migration plan created |

---

## Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Database Migration Lead | TBD | | |
| Application Development Lead | TBD | | |
| QA Lead | TBD | | |
| DevOps Lead | TBD | | |
| Project Stakeholder | TBD | | |

---

**End of Document**
