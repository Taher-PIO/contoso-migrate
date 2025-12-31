# Risk Register: .NET → React + Node/TypeScript Migration

**Document Version**: 1.0  
**Date**: December 31, 2025  
**Status**: Active

---

## Risk Management Process

**Risk Review Cadence**:

- **Phase 0-3**: Weekly risk review meetings
- **Phase 4-6**: Bi-weekly risk review meetings
- **Phase 7-8**: Daily risk review during cutover

**Risk Owners**: Assigned to specific team members responsible for monitoring and mitigating each risk

**Risk Scoring**:

- **Likelihood**: Low (1-3), Medium (4-6), High (7-9)
- **Impact**: Low (1-3), Medium (4-6), Critical (7-9)
- **Priority Score**: Likelihood × Impact (Max: 81)

**Risk Status**:

- 🟢 **Mitigated**: Risk controls in place and effective
- 🟡 **Monitoring**: Risk controls in place, requires ongoing monitoring
- 🔴 **Active**: Risk controls insufficient or not yet implemented

---

## Risk Register

### R-001: Data Migration Integrity 🔴

**Category**: Technical  
**Phase**: Phase 8 (Cutover)

**Risk Description**:  
Data loss or corruption during SQL Server → SQLite migration, including loss of records, broken relationships, or incorrect data transformation.

**Likelihood**: Medium (5)  
**Impact**: Critical (9)  
**Priority Score**: 45 (Critical)

**Current Controls**:

- None (planning phase)

**Mitigation Strategy**:

1. **Multiple Backups**:

   - Create SQL Server backup before export
   - Create SQLite backup after import
   - Store backups in multiple locations (local + cloud)
   - Retain backups for 30 days post-cutover

2. **Phased Migration**:

   - Dry-run in development environment
   - Dry-run in staging environment with production data copy
   - Measure migration time and identify bottlenecks
   - Document and test rollback procedure

3. **Data Validation Scripts**:

   - Compare row counts (SQL Server vs. SQLite)
   - Validate foreign key relationships (all FKs intact)
   - Validate NULL constraints (no unexpected NULLs)
   - Validate data types (no precision loss for decimals)
   - Validate many-to-many relationships (Instructor-Course)
   - Validate unique constraints (no duplicates)

4. **Automated Testing**:

   - Run integration tests against migrated SQLite database
   - Verify all CRUD operations work
   - Verify complex queries return same results

5. **Side-by-Side Comparison**:
   - Run same queries on SQL Server and SQLite
   - Compare results for discrepancies
   - Document any acceptable differences (e.g., precision)

**Contingency Plan**:

- If data validation fails: Rollback, fix migration script, re-test
- If production migration fails: Restore SQL Server backup, keep .NET app running
- If data corruption discovered post-cutover: Rollback to .NET app, re-migrate from backup

**Owner**: Backend Developer  
**Review Date**: Before Phase 8 start

---

### R-002: Concurrency Control Parity 🟡

**Category**: Technical  
**Phase**: Phase 3 (Data & Persistence)

**Risk Description**:  
Department optimistic locking may behave differently in Drizzle ORM (manual version field) compared to EF Core (SQL Server ROWVERSION). Race conditions or concurrency conflicts may not be detected correctly, leading to lost updates or data inconsistency.

**Likelihood**: Medium (4)  
**Impact**: High (7)  
**Priority Score**: 28 (High)

**Current Controls**:

- Drizzle schema includes `version` field for Department

**Mitigation Strategy**:

1. **Comprehensive Concurrency Tests**:

   - Write integration tests simulating concurrent updates (2+ users)
   - Test concurrent edit scenarios (User A and User B edit same department)
   - Test concurrent delete scenarios (User A edits, User B deletes)
   - Test race conditions (rapid sequential updates)
   - Verify version field increments correctly

2. **Manual Version Field Implementation (Drizzle ORM)**:

   ```typescript
   // In DepartmentService.update()
   import { and, eq } from 'drizzle-orm';

   const updated = await db
     .update(departments)
     .set({
       ...updateData,
       version: currentVersion + 1,
     })
     .where(
       and(eq(departments.id, id), eq(departments.version, currentVersion))
     );

   // If no rows affected, throw ConcurrencyError
   if (!updated) {
     throw new ConcurrencyError('Department was modified by another user');
   }
   ```

