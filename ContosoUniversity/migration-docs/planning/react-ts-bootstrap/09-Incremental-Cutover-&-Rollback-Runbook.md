---
title: 'Incremental Cutover & Rollback Runbook - React/TypeScript/Bootstrap Migration'
last_updated: '2025-12-30'
owner: 'Migration Team Lead'
status: 'Draft'
version: '1.0'
application: 'ContosoUniversity'
migration_phase: 'Planning'
related_docs: ['Operational-Runbook.md', 'Observability-Playbook.md', 'CI-CD-&-DevEx.md']
---

# Incremental Cutover & Rollback Runbook

## Executive Summary

This runbook defines the incremental cutover strategy for migrating ContosoUniversity from ASP.NET Core Razor Pages to a React/TypeScript/Bootstrap frontend. The approach prioritizes **zero-downtime migration** through feature-flag-based coexistence, canary deployments, and comprehensive rollback mechanisms.

**Migration Strategy:** Strangler Fig Pattern  
**Coexistence Model:** Dual UI with per-route feature flags  
**Rollout Approach:** Phased canary deployment (1% → 10% → 50% → 100%)  
**Target Completion:** TBD based on validation metrics

### Key Principles

- **No Big Bang:** Incremental, route-by-route migration
- **Safety First:** Instant rollback capability at all times
- **Data Driven:** Metrics-based go/no-go decisions
- **User Centric:** Transparent experience with opt-in/opt-out options
- **Reversible:** Full rollback to legacy UI within minutes

---

## Table of Contents

