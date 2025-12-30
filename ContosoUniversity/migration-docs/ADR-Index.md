# Architecture Decision Records - Index

**Document Version:** 1.0  
**Last Updated:** 2025-12-30  
**Purpose:** Centralized index of all architecture decisions made during the ContosoUniversity migration project

---

## About This Index

This document tracks all Architecture Decision Records (ADRs) for the ContosoUniversity migration project. Each entry captures a key technical decision, its status, rationale, and source documentation.

**Status Definitions:**
- **Accepted** - Decision approved and implemented
- **Proposed** - Decision under consideration
- **Superseded** - Decision replaced by a newer one
- **Deprecated** - Decision no longer relevant

---

## Architecture Decisions

### ADR-001: Monolithic Architecture Pattern
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Maintain monolithic architecture (ASP.NET Core Razor Pages) rather than decompose into microservices
- **Rationale:** Application domain is cohesive; complexity of microservices not justified for educational management system
- **Source:** [01-Architecture-Overview.md](./01-Architecture-Overview.md)
- **Impact:** Simplified deployment, strong consistency, easier development

### ADR-002: Target Framework - .NET 8 LTS
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Migrate from .NET 6 (EOL Nov 2024) to .NET 8 LTS (supported until Nov 2026)
- **Rationale:** .NET 6 is out of support; .NET 8 provides LTS stability and performance improvements
- **Source:** [00-Project-Overview.md](./00-Project-Overview.md), [Technology-Inventory.md](./Technology-Inventory.md)
- **Impact:** Security updates, performance gains, modern language features

### ADR-003: Database Platform - SQL Server
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Continue using SQL Server (upgrade from LocalDB to SQL Server 2022 or Azure SQL Database)
- **Rationale:** Maintain SQL Server compatibility for production; leverage existing EF Core migrations
- **Source:** [01-Architecture-Overview.md](./01-Architecture-Overview.md), [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md)
- **Impact:** Strong ACID consistency, mature tooling, migration path compatibility

### ADR-004: ORM Strategy - Entity Framework Core 8
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Upgrade from EF Core 6.0.2 to EF Core 8 with async operations and DbContext pooling
- **Rationale:** Aligns with .NET 8 upgrade; improved performance and new features
- **Source:** [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md)
- **Impact:** Breaking changes require validation; performance optimization opportunities

### ADR-005: Configuration Management - Azure App Configuration + Key Vault
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Externalize configuration using .NET Options pattern with Azure App Configuration and Key Vault for production secrets
- **Rationale:** Centralized configuration management; secure secret storage; environment-specific overrides
- **Source:** [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md)
- **Impact:** Improved security; requires infrastructure setup; enables dynamic configuration

### ADR-006: Authentication Strategy - Microsoft Entra ID (Azure AD)
- **Status:** Proposed
- **Date:** 2025-12-22
- **Decision:** Implement Microsoft Entra ID or ASP.NET Core Identity with external provider for authentication
- **Rationale:** Current application is unauthenticated (critical security risk); need role-based access control
- **Source:** [00-Project-Overview.md](./00-Project-Overview.md), [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md)
- **Impact:** Major effort (Large); requires identity domain modeling and UI updates; FERPA/GDPR compliance

### ADR-007: Logging Strategy - Structured Logging with Serilog
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Implement Serilog with JSON formatting and Application Insights or OpenTelemetry exporters
- **Rationale:** Current console logging insufficient; need structured logs with correlation IDs for production diagnostics
- **Source:** [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md), [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md)
- **Impact:** Quick win; improved observability; minimal code changes

### ADR-008: Testing Framework - xUnit + FluentAssertions
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Establish test harness using xUnit, FluentAssertions, and Playwright for UI smoke tests
- **Rationale:** No automated tests currently exist; need protection during refactoring; industry-standard frameworks
- **Source:** [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md)
- **Impact:** Medium effort; enables safe refactoring; test containers for integration tests

