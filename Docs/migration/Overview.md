# Contoso.sln – Migration Overview to .NET 8

This document outlines the strategy and plan for migrating the Contoso solution from .NET Framework 4.7.2 to .NET 8.

## A. System Summary

The `Contoso.sln` solution is a traditional N-Tier application built on the .NET Framework 4.7.2.

- **Solution Structure**: The solution consists of four projects following a classic layered architecture.
- **Project List**:
  - `Contoso.Entities`: Class library (POCOs).
  - `Contoso.Data`: Class library for data access using Entity Framework 6.
  - `Contoso.Services`: Class library for business logic.
  - `Contoso.Web`: The main web application.
- **Application Models**:
  - **Web:** `Contoso.Web` is an ASP.NET application hosting both **MVC 5** controllers for UI and **Web API 2** controllers for a RESTful API.
  - **Libraries:** `Contoso.Entities`, `Contoso.Data`, and `Contoso.Services` are standard .NET Framework class libraries.

## B. Target Architecture

The migration will adopt a modern, modular architecture using .NET 8.

- **Phased Migration with Strangler Fig**: We will use the Strangler Fig pattern. A new **ASP.NET Core 8 Façade** will be created. This façade will initially proxy requests to the existing .NET Framework application using YARP (Yet Another Reverse Proxy). New features will be built in .NET 8, and existing endpoints will be migrated incrementally from the old application to the new one.
- **SDK-Style Projects**: All projects will be converted to the SDK-style format (`.csproj`), which simplifies dependency management and multi-targeting.
- **Entity Framework Strategy**: The `Contoso.Data` project uses EF6. We will migrate it to run on .NET 8 using the **EF6 on .NET Core** strategy first. A future migration to EF Core 8 can be planned as a separate initiative post-migration to minimize risk.

## C. Phase Plan

The migration will be executed in distinct phases:

1.  **Phase 1: Discovery & Setup**:
    - Run the .NET Upgrade Assistant to analyze dependencies and identify breaking changes.
    - Set up the new ASP.NET Core 8 Façade project with YARP.
    - Establish CI/CD pipelines for the new solution.
2.  **Phase 2: Library Migration**:
    - Convert `Contoso.Entities`, `Contoso.Data`, and `Contoso.Services` to .NET Standard 2.0 to allow them to be referenced by both the .NET Framework web app and the new .NET 8 façade.
    - Update NuGet packages to compatible versions.
3.  **Phase 3: Data Access Migration**:
    - Ensure `Contoso.Data` (using EF6) functions correctly under .NET Standard. This involves managing `System.Configuration` dependencies for connection strings.
4.  **Phase 4: Web Migration (Incremental)**:
    - Identify a small, low-risk API endpoint in `Contoso.Web`.
    - Re-implement that endpoint in the new ASP.NET Core 8 Façade.
    - Update the YARP configuration to route traffic for that specific endpoint to the new implementation.
    - Repeat this process for all MVC routes and Web API endpoints.
5.  **Phase 5: Cross-Cutting Concerns**:
    - **Configuration**: Migrate settings from `Web.config` (`appSettings`, `connectionStrings`) to `appsettings.json`.
    - **Dependency Injection**: Replace Unity with the built-in `Microsoft.Extensions.DependencyInjection`.
    - **Logging**: Replace log4net with `Microsoft.Extensions.Logging` and a suitable provider (e.g., Serilog).
6.  **Phase 6: Testing**:
    - Execute all unit and integration tests against the migrated code.
    - Perform performance and load testing to compare against the baseline.
    - Conduct end-to-end testing through the YARP proxy.
7.  **Phase 7: CI/CD & Deployment**:
    - Update build and release pipelines to deploy the new ASP.NET Core application alongside the legacy application.
    - Gradually shift traffic using the proxy until the legacy application is fully decommissioned.
8.  **Phase 8: Cutover**:
    - Once all endpoints are migrated, decommission the legacy `Contoso.Web` application and the YARP proxy configuration. The new application now handles all traffic directly.

## D. Dependency Map

- **Core NuGet Packages**:
  - `EntityFramework` (v6.4.4): High impact. Will be used on .NET 8.
  - `Microsoft.AspNet.Mvc` / `Microsoft.AspNet.WebApi`: High impact. Will be replaced by ASP.NET Core frameworks.
  - `Newtonsoft.Json`: Low impact. Supported in .NET 8, but `System.Text.Json` is preferred for new code.
