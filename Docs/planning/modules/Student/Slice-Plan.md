# Student Module – Slice-1 Execution Plan

Version: 1.0  
Date: December 31, 2025  
Status: Planning (documentation-only)

References:

- [../../Overview.md](../../Overview.md)
- [../../Phases.md](../../Phases.md)
- [../../Architecture.md](../../Architecture.md)
- [../../Risks.md](../../Risks.md)

Scope note: This plan preserves strict functional parity with the legacy ContosoUniversity Student module (no feature changes). Where details are not present in the planning docs, entries are marked “N/A”.

---

## 1) Endpoint Parity Map (ASP.NET Razor Pages → Express)

Source: Overview A “Key Endpoints/Features” and Phases Phase 1 Task 1.1.

| Legacy Razor Page              | Verb   | Target Express Route                                   | Controller/Handler            | Status Codes  | DTO Shape                                                                          |
| ------------------------------ | ------ | ------------------------------------------------------ | ----------------------------- | ------------- | ---------------------------------------------------------------------------------- |
| /Students (Index)              | GET    | /api/students?searchString=&sortOrder=&page=&pageSize= | `StudentController.getAll()`  | 200           | `{ data: Student[], total: number, page: number, pageSize: number }`               |
| /Students/Details/{id}         | GET    | /api/students/:id                                      | `StudentController.getById()` | 200, 404      | `Student & { Enrollments: { Course: { Title, Credits, DepartmentID }, Grade }[] }` |
| /Students/Create (submit)      | POST   | /api/students                                          | `StudentController.create()`  | 201, 400      | `{ FirstMidName: string; LastName: string; EnrollmentDate: string(yyyy-MM-dd) }`   |
| /Students/Edit/{id} (submit)   | PUT    | /api/students/:id                                      | `StudentController.update()`  | 200, 400, 404 | same as POST                                                                       |
| /Students/Delete/{id} (submit) | DELETE | /api/students/:id                                      | `StudentController.delete()`  | 204, 404, 409 | N/A                                                                                |

Notes (parity requirements):

- Pagination: default page size in legacy is 3 (appsettings); planning standardizes at 10 (see Overview E Config Map). Behavior must remain identical aside from documented default; page math must be correct.
- Search: case-insensitive contains on `LastName` and `FirstMidName` (legacy LINQ + SQL Server collation). In SQLite/Drizzle, use `LIKE` with `COLLATE NOCASE` or compare `lower(column)` to `lower(search)` to preserve parity.
- Sort: options exactly match legacy: LastName asc (default), LastName desc, EnrollmentDate asc, EnrollmentDate desc.
- Overposting protection: accept only `FirstMidName`, `LastName`, `EnrollmentDate` (see Overview A Student Create/Edit samples).
- Errors: 404 for missing ID; 400 for validation; 409 when FK constraints prevent delete due to Enrollments.

---

## 2) Data Parity (EF Core → Drizzle ORM/SQLite)

Sources: Overview A “Application Models”, Phases Phase 1 Task 1.2, Architecture 2.2.

### 2.1 EF Core Entities (legacy)

Student (excerpt; see Overview):

- `ID` (int, PK)
- `LastName` (required, `[StringLength(50)]`)
- `FirstMidName` (required, `[StringLength(50, MinimumLength=1)]`)
- `EnrollmentDate` (DateTime, date only for UI)
- Navigation: `ICollection<Enrollment>`

Relationships:

- Student 1—\* Enrollment
- Enrollment \*—1 Course

Validation (Data Annotations): Required, StringLength, DataType(Date).

### 2.2 Drizzle Schema (target)

Schema defined in TypeScript (tables and relations) with Drizzle ORM. Ensure parity with EF Core entities and relationships (Student ↔ Enrollment ↔ Course).

Parity checks:

- Types: match EF Core intent (ID int, strings, DateTime).
- Relations: Student→Enrollments, Enrollment→Course preserved.
- Indices: Legacy does not define an index on `LastName`; planning allows creating an index for performance. Functional parity does not require it. If created, must not change behavior.
- Case-insensitive search: enforce via `LIKE` + `COLLATE NOCASE` or `lower()` comparisons (SQLite behavior matches legacy intent).

SQLite notes:

- Enforce FK constraints; delete should return 409 when FK prevents removal (map underlying error to 409 conflict).
- Date precision acceptable (UI date format `yyyy-MM-dd` preserved at API boundary).

---

## 3) Frontend Parity (Razor Pages → React + Redux Toolkit)

