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

## Notes

- All tasks are documentation-only; no scripts or code changes.
- Keep PRs ≤ 300 LOC, focused on a single topic.
- Use relative links and maintain consistency with planning documents.
- If any planning detail is missing, write “N/A” and reference the source doc.
