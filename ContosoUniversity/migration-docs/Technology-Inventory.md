Generated on: 2025-12-23

| Component                                            | Version          | Purpose                                       | License                          | EOL date                   | Replacement (target)                       |
| ---------------------------------------------------- | ---------------- | --------------------------------------------- | -------------------------------- | -------------------------- | ------------------------------------------ |
| .NET SDK/Runtime                                     | 6.0.x            | Hosts ASP.NET Core Razor Pages app            | MIT                              | 2024-11-12 (ended)         | Upgrade to .NET 8.0 LTS                    |
| Microsoft.AspNetCore.Diagnostics.EntityFrameworkCore | 6.0.2            | Surfacing EF Core errors during development   | MIT                              | 2024-11-12 (tracks .NET 6) | Use 8.0.x package after runtime uplift     |
| Microsoft.EntityFrameworkCore.SqlServer              | 6.0.2            | SQL Server provider for Entity Framework Core | MIT                              | 2024-11-12 (tracks .NET 6) | Upgrade to 8.0.x provider                  |
| Microsoft.EntityFrameworkCore.Tools                  | 6.0.2            | EF Core CLI tooling for migrations            | MIT                              | 2024-11-12 (tracks .NET 6) | Upgrade to matching 8.0.x tooling          |
| Microsoft.VisualStudio.Web.CodeGeneration.Design     | 6.0.2            | Scaffolding support for ASP.NET Core          | MIT                              | 2024-11-12 (tracks .NET 6) | Upgrade to 8.0.x design package            |
| GitHub Action actions/checkout                       | v2               | CI checkout step                              | MIT                              | TBD                        | Update to actions/checkout@v4              |
| GitHub Action actions/setup-dotnet                   | v1               | Installs .NET SDK in CI                       | MIT                              | TBD                        | Update to actions/setup-dotnet@v4          |
| GitHub Action actions/download-artifact              | v2.0.8           | Fetches build artifacts in CI                 | MIT                              | TBD                        | Update to actions/download-artifact@v4     |
| GitHub Action actions/upload-artifact                | v3.0.0           | Publishes build artifacts in CI               | MIT                              | TBD                        | Update to actions/upload-artifact@v4       |
| GitHub Action azure/login                            | v1               | Authenticates CI with Azure                   | MIT                              | TBD                        | Update to azure/login@v2                   |
| GitHub Action azure/webapps-deploy                   | v2               | Deploys build to Azure App Service            | MIT                              | TBD                        | Track latest v3 release                    |
| GitHub Action github/codeql-action                   | v1               | Static analysis (CodeQL)                      | MIT                              | TBD                        | Upgrade to github/codeql-action@v3         |
| GitHub-Hosted Runner                                 | ubuntu-latest    | CI execution environment                      | Ubuntu Pro 22.04 LTS (canonical) | 2027-04 (Ubuntu 22.04)     | Monitor GitHub runner OS announcements     |
| Azure CLI                                            | Latest on runner | Used for slot swap and logout                 | MIT                              | TBD                        | Ensure compatibility with target runtime   |
| Azure App Service (slots: staging/prod)              | Unspecified      | Production hosting target                     | Proprietary                      | TBD                        | Confirm plan/OS; align with runtime uplift |

**Observations**

- The entire stack depends on .NET 6 LTS, which reached end of support in November 2024. Plan a coordinated migration to .NET 8 LTS across runtime, packages, and build pipelines.
- All NuGet dependencies inherit .NET 6 servicing cadence; upgrading the runtime will cover them.
- GitHub Actions workflows currently pin older major versions; upstream maintains newer majors with security and performance fixes.

**Runtime & Operating System**

- Application targets ASP.NET Core Razor Pages running on .NET 6; no containerization detected.
- CI/CD executes on GitHub-hosted Ubuntu runners; production deploys to Azure App Service slots (language runtime/OS details not committed—confirm in Azure portal).

**Build Toolchain & CI**

- Builds use the .NET CLI (`dotnet restore/build/test/publish`) via GitHub Actions. Azure CLI orchestrates slot swaps.
- Code scanning relies on GitHub CodeQL via shared config covering C# and JavaScript.

**Containers & Infrastructure as Code**

- No Dockerfiles, Terraform, Bicep, or Helm charts present in repository.

**Outstanding Data Gaps**

- Licenses for Azure Platform services follow Microsoft terms; specific plan details and EOL timelines require confirmation.
- No lockfiles are present; third-party transitive dependencies and their licenses remain TBD until capture via `dotnet list package --include-transitive` or SBOM tooling.
- Runtime OS for Azure App Service slot is unspecified in source; validate to ensure compatibility post-upgrade.