- [Coexistence Architecture](#coexistence-architecture)
- [Feature Flag Strategy](#feature-flag-strategy)
- [Canary Rollout Plan](#canary-rollout-plan)
- [Stepwise Cutover Checklist](#stepwise-cutover-checklist)
- [Rollback Strategy](#rollback-strategy)
- [Metrics & Success Criteria](#metrics--success-criteria)
- [Monitoring Dashboards](#monitoring-dashboards)
- [Alerting Configuration](#alerting-configuration)
- [Communication Plan](#communication-plan)
- [Guardrails & Safety Mechanisms](#guardrails--safety-mechanisms)
- [Runbook Procedures](#runbook-procedures)

---

## Coexistence Architecture

### Dual UI Strategy

The migration employs a **strangler fig pattern** where new React components gradually replace legacy Razor Pages while maintaining full backward compatibility.

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     User Browser                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Application Gateway / Load Balancer                 │
│                    (Route-based traffic steering)                    │
└────────────────┬─────────────────────────────┬──────────────────────┘
                 │                             │
    ┌────────────▼──────────┐     ┌───────────▼──────────────┐
    │  Legacy UI (Razor)    │     │  New UI (React/TS)       │
    │  /Students (legacy)   │     │  /Students (new)         │
    │  /Courses (legacy)    │     │  /api/* (REST endpoints) │
    │  /Instructors (legacy)│     │  /Courses (new)          │
    └────────────┬──────────┘     └───────────┬──────────────┘
                 │                            │
                 └──────────┬─────────────────┘
                            │
                            ▼
                ┌───────────────────────────┐
                │  Feature Flag Service     │
                │  (LaunchDarkly/Unleash)   │
                │  - Route enablement       │
                │  - User cohort targeting  │
                │  - Switch                 │
                └───────────┬───────────────┘
                            │
                            ▼
                ┌───────────────────────────┐
                │  Shared Backend Services  │
                │  - ASP.NET Core API       │
                │  - EF Core / SQL Server   │
                │  - Authentication         │
                └───────────────────────────┘
```

### Routing Strategy

| Route Pattern | Week 1-2 | Week 3-4 | Week 5-6 | Week 7+ |
|--------------|----------|----------|----------|---------|
| `/Students/*` | 100% Legacy | 10% New | 50% New | 100% New |
| `/Courses/*` | 100% Legacy | 100% Legacy | 10% New | 50% New |
| `/Instructors/*` | 100% Legacy | 100% Legacy | 100% Legacy | 10% New |
| `/Departments/*` | 100% Legacy | 100% Legacy | 100% Legacy | 100% Legacy |

### Request Flow

1. **User navigates to route**
2. **Feature flag evaluated:** Check user cohort, route enablement, global switch
3. **Route decision:** Serve React SPA or legacy Razor Page
4. **API calls:** Both UIs use same backend API endpoints
5. **Session continuity:** Maintain state across UI switches

### State Management

**Shared Session State:**
- ASP.NET Core session cookies
- Authentication tokens
- User preferences in database

**UI-Specific State:**
- React: Redux/Context for client-side state
- Razor: Server-side ViewData/TempData

---

## Feature Flag Strategy

### Feature Flag Service

**Recommended Tools:**
- **LaunchDarkly** (SaaS, enterprise-grade)
- **Unleash** (open-source, self-hosted)
- **Azure App Configuration** (Azure-native)

**Selected Solution:** LaunchDarkly

### Flag Hierarchy

#### 1. Global Switch

**Flag:** `global.react-ui.enabled`  
**Type:** Boolean  
**Default:** `false`  
**Purpose:** Instant rollback of all React UI features

#### 2. Route-Level Flags

**Flag Pattern:** `route.<entity>.new-ui.enabled`

| Flag Name | Entity | Initial State | Rollout Week |
|-----------|--------|--------------|-------------|
| `route.students.new-ui.enabled` | Students | `false` | Week 1 |
| `route.courses.new-ui.enabled` | Courses | `false` | Week 3 |
| `route.instructors.new-ui.enabled` | Instructors | `false` | Week 5 |
| `route.departments.new-ui.enabled` | Departments | `false` | Week 7 |

#### 3. User Cohort Targeting

**Segments:**

| Segment Name | Size | Criteria | Purpose |
|-------------|------|----------|---------|
| `internal-users` | ~20 users | Email domain check | Early alpha testing |
| `beta-testers` | ~50 users | Opted-in | Opt-in beta program |
| `canary-1pct` | ~1% | Random hash | Initial canary |
| `canary-10pct` | ~10% | Random hash | Expanded canary |
| `canary-50pct` | ~50% | Random hash | Majority rollout |
| `all-users` | 100% | Default | Full release |

---

## Canary Rollout Plan

### Phase 0: Pre-Production Validation

**Timeline:** Week -2 to Week 0  
**Environment:** Development & Staging  
**Audience:** Internal team (20 users)

**Activities:**
- [ ] Deploy React UI to staging environment
- [ ] Enable all route flags for internal users
- [ ] Conduct manual testing of all workflows
- [ ] Performance baseline measurement
- [ ] Security validation (OWASP Top 10)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Browser compatibility testing

**Go/No-Go Criteria:**
- ✅ Zero critical bugs (P0)
- ✅ < 5 major bugs (P1)
- ✅ Performance within 10% of legacy baseline
- ✅ 100% feature parity with legacy UI
- ✅ All security vulnerabilities resolved
- ✅ Rollback tested successfully

---

### Phase 1: Internal Canary (1% Production Traffic)

**Timeline:** Week 1 (7 days)  
**Audience:** Internal users + random 1% of production users

**Monitoring (24/7):**
- Error rate: < 0.5%
- P95 latency: < 500ms
- API success rate: > 99.5%

**Decision Point (Day 7):**
- ✅ **Proceed to Phase 2** if all metrics green
- ⚠️ **Extend Phase 1** if minor issues detected
- ❌ **Rollback** if critical issues detected

---

### Phase 2: Extended Canary (10% Production Traffic)

**Timeline:** Week 2-3 (14 days)  
**Audience:** Beta testers + random 10%

**Monitoring:**
- Error rate: < 0.3%
- P95 latency: < 400ms
- User satisfaction: NPS ≥ 40

---

### Phase 3: Majority Rollout (50% Production Traffic)

**Timeline:** Week 4-5 (14 days)  
**Audience:** Random 50% of users

**Monitoring:**
- Full observability stack active
- Automated alerting for anomalies
- Database performance tuning

---

### Phase 4: Full Rollout (100% Production Traffic)

**Timeline:** Week 6+  
**Audience:** All users

**Final Validation:**
- [ ] Monitor for 48 hours post-rollout
- [ ] Verify no increase in support tickets
- [ ] Collect user feedback via NPS survey
- [ ] Document lessons learned

**Legacy UI Sunset:**
- Keep legacy UI accessible for 30 days (opt-out)
- Remove legacy code after 90 days of stable operation

---

## Stepwise Cutover Checklist

### Pre-Cutover Checklist (1 Week Before)

**Infrastructure:**
- [ ] React application deployed to staging
- [ ] Feature flag service configured
- [ ] Monitoring dashboards created
- [ ] Alerting rules configured
- [ ] Load balancer rules configured
- [ ] CDN configured for static assets

**Code & Configuration:**
- [ ] Feature flags implemented in codebase
- [ ] Fallback logic tested
- [ ] Session continuity validated
- [ ] Error boundaries configured
- [ ] Logging instrumented

**Testing:**
- [ ] End-to-end tests passing
- [ ] Performance tests passing
- [ ] Security scans completed
- [ ] Accessibility tests passing
- [ ] Browser compatibility validated

**Rollback Readiness:**
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging
- [ ] Switch tested
- [ ] Database backup taken

---

### Cutover Day Checklist (Phase 1 - 1% Canary)

**T-24 Hours:**
- [ ] Send pre-announcement email
- [ ] Verify on-call engineer assigned
- [ ] Confirm monitoring dashboards accessible

**T-2 Hours:**
- [ ] Create incident channel
- [ ] Assemble cutover team
- [ ] Take database backup

**T-0 (Cutover Start):**
- [ ] **09:00 AM:** Enable feature flag for 1% cohort
- [ ] **09:05 AM:** Monitor error rate dashboard
- [ ] **09:10 AM:** Check Application Insights
- [ ] **09:15 AM:** Validate sample user session
- [ ] **09:30 AM:** Review metrics

**T+1 Hour:**
- [ ] First hourly checkpoint
- [ ] Metrics within acceptable range
- [ ] Decision: Continue / Rollback

---

## Rollback Strategy

### Rollback Decision Criteria

#### Automatic Rollback Triggers

**Critical Alerts:**
- Error rate > 5% for 5 consecutive minutes
- P95 latency > 2 seconds for 10 consecutive minutes
- API success rate < 95% for 5 consecutive minutes
- Database connection pool exhaustion
- Memory leak detected (heap growth > 20%/hour)

#### Manual Rollback Triggers

**Warning Signals:**
- Error rate increase of 2-5% sustained for 30 minutes
- User complaints > 10 in first hour
- Support ticket volume increase > 50%
- Performance degradation 20-30% vs baseline

**Escalation Path:**
1. On-call engineer detects issue
2. Notify team lead via PagerDuty
3. Assemble incident response team
4. Evaluate severity (5-minute decision window)
5. Execute rollback if consensus reached

---

### Rollback Execution Procedures

#### Option 1: Feature Flag Rollback (Fastest)

**Scenario:** React UI has issues  
**Downtime:** ~30 seconds  
**RTO:** < 1 minute  
**RPO:** 0 (no data loss)

**Procedure:**

1. **Disable Global Switch:**
   ```bash
   launchdarkly-cli update-flag      --project contoso-university      --environment production      --flag global.react-ui.enabled      --enabled false
   ```

2. **Validate Rollback:**
   ```bash
   curl -I https://contoso-uni.azurewebsites.net/Students
   ```

3. **Monitor for 15 Minutes**

4. **Communication:** Send incident notification

---

#### Option 2: Route-Specific Rollback

**Scenario:** Issues isolated to specific route  
**Downtime:** ~30 seconds

**Procedure:** Disable specific route flag only

---

#### Option 3: Application Deployment Rollback

**Scenario:** Backend API changes caused issues  
**Downtime:** ~5-10 minutes  
**RTO:** < 10 minutes

**Procedure:** Slot swap rollback (Azure App Service)

---

### Post-Rollback Actions

**Immediate (Within 1 Hour):**
- [ ] Send incident notification
- [ ] Update status page
- [ ] Create post-mortem ticket
- [ ] Preserve logs and metrics

**Short-Term (Within 24 Hours):**
- [ ] Conduct post-mortem meeting
- [ ] Identify root cause
- [ ] Create action items for fixes

---

## Metrics & Success Criteria

### Golden Signals (Monitored 24/7)

| Metric | Baseline | Target | Alert Threshold |
|--------|----------|--------|-----------------|
| **Error Rate** | 0.1% | < 0.3% | > 0.5% |
| **P95 Latency** | 300ms | < 400ms | > 500ms |
| **P99 Latency** | 800ms | < 1000ms | > 2000ms |
| **Availability** | 99.9% | > 99.9% | < 99.5% |

### Application Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Time to Interactive** | < 3s | Lighthouse / RUM |
| **First Contentful Paint** | < 1.5s | Lighthouse / RUM |
| **Bundle Size** | < 500 KB (gzip) | Webpack Analyzer |

### Business Metrics

| Metric | Target | Source |
|--------|--------|--------|
| **User Session Duration** | No regression | Google Analytics |
| **Task Completion Rate** | > 95% | User behavior tracking |
| **Bounce Rate** | < 40% | Google Analytics |
| **Support Tickets** | < 10% increase | Support system |

---

## Monitoring Dashboards

### Dashboard 1: React UI Health Overview

**URL:** `https://grafana.contoso.edu/d/react-ui-health`

**Panels:**
1. **Error Rate:** React vs Legacy comparison
2. **Latency Distribution:** P50, P95, P99 metrics
3. **Request Volume:** React vs Legacy split
4. **Feature Flag Status:** Current configuration

**Refresh Rate:** 30 seconds

---

### Dashboard 2: Canary Rollout Metrics

**URL:** `https://grafana.contoso.edu/d/canary-rollout`

**Panels:**
1. **Rollout Progress:** Current canary percentage
2. **Cohort Performance Comparison:** Metrics by cohort
3. **Go/No-Go Decision Matrix:** Traffic light indicators
4. **User Feedback:** NPS scores and comments

---

## Alerting Configuration

### Critical Alerts (PagerDuty)

#### Alert 1: High Error Rate

**Alert Name:** `ReactUI_HighErrorRate_Critical`  
**Severity:** Critical  
**Duration:** 5 minutes  
**Action:** Page on-call engineer, consider automatic rollback

#### Alert 2: High Latency

**Alert Name:** `ReactUI_HighLatency_Critical`  
**Severity:** Critical  
**Duration:** 10 minutes  
**Action:** Page on-call engineer

### Warning Alerts (Slack)

#### Alert 3: Elevated Error Rate

**Severity:** Warning  
**Duration:** 10 minutes  
**Action:** Send Slack notification to #engineering-alerts

---

## Communication Plan

### Stakeholder Communication Matrix

| Stakeholder Group | Channel | Frequency | Content |
|------------------|---------|-----------|---------|
| **Executive Leadership** | Email | Weekly | Progress, risks |
| **Product Team** | Slack | Daily | Metrics, feedback |
| **Engineering Team** | Slack | Real-time | Alerts, incidents |
| **Support Team** | Email | Before phase | Training, FAQs |
| **End Users** | In-app banner | During rollout | Feedback request |

### Communication Templates

#### Template 1: Pre-Phase Announcement

**Subject:** `[ContosoUniversity] Phase {N} Rollout Starting {Date}`

**Body:**
```
Hi Team,

We're starting Phase {N} of our React UI migration on {Date} at {Time}.

**What's Changing:**
- {X}% of users will see the new React UI for {Route}

**Rollout Schedule:**
- {Date} 09:00 AM: Enable feature flag
- {Date+7} 09:00 AM: Go/No-Go decision

**Monitoring:**
- Dashboard: https://grafana.contoso.edu/d/react-ui-health

**Rollback Plan:**
- Automated rollback if error rate > 5%
- Manual rollback available within 1 minute
```

---

## Guardrails & Safety Mechanisms

### 1. Circuit Breaker Pattern

**Purpose:** Automatically disable React UI if error threshold exceeded

### 2. Rate Limiting

**Purpose:** Prevent overwhelming backend during migration

**Configuration:**
- React UI: 100 requests/second
- Legacy UI: 200 requests/second

### 3. User Opt-Out Mechanism

**Purpose:** Allow users to revert to legacy UI

**UI Element:**
```html
<div class="ui-preference-banner">
  Prefer the classic interface? <a href="#">Switch back</a>
</div>
```

### 4. Database Connection Pool Management

**Purpose:** Prevent database overload during migration

**Pool Settings:**
- Min: 10 connections
- Max: 100 connections
- Timeout: 30 seconds

---

## Runbook Procedures

### Procedure 1: Enable Canary for New Phase

**When:** Beginning of each rollout phase  
**Who:** DevOps Engineer with Tech Lead approval  
**Duration:** 5 minutes

**Steps:**
1. **Pre-Flight Checks:** Verify staging healthy, feature flags accessible
2. **Update Feature Flag:** Set rollout percentage
3. **Verify Flag Propagation:** Wait 30 seconds, test
4. **Monitor Initial Traffic:** Watch error rate for 5 minutes
5. **Send Notification:** Post to Slack channel

---

### Procedure 2: Execute Emergency Rollback

**When:** Critical issue detected  
**Who:** On-call engineer (no approval needed for P0)  
**Duration:** 1-2 minutes

**Steps:**
1. **Disable Global Switch:** Via LaunchDarkly CLI or UI
2. **Verify Rollback:** Test that legacy UI is served
3. **Create Incident:** Create PagerDuty incident
4. **Send Notifications:** Alert stakeholders
5. **Preserve Logs:** Export logs for analysis

---

### Procedure 3: Investigate Performance Regression

**When:** Elevated latency alert triggered  
**Who:** On-call engineer  
**Duration:** 15-30 minutes

**Steps:**
1. **Confirm Alert:** Check current metrics
2. **Compare to Baseline:** Use Grafana dashboards
3. **Check Backend Performance:** API and database metrics
4. **Check Client-Side Performance:** Application Insights
5. **Check Resource Contention:** CPU, memory, connections
6. **Decision:** Monitor, schedule rollback, or immediate rollback

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **Strangler Fig Pattern** | Incremental migration strategy |
| **Feature Flag** | Configuration toggle for runtime control |
| **Canary Deployment** | Gradual rollout to subset of users |
| **Circuit Breaker** | Automatic failure detection mechanism |
| **RTO** | Recovery Time Objective |
| **RPO** | Recovery Point Objective |

### B. Related Documentation

- [Operational Runbook](../../Operational-Runbook.md) - Deployment procedures
- [Observability Playbook](../../Observability-Playbook.md) - Monitoring setup
- [CI/CD & DevEx](../../CI-CD-&-DevEx.md) - Build pipelines
- [Architecture Overview](../../Architecture-Overview.md) - System architecture

### C. Contact Information

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| **Migration Lead** | TBD | TBD | Business hours |
| **On-Call Engineer** | Rotation | PagerDuty | 24/7 |
| **Tech Lead** | TBD | TBD | Business hours |

**Escalation Path:**
1. On-Call Engineer (PagerDuty)
2. Tech Lead (Slack/Phone)
3. Engineering Director (Phone)

**Incident Slack Channels:**
- `#incident-response` - Active incidents
- `#migration-updates` - Migration progress
- `#engineering-alerts` - Automated alerts

### D. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Migration Team | Initial runbook creation |

---

**Document Status:** Draft  
**Next Review Date:** TBD  
**Approval Required From:** Tech Lead, Product Owner, Engineering Director

---

**End of Runbook**
