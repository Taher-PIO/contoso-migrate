# Enrollments Module - Readiness Checklist

**Module**: Enrollments  
**Status**: Planning Complete, Implementation Pending  
**Date**: January 1, 2026

---

## 1. Pre-conditions

### Configuration & Setup

- ✅ SQLite connection verified; Drizzle configured.
- ✅ Seed order: Students → Courses → Enrollments planned.

### Documentation

- ✅ Kickoff: [Kickoff.md](./Kickoff.md) approved.
- ✅ Slice Plan: [Slice-Plan.md](./Slice-Plan.md) approved.
- ✅ Backlog: Enrollments tasks appended in [Backlog.md](../../Backlog.md).

### Parity Verification

- ✅ EF→Drizzle mapping checked: fields (`EnrollmentID`, `CourseID`, `StudentID`, `Grade?`), FKs, cascade deletes.
- ✅ Route behavior confirmed: Enrollment operations occur via Student endpoints; direct endpoints marked **N/A**.

### Frontend Blueprint

- ✅ Student pages include enrollments in state/viewmodels.
- ✅ No dedicated Enrollment components required.

### Test Planning

- ✅ Backend tests: add/remove/cascade via Student flows.
- ✅ Frontend tests: Student create/edit reflect enrollments.

---

## 2. Risk Focus (references only)

- **[R-001: Data Migration Integrity](../../Risks.md)**: Ensure FKs valid; seed order enforced.
- **[R-003: Performance Regression](../../Risks.md)**: Enrollment lookups acceptable; no extra endpoints.
- **[R-005: Functional Parity Gaps](../../Risks.md)**: No new features; keep behavior identical.

---

## 3. Validation Steps & Evidence

### API Evidence

- `[ ]` PUT /api/students/{id} with new enrollment returns updated student with enrollments.
- `[ ]` PUT /api/students/{id} removing an enrollment reflects removal.
- `[ ]` DELETE /api/courses/{id} removes related enrollments (cascade) verified by DB query.
- `[ ]` DELETE /api/students/{id} removes related enrollments (cascade) verified by DB query.

### Data Evidence

- `[ ]` Screenshot/JSON of enrollments table after seeding.
- `[ ]` FK constraints validated (no orphan rows).

### UI Evidence

- `[ ]` Student Edit form shows enrollments; saving updates list.

---

## 4. Sign-offs

| Role               | Name | Date | Status        |
| ------------------ | ---- | ---- | ------------- |
| **Backend Lead**   |      |      | `[ ]` Pending |
| **Frontend Lead**  |      |      | `[ ]` Pending |
| **Data Architect** |      |      | `[ ]` Pending |
| **QA Lead**        |      |      | `[ ]` Pending |
| **Product Owner**  |      |      | `[ ]` Pending |