- **Third-Party Libraries**:
  - `Unity` (DI): Medium impact. Needs to be replaced with `Microsoft.Extensions.DependencyInjection`.
  - `log4net`: Medium impact. Needs to be replaced with a modern logging framework like Serilog or the built-in logger.
- **Windows-Specific APIs**:
  - `System.Web`: High risk. This is the primary dependency for ASP.NET on .NET Framework. All usage must be refactored to use `Microsoft.AspNetCore.*` equivalents. This is the core of the web migration effort.

## E. Config Map (`web.config` → `appsettings.json`)

| Category               | `Web.config` Source            | .NET 8 Target (`appsettings.json`)     | Notes                                                          |
| :--------------------- | :----------------------------- | :------------------------------------- | :------------------------------------------------------------- |
| **Connection Strings** | `<connectionStrings>`          | `"ConnectionStrings": { ... }`         | Use the `IConfiguration` service to access.                    |
| **App Settings**       | `<appSettings>`                | `"AppSettings": { ... }` or root-level | Use the `IConfiguration` service.                              |
| **Authentication**     | `<authentication mode="..."/>` | Middleware in `Program.cs`             | e.g., `builder.Services.AddAuthentication(...).AddCookie(...)` |
| **Logging**            | `<log4net>` section            | `Serilog` or other provider config     | Configuration via code or `appsettings.json`.                  |
| **DI Container**       | `Unity.config` / code          | `Program.cs`                           | Register services with `builder.Services`.                     |

## F. Testing & Quality Gates

- **Unit & Integration Tests**: All existing tests must be ported to a .NET 8 test project (e.g., using MSTest, NUnit, or xUnit). New tests should be written for all new and refactored code.
- **Platform Compatibility**: Use the .NET Upgrade Assistant and `ApiPort` tool to check for platform-incompatible APIs early.
- **Performance Baseline**: Before migration, capture performance metrics (response time, CPU/memory usage) for key endpoints under load. These will be the quality gates for the migrated endpoints.
- **End-to-End (E2E) Testing**: Automated E2E tests should be run against the application through the YARP proxy to ensure seamless user experience during the incremental migration.

## G. CI/CD Summary

A GitHub Actions workflow will be created to support the migration.

- **Trigger**: On push to `main` or pull request.
- **Jobs**:
  1.  **Build**:
      - Restore NuGet packages.
      - Build the .NET 8 solution.
  2.  **Test**:
      - Run all unit and integration tests.
  3.  **Publish**:
      - Publish the ASP.NET Core 8 application artifacts.
  4.  **Deploy (Optional)**:
      - Deploy to a staging environment for manual verification.

## H. Risks & Rollback

A detailed risk register will be maintained in `/Docs/migration/Risks.md`.

| Top 5 Risks                    | Mitigation Strategy                                                                                                                       |
| :----------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Incompatible Dependencies   | Use the .NET Upgrade Assistant for analysis. Find modern replacements or alternatives.                                                    |
| 2. Performance Degradation     | Establish a performance baseline pre-migration. Load test each migrated component against the baseline.                                   |
| 3. Hidden `System.Web` Usages  | Code analysis and runtime testing are critical. `HttpContext.Current` is a major culprit.                                                 |
| 4. Data Migration Issues (EF6) | Test EF6 on .NET 8 thoroughly in a development environment before migrating any production data paths.                                    |
| 5. Extended Project Timeline   | Use the Strangler Fig pattern to deliver value incrementally and avoid a "big bang" release. Keep the scope of each migration step small. |

**Rollback Strategy**: The Strangler Fig pattern provides a natural rollback mechanism. If a migrated endpoint in the .NET 8 application fails, the YARP routing rule can be instantly reverted to proxy the request back to the stable .NET Framework application, minimizing downtime.

## I. Glossary + References

- **.NET Upgrade Assistant**: A Microsoft tool to help automate parts of the migration process.
- **SDK-Style Project**: The modern, simplified `.csproj` format.
- **Strangler Fig Pattern**: An architectural pattern for incrementally replacing parts of a legacy system.
- **YARP**: Yet Another Reverse Proxy. A library from Microsoft to build flexible proxy servers.
- **References**:
  - [Overview of the .NET Upgrade Assistant](https://learn.microsoft.com/en-us/dotnet/core/porting/upgrade-assistant-overview)
  - [Strangler Fig Application Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig)
  - [YARP Documentation](https://microsoft.github.io/reverse-proxy/)
  - [Migrate from ASP.NET to ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/migration/proper-to-2x/)