### ADR-009: Build & Deployment - Multi-stage GitHub Actions with Docker
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Modernize CI/CD with multi-stage GitHub Actions, Docker images (linux/aspnet:8.0), and IaC templates
- **Rationale:** Current builds are manual; need repeatable deployments with environment promotion gates
- **Source:** [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md), [Technology-Inventory.md](./Technology-Inventory.md)
- **Impact:** Medium effort; containerization enables consistent deployments; requires IaC (Bicep/Terraform)

### ADR-010: Hosting Platform - Azure App Service
- **Status:** Proposed
- **Date:** 2025-12-22
- **Decision:** Deploy to Azure App Service with staging slots (alternative: Container Apps)
- **Rationale:** Existing deployment targets Azure; managed platform reduces operational overhead
- **Source:** [00-Project-Overview.md](./00-Project-Overview.md), [Technology-Inventory.md](./Technology-Inventory.md)
- **Impact:** Vendor lock-in considerations; evaluate Container Apps for containerized workloads

### ADR-011: Consistency Model - Strong ACID Consistency
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Maintain strong ACID consistency using SQL Server transactions via Entity Framework Core
- **Rationale:** Educational domain requires reliable data integrity; single database simplifies transaction model
- **Source:** [01-Architecture-Overview.md](./01-Architecture-Overview.md)
- **Impact:** No distributed transactions needed; simple transaction boundaries; appropriate for domain

### ADR-012: Concurrency Control - Optimistic Locking
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Use optimistic concurrency control with row version tokens for critical entities (Department)
- **Rationale:** Low contention expected; user-friendly conflict resolution; prevents lost updates
- **Source:** [01-Architecture-Overview.md](./01-Architecture-Overview.md), [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md)
- **Impact:** Implemented on Department entity; field-by-field conflict resolution UI

### ADR-013: Pagination Strategy - Custom PaginatedList Implementation
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Continue using custom PaginatedList<T> class with query string parameters (pageIndex, pageSize)
- **Rationale:** Simple, effective implementation; preserves sort and search state; configurable page size
- **Source:** [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md)
- **Impact:** Consistent user experience; no external dependencies; easy to maintain

### ADR-014: Messaging Strategy - Event Publishing Shim
- **Status:** Proposed
- **Date:** 2025-12-22
- **Decision:** Add domain events interface with no-op implementation; enable future Azure Service Bus integration
- **Rationale:** No immediate async workflow needs; prepare for future event-driven patterns without blocking v1
- **Source:** [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md)
- **Impact:** Quick win; enables drop-in message bus later; low risk

### ADR-015: Dependency Injection - Modular Service Extensions
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Refactor DI registrations into feature-based service modules with Scrutor validation
- **Rationale:** Current inline Program.cs registrations lack organization; improve testability and maintainability
- **Source:** [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md)
- **Impact:** Small effort; better code organization; scoped DbContextFactory for performance

### ADR-016: API Versioning - URL-Based Versioning
- **Status:** Proposed
- **Date:** 2025-12-23
- **Decision:** If REST API layer is added, use URL-based versioning (/api/v1/, /api/v2/)
- **Rationale:** Clear versioning strategy; backward compatibility support; standard practice
- **Source:** [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md)
- **Impact:** No immediate impact (Razor Pages only); enables future API evolution

### ADR-017: Error Handling - Environment-Specific Exception Pages
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Use Developer Exception Page for development; generic error page with Request ID for production
- **Rationale:** Security best practice; detailed diagnostics in dev; no information leakage in production
- **Source:** [01-Architecture-Overview.md](./01-Architecture-Overview.md), [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md)
- **Impact:** Implemented; includes special handling for concurrency conflicts

### ADR-018: Static Asset Strategy - Server-Rendered with CDN Future
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Continue serving static assets from /wwwroot; plan future CDN migration
- **Rationale:** Simple deployment; adequate for current scale; CDN deferred to optimization phase
- **Source:** [01-Architecture-Overview.md](./01-Architecture-Overview.md), [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md)
- **Impact:** No immediate changes; future CDN integration for performance