Sources: Overview B Stack Equivalents, Phase 5, Architecture 4.1/4.2.

### 3.1 Routes and Components

| Legacy Page            | React Route          | Component(s)                                                                 | Notes                                        |
| ---------------------- | -------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| /Students              | /students            | `StudentListPage`, `SearchBar`, `SortDropdown`, `Pagination`, `StudentTable` | Bootstrap table/forms; preserve query params |
| /Students/Details/{id} | /students/:id        | `StudentDetailsPage`                                                         | Includes enrollments with course info        |
| /Students/Create       | /students/create     | `StudentCreatePage`, `StudentForm`                                           | Yup validation mirrors Zod                   |
| /Students/Edit/{id}    | /students/:id/edit   | `StudentEditPage`, `StudentForm`                                             | Preload data; same validation                |
| /Students/Delete/{id}  | /students/:id/delete | `StudentDeleteConfirm` (page or modal)                                       | Show FK error on failure                     |

Bootstrap parity:

- Use table, form-control, btn, alert classes consistently.
- Layout via shared `Layout` component (Architecture 4.1).

### 3.2 Redux Toolkit Slice (state parity)

State shape (from Overview Kickoff outline):

```ts
interface StudentsState {
  students: Student[];
  currentStudent: Student | null;
  loading: boolean;
  error: string | null;
  pagination: { total: number; page: number; pageSize: number };
  searchString: string;
  sortOrder: 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc';
}
```

Async thunks (names only; implementation later): `fetchStudents`, `fetchStudentById`, `createStudent`, `updateStudent`, `deleteStudent`.

View-model parity:

- Preserve query string across navigation (search/sort/page) using React Router search params.
- Form labels and error placements mirror legacy pages.

---

## 4) Auth Parity

Sources: Overview A “Current Authentication/Authorization” (None).

- Legacy Student pages are public. Therefore, Student API endpoints and React routes remain public.
- JWT: N/A for Student slice (no protected endpoints). No roles/claims required. Reference for broader auth in [../../Phases.md](../../Phases.md) Phase 4.

---

## 5) Test Mapping

Sources: Overview F “Testing Strategy”, Phases Phase 6.

Legacy tests: N/A (no existing .NET tests for Student). The following define the equivalent target tests (new) consistent with planning documents (no feature changes):

Backend (Mocha + Chai + Supertest):

- Service unit tests: pagination, search (case-insensitive), sort, CRUD happy/edge paths, FK delete conflict mapping to 409.
- Controller/integration tests: all five endpoints with status codes and DTO shape assertions.
- Validation tests: Zod schema mirrors Data Annotations (Required, StringLength, Date).

Frontend (Jest + RTL):

- Component tests: list renders with pagination; search and sort interactions; details page loads enrollments; create/edit forms validate and submit; delete confirm shows FK error.
- Redux slice tests: reducers and thunks (loading/error transitions, state updates).

Note: Assertions follow behavior defined in planning docs; there are no legacy assertions to mirror.

---

## 6) Diagrams (mermaid)

### 6.1 Request Flow (List + Create)

```mermaid
sequenceDiagram
  participant U as User
  participant R as React App
  participant RTK as Redux Thunks
  participant X as Express API
  participant SVC as StudentService
  participant DZ as Drizzle ORM
  participant DB as SQLite

  U->>R: Navigate /students
  R->>RTK: dispatch(fetchStudents)
  RTK->>X: GET /api/students?search&sort&page&pageSize
  X->>SVC: getAll(query)
  SVC->>DZ: db.select().from(students).where(...).orderBy(...).limit(...).offset(...)
  DZ->>DB: SELECT ...
  DB-->>DZ: rows
  DZ-->>SVC: data + count
  SVC-->>X: { data, total, page, pageSize }
  X-->>RTK: 200 JSON
  RTK-->>R: update state; render table

  U->>R: Submit create form
  R->>RTK: dispatch(createStudent)
  RTK->>X: POST /api/students { dto }
  X->>X: validate (Zod)
  X->>SVC: create(dto)
  SVC->>PR: student.create({ data })
  PR->>DB: INSERT
  DB-->>PR: new row
  PR-->>SVC: entity
  SVC-->>X: entity
  X-->>RTK: 201 JSON
  RTK-->>R: navigate /students
```

### 6.2 Data Relations

