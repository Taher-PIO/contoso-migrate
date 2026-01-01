# Enrollments Module - Migration Kickoff

**Module**: Enrollments  
**Priority**: Medium  
**Complexity**: Low (data join with Grade)  
**Estimated Effort**: 4 hours (Docs-only; UI comes via Students)  
**Status**: Documentation Complete, Implementation Pending  
**Date**: January 1, 2026

---

## Executive Summary

The Enrollments module represents the many-to-many relationship between `Students` and `Courses` with an additional `Grade` field (nullable). The legacy app does not expose a dedicated UI for Enrollments; instead, enrollments are created/edited via Student pages. Migration targets strict parity: schema, relations, cascade behavior, and validation.

- Backend: Operates through Student/Course endpoints; no standalone Enrollment controller in legacy.
- Database: SQLite with Drizzle ORM mapping `EnrollmentID`, `CourseID`, `StudentID`, `Grade?` and FKs.
- Frontend: No separate pages; integrated in Student Create/Edit flows.
- Testing: Service and integration tests for create/update/delete via Student flows.

---

## Scope Statement

### In-Scope (Strict Parity Only)

- Data parity: `Enrollment` entity with `EnrollmentID` (PK), `CourseID` (FK), `StudentID` (FK), `Grade` (nullable enum).
- Backend parity: Enrollment operations occur via Student endpoints (create/edit student includes enrollment rows). If any direct enrollment API is missing in planning docs, mark as N/A.
- Cascade behavior: Deleting a `Course` removes related `Enrollments`; deleting a `Student` removes related `Enrollments`.
- Dummy data: Seed example enrollments after schema creation using Drizzle.

### Out-of-Scope

- Dedicated Enrollment UI or endpoints (legacy does not have them).
- Feature changes to grading, validations, or workflows.

---

## Dependencies

- Data entities: `Student`, `Course` (required), `Grade` enum (N/A if not explicitly defined in planning docs; see [Overview.md](../../Overview.md)).
- Backend endpoints: Student CRUD (used to create/edit enrollments). Courses CRUD (deletes cascade to enrollments).
- Auth constraints: N/A per current planning (see [Security-Implementation-Summary.md](../../Security-Implementation-Summary.md)).

---

## Acceptance Criteria

- Schema maps fields and relations exactly; cascade deletes mirror legacy behavior.
- Student flows can add/remove enrollments with `Grade` preserved.
- Dummy seed enrollments are inserted after students and courses exist.
- No standalone Enrollment pages or feature changes.

---

## Rollback Plan

- As enrollments are data-only and integrated via Student/Course features, rollback involves removing seed entries and reverting any docs-only changes. No API rollback is needed unless future direct endpoints are introduced.
