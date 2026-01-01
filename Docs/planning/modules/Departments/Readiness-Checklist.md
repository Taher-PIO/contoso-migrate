# Departments Module - Readiness Checklist

**Module**: Departments  
**Status**: Planning Complete, Implementation Pending  
**Date**: January 1, 2026

---

## 1. Pre-conditions

### Configuration & Setup

- ✅ **Database Connection**: SQLite connection is confirmed.
- ✅ **Seed Script**: The `drizzle/seed.ts` script is functional.

### Documentation & Planning

- ✅ **Kickoff Document**: [Kickoff.md](./Kickoff.md) is complete.
- ✅ **Slice Plan**: [Slice-Plan.md](./Slice-Plan.md) is complete.
- ✅ **Backlog**: Tasks for the Departments module are in [Backlog.md](../../Backlog.md).

### Parity Verification

- ✅ **EF→Drizzle Mapping**: The Drizzle schema for `departments` has been verified against the `Department.cs` model, including the `version` field for concurrency.
- ✅ **Route Table Confirmed**: The endpoint parity map, including the `409 Conflict` status code, is confirmed.

### Frontend Blueprint

- ✅ **Component Hierarchy**: The component structure is defined in the Slice Plan.
- ✅ **Redux State Contract**: The shape of the `departmentsSlice`, including a field for conflicting data, is defined.
- ✅ **Route Plan**: React Router routes are defined.

### Test Planning

- ✅ **Backend Test Cases**: Scenarios for optimistic concurrency are enumerated in the Slice Plan.
- ✅ **Frontend Test Cases**: Scenarios for handling `409 Conflict` errors in the UI are enumerated.

---

## 2. Risk Focus

- **[R-002: Concurrency Conflicts](../../Risks.md)**

  - **Focus**: Ensuring the optimistic concurrency flow is correctly implemented and user-friendly.
  - **Mitigation**: The backend already implements the version check. The frontend plan includes specific UI states for handling the `409 Conflict` error, providing a clear path for the user to resolve the conflict, which directly addresses this risk.

- **[R-004: Complex Business Logic](../../Risks.md)**
  - **Focus**: The logic preventing the deletion of a department with courses must be correctly replicated.
  - **Mitigation**: The backend service contains this check. The frontend plan includes displaying a specific error message for this case, ensuring parity with the legacy application's behavior.

---

## 3. Validation Steps & Evidence

### API Validation (Post-Implementation)

- `[ ]` **Evidence**: Provide the JSON response for a `PUT /api/departments/{id}` request with a stale `version` number.
  - **Check**: The API must return a `409 Conflict` status code, and the response body should contain the current state of the department from the database.
- `[ ]` **Evidence**: Provide the database record for a department after a successful `PUT` request.
  - **Check**: The `version` number in the database must be incremented by 1.
- `[ ]` **Evidence**: Provide the JSON response for a `DELETE /api/departments/{id}` request for a department that has associated courses.
  - **Check**: The API should return a `400 Bad Request` with an error message indicating that the department cannot be deleted.

### UI & Frontend Validation

- `[ ]` **Evidence**: A screen recording of the Edit Department page when a concurrency conflict occurs.
  - **Check**: The UI must display an alert. The form should show the user's attempted changes alongside the current values from the database. The user should have clear "Overwrite" and "Cancel" buttons.
- `[ ]` **Evidence**: Screenshot of the Create Department page.
  - **Check**: The "Administrator" field is a dropdown list populated with instructors.
- `[ ]` **Evidence**: Screenshot of the Delete Department page after attempting to delete a department with courses.
  - **Check**: A non-modal error message is displayed on the page, and the department is not deleted.

---

## 4. Sign-offs

| Role               | Name | Date | Status        |
| ------------------ | ---- | ---- | ------------- |
| **Backend Lead**   |      |      | `[ ]` Pending |
| **Frontend Lead**  |      |      | `[ ]` Pending |
| **Data Architect** |      |      | `[ ]` Pending |
| **QA Lead**        |      |      | `[ ]` Pending |
| **Product Owner**  |      |      | `[ ]` Pending |
