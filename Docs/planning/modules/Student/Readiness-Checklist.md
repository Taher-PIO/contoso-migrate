# Student Module – Readiness Checklist (Docs-Only)

Version: 1.0  
Date: December 31, 2025  
Status: Ready for review

References:

- [../../Overview.md](../../Overview.md)
- [../../Phases.md](../../Phases.md)
- [../../Architecture.md](../../Architecture.md)
- [../../Risks.md](../../Risks.md)
- [Kickoff.md](Kickoff.md)
- [Slice-Plan.md](Slice-Plan.md)

Scope: This checklist confirms all documentation prerequisites are complete before starting any implementation work for the Student module. No feature changes; strict parity with legacy behavior.

---

## 1) Preconditions (must be true before implementation)

- Configuration (from Overview E Config Map):

  - [ ] `DATABASE_URL` documented for SQLite (Drizzle datasource)
  - [ ] `PORT`, `HOST` documented for Express (backend)
  - [ ] `CORS_ORIGIN` documented for React dev server
  - [ ] `DEFAULT_PAGE_SIZE` documented (planning standard: 10)
  - [ ] React `.env` keys documented (e.g., `REACT_APP_API_URL`)

- EF → Drizzle ORM mapping (from Phases 1.2 & Architecture 2.2):

  - [ ] Student fields parity verified (ID, LastName, FirstMidName, EnrollmentDate)
  - [ ] Student→Enrollments, Enrollment→Course relationships verified
  - [ ] Case-insensitive search parity note captured (`LIKE` + `COLLATE NOCASE` or `lower()`)
  - [ ] FK behavior parity noted (409 on delete with Enrollments)

- Route table (from Slice-Plan §1):

  - [ ] GET `/api/students` with query (searchString, sortOrder, page, pageSize)
  - [ ] GET `/api/students/:id`
  - [ ] POST `/api/students`
  - [ ] PUT `/api/students/:id`
  - [ ] DELETE `/api/students/:id`
  - [ ] Status codes and DTO shapes documented

- Component hierarchy (from Slice-Plan §3):

  - [ ] React routes confirmed (`/students`, `/students/:id`, `/students/create`, `/students/:id/edit`, `/students/:id/delete`)
  - [ ] Component list confirmed (`StudentListPage`, `StudentDetailsPage`, `StudentCreatePage`, `StudentEditPage`, `StudentDeleteConfirm`, plus `StudentForm`, `SearchBar`, `SortDropdown`, `Pagination`, `StudentTable`)
  - [ ] Bootstrap classes to use documented (table, form-control, btn, alert)

- Redux Toolkit state (from Slice-Plan §3.2):

  - [ ] State contract confirmed (students, currentStudent, loading, error, pagination, searchString, sortOrder)
  - [ ] Async thunks list confirmed (fetchStudents, fetchStudentById, createStudent, updateStudent, deleteStudent)
  - [ ] Query string preservation behavior documented

- Auth parity (from Slice-Plan §4):

  - [ ] Student routes are public (no JWT required); JWT section marked N/A for this slice

- Test cases enumerated (from Slice-Plan §5):
  - [ ] Backend: CRUD + pagination/search/sort + FK 409 + 404/400
  - [ ] Frontend: component render, form validation, user flows, redux transitions
  - [ ] E2E: list → create → view → edit → delete (evidence-only, no scripts)

---

## 2) Risk Focus (no new risks; reference Risks.md)

Applicable risks to this slice (see [../../Risks.md](../../Risks.md)):

- R-005 Functional Parity Gaps – Enforce behavior parity for pagination, search, sort, validation, and error handling.
- R-003 Performance Regression – Student list performance; consider non-functional acceptance targets.
- R-010 Testing Coverage Gaps – Ensure test plan meets >80% backend, >75% frontend coverage goals.
- R-001 Data Migration Integrity – Validate seeded Student and Enrollment data parity against legacy.

Mitigations and owners are defined in the risk register; do not redefine here.

---

## 3) Validation Steps (post-slice, docs-only evidence)

- API Evidence

  - [ ] Sample `GET /api/students` response JSON attached (with pagination block)
  - [ ] Sample `GET /api/students/:id` response JSON attached (with enrollments + course titles)
  - [ ] `POST`/`PUT` validation error JSON examples (field-level messages) attached
  - [ ] `DELETE` FK conflict example showing 409 + error payload attached

- Behavior Checks

  - [ ] Pagination math check (edge: page=0, page>max, pageSize boundaries)
  - [ ] Search case-insensitivity (e.g., search "al" matches "Alexander" and "ALONSO")
  - [ ] Sort ordering verified (default LastName asc; date asc/desc; name desc)
  - [ ] Query string preservation across navigation

- UI Evidence

  - [ ] Screenshots: list page, details, create/edit forms, delete confirm
  - [ ] Validation messages visible under fields and in summary (where applicable)
  - [ ] Bootstrap classes rendered as expected (table, form-control, btn)

- Data Evidence
  - [ ] Row counts for Student and Enrollment match seed expectations
  - [ ] Student with enrollments cannot be deleted (FK enforced)
  - [ ] Date format honored in UI (yyyy-MM-dd)

---

## 4) Sign-offs (docs-only)

- Backend Lead: **\*\*\*\***\_\_**\*\*\*\*** Date: \***\*\_\_\*\***
- Frontend Lead: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\_\*\***
- Data Lead: ****\*\*****\_****\*\***** Date: \***\*\_\_\*\***
- QA Lead: ****\*\*****\_\_\_****\*\***** Date: \***\*\_\_\*\***
- Product Owner: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\_\*\***

---

## 5) Links

- [Kickoff.md](Kickoff.md)
- [Slice-Plan.md](Slice-Plan.md)
- [../../Overview.md](../../Overview.md)
- [../../Phases.md](../../Phases.md)
- [../../Architecture.md](../../Architecture.md)
- [../../Risks.md](../../Risks.md)
