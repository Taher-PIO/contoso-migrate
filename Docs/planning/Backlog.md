# Backlog & Checklist (Docs-Only)

Version: 1.0  
Date: December 31, 2025  
Status: Active

Scope: Documentation-only backlog to guide small, reviewable PRs (≤ 300 LOC per PR). Grouped by modules as defined in planning. Use relative links and keep strict parity with legacy behavior.

References:

- [Overview.md](Overview.md)
- [Phases.md](Phases.md)
- [Architecture.md](Architecture.md)
- [Risks.md](Risks.md)

---

## Student (Module)

Links:

- [modules/Student/Kickoff.md](modules/Student/Kickoff.md)
- [modules/Student/Slice-Plan.md](modules/Student/Slice-Plan.md)
- [modules/Student/Readiness-Checklist.md](modules/Student/Readiness-Checklist.md)

### backend-contoso-api

1. Student Endpoint Parity Spec

- Goal: Finalize Student REST routes, verbs, status codes, DTOs.
- Inputs: [modules/Student/Slice-Plan.md](modules/Student/Slice-Plan.md) §1; [Overview.md](Overview.md); [Phases.md](Phases.md).
- Outputs: Updated Endpoint Parity section (minor edits only).
- Acceptance: Backend lead sign-off; parity table complete.

2. Error Mapping Matrix (Student)

- Goal: Map Drizzle/SQLite errors to HTTP 404/400/409 for Student.
- Inputs: Slice-Plan §§1–2; [Architecture.md](Architecture.md) §8.1.
- Outputs: Short matrix appended to Slice-Plan.
- Acceptance: Error cases reviewed; examples documented.

3. Pagination/Search/Sort Semantics Note

- Goal: Lock semantics for default sort, page bounds, and case-insensitive search.
- Inputs: Slice-Plan §1; [Overview.md](Overview.md) Student behaviors.
- Outputs: One-page note appended to Slice-Plan.
- Acceptance: Matches legacy behaviors; reviewers confirm.

### frontend-react

4. React Route Map (Student)

- Goal: Confirm React routes and navigation for Student pages.
- Inputs: Slice-Plan §3.1; [Architecture.md](Architecture.md) §4.1.
- Outputs: Route table embedded in Slice-Plan (updated if needed).
- Acceptance: Frontend lead sign-off.

5. Component Blueprint & Bootstrap Parity

- Goal: Confirm component list and Bootstrap classes to match legacy look-and-feel.
- Inputs: Slice-Plan §3.1; [Overview.md](Overview.md) UI notes.
- Outputs: Component blueprint list with class usage notes.
- Acceptance: Visual parity checklist approved by frontend lead.

6. Redux State Contract (Students)

- Goal: Confirm state shape and thunk names for studentsSlice.
- Inputs: Slice-Plan §3.2.
- Outputs: State interface and thunk list frozen.
- Acceptance: QA agrees test plan is supported.

### data-drizzle

7. EF→Drizzle Parity Verification (Student)

- Goal: Verify fields, relations, and SQLite notes for Student and related Enrollment/Course.
- Inputs: Slice-Plan §2; [Architecture.md](Architecture.md) §2.2.
- Outputs: Confirmation notes; gaps marked N/A if any.
- Acceptance: Data lead confirms parity.

8. Seed Data Mapping (Students)

- Goal: Map DbInitializer.cs Student data to Drizzle seed structure (doc-only).
- Inputs: [Overview.md](Overview.md) data seeding; legacy seed list.
- Outputs: Table of students with dates (doc-only evidence).
- Acceptance: QA confirms counts and examples.

### auth-jwt

9. Endpoint Access Review (Student)

- Goal: Confirm Student routes remain public; JWT N/A for this slice.
- Inputs: Slice-Plan §4; [Phases.md](Phases.md) Phase 4 overview.
- Outputs: Access note added to Slice-Plan.
- Acceptance: Security owner acknowledges no auth required.

### testing-strategy

10. Backend Test Plan Snippets (Student)

- Goal: List Mocha+Chai+Supertest tests with assertions for Student endpoints.
- Inputs: Slice-Plan §5; [Phases.md](Phases.md) Phase 6.
- Outputs: Checklist of tests appended to Slice-Plan.
- Acceptance: Coverage target noted (>80% for services/controllers).

11. Frontend Test Plan Snippets (Student)

- Goal: List Jest + RTL tests with assertions for Student pages and flows.
- Inputs: Slice-Plan §5; [Phases.md](Phases.md) Phase 6.
- Outputs: Checklist appended to Slice-Plan.
- Acceptance: Coverage target noted (>75% components/state).

12. E2E Scenario Outline (Student)

- Goal: Document E2E flow steps for Student (evidence-only).
- Inputs: Slice-Plan §5; [Architecture.md](Architecture.md) request flow.
- Outputs: Bullet list of steps and expected outcomes.
- Acceptance: QA lead sign-off.

---

## Courses Module

**Status**: Implementation Pending. See module documentation for details.