3. **UI Conflict Resolution**:

   - Show current database values to user when conflict detected
   - Provide "Overwrite" and "Cancel" options
   - Display field-by-field comparison (user's value vs. current value)
   - Match .NET UI behavior exactly

4. **Validation in Staging**:
   - Test concurrency scenarios in staging with production-like load
   - Perform load testing with concurrent users
   - Verify error messages match .NET behavior

**Contingency Plan**:

- If concurrency issues discovered in staging: Revise Drizzle ORM queries, add transaction isolation
- If issues discovered in production: Implement database-level locking as fallback

**Owner**: Backend Developer  
**Review Date**: End of Phase 3

---

### R-003: Performance Regression 🟡

**Category**: Technical  
**Phase**: Phase 5-6 (Frontend + Testing)

**Risk Description**:  
SQLite or Node.js may perform worse than SQL Server/.NET for certain queries, especially:

- Pagination with large datasets (10K+ students)
- Complex joins (Instructor → Course → Enrollment)
- Concurrent writes (SQLite Write-Ahead Logging limitations)
- Search queries (full-text search less mature in SQLite)

**Likelihood**: Medium (5)  
**Impact**: High (7)  
**Priority Score**: 35 (High)

**Current Controls**:

- None (planning phase)

**Mitigation Strategy**:

1. **Performance Benchmarking**:

   - Establish baseline performance metrics in .NET app:
     - Student list page load time (with 1000 students): < 500ms
     - Course list page load time: < 300ms
     - Department edit with concurrency check: < 200ms
     - Instructor master-detail load: < 700ms
   - Measure React/Node performance with same dataset
   - Target: Within 20% of .NET baseline

2. **SQLite Optimization**:

   - Enable WAL (Write-Ahead Logging) mode for better concurrency:
     ```sql
     PRAGMA journal_mode=WAL;
     ```
   - Create indexes on frequently queried columns:
     - `CREATE INDEX idx_student_lastname ON Student(LastName);`
     - `CREATE INDEX idx_enrollment_studentid ON Enrollment(StudentID);`
     - `CREATE INDEX idx_course_departmentid ON Course(DepartmentID);`
   - Use `ANALYZE` command to optimize query planner
   - Set appropriate `cache_size` pragma

3. **Drizzle ORM Query Optimization**:

   - Use `db.select({ ... })` to limit returned columns (avoid SELECT \*)
   - Avoid N+1 with explicit joins or targeted queries (Drizzle emphasizes composable SQL)
   - Paginate with `limit` and `offset` (or keyset pagination where feasible)
   - Use transactions and batched operations where applicable

4. **Caching Strategy**:

   - Implement in-memory caching for dropdown data (departments, instructors)
   - Cache frequently accessed data with short TTL (5 minutes)
   - Use Redis for distributed caching if needed

5. **Load Testing**:
   - Simulate 50 concurrent users
   - Test sustained load (1000 requests/minute)
   - Measure response times under load
   - Identify bottlenecks (database, API, frontend)

**Contingency Plan**:

- If SQLite performance insufficient: Migrate to PostgreSQL (Drizzle ORM supports both)
- If Node.js performance insufficient: Optimize queries, add caching, scale horizontally

**Owner**: Backend Developer + Performance Engineer  
**Review Date**: End of Phase 6

---

### R-004: Authentication Security 🔴

**Category**: Security  
**Phase**: Phase 4 (Auth & Security)

**Risk Description**:  
JWT implementation may have security vulnerabilities, including:

- XSS attacks (token theft from localStorage)
- CSRF attacks (token misuse)
- Token leakage in URLs or logs
- Insufficient token validation
- Weak secret key or algorithm
- Lack of token revocation mechanism

**Likelihood**: Low (3)  
**Impact**: Critical (9)  
**Priority Score**: 27 (High)

**Current Controls**:

- None (no authentication currently exists)

**Mitigation Strategy**:

1. **Secure Token Storage**:

   - ✅ Store refresh tokens in **httpOnly cookies** (not accessible to JavaScript)
   - ✅ Store access tokens in **Redux state** (in-memory, cleared on page reload)
   - ❌ **Never** store tokens in localStorage or sessionStorage (XSS risk)
   - ❌ **Never** include tokens in URLs (log leakage risk)

2. **Token Configuration**:

   - Use **HS256 or RS256** algorithm (avoid HS384, RS384)
   - Use **256-bit secret key** (minimum)
   - Set **short expiry** for access tokens (15 minutes)
   - Set **longer expiry** for refresh tokens (7 days)
   - Include **user ID**, **email**, **roles** in token claims
   - Include **iat** (issued at) and **exp** (expiry) claims

3. **CSRF Protection**:

   - Use **SameSite=Strict** cookie attribute for refresh tokens
   - Implement CSRF tokens for state-changing operations
   - Validate Origin and Referer headers

4. **Token Validation**:

   - Verify token signature on every request
   - Check token expiry (reject expired tokens)
   - Validate token issuer and audience
   - Implement token revocation (store revoked tokens in database)
   - Validate user still exists and is active

5. **Security Headers**:

   - Implement **CORS** with strict origin whitelist
   - Set **Content-Security-Policy** (CSP) headers
   - Set **X-Content-Type-Options: nosniff**
   - Set **X-Frame-Options: DENY**
   - Set **Strict-Transport-Security** (HSTS)

6. **Security Audit**:

   - Third-party security audit before Phase 8
   - Penetration testing (token theft, brute force, replay attacks)
   - OWASP Top 10 validation
   - Dependency vulnerability scanning (npm audit, Snyk)

7. **Rate Limiting**:
   - Implement rate limiting on /api/auth/login (10 attempts per 15 minutes per IP)
   - Implement rate limiting on /api/auth/refresh (prevent token flooding)

**Contingency Plan**:

- If security audit fails: Fix vulnerabilities before Phase 8
- If vulnerability discovered in production: Revoke all tokens, force re-authentication, patch immediately

**Owner**: Security Engineer + Backend Developer  
**Review Date**: Before Phase 4 completion

---

### R-005: Functional Parity Gaps 🟡

**Category**: Functional  
**Phase**: Phase 5 (Frontend Migration)

**Risk Description**:  
React app may miss subtle .NET behaviors, including:

- Validation error messages differ from .NET
- Navigation flows differ (back button, breadcrumbs)
- Error handling differs (404, 500, concurrency errors)
- Query string preservation (search terms, sort order)
- Form field behavior (disabled states, readonly fields)
- Bootstrap styling inconsistencies

**Likelihood**: Medium (6)  
**Impact**: High (6)  
**Priority Score**: 36 (High)

**Current Controls**:

- None (planning phase)

**Mitigation Strategy**:

1. **Detailed Functional Testing**:

   - Create test cases for every user flow
   - Test every CRUD operation for each module
   - Test pagination, search, sort behaviors
   - Test error scenarios (404, 400, 409, 500)
   - Test form validation (client-side and server-side)
   - Test navigation (back button, breadcrumbs, redirects)

2. **Side-by-Side Comparison**:

   - Run .NET app and React app in parallel
   - Compare behavior step-by-step
   - Screenshot differences for review
   - Document acceptable vs. unacceptable differences

3. **User Acceptance Testing (UAT)**:

   - Invite stakeholders to test React app
   - Provide .NET app as reference
   - Collect feedback on differences
   - Prioritize fixes based on impact

4. **Validation Parity**:

   - Extract all Data Annotations validation rules from .NET
   - Implement identical Yup schemas (frontend) and Zod schemas (backend)
   - Ensure error messages match .NET exactly
   - Test all validation scenarios (required, length, range, regex)

5. **Query String Preservation**:

   - Use React Router's `useSearchParams()` hook
   - Preserve search, sort, page parameters across navigation
   - Restore previous state when returning to list pages

6. **Bootstrap Version Match**:
   - Use same Bootstrap version (5.3.x)
   - Use same component classes (btn, table, form-control, etc.)
   - Verify responsive behavior matches

**Contingency Plan**:

- If parity gaps discovered in UAT: Fix before Phase 8 or document as known differences
- If critical gap discovered in production: Hotfix or rollback

**Owner**: Frontend Developer + QA Lead  
**Review Date**: End of Phase 5

---

### R-006: Dependency Vulnerabilities 🟡

**Category**: Security  
**Phase**: Ongoing

**Risk Description**:  
npm ecosystem has frequent security vulnerabilities. Project may depend on packages with known CVEs, leading to security breaches or compliance violations.

**Likelihood**: Medium (6)  
**Impact**: High (6)  
**Priority Score**: 36 (High)

**Current Controls**:

- None (planning phase)

**Mitigation Strategy**:

1. **Automated Scanning**:

   - Run `npm audit` in CI pipeline (fail build if high/critical vulnerabilities)
   - Use Snyk or Dependabot for continuous monitoring
   - Enable GitHub security alerts

2. **Dependency Updates**:

   - Review and apply security updates weekly
   - Use `npm audit fix` to auto-fix vulnerabilities
   - Manually update dependencies with breaking changes
   - Test after every update

3. **Dependency Pinning**:

   - Use exact versions in package.json (not ^ or ~)
   - Use `package-lock.json` for reproducible builds
   - Review dependency changes in PRs

4. **Minimal Dependencies**:

   - Avoid unnecessary dependencies (review every package before adding)
   - Prefer well-maintained packages (high download count, recent updates)
   - Avoid packages with many transitive dependencies

5. **License Compliance**:
   - Scan dependencies for license compatibility (use `license-checker`)
   - Avoid GPL licenses (copyleft risk)
   - Document all licenses in LICENSES.md

**Contingency Plan**:

- If critical vulnerability discovered: Apply patch immediately, redeploy
- If no patch available: Find alternative package or implement workaround

**Owner**: DevOps Engineer  
**Review Date**: Weekly

---

### R-007: Browser Compatibility 🟢

**Category**: Technical  
**Phase**: Phase 5 (Frontend Migration)

**Risk Description**:  
React app may not work correctly in older browsers (IE11, Safari <14), leading to broken UI or JavaScript errors for some users.

**Likelihood**: Low (3)  
**Impact**: Medium (4)  
**Priority Score**: 12 (Low)

**Current Controls**:

- None (planning phase)

**Mitigation Strategy**:

1. **Browser Support Policy**:

   - Define supported browsers (Chrome, Firefox, Edge, Safari latest 2 versions)
   - Document unsupported browsers (IE11, Safari <13)
   - Display warning message for unsupported browsers

2. **Transpilation**:

   - Use Babel to transpile ES6+ to ES5 (if IE11 support required)
   - Use polyfills for missing APIs (Promise, fetch, Array.prototype.includes)
   - Configure browserslist in package.json

3. **Testing**:

   - Test in all supported browsers manually
   - Use BrowserStack or Sauce Labs for automated cross-browser testing
   - Test responsive behavior on mobile devices

4. **Progressive Enhancement**:
   - Ensure core functionality works without JavaScript (N/A for SPA, but document limitation)
   - Use CSS fallbacks for modern features (CSS Grid → Flexbox)

**Contingency Plan**:

- If browser compatibility issues discovered: Fix with polyfills or CSS fallbacks
- If IE11 required: Add polyfills and transpilation

**Owner**: Frontend Developer  
**Review Date**: End of Phase 5

---

### R-008: SQLite Scaling Limitations 🟡

**Category**: Technical  
**Phase**: Phase 3 (Data & Persistence)

**Risk Description**:  
SQLite has scaling limitations compared to SQL Server, including:

- Single-writer limitation (concurrent writes blocked)
- No distributed database support
- File-based database (not ideal for cloud-native apps)
- Limited full-text search capabilities
- Maximum database size ~281 TB (acceptable for most cases, but less than SQL Server)

**Likelihood**: Low (3)  
**Impact**: High (7)  
**Priority Score**: 21 (Medium)

**Current Controls**:

- None (planning phase)

**Mitigation Strategy**:

1. **Assess Dataset Size**:

   - Measure current SQL Server database size
   - Estimate growth rate (students/courses/enrollments per year)
   - Document acceptable maximum size (recommend <10GB for SQLite)

2. **WAL Mode Configuration**:

   - Enable Write-Ahead Logging (WAL) for better concurrency
   - WAL allows multiple readers and one writer simultaneously
   - Configure `PRAGMA journal_mode=WAL;`

3. **Write Optimization**:

   - Batch write operations where possible
   - Use transactions to reduce write lock contention
   - Avoid long-running transactions

4. **Migration Path to PostgreSQL**:

   - Document PostgreSQL migration plan (Drizzle ORM supports both)
   - If SQLite performance insufficient, migrate to PostgreSQL
   - Drizzle schema changes minimal (switch driver and connection configuration)

5. **Read Scaling**:
   - Use read replicas if needed (WAL mode supports this)
   - Implement caching for frequently read data

**Contingency Plan**:

- If SQLite performance insufficient: Migrate to PostgreSQL (estimated 2-3 days effort)
- If write contention becomes issue: Implement job queue for background writes

**Owner**: Backend Developer  
**Review Date**: End of Phase 3

---

### R-009: State Management Complexity 🟡

**Category**: Technical  
**Phase**: Phase 5 (Frontend Migration)

**Risk Description**:  
Redux Toolkit state management may introduce complexity, bugs, or performance issues, including:

- State synchronization issues (stale data)
- Race conditions (multiple async actions)
- Over-fetching or under-fetching data
- Unintended re-renders (performance)
- Complex debugging (action/reducer chains)

**Likelihood**: Medium (4)  
**Impact**: Medium (5)  
**Priority Score**: 20 (Medium)

**Current Controls**:

- None (planning phase)

**Mitigation Strategy**:

1. **Redux Toolkit Best Practices**:

   - Use **createSlice** for reducers (less boilerplate)
   - Use **createAsyncThunk** for API calls (standardized async actions)
   - Use **RTK Query** for caching and data fetching (consider for Phase 5)
   - Normalize state structure (avoid nested data)

2. **State Design**:

   - Keep global state minimal (only data needed across components)
   - Use local component state for UI-only state (form inputs, modals)
   - Use selectors (createSelector) for derived data
   - Avoid storing API responses directly (normalize first)

3. **Testing**:

   - Test reducers in isolation (unit tests)
   - Test async thunks with mocked API calls
   - Test component integration with Redux (integration tests)

4. **Debugging Tools**:

   - Use Redux DevTools for time-travel debugging
   - Log actions and state changes in development
   - Use React DevTools to identify re-render issues

5. **Performance Monitoring**:
   - Use React Profiler to measure render performance
   - Use `React.memo` to prevent unnecessary re-renders
   - Use `useSelector` with shallow equality checks

**Contingency Plan**:

- If Redux becomes too complex: Simplify state structure, remove unnecessary global state
- If performance issues: Optimize selectors, use memoization, split state

**Owner**: Frontend Developer  
**Review Date**: Mid-Phase 5

---

### R-010: Testing Coverage Gaps 🟡

**Category**: Quality  
**Phase**: Phase 6 (Testing & Quality)

**Risk Description**:  
Test coverage may fall short of targets (>80% backend, >75% frontend), leaving untested code paths that contain bugs. Current .NET app has zero tests, so baseline is unknown.

**Likelihood**: Medium (5)  
**Impact**: Medium (6)  
**Priority Score**: 30 (High)

**Current Controls**:

- None (no tests exist in .NET app)

**Mitigation Strategy**:

1. **Test-Driven Development (TDD)**:

   - Write tests before implementing features (where feasible)
   - Use Red-Green-Refactor cycle
   - Focus on critical paths first (CRUD operations, authentication, concurrency)

2. **Coverage Targets**:

   - Backend: >80% line coverage (Mocha + Chai + c8)
   - Frontend: >75% line coverage (Jest + React Testing Library)
   - E2E: All critical user journeys covered (Playwright)

3. **Prioritize High-Risk Areas**:

   - Concurrency control (Department version checking)
   - Authentication and authorization (JWT validation)
   - Validation logic (Zod/Yup schemas)
   - Many-to-many relationships (Instructor-Course)
   - Cascade deletes

4. **Automated Coverage Reports**:

   - Generate coverage reports in CI pipeline
   - Fail build if coverage drops below target
   - Track coverage trends over time

5. **Code Review Focus**:
   - Require tests for every new feature
   - Review test quality (not just coverage percentage)
   - Ensure tests are maintainable and readable

**Contingency Plan**:

- If coverage targets not met: Extend Phase 6 duration, prioritize critical areas
- If tests are flaky: Investigate root cause, stabilize tests before Phase 8

**Owner**: QA Lead + Development Team  
**Review Date**: End of Phase 6

---

### R-011: Team Learning Curve 🟢

**Category**: Organizational  
**Phase**: Phase 0-5

**Risk Description**:  
Team may lack experience with TypeScript, React, Drizzle ORM, or Node.js, leading to slower development, bugs, or poor code quality.

**Likelihood**: Medium (4)  
**Impact**: Medium (4)  
**Priority Score**: 16 (Low)

**Current Controls**:

- None (assumption: team has some experience)

**Mitigation Strategy**:

1. **Training and Onboarding**:

   - Provide TypeScript training (online courses, workshops)
   - Provide React training (official docs, tutorials)
   - Provide Drizzle ORM training (documentation, examples)
   - Pair senior developers with junior developers

2. **Code Reviews**:

   - Require senior developer review for all PRs
   - Use code reviews as learning opportunities
   - Document common mistakes and best practices

3. **Reference Implementation**:

   - Implement one complete module as reference (e.g., Students)
   - Use as template for remaining modules
   - Document patterns and conventions

4. **External Support**:

   - Hire contractor with React/Node.js expertise (if needed)
   - Engage consulting firm for code review or mentorship

5. **Time Buffer**:
   - Add 20% time buffer to estimates for learning curve
   - Adjust velocity after first module completion

**Contingency Plan**:

- If team velocity too slow: Hire additional resources or extend timeline
- If code quality issues: Increase code review rigor, refactor poor code

**Owner**: Engineering Manager  
**Review Date**: End of Phase 2

---

### R-012: Documentation Drift 🟢

**Category**: Organizational  
**Phase**: Ongoing

**Risk Description**:  
Documentation may become outdated as code evolves, leading to confusion, incorrect implementations, or onboarding difficulties.

**Likelihood**: Medium (5)  
**Impact**: Low (3)  
**Priority Score**: 15 (Low)

**Current Controls**:

- None (documentation being created now)

**Mitigation Strategy**:

1. **Documentation in Code**:

   - Use TSDoc comments for functions and classes
   - Use JSDoc for complex logic
   - Keep README files up to date
   - Document API endpoints with OpenAPI/Swagger

2. **Documentation Review**:

   - Include documentation updates in PR checklist
   - Review documentation changes in code reviews
   - Require documentation updates for breaking changes

3. **Automated Documentation**:

   - Generate API documentation from code (Swagger)
   - Generate TypeScript type documentation (TypeDoc)
   - Keep generated docs in sync with code

4. **Quarterly Documentation Audit**:

   - Review all documentation for accuracy
   - Update outdated sections
   - Archive obsolete documentation

5. **Onboarding Test**:
   - Use documentation to onboard new team members
   - Collect feedback on clarity and accuracy
   - Update documentation based on feedback

**Contingency Plan**:

- If documentation drift detected: Schedule documentation sprint to update
- If documentation blocking onboarding: Prioritize critical sections first

**Owner**: Tech Lead  
**Review Date**: Quarterly

---

## Risk Summary Dashboard

| Risk ID | Risk Name                   | Likelihood | Impact | Priority | Status        | Owner        |
| ------- | --------------------------- | ---------- | ------ | -------- | ------------- | ------------ |
| R-001   | Data Migration Integrity    | 5          | 9      | 45       | 🔴 Active     | Backend Dev  |
| R-002   | Concurrency Control Parity  | 4          | 7      | 28       | 🟡 Monitoring | Backend Dev  |
| R-003   | Performance Regression      | 5          | 7      | 35       | 🟡 Monitoring | Backend Dev  |
| R-004   | Authentication Security     | 3          | 9      | 27       | 🔴 Active     | Security Eng |
| R-005   | Functional Parity Gaps      | 6          | 6      | 36       | 🟡 Monitoring | Frontend Dev |
| R-006   | Dependency Vulnerabilities  | 6          | 6      | 36       | 🟡 Monitoring | DevOps Eng   |
| R-007   | Browser Compatibility       | 3          | 4      | 12       | 🟢 Mitigated  | Frontend Dev |
| R-008   | SQLite Scaling Limitations  | 3          | 7      | 21       | 🟡 Monitoring | Backend Dev  |
| R-009   | State Management Complexity | 4          | 5      | 20       | 🟡 Monitoring | Frontend Dev |
| R-010   | Testing Coverage Gaps       | 5          | 6      | 30       | 🟡 Monitoring | QA Lead      |
| R-011   | Team Learning Curve         | 4          | 4      | 16       | 🟢 Mitigated  | Eng Manager  |
| R-012   | Documentation Drift         | 5          | 3      | 15       | 🟢 Mitigated  | Tech Lead    |

**Priority Distribution**:

- 🔴 **Critical (40-81)**: 1 risk (R-001)
- 🟠 **High (20-39)**: 6 risks (R-002, R-003, R-004, R-005, R-006, R-010)
- 🟡 **Medium (10-19)**: 3 risks (R-007, R-009, R-011)
- 🟢 **Low (1-9)**: 2 risks (R-008, R-012)

---

## Risk Escalation Process

**Escalation Triggers**:

1. Risk priority score increases by >10 points
2. Risk status changes to Active (🔴)
3. Mitigation strategy fails
4. New critical risk identified (score >40)

**Escalation Path**:

1. Risk owner escalates to project manager
2. Project manager escalates to steering committee
3. Steering committee decides on action (accept, mitigate, transfer, avoid)

**Documentation**:

- Log all escalations in risk register
- Document decision and rationale
- Update risk mitigation strategy

---

**Document Status**: Draft - Ready for Review  
**Next Steps**:

1. Review risk register with team
2. Assign risk owners
3. Schedule risk review meetings
4. Track risk status throughout migration

**Last Updated**: December 31, 2025
