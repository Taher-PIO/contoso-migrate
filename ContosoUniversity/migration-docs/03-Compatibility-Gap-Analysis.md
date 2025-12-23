# Compatibility Gap Analysis

_Source inputs: 01-Architecture-Overview.md and available project metadata. 02-Technology-Inventory.md not present; assumptions for target stack documented per row._

| Area                           | Current Stack                                                               | Target Stack                                                                                                                             | Migration Strategy | Effort | Risk | Notes                                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Dependency Injection           | ASP.NET Core 6 default host builder with inline registrations in Program.cs | ASP.NET Core 8 unified host with modular IServiceCollection extensions and scoped DbContextFactory                                       | Adapter            | S      | L    | Promote feature-based service modules; introduce validation tooling (Scrutor) while retaining existing abstractions.                       |
| HTTP Server & Middleware       | Kestrel/IIS hosting for Razor Pages monolith using legacy Startup pattern   | ASP.NET Core 8 minimal hosting model with Kestrel behind reverse proxy (Azure App Service or container) and hardened middleware pipeline | Rewrite            | M      | M    | Rebuild Program.cs using minimal hosting, remove deprecated APIs, and add HTTPS redirection/HSTS defaults before containerization.         |
| ORM / Database                 | EF Core 6.0.2 with SQL Server 2019 LocalDB and synchronous seeding          | EF Core 8 with SQL Server 2022 or Azure SQL, async DbInitializer, DbContext pooling                                                      | Rewrite            | M      | M    | Update packages, address breaking changes (e.g., ExecuteUpdate), and validate migrations against new SQL edition; plan data backup parity. |
| Messaging & Integration        | None (synchronous workflow only)                                            | Event publishing via Azure Service Bus (or AWS SNS/SQS) for future async workloads; no baseline queue in v1                              | Shim               | S      | L    | Add domain events interface with no-op implementation now, enabling drop-in bus later without blocking release.                            |
| Configuration Management       | appsettings.json + environment JSON; no secrets provider                    | .NET Options pattern with environment overrides, user secrets for dev, Azure App Configuration + Key Vault for prod                      | Adapter            | M      | M    | Externalize secrets early and add configuration health checks; ensure rollback plan for outage of config service.                          |
| Authentication & Authorization | Unauthenticated application (public access)                                 | Microsoft Entra ID (Azure AD) or ASP.NET Core Identity with external provider; policy-based authorization                                | Rewrite            | L      | H    | Requires identity domain modelling, UI updates, and seed data reconciliation; verify FERPA/GDPR impacts before build.                      |
| Logging & Observability        | Default console/debug logging, no structured sink                           | Serilog (JSON) with Application Insights or OpenTelemetry exporters                                                                      | Adapter            | S      | L    | Introduce structured logging middleware and correlation IDs; retrofit Program.cs logging builder prior to production rollout.              |
| Testing                        | Minimal or no automated tests; manual validation only                       | xUnit + FluentAssertions for unit tests, Playwright for UI smoke, EF Core testcontainers for integration                                 | Rewrite            | M      | M    | Establish test harness early to protect refactors; prioritize Department concurrency, enrollment workflows, and seeding paths.             |
| Build & Deploy                 | .NET CLI/manual publishes; basic GitHub Actions (CodeQL, dotnet build)      | Multi-stage GitHub Actions with matrix builds, Docker images, staged deployments, IaC templates                                          | Rewrite            | M      | M    | Create Dockerfile (linux/aspnet:8.0), add environment promotion gates, and codify IaC (Bicep/Terraform) for repeatable infra.              |

## Quick Wins

- Logging uplift via Serilog adapter and correlation IDs.
- DI modularization with Scrutor validation and scoped DbContextFactory.
- Messaging shim delivering domain events interface without external dependency.

## Blockers

- Authentication design and data model alignment pending compliance sign-off.
- Database upgrade requires end-to-end migration rehearsal on SQL Server 2022/Azure SQL.
- Deployment modernization depends on target hosting decision (App Service vs container platform).

## Required Spikes

- Identity provider selection spike comparing Entra ID vs self-hosted Identity.
- EF Core 8 upgrade spike to catalogue breaking changes and data migration risks.
- DevOps spike to prototype containerized build in GitHub Actions with IaC integration.