- **Kickoff**: [modules/Courses/Kickoff.md](./modules/Courses/Kickoff.md)
- **Slice Plan**: [modules/Courses/Slice-Plan.md](./modules/Courses/Slice-Plan.md)
- **Readiness**: [modules/Courses/Readiness-Checklist.md](./modules/Courses/Readiness-Checklist.md)

| Task ID      | Description                                      | Type     | Effort (hrs) | Status      | Acceptance Criteria                                                |
| ------------ | ------------------------------------------------ | -------- | ------------ | ----------- | ------------------------------------------------------------------ |
| **C-BE-1**   | Fix Title validation in `validation.ts`          | Backend  | 0.5          | `[ ]` To Do | API returns 400 for titles not between 3-50 chars.                 |
| **C-BE-2**   | Add tests for instructor assignment              | Backend  | 2            | `[ ]` To Do | `assignInstructor` and `removeInstructor` are fully tested.        |
| **C-BE-3**   | Add tests for cascade delete behavior            | Backend  | 1.5          | `[ ]` To Do | Deleting a course also deletes its enrollments.                    |
| **C-FE-1**   | Create `courseService.ts` and `coursesSlice.ts`  | Frontend | 2            | `[ ]` To Do | Redux state management for courses is in place.                    |
| **C-FE-2**   | Implement Course Index page                      | Frontend | 2            | `[ ]` To Do | Page lists all courses from the API; no pagination.                |
| **C-FE-3**   | Implement Course Create page                     | Frontend | 3            | `[ ]` To Do | Form allows manual `CourseID` entry and has a department dropdown. |
| **C-FE-4**   | Implement Course Edit page                       | Frontend | 2.5          | `[ ]` To Do | `CourseID` is displayed as read-only.                              |
| **C-FE-5**   | Implement Course Details & Delete pages          | Frontend | 2            | `[ ]` To Do | Details are displayed; delete shows confirmation.                  |
| **C-TEST-1** | Write Jest tests for all new frontend components | Testing  | 4            | `[ ]` To Do | Frontend test coverage for Courses is >75%.                        |
| **C-TEST-2** | Write E2E tests for Course CRUD flow             | Testing  | 3            | `[ ]` To Do | A user can create, view, edit, and delete a course.                |

---

## Departments Module

**Status**: Implementation Pending. See module documentation for details.

- **Kickoff**: [modules/Departments/Kickoff.md](./modules/Departments/Kickoff.md)
- **Slice Plan**: [modules/Departments/Slice-Plan.md](./modules/Departments/Slice-Plan.md)
- **Readiness**: [modules/Departments/Readiness-Checklist.md](./modules/Departments/Readiness-Checklist.md)

| Task ID      | Description                                                | Type     | Effort (hrs) | Status      | Acceptance Criteria                                                          |
| ------------ | ---------------------------------------------------------- | -------- | ------------ | ----------- | ---------------------------------------------------------------------------- |
| **D-BE-1**   | Add tests for optimistic concurrency                       | Backend  | 3            | `[ ]` To Do | API returns 409 on stale version for PUT/DELETE.                             |
| **D-FE-1**   | Create `departmentService.ts` and `departmentsSlice.ts`    | Frontend | 2            | `[ ]` To Do | Redux state management for departments is in place.                          |
| **D-FE-2**   | Implement Department Index, Details, Create pages          | Frontend | 4            | `[ ]` To Do | Basic CRUD pages are functional. Administrator dropdown is populated.        |
| **D-FE-3**   | Implement Department Edit page with concurrency handling   | Frontend | 5            | `[ ]` To Do | Page handles 409 conflict and allows user to resolve.                        |
| **D-FE-4**   | Implement Department Delete page with concurrency handling | Frontend | 4            | `[ ]` To Do | Page handles 409 conflict and prevents deletion of departments with courses. |
| **D-TEST-1** | Write Jest tests for frontend concurrency flow             | Testing  | 4            | `[ ]` To Do | Test the UI response to a 409 error.                                         |
| **D-TEST-2** | Write E2E tests for Department CRUD flow                   | Testing  | 3            | `[ ]` To Do | A user can create, view, edit, and delete a department.                      |

---

## Instructors Module

**Status**: Implementation Pending. See module documentation for details.

- **Kickoff**: [modules/Instructors/Kickoff.md](./modules/Instructors/Kickoff.md)
- **Slice Plan**: [modules/Instructors/Slice-Plan.md](./modules/Instructors/Slice-Plan.md)
- **Readiness**: [modules/Instructors/Readiness-Checklist.md](./modules/Instructors/Readiness-Checklist.md)

