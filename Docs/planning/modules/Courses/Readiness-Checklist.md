# Courses Module - Readiness Checklist

**Module**: Courses  
**Status**: Planning Complete, Implementation Pending  
**Date**: January 1, 2026

---

## 1. Pre-conditions

All items must be checked and signed off before implementation work begins.

### Configuration & Setup

- ✅ **Config Keys**: All necessary environment variables are defined in `.env.example`. No new keys are needed for the Courses module. (Reference: [Architecture.md](../../Architecture.md))
- ✅ **Database Connection**: The SQLite connection string is configured and the `diagnose-connection.ts` utility confirms connectivity.
- ✅ **Seed Script**: The `drizzle/seed.ts` script is functional for existing modules (Students, Departments).

### Documentation & Planning

- ✅ **Kickoff Document**: [Kickoff.md](./Kickoff.md) is complete and approved.
- ✅ **Slice Plan**: [Slice-Plan.md](./Slice-Plan.md) is complete and approved.
- ✅ **Backlog**: Implementation tasks for the Courses module are created in [Backlog.md](../../Backlog.md).

### Parity Verification

- ✅ **EF→Drizzle Mapping**: The Drizzle schema in `contoso/src/db/schema.ts` has been verified against the legacy `Course.cs` model, including the manual `CourseID` primary key and all relationships.
- ✅ **Route Table Confirmed**: The endpoint parity map in the Slice Plan accurately reflects the legacy routes and the target Express routes.
- ⚠️ **Validation Rules**: A discrepancy in Title validation (`min: 3, max: 50` vs. `min: 1, max: 100`) has been identified. A task to fix this is in the backlog.

### Frontend Blueprint

- ✅ **Component Hierarchy**: The component structure (Index, Details, Create, Edit, Delete pages) is defined in the Slice Plan.
- ✅ **Redux State Contract**: The shape of the `coursesSlice` is defined in the Slice Plan.
- ✅ **Route Plan**: The React Router routes (`/courses`, `/courses/:id`, etc.) are defined.

### Test Planning

- ✅ **Backend Test Cases**: Test scenarios for the service and controller layers are enumerated in the Slice Plan.
- ✅ **Frontend Test Cases**: Test scenarios for components, Redux, and user flows are enumerated in the Slice Plan.

---

## 2. Risk Focus

This section references existing risks from the project's risk register. No new risks are introduced by this plan.

- **[R-001: Data Migration Integrity](../../Risks.md)**

  - **Focus**: Ensuring `CourseID` uniqueness.
  - **Mitigation**: The target backend includes an application-level check for duplicate `CourseID`s on creation, which is an improvement over the legacy system. The seed script must use unique IDs.

- **[R-003: Performance Regression](../../Risks.md)**

  - **Focus**: The course list loads all courses at once, which could be slow with a large dataset.
  - **Mitigation**: This matches the legacy behavior. The current dataset is small, so the risk is low. Pagination is out of scope for this parity-focused migration.

- **[R-005: Functional Parity Gaps](../../Risks.md)**
  - **Focus**: Discrepancies in business logic between legacy and target.
  - **Mitigation**: The Title validation discrepancy has been identified and a task to fix it is in the backlog. All other known logic (manual `CourseID`, immutable `CourseID` on edit, cascade deletes) has been replicated.

---

## 3. Validation Steps & Evidence

This checklist will be used to validate the implementation once it is complete.

### API Validation (Post-Implementation)

- `[ ]` **Evidence**: Provide JSON response for `GET /api/courses`.
  - **Check**: All seeded courses are returned. Department data is included.
- `[ ]` **Evidence**: Provide JSON response for `POST /api/courses` with a duplicate `CourseID`.
  - **Check**: A `400 Bad Request` is returned with a "duplicate ID" error message.
- `[ ]` **Evidence**: Provide JSON response for `POST /api/courses` with a Title of "A".
  - **Check**: After the validation fix, a `400 Bad Request` is returned with a "minimum length" error.
- `[ ]` **Evidence**: Provide JSON response for `PUT /api/courses/{id}` attempting to change the `CourseID`.
  - **Check**: The `CourseID` remains unchanged in the response.

### Behavior Validation

- `[ ]` **Evidence**: Screenshot of the database `Enrollments` table before and after deleting a Course.
  - **Check**: Verify that enrollments associated with the deleted course are removed (cascade delete).
- `[ ]` **Evidence**: Screenshot of the database `Courses` table before and after deleting a Department.
  - **Check**: Verify that courses associated with the deleted department are removed (cascade delete).

### UI & Frontend Validation

- `[ ]` **Evidence**: Screenshot of the Create Course page.
  - **Check**: The `CourseID` field is an editable manual input. The Department dropdown is populated and sorted by name.
- `[ ]` **Evidence**: Screenshot of the Edit Course page.
  - **Check**: The `CourseID` field is displayed but is read-only/disabled.
- `[ ]` **Evidence**: Screenshot of the Course Index page.
  - **Check**: The layout matches the legacy application, and department names are displayed correctly. No pagination controls are visible.

---

## 4. Sign-offs

This section must be completed before merging the implementation to the main branch.

| Role               | Name | Date | Status        |
| ------------------ | ---- | ---- | ------------- |
| **Backend Lead**   |      |      | `[ ]` Pending |
| **Frontend Lead**  |      |      | `[ ]` Pending |
| **Data Architect** |      |      | `[ ]` Pending |
| **QA Lead**        |      |      | `[ ]` Pending |
| **Product Owner**  |      |      | `[ ]` Pending |
