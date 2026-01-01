# About Module - Migration Kickoff

**Module**: About  
**Priority**: Medium  
**Complexity**: Low (static page with aggregated stats)  
**Estimated Effort**: 6 hours (docs-only planning; small backend + frontend)  
**Status**: Documentation Complete, Implementation Pending  
**Date**: January 1, 2026

---

## Executive Summary

The legacy About page presents aggregated statistics about Contoso University, specifically counts of students grouped by enrollment date.

- Legacy reference: `Pages/About.cshtml` and `Pages/About.cshtml.cs` using `SchoolViewModels/EnrollmentDateGroup.cs`.
- Target parity: Provide a public API that returns student counts grouped by enrollment date, and a React page that renders these stats with Bootstrap styling.

---

## Scope Statement

### In-Scope (Strict Parity)

- Display student counts grouped by enrollment date (same grouping semantics as legacy).
- Data source: Students and their enrollment dates; no additional metrics.
- Public access (no auth), matching legacy.

### Out-of-Scope

- Additional statistics beyond what the legacy About page shows.
- Search, filters, pagination, or drill-downs.

---

## Dependencies

- Backend endpoint/controller: N/A (no existing endpoint documented); About stats require a new read-only API. See [Architecture.md](../../Architecture.md) and [Overview.md](../../Overview.md). If unspecified in planning docs, treat as N/A and add backlog task.
- Views/pages: Legacy `About.cshtml` (static + stats list). Target: React page `/about` with Bootstrap.
- Data entities: `Student` (enrollment date); indirectly `Enrollment` if date is derived — use planning docs for truth. See [Overview.md](../../Overview.md).
- Auth constraints: Public (see [Security-Implementation-Summary.md](../../Security-Implementation-Summary.md)).

---

## Acceptance Criteria

- API returns an array of `{ enrollmentDate, count }` matching legacy grouping.
- React About page displays the grouped counts in a simple Bootstrap table.
- Public route; no JWT required.
- Evidence captured per Readiness Checklist (API JSON sample + UI screenshot).

---

## Rollback Plan

- If the new About API introduces issues, disable the `/about` route in the frontend and remove the stats fetch; API can be reverted without impacting core modules.
- No schema changes required; rollback limited to removing the About-specific code and docs.