| Task ID      | Description                                               | Type     | Effort (hrs) | Status      | Acceptance Criteria                                                          |
| ------------ | --------------------------------------------------------- | -------- | ------------ | ----------- | ---------------------------------------------------------------------------- |
| **I-BE-1**   | Implement `GET /api/instructors/view` endpoint            | Backend  | 4            | `[ ]` To Do | Endpoint returns the `InstructorIndexData` view model based on query params. |
| **I-BE-2**   | Enhance `POST` and `PUT` endpoints for courses            | Backend  | 3            | `[ ]` To Do | API can create/update instructor with nested office and course assignments.  |
| **I-FE-1**   | Create `instructorService.ts` and `instructorsSlice.ts`   | Frontend | 2            | `[ ]` To Do | Redux state management for instructors is in place.                          |
| **I-FE-2**   | Implement Instructor Index page (3-panel view)            | Frontend | 8            | `[ ]` To Do | Page implements the master-detail-detail view.                               |
| **I-FE-3**   | Implement Instructor Create/Edit pages                    | Frontend | 4            | `[ ]` To Do | Forms include UI for office location and course assignment checkboxes.       |
| **I-FE-4**   | Implement Instructor Details & Delete pages               | Frontend | 2            | `[ ]` To Do | Standard details and confirmation pages are functional.                      |
| **I-TEST-1** | Write Jest tests for the interactive Index page           | Testing  | 5            | `[ ]` To Do | Test that panel selections correctly trigger state updates and API calls.    |
| **I-TEST-2** | Write E2E tests for Instructor CRUD and course assignment | Testing  | 4            | `[ ]` To Do | A user can create an instructor and assign them courses.                     |

---

## Notes

- All tasks are documentation-only; no scripts or code changes.
- Keep PRs ≤ 300 LOC, focused on a single topic.
- Use relative links and maintain consistency with planning documents.
- If any planning detail is missing, write “N/A” and reference the source doc.

---

## Enrollments Module

**Status**: Implementation Pending. See module documentation for details.

- **Kickoff**: [modules/Enrollments/Kickoff.md](./modules/Enrollments/Kickoff.md)
- **Slice Plan**: [modules/Enrollments/Slice-Plan.md](./modules/Enrollments/Slice-Plan.md)
- **Readiness**: [modules/Enrollments/Readiness-Checklist.md](./modules/Enrollments/Readiness-Checklist.md)

| Task ID      | Description                                              | Type     | Effort (hrs) | Status      | Acceptance Criteria                                                  |
| ------------ | -------------------------------------------------------- | -------- | ------------ | ----------- | -------------------------------------------------------------------- |
| **E-BE-1**   | Verify Student update handles enrollments                | Backend  | 1            | `[ ]` To Do | PUT `/api/students/{id}` persists enrollments create/remove/grade.   |
| **E-BE-2**   | Add cascade delete tests                                 | Backend  | 1.5          | `[ ]` To Do | Deleting a Course/Student removes related enrollments (DB verified). |
| **E-SEED-1** | Add dummy enrollments in Drizzle seed                    | Data     | 0.5          | `[ ]` To Do | Seed script inserts 3 sample enrollments after students/courses.     |
| **E-FE-1**   | Ensure Student Create/Edit includes enrollments in state | Frontend | 1.5          | `[ ]` To Do | Redux state mirrors enrollments and updates via thunks.              |
| **E-TEST-1** | Write Jest tests for Student enrollments flow            | Testing  | 2            | `[ ]` To Do | UI adds/removes enrollments and displays grade correctly.            |

---

## About Module

**Status**: Implementation Pending. See module documentation for details.

- **Kickoff**: [modules/About/Kickoff.md](./modules/About/Kickoff.md)
- **Slice Plan**: [modules/About/Slice-Plan.md](./modules/About/Slice-Plan.md)
- **Readiness**: [modules/About/Readiness-Checklist.md](./modules/About/Readiness-Checklist.md)

| Task ID      | Description                                      | Type     | Effort (hrs) | Status      | Acceptance Criteria                                                                                         |
| ------------ | ------------------------------------------------ | -------- | ------------ | ----------- | ----------------------------------------------------------------------------------------------------------- |
| **A-BE-1**   | Document public stats endpoint parity            | Backend  | 1            | `[ ]` To Do | `GET /api/about/stats` returns counts for Students, Courses, Instructors, Enrollments matching legacy page. |
| **A-BE-2**   | Edge cases and errors note                       | Backend  | 0.5          | `[ ]` To Do | Define behavior for empty DB (zero counts) and confirm 200 responses; N/A for auth.                         |
| **A-DATA-1** | SQLite aggregation verification steps            | Data     | 0.5          | `[ ]` To Do | Notes confirm grouping/COUNT queries align with Drizzle approach and are deterministic.                     |
| **A-FE-1**   | React About page route and Bootstrap layout plan | Frontend | 1            | `[ ]` To Do | Page displays four cards with counts and loads on mount; matches legacy look-and-feel.                      |
| **A-TEST-1** | Backend test plan outline for stats endpoint     | Testing  | 1            | `[ ]` To Do | Mocha+Chai+Supertest checklist covers success (non-zero and zero) and failure cases.                        |
| **A-TEST-2** | Frontend test plan outline for About page        | Testing  | 1            | `[ ]` To Do | Jest+RTL checklist covers initial load, render of counts, and error fallback.                               |
