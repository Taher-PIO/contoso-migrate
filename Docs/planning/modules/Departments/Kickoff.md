# Departments Module - Migration Kickoff

**Module**: Departments  
**Priority**: High  
**Complexity**: High (due to optimistic concurrency)  
**Estimated Effort**: 15 hours (Frontend implementation)  
**Status**: Documentation Complete, Implementation Pending  
**Date**: January 1, 2026

---

## Executive Summary

The Departments module manages the academic departments, their budgets, start dates, and administrators. This migration will replicate the legacy application's CRUD functionality with strict parity.

A critical feature of this module is the implementation of **optimistic concurrency control** using a `RowVersion` field (`version` in the target schema). This prevents users from inadvertently overwriting each other's changes. The backend API already supports this, but the frontend must be built to handle concurrency conflicts gracefully.

**Backend Status**: ✅ Complete - All CRUD endpoints, validation, and service layer with concurrency checks are implemented.  
**Frontend Status**: ❌ Not Started - React pages, Redux state, and Bootstrap UI must be created.  
**Critical Requirement**: The frontend must handle `409 Conflict` errors from the API and provide the user with options to resolve the conflict, matching the legacy application's behavior.

---

## Scope Statement

### In-Scope (Strict Parity Only)

#### Backend API (✅ Implemented)

- ✅ **GET /api/departments** - List all departments with administrator names.
- ✅ **GET /api/departments/:id** - Retrieve a single department.
- ✅ **POST /api/departments** - Create a new department.
- ✅ **PUT /api/departments/:id** - Update a department, including a `version` field in the request body to check for concurrency conflicts.
- ✅ **DELETE /api/departments/:id** - Delete a department, including a `version` field to prevent deleting a stale record.
- ✅ The API returns a `409 Conflict` status code if the `version` does not match.

#### Database Schema (✅ Implemented)

- ✅ Drizzle ORM schema for the `departments` table, including `DepartmentID` (auto-incrementing PK), `Name`, `Budget`, `StartDate`, `InstructorID` (nullable FK for Administrator), and `version` (for concurrency).
- ✅ Foreign key: `InstructorID` → `instructors.ID`.

#### Frontend React Pages (❌ Not Started)

- ❌ **Department Index**: List all departments.
- ❌ **Department Details**: Display department information.
- ❌ **Department Create**: Form with an instructor dropdown for the Administrator.
- ❌ **Department Edit**: Form that submits the `version` field and handles concurrency errors.
- ❌ **Department Delete**: Confirmation page that handles concurrency errors and displays a warning if courses are associated with the department.

#### Testing Coverage (⚠️ Partial)

- ✅ Backend service tests for basic CRUD.
- ❌ Backend tests for optimistic concurrency scenarios (`409 Conflict`).
- ❌ Frontend component, Redux, and E2E tests, especially for the concurrency conflict resolution flow.

### Out-of-Scope (No Feature Changes)

❌ Pagination, searching, or sorting on the department list (legacy uses pagination, but this is deferred for initial parity).  
❌ Hard delete of departments with associated courses (legacy prevents this).

---

## Dependencies

### From Planning Documentation

- **[Overview.md](../../Overview.md)**: Defines the Department entity and the optimistic concurrency requirement via `RowVersion`.
- **[Risks.md](../../Risks.md)**: References `R-002` (Concurrency Conflicts).
- **[Architecture.md](../../Architecture.md)**: Specifies the use of a version/timestamp field for concurrency control.

### Technical Dependencies

- **Backend**: The existing Express server, Drizzle ORM, and middleware are sufficient.
- **Frontend**: A `departmentService.ts` and `departmentsSlice.ts` will need to be created.

### Data Dependencies

- **Department → Instructor** (Many-to-One, Nullable): A department can have one Administrator (an Instructor). The `GET /api/instructors` endpoint is needed for the Administrator dropdown.
- **Department → Course** (One-to-Many): A department has many courses. Deleting a department with courses is prevented by the application logic.

---

## Legacy Behavior Reference

- **Optimistic Concurrency**: The legacy `Department.cs` model has a `[Timestamp]` attribute on a `RowVersion` property. On `Edit` and `Delete`, the `OnPostAsync` methods catch a `DbUpdateConcurrencyException`. The user is then shown an error message with the conflicting data and given the option to overwrite the changes or cancel.
- **Administrator Selection**: The Create and Edit pages use a dropdown list of instructors to select the department's Administrator.
- **Delete Prevention**: The `Delete.cshtml.cs` page model prevents the deletion of a department if it still has courses assigned to it, showing an error message instead.

---

## Acceptance Criteria

- **Backend**: The API must correctly return a `409 Conflict` when an update/delete is attempted with a stale `version` number.
- **Frontend**:
  - The Edit and Delete pages must correctly handle a `409 Conflict` response.
  - When a conflict occurs, the user must be shown the current database values, their pending changes, and be given the option to force the update or cancel.
  - The Create/Edit forms must have a dropdown populated with instructors for the Administrator field.
  - The Delete page must show a user-friendly error if the department has associated courses, preventing deletion.
- **Testing**: Test cases must explicitly cover the optimistic concurrency flow, including simulating a conflict and verifying the frontend's response.

---

## Rollback Plan

- **Reference**: [Phases.md](../../Phases.md) - Section: Rollback Strategy.
- **Procedure**: A rollback would involve removing the new Department pages, routes, and Redux slice from the frontend. The backend API is stable and would not require a rollback.