```mermaid
erDiagram
  Student ||--o{ Enrollment : has
  Course ||--o{ Enrollment : has

  Student {
    Int ID PK
    String LastName
    String FirstMidName
    DateTime EnrollmentDate
  }
  Enrollment {
    Int EnrollmentID PK
    Int CourseID FK
    Int StudentID FK
    String Grade?  "A/B/C/D/F or null"
  }
  Course {
    Int CourseID PK (manual)
    String Title
    Int Credits
    Int DepartmentID FK
  }
```

---

## 7) Inputs/Outputs & Docs-Only Task Breakdown (≤ 300 LOC/PR)

All tasks below are documentation-only and scoped to small, reviewable PRs.

1. Student Endpoint Parity Spec

- Goal: Finalize REST routes, verbs, status codes, and DTOs for Student.
- Inputs: This file; [../../Overview.md](../../Overview.md); [../../Phases.md](../../Phases.md).
- Outputs: Updated section 1 (if review feedback); add cross-links to Backend module doc (N/A if not present).
- Acceptance: Table reflects exact parity; reviewers sign-off.

2. Student Data Mapping Note

- Goal: Confirm EF→Drizzle parity and SQLite notes (case-insensitivity, FK behavior).
- Inputs: Section 2; [../../Architecture.md](../../Architecture.md) 2.2.
- Outputs: Minor edits or confirmation notes.
- Acceptance: Reviewer confirms no discrepancies.

3. React Routes and Components Outline

- Goal: Define exact Student routes, component names, and Bootstrap classes to use.
- Inputs: Section 3; [../../Architecture.md](../../Architecture.md) 4.1/4.2.
- Outputs: Component list + route table refined.
- Acceptance: Frontend lead sign-off.

4. Students Redux Slice State Contract

- Goal: Lock the state shape and thunk list.
- Inputs: Section 3.2; [../../Overview.md](../../Overview.md) Frontend.
- Outputs: Confirmed state interface and thunk names.
- Acceptance: QA agrees state supports test cases.

5. Test Plan Snippets (API)

- Goal: Draft Mocha+Chai test case list and expected assertions for Student endpoints.
- Inputs: Section 5; [../../Phases.md](../../Phases.md) Phase 6.
- Outputs: Checklists of tests per endpoint.
- Acceptance: Coverage >80% target documented.

6. Test Plan Snippets (UI)

- Goal: Draft Jest + RTL test case list for Student pages and flows.
- Inputs: Section 5; [../../Phases.md](../../Phases.md) Phase 6.
- Outputs: Checklist with behaviors to assert.
- Acceptance: Coverage >75% target documented.

7. Error Mapping Matrix

- Goal: Document mapping of DB/Drizzle errors to HTTP (404/400/409) for Student.
- Inputs: Sections 1–2; [../../Architecture.md](../../Architecture.md) 8.1.
- Outputs: Short matrix with examples.
- Acceptance: Backend lead sign-off.

8. Pagination/Search/Sort Semantics Note

- Goal: Lock semantics for empty search, page bounds, and default sort.
- Inputs: Sections 1; Overview A Student list behavior.
- Outputs: One-page note appended to this doc.
- Acceptance: Matches legacy behaviors exactly.

---

## 8) Acceptance Criteria (Slice-1 – Documentation)

- Endpoint parity table approved (backend lead).
- EF→Drizzle parity verified (data lead) with SQLite notes.
- React routes and components confirmed (frontend lead).
- Redux slice state and thunks agreed (frontend + QA).
- Test plan snippets approved (QA lead) for API and UI.
- Mermaid diagrams render and reflect flows/relations correctly.

---

## 9) Rollback Steps (Docs-only)

If any ambiguity or deviation from parity is discovered during review:

- Mark the section “Needs Clarification” and add an inline TODO.
- Reconcile with [../../Overview.md](../../Overview.md) and [../../Phases.md](../../Phases.md); if still unclear, mark “N/A” and reference the source.
- Do not proceed to implementation docs until parity is confirmed.

---

## 10) Risk Focus (from Risks.md; no new risks)

Applicable existing risks for this slice:

- R-005 Functional Parity Gaps – ensure behaviors (pagination/search/sort, validation, errors) match exactly. Mitigations: side-by-side checks; UAT.
- R-003 Performance Regression – list page must meet performance targets; consider optional index if needed (no behavior change).
- R-010 Testing Coverage Gaps – ensure planned tests cover CRUD, pagination, search, sort, FK conflict.
- R-001 Data Migration Integrity – verify Student and Enrollment data parity when seeding/migrating.

See [../../Risks.md](../../Risks.md) for details and owners.