### ADR-019: Monitoring & Observability - Application Insights
- **Status:** Proposed
- **Date:** 2025-12-23
- **Decision:** Integrate Application Insights for telemetry, metrics, and distributed tracing
- **Rationale:** No current monitoring; need visibility into production performance and errors
- **Source:** [05-API-&-Service-Contracts.md](./05-API-&-Service-Contracts.md)
- **Impact:** Enables proactive monitoring; dashboard creation; alerting on critical metrics

### ADR-020: Security Compliance - OWASP Top 10 Mitigation
- **Status:** Accepted
- **Date:** 2025-12-22
- **Decision:** Follow OWASP Top 10 mitigation strategies; implement dependency scanning (CodeQL)
- **Rationale:** Security baseline requirement; address vulnerabilities in outdated dependencies
- **Source:** [00-Project-Overview.md](./00-Project-Overview.md)
- **Impact:** GitHub Actions already includes CodeQL; audit process required

---

## Decision Categories

### Quick Wins (Small Effort, Low Risk)
- ADR-007: Structured Logging with Serilog
- ADR-014: Event Publishing Shim
- ADR-015: DI Modularization

### Medium Priority (Medium Effort, Medium Risk)
- ADR-004: EF Core 8 Upgrade
- ADR-005: Configuration Management
- ADR-008: Testing Framework
- ADR-009: Build & Deployment Modernization

### High Priority (Large Effort, High Risk)
- ADR-002: .NET 8 LTS Migration (blocks other upgrades)
- ADR-006: Authentication Implementation (critical security gap)

### Future Considerations (Deferred)
- ADR-016: API Versioning (if REST API needed)
- ADR-018: CDN Migration (optimization phase)
- ADR-019: Application Insights (post-deployment)

---

## Pending Decisions

### High Priority
1. **Authentication Provider Selection** - Microsoft Entra ID vs. self-hosted Identity (requires compliance review)
2. **Hosting Platform Confirmation** - Azure App Service vs. Container Apps (cost/functionality trade-off)
3. **Database Upgrade Path** - SQL Server 2022 on-premises vs. Azure SQL Database (operational model)

### Medium Priority
4. **Secrets Management Solution** - Azure Key Vault, HashiCorp Vault, or other
5. **IaC Tooling** - Terraform vs. Bicep vs. ARM templates
6. **Caching Strategy** - Redis, in-memory, or distributed cache (Phase 6+)

### Low Priority
7. **API Layer Addition** - REST API for future mobile support
8. **GraphQL Gateway** - For complex query scenarios (optional)
9. **gRPC Services** - For inter-service communication (if microservices considered)

---

## Decision Process

**How to Add a New ADR:**

1. Create a new entry in the Architecture Decisions section
2. Assign the next sequential ADR number
3. Include: Status, Date, Decision, Rationale, Source, Impact
4. Add to appropriate Decision Category
5. Update Pending Decisions if applicable
6. Link to detailed documentation in migration-docs/

**Decision Status Transitions:**
- Proposed → Accepted (after stakeholder approval)
- Proposed → Deprecated (if decision is abandoned)
- Accepted → Superseded (when replaced by newer decision)

---

## Related Documentation

| Document | Purpose | Link |
|----------|---------|------|
| 00-Project-Overview.md | Migration project context and phases | [View](./00-Project-Overview.md) |
| 01-Architecture-Overview.md | System architecture and C4 diagrams | [View](./01-Architecture-Overview.md) |
| 03-Compatibility-Gap-Analysis.md | Technology stack migration strategy | [View](./03-Compatibility-Gap-Analysis.md) |
| 05-API-&-Service-Contracts.md | Endpoint inventory and API design | [View](./05-API-&-Service-Contracts.md) |
| Technology-Inventory.md | Component versions and dependencies | [View](./Technology-Inventory.md) |
| Data-Model-Catalog.md | Entity relationships and schema | [View](./Data-Model-Catalog.md) |

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Migration Engineering Team | Initial ADR index with 20 decisions extracted from migration docs |

---

_This document is maintained as the single source of truth for all architecture decisions. Review and update during each phase of the migration project._
