# Instructors Module - Readiness Checklist

**Module**: Instructors  
**Status**: Planning Complete, Implementation Pending  
**Date**: January 1, 2026

---

## 1. Pre-conditions

### Configuration & Setup

- ✅ **Database Connection**: SQLite connection is confirmed.
- ✅ **Seed Script**: The `drizzle/seed.ts` script is functional and can be extended for instructors.

### Documentation & Planning

- ✅ **Kickoff Document**: [Kickoff.md](./Kickoff.md) is complete.
- ✅ **Slice Plan**: [Slice-Plan.md](./Slice-Plan.md) is complete.
- ✅ **Backlog**: Tasks for the Instructors module are in [Backlog.md](../../Backlog.md).

### Parity Verification

- ✅ **EF→Drizzle Mapping**: The Drizzle schemas for `instructors`, `officeAssignments`, and `courseInstructors` have been verified against the legacy models.
- ✅ **Route Table Confirmed**: The endpoint parity map, including the new `/api/instructors/view` endpoint, is confirmed.

### Frontend Blueprint

- ✅ **Component Hierarchy**: The complex 3-panel `InstructorIndexPage` and the standard CRUD components are defined.
- ✅ **Redux State Contract**: The shape of the `instructorsSlice`, including the nested `indexState`, is defined.
- ✅ **Route Plan**: React Router routes are defined.

### Test Planning

- ✅ **Backend Test Cases**: Scenarios for the `/api/instructors/view` endpoint are enumerated.
- ✅ **Frontend Test Cases**: Scenarios for the interactive Index page are enumerated.

---

## 2. Risk Focus

- **[R-004: Complex Business Logic](../../Risks.md)**

  - **Focus**: The data aggregation for the `InstructorIndexData` view model is complex and could lead to performance issues or incorrect data.
  - **Mitigation**: A dedicated backend endpoint (`/api/instructors/view`) will be created to handle this logic, encapsulating the complexity. The queries will be optimized with `drizzle-orm` to be as efficient as possible.

- **[R-006: UI/UX Fidelity Gaps](../../Risks.md)**
  - **Focus**: The 3-panel master-detail-detail UI on the Index page is a significant departure from standard list views and may be difficult to replicate perfectly.
  - **Mitigation**: The Slice Plan includes a detailed component blueprint and state management strategy for the Index page. E2E tests will be critical to validate the interactive behavior.

---

## 3. Validation Steps & Evidence

### API Validation (Post-Implementation)

- `[ ]` **Evidence**: Provide the JSON response for `GET /api/instructors/view`.
  - **Check**: The response contains a list of all instructors, but `courses` and `enrollments` are empty.
- `[ ]` **Evidence**: Provide the JSON response for `GET /api/instructors/view?id={id}`.
  - **Check**: The response contains all instructors, the courses for the selected instructor, and an empty `enrollments` array.
- `[ ]` **Evidence**: Provide the JSON response for `GET /api/instructors/view?id={id}&courseID={courseID}`.
  - **Check**: The response contains all three collections: instructors, courses for the selected instructor, and enrollments for the selected course.
- `[ ]` **Evidence**: Provide the JSON response for `POST /api/instructors` with a nested office assignment and an array of course IDs.
  - **Check**: The new instructor, their office assignment, and the `courseInstructors` join table records are all created correctly in the database.

### UI & Frontend Validation

- `[ ]` **Evidence**: A screen recording of the Instructor Index page.
  - **Check**: Clicking an instructor highlights them and loads their courses in the second panel. Clicking a course highlights it and loads enrollments in the third panel. The URL should update with the selected IDs.
- `[ ]` **Evidence**: Screenshot of the Instructor Edit page.
  - **Check**: A list of checkboxes for all courses is displayed, with the instructor's currently assigned courses checked.
- `[ ]` **Evidence**: A screen recording of updating an instructor's course assignments.
  - **Check**: Checking/unchecking courses and saving correctly updates the instructor's course list on the Index page.

---

## 4. Sign-offs

| Role               | Name | Date | Status        |
| ------------------ | ---- | ---- | ------------- |
| **Backend Lead**   |      |      | `[ ]` Pending |
| **Frontend Lead**  |      |      | `[ ]` Pending |
| **Data Architect** |      |      | `[ ]` Pending |
| **QA Lead**        |      |      | `[ ]` Pending |
| **Product Owner**  |      |      | `[ ]` Pending |
