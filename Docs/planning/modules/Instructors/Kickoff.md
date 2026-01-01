# Instructors Module - Migration Kickoff

**Module**: Instructors  
**Priority**: High  
**Complexity**: High (due to the complex Index page UI)  
**Estimated Effort**: 18 hours (Frontend implementation)  
**Status**: Documentation Complete, Implementation Pending  
**Date**: January 1, 2026

---

## Executive Summary

The Instructors module manages instructor records, their office assignments, and the courses they teach. This migration is particularly complex due to the unique user interface on the legacy Index page, which presents a master-detail-detail view for instructors, their courses, and the students enrolled in those courses.

**Backend Status**: ⚠️ Partial - Basic CRUD endpoints for instructors exist, but they do not support the complex data fetching required for the Index page view model (`InstructorIndexData`). Endpoints for managing course assignments also need to be verified.  
**Frontend Status**: ❌ Not Started - All React pages, including the complex Index page and the course assignment UI, must be built from scratch.  
**Critical Requirement**: The frontend Index page must replicate the legacy master-detail-detail view, allowing a user to select an instructor to see their courses, and then select a course to see the enrolled students.

---

## Scope Statement

### In-Scope (Strict Parity Only)

#### Backend API (⚠️ Partial)

- ✅ **GET /api/instructors** - Basic list of all instructors.
- ⚠️ **GET /api/instructors?id={id}&courseID={courseID}** - A new or modified endpoint is required to fetch the complex `InstructorIndexData` view model, including an instructor's courses and a course's enrollments.
- ✅ **GET /api/instructors/:id** - Retrieve a single instructor.
- ✅ **POST /api/instructors** - Create a new instructor, including their office assignment and course assignments.
- ✅ **PUT /api/instructors/:id** - Update an instructor, their office, and courses.
- ✅ **DELETE /api/instructors/:id** - Delete an instructor.

#### Database Schema (✅ Implemented)

- ✅ Drizzle ORM schema for `instructors`, `officeAssignments` (one-to-one), and `courseInstructors` (many-to-many join table).

#### Frontend React Pages (❌ Not Started)

- ❌ **Instructor Index**: A three-panel layout showing a list of instructors, a list of the selected instructor's courses, and a list of the selected course's enrolled students.
- ❌ **Instructor Details, Create, Edit, Delete**: Standard CRUD pages.
- ❌ **Course Assignment UI**: The Create and Edit pages must feature a multi-select checkbox list to manage an instructor's course assignments, replicating the logic from `InstructorCoursesPageModel.cs`.

#### Testing Coverage (❌ Not Started)

- ❌ Backend tests for the complex Index page data fetching logic.
- ❌ Frontend tests for the three-panel Index page, ensuring selections correctly update the other panels.
- ❌ E2E tests for the full instructor lifecycle, including course assignments.

### Out-of-Scope (No Feature Changes)

❌ Any deviation from the master-detail-detail view on the Index page.  
❌ Changes to the one-to-one relationship between Instructor and Office Assignment.

---

## Dependencies

### From Planning Documentation

- **[Overview.md](../../Overview.md)**: Defines the `Instructor`, `OfficeAssignment`, and `Course` relationships.
- **[Risks.md](../../Risks.md)**: References `R-004` (Complex Business Logic) due to the `InstructorIndexData` view model and the course assignment logic.

### Technical Dependencies

- **Backend**: The existing `instructorService.ts` needs to be enhanced to support the complex data fetching for the Index page.
- **Frontend**: An `instructorService.ts` and `instructorsSlice.ts` will need to be created.

### Data Dependencies

- **Instructor ↔ Course** (Many-to-Many): Managed via the `courseInstructors` join table. The UI for this is a key feature of the module.
- **Instructor ↔ OfficeAssignment** (One-to-One): An instructor can have one office assignment. This is managed within the Instructor's create/edit forms.
- **Course → Enrollment** (One-to-Many): The Index page requires fetching enrollments for a selected course.

---

## Legacy Behavior Reference

- **Complex Index View**: The `Pages/Instructors/Index.cshtml.cs` uses a custom view model, `InstructorIndexData`, which holds three collections: `Instructors`, `Courses`, and `Enrollments`. The `OnGetAsync` method takes optional `id` and `courseID` route parameters. When an instructor is selected (`id` is present), their courses are loaded. When a course is selected (`courseID` is present), its enrollments are loaded.
- **Course Assignments**: The `Edit.cshtml.cs` for Instructors uses a helper model, `AssignedCourseData`, to render a list of checkboxes for all available courses, with the currently assigned ones checked. The `OnPostAsync` method then updates the many-to-many relationship based on the selected checkboxes.

---

## Acceptance Criteria

- **Backend**: The API must provide an efficient way to query the data needed for the complex Index page view.
- **Frontend**:
  - The Instructor Index page must feature the three-panel master-detail-detail layout.
  - Clicking an instructor in the first panel must load their courses into the second panel.
  - Clicking a course in the second panel must load its enrolled students into the third panel.
  - The Create and Edit pages must include a functional multi-select checkbox UI for assigning courses to an instructor.
- **Testing**: E2E tests must validate the interactive functionality of the Index page.

---

## Rollback Plan

- **Procedure**: A rollback would involve removing the new Instructor pages, routes, and Redux slice from the frontend. Any new backend endpoints or modifications to existing ones would be reverted.
